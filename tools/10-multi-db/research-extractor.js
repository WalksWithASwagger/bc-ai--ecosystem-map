#!/usr/bin/env node

/**
 * Research Extractor & Local Markdown Store
 * 
 * Extracts ALL available data from web sources and saves to local markdown files
 * Philosophy: One visit = Complete extraction = Permanent local record
 */

const { Client } = require('@notionhq/client');
require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');

class ResearchExtractor {
    constructor() {
        this.notion = new Client({
            auth: process.env.NOTION_TOKEN
        });
        this.databaseId = '246c6f799a3381eea3f1e329b7120b44';
        
        this.researchDir = path.join(__dirname, '../../data/research');
        this.stats = {
            fundersProcessed: 0,
            dataPointsExtracted: 0,
            peopleFound: 0,
            companiesFound: 0
        };
    }

    async run(limit = 5) {
        console.log('🔬 RESEARCH EXTRACTOR - LOCAL MARKDOWN STORE\n');
        console.log('=' .repeat(50));
        console.log('Philosophy: Extract EVERYTHING, store locally\n');
        
        const funders = await this.getFundersToResearch(limit);
        console.log(`📊 Processing ${funders.length} funders\n`);
        
        for (const funder of funders) {
            await this.extractAndStoreFunder(funder);
            await this.sleep(2000); // Rate limiting
        }
        
        await this.generateIndex();
        this.printStats();
    }

    async getFundersToResearch(limit) {
        const response = await this.notion.databases.query({
            database_id: this.databaseId,
            filter: {
                property: 'Website',
                url: { is_not_empty: true }
            },
            page_size: limit,
            sorts: [{ property: 'Name', direction: 'ascending' }]
        });
        
        return response.results;
    }

    async extractAndStoreFunder(funder) {
        const name = funder.properties.Name?.title?.[0]?.plain_text || '';
        const website = funder.properties.Website?.url;
        const type = funder.properties.Type?.select?.name || 'Unknown';
        
        console.log(`\n🏢 Extracting: ${name}`);
        console.log(`   URL: ${website}`);
        
        // Create funder directory
        const folderName = this.sanitizeFolderName(name);
        const funderDir = path.join(this.researchDir, 'funders', folderName);
        await fs.mkdir(funderDir, { recursive: true });
        await fs.mkdir(path.join(funderDir, 'contacts'), { recursive: true });
        await fs.mkdir(path.join(funderDir, 'social'), { recursive: true });
        
        // Extract all data from website
        const webData = await this.extractWebsiteData(website);
        
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
        
        // Extract and save contacts if found
        if (webData.teamMembers && webData.teamMembers.length > 0) {
            for (const person of webData.teamMembers) {
                await this.savePersonProfile(person, funderDir);
                this.stats.peopleFound++;
            }
        }
        
        // Save social media data if found
        if (webData.socialProfiles) {
            await this.saveSocialData(webData.socialProfiles, funderDir);
        }
        
        this.stats.fundersProcessed++;
        this.stats.dataPointsExtracted += profile.dataPoints;
        
        console.log(`   ✅ Saved to: /funders/${folderName}/`);
        console.log(`   📊 Data points extracted: ${profile.dataPoints}`);
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
            meta: {},
            content: {},
            dataPoints: 0
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
            
            // Extract everything we can find
            
            // Basic meta
            data.title = $('title').text() || $('meta[property="og:title"]').attr('content');
            data.description = $('meta[name="description"]').attr('content') || 
                               $('meta[property="og:description"]').attr('content');
            data.dataPoints += 2;
            
            // Emails (with validation)
            const emails = this.extractEmails(response.data);
            data.emails = emails;
            data.dataPoints += emails.length;
            
            // Phone numbers
            const phones = this.extractPhones(response.data);
            data.phones = phones;
            data.dataPoints += phones.length;
            
            // Physical addresses
            const addresses = this.extractAddresses($);
            data.addresses = addresses;
            data.dataPoints += addresses.length;
            
            // Social media profiles
            data.socialProfiles = this.extractSocialProfiles($, url);
            data.dataPoints += Object.keys(data.socialProfiles).length;
            
            // Team members (from team/about pages)
            data.teamMembers = await this.extractTeamMembers($, url);
            data.dataPoints += data.teamMembers.length * 3; // Each person = multiple data points
            
            // Important pages
            data.keyPages = this.findKeyPages($, url);
            data.dataPoints += Object.keys(data.keyPages).length;
            
            // Meta tags for additional context
            $('meta').each((i, elem) => {
                const name = $(elem).attr('name') || $(elem).attr('property');
                const content = $(elem).attr('content');
                if (name && content) {
                    data.meta[name] = content;
                    data.dataPoints++;
                }
            });
            
            // Extract key content sections
            data.content = {
                about: this.extractSection($, ['#about', '.about', '[class*="about"]']),
                mission: this.extractSection($, ['#mission', '.mission', '[class*="mission"]']),
                team: this.extractSection($, ['#team', '.team', '[class*="team"]']),
                portfolio: this.extractSection($, ['#portfolio', '.portfolio', '[class*="portfolio"]']),
                contact: this.extractSection($, ['#contact', '.contact', '[class*="contact"]'])
            };
            
            Object.values(data.content).forEach(content => {
                if (content) data.dataPoints++;
            });
            
        } catch (error) {
            data.status = 'error';
            data.error = error.message;
            console.log(`   ⚠️ Extraction error: ${error.message}`);
        }
        
