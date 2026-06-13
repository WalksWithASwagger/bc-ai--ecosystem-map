#!/usr/bin/env node

/**
 * Extract Top Sponsor Prospects for Vancouver AI Community 2026
 * Focus on BC companies with funding, hiring activity, and marketing budgets
 */

const { Client } = require('@notionhq/client');
require('dotenv').config();
const fs = require('fs');

const notion = new Client({
    auth: process.env.NOTION_TOKEN
});
const databaseId = '1f0c6f799a3381bd8332ca0235c24655';

function getFieldValue(properties, fieldName) {
    const field = properties[fieldName];
    if (!field) return null;

    switch (field.type) {
        case 'title':
            return field.title?.[0]?.plain_text || null;
        case 'rich_text':
            return field.rich_text?.[0]?.plain_text || null;
        case 'url':
            return field.url || null;
        case 'email':
            return field.email || null;
        case 'phone_number':
            return field.phone_number || null;
        case 'select':
            return field.select?.name || null;
        case 'multi_select':
            return field.multi_select?.length > 0 ? field.multi_select.map(s => s.name) : null;
        case 'number':
            return field.number || null;
        case 'date':
            return field.date?.start || null;
        case 'files':
            return field.files?.length > 0 ? field.files : null;
        default:
            return null;
    }
}

async function fetchAllCompanies() {
    console.log('🔍 Fetching all companies from Notion...');

    const companies = [];
    let hasMore = true;
    let startCursor = undefined;

    while (hasMore) {
        const response = await notion.databases.query({
            database_id: databaseId,
            start_cursor: startCursor,
            page_size: 100
        });

        for (const page of response.results) {
            const props = page.properties;

            const company = {
                id: page.id,
                name: getFieldValue(props, 'Name'),
                website: getFieldValue(props, 'Website'),
                linkedin: getFieldValue(props, 'LinkedIn'),
                email: getFieldValue(props, 'Email'),
                phone: getFieldValue(props, 'Phone'),
                category: getFieldValue(props, 'Category'),
                region: getFieldValue(props, 'BC Region'),
                city: getFieldValue(props, 'City/Region'),
                aiFocusAreas: getFieldValue(props, 'AI Focus Areas'),
                yearFounded: getFieldValue(props, 'Year Founded'),
                size: getFieldValue(props, 'Size'),
                funding: getFieldValue(props, 'Funding'),
                revenue: getFieldValue(props, 'Revenue'),
                valuation: getFieldValue(props, 'Valuation'),
                employeeCount: getFieldValue(props, 'Employee Count'),
                keyPeople: getFieldValue(props, 'Key People'),
                shortBlurb: getFieldValue(props, 'Short Blurb'),
                dataSources: getFieldValue(props, 'Data Sources')
            };

            companies.push(company);
        }

        console.log(`Fetched ${companies.length} companies...`);
        hasMore = response.has_more;
        startCursor = response.next_cursor;
    }

    console.log(`✅ Total: ${companies.length} companies`);
    return companies;
}

