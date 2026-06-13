#!/usr/bin/env node

/**
 * AI Company Enricher
 * Consolidated tool for contact information and basic data enrichment
 * Combines website discovery, email extraction, LinkedIn finding, and contact enhancement
 */

const { Client } = require('@notionhq/client');
require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

class AICompanyEnricher {
    constructor() {
        // Direct token access - MCP pattern
        this.notion = new Client({ 
            auth: process.env.NOTION_TOKEN
        });
        this.databaseId = process.env.AI_COMPANY_DB_ID;
        
        // Email validation patterns
        this.emailPatterns = [
            'info@{domain}', 'hello@{domain}', 'contact@{domain}',
            'support@{domain}', 'admin@{domain}', 'team@{domain}',
            'sales@{domain}', 'inquiries@{domain}'
        ];
        
        this.invalidEmailPatterns = [
            /noreply/i, /donotreply/i, /bounce/i, /spam/i, /test@/i,
            /example\./i, /@test\./i, /\.png$/i, /\.jpg$/i, /\.gif$/i
        ];
        
        // Common domain extensions to try for website discovery
        this.domainExtensions = ['.com', '.ca', '.io', '.ai', '.co', '.net', '.org'];
    }

    async findCompaniesForEnrichment(type = 'all', limit = 50) {
        console.log(`🔍 Finding companies for ${type} enrichment...\n`);
        
        let filter = {};
        
        switch (type) {
            case 'websites':
                filter = { property: 'Website', url: { is_empty: true } };
                break;
            case 'emails':
                filter = {
                    and: [
                        { property: 'Website', url: { is_not_empty: true } },
                        { property: 'Email', email: { is_empty: true } }
                    ]
                };
                break;
            case 'linkedin':
                filter = { property: 'LinkedIn', url: { is_empty: true } };
                break;
            case 'contacts':
                filter = {
                    or: [
                        { property: 'Email', email: { is_empty: true } },
                        { property: 'Phone', phone_number: { is_empty: true } }
                    ]
                };
                break;
            default:
                filter = {
                    or: [
                        { property: 'Website', url: { is_empty: true } },
                        { property: 'Email', email: { is_empty: true } },
                        { property: 'LinkedIn', url: { is_empty: true } }
                    ]
                };
        }
        
        const response = await this.notion.databases.query({
            database_id: this.databaseId,
            filter: filter,
            sorts: [{ property: 'Year Founded', direction: 'descending' }],
            page_size: limit
        });
        
        console.log(`Found ${response.results.length} companies for enrichment`);
        return response.results;
    }

    async discoverWebsite(companyName) {
        console.log(`   🌐 Discovering website for ${companyName}...`);
        
        // Generate potential domain names
        const cleanName = companyName.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '');
        
        const potentialDomains = [];
        
        // Try exact name
        this.domainExtensions.forEach(ext => {
            potentialDomains.push(`https://${cleanName}${ext}`);
            potentialDomains.push(`https://www.${cleanName}${ext}`);
        });
        
        // Try common variations
        const variations = [
            cleanName.replace(/inc$|ltd$|corp$|llc$/i, ''),
            cleanName.replace(/\s/g, ''),
            cleanName.replace(/\s/g, '-')
        ];
        
        variations.forEach(variation => {
            if (variation !== cleanName) {
                this.domainExtensions.forEach(ext => {
                    potentialDomains.push(`https://${variation}${ext}`);
                    potentialDomains.push(`https://www.${variation}${ext}`);
                });
            }
        });
        