        return data;
    }

    extractEmails(html) {
        const emails = new Set();
        
        // Mailto links
        const mailtoRegex = /mailto:([^"'>\s]+)/gi;
        let match;
        while ((match = mailtoRegex.exec(html)) !== null) {
            if (this.isValidEmail(match[1])) {
                emails.add(match[1].toLowerCase());
            }
        }
        
        // Email patterns in text
        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        while ((match = emailRegex.exec(html)) !== null) {
            if (this.isValidEmail(match[0])) {
                emails.add(match[0].toLowerCase());
            }
        }
        
        return Array.from(emails);
    }

    extractPhones(html) {
        const phones = new Set();
        const phoneRegex = /(\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/g;
        let match;
        
        while ((match = phoneRegex.exec(html)) !== null) {
            const phone = match[0].trim();
            if (phone.length >= 10) {
                phones.add(phone);
            }
        }
        
        return Array.from(phones);
    }

    extractAddresses($) {
        const addresses = [];
        
        // Look for address microdata
        $('[itemtype*="PostalAddress"], address, .address, [class*="address"]').each((i, elem) => {
            const text = $(elem).text().trim();
            if (text && text.length > 10 && text.length < 200) {
                addresses.push(text);
            }
        });
        
        return addresses;
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
                const name = $elem.find('h2, h3, h4, .name, .title').first().text().trim();
                const role = $elem.find('.role, .position, .title').text().trim();
                const bio = $elem.find('.bio, .description, p').text().trim();
                const image = $elem.find('img').attr('src');
                const linkedin = $elem.find('a[href*="linkedin"]').attr('href');
                
                if (name && name.length > 2 && name.length < 50) {
                    members.push({
                        name,
                        role: role || null,
                        bio: bio ? bio.substring(0, 500) : null,
                        image: image ? new URL(image, baseUrl).href : null,
                        linkedin: linkedin || null
                    });
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

    extractSection($, selectors) {
        for (const selector of selectors) {
            const elem = $(selector).first();
            if (elem.length) {
                const text = elem.text().trim();
                if (text && text.length > 20) {
                    return text.substring(0, 2000); // Limit length
                }
            }
        }
        return null;
    }

    findKeyPages($, baseUrl) {
        const pages = {};
        const base = new URL(baseUrl);
        
        const pageTypes = {
            contact: ['contact', 'get-in-touch', 'reach'],
            about: ['about', 'story', 'mission'],
            team: ['team', 'people', 'leadership', 'partners'],
            portfolio: ['portfolio', 'investments', 'companies'],
            apply: ['apply', 'submit', 'application'],
            blog: ['blog', 'news', 'insights'],
            careers: ['careers', 'jobs', 'hiring']
        };
        
        $('a[href]').each((i, elem) => {
            const href = $(elem).attr('href');
            const text = $(elem).text().toLowerCase();
            
            if (!href) return;
            
            for (const [type, keywords] of Object.entries(pageTypes)) {
                if (!pages[type] && keywords.some(kw => text.includes(kw) || href.includes(kw))) {
                    try {
                        const url = new URL(href, baseUrl);
                        if (url.hostname === base.hostname) {
                            pages[type] = url.pathname;
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
        
        // Contact Information
        if (webData.emails.length > 0 || webData.phones.length > 0) {
            markdown += `\n## Contact Information\n`;
            webData.emails.forEach(email => {
                markdown += `- **Email**: ${email}\n`;
            });
            webData.phones.forEach(phone => {
                markdown += `- **Phone**: ${phone}\n`;
            });
            webData.addresses.forEach(address => {
                markdown += `- **Address**: ${address}\n`;
            });
        }
        
        // Social Media
        if (Object.keys(webData.socialProfiles).length > 0) {
            markdown += `\n## Social Media\n`;
            for (const [platform, url] of Object.entries(webData.socialProfiles)) {
                markdown += `- **${platform}**: ${url}\n`;
            }
        }
        
        // Key Pages
        if (Object.keys(webData.keyPages).length > 0) {
            markdown += `\n## Important Pages\n`;
            for (const [type, path] of Object.entries(webData.keyPages)) {
                markdown += `- **${type}**: ${website}${path}\n`;
            }
        }
        
        // Team Members
        if (webData.teamMembers.length > 0) {
            markdown += `\n## Team Members\n`;
            webData.teamMembers.forEach(member => {
                markdown += `- **${member.name}**`;
                if (member.role) markdown += ` - ${member.role}`;
                markdown += `\n`;
                if (member.linkedin) {
                    markdown += `  - LinkedIn: ${member.linkedin}\n`;
                }
            });
        }
        
        // Content Sections
        if (webData.content.about) {
            markdown += `\n## About\n${webData.content.about.substring(0, 500)}...\n`;
        }
        
        // Metadata
        markdown += `\n---\n`;
        markdown += `*Last Updated: ${new Date().toISOString().split('T')[0]}*\n`;
        markdown += `*Source: Website Extraction*\n`;
        markdown += `*Data Points: ${webData.dataPoints}*\n`;
        
        const metadata = {
            id: data.id,
            name,
            website,
            type,
            extracted: new Date().toISOString(),
            status: webData.status,
            dataPoints: webData.dataPoints,
            emails: webData.emails,
            socialProfiles: webData.socialProfiles,
            keyPages: webData.keyPages
        };
        
        return {
            markdown,
            metadata,
            dataPoints: webData.dataPoints
        };
    }

    async savePersonProfile(person, funderDir) {
        const personFile = this.sanitizeFolderName(person.name) + '.md';
        const personPath = path.join(funderDir, 'contacts', personFile);
        
        let markdown = `# ${person.name}\n\n`;
        if (person.role) markdown += `**${person.role}**\n\n`;
        if (person.bio) markdown += `## Bio\n${person.bio}\n\n`;
        if (person.linkedin) markdown += `## Links\n- LinkedIn: ${person.linkedin}\n\n`;
        if (person.image) markdown += `## Photo\n![${person.name}](${person.image})\n\n`;
        
        markdown += `---\n*Extracted: ${new Date().toISOString().split('T')[0]}*\n`;
        
        await fs.writeFile(personPath, markdown);
        
        // Also save to global people directory
        const globalPersonDir = path.join(this.researchDir, 'people', this.sanitizeFolderName(person.name));
        await fs.mkdir(globalPersonDir, { recursive: true });
        await fs.writeFile(path.join(globalPersonDir, 'README.md'), markdown);
    }

    async saveSocialData(socialProfiles, funderDir) {
        const socialPath = path.join(funderDir, 'social', 'profiles.json');
        await fs.writeFile(socialPath, JSON.stringify(socialProfiles, null, 2));
    }

    async generateIndex() {
        // Generate master index for funders
        const fundersDir = path.join(this.researchDir, 'funders');
        const funders = await fs.readdir(fundersDir);
        
        let indexMd = '# Funders Index\n\n';
        indexMd += `*Generated: ${new Date().toISOString().split('T')[0]}*\n\n`;
        indexMd += `Total Funders: ${funders.length}\n\n`;
        
        for (const funderFolder of funders) {
            if (funderFolder.startsWith('_')) continue;
            
            try {
                const metadataPath = path.join(fundersDir, funderFolder, 'metadata.json');
                const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
                
                indexMd += `## [${metadata.name}](${funderFolder}/README.md)\n`;
                indexMd += `- Type: ${metadata.type}\n`;
                indexMd += `- Data Points: ${metadata.dataPoints}\n`;
                indexMd += `- Status: ${metadata.status}\n`;
                if (metadata.emails.length > 0) {
                    indexMd += `- Emails: ${metadata.emails.length} found\n`;
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
        if (email.match(/@\d+\.\d+/)) return false; // No version numbers
        if (email.match(/\.(png|jpg|jpeg|gif|webp|svg|css|js)$/i)) return false; // No files
        if (email.includes('example') || email.includes('test')) return false;
        if (email.length > 50) return false;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    printStats() {
        console.log('\n📊 EXTRACTION STATISTICS:');
        console.log('=' .repeat(50));
        console.log(`Funders processed:     ${this.stats.fundersProcessed}`);
        console.log(`Data points extracted: ${this.stats.dataPointsExtracted}`);
        console.log(`People found:          ${this.stats.peopleFound}`);
        console.log(`Average per funder:    ${Math.round(this.stats.dataPointsExtracted / this.stats.fundersProcessed)}`);
        console.log(`\n✅ Research data saved to: /data/research/`);
    }
}

// Run if called directly
if (require.main === module) {
    const extractor = new ResearchExtractor();
    const limit = process.argv[2] ? parseInt(process.argv[2]) : 5;
    extractor.run(limit).catch(console.error);
}

module.exports = ResearchExtractor;