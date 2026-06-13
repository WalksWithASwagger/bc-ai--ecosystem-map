#!/usr/bin/env node

/**
 * Direct Notion API Extractor for Funding Data
 * Uses the provided token directly via Notion API
 */

const { Client } = require('@notionhq/client');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

class DirectNotionExtractor {
    constructor() {
        this.notion = new Client({ 
            auth: process.env.NOTION_TOKEN
        });
        
        this.pageId = '9212662f2cd3451bbde3470b9018ea12';
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

    async testConnection() {
        this.log('🔗 Testing direct Notion API connection...');
        
        try {
            const response = await this.notion.users.me();
            this.log(`✅ Connected as: ${response.name || response.object}`);
            return true;
        } catch (error) {
            this.log(`❌ Connection failed: ${error.message}`);
            return false;
        }
    }

    async extractFundingData() {
        this.log('📊 Extracting funding data from your page...');
        
        try {
            // Try to get the page first
            const page = await this.notion.pages.retrieve({
                page_id: this.pageId
            });
            
            this.log(`✅ Retrieved page: ${page.object}`);
            
            // Get all blocks from the page
            const response = await this.notion.blocks.children.list({
                block_id: this.pageId,
                page_size: 100
            });

            this.log(`📋 Found ${response.results.length} blocks on your funding page`);
            
            // Process each block to extract funder information
            for (const block of response.results) {
                const funder = this.processFunderBlock(block);
                if (funder) {
                    this.extractedFunders.push(funder);
                    this.log(`   ✅ Extracted: ${funder.name}`);
                }
            }

            // If we have more than 100 blocks, get the rest
            if (response.has_more) {
                await this.getMoreBlocks(response.next_cursor);
            }

            return this.extractedFunders;

        } catch (error) {
            this.log(`❌ Extraction failed: ${error.message}`);
            
            // Try database extraction if page extraction fails
            return await this.tryDatabaseExtraction();
        }
    }

    async getMoreBlocks(cursor) {
        try {
            const response = await this.notion.blocks.children.list({
                block_id: this.pageId,
                page_size: 100,
                start_cursor: cursor
            });

            this.log(`📋 Found ${response.results.length} more blocks`);
            
            for (const block of response.results) {
                const funder = this.processFunderBlock(block);
                if (funder) {
                    this.extractedFunders.push(funder);
                    this.log(`   ✅ Extracted: ${funder.name}`);
                }
            }

            if (response.has_more) {
                await this.getMoreBlocks(response.next_cursor);
            }
        } catch (error) {
            this.log(`❌ Error getting more blocks: ${error.message}`);
        }
    }

    async tryDatabaseExtraction() {
        this.log('🗃️ Trying database extraction...');
        
        try {
            const response = await this.notion.databases.query({
                database_id: this.pageId,
                page_size: 100
            });

            this.log(`📊 Database found with ${response.results.length} entries`);
            
            for (const page of response.results) {
                const funder = this.processDatabaseEntry(page);
                if (funder) {
                    this.extractedFunders.push(funder);
                    this.log(`   ✅ Extracted: ${funder.name}`);
                }
            }

            return this.extractedFunders;

        } catch (error) {
            this.log(`❌ Database extraction failed: ${error.message}`);
            return [];
        }
    }

    processFunderBlock(block) {
        const text = this.getBlockText(block);
        if (!text || text.length < 3) return null;

        // Look for funder indicators
        const funderKeywords = ['fund', 'capital', 'ventures', 'partners', 'vc', 'investment', '@', '.com'];
        const hasFunderKeywords = funderKeywords.some(keyword => 
            text.toLowerCase().includes(keyword)
        );

        if (!hasFunderKeywords) return null;

        const funder = {
            id: `block_${block.id}`,
            name: this.extractName(text),
            type: this.extractType(text),
            location: this.extractLocation(text),
            website: this.extractWebsite(text),
            contact: this.extractContact(text),
            description: text.substring(0, 500), // First 500 chars
            focusAreas: this.extractFocusAreas(text),
            source: 'notion_direct_api',
            sourceUrl: 'https://www.notion.so/kriskrug/Long-List-of-Awesome-Funders-9212662f2cd3451bbde3470b9018ea12',
            importedAt: new Date().toISOString(),
            blockId: block.id,
            blockType: block.type
        };

        return funder.name && funder.name.length > 2 ? funder : null;
    }

    processDatabaseEntry(page) {
        try {
            const properties = page.properties;
            
            const funder = {
                id: page.id,
                name: this.extractProperty(properties, ['Name', 'Title', 'Fund Name', 'Organization']),
                type: this.extractProperty(properties, ['Type', 'Category', 'Fund Type']),
                location: this.extractProperty(properties, ['Location', 'Geography', 'Region']),
                website: this.extractProperty(properties, ['Website', 'URL', 'Site']),
                contact: this.extractProperty(properties, ['Email', 'Contact', 'Contact Email']),
                focusAreas: this.extractArrayProperty(properties, ['Focus', 'Focus Areas', 'Sectors', 'Industries']),
                stage: this.extractProperty(properties, ['Stage', 'Investment Stage']),
                ticketSize: this.extractProperty(properties, ['Ticket Size', 'Check Size', 'Investment Size']),
                description: this.extractProperty(properties, ['Description', 'About', 'Notes']),
                source: 'notion_database_direct',
                sourceUrl: 'https://www.notion.so/kriskrug/Long-List-of-Awesome-Funders-9212662f2cd3451bbde3470b9018ea12',
                importedAt: new Date().toISOString(),
                notionId: page.id
            };

            return funder.name ? funder : null;

        } catch (error) {
            this.log(`   ❌ Failed to process database entry: ${error.message}`);
            return null;
        }
    }

    extractProperty(properties, possibleNames) {
        for (const name of possibleNames) {
            const prop = properties[name];
            if (prop) {
                if (prop.type === 'title' && prop.title?.[0]) {
                    return prop.title[0].plain_text;
                }
                if (prop.type === 'rich_text' && prop.rich_text?.[0]) {
                    return prop.rich_text[0].plain_text;
                }
                if (prop.type === 'select' && prop.select) {
                    return prop.select.name;
                }
                if (prop.type === 'url' && prop.url) {
                    return prop.url;
                }
                if (prop.type === 'email' && prop.email) {
                    return prop.email;
                }
            }
        }
        return '';
    }

    extractArrayProperty(properties, possibleNames) {
        for (const name of possibleNames) {
            const prop = properties[name];
            if (prop?.type === 'multi_select' && prop.multi_select) {
                return prop.multi_select.map(item => item.name);
            }
        }
        return [];
    }

    getBlockText(block) {
        if (block.type === 'paragraph' && block.paragraph?.rich_text) {
            return block.paragraph.rich_text.map(rt => rt.plain_text).join('');
        }
        if (block.type === 'heading_1' && block.heading_1?.rich_text) {
            return block.heading_1.rich_text.map(rt => rt.plain_text).join('');
        }
        if (block.type === 'heading_2' && block.heading_2?.rich_text) {
            return block.heading_2.rich_text.map(rt => rt.plain_text).join('');
        }
        if (block.type === 'heading_3' && block.heading_3?.rich_text) {
            return block.heading_3.rich_text.map(rt => rt.plain_text).join('');
        }
        if (block.type === 'bulleted_list_item' && block.bulleted_list_item?.rich_text) {
            return block.bulleted_list_item.rich_text.map(rt => rt.plain_text).join('');
        }
        if (block.type === 'numbered_list_item' && block.numbered_list_item?.rich_text) {
            return block.numbered_list_item.rich_text.map(rt => rt.plain_text).join('');
        }
        return '';
    }

    extractName(text) {
        // Get first meaningful line/sentence
        const lines = text.split(/[\n\r]+/).filter(line => line.trim().length > 2);
        if (lines.length > 0) {
            // Remove common prefixes and clean up
            let name = lines[0].trim();
            name = name.replace(/^[\d\.\-\*\s]+/, ''); // Remove numbering
            name = name.replace(/\s*[-–—]\s*.*$/, ''); // Remove everything after dash
            return name.trim();
        }
        return '';
    }

    extractType(text) {
        const types = [
            'Venture Capital', 'VC', 'Accelerator', 'Incubator', 
            'Angel Fund', 'Angel', 'Private Equity', 'PE',
            'Fund', 'Investment Fund', 'Family Office'
        ];
        
        for (const type of types) {
            if (text.toLowerCase().includes(type.toLowerCase())) {
                return type;
            }
        }
        return 'Fund';
    }

    extractLocation(text) {
        // Enhanced location extraction
        const patterns = [
            /\b(San Francisco|SF|Silicon Valley|Palo Alto|Mountain View|Menlo Park)\b/gi,
            /\b(New York|NYC|Manhattan)\b/gi,
            /\b(Los Angeles|LA)\b/gi,
            /\b(Boston|Cambridge)\b/gi,
            /\b(London|UK)\b/gi,
            /\b(Toronto|Vancouver|Montreal)\b/gi,
            /\b([A-Z][a-z]+,\s*[A-Z]{2})\b/g, // City, State format
            /\b([A-Z][a-z]+,\s*[A-Z][a-z]+)\b/g // City, Country format
        ];
        
        for (const pattern of patterns) {
            const matches = text.match(pattern);
            if (matches) return matches[0];
        }
        return '';
    }

    extractWebsite(text) {
        const patterns = [
            /https?:\/\/[^\s\)]+/g,
            /www\.[^\s\)]+/g,
            /\b[a-zA-Z0-9][a-zA-Z0-9-]*\.(com|org|net|io|co|vc)\b/g
        ];
        
        for (const pattern of patterns) {
            const matches = text.match(pattern);
            if (matches) {
                let url = matches[0];
                if (!url.startsWith('http')) {
                    url = 'https://' + url;
                }
                return url;
            }
        }
        return '';
    }

    extractContact(text) {
        const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        const matches = text.match(emailPattern);
        return matches ? matches[0] : '';
    }

    extractFocusAreas(text) {
        const sectors = [
            'SaaS', 'AI', 'ML', 'Artificial Intelligence', 'Machine Learning',
            'Enterprise', 'B2B', 'B2C', 'Consumer', 'FinTech', 'Healthcare',
            'BioTech', 'CleanTech', 'EdTech', 'PropTech', 'Retail', 'E-commerce',
            'Gaming', 'Media', 'Security', 'Cybersecurity', 'Mobile', 'Web3',
            'Crypto', 'Blockchain', 'Hardware', 'Robotics', 'IoT'
        ];
        
        const found = sectors.filter(sector => 
            text.toLowerCase().includes(sector.toLowerCase())
        );
        
        return found.slice(0, 5); // Limit to 5 focus areas
    }

    async saveExtractedData() {
        const timestamp = Date.now();
        const outputPath = `${this.projectPath}/data/raw/direct-notion-extract-${timestamp}.json`;
        
        const output = {
            metadata: {
                source: 'Direct Notion API',
                sourceUrl: 'https://www.notion.so/kriskrug/Long-List-of-Awesome-Funders-9212662f2cd3451bbde3470b9018ea12',
                extractedAt: new Date().toISOString(),
                totalFunders: this.extractedFunders.length,
                extractionMethod: 'direct_api_blocks_and_database'
            },
            funders: this.extractedFunders,
            processingLog: this.processingLog
        };

        fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
        this.log(`💾 Real funding data saved: ${outputPath}`);
        
        return outputPath;
    }

    async run() {
        try {
            this.log('🚀 Starting direct Notion extraction of your funding data...');
            
            // Test connection
            const connected = await this.testConnection();
            if (!connected) {
                throw new Error('Could not connect to Notion API');
            }

            // Extract data
            await this.extractFundingData();
            
            // Save results
            const outputPath = await this.saveExtractedData();

            console.log('\n🎉 REAL Funding Data Extraction Complete!');
            console.log('\n📊 Summary:');
            console.log(`   💰 Real funders extracted: ${this.extractedFunders.length}`);
            console.log(`   📁 Data saved: ${outputPath}`);
            
            if (this.extractedFunders.length > 0) {
                console.log('\n🌟 Sample of Your Real Funders:');
                this.extractedFunders.slice(0, 10).forEach((funder, idx) => {
                    console.log(`   ${idx + 1}. ${funder.name} (${funder.type}) - ${funder.location || 'Location TBD'}`);
                });
            }

            console.log('\n🚀 Next Steps:');
            console.log('   1. Run enrichment: node funding-enrichment.js');
            console.log('   2. View dashboard: http://localhost:3000/research?project=funding-intelligence');

            return {
                success: true,
                extractedFunders: this.extractedFunders.length,
                outputPath
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
    const extractor = new DirectNotionExtractor();
    extractor.run().then(result => {
        process.exit(result.success ? 0 : 1);
    });
}

module.exports = DirectNotionExtractor;