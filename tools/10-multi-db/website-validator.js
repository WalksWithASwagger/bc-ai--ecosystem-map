#!/usr/bin/env node

/**
 * Website Validator & Social Discovery Tool
 * 
 * Validates all funder websites and extracts:
 * - Social media links
 * - Important page URLs
 * - Contact information locations
 * - RSS/Blog feeds
 */

const { Client } = require('@notionhq/client');
require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');

class WebsiteValidator {
    constructor() {
        this.notion = new Client({
            auth: process.env.NOTION_TOKEN
        });
        this.databaseId = '246c6f799a3381eea3f1e329b7120b44';
        
        this.stats = {
            total: 0,
            active: 0,
            dead: 0,
            redirect: 0,
            socialFound: 0,
            contactFound: 0
        };
        
        this.results = [];
    }

    async run(limit = 20) {
        console.log('🌐 WEBSITE VALIDATOR & SOCIAL DISCOVERY\n');
        console.log('=' .repeat(50));
        console.log('\nValidating websites and extracting social links...\n');
        
        const funders = await this.getFundersWithWebsites(limit);
        this.stats.total = funders.length;
        
        console.log(`📊 Processing ${funders.length} funders\n`);
        
        for (const funder of funders) {
            await this.validateAndExtract(funder);
            // Rate limiting
            await this.sleep(1000);
        }
        
        await this.saveResults();
        this.printStats();
    }

    async getFundersWithWebsites(limit) {
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

    async validateAndExtract(funder) {
        const name = funder.properties.Name?.title?.[0]?.plain_text || '';
        const website = funder.properties.Website?.url;
        
        console.log(`\n🔍 ${name}`);
        console.log(`   URL: ${website}`);
        
        const result = {
            id: funder.id,
            name,
            url: website,
            status: 'unknown',
            socialLinks: {},
            importantPages: {},
            feeds: {},
            emails: [],
            lastChecked: new Date().toISOString()
        };
        
        try {
            const response = await axios.get(website, {
                timeout: 10000,
                maxRedirects: 5,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
                }
            });
            
            // Check if redirected
            if (response.request.res.responseUrl !== website) {
                result.status = 'redirect';
                result.redirectTo = response.request.res.responseUrl;
                console.log(`   ↪️ Redirects to: ${result.redirectTo}`);
            } else {
                result.status = 'active';
                this.stats.active++;
                console.log(`   ✅ Active`);
            }
            
            // Parse HTML
            const $ = cheerio.load(response.data);
            
            // Extract social media links
            const socialLinks = this.extractSocialLinks($, website);
            if (Object.keys(socialLinks).length > 0) {
                result.socialLinks = socialLinks;
                this.stats.socialFound++;
                console.log(`   📱 Social: ${Object.keys(socialLinks).join(', ')}`);
            }
            
            // Find important pages
            const importantPages = this.findImportantPages($, website);
            if (Object.keys(importantPages).length > 0) {
                result.importantPages = importantPages;
                if (importantPages.contact) {
                    this.stats.contactFound++;
                    console.log(`   📧 Contact page: ${importantPages.contact}`);
                }
            }
            
            // Extract any visible emails (carefully)
            const emails = this.extractEmails(response.data);
            if (emails.length > 0) {
                result.emails = emails;
                console.log(`   ✉️ Emails found: ${emails.length}`);
            }
            
            // Find RSS/Blog feeds
            const feeds = this.findFeeds($, website);
            if (Object.keys(feeds).length > 0) {
                result.feeds = feeds;
                console.log(`   📰 Feeds: ${Object.keys(feeds).join(', ')}`);
            }
            
        } catch (error) {
            if (error.response) {
                result.status = 'error';
                result.error = `HTTP ${error.response.status}`;
                console.log(`   ❌ Error: ${result.error}`);
            } else if (error.code === 'ENOTFOUND') {
                result.status = 'dead';
                this.stats.dead++;
                console.log(`   💀 Dead link`);
            } else if (error.code === 'ETIMEDOUT') {
                result.status = 'timeout';
                console.log(`   ⏱️ Timeout`);
            } else {
                result.status = 'error';
                result.error = error.message;
                console.log(`   ❌ Error: ${error.message}`);
            }
        }
        
        this.results.push(result);
        
        // Update database with findings
        await this.updateFunder(funder.id, result);
    }

