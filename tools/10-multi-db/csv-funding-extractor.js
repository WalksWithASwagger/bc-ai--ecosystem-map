#!/usr/bin/env node

/**
 * CSV Funding Data Extractor
 * Processes exported CSV from Notion funding list
 */

const fs = require('fs');
const path = require('path');

class CSVFundingExtractor {
    constructor() {
        this.projectPath = '/Users/kk/ecosystem-map-bc-ai/data/projects/funding-intelligence';
        this.extractedFunders = [];
        this.processingLog = [];
    }

    log(message) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${message}`;
        console.log(logEntry);
        this.processingLog.push(logEntry);
    }

    async processCSV(csvPath) {
        this.log(`📊 Processing CSV funding data from: ${csvPath}`);
        
        if (!fs.existsSync(csvPath)) {
            this.log(`❌ CSV file not found: ${csvPath}`);
            this.log('📋 Please export your Notion page as CSV and save as funding-list-export.csv');
            return [];
        }

        const csvContent = fs.readFileSync(csvPath, 'utf8');
        const lines = csvContent.split('\n').filter(line => line.trim());
        
        if (lines.length === 0) {
            this.log('❌ CSV file is empty');
            return [];
        }

        // Parse CSV header
        const headers = this.parseCSVLine(lines[0]);
        this.log(`📋 Found columns: ${headers.join(', ')}`);

        // Process each row
        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length > 0) {
                const funder = this.createFunderFromCSV(headers, values, i);
                if (funder && funder.name) {
                    this.extractedFunders.push(funder);
                }
            }
        }

        this.log(`✅ Processed ${this.extractedFunders.length} funders from CSV`);
        return this.extractedFunders;
    }

    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result;
    }

    createFunderFromCSV(headers, values, rowIndex) {
        const funder = {
            id: `csv_${rowIndex}`,
            source: 'csv_import',
            sourceUrl: 'https://kriskrug.notion.site/Long-List-of-Awesome-Funders-9212662f2cd3451bbde3470b9018ea12',
            importedAt: new Date().toISOString()
        };

        // Map CSV columns to funder properties
        headers.forEach((header, index) => {
            const value = values[index] || '';
            const normalizedHeader = header.toLowerCase().trim();
            
            // Map common column names to our schema
            if (normalizedHeader.includes('name') || normalizedHeader.includes('fund')) {
                funder.name = value;
            } else if (normalizedHeader.includes('type') || normalizedHeader.includes('category')) {
                funder.type = value;
            } else if (normalizedHeader.includes('location') || normalizedHeader.includes('geography')) {
                funder.location = value;
            } else if (normalizedHeader.includes('website') || normalizedHeader.includes('url')) {
                funder.website = value;
            } else if (normalizedHeader.includes('email') || normalizedHeader.includes('contact')) {
                funder.contact = value;
            } else if (normalizedHeader.includes('stage') || normalizedHeader.includes('investment stage')) {
                funder.stage = value;
            } else if (normalizedHeader.includes('focus') || normalizedHeader.includes('sector')) {
                funder.focusAreas = value ? value.split(',').map(s => s.trim()) : [];
            } else if (normalizedHeader.includes('size') || normalizedHeader.includes('ticket') || normalizedHeader.includes('check')) {
                funder.ticketSize = value;
            } else if (normalizedHeader.includes('description') || normalizedHeader.includes('about')) {
                funder.description = value;
            } else {
                // Store any other columns as additional data
                funder[normalizedHeader.replace(/\s+/g, '_')] = value;
            }
        });

        // Validate required fields
        if (!funder.name || funder.name.length < 2) {
            return null;
        }

        // Set defaults
        funder.type = funder.type || 'Fund';
        funder.status = 'active';
        funder.focusAreas = funder.focusAreas || [];

        return funder;
    }

    async saveExtractedData() {
        const timestamp = Date.now();
        const outputPath = `${this.projectPath}/data/raw/csv-funding-extract-${timestamp}.json`;
        
        const output = {
            metadata: {
                source: 'CSV Export',
                sourceUrl: 'https://kriskrug.notion.site/Long-List-of-Awesome-Funders-9212662f2cd3451bbde3470b9018ea12',
                extractedAt: new Date().toISOString(),
                totalFunders: this.extractedFunders.length,
                extractionMethod: 'csv_processing'
            },
            funders: this.extractedFunders,
            processingLog: this.processingLog
        };

        fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
        this.log(`💾 Real funding data saved: ${outputPath}`);
        
        return outputPath;
    }

    async generateSummaryReport() {
        const report = {
            summary: {
                totalExtracted: this.extractedFunders.length,
                byType: this.groupBy('type'),
                byLocation: this.groupBy('location'),
                byStage: this.groupBy('stage'),
                withWebsites: this.extractedFunders.filter(f => f.website).length,
                withContacts: this.extractedFunders.filter(f => f.contact).length,
                withFocusAreas: this.extractedFunders.filter(f => f.focusAreas && f.focusAreas.length > 0).length
            },
            dataQuality: {
                completeness: this.calculateCompleteness(),
                readyForEnrichment: this.extractedFunders.length
            },
            topFunders: this.extractedFunders.slice(0, 20),
            nextSteps: [
                `Enrich ${this.extractedFunders.length} real funders with research pipelines`,
                'Score and prioritize funding opportunities',
                'Set up automated tracking and updates',
                'Build relationship management workflows'
            ]
        };

        const reportPath = `${this.projectPath}/reports/csv-extraction-report-${Date.now()}.json`;
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        this.log(`📋 Summary report saved: ${reportPath}`);
        
        return report;
    }

    groupBy(field) {
        const groups = {};
        this.extractedFunders.forEach(funder => {
            const value = funder[field] || 'Unknown';
            groups[value] = (groups[value] || 0) + 1;
        });
        return groups;
    }

    calculateCompleteness() {
        if (this.extractedFunders.length === 0) return 0;
        
        let totalFields = 0;
        let filledFields = 0;
        
        this.extractedFunders.forEach(funder => {
            const requiredFields = ['name', 'type', 'location', 'website', 'contact', 'focusAreas'];
            requiredFields.forEach(field => {
                totalFields++;
                if (funder[field] && funder[field] !== '' && funder[field] !== 'Unknown') {
                    filledFields++;
                }
            });
        });
        
        return Math.round((filledFields / totalFields) * 100);
    }

    async run(csvPath = 'funding-list-export.csv') {
        try {
            this.log('🚀 Starting CSV funding data extraction...');
            
            // Process CSV
            await this.processCSV(csvPath);
            
            if (this.extractedFunders.length === 0) {
                console.log('\n❌ No funding data extracted');
                console.log('\n📋 Instructions:');
                console.log('   1. Go to your Notion funding page');
                console.log('   2. Click "..." menu → Export → CSV');
                console.log('   3. Save as "funding-list-export.csv" in this directory');
                console.log('   4. Run: node csv-funding-extractor.js');
                return { success: false, extractedFunders: 0 };
            }
            
            // Save results
            const outputPath = await this.saveExtractedData();
            const report = await this.generateSummaryReport();

            console.log('\n🎉 REAL Funding Data Extraction Complete!');
            console.log('\n📊 Summary:');
            console.log(`   💰 Real funders extracted: ${this.extractedFunders.length}`);
            console.log(`   🌐 With websites: ${this.extractedFunders.filter(f => f.website).length}`);
            console.log(`   📞 With contacts: ${this.extractedFunders.filter(f => f.contact).length}`);
            console.log(`   📁 Data saved: ${outputPath}`);
            
            if (this.extractedFunders.length > 0) {
                console.log('\n🌟 Sample of Your Real Funders:');
                this.extractedFunders.slice(0, 10).forEach((funder, idx) => {
                    console.log(`   ${idx + 1}. ${funder.name} (${funder.type}) - ${funder.location || 'Location TBD'}`);
                });
            }

            console.log('\n🚀 Next Steps:');
            console.log('   1. Run enrichment: node funding-enrichment.js');
            console.log('   2. View in dashboard: http://localhost:3000/research?project=funding-intelligence');
            console.log(`   3. Start research pipelines on ${this.extractedFunders.length} REAL funders!`);

            return {
                success: true,
                extractedFunders: this.extractedFunders.length,
                outputPath,
                report
            };

        } catch (error) {
            this.log(`❌ Extraction failed: ${error.message}`);
            console.error('Full error:', error);
            
            return {
                success: false,
                error: error.message,
                extractedFunders: this.extractedFunders.length
            };
        }
    }
}

// CLI execution
if (require.main === module) {
    const csvPath = process.argv[2] || 'funding-list-export.csv';
    const extractor = new CSVFundingExtractor();
    extractor.run(csvPath).then(result => {
        process.exit(result.success ? 0 : 1);
    });
}

module.exports = CSVFundingExtractor;