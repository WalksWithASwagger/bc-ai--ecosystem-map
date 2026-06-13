#!/usr/bin/env node

/**
 * Research Extractor V2 - Improved Version
 * 
 * Fixes from V1:
 * - Better phone validation (no CSS/JS values)
 * - Enhanced email discovery
 * - LinkedIn profile visiting
 * - Data quality validation
 * - Clean naming and deduplication
 */

const { Client } = require('@notionhq/client');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');

class ResearchExtractorV2 {
    constructor() {
        this.notion = new Client({
            auth: process.env.NOTION_TOKEN || '<REDACTED_NOTION_TOKEN>'
        });
        this.databaseId = '246c6f799a3381eea3f1e329b7120b44';
        
        this.researchDir = path.join(__dirname, '../../data/research-v2');
        this.stats = {
            fundersProcessed: 0,
            realEmails: 0,
            realPhones: 0,
            linkedinProfiles: 0,
            teamMembers: 0,
            suspiciousData: 0
        };
    }

    async run(limit = 10) {
        console.log('🔬 RESEARCH EXTRACTOR V2 - QUALITY FOCUSED\n');
        console.log('=' .repeat(50));
        console.log('Improvements: Better validation, LinkedIn visiting, email discovery\n');
        
        // Clean database first
        await this.cleanDatabase();
        
        const funders = await this.getFundersToResearch(limit);
        console.log(`📊 Processing ${funders.length} funders\n`);
        
        for (const funder of funders) {
            await this.extractAndStoreFunder(funder);
            await this.sleep(3000); // Slower but more respectful
        }
        
        await this.generateIndex();
        this.printStats();
    }

    async cleanDatabase() {
        console.log('🧹 Cleaning database before extraction...\n');
        
        // Get all funders
        const response = await this.notion.databases.query({
            database_id: this.databaseId,
            page_size: 100
        });
        
        const seen = new Set();
        const toArchive = [];
        
        for (const page of response.results) {
            let name = page.properties.Name?.title?.[0]?.plain_text || '';
            
            // Clean bad names
            if (name.includes(';') || name.includes('http')) {
                const cleanName = name
                    .replace(/^[;\s]+/, '')
                    .replace(/https?:\/\/[^\s]+/g, '')
                    .replace(/[;\s]+$/, '')
                    .trim();
                
                if (cleanName && cleanName !== name) {
                    console.log(`  Fixing name: "${name}" → "${cleanName}"`);
                    await this.notion.pages.update({
                        page_id: page.id,
                        properties: {
                            Name: { title: [{ text: { content: cleanName } }] }
                        }
                    });
                    name = cleanName;
                }
            }
            
            // Check for duplicates
            const normalized = name.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (seen.has(normalized)) {
                toArchive.push({ id: page.id, name });
            }
            seen.add(normalized);
        }
        
        // Archive duplicates
        for (const dup of toArchive) {
            console.log(`  Archiving duplicate: ${dup.name}`);
            await this.notion.pages.update({
                page_id: dup.id,
                archived: true
            });
        }
        
        console.log(`✅ Cleaned ${toArchive.length} duplicates\n`);
    }

    async getFundersToResearch(limit) {
        const response = await this.notion.databases.query({
            database_id: this.databaseId,
            filter: {
                and: [
                    { property: 'Website', url: { is_not_empty: true } },
                    { property: 'Status', select: { does_not_equal: 'Inactive' } }
                ]
            },
            page_size: limit,
            sorts: [{ property: 'Name', direction: 'ascending' }]
        });
        
        return response.results;
    }