    extractSocialLinks($, baseUrl) {
        const social = {};
        
        // LinkedIn
        $('a[href*="linkedin.com"]').each((i, elem) => {
            const href = $(elem).attr('href');
            if (href && href.includes('company')) {
                social.linkedin = href;
            }
        });
        
        // Twitter/X
        $('a[href*="twitter.com"], a[href*="x.com"]').each((i, elem) => {
            const href = $(elem).attr('href');
            if (href && !href.includes('intent') && !href.includes('share')) {
                social.twitter = href;
            }
        });
        
        // Facebook
        $('a[href*="facebook.com"]').each((i, elem) => {
            const href = $(elem).attr('href');
            if (href && !href.includes('sharer')) {
                social.facebook = href;
            }
        });
        
        // YouTube
        $('a[href*="youtube.com"]').each((i, elem) => {
            const href = $(elem).attr('href');
            if (href && (href.includes('channel') || href.includes('user'))) {
                social.youtube = href;
            }
        });
        
        // GitHub
        $('a[href*="github.com"]').each((i, elem) => {
            const href = $(elem).attr('href');
            if (href && !href.includes('github.com/') === false) {
                social.github = href;
            }
        });
        
        // Instagram
        $('a[href*="instagram.com"]').each((i, elem) => {
            const href = $(elem).attr('href');
            if (href) {
                social.instagram = href;
            }
        });
        
        // AngelList
        $('a[href*="angel.co"], a[href*="angellist.com"]').each((i, elem) => {
            const href = $(elem).attr('href');
            if (href) {
                social.angellist = href;
            }
        });
        
        // Crunchbase
        $('a[href*="crunchbase.com"]').each((i, elem) => {
            const href = $(elem).attr('href');
            if (href) {
                social.crunchbase = href;
            }
        });
        
        return social;
    }

    findImportantPages($, baseUrl) {
        const pages = {};
        const base = new URL(baseUrl);
        
        // Contact page
        $('a').each((i, elem) => {
            const href = $(elem).attr('href');
            const text = $(elem).text().toLowerCase();
            
            if (href && (
                text.includes('contact') ||
                href.includes('contact') ||
                text.includes('get in touch') ||
                text.includes('reach out')
            )) {
                try {
                    const url = new URL(href, baseUrl);
                    if (url.hostname === base.hostname) {
                        pages.contact = url.pathname;
                    }
                } catch {}
            }
            
            // About page
            if (href && (text.includes('about') || href.includes('about'))) {
                try {
                    const url = new URL(href, baseUrl);
                    if (url.hostname === base.hostname) {
                        pages.about = url.pathname;
                    }
                } catch {}
            }
            
            // Team page
            if (href && (
                text.includes('team') ||
                text.includes('people') ||
                text.includes('leadership') ||
                href.includes('team')
            )) {
                try {
                    const url = new URL(href, baseUrl);
                    if (url.hostname === base.hostname) {
                        pages.team = url.pathname;
                    }
                } catch {}
            }
            
            // Portfolio page
            if (href && (
                text.includes('portfolio') ||
                text.includes('investments') ||
                text.includes('companies') ||
                href.includes('portfolio')
            )) {
                try {
                    const url = new URL(href, baseUrl);
                    if (url.hostname === base.hostname) {
                        pages.portfolio = url.pathname;
                    }
                } catch {}
            }
            
            // Apply page
            if (href && (
                text.includes('apply') ||
                text.includes('submit') ||
                text.includes('application') ||
                href.includes('apply')
            )) {
                try {
                    const url = new URL(href, baseUrl);
                    if (url.hostname === base.hostname) {
                        pages.apply = url.pathname;
                    }
                } catch {}
            }
        });
        
        return pages;
    }

