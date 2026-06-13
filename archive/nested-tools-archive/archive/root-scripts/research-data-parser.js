#!/usr/bin/env node

/**
 * Research Data Parser
 * Extracts structured company data from markdown research files
 */

const fs = require('fs').promises;
const path = require('path');

class ResearchDataParser {
    constructor() {
        this.extractedData = {
            companies: [],
            totalFiles: 0,
            processedFiles: 0,
            extractedCompanies: 0,
            dataTypes: {
                funding: 0,
                websites: 0,
                keyPeople: 0,
                founded: 0,
                descriptions: 0
            }
        };
    }

    async parseAllResearchFiles() {
        console.log('📋 Starting research data extraction...');
        
        const researchFiles = [
            'data/research/organizations-to-add-2025-07-30.md',
            'data/research/COMPANIES_TO_ADD_MASTER_LIST.md',
            'data/research/manual-research-updates-2025-07-29.md',
            'data/research/comprehensive-organization-contact-list.md',
            'data/research/website-address-research-2025-07-29.md'
        ];
        
        // Also check for JSON discovery files
        const discoveryFiles = await this.findDiscoveryFiles();
        
        this.extractedData.totalFiles = researchFiles.length + discoveryFiles.length;
        
        // Process markdown files
        for (const filePath of researchFiles) {
            await this.parseMarkdownFile(filePath);
        }
        
        // Process JSON discovery files
        for (const filePath of discoveryFiles) {
            await this.parseJsonFile(filePath);
        }
        
        // Save results
        await this.saveExtractedData();
        
        console.log('✅ Research data extraction complete!');
        return this.extractedData;
    }

    async findDiscoveryFiles() {
        const discoveryDir = 'data/discoveries';
        try {
            const files = await fs.readdir(discoveryDir);
            return files
                .filter(file => file.endsWith('.json'))
                .map(file => path.join(discoveryDir, file));
        } catch (error) {
            console.log('ℹ️  No discoveries directory found');
            return [];
        }
    }

    async parseMarkdownFile(filePath) {
        try {
            console.log(`📄 Processing: ${filePath}`);
            
            const content = await fs.readFile(filePath, 'utf8');
            const companies = this.extractCompaniesFromMarkdown(content, filePath);
            
            this.extractedData.companies.push(...companies);
            this.extractedData.processedFiles++;
            this.extractedData.extractedCompanies += companies.length;
            
            console.log(`   ✅ Extracted ${companies.length} companies`);
            
        } catch (error) {
            console.error(`❌ Error processing ${filePath}:`, error.message);
        }
    }

