#!/usr/bin/env node

/**
 * Process Final Research Files
 * Processes the remaining 5 high-value research files and adds companies to database
 */

const { Client } = require('@notionhq/client');
const fs = require('fs').promises;

// Notion credentials
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

if (!NOTION_TOKEN || !NOTION_DATABASE_ID) {
    console.error('❌ Missing required environment variables: NOTION_TOKEN and NOTION_DATABASE_ID');
    console.error('Please set these environment variables before running this script.');
    process.exit(1);
}

class FinalResearchProcessor {
    constructor() {
        this.notion = new Client({ auth: NOTION_TOKEN });
        this.databaseId = NOTION_DATABASE_ID;
        this.results = {
            filesProcessed: 0,
            companiesExtracted: 0,
            companiesAdded: 0,
            companiesSkipped: 0,
            errors: [],
            additions: []
        };
        this.existingCompanies = new Set();
        this.confidenceThreshold = 0.8;
    }

    async processFinalResearch() {
        console.log('📋 Processing final research files...');
        
        // Load existing companies to avoid duplicates
        await this.loadExistingCompanies();
        
        // Process each file
        const filesToProcess = [
            'data/research/advanced-ecosystem-intelligence-2025-07-29.md',
            'data/research/linkedin-research-comprehensive-2025-07-29.md', 
            'data/research/2025_FOUNDED_COMPANIES_ANALYSIS.md',
            'data/research/2019_FOUNDED_BC_TECH_COMPANIES_REPORT.md',
            'data/research/2025_FOUNDED_COMPANIES_DATABASE_ADDITIONS.md'
        ];
        
        for (const filePath of filesToProcess) {
            await this.processFile(filePath);
        }
        
        // Save results
        await this.saveResults();
        
        console.log('✅ Final research processing complete!');
        return this.results;
    }

    async loadExistingCompanies() {
        console.log('📊 Loading existing companies to avoid duplicates...');
        
        let hasMore = true;
        let startCursor = undefined;
        let count = 0;
        
        while (hasMore) {
            try {
                const response = await this.notion.databases.query({
                    database_id: this.databaseId,
                    start_cursor: startCursor,
                    page_size: 100
                });
                
                response.results.forEach(page => {
                    const name = this.getCompanyName(page);
                    if (name) {
                        this.existingCompanies.add(this.normalizeName(name));
                        count++;
                    }
                });
                
                hasMore = response.has_more;
                startCursor = response.next_cursor;
                
            } catch (error) {
                console.error('❌ Error loading existing companies:', error.message);
                break;
            }
        }
        
        console.log(`✅ Loaded ${count} existing companies for duplicate checking`);
    }

    async processFile(filePath) {
        try {
            console.log(`\n📄 Processing: ${filePath}`);
            
            const content = await fs.readFile(filePath, 'utf8');
            const companies = this.extractCompaniesFromContent(content, filePath);
            
            console.log(`   Found ${companies.length} companies`);
            
            for (const company of companies) {
                await this.processCompany(company);
            }
            
            this.results.filesProcessed++;
            this.results.companiesExtracted += companies.length;
            
        } catch (error) {
            console.error(`❌ Error processing ${filePath}:`, error.message);
            this.results.errors.push({
                file: filePath,
                error: error.message
            });
        }
    }

    extractCompaniesFromContent(content, filePath) {
        const companies = [];
        const lines = content.split('\n');
        
        let currentCompany = null;
        let inCompanySection = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Detect company entries
            const companyMatch = this.detectCompanyEntry(line);
            
            if (companyMatch) {
                // Save previous company
                if (currentCompany) {
                    companies.push(this.finalizeCompany(currentCompany, filePath));
                }
                
                // Start new company
                currentCompany = {
                    name: companyMatch.name,
                    source: filePath,
                    confidence: 0.8,
                    extractedData: {}
                };
                inCompanySection = true;
                
                // Look ahead for details
                this.extractImmediateDetails(lines, i, currentCompany);
                
            } else if (inCompanySection && currentCompany) {
                this.extractDataFromLine(line, currentCompany);
                
                if (this.isEndOfCompanySection(line)) {
                    inCompanySection = false;
                }
            }
        }
        
