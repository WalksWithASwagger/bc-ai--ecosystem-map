#!/usr/bin/env node

/**
 * Duplicate Company Merger
 * Consolidated tool for finding and intelligently merging duplicate companies
 * Combines duplicate detection and smart merging functionality
 */

const { Client } = require('@notionhq/client');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

class DuplicateMerger {
    constructor() {
        // Direct token access - MCP pattern
        this.notion = new Client({ 
            auth: process.env.NOTION_TOKEN
        });
        this.databaseId = '1f0c6f799a3381bd8332ca0235c24655';
        
        // Fields to merge intelligently
        this.mergeableFields = [
            'Website', 'LinkedIn', 'Email', 'Phone',
            'City/Region', 'BC Region', 'Category', 'AI Focus Areas',
            'Year Founded', 'Size', 'Short Blurb', 'Key People',
            'Latitude', 'Longitude', 'Logo', 'Funding',
            'Revenue', 'Valuation', 'Employee Count', 'Data Sources'
        ];
    }

    async getAllCompanies() {
        console.log('🔍 Fetching all companies...');
        
        const companies = [];
        let hasMore = true;
        let startCursor = undefined;

        while (hasMore) {
            const response = await this.notion.databases.query({
                database_id: this.databaseId,
                start_cursor: startCursor,
                page_size: 100,
                filter: {
                    property: 'Name',
                    title: { is_not_empty: true }
                }
            });

            companies.push(...response.results);
            console.log(`Fetched ${companies.length} companies...`);
            
            hasMore = response.has_more;
            startCursor = response.next_cursor;
        }

        console.log(`Total: ${companies.length} companies`);
        return companies;
    }

    getFieldValue(properties, fieldName) {
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

    calculateSimilarity(company1, company2) {
        const name1 = this.getFieldValue(company1.properties, 'Name') || '';
        const name2 = this.getFieldValue(company2.properties, 'Name') || '';
        const website1 = this.getFieldValue(company1.properties, 'Website');
        const website2 = this.getFieldValue(company2.properties, 'Website');
        
        // Exact name match
        if (name1.toLowerCase() === name2.toLowerCase()) {
            return { score: 1.0, reason: 'exact_name_match' };
        }
        
        // Website match
        if (website1 && website2 && website1 === website2) {
            return { score: 1.0, reason: 'exact_website_match' };
        }
        
        // Similar name calculation
        const nameSimilarity = this.calculateNameSimilarity(name1, name2);
        
        // Domain similarity if both have websites
        let domainSimilarity = 0;
        if (website1 && website2) {
            const domain1 = this.extractDomain(website1);
            const domain2 = this.extractDomain(website2);
            if (domain1 === domain2) {
                domainSimilarity = 1.0;
            }
        }
        
        // Combined score
        const combinedScore = Math.max(nameSimilarity, domainSimilarity);
        
        let reason = 'name_similarity';
        if (domainSimilarity > nameSimilarity) {
            reason = 'domain_similarity';
        }
        
        return { score: combinedScore, reason: reason };
    }

    calculateNameSimilarity(name1, name2) {
        const clean1 = this.cleanCompanyName(name1);
        const clean2 = this.cleanCompanyName(name2);
        
        // Exact match after cleaning
        if (clean1 === clean2) return 1.0;
        
        // Word-based similarity
        const words1 = clean1.split(' ').filter(w => w.length > 2);
        const words2 = clean2.split(' ').filter(w => w.length > 2);
        
        if (words1.length === 0 || words2.length === 0) return 0;
        
        const commonWords = words1.filter(word => words2.includes(word)).length;
        const maxWords = Math.max(words1.length, words2.length);
        const wordSimilarity = commonWords / maxWords;
        
        // Character-based similarity (Levenshtein)
        const charSimilarity = 1 - (this.levenshteinDistance(clean1, clean2) / Math.max(clean1.length, clean2.length));
        
        // Weighted combination
        return (wordSimilarity * 0.7) + (charSimilarity * 0.3);
    }

    cleanCompanyName(name) {
        return name.toLowerCase()
            .replace(/\b(inc|ltd|corp|llc|technologies|technology|tech|systems|solutions|ai|labs|lab)\b/g, '')
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    extractDomain(url) {
        try {
            const domain = new URL(url).hostname.replace('www.', '');
            return domain;
        } catch {
            return null;
        }
    }

    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    findDuplicates(companies, threshold = 0.85) {
        console.log(`🔍 Finding duplicates (threshold: ${threshold})...`);
        
        const duplicateGroups = [];
        const processed = new Set();
        
        for (let i = 0; i < companies.length; i++) {
            if (processed.has(companies[i].id)) continue;
            
            const group = [companies[i]];
            processed.add(companies[i].id);
            
            for (let j = i + 1; j < companies.length; j++) {
                if (processed.has(companies[j].id)) continue;
                
                const similarity = this.calculateSimilarity(companies[i], companies[j]);
                
                if (similarity.score >= threshold) {
                    group.push(companies[j]);
                    processed.add(companies[j].id);
                }
            }
            
            if (group.length > 1) {
                duplicateGroups.push({
                    companies: group,
                    similarity: this.calculateSimilarity(group[0], group[1])
                });
            }
        }
        
        console.log(`Found ${duplicateGroups.length} duplicate groups`);
        return duplicateGroups;
    }

    calculateCompleteness(company) {
        let completedFields = 0;
        
        this.mergeableFields.forEach(field => {
            const value = this.getFieldValue(company.properties, field);
            if (value) completedFields++;
        });
        
        return completedFields / this.mergeableFields.length;
    }

    selectPrimaryCompany(companies) {
        // Sort by completeness score (descending)
        const sorted = companies.sort((a, b) => {
            return this.calculateCompleteness(b) - this.calculateCompleteness(a);
        });
        
        return sorted[0];
    }

    mergeCompanyData(primary, duplicates) {
        const mergedProperties = { ...primary.properties };
        
        // Merge data from duplicates into primary
        duplicates.forEach(duplicate => {
            this.mergeableFields.forEach(field => {
                const primaryValue = this.getFieldValue(primary.properties, field);
                const duplicateValue = this.getFieldValue(duplicate.properties, field);
                
                // If primary is missing this field but duplicate has it, use duplicate's value
                if (!primaryValue && duplicateValue) {
                    mergedProperties[field] = duplicate.properties[field];
                }
                
                // For multi-select fields, merge arrays
                if (field === 'AI Focus Areas' && duplicateValue && primaryValue) {
                    const primaryArray = Array.isArray(primaryValue) ? primaryValue : [primaryValue];
                    const duplicateArray = Array.isArray(duplicateValue) ? duplicateValue : [duplicateValue];
                    const mergedArray = [...new Set([...primaryArray, ...duplicateArray])];
                    
                    mergedProperties[field] = {
                        multi_select: mergedArray.map(value => ({ name: value }))
                    };
                }
                
                // For rich text fields, combine if both exist
                if (['Short Blurb', 'Key People', 'Data Sources'].includes(field) && 
                    primaryValue && duplicateValue && primaryValue !== duplicateValue) {
                    const combined = `${primaryValue} | ${duplicateValue}`;
                    mergedProperties[field] = {
                        rich_text: [{ text: { content: combined } }]
                    };
                }
            });
        });
        
        // Add merge timestamp
        mergedProperties['Last Verified'] = {
            date: { start: new Date().toISOString().split('T')[0] }
        };
        
        return mergedProperties;
    }

    async archiveCompany(company) {
        try {
            await this.notion.pages.update({
                page_id: company.id,
                archived: true
            });
            return true;
        } catch (error) {
            console.log(`   ❌ Failed to archive ${this.getFieldValue(company.properties, 'Name')}: ${error.message}`);
            return false;
        }
    }

    async updateCompany(companyId, properties) {
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

    async mergeDuplicateGroup(group, options = {}) {
        const primary = this.selectPrimaryCompany(group.companies);
        const duplicates = group.companies.filter(c => c.id !== primary.id);
        
        const primaryName = this.getFieldValue(primary.properties, 'Name');
        console.log(`\n🔀 Merging group: ${primaryName}`);
        console.log(`   Primary: ${primaryName} (${Math.round(this.calculateCompleteness(primary) * 100)}% complete)`);
        
        duplicates.forEach(duplicate => {
            const dupName = this.getFieldValue(duplicate.properties, 'Name');
            console.log(`   Duplicate: ${dupName} (${Math.round(this.calculateCompleteness(duplicate) * 100)}% complete)`);
        });
        
        if (options.dryRun) {
            console.log(`   🔍 DRY RUN - Would merge ${duplicates.length} duplicates into primary`);
            return {
                success: true,
                dryRun: true,
                primary: primaryName,
                duplicatesCount: duplicates.length
            };
        }
        
        // Merge data
        const mergedProperties = this.mergeCompanyData(primary, duplicates);
        
        // Update primary with merged data
        const updateSuccess = await this.updateCompany(primary.id, mergedProperties);
        if (!updateSuccess) {
            return {
                success: false,
                error: 'Failed to update primary company',
                primary: primaryName
            };
        }
        
        // Archive duplicates
        let archivedCount = 0;
        for (const duplicate of duplicates) {
            const archived = await this.archiveCompany(duplicate);
            if (archived) archivedCount++;
        }
        
        console.log(`   ✅ Merged successfully - archived ${archivedCount}/${duplicates.length} duplicates`);
        
        return {
            success: true,
            primary: primaryName,
            duplicatesCount: duplicates.length,
            archivedCount: archivedCount
        };
    }

    async run(options = {}) {
        console.log('🚀 Duplicate Company Merger');
        console.log('=============================\n');
        
        const threshold = options.threshold || 0.85;
        const dryRun = options.dryRun || false;
        
        if (dryRun) {
            console.log('🔍 DRY RUN MODE - No actual merges will be performed\n');
        }
        
        // Get all companies
        const companies = await this.getAllCompanies();
        
        // Find duplicates
        const duplicateGroups = this.findDuplicates(companies, threshold);
        
        if (duplicateGroups.length === 0) {
            console.log('✅ No duplicates found!');
            return { duplicateGroups: 0, mergedGroups: 0 };
        }
        
        console.log(`\n📋 Found ${duplicateGroups.length} duplicate groups to process\n`);
        
        const results = {
            totalGroups: duplicateGroups.length,
            processedGroups: 0,
            successfulMerges: 0,
            failedMerges: 0,
            totalDuplicatesArchived: 0,
            details: []
        };
        
        // Process each duplicate group
        for (const group of duplicateGroups) {
            const result = await this.mergeDuplicateGroup(group, { dryRun });
            results.details.push(result);
            results.processedGroups++;
            
            if (result.success && !result.dryRun) {
                results.successfulMerges++;
                results.totalDuplicatesArchived += result.archivedCount || 0;
            } else if (!result.success) {
                results.failedMerges++;
            }
            
            // Small delay to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Generate report
        const timestamp = new Date().toISOString().split('T')[0];
        const reportPath = path.join(process.cwd(), 'data', 'duplicates', `duplicate-merge-${timestamp}.json`);
        
        // Ensure directory exists
        const dir = path.dirname(reportPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        const report = {
            generatedAt: new Date().toISOString(),
            threshold: threshold,
            dryRun: dryRun,
            summary: results,
            duplicateGroups: duplicateGroups.map(group => ({
                similarity: group.similarity,
                companies: group.companies.map(c => ({
                    id: c.id,
                    name: this.getFieldValue(c.properties, 'Name'),
                    completeness: Math.round(this.calculateCompleteness(c) * 100)
                }))
            }))
        };
        
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        // Print summary
        console.log('\n✅ Duplicate processing complete!');
        console.log(`📊 Results: ${results.successfulMerges} merged, ${results.failedMerges} failed`);
        console.log(`📦 Total duplicates archived: ${results.totalDuplicatesArchived}`);
        console.log(`📄 Detailed report: ${reportPath}`);
        
        return report;
    }
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const options = {};
    
    // Parse arguments
    args.forEach(arg => {
        if (arg.startsWith('--threshold=')) {
            options.threshold = parseFloat(arg.split('=')[1]);
        } else if (arg === '--dry-run') {
            options.dryRun = true;
        }
    });
    
    const merger = new DuplicateMerger();
    merger.run(options).catch(console.error);
}

module.exports = DuplicateMerger;