    extractCompaniesFromMarkdown(content, filePath) {
        const companies = [];
        const lines = content.split('\n');
        
        let currentCompany = null;
        let inCompanySection = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Detect company entries (numbered lists, headings, etc.)
            const companyMatch = this.detectCompanyEntry(line);
            
            if (companyMatch) {
                // Save previous company if exists
                if (currentCompany) {
                    companies.push(this.finalizeCompany(currentCompany, filePath));
                }
                
                // Start new company
                currentCompany = {
                    name: companyMatch.name,
                    source: filePath,
                    confidence: 0.8, // Default confidence
                    extractedData: {}
                };
                inCompanySection = true;
                
                // Look ahead for immediate details
                this.extractImmediateDetails(lines, i, currentCompany);
            } else if (inCompanySection && currentCompany) {
                // Extract data from current line
                this.extractDataFromLine(line, currentCompany);
                
                // Check if we've moved to next company or section
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
        // Pattern 1: Numbered list (1. **Company Name**)
        let match = line.match(/^\d+\.\s*\*\*([^*]+)\*\*/);
        if (match) {
            return { name: match[1].trim(), type: 'numbered' };
        }
        
        // Pattern 2: Markdown heading (### Company Name)
        match = line.match(/^#{2,4}\s*(.+?)$/);
        if (match && !match[1].includes('Batch') && !match[1].includes('Priority')) {
            return { name: match[1].trim(), type: 'heading' };
        }
        
        // Pattern 3: Bold standalone (**Company Name**)
        match = line.match(/^\*\*([^*]+)\*\*\s*$/);
        if (match) {
            return { name: match[1].trim(), type: 'bold' };
        }
        
        // Pattern 4: Simple list (- Company Name)
        match = line.match(/^[-*]\s*([A-Z][^-*]+?)(?:\s*-|$)/);
        if (match && match[1].length > 3 && match[1].length < 50) {
            return { name: match[1].trim(), type: 'list' };
        }
        
        return null;
    }

    extractImmediateDetails(lines, startIndex, company) {
        // Look at next few lines for immediate details
        for (let i = startIndex + 1; i < Math.min(startIndex + 8, lines.length); i++) {
            const line = lines[i].trim();
            if (!line || this.detectCompanyEntry(line)) break;
            
            this.extractDataFromLine(line, company);
        }
    }

    extractDataFromLine(line, company) {
        // Website extraction
        const websiteMatch = line.match(/(?:website|site):\s*([^\s,)]+)/i) || 
                            line.match(/(https?:\/\/[^\s,)]+)/);
        if (websiteMatch) {
            company.extractedData.website = websiteMatch[1];
            this.extractedData.dataTypes.websites++;
        }
        
        // Funding extraction
        const fundingMatch = line.match(/(?:funding|raised|series|exit):\s*\$?([0-9.]+[MBK]?)/i) ||
                            line.match(/\$([0-9.]+[MBK]?\+?)\s*(?:raised|funding|exit|series)/i);
        if (fundingMatch) {
            company.extractedData.funding = fundingMatch[1].includes('$') ? fundingMatch[1] : '$' + fundingMatch[1];
            this.extractedData.dataTypes.funding++;
        }
        
        // Founded year extraction
        const foundedMatch = line.match(/(?:founded|established):\s*(\d{4})/i) ||
                            line.match(/\((\d{4})\)/);
        if (foundedMatch) {
            company.extractedData.founded = parseInt(foundedMatch[1]);
            this.extractedData.dataTypes.founded++;
        }
        
        // Location extraction
        const locationMatch = line.match(/(?:location|based):\s*([^,\n]+)/i) ||
                             line.match(/(?:Vancouver|Victoria|BC|British Columbia)/i);
        if (locationMatch) {
            company.extractedData.location = locationMatch[1] || locationMatch[0];
        }
        
        // Focus/Description extraction
        const focusMatch = line.match(/(?:focus|description):\s*(.+)/i);
        if (focusMatch) {
            company.extractedData.focus = focusMatch[1];
            this.extractedData.dataTypes.descriptions++;
        }
        
        // Employee count extraction
        const employeeMatch = line.match(/(?:employees|team|staff):\s*([0-9+-]+)/i);
        if (employeeMatch) {
            company.extractedData.employees = employeeMatch[1];
        }
        
        // Key people extraction (basic)
        const peopleMatch = line.match(/(?:ceo|founder|president):\s*([A-Z][a-z]+ [A-Z][a-z]+)/i);
        if (peopleMatch) {
            company.extractedData.keyPeople = company.extractedData.keyPeople || [];
            company.extractedData.keyPeople.push(peopleMatch[1]);
            this.extractedData.dataTypes.keyPeople++;
        }
    }

    isEndOfCompanySection(line) {
        // Detect section breaks, new numbered items, etc.
        return line.startsWith('#') || 
               line.match(/^\d+\./) ||
               line.startsWith('---') ||
               line.startsWith('## ');
    }

    finalizeCompany(company, filePath) {
        // Calculate confidence based on extracted data richness
        let confidence = 0.7; // Base confidence
        
        if (company.extractedData.website) confidence += 0.1;
        if (company.extractedData.funding) confidence += 0.1;
        if (company.extractedData.founded) confidence += 0.05;
        if (company.extractedData.location) confidence += 0.05;
        
        company.confidence = Math.min(0.95, confidence);
        
        // Add metadata
        company.extractedAt = new Date().toISOString();
        company.sourceFile = filePath;
        
        return company;
    }

    async parseJsonFile(filePath) {
        try {
            console.log(`🗂️  Processing JSON: ${filePath}`);
            
            const content = await fs.readFile(filePath, 'utf8');
            const jsonData = JSON.parse(content);
            
            const companies = this.extractCompaniesFromJson(jsonData, filePath);
            
            this.extractedData.companies.push(...companies);
            this.extractedData.processedFiles++;
            this.extractedData.extractedCompanies += companies.length;
            
            console.log(`   ✅ Extracted ${companies.length} companies from JSON`);
            
        } catch (error) {
            console.error(`❌ Error processing JSON ${filePath}:`, error.message);
        }
    }

    extractCompaniesFromJson(jsonData, filePath) {
        const companies = [];
        
        // Handle different JSON structures
        if (jsonData.companies && Array.isArray(jsonData.companies)) {
            // Structure: { companies: [...] }
            companies.push(...this.processJsonCompanies(jsonData.companies, filePath));
        } else if (Array.isArray(jsonData)) {
            // Structure: [...]
            companies.push(...this.processJsonCompanies(jsonData, filePath));
        } else if (jsonData.name) {
            // Single company object
            companies.push(this.processJsonCompany(jsonData, filePath));
        }
        
        return companies;
    }