        // Test each potential domain
        for (const domain of potentialDomains) {
            try {
                const response = await axios.get(domain, {
                    timeout: 5000,
                    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BC-AI-Research/1.0)' }
                });
                
                // Check if company name appears on the page
                const content = response.data.toLowerCase();
                const nameWords = companyName.toLowerCase().split(' ').filter(word => word.length > 2);
                const nameMatches = nameWords.filter(word => content.includes(word)).length;
                
                if (nameMatches >= Math.min(2, nameWords.length)) {
                    console.log(`   ✅ Found website: ${domain} (${nameMatches}/${nameWords.length} name matches)`);
                    return {
                        url: domain,
                        confidence: nameMatches / nameWords.length,
                        verified: true
                    };
                }
            } catch (error) {
                // Continue to next domain
            }
        }
        
        console.log(`   ❌ No website found for ${companyName}`);
        return null;
    }

    async extractContactInfo(website, companyName) {
        console.log(`   📧 Extracting contact info from ${website}...`);
        
        const contactInfo = {
            emails: [],
            phones: [],
            socialLinks: {}
        };
        
        try {
            // Try main page first
            const mainPage = await this.fetchPageContent(website);
            this.extractContactFromContent(mainPage, contactInfo, website);
            
            // Try contact page
            const contactUrls = [
                `${website}/contact`,
                `${website}/contact-us`,
                `${website}/about`,
                `${website}/team`
            ];
            
            for (const contactUrl of contactUrls) {
                try {
                    const contactPage = await this.fetchPageContent(contactUrl);
                    this.extractContactFromContent(contactPage, contactInfo, website);
                } catch (error) {
                    // Continue to next contact page
                }
            }
            
            // Filter and validate emails
            contactInfo.emails = this.validateEmails(contactInfo.emails, website);
            
            console.log(`   ✅ Found ${contactInfo.emails.length} emails, ${contactInfo.phones.length} phones`);
            return contactInfo;
            
        } catch (error) {
            console.log(`   ❌ Could not extract contact info: ${error.message}`);
            return contactInfo;
        }
    }

    async fetchPageContent(url) {
        const response = await axios.get(url, {
            timeout: 8000,
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BC-AI-Research/1.0)' }
        });
        return response.data;
    }

    extractContactFromContent(content, contactInfo, baseUrl) {
        const domain = new URL(baseUrl).hostname.replace('www.', '');
        
        // Extract emails
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const emails = content.match(emailRegex) || [];
        
        // Prioritize business emails from same domain
        emails.forEach(email => {
            if (email.includes(domain) && !contactInfo.emails.includes(email)) {
                contactInfo.emails.unshift(email); // Add to beginning
            } else if (!contactInfo.emails.includes(email)) {
                contactInfo.emails.push(email);
            }
        });
        
        // Extract phone numbers
        const phoneRegex = /(\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g;
        const phones = content.match(phoneRegex) || [];
        phones.forEach(phone => {
            const cleanPhone = phone.replace(/[^\d+]/g, '');
            if (cleanPhone.length >= 10 && !contactInfo.phones.includes(phone)) {
                contactInfo.phones.push(phone);
            }
        });
        
        // Extract LinkedIn
        const linkedinRegex = /linkedin\.com\/company\/([a-zA-Z0-9-]+)/g;
        const linkedinMatch = content.match(linkedinRegex);
        if (linkedinMatch && linkedinMatch[0]) {
            contactInfo.socialLinks.linkedin = `https://${linkedinMatch[0]}`;
        }
    }

    validateEmails(emails, website) {
        const domain = new URL(website).hostname.replace('www.', '');
        const validEmails = [];
        
        for (const email of emails) {
            // Basic format validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) continue;
            
            // Check against invalid patterns
            const isInvalid = this.invalidEmailPatterns.some(pattern => pattern.test(email));
            if (isInvalid) continue;
            
            // Prefer business domain emails
            if (email.includes(domain)) {
                validEmails.unshift(email);
            } else {
                validEmails.push(email);
            }
            
            // Limit to top 3 emails
            if (validEmails.length >= 3) break;
        }
        
        return validEmails;
    }

    async updateCompany(companyId, updates) {
        const properties = {};
        
        if (updates.website) {
            properties.Website = { url: updates.website };
        }
        
        if (updates.email) {
            properties.Email = { email: updates.email };
        }
        
        if (updates.phone) {
            properties.Phone = { phone_number: updates.phone };
        }
        
        if (updates.linkedin) {
            properties.LinkedIn = { url: updates.linkedin };
        }
        
        // Always update last verified
        properties['Last Verified'] = {
            date: { start: new Date().toISOString().split('T')[0] }
        };
        
        try {
            await this.notion.pages.update({
                page_id: companyId,
                properties: properties
            });
            return true;
        } catch (error) {
            console.log(`   ❌ Failed to update company: ${error.message}`);
            return false;
        }
    }

    async enrichCompany(company) {
        const name = company.properties.Name?.title?.[0]?.plain_text || 'Unknown';
        const website = company.properties.Website?.url;
        const email = company.properties.Email?.email;
        const linkedin = company.properties.LinkedIn?.url;
        
        console.log(`\n🔍 Enriching: ${name}`);
        
        const enrichment = {
            companyId: company.id,
            companyName: name,
            updates: {},
            success: false
        };
        
        // Discover website if missing
        if (!website) {
            const discoveredWebsite = await this.discoverWebsite(name);
            if (discoveredWebsite) {
                enrichment.updates.website = discoveredWebsite.url;
            }
        }
        
        // Extract contact info from website
        const targetWebsite = enrichment.updates.website || website;
        if (targetWebsite && (!email || !linkedin)) {
            const contactInfo = await this.extractContactInfo(targetWebsite, name);
            
            if (contactInfo.emails.length > 0 && !email) {
                enrichment.updates.email = contactInfo.emails[0];
            }
            
            if (contactInfo.socialLinks.linkedin && !linkedin) {
                enrichment.updates.linkedin = contactInfo.socialLinks.linkedin;
            }
            
            if (contactInfo.phones.length > 0) {
                enrichment.updates.phone = contactInfo.phones[0];
            }
        }
        
        // Update company if we found new data
        if (Object.keys(enrichment.updates).length > 0) {
            enrichment.success = await this.updateCompany(company.id, enrichment.updates);
            
            if (enrichment.success) {
                console.log(`   ✅ Updated with: ${Object.keys(enrichment.updates).join(', ')}`);
            }
        } else {
            console.log(`   ⏭️  No new data found`);
        }
        
        return enrichment;
    }

    async generateEnrichmentReport(companies, enrichments) {
        const timestamp = new Date().toISOString().split('T')[0];
        const reportPath = path.join(process.cwd(), 'data', 'enrichment', `ai-company-enrichment-${timestamp}.json`);
        
        // Ensure directory exists
        const dir = path.dirname(reportPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        const successful = enrichments.filter(e => e.success);
        const report = {
            generatedAt: new Date().toISOString(),
            totalCompanies: companies.length,
            successfulEnrichments: successful.length,
            successRate: Math.round((successful.length / companies.length) * 100),
            updatesBreakdown: {
                websites: successful.filter(e => e.updates.website).length,
                emails: successful.filter(e => e.updates.email).length,
                phones: successful.filter(e => e.updates.phone).length,
                linkedin: successful.filter(e => e.updates.linkedin).length
            },
            enrichments: enrichments
        };
        
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`\n📊 Enrichment report saved: ${reportPath}`);
        
        return report;
    }

    async run(options = {}) {
        console.log('🚀 AI Company Enrichment Tool');
        console.log('===============================\n');
        
        const enrichmentType = options.type || 'all';
        const limit = options.limit || 50;
        
        const companies = await this.findCompaniesForEnrichment(enrichmentType, limit);
        
        if (companies.length === 0) {
            console.log('No companies found for enrichment.');
            return;
        }
        
        const enrichments = [];
        
        for (const company of companies) {
            const enrichment = await this.enrichCompany(company);
            enrichments.push(enrichment);
            
            // Add delay to be respectful to websites
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
        
        // Generate report
        const report = await this.generateEnrichmentReport(companies, enrichments);
        
        console.log('\n✅ Enrichment complete!');
        console.log(`📊 ${report.successfulEnrichments}/${report.totalCompanies} companies enriched (${report.successRate}%)`);
        console.log(`🌐 Websites: ${report.updatesBreakdown.websites}`);
        console.log(`📧 Emails: ${report.updatesBreakdown.emails}`);
        console.log(`🔗 LinkedIn: ${report.updatesBreakdown.linkedin}`);
        console.log(`📞 Phones: ${report.updatesBreakdown.phones}`);
        
        return report;
    }
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const options = {};
    
    // Parse arguments
    args.forEach(arg => {
        if (arg.startsWith('--limit=')) {
            options.limit = parseInt(arg.split('=')[1]);
        } else if (arg.startsWith('--type=')) {
            options.type = arg.split('=')[1];
        }
    });
    
    const enricher = new AICompanyEnricher();
    enricher.run(options).catch(console.error);
}

module.exports = AICompanyEnricher;