function scoreCompanyAsProspect(company) {
    let score = 0;
    const reasons = [];

    // Category scoring (tech companies, consulting, telecoms, accelerators)
    const highValueCategories = [
        'Enterprise / Corporate Divisions',
        'Start-ups & Scale-ups',
        'Consulting & Services',
        'Technology Companies',
        'Accelerators / Incubators',
        'Investors & Funds',
        'Venture Capital'
    ];

    if (highValueCategories.some(cat => company.category?.includes(cat))) {
        score += 20;
        reasons.push('High-value category');
    }

    // Funding indicates budget
    if (company.funding) {
        const fundingLower = company.funding.toLowerCase();
        if (fundingLower.includes('series') || fundingLower.includes('$')) {
            score += 25;
            reasons.push('Has funding');
        }
        if (fundingLower.includes('series b') || fundingLower.includes('series c')) {
            score += 15;
            reasons.push('Later stage (B/C)');
        }
    }

    // Size/employee count (larger companies = bigger budgets)
    if (company.employeeCount) {
        const empCount = typeof company.employeeCount === 'number' ?
            company.employeeCount : parseInt(company.employeeCount);
        if (empCount >= 50) {
            score += 20;
            reasons.push(`${empCount}+ employees`);
        } else if (empCount >= 20) {
            score += 10;
            reasons.push(`${empCount} employees`);
        }
    }

    // AI focus = wants to be in AI community
    if (company.aiFocusAreas && company.aiFocusAreas.length > 0) {
        score += 15;
        reasons.push('AI-focused');
    }

    // Vancouver/Lower Mainland = local
    if (company.region === 'Lower Mainland' || company.city?.includes('Vancouver')) {
        score += 10;
        reasons.push('Vancouver-based');
    }

    // Has contact info (email) = can reach them
    if (company.email) {
        score += 5;
        reasons.push('Has email');
    }

    // Website = professional
    if (company.website) {
        score += 5;
        reasons.push('Has website');
    }

    // Specific high-value companies (based on category and description)
    const highValueKeywords = ['microsoft', 'amazon', 'google', 'telus', 'bcit', 'ubc', 'sfu'];
    if (highValueKeywords.some(kw => company.name?.toLowerCase().includes(kw))) {
        score += 30;
        reasons.push('Tier-1 brand');
    }

    return { score, reasons };
}

async function main() {
    const companies = await fetchAllCompanies();

    console.log('\n📊 Scoring companies as sponsor prospects...');

    // Filter out non-companies (conferences, communities, etc.)
    const excludeCategories = [
        'Industry Conferences & Events',
        'Annual Conference',
        'Developer Community',
        'User Group',
        'Government Program',
        'Training Program',
        'Academic Lab',
        'Academic Research Lab'
    ];

    const validCompanies = companies.filter(c => {
        // Must have a name
        if (!c.name) return false;

        // Filter out meta/system entries
        if (c.name.includes('Database') || c.name.includes('Aggregate')) return false;

        // Filter out excluded categories
        if (excludeCategories.includes(c.category)) return false;

        return true;
    });

    // Score all companies
    const scoredCompanies = validCompanies.map(company => {
        const { score, reasons } = scoreCompanyAsProspect(company);
        return {
            ...company,
            sponsorScore: score,
            sponsorReasons: reasons
        };
    });

    // Sort by score
    scoredCompanies.sort((a, b) => b.sponsorScore - a.sponsorScore);

    // Top 50 prospects
    const topProspects = scoredCompanies.slice(0, 50);

    console.log(`\n🎯 Top 50 Sponsor Prospects:\n`);
    topProspects.slice(0, 20).forEach((company, i) => {
        console.log(`${i + 1}. ${company.name} (Score: ${company.sponsorScore})`);
        console.log(`   Category: ${company.category || 'N/A'}`);
        console.log(`   Reasons: ${company.sponsorReasons.join(', ')}`);
        console.log(`   Funding: ${company.funding || 'Unknown'}`);
        console.log('');
    });

    // Save full results
    const output = {
        generatedAt: new Date().toISOString(),
        totalCompanies: companies.length,
        validCompanies: validCompanies.length,
        topProspects: topProspects,
        allScored: scoredCompanies
    };

    const outputPath = '/tmp/sponsor-prospects-analysis.json';
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`\n✅ Full analysis saved to: ${outputPath}`);

    // Also create CSV for easy review
    const csvLines = ['Company,Score,Category,Funding,Employees,Email,Website,Reasons'];
    topProspects.forEach(c => {
        csvLines.push([
            `"${c.name}"`,
            c.sponsorScore,
            `"${c.category || ''}"`,
            `"${c.funding || ''}"`,
            c.employeeCount || '',
            c.email || '',
            c.website || '',
            `"${c.sponsorReasons.join('; ')}"`
        ].join(','));
    });

    const csvPath = '/tmp/sponsor-prospects-top50.csv';
    fs.writeFileSync(csvPath, csvLines.join('\n'));
    console.log(`✅ Top 50 CSV saved to: ${csvPath}`);
}

main().catch(console.error);