    extractEmails(html) {
        const emails = new Set();
        
        // Find mailto links
        const mailtoRegex = /mailto:([^"'>\s]+)/gi;
        let match;
        while ((match = mailtoRegex.exec(html)) !== null) {
            const email = match[1];
            if (this.isValidEmail(email)) {
                emails.add(email.toLowerCase());
            }
        }
        
        // Find email patterns in text (but be careful)
        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        while ((match = emailRegex.exec(html)) !== null) {
            const email = match[0];
            if (this.isValidEmail(email)) {
                emails.add(email.toLowerCase());
            }
        }
        
        return Array.from(emails);
    }

    isValidEmail(email) {
        // No JS libraries
        if (email.match(/@\d+\.\d+/)) return false;
        
        // No image files
        if (email.match(/\.(png|jpg|jpeg|gif|webp|svg|css|js)$/i)) return false;
        
        // No example emails
        if (email.includes('example') || email.includes('test')) return false;
        
        // Must be reasonable length
        if (email.length > 50) return false;
        
        // Should look like a real email
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    findFeeds($, baseUrl) {
        const feeds = {};
        
        // RSS feeds
        $('link[type="application/rss+xml"]').each((i, elem) => {
            const href = $(elem).attr('href');
            if (href) {
                feeds.rss = new URL(href, baseUrl).href;
            }
        });
        
        // Blog link
        $('a').each((i, elem) => {
            const href = $(elem).attr('href');
            const text = $(elem).text().toLowerCase();
            
            if (href && (text.includes('blog') || text.includes('news') || href.includes('blog'))) {
                try {
                    const url = new URL(href, baseUrl);
                    feeds.blog = url.pathname;
                } catch {}
            }
        });
        
        return feeds;
    }

    async updateFunder(funderId, result) {
        // Build enriched description
        let enrichment = '\n\n🌐 Website Analysis:\n';
        enrichment += `Status: ${result.status}\n`;
        
        if (Object.keys(result.socialLinks).length > 0) {
            enrichment += '\n📱 Social Media:\n';
            for (const [platform, url] of Object.entries(result.socialLinks)) {
                enrichment += `• ${platform}: ${url}\n`;
            }
        }
        
        if (Object.keys(result.importantPages).length > 0) {
            enrichment += '\n📄 Key Pages:\n';
            for (const [page, path] of Object.entries(result.importantPages)) {
                enrichment += `• ${page}: ${path}\n`;
            }
        }
        
        if (result.emails.length > 0) {
            enrichment += '\n✉️ Contact Emails:\n';
            result.emails.forEach(email => {
                enrichment += `• ${email}\n`;
            });
        }
        
        enrichment += `\n✅ Validated: ${new Date().toISOString().split('T')[0]}`;
        
        try {
            // Get existing description
            const page = await this.notion.pages.retrieve({ page_id: funderId });
            const existingDesc = page.properties.Description?.rich_text?.[0]?.text?.content || '';
            
            // Only add if not duplicate
            if (!existingDesc.includes('Website Analysis:')) {
                await this.notion.pages.update({
                    page_id: funderId,
                    properties: {
                        Description: {
                            rich_text: [{
                                text: { content: existingDesc + enrichment }
                            }]
                        }
                    }
                });
            }
            
            // Update email if found and not already set
            if (result.emails.length > 0 && !page.properties.Email?.email) {
                await this.notion.pages.update({
                    page_id: funderId,
                    properties: {
                        Email: { email: result.emails[0] }
                    }
                });
            }
        } catch (error) {
            console.log(`   ⚠️ Failed to update: ${error.message}`);
        }
    }

    async saveResults() {
        const fs = require('fs').promises;
        const path = require('path');
        
        const reportPath = path.join(
            __dirname,
            '../../data/reports',
            `website-validation-${new Date().toISOString().split('T')[0]}.json`
        );
        
        await fs.writeFile(reportPath, JSON.stringify({
            timestamp: new Date().toISOString(),
            stats: this.stats,
            results: this.results
        }, null, 2));
        
        console.log(`\n📄 Report saved: ${reportPath}`);
    }

    printStats() {
        console.log('\n📊 VALIDATION STATISTICS:');
        console.log('=' .repeat(50));
        console.log(`Total websites checked:    ${this.stats.total}`);
        console.log(`Active websites:           ${this.stats.active}`);
        console.log(`Dead links:                ${this.stats.dead}`);
        console.log(`Redirects:                 ${this.stats.redirect}`);
        console.log(`Social media found:        ${this.stats.socialFound}`);
        console.log(`Contact pages found:       ${this.stats.contactFound}`);
        console.log(`\n✅ Validation complete!`);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Run if called directly
if (require.main === module) {
    const validator = new WebsiteValidator();
    const limit = process.argv[2] ? parseInt(process.argv[2]) : 20;
    validator.run(limit).catch(console.error);
}

module.exports = WebsiteValidator;