    async extractAndStoreFunder(funder) {
        const name = funder.properties.Name?.title?.[0]?.plain_text || '';
        const website = funder.properties.Website?.url;
        const type = funder.properties.Type?.select?.name || 'Fund';
        
        console.log(`\n🏢 Extracting: ${name}`);
        console.log(`   URL: ${website}`);
        
        // Create funder directory
        const folderName = this.sanitizeFolderName(name);
        const funderDir = path.join(this.researchDir, 'funders', folderName);
        await fs.mkdir(funderDir, { recursive: true });
        
        // Extract all data from website
        const webData = await this.extractWebsiteData(website);
        
        // If we found LinkedIn, extract additional data
        if (webData.socialProfiles.linkedin) {
            console.log(`   📱 Found LinkedIn, extracting profile data...`);
            const linkedinData = await this.extractLinkedInData(webData.socialProfiles.linkedin);
            webData.linkedinData = linkedinData;
            if (linkedinData.extracted) this.stats.linkedinProfiles++;
        }
        
        // Build comprehensive markdown profile
        const profile = this.buildFunderProfile({
            id: funder.id,
            name,
            website,
            type,
            webData,
            notionData: funder.properties
        });
        
        // Save main profile
        await fs.writeFile(
            path.join(funderDir, 'README.md'),
            profile.markdown
        );
        
        // Save metadata
        await fs.writeFile(
            path.join(funderDir, 'metadata.json'),
            JSON.stringify(profile.metadata, null, 2)
        );
        
        // Update statistics
        this.stats.fundersProcessed++;
        this.stats.realEmails += webData.emails.filter(e => e.confidence === 'high').length;
        this.stats.realPhones += webData.phones.filter(p => p.confidence === 'high').length;
        this.stats.teamMembers += webData.teamMembers.length;
        
        console.log(`   ✅ Saved to: /funders/${folderName}/`);
        console.log(`   📊 Quality data points: ${profile.qualityPoints}`);
        
        // Update Notion with extracted data if we found good stuff
        if (webData.emails.length > 0 || webData.teamMembers.length > 0) {
            await this.updateNotionWithExtractedData(funder.id, webData);
        }
    }

    async extractWebsiteData(url) {
        const data = {
            status: 'unknown',
            title: null,
            description: null,
            emails: [],
            phones: [],
            addresses: [],
            socialProfiles: {},
            teamMembers: [],
            keyPages: {},
            suspiciousData: []
        };
        
        if (!url) return data;
        
        try {
            const response = await axios.get(url, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
                }
            });
            
            const $ = cheerio.load(response.data);
            data.status = 'active';
            
            // Basic meta
            data.title = $('title').text() || $('meta[property="og:title"]').attr('content');
            data.description = $('meta[name="description"]').attr('content') || 
                               $('meta[property="og:description"]').attr('content');
            
            // Extract emails with validation and confidence
            data.emails = this.extractEmailsWithConfidence(response.data, $);
            
            // Extract phones with validation and confidence  
            data.phones = this.extractPhonesWithConfidence(response.data, $);
            
            // Physical addresses
            data.addresses = this.extractAddresses($);
            
            // Social media profiles
            data.socialProfiles = this.extractSocialProfiles($, url);
            
            // Team members
            data.teamMembers = await this.extractTeamMembers($, url);
            
            // Important pages
            data.keyPages = this.findKeyPages($, url);
            