    processJsonCompanies(companiesArray, filePath) {
        return companiesArray.map(companyData => this.processJsonCompany(companyData, filePath));
    }

    processJsonCompany(companyData, filePath) {
        const company = {
            name: companyData.name,
            source: filePath,
            confidence: 0.9, // JSON usually higher confidence
            extractedData: {},
            extractedAt: new Date().toISOString(),
            sourceFile: filePath
        };
        
        // Map JSON fields to extracted data
        if (companyData.website) {
            company.extractedData.website = companyData.website;
            this.extractedData.dataTypes.websites++;
        }
        
        if (companyData.funding) {
            company.extractedData.funding = companyData.funding;
            this.extractedData.dataTypes.funding++;
        }
        
        if (companyData.founded) {
            company.extractedData.founded = companyData.founded;
            this.extractedData.dataTypes.founded++;
        }
        
        if (companyData.location) {
            company.extractedData.location = companyData.location;
        }
        
        if (companyData.focus || companyData.description) {
            company.extractedData.focus = companyData.focus || companyData.description;
            this.extractedData.dataTypes.descriptions++;
        }
        
        if (companyData.keyPeople) {
            company.extractedData.keyPeople = companyData.keyPeople;
            this.extractedData.dataTypes.keyPeople++;
        }
        
        return company;
    }

    async saveExtractedData() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        // Save detailed extraction results
        const dataPath = `data/reports/research-extraction-${timestamp}.json`;
        await fs.writeFile(dataPath, JSON.stringify(this.extractedData, null, 2));
        
        // Generate summary report
        const summaryReport = this.generateExtractionSummary();
        const summaryPath = `data/reports/research-extraction-summary-${timestamp}.md`;
        await fs.writeFile(summaryPath, summaryReport);
        
        console.log(`📊 Extraction data saved to: ${dataPath}`);
        console.log(`📋 Summary saved to: ${summaryPath}`);
    }

    generateExtractionSummary() {
        const data = this.extractedData;
        
        return `# Research Data Extraction Summary

## 📊 **Extraction Statistics**
- **Total Files Processed**: ${data.totalFiles}
- **Successfully Processed**: ${data.processedFiles}
- **Companies Extracted**: ${data.extractedCompanies}
- **Extraction Date**: ${new Date().toLocaleDateString()}

## 📋 **Data Types Extracted**
- **Websites**: ${data.dataTypes.websites} extracted
- **Funding Information**: ${data.dataTypes.funding} extracted
- **Key People**: ${data.dataTypes.keyPeople} extracted
- **Founded Years**: ${data.dataTypes.founded} extracted
- **Descriptions**: ${data.dataTypes.descriptions} extracted

## 🏢 **Extracted Companies Sample**
${data.companies.slice(0, 10).map((company, index) => 
    `${index + 1}. **${company.name}** (Confidence: ${(company.confidence * 100).toFixed(0)}%)
   - Source: ${company.sourceFile}
   - Data: ${Object.keys(company.extractedData).join(', ')}`
).join('\n')}

${data.companies.length > 10 ? `\n... and ${data.companies.length - 10} more companies` : ''}

## 📈 **Enrichment Potential**
- **Total enrichment opportunities**: ${data.extractedCompanies} companies
- **High-confidence data**: ${data.companies.filter(c => c.confidence > 0.85).length} companies
- **Medium-confidence data**: ${data.companies.filter(c => c.confidence >= 0.7 && c.confidence <= 0.85).length} companies

## 🚀 **Ready for Smart Merging**
Research data successfully extracted and ready for intelligent merging with existing database!`;
    }

    async run() {
        try {
            const results = await this.parseAllResearchFiles();
            
            console.log('\n📋 RESEARCH EXTRACTION SUMMARY:');
            console.log(`✅ Files Processed: ${results.processedFiles}/${results.totalFiles}`);
            console.log(`🏢 Companies Extracted: ${results.extractedCompanies}`);
            console.log(`💡 Websites Found: ${results.dataTypes.websites}`);
            console.log(`💰 Funding Info: ${results.dataTypes.funding}`);
            console.log(`👥 Key People: ${results.dataTypes.keyPeople}`);
            
            return results;
            
        } catch (error) {
            console.error('❌ Research extraction failed:', error);
            throw error;
        }
    }
}

// Execute if called directly
if (require.main === module) {
    const parser = new ResearchDataParser();
    parser.run().then(() => {
        console.log('✅ Research data extraction completed successfully!');
        process.exit(0);
    }).catch(error => {
        console.error('❌ Extraction failed:', error);
        process.exit(1);
    });
}

module.exports = ResearchDataParser;