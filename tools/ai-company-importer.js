#!/usr/bin/env node

/**
 * AI Company Importer
 * Consolidated tool for importing new companies with intelligent duplicate detection
 * Handles JSON imports, CSV imports, and manual company addition
 */

const { Client } = require('@notionhq/client');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

class AICompanyImporter {
    constructor() {
        // Direct token access - MCP pattern
        this.notion = new Client({ 
            auth: process.env.NOTION_TOKEN
        });
        this.databaseId = process.env.AI_COMPANY_DB_ID;
        
        // Category mapping for BC Tech ecosystem roles
        this.categoryMapping = {
            'Startup': 'AI Companies',
            'Scaleup': 'AI Companies',
            'Anchor': 'Technology Companies',
            'Capital': 'Investors & VCs',
            'Support': 'Accelerators & Incubators',
            'Talent': 'Research & Education',
            'Advisor': 'Service Providers'
        };
        
        // AI focus area standardization
        this.aiFocusMapping = {
            'Computer Vision': 'Computer Vision',
            'AI (Computer Vision)': 'Computer Vision',
            'AI Automation': 'Process Automation',
            'AI (Automation)': 'Process Automation',
            'Competitive Intelligence': 'Predictive Analytics',
            'AI (Competitive Intelligence)': 'Predictive Analytics',
            'Robotics': 'Robotics',
            'AI, Robotics': 'Robotics',
            'Mining Tech (AI/IoT)': 'Predictive Analytics',
            'HR Tech (Workforce Analytics)': 'Predictive Analytics',
            'Big Data': 'Predictive Analytics',
            'Fintech (Digital Identity)': 'Fraud Detection'
        };
    }

    async findExistingCompany(name, website = null) {
        // Search by exact name match first
        let response = await this.notion.databases.query({
            database_id: this.databaseId,
            filter: {
                property: 'Name',
                title: { equals: name }
            }
        });
        
        if (response.results.length > 0) {
            return response.results[0];
        }
        
        // Search by website if provided
        if (website) {
            response = await this.notion.databases.query({
                database_id: this.databaseId,
                filter: {
                    property: 'Website',
                    url: { equals: website }
                }
            });
            
            if (response.results.length > 0) {
                return response.results[0];
            }
        }
        
        // Search for similar names (fuzzy matching)
        const allCompanies = await this.getAllCompanyNames();
        const similarCompany = this.findSimilarName(name, allCompanies);
        
        if (similarCompany && similarCompany.similarity > 0.8) {
            console.log(`   🔍 Found similar company: ${similarCompany.name} (${Math.round(similarCompany.similarity * 100)}% match)`);
            return similarCompany.company;
        }
        
        return null;
    }

    async getAllCompanyNames() {
        const companies = [];
        let hasMore = true;
        let startCursor = undefined;

        while (hasMore) {
            const response = await this.notion.databases.query({
                database_id: this.databaseId,
                start_cursor: startCursor,
                page_size: 100
            });

            companies.push(...response.results.map(company => ({
                id: company.id,
                name: company.properties.Name?.title?.[0]?.plain_text || '',
                company: company
            })));
            
            hasMore = response.has_more;
            startCursor = response.next_cursor;
        }

        return companies;
    }

    findSimilarName(targetName, companies) {
        let bestMatch = null;
        let bestSimilarity = 0;
        
        const targetLower = targetName.toLowerCase();
        
        for (const company of companies) {
            const companyLower = company.name.toLowerCase();
            const similarity = this.calculateSimilarity(targetLower, companyLower);
            
            if (similarity > bestSimilarity) {
                bestSimilarity = similarity;
                bestMatch = {
                    name: company.name,
                    similarity: similarity,
                    company: company.company
                };
            }
        }
        
        return bestMatch;
    }

    calculateSimilarity(str1, str2) {
        // Simple similarity calculation based on common words and Levenshtein distance
        const words1 = str1.split(/\s+/);
        const words2 = str2.split(/\s+/);
        
        const commonWords = words1.filter(word => words2.includes(word)).length;
        const maxWords = Math.max(words1.length, words2.length);
        const wordSimilarity = commonWords / maxWords;
        
        // Levenshtein distance for character similarity
        const charSimilarity = 1 - (this.levenshteinDistance(str1, str2) / Math.max(str1.length, str2.length));
        
        return (wordSimilarity + charSimilarity) / 2;
    }

    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    mapCategory(originalCategory) {
        return this.categoryMapping[originalCategory] || originalCategory || 'AI Companies';
    }