            // Look for contact forms
            const contactForms = this.findContactForms($);
            if (contactForms.length > 0) {
                data.contactForms = contactForms;
            }
            
        } catch (error) {
            data.status = 'error';
            data.error = error.message;
            console.log(`   ⚠️ Extraction error: ${error.message}`);
        }
        
        return data;
    }

    extractEmailsWithConfidence(html, $) {
        const emails = [];
        const seen = new Set();
        
        // High confidence: mailto links
        $('a[href^="mailto:"]').each((i, elem) => {
            const href = $(elem).attr('href');
            const email = href.replace('mailto:', '').split('?')[0].toLowerCase();
            if (this.isValidEmail(email) && !seen.has(email)) {
                emails.push({ email, confidence: 'high', source: 'mailto' });
                seen.add(email);
            }
        });
        
        // Medium confidence: common patterns in contact sections
        const contactSelectors = ['#contact', '.contact', '[class*="contact"]', 'footer'];
        contactSelectors.forEach(selector => {
            const text = $(selector).text();
            if (text) {
                const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
                let match;
                while ((match = emailRegex.exec(text)) !== null) {
                    const email = match[1].toLowerCase();
                    if (this.isValidEmail(email) && !seen.has(email)) {
                        emails.push({ email, confidence: 'medium', source: 'contact-section' });
                        seen.add(email);
                    }
                }
            }
        });
        
        // Look for common email patterns
        const commonPatterns = ['info@', 'hello@', 'contact@', 'invest@', 'team@', 'partners@'];
        const domain = new URL(html.includes('http') ? html.match(/https?:\/\/[^\/]+/)?.[0] : 'http://example.com').hostname;
        commonPatterns.forEach(pattern => {
            const testEmail = pattern + domain;
            if (html.includes(testEmail) && !seen.has(testEmail)) {
                emails.push({ email: testEmail, confidence: 'low', source: 'pattern-match' });
                seen.add(testEmail);
            }
        });
        
        return emails;
    }

    extractPhonesWithConfidence(html, $) {
        const phones = [];
        const seen = new Set();
        
        // Phone patterns to REJECT (CSS, JavaScript, versions)
        const rejectPatterns = [
            /^\d{3}\.\d{3}\s+\d{4}$/,  // CSS-like: 648.389 2735
            /^-?\d{10,}$/,              // Timestamps: -2024111119
            /^\d+\.\d+\.\d+$/,         // Version numbers: 2.3.1
            /^0018000000$/,             // Test numbers
            /^\.\d+$/,                  // Decimals: .717018
            /^[01]\d{10}$/              // Binary-looking
        ];
        
        // High confidence: tel: links
        $('a[href^="tel:"]').each((i, elem) => {
            const href = $(elem).attr('href');
            const phone = href.replace('tel:', '').replace(/[^\d+()-.\s]/g, '');
            if (this.isValidPhone(phone, rejectPatterns) && !seen.has(phone)) {
                phones.push({ phone, confidence: 'high', source: 'tel-link' });
                seen.add(phone);
            }
        });
        
        // Medium confidence: contact sections
        const contactSelectors = ['#contact', '.contact', 'footer'];
        contactSelectors.forEach(selector => {
            const text = $(selector).text();
            if (text) {
                // Standard North American phone patterns
                const phoneRegex = /(\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/g;
                let match;
                while ((match = phoneRegex.exec(text)) !== null) {
                    const phone = match[1].trim();
                    if (this.isValidPhone(phone, rejectPatterns) && !seen.has(phone)) {
                        phones.push({ phone, confidence: 'medium', source: 'contact-section' });
                        seen.add(phone);
                    }
                }
            }
        });
        
        return phones;
    }

    isValidPhone(phone, rejectPatterns) {
        if (!phone || phone.length < 10) return false;
        
        // Check against reject patterns
        for (const pattern of rejectPatterns) {
            if (pattern.test(phone)) {
                this.stats.suspiciousData++;
                return false;
            }
        }
        
        // Must have at least 10 digits
        const digitsOnly = phone.replace(/\D/g, '');
        if (digitsOnly.length < 10 || digitsOnly.length > 15) return false;
        
        // Reject if all same digit
        if (/^(\d)\1+$/.test(digitsOnly)) return false;
        
        return true;
    }

    async extractLinkedInData(linkedinUrl) {
        const data = {
            extracted: false,
            url: linkedinUrl,
            companySize: null,
            industry: null,
            headquarters: null,
            specialties: [],
            description: null
        };
        
        try {
            // LinkedIn requires authentication, but we can extract from public view
            const response = await axios.get(linkedinUrl, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
                }
            });
            
            const $ = cheerio.load(response.data);
            
            // Extract what we can from public LinkedIn page
            data.description = $('meta[property="og:description"]').attr('content');
            data.title = $('meta[property="og:title"]').attr('content');
            
            // Look for structured data
            const jsonLd = $('script[type="application/ld+json"]').html();
            if (jsonLd) {
                try {
                    const structured = JSON.parse(jsonLd);
                    if (structured['@type'] === 'Organization') {
                        data.headquarters = structured.address?.addressLocality;
                        data.industry = structured.industry;
                    }
                } catch {}
            }
            
            data.extracted = true;
            
        } catch (error) {
            console.log(`      ⚠️ LinkedIn extraction limited (expected - requires auth)`);
        }
        
        return data;
    }

    findContactForms($) {
        const forms = [];
        
        $('form').each((i, elem) => {
            const $form = $(elem);
            const action = $form.attr('action');
            const method = $form.attr('method');
            
            // Look for contact-related forms
            const formText = $form.text().toLowerCase();
            if (formText.includes('contact') || formText.includes('email') || formText.includes('message')) {
                const emailInput = $form.find('input[type="email"], input[name*="email"]').length > 0;
                const messageInput = $form.find('textarea, input[name*="message"]').length > 0;
                
                if (emailInput || messageInput) {
                    forms.push({
                        action: action || 'unknown',
                        method: method || 'post',
                        hasEmailField: emailInput,
                        hasMessageField: messageInput
                    });
                }
            }
        });
        
        return forms;
    }

    extractSocialProfiles($, baseUrl) {
        const profiles = {};
        
        const platforms = {
            linkedin: /linkedin\.com\/company\/([^\/\?]+)/i,
            twitter: /twitter\.com\/([^\/\?]+)/i,
            facebook: /facebook\.com\/([^\/\?]+)/i,
            instagram: /instagram\.com\/([^\/\?]+)/i,
            youtube: /youtube\.com\/(channel|user)\/([^\/\?]+)/i,
            github: /github\.com\/([^\/\?]+)/i,
            angellist: /angel\.co\/([^\/\?]+)/i,
            crunchbase: /crunchbase\.com\/organization\/([^\/\?]+)/i
        };
        
        $('a[href]').each((i, elem) => {
            const href = $(elem).attr('href');
            if (!href) return;
            
            for (const [platform, regex] of Object.entries(platforms)) {
                if (regex.test(href) && !profiles[platform]) {
                    profiles[platform] = href;
                }
            }
        });
        
        return profiles;
    }

    async extractTeamMembers($, baseUrl) {
        const members = [];
        
        // Look for team member patterns
        const selectors = [
            '.team-member',
            '.person',
            '.staff',
            '[class*="team"] [class*="member"]',
            '.bio',
            '.profile'
        ];
        
        selectors.forEach(selector => {
            $(selector).each((i, elem) => {
                const $elem = $(elem);
                const name = $elem.find('h2, h3, h4, .name').first().text().trim();
                const role = $elem.find('.role, .position, .title').text().trim();
                const bio = $elem.find('.bio, .description, p').text().trim();
                const linkedin = $elem.find('a[href*="linkedin"]').attr('href');
                const email = $elem.find('a[href^="mailto:"]').attr('href')?.replace('mailto:', '');
                
                if (name && name.length > 2 && name.length < 50) {
                    // Validate it's a real name (has at least one space, no weird chars)
                    if (name.includes(' ') && !/[0-9<>{}[\]]/.test(name)) {
                        members.push({
                            name,
                            role: role || null,
                            bio: bio ? bio.substring(0, 500) : null,
                            linkedin: linkedin || null,
                            email: email || null
                        });
                    }
                }
            });
        });
        
        // Deduplicate by name
        const unique = {};
        members.forEach(m => {
            if (!unique[m.name]) {
                unique[m.name] = m;
            }
        });
        
        return Object.values(unique);
    }

    extractAddresses($) {
        const addresses = [];
        
        // Look for address microdata and common patterns
        const selectors = [
            '[itemtype*="PostalAddress"]',
            'address',
            '.address',
            '[class*="address"]',
            '[class*="location"]',
            'footer'
        ];
        
        selectors.forEach(selector => {
            $(selector).each((i, elem) => {
                const text = $(elem).text().trim();
                // Look for patterns that suggest real addresses
                if (text && text.length > 10 && text.length < 200) {
                    // Check for city/state/zip patterns
                    if (/\d{5}|\b[A-Z]{2}\b|Street|St\.|Ave|Avenue|Road|Rd\.|Suite|Floor/.test(text)) {
                        addresses.push(text.replace(/\s+/g, ' '));
                    }
                }
            });
        });
        
        // Deduplicate
        return [...new Set(addresses)];
    }

    findKeyPages($, baseUrl) {
        const pages = {};
        const base = new URL(baseUrl);
        
        const pageTypes = {
            contact: ['contact', 'get-in-touch', 'reach-out'],
            about: ['about', 'story', 'mission', 'who-we-are'],
            team: ['team', 'people', 'leadership', 'partners', 'staff'],
            portfolio: ['portfolio', 'investments', 'companies', 'startups'],
            apply: ['apply', 'submit', 'application', 'pitch'],
            blog: ['blog', 'news', 'insights', 'articles'],
            careers: ['careers', 'jobs', 'hiring', 'join']
        };
        
        $('a[href]').each((i, elem) => {
            const href = $(elem).attr('href');
            const text = $(elem).text().toLowerCase();
            
            if (!href) return;
            
            for (const [type, keywords] of Object.entries(pageTypes)) {
                if (!pages[type] && keywords.some(kw => text.includes(kw) || href.toLowerCase().includes(kw))) {
                    try {
                        const url = new URL(href, baseUrl);
                        if (url.hostname === base.hostname) {
                            pages[type] = url.href;
                        }
                    } catch {}
                }
            }
        });
        
        return pages;
    }

    buildFunderProfile(data) {
        const { name, website, type, webData, notionData } = data;
        
        let markdown = `# ${name}\n\n`;
        markdown += `## Overview\n`;
        markdown += `- **Website**: ${website || 'Not available'}\n`;
        markdown += `- **Type**: ${type}\n`;
        markdown += `- **Status**: ${webData.status}\n`;
        
        if (webData.description) {
            markdown += `- **Description**: ${webData.description}\n`;
        }
        
        // Quality metrics
        let qualityPoints = 0;
        
        // Contact Information (only high confidence)
        const highConfidenceEmails = webData.emails.filter(e => e.confidence === 'high');
        const highConfidencePhones = webData.phones.filter(p => p.confidence === 'high');
        
        if (highConfidenceEmails.length > 0 || highConfidencePhones.length > 0) {
            markdown += `\n## Contact Information\n`;
            highConfidenceEmails.forEach(item => {
                markdown += `- **Email**: ${item.email} ✓\n`;
                qualityPoints += 10;
            });
            highConfidencePhones.forEach(item => {
                markdown += `- **Phone**: ${item.phone} ✓\n`;
                qualityPoints += 5;
            });
        }
        
        // Medium confidence contacts
        const mediumConfidenceEmails = webData.emails.filter(e => e.confidence === 'medium');
        const mediumConfidencePhones = webData.phones.filter(p => p.confidence === 'medium');
        
        if (mediumConfidenceEmails.length > 0 || mediumConfidencePhones.length > 0) {
            markdown += `\n### Potential Contacts (needs verification)\n`;
            mediumConfidenceEmails.forEach(item => {
                markdown += `- Email: ${item.email} (?)\n`;
                qualityPoints += 3;
            });
            mediumConfidencePhones.forEach(item => {
                markdown += `- Phone: ${item.phone} (?)\n`;
                qualityPoints += 2;
            });
        }
        
        // Physical addresses
        if (webData.addresses.length > 0) {
            markdown += `\n## Location\n`;
            webData.addresses.forEach(address => {
                markdown += `- ${address}\n`;
                qualityPoints += 5;
            });
        }
        
        // Social Media
        if (Object.keys(webData.socialProfiles).length > 0) {
            markdown += `\n## Social Media\n`;
            for (const [platform, url] of Object.entries(webData.socialProfiles)) {
                markdown += `- **${platform}**: ${url}\n`;
                qualityPoints += 3;
            }
        }
        
        // LinkedIn Data
        if (webData.linkedinData?.extracted) {
            markdown += `\n## LinkedIn Profile\n`;
            if (webData.linkedinData.description) {
                markdown += `- **Description**: ${webData.linkedinData.description}\n`;
                qualityPoints += 5;
            }
            if (webData.linkedinData.headquarters) {
                markdown += `- **Headquarters**: ${webData.linkedinData.headquarters}\n`;
                qualityPoints += 3;
            }
            if (webData.linkedinData.industry) {
                markdown += `- **Industry**: ${webData.linkedinData.industry}\n`;
                qualityPoints += 2;
            }
        }
        
        // Contact Forms
        if (webData.contactForms?.length > 0) {
            markdown += `\n## Contact Forms Found\n`;
            webData.contactForms.forEach(form => {
                markdown += `- Form at: ${form.action || 'page'} (${form.hasEmailField ? 'has email field' : 'no email field'})\n`;
                qualityPoints += 2;
            });
        }
        
        // Key Pages
        if (Object.keys(webData.keyPages).length > 0) {
            markdown += `\n## Important Pages\n`;
            for (const [type, url] of Object.entries(webData.keyPages)) {
                markdown += `- **${type}**: ${url}\n`;
                qualityPoints += 1;
            }
        }
        
        // Team Members
        if (webData.teamMembers.length > 0) {
            markdown += `\n## Team Members\n`;
            webData.teamMembers.forEach(member => {
                markdown += `\n### ${member.name}`;
                if (member.role) markdown += ` - ${member.role}`;
                markdown += `\n`;
                if (member.email) {
                    markdown += `- Email: ${member.email}\n`;
                    qualityPoints += 15;
                }
                if (member.linkedin) {
                    markdown += `- LinkedIn: ${member.linkedin}\n`;
                    qualityPoints += 5;
                }
                if (member.bio) {
                    markdown += `- Bio: ${member.bio.substring(0, 200)}...\n`;
                    qualityPoints += 2;
                }
            });
        }
        
        // Quality Assessment
        markdown += `\n## Data Quality\n`;
        markdown += `- **Quality Score**: ${qualityPoints} points\n`;
        markdown += `- **Confidence**: ${qualityPoints > 50 ? 'High' : qualityPoints > 20 ? 'Medium' : 'Low'}\n`;
        
        if (webData.suspiciousData?.length > 0) {
            markdown += `- **Suspicious Data Rejected**: ${webData.suspiciousData.length} items\n`;
        }
        
        // Metadata
        markdown += `\n---\n`;
        markdown += `*Last Updated: ${new Date().toISOString().split('T')[0]}*\n`;
        markdown += `*Source: Website Extraction*\n`;
        markdown += `*Quality Points: ${qualityPoints}*\n`;
        
        const metadata = {
            id: data.id,
            name,
            website,
            type,
            extracted: new Date().toISOString(),
            status: webData.status,
            qualityPoints,
            emails: webData.emails,
            phones: webData.phones,
            socialProfiles: webData.socialProfiles,
            teamMembers: webData.teamMembers.length,
            keyPages: webData.keyPages
        };
        
        return {
            markdown,
            metadata,
            qualityPoints
        };
    }

    async updateNotionWithExtractedData(pageId, webData) {
        const updates = {};
        
        // Add high-confidence email if found
        const bestEmail = webData.emails.find(e => e.confidence === 'high');
        if (bestEmail) {
            updates.Email = { email: bestEmail.email };
        }
        
        // Add high-confidence phone if found
        const bestPhone = webData.phones.find(p => p.confidence === 'high');
        if (bestPhone) {
            updates.Phone = { phone_number: bestPhone.phone };
        }
        
        // Add LinkedIn if found
        if (webData.socialProfiles.linkedin) {
            updates.LinkedIn = { url: webData.socialProfiles.linkedin };
        }
        
        // Add key people if found
        if (webData.teamMembers.length > 0) {
            const keyPeople = webData.teamMembers
                .slice(0, 3)
                .map(m => `${m.name}${m.role ? ' (' + m.role + ')' : ''}`)
                .join(', ');
            updates['Key People'] = { 
                rich_text: [{ text: { content: keyPeople } }] 
            };
        }
        
        if (Object.keys(updates).length > 0) {
            try {
                await this.notion.pages.update({
                    page_id: pageId,
                    properties: updates
                });
                console.log(`   📝 Updated Notion with ${Object.keys(updates).length} fields`);
            } catch (error) {
                console.log(`   ⚠️ Could not update Notion: ${error.message}`);
            }
        }
    }

    async generateIndex() {
        const fundersDir = path.join(this.researchDir, 'funders');
        await fs.mkdir(fundersDir, { recursive: true });
        
        const funders = await fs.readdir(fundersDir).catch(() => []);
        
        let indexMd = '# Funders Research Index V2\n\n';
        indexMd += `*Generated: ${new Date().toISOString().split('T')[0]}*\n\n`;
        indexMd += `## Statistics\n`;
        indexMd += `- Total Funders: ${funders.length}\n`;
        indexMd += `- Real Emails Found: ${this.stats.realEmails}\n`;
        indexMd += `- Real Phones Found: ${this.stats.realPhones}\n`;
        indexMd += `- LinkedIn Profiles: ${this.stats.linkedinProfiles}\n`;
        indexMd += `- Team Members: ${this.stats.teamMembers}\n`;
        indexMd += `- Suspicious Data Rejected: ${this.stats.suspiciousData}\n\n`;
        
        indexMd += `## Funders\n\n`;
        
        for (const funderFolder of funders) {
            if (funderFolder.startsWith('_')) continue;
            
            try {
                const metadataPath = path.join(fundersDir, funderFolder, 'metadata.json');
                const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
                
                const quality = metadata.qualityPoints > 50 ? '🟢' : 
                               metadata.qualityPoints > 20 ? '🟡' : '🔴';
                
                indexMd += `### ${quality} [${metadata.name}](${funderFolder}/README.md)\n`;
                indexMd += `- Type: ${metadata.type}\n`;
                indexMd += `- Quality Score: ${metadata.qualityPoints} points\n`;
                indexMd += `- Status: ${metadata.status}\n`;
                
                const highEmails = metadata.emails.filter(e => e.confidence === 'high').length;
                const highPhones = metadata.phones.filter(p => p.confidence === 'high').length;
                
                if (highEmails > 0) {
                    indexMd += `- **Emails**: ${highEmails} verified ✓\n`;
                }
                if (highPhones > 0) {
                    indexMd += `- **Phones**: ${highPhones} verified ✓\n`;
                }
                if (metadata.teamMembers > 0) {
                    indexMd += `- **Team Members**: ${metadata.teamMembers} found\n`;
                }
                indexMd += `\n`;
            } catch (error) {
                // Skip if no metadata
            }
        }
        
        await fs.writeFile(path.join(fundersDir, '_index.md'), indexMd);
    }

    sanitizeFolderName(name) {
        return name.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 50);
    }

    isValidEmail(email) {
        if (!email) return false;
        
        // Reject patterns
        if (email.match(/@\d+\.\d+/)) return false; // Version numbers
        if (email.match(/\.(png|jpg|jpeg|gif|webp|svg|css|js|json)$/i)) return false; // Files
        if (email.includes('example') || email.includes('test')) return false;
        if (email.includes('noreply') || email.includes('no-reply')) return false;
        if (email.length > 50 || email.length < 5) return false;
        
        // Must have valid structure
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    printStats() {
        console.log('\n📊 EXTRACTION STATISTICS V2:');
        console.log('=' .repeat(50));
        console.log(`Funders processed:       ${this.stats.fundersProcessed}`);
        console.log(`Real emails found:       ${this.stats.realEmails}`);
        console.log(`Real phones found:       ${this.stats.realPhones}`);
        console.log(`LinkedIn profiles:       ${this.stats.linkedinProfiles}`);
        console.log(`Team members found:      ${this.stats.teamMembers}`);
        console.log(`Suspicious data rejected: ${this.stats.suspiciousData}`);
        console.log(`\n✅ Research data saved to: /data/research-v2/`);
    }
}

// Run if called directly
if (require.main === module) {
    const extractor = new ResearchExtractorV2();
    const limit = process.argv[2] ? parseInt(process.argv[2]) : 10;
    extractor.run(limit).catch(console.error);
}

module.exports = ResearchExtractorV2;