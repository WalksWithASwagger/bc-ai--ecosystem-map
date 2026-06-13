#!/usr/bin/env node

/**
 * People Finder - Web Search Based Contact Discovery
 * 
 * Uses web search to find actual people at funding organizations
 * Builds a local knowledge base of contacts
 */

const { Client } = require('@notionhq/client');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class PeopleFinder {
    constructor() {
        this.notion = new Client({
            auth: process.env.NOTION_TOKEN || '<REDACTED_NOTION_TOKEN>'
        });
        this.databaseId = '246c6f799a3381eea3f1e329b7120b44';
        
        this.peopleDir = path.join(__dirname, '../../data/people');
        this.stats = {
            fundersProcessed: 0,
            peopleFound: 0,
            emailsFound: 0,
            linkedInFound: 0,
            patternsIdentified: 0
        };
    }

    async run(limit = 10) {
        console.log('🔍 PEOPLE FINDER - Web Search Contact Discovery\n');
        console.log('=' .repeat(50));
        console.log('Strategy: Web search for partners, emails, LinkedIn profiles\n');
        
        // Get top funders to research
        const funders = await this.getTopFunders(limit);
        console.log(`📊 Processing ${funders.length} funders\n`);
        
        for (const funder of funders) {
            await this.findPeopleForFunder(funder);
            await this.sleep(5000); // Rate limiting for web searches
        }
        
        await this.generatePeopleIndex();
        this.printStats();
    }

    async getTopFunders(limit) {
        const response = await this.notion.databases.query({
            database_id: this.databaseId,
            filter: {
                and: [
                    { property: 'Website', url: { is_not_empty: true } },
                    { property: 'Type', select: { equals: 'VC' } }
                ]
            },
            sorts: [
                { property: 'Priority', direction: 'descending' },
                { property: 'Name', direction: 'ascending' }
            ],
            page_size: limit
        });
        
        return response.results;
    }

    async findPeopleForFunder(funder) {
        const name = funder.properties.Name?.title?.[0]?.plain_text || '';
        const website = funder.properties.Website?.url;
        
        console.log(`\n🏢 Finding people at: ${name}`);
        console.log(`   Website: ${website}`);
        
        const people = [];
        
        // Search 1: Find partners/team on LinkedIn
        const linkedInSearch = await this.searchWeb(
            `"${name}" "partner" OR "managing director" OR "principal" site:linkedin.com/in/`
        );
        
        // Search 2: Find email patterns
        const emailSearch = await this.searchWeb(
            `"${name}" email "@" contact "venture" OR "invest"`
        );
        
        // Search 3: Team page search
        const teamSearch = await this.searchWeb(
            `"${name}" "our team" OR "meet the team" OR "partners" OR "leadership"`
        );
        
        // Search 4: Recent investment announcements (often have contact info)
        const newsSearch = await this.searchWeb(
            `"${name}" "led the round" OR "investment" contact email 2024 OR 2025`
        );
        
        // Parse search results
        const extractedPeople = await this.parseSearchResults({
            linkedInSearch,
            emailSearch,
            teamSearch,
            newsSearch,
            funderName: name,
            website
        });
        
        // Save people data
        if (extractedPeople.length > 0) {
            await this.savePeopleData(name, extractedPeople);
            this.stats.peopleFound += extractedPeople.length;
            
            // Update Notion with key people
            await this.updateNotionWithPeople(funder.id, extractedPeople);
        }
        
        console.log(`   ✅ Found ${extractedPeople.length} people`);
        
        this.stats.fundersProcessed++;
    }

    async searchWeb(query) {
        console.log(`   🔎 Searching: ${query.substring(0, 50)}...`);
        
        // This is a placeholder for actual web search
        // In production, you'd use:
        // - Google Custom Search API
        // - Bing Search API
        // - SerpAPI
        // - Or web scraping with Puppeteer
        
        const mockResults = {
            query,
            results: []
        };
        
        // For now, return structured mock data
        // Replace this with actual API calls
        if (query.includes('linkedin.com')) {
            mockResults.results = [
                {
                    title: 'John Smith - Partner at Example VC',
                    url: 'https://linkedin.com/in/johnsmith',
                    snippet: 'Partner at Example VC. Previously at Google Ventures...'
                }
            ];
        }
        
        return mockResults;
    }

    async parseSearchResults(searches) {
        const people = [];
        const seen = new Set();
        
        // Parse LinkedIn results
        if (searches.linkedInSearch?.results) {
            for (const result of searches.linkedInSearch.results) {
                const person = this.parseLinkedInResult(result);
                if (person && !seen.has(person.name)) {
                    people.push(person);
                    seen.add(person.name);
                    this.stats.linkedInFound++;
                }
            }
        }
        
        // Parse email search results
        if (searches.emailSearch?.results) {
            for (const result of searches.emailSearch.results) {
                const emails = this.extractEmailsFromText(result.snippet || result.title);
                const emailDomain = this.extractEmailDomain(emails);
                
                if (emailDomain) {
                    // Store email pattern for the company
                    this.stats.patternsIdentified++;
                    
                    // Try to match emails to people
                    for (const person of people) {
                        if (!person.email && emailDomain) {
                            person.emailPattern = this.guessEmailPattern(person.name, emailDomain);
                        }
                    }
                }
                
                // Also look for new people mentioned with emails
                const newPerson = this.parseEmailResult(result);
                if (newPerson && !seen.has(newPerson.name)) {
                    people.push(newPerson);
                    seen.add(newPerson.name);
                    if (newPerson.email) this.stats.emailsFound++;
                }
            }
        }
        
        return people;
    }

    parseLinkedInResult(result) {
        // Extract name and role from LinkedIn search result
        const titleMatch = result.title?.match(/^([^-]+)\s*-\s*(.+?)(?:\s*at\s*|\s*@\s*|\s*-\s*)(.+)/);
        
        if (titleMatch) {
            return {
                name: titleMatch[1].trim(),
                role: titleMatch[2].trim(),
                company: titleMatch[3].trim(),
                linkedIn: result.url,
                source: 'LinkedIn'
            };
        }
        
        return null;
    }

    parseEmailResult(result) {
        // Try to extract person info from email search results
        const text = result.title + ' ' + result.snippet;
        const emails = this.extractEmailsFromText(text);
        
        if (emails.length > 0) {
            // Try to find associated name
            const namePattern = /(?:contact|email|reach)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/;
            const nameMatch = text.match(namePattern);
            
            if (nameMatch) {
                return {
                    name: nameMatch[1],
                    email: emails[0],
                    source: 'Web Search'
                };
            }
        }
        
        return null;
    }

    extractEmailsFromText(text) {
        const emails = [];
        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        let match;
        
        while ((match = emailRegex.exec(text)) !== null) {
            const email = match[0].toLowerCase();
            if (this.isValidEmail(email)) {
                emails.push(email);
            }
        }
        
        return emails;
    }

    extractEmailDomain(emails) {
        if (emails.length > 0) {
            const domain = emails[0].split('@')[1];
            if (domain && !domain.includes('gmail') && !domain.includes('yahoo')) {
                return domain;
            }
        }
        return null;
    }

    guessEmailPattern(name, domain) {
        const names = name.toLowerCase().split(/\s+/);
        const first = names[0];
        const last = names[names.length - 1];
        
        return [
            `${first}@${domain}`,
            `${first}.${last}@${domain}`,
            `${first}${last}@${domain}`,
            `${first[0]}${last}@${domain}`,
            `${first}${last[0]}@${domain}`
        ];
    }

    isValidEmail(email) {
        if (!email) return false;
        if (email.includes('example') || email.includes('test')) return false;
        if (email.length > 50) return false;
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
    }

    async savePeopleData(funderName, people) {
        const folderName = this.sanitizeFolderName(funderName);
        const funderPeopleDir = path.join(this.peopleDir, 'by-fund', folderName);
        await fs.mkdir(funderPeopleDir, { recursive: true });
        
        // Save each person
        for (const person of people) {
            const personFileName = this.sanitizeFolderName(person.name) + '.md';
            const personPath = path.join(funderPeopleDir, personFileName);
            
            let markdown = `# ${person.name}\n\n`;
            markdown += `## Professional Info\n`;
            markdown += `- **Company**: ${funderName}\n`;
            if (person.role) markdown += `- **Role**: ${person.role}\n`;
            if (person.linkedIn) markdown += `- **LinkedIn**: ${person.linkedIn}\n`;
            
            markdown += `\n## Contact\n`;
            if (person.email) {
                markdown += `- **Email**: ${person.email} ✓\n`;
            } else if (person.emailPattern) {
                markdown += `### Possible Email Patterns:\n`;
                person.emailPattern.forEach(pattern => {
                    markdown += `- ${pattern}\n`;
                });
            }
            
            markdown += `\n---\n`;
            markdown += `*Source: ${person.source || 'Web Search'}*\n`;
            markdown += `*Updated: ${new Date().toISOString().split('T')[0]}*\n`;
            
            await fs.writeFile(personPath, markdown);
            
            // Also save to global people directory
            const globalPersonDir = path.join(this.peopleDir, 'all', this.sanitizeFolderName(person.name));
            await fs.mkdir(globalPersonDir, { recursive: true });
            await fs.writeFile(path.join(globalPersonDir, 'profile.md'), markdown);
            
            // Save JSON metadata
            await fs.writeFile(
                path.join(globalPersonDir, 'metadata.json'),
                JSON.stringify(person, null, 2)
            );
        }
        
        // Create fund summary
        const summaryPath = path.join(funderPeopleDir, '_summary.md');
        let summary = `# ${funderName} - Key People\n\n`;
        summary += `Total: ${people.length} people found\n\n`;
        
        for (const person of people) {
            summary += `## ${person.name}\n`;
            if (person.role) summary += `- ${person.role}\n`;
            if (person.email) summary += `- Email: ${person.email}\n`;
            if (person.linkedIn) summary += `- [LinkedIn](${person.linkedIn})\n`;
            summary += `\n`;
        }
        
        await fs.writeFile(summaryPath, summary);
    }

    async updateNotionWithPeople(funderId, people) {
        if (people.length === 0) return;
        
        // Format key people for Notion
        const keyPeopleText = people
            .slice(0, 5)
            .map(p => {
                let text = p.name;
                if (p.role) text += ` (${p.role})`;
                if (p.email) text += ` - ${p.email}`;
                return text;
            })
            .join('\n');
        
        try {
            await this.notion.pages.update({
                page_id: funderId,
                properties: {
                    'Notes': {
                        rich_text: [{
                            text: {
                                content: `Key People:\n${keyPeopleText}`
                            }
                        }]
                    }
                }
            });
            console.log(`   📝 Updated Notion with ${people.length} people`);
        } catch (error) {
            console.log(`   ⚠️ Could not update Notion: ${error.message}`);
        }
    }

    async generatePeopleIndex() {
        const indexPath = path.join(this.peopleDir, 'INDEX.md');
        
        let index = `# People Directory\n\n`;
        index += `*Generated: ${new Date().toISOString().split('T')[0]}*\n\n`;
        index += `## Statistics\n`;
        index += `- Total People Found: ${this.stats.peopleFound}\n`;
        index += `- With Emails: ${this.stats.emailsFound}\n`;
        index += `- With LinkedIn: ${this.stats.linkedInFound}\n`;
        index += `- Email Patterns Identified: ${this.stats.patternsIdentified}\n\n`;
        
        // List all people
        const allPeopleDir = path.join(this.peopleDir, 'all');
        await fs.mkdir(allPeopleDir, { recursive: true });
        
        try {
            const people = await fs.readdir(allPeopleDir);
            index += `## All People (${people.length})\n\n`;
            
            for (const personDir of people) {
                const metadataPath = path.join(allPeopleDir, personDir, 'metadata.json');
                try {
                    const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
                    index += `- [${metadata.name}](all/${personDir}/profile.md)`;
                    if (metadata.role) index += ` - ${metadata.role}`;
                    if (metadata.email) index += ` ✉️`;
                    if (metadata.linkedIn) index += ` 💼`;
                    index += `\n`;
                } catch {}
            }
        } catch {}
        
        await fs.writeFile(indexPath, index);
    }

    sanitizeFolderName(name) {
        return name.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 50);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    printStats() {
        console.log('\n📊 PEOPLE FINDER STATISTICS:');
        console.log('=' .repeat(50));
        console.log(`Funders processed:     ${this.stats.fundersProcessed}`);
        console.log(`People found:          ${this.stats.peopleFound}`);
        console.log(`Emails found:          ${this.stats.emailsFound}`);
        console.log(`LinkedIn profiles:     ${this.stats.linkedInFound}`);
        console.log(`Email patterns:        ${this.stats.patternsIdentified}`);
        console.log(`\n✅ People data saved to: /data/people/`);
    }
}

// Run if called directly
if (require.main === module) {
    const finder = new PeopleFinder();
    const limit = process.argv[2] ? parseInt(process.argv[2]) : 10;
    finder.run(limit).catch(console.error);
}

module.exports = PeopleFinder;