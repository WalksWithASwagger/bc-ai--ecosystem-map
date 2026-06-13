/**
 * MCP Analyzer - Consolidated analysis and validation tool
 * Combines all analysis, validation, and reporting functionality
 */

const MCPBase = require('../mcp-base');

class MCPAnalyzer extends MCPBase {
    constructor() {
        super();
        this.fields = [
            'Name', 'Website', 'Email', 'LinkedIn', 'Phone',
            'City/Region', 'BC Region', 'Category', 'AI Focus Areas',
            'Year Founded', 'Size', 'Key People', 'Funding',
            'Short Blurb', 'Logo', 'Latitude', 'Longitude'
        ];
    }

    /**
     * Analyze database completeness
     */
    async completeness(options = {}) {
        console.log('📊 Analyzing Database Completeness...\n');
        
        const pages = await this.fetchAllPages();
        console.log(`Total organizations: ${pages.length}\n`);

        // Calculate completeness for each field
        const fieldStats = {};
        const orgScores = [];

        this.fields.forEach(field => {
            fieldStats[field] = { complete: 0, missing: 0 };
        });

        // Analyze each organization
        for (const page of pages) {
            let score = 0;
            const missing = [];

            this.fields.forEach(field => {
                const value = this.getPropertyValue(page, field);
                if (value && (Array.isArray(value) ? value.length > 0 : true)) {
                    fieldStats[field].complete++;
                    score++;
                } else {
                    fieldStats[field].missing++;
                    missing.push(field);
                }
            });

            orgScores.push({
                name: this.getPropertyValue(page, 'Name'),
                id: page.id,
                score: Math.round((score / this.fields.length) * 100),
                missing
            });
        }

        // Sort by completeness
        orgScores.sort((a, b) => a.score - b.score);

        // Display results
        console.log('Field Completion Rates:');
        console.log('======================');
        
        const fieldData = Object.entries(fieldStats)
            .map(([field, stats]) => ({
                Field: field,
                Complete: stats.complete,
                Missing: stats.missing,
                'Rate': Math.round((stats.complete / pages.length) * 100) + '%'
            }))
            .sort((a, b) => parseInt(a.Rate) - parseInt(b.Rate));

        console.log(this.formatTable(fieldData, ['Field', 'Complete', 'Missing', 'Rate']));

        // Show most incomplete orgs
        if (!options.fieldsOnly) {
            console.log('\nMost Incomplete Organizations:');
            console.log('==============================');
            
            const incomplete = orgScores.slice(0, options.limit || 10);
            console.log(this.formatTable(
                incomplete.map(org => ({
                    Name: org.name.substring(0, 30),
                    Score: org.score + '%',
                    'Missing Fields': org.missing.length
                })),
                ['Name', 'Score', 'Missing Fields']
            ));
        }

        // Save detailed report
        if (options.report) {
            const report = this.generateCompletenessReport(fieldStats, orgScores, pages.length);
            const filepath = await this.saveReport(
                `${this.getTimestamp()}_completeness.md`,
                report
            );
            console.log(`\n📄 Detailed report saved to: ${filepath}`);
        }

        return { fieldStats, orgScores };
    }

    /**
     * Find and analyze duplicates
     */
    async duplicates(options = {}) {
        console.log('🔍 Analyzing Duplicates...\n');
        
        const pages = await this.fetchAllPages();
        const nameMap = new Map();
        const duplicates = [];

        // Group by normalized name
        for (const page of pages) {
            const name = this.getPropertyValue(page, 'Name');
            if (!name) continue;

            const normalized = this.normalizeName(name);
            
            if (!nameMap.has(normalized)) {
                nameMap.set(normalized, []);
            }
            
            nameMap.get(normalized).push({
                id: page.id,
                name,
                website: this.getPropertyValue(page, 'Website'),
                created: page.created_time
            });
        }

        // Find duplicates
        nameMap.forEach((entries, normalized) => {
            if (entries.length > 1) {
                duplicates.push({
                    normalized,
                    entries: entries.sort((a, b) => 
                        new Date(a.created) - new Date(b.created)
                    )
                });
            }
        });

        // Display results
        console.log(`Found ${duplicates.length} duplicate sets\n`);

        if (duplicates.length > 0) {
            duplicates.forEach((dup, index) => {
                console.log(`${index + 1}. "${dup.entries[0].name}" (${dup.entries.length} entries)`);
                dup.entries.forEach(entry => {
                    console.log(`   - ${entry.name}`);
                    console.log(`     ID: ${entry.id}`);
                    console.log(`     Created: ${new Date(entry.created).toLocaleDateString()}`);
                });
                console.log('');
            });

            // Auto-fix if requested
            if (options.autoFix) {
                console.log('🔧 Auto-fixing duplicates...\n');
                
                for (const dup of duplicates) {
                    // Keep oldest, archive rest
                    for (let i = 1; i < dup.entries.length; i++) {
                        await this.archivePage(dup.entries[i].id);
                        console.log(`✓ Archived: ${dup.entries[i].name}`);
                    }
                }
            }
        }

        return duplicates;
    }

    /**
     * Find missing data by field
     */
    async missing(field, options = {}) {
        console.log(`🔍 Finding organizations missing ${field}...\n`);

        const filter = {
            property: field,
            [this.getFilterType(field)]: { is_empty: true }
        };

        const pages = await this.fetchAllPages(filter);
        console.log(`Found ${pages.length} organizations missing ${field}\n`);

        // Get additional context
        const results = pages.slice(0, options.limit || 20).map(page => ({
            Name: this.getPropertyValue(page, 'Name'),
            Website: this.getPropertyValue(page, 'Website') || 'No website',
            Category: this.getPropertyValue(page, 'Category') || 'Unknown',
            ID: page.id
        }));

        console.log(this.formatTable(results, ['Name', 'Website', 'Category']));

        return results;
    }

    /**
     * Quality validation
     */
    async quality(options = {}) {
        console.log('🔍 Running Quality Validation...\n');
        
        const pages = await this.fetchAllPages();
        const issues = {
            invalidUrls: [],
            suspiciousNames: [],
            invalidEmails: [],
            dataInconsistencies: []
        };

        for (const page of pages) {
            const name = this.getPropertyValue(page, 'Name');
            const website = this.getPropertyValue(page, 'Website');
            const email = this.getPropertyValue(page, 'Email');

            // Check URLs
            if (website && !this.isValidUrl(website)) {
                issues.invalidUrls.push({ name, website, id: page.id });
            }

            // Check names
            if (this.isSuspiciousName(name)) {
                issues.suspiciousNames.push({ name, id: page.id });
            }

            // Check emails
            if (email && !this.isValidEmail(email)) {
                issues.invalidEmails.push({ name, email, id: page.id });
            }

            // Check consistency
            const inconsistencies = this.checkConsistency(page);
            if (inconsistencies.length > 0) {
                issues.dataInconsistencies.push({ name, issues: inconsistencies, id: page.id });
            }
        }

        // Display results
        console.log('Quality Issues Found:');
        console.log('===================\n');
        
        Object.entries(issues).forEach(([type, items]) => {
            console.log(`${type}: ${items.length} issues`);
        });

        if (options.details) {
            Object.entries(issues).forEach(([type, items]) => {
                if (items.length > 0) {
                    console.log(`\n${type}:`);
                    items.slice(0, 10).forEach(item => {
                        console.log(`  - ${item.name}`);
                    });
                }
            });
        }

        return issues;
    }

    /**
     * Full audit combining all checks
     */
    async audit(options = {}) {
        console.log('🔍 Running Comprehensive Audit...\n');
        console.log('==================================\n');

        // Run all checks
        console.log('1. Completeness Check');
        const completeness = await this.completeness({ fieldsOnly: true });
        
        console.log('\n2. Duplicate Check');
        const duplicates = await this.duplicates();
        
        console.log('\n3. Quality Check');
        const quality = await this.quality();

        // Generate audit report
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalOrganizations: await this.fetchAllPages().then(p => p.length),
                duplicateSets: duplicates.length,
                qualityIssues: Object.values(quality).reduce((sum, arr) => sum + arr.length, 0),
                averageCompleteness: this.calculateAverageCompleteness(completeness.fieldStats)
            },
            details: {
                completeness: completeness.fieldStats,
                duplicates,
                quality
            }
        };

        // Save report
        const filepath = await this.saveReport(
            `${this.getTimestamp()}_audit.json`,
            JSON.stringify(report, null, 2)
        );
        
        console.log(`\n📄 Audit report saved to: ${filepath}`);
        
        return report;
    }

    // Helper methods
    normalizeName(name) {
        return name.toLowerCase()
            .replace(/\s+/g, ' ')
            .replace(/[^\w\s]/g, '')
            .trim();
    }

    getFilterType(field) {
        const fieldTypes = {
            'Email': 'email',
            'Website': 'url',
            'LinkedIn': 'url',
            'Phone': 'phone_number',
            'Year Founded': 'number'
        };
        return fieldTypes[field] || 'rich_text';
    }

    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    isValidEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email) && !email.includes('.png') && !email.includes('.jpg');
    }

    isSuspiciousName(name) {
        const suspicious = [
            /^test/i, /^sample/i, /^example/i, /^delete/i,
            /^[0-9]+$/, /^[a-z]$/i, /^\d{1,3}$/
        ];
        return suspicious.some(pattern => pattern.test(name));
    }

    checkConsistency(page) {
        const issues = [];
        
        // Year founded in future
        const year = this.getPropertyValue(page, 'Year Founded');
        if (year && year > new Date().getFullYear()) {
            issues.push('Year founded is in the future');
        }

        // Has funding but no website
        const funding = this.getPropertyValue(page, 'Funding');
        const website = this.getPropertyValue(page, 'Website');
        if (funding && !website) {
            issues.push('Has funding but no website');
        }

        return issues;
    }

    generateCompletenessReport(fieldStats, orgScores, total) {
        let report = `# Database Completeness Report\n\n`;
        report += `Generated: ${new Date().toISOString()}\n`;
        report += `Total Organizations: ${total}\n\n`;
        
        report += `## Field Completion Rates\n\n`;
        report += `| Field | Complete | Missing | Rate |\n`;
        report += `|-------|----------|---------|------|\n`;
        
        Object.entries(fieldStats).forEach(([field, stats]) => {
            const rate = Math.round((stats.complete / total) * 100);
            report += `| ${field} | ${stats.complete} | ${stats.missing} | ${rate}% |\n`;
        });

        return report;
    }

    calculateAverageCompleteness(fieldStats) {
        const total = Object.values(fieldStats).reduce((sum, stats) => 
            sum + stats.complete, 0
        );
        const possible = Object.keys(fieldStats).length * 
            Object.values(fieldStats)[0].complete + Object.values(fieldStats)[0].missing;
        
        return Math.round((total / possible) * 100);
    }
}

module.exports = MCPAnalyzer;