        // Don't forget the last company
        if (currentCompany) {
            companies.push(this.finalizeCompany(currentCompany, filePath));
        }
        
        return companies;
    }

    detectCompanyEntry(line) {
        // Pattern 1: Numbered list
        let match = line.match(/^\d+\.\s*\*\*([^*]+)\*\*/);
        if (match) return { name: match[1].trim(), type: 'numbered' };
        
        // Pattern 2: Bullet with company name
        match = line.match(/^[-*]\s*\*\*([^*]+)\*\*/);
        if (match) return { name: match[1].trim(), type: 'bullet' };
        
        // Pattern 3: Heading
        match = line.match(/^#{2,4}\s*(.+?)$/);
        if (match && !match[1].includes('Analysis') && !match[1].includes('Summary')) {
            return { name: match[1].trim(), type: 'heading' };
        }
        
        // Pattern 4: Simple bold
        match = line.match(/^\*\*([^*]+)\*\*\s*$/);
        if (match && match[1].length > 3 && match[1].length < 50) {
            return { name: match[1].trim(), type: 'bold' };
        }
        
        return null;
    }

    extractImmediateDetails(lines, startIndex, company) {
        for (let i = startIndex + 1; i < Math.min(startIndex + 5, lines.length); i++) {
            const line = lines[i].trim();
            if (!line || this.detectCompanyEntry(line)) break;
            this.extractDataFromLine(line, company);
        }
    }

    extractDataFromLine(line, company) {
        // Website
        const websiteMatch = line.match(/(https?:\/\/[^\s,)]+)/);
        if (websiteMatch) {
            company.extractedData.website = websiteMatch[1];
        }
        
        // Founded year
        const foundedMatch = line.match(/(?:founded|established):\s*(\d{4})/i) || 
                           line.match(/\((\d{4})\)/);
        if (foundedMatch) {
            company.extractedData.founded = parseInt(foundedMatch[1]);
        }
        
        // Funding
        const fundingMatch = line.match(/\$([0-9.]+[MBK]?\+?)\s*(?:raised|funding|series)/i);
        if (fundingMatch) {
            company.extractedData.funding = '$' + fundingMatch[1];
        }
        
        // Location
        const locationMatch = line.match(/(?:Vancouver|Victoria|BC|British Columbia)/i);
        if (locationMatch) {
            company.extractedData.location = locationMatch[0];
        }
    }

    isEndOfCompanySection(line) {
        return line.startsWith('#') || line.match(/^\d+\./) || line.startsWith('---');
    }

    finalizeCompany(company, filePath) {
        // Increase confidence based on data richness
        if (company.extractedData.website) company.confidence += 0.1;
        if (company.extractedData.founded) company.confidence += 0.05;
        if (company.extractedData.funding) company.confidence += 0.1;
        
        company.confidence = Math.min(0.95, company.confidence);
        company.extractedAt = new Date().toISOString();
        
        return company;
    }

    async processCompany(company) {
        const normalizedName = this.normalizeName(company.name);
        
        // Check if already exists
        if (this.existingCompanies.has(normalizedName)) {
            this.results.companiesSkipped++;
            return;
        }
        
        // Check confidence threshold
        if (company.confidence < this.confidenceThreshold) {
            this.results.companiesSkipped++;
            return;
        }
        
        // Filter out non-companies
        if (this.isNotCompany(company.name)) {
            this.results.companiesSkipped++;
            return;
        }
        
        try {
            await this.addCompanyToDatabase(company);
            this.results.companiesAdded++;
            
        } catch (error) {
            console.error(`   ❌ Error adding ${company.name}:`, error.message);
            this.results.errors.push({
                company: company.name,
                error: error.message
            });
            this.results.companiesSkipped++;
        }
    }

    isNotCompany(name) {
        const nonCompanyIndicators = [
            'analysis', 'summary', 'report', 'overview', 'section',
            'companies', 'organizations', 'findings', 'insights',
            'government', 'ministry', 'department', 'program'
        ];
        
        const nameLower = name.toLowerCase();
        return nonCompanyIndicators.some(indicator => nameLower.includes(indicator));
    }

    async addCompanyToDatabase(company) {
        const properties = {
            Name: { title: [{ text: { content: company.name } }] }
        };
        
        // Add extracted data
        const extracted = company.extractedData;
        
        if (extracted.website) {
            properties.Website = { url: extracted.website };
        }
        
        if (extracted.founded) {
            properties['Year Founded'] = { number: extracted.founded };
        }
        
        if (extracted.funding) {
            properties.Funding = { rich_text: [{ text: { content: extracted.funding } }] };
        }
        
        if (extracted.location) {
            const region = this.mapLocationToRegion(extracted.location);
            if (region) {
                properties['BC Region'] = { select: { name: region } };
            }
        }
        
        // Add metadata
        properties['Data Source'] = { select: { name: 'Final Research' } };
        properties['Date Added'] = { date: { start: new Date().toISOString().split('T')[0] } };
        
        const result = await this.notion.pages.create({
            parent: { database_id: this.databaseId },
            properties: properties
        });
        
        console.log(`   ✅ Added: ${company.name}`);
        
        // Add to existing companies set
        this.existingCompanies.add(this.normalizeName(company.name));
        
        this.results.additions.push({
            name: company.name,
            id: result.id,
            confidence: company.confidence,
            source: company.source
        });
    }

    mapLocationToRegion(location) {
        const locationLower = location.toLowerCase();
        if (locationLower.includes('vancouver')) return 'Lower Mainland';
        if (locationLower.includes('victoria')) return 'Vancouver Island';
        if (locationLower.includes('bc')) return 'Other BC';
        return null;
    }

    getCompanyName(company) {
        const nameProperty = company.properties.Name;
        if (nameProperty && nameProperty.title && nameProperty.title[0]) {
            return nameProperty.title[0].text.content;
        }
        return null;
    }

    normalizeName(name) {
        return name.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, ' ')
            .replace(/\b(inc|ltd|llc|corp|corporation|company|co|technologies|tech|systems|ai|labs|lab)\b/g, '')
            .trim();
    }

    async saveResults() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        const resultsPath = `data/reports/final-research-processing-${timestamp}.json`;
        await fs.writeFile(resultsPath, JSON.stringify(this.results, null, 2));
        
        const summaryReport = this.generateSummaryReport();
        const summaryPath = `data/reports/final-research-summary-${timestamp}.md`;
        await fs.writeFile(summaryPath, summaryReport);
        
        console.log(`📊 Results saved to: ${resultsPath}`);
        console.log(`📋 Summary saved to: ${summaryPath}`);
    }

    generateSummaryReport() {
        return `# Final Research Processing Summary

## 📊 **Processing Statistics**
- **Files Processed**: ${this.results.filesProcessed}/5
- **Companies Extracted**: ${this.results.companiesExtracted}
- **Companies Added**: ${this.results.companiesAdded}
- **Companies Skipped**: ${this.results.companiesSkipped}
- **Errors**: ${this.results.errors.length}

## ✅ **Successfully Added Companies**
${this.results.additions.map((addition, index) => 
    `${index + 1}. **${addition.name}** (${(addition.confidence * 100).toFixed(0)}% confidence)`
).join('\n')}

## 📈 **Impact**
- **Database Growth**: +${this.results.companiesAdded} companies
- **Total Database**: ~${949 + this.results.companiesAdded} companies
- **Progress to 1,000**: ${((949 + this.results.companiesAdded) / 1000 * 100).toFixed(1)}%

**Final research processing completed successfully! ✅**`;
    }

    async run() {
        try {
            const results = await this.processFinalResearch();
            
            console.log('\n📋 FINAL RESEARCH PROCESSING SUMMARY:');
            console.log(`✅ Files Processed: ${results.filesProcessed}/5`);
            console.log(`🏢 Companies Added: ${results.companiesAdded}`);
            console.log(`⏭️  Companies Skipped: ${results.companiesSkipped}`);
            console.log(`❌ Errors: ${results.errors.length}`);
            
            return results;
            
        } catch (error) {
            console.error('❌ Final research processing failed:', error);
            throw error;
        }
    }
}

// Execute if called directly
if (require.main === module) {
    const processor = new FinalResearchProcessor();
    processor.run().then(() => {
        console.log('✅ Final research processing completed successfully!');
        process.exit(0);
    }).catch(error => {
        console.error('❌ Processing failed:', error);
        process.exit(1);
    });
}

module.exports = FinalResearchProcessor;