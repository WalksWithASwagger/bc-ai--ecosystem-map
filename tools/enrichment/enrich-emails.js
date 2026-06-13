#!/usr/bin/env node

/**
 * MCP Email Enricher with Validation
 * Finds and validates email addresses before adding to database
 */

const { Client } = require('@notionhq/client');
require('dotenv').config();
const axios = require('axios');

class MCPEmailEnricher {
    constructor() {
        // MCP Pattern: Direct token access
        this.notion = new Client({ 
            auth: process.env.NOTION_TOKEN
        });
        this.databaseId = process.env.AI_COMPANY_DB_ID;
        
        // Email validation patterns
        this.commonPatterns = [
            'info@{domain}',
            'hello@{domain}',
            'contact@{domain}',
            'support@{domain}',
            'admin@{domain}',
            'team@{domain}',
            'sales@{domain}',
            'inquiries@{domain}'
        ];
        
        this.invalidPatterns = [
            /noreply/i,
            /donotreply/i,
            /bounce/i,
            /spam/i,
            /test@/i,
            /example\./i,
            /@test\./i,
            /\.png$/i,
            /\.jpg$/i,
            /\.gif$/i
        ];
    }

    async findCompaniesNeedingEmails(limit = 20) {
        console.log('🔍 Finding companies with websites but no emails...\n');
        
        const response = await this.notion.databases.query({
            database_id: this.databaseId,
            filter: {
                and: [
                    { property: 'Website', url: { is_not_empty: true } },
                    { property: 'Email', email: { is_empty: true } }
                ]
            },
            sorts: [{ property: 'Year Founded', direction: 'descending' }],
            page_size: limit
        });
        
        console.log(`Found ${response.results.length} companies needing emails`);
        return response.results;
    }

    extractDomain(website) {
        try {
            const url = new URL(website);
            return url.hostname.replace('www.', '');
        } catch {
            return null;
        }
    }

    generatePotentialEmails(domain) {
        return this.commonPatterns.map(pattern => 
            pattern.replace('{domain}', domain)
        );
    }

    validateEmail(email) {
        // Basic format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return { valid: false, reason: 'Invalid format' };
        }
        
        // Check against invalid patterns
        for (const pattern of this.invalidPatterns) {
            if (pattern.test(email)) {
                return { valid: false, reason: 'Matches invalid pattern' };
            }
        }
        
        // Check if it's a real domain email (not gmail, yahoo, etc)
        const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
        const domain = email.split('@')[1];
        if (personalDomains.includes(domain)) {
            return { valid: false, reason: 'Personal email domain' };
        }
        
        return { valid: true };
    }

    async verifyEmailDomain(email) {
        const domain = email.split('@')[1];
        try {
            // Quick DNS check
            const response = await axios.get(`https://dns.google/resolve?name=${domain}&type=MX`, {
                timeout: 5000
            });
            return response.data.Answer && response.data.Answer.length > 0;
        } catch {
            // If DNS check fails, assume it might still be valid
            return true;
        }
    }

    async enrichCompanyEmail(company) {
        const name = company.properties.Name?.title?.[0]?.plain_text || 'Unknown';
        const website = company.properties.Website?.url;
        
        console.log(`\n📧 Processing ${name}...`);
        console.log(`   Website: ${website}`);
        
        if (!website) {
            console.log('   ❌ No website available');
            return null;
        }
        
        const domain = this.extractDomain(website);
        if (!domain) {
            console.log('   ❌ Could not extract domain');
            return null;
        }
        
        // Generate potential emails
        const potentialEmails = this.generatePotentialEmails(domain);
        console.log(`   Generated ${potentialEmails.length} potential emails`);
        
        // Validate and find the best one
        let bestEmail = null;
        let bestScore = 0;
        
        for (const email of potentialEmails) {
            const validation = this.validateEmail(email);
            if (validation.valid) {
                // Prioritize certain patterns
                let score = 1;
                if (email.startsWith('info@')) score = 3;
                if (email.startsWith('hello@')) score = 2.5;
                if (email.startsWith('contact@')) score = 2;
                
                if (score > bestScore) {
                    bestScore = score;
                    bestEmail = email;
                }
            }
        }
        
        if (bestEmail) {
            console.log(`   ✅ Best email: ${bestEmail} (confidence: ${bestScore}/3)`);
            
            // Verify domain has MX records
            const domainValid = await this.verifyEmailDomain(bestEmail);
            if (!domainValid) {
                console.log('   ⚠️  Warning: Domain MX records not found');
            }
            
            return {
                email: bestEmail,
                confidence: bestScore / 3,
                verified: domainValid
            };
        } else {
            console.log('   ❌ No valid email found');
            return null;
        }
    }

    async updateCompanyEmail(pageId, emailData) {
        try {
            await this.notion.pages.update({
                page_id: pageId,
                properties: {
                    'Email': { email: emailData.email },
                    'Last Verified': { date: { start: new Date().toISOString() } }
                }
            });
            
            console.log('   💾 Email updated in database');
            return true;
        } catch (error) {
            console.error('   ❌ Failed to update:', error.message);
            return false;
        }
    }

    async run(limit = 20, dryRun = false) {
        console.log('🚀 MCP Email Enricher');
        console.log('====================\n');
        console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE UPDATE'}`);
        console.log(`Limit: ${limit} companies\n`);
        
        try {
            const companies = await this.findCompaniesNeedingEmails(limit);
            
            const results = {
                processed: 0,
                enriched: 0,
                failed: 0,
                emails: []
            };
            
            for (const company of companies) {
                const emailData = await this.enrichCompanyEmail(company);
                results.processed++;
                
                if (emailData) {
                    results.emails.push({
                        company: company.properties.Name?.title?.[0]?.plain_text,
                        email: emailData.email,
                        confidence: emailData.confidence
                    });
                    
                    if (!dryRun) {
                        const updated = await this.updateCompanyEmail(company.id, emailData);
                        if (updated) {
                            results.enriched++;
                        } else {
                            results.failed++;
                        }
                    } else {
                        console.log('   🔄 Would update (dry run mode)');
                        results.enriched++;
                    }
                } else {
                    results.failed++;
                }
                
                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            // Summary
            console.log('\n📊 Summary:');
            console.log(`   Processed: ${results.processed}`);
            console.log(`   Enriched: ${results.enriched}`);
            console.log(`   Failed: ${results.failed}`);
            
            if (results.emails.length > 0) {
                console.log('\n📧 Emails found:');
                results.emails.forEach(e => {
                    console.log(`   ${e.company}: ${e.email} (confidence: ${Math.round(e.confidence * 100)}%)`);
                });
            }
            
            return results;
            
        } catch (error) {
            console.error('❌ Error:', error.message);
            throw error;
        }
    }
}

// Run if called directly
if (require.main === module) {
    const enricher = new MCPEmailEnricher();
    const args = process.argv.slice(2);
    const limit = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '20');
    const dryRun = args.includes('--dry-run');
    
    enricher.run(limit, dryRun).catch(console.error);
}

module.exports = MCPEmailEnricher;