    mapAIFocus(originalFocus) {
        if (!originalFocus) return [];
        
        if (Array.isArray(originalFocus)) {
            return originalFocus.map(focus => this.aiFocusMapping[focus] || focus);
        }
        
        if (typeof originalFocus === 'string') {
            // Split by common delimiters
            const focuses = originalFocus.split(/[,;|]/).map(f => f.trim());
            return focuses.map(focus => this.aiFocusMapping[focus] || focus);
        }
        
        return [];
    }

    determineBCRegion(location) {
        if (!location) return 'Other BC';
        
        const locationLower = location.toLowerCase();
        
        if (locationLower.includes('vancouver') || locationLower.includes('burnaby') || 
            locationLower.includes('richmond') || locationLower.includes('surrey')) {
            return 'Lower Mainland';
        } else if (locationLower.includes('victoria') || locationLower.includes('nanaimo')) {
            return 'Vancouver Island';
        } else if (locationLower.includes('kelowna') || locationLower.includes('kamloops') || 
                   locationLower.includes('prince george')) {
            return 'Interior';
        } else if (locationLower.includes('prince rupert') || locationLower.includes('fort st. john')) {
            return 'Northern BC';
        }
        
        return 'Other BC';
    }

    async createCompanyProperties(company) {
        const properties = {
            'Name': {
                title: [{ text: { content: company.name || 'Unknown Company' } }]
            }
        };

        // Basic information
        if (company.website) {
            properties['Website'] = { url: company.website };
        }

        if (company.linkedin) {
            properties['LinkedIn'] = { url: company.linkedin };
        }

        if (company.email) {
            properties['Email'] = { email: company.email };
        }

        if (company.phone) {
            properties['Phone'] = { phone_number: company.phone };
        }

        // Location and region
        if (company.location) {
            properties['City/Region'] = {
                rich_text: [{ text: { content: company.location } }]
            };
            
            properties['BC Region'] = {
                select: { name: this.determineBCRegion(company.location) }
            };
        }

        // Category mapping
        const category = this.mapCategory(company.category);
        properties['Category'] = {
            select: { name: category }
        };

        // AI Focus Areas
        const aiFocus = this.mapAIFocus(company.focusAreas || company.aiApplications || company.sectorTags);
        if (aiFocus.length > 0) {
            properties['AI Focus Areas'] = {
                multi_select: aiFocus.map(focus => ({ name: focus }))
            };
        }

        // Founded year
        if (company.founded && !isNaN(parseInt(company.founded))) {
            properties['Year Founded'] = {
                number: parseInt(company.founded)
            };
        }

        // Description
        if (company.description || company.shortBlurb) {
            properties['Short Blurb'] = {
                rich_text: [{ text: { content: company.description || company.shortBlurb } }]
            };
        }

        // Key people
        if (company.keyPeople) {
            const keyPeopleText = Array.isArray(company.keyPeople) ? 
                company.keyPeople.join(', ') : company.keyPeople;
            properties['Key People'] = {
                rich_text: [{ text: { content: keyPeopleText } }]
            };
        }

        // Funding information
        if (company.funding) {
            properties['Funding'] = {
                rich_text: [{ text: { content: company.funding } }]
            };
        }

        // Employee count
        if (company.employees || company.employeeCount) {
            properties['Employee Count'] = {
                rich_text: [{ text: { content: company.employees || company.employeeCount } }]
            };
        }

        // Data sources and verification
        const sources = [];
        if (company.source) sources.push(company.source);
        if (company.researchSources) sources.push(...company.researchSources);
        
        if (sources.length > 0) {
            properties['Data Sources'] = {
                rich_text: [{ text: { content: sources.join(' | ') } }]
            };
        }

        properties['Last Verified'] = {
            date: { start: new Date().toISOString().split('T')[0] }
        };

        return properties;
    }

    async importCompany(company, options = {}) {
        const name = company.name || 'Unknown Company';
        console.log(`\n🔍 Processing: ${name}`);

        // Check for existing company
        const existing = await this.findExistingCompany(name, company.website);
        
        if (existing && !options.allowDuplicates) {
            console.log(`   ⏭️  Already exists in database`);
            return {
                success: false,
                reason: 'duplicate',
                existingId: existing.id,
                company: name
            };
        }

        // Create properties
        const properties = await this.createCompanyProperties(company);

        if (options.dryRun) {
            console.log(`   🔍 DRY RUN - Would import with properties:`);
            console.log(`   - Name: ${name}`);
            if (company.website) console.log(`   - Website: ${company.website}`);
            if (company.category) console.log(`   - Category: ${this.mapCategory(company.category)}`);
            if (company.location) console.log(`   - Location: ${company.location}`);
            return {
                success: true,
                dryRun: true,
                company: name
            };
        }

        try {
            const response = await this.notion.pages.create({
                parent: { database_id: this.databaseId },
                properties: properties
            });

            console.log(`   ✅ Successfully imported`);
            return {
                success: true,
                pageId: response.id,
                company: name
            };

        } catch (error) {
            console.log(`   ❌ Failed to import: ${error.message}`);
            return {
                success: false,
                reason: 'api_error',
                error: error.message,
                company: name
            };
        }
    }

    async importFromFile(filePath, options = {}) {
        console.log('🚀 AI Company Import Tool');
        console.log('==========================\n');
        console.log(`📁 Loading companies from: ${filePath}`);

        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }

        let companies;
        const fileExt = path.extname(filePath).toLowerCase();

        try {
            if (fileExt === '.json') {
                const content = fs.readFileSync(filePath, 'utf8');
                const data = JSON.parse(content);
                companies = Array.isArray(data) ? data : data.companies || data.organizations || [data];
            } else {
                throw new Error('Unsupported file format. Please use JSON files.');
            }
        } catch (error) {
            throw new Error(`Failed to parse file: ${error.message}`);
        }

        console.log(`📋 Found ${companies.length} companies to process\n`);

        if (options.dryRun) {
            console.log('🔍 DRY RUN MODE - No actual imports will be made\n');
        }

        const results = {
            total: companies.length,
            imported: 0,
            duplicates: 0,
            errors: 0,
            details: []
        };

        // Process each company
        for (const company of companies) {
            const result = await this.importCompany(company, options);
            results.details.push(result);

            if (result.success && !result.dryRun) {
                results.imported++;
            } else if (result.reason === 'duplicate') {
                results.duplicates++;
            } else if (!result.success) {
                results.errors++;
            }

            // Small delay to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        // Generate summary report
        const timestamp = new Date().toISOString().split('T')[0];
        const reportPath = path.join(process.cwd(), 'data', 'imports', `import-report-${timestamp}.json`);
        
        // Ensure directory exists
        const dir = path.dirname(reportPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const report = {
            generatedAt: new Date().toISOString(),
            sourceFile: filePath,
            dryRun: options.dryRun || false,
            summary: results,
            details: results.details
        };

        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        // Print summary
        console.log('\n✅ Import complete!');
        console.log(`📊 Results: ${results.imported} imported, ${results.duplicates} duplicates, ${results.errors} errors`);
        console.log(`📄 Detailed report: ${reportPath}`);

        return report;
    }

    async run(filePath, options = {}) {
        try {
            return await this.importFromFile(filePath, options);
        } catch (error) {
            console.error(`❌ Import failed: ${error.message}`);
            throw error;
        }
    }
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('Usage: node ai-company-importer.js <file-path> [options]');
        console.log('Options:');
        console.log('  --dry-run         Preview imports without making changes');
        console.log('  --allow-duplicates Allow duplicate imports');
        process.exit(1);
    }
    
    const filePath = args[0];
    const options = {};
    
    // Parse options
    args.slice(1).forEach(arg => {
        if (arg === '--dry-run') {
            options.dryRun = true;
        } else if (arg === '--allow-duplicates') {
            options.allowDuplicates = true;
        }
    });
    
    const importer = new AICompanyImporter();
    importer.run(filePath, options).catch(console.error);
}

module.exports = AICompanyImporter;