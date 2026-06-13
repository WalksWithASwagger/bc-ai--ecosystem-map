#!/usr/bin/env node

/**
 * Shared Database Utilities
 * Common database operations to reduce code duplication
 */

const { notion, databaseIds } = require('./notion-client');

/**
 * Query database with automatic pagination
 * @param {string} databaseId - Notion database ID
 * @param {object} filter - Optional Notion filter object
 * @param {number} pageSize - Items per page (default 100)
 * @returns {Promise<Array>} All database entries
 */
async function queryAllPages(databaseId, filter = undefined, pageSize = 100) {
    const results = [];
    let hasMore = true;
    let startCursor = undefined;

    while (hasMore) {
        const response = await notion.databases.query({
            database_id: databaseId,
            filter,
            start_cursor: startCursor,
            page_size: pageSize
        });

        results.push(...response.results);
        hasMore = response.has_more;
        startCursor = response.next_cursor;

        if (results.length % 100 === 0) {
            console.log(`  Fetched ${results.length} records...`);
        }
    }

    return results;
}

/**
 * Update a page property with retry logic
 * @param {string} pageId - Notion page ID
 * @param {object} properties - Properties to update
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise<object>} Updated page
 */
async function updatePageWithRetry(pageId, properties, maxRetries = 3) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await notion.pages.update({
                page_id: pageId,
                properties
            });
        } catch (error) {
            if (error.code === 'rate_limited' && attempt < maxRetries - 1) {
                const delay = 1000 * (attempt + 1);
                console.log(`  Rate limited, waiting ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            throw error;
        }
    }
}

/**
 * Batch update multiple pages with rate limiting
 * @param {Array} updates - Array of {pageId, properties} objects
 * @param {number} delayMs - Delay between updates (default 100ms)
 */
async function batchUpdate(updates, delayMs = 100) {
    console.log(`Starting batch update of ${updates.length} pages...`);
    let completed = 0;
    let failed = 0;

    for (const { pageId, properties } of updates) {
        try {
            await updatePageWithRetry(pageId, properties);
            completed++;
            
            if (completed % 10 === 0) {
                console.log(`  Progress: ${completed}/${updates.length}`);
            }

            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, delayMs));
        } catch (error) {
            failed++;
            console.error(`  Failed to update ${pageId}: ${error.message}`);
        }
    }

    console.log(`Batch update complete: ${completed} succeeded, ${failed} failed`);
    return { completed, failed };
}

/**
 * Find pages with missing or empty fields
 * @param {string} databaseId - Notion database ID
 * @param {Array<string>} fieldNames - Field names to check
 * @returns {Promise<Array>} Pages with missing fields
 */
async function findMissingFields(databaseId, fieldNames) {
    const allPages = await queryAllPages(databaseId);
    
    return allPages.filter(page => {
        return fieldNames.some(fieldName => {
            const prop = page.properties[fieldName];
            if (!prop) return true;
            
            // Check based on property type
            switch (prop.type) {
                case 'rich_text':
                    return !prop.rich_text || prop.rich_text.length === 0;
                case 'url':
                    return !prop.url;
                case 'email':
                    return !prop.email;
                case 'phone_number':
                    return !prop.phone_number;
                case 'select':
                    return !prop.select;
                case 'multi_select':
                    return !prop.multi_select || prop.multi_select.length === 0;
                default:
                    return false;
            }
        });
    });
}

/**
 * Extract property value from Notion page
 * @param {object} page - Notion page object
 * @param {string} propertyName - Property name
 * @returns {*} Extracted value
 */
function getPropertyValue(page, propertyName) {
    const prop = page.properties[propertyName];
    if (!prop) return null;

    switch (prop.type) {
        case 'title':
            return prop.title[0]?.plain_text || '';
        case 'rich_text':
            return prop.rich_text[0]?.plain_text || '';
        case 'url':
            return prop.url;
        case 'email':
            return prop.email;
        case 'phone_number':
            return prop.phone_number;
        case 'select':
            return prop.select?.name;
        case 'multi_select':
            return prop.multi_select.map(s => s.name);
        case 'number':
            return prop.number;
        case 'checkbox':
            return prop.checkbox;
        case 'date':
            return prop.date?.start;
        default:
            return null;
    }
}

module.exports = {
    queryAllPages,
    updatePageWithRetry,
    batchUpdate,
    findMissingFields,
    getPropertyValue,
    databaseIds
};
