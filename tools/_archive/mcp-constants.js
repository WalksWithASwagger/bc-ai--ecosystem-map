/**
 * MCP Constants - Single source of truth for all MCP configurations
 * 
 * ⚠️ IMPORTANT: This is the ONLY place where tokens and IDs are defined
 * All tools must import from this file - NO hardcoding elsewhere!
 */

module.exports = {
    // Notion API Configuration
    NOTION_TOKEN: process.env.NOTION_TOKEN,
    DATABASE_ID: '1f0c6f799a3381bd8332ca0235c24655',
    
    // API Rate Limits
    BATCH_SIZE: 100,
    RATE_LIMIT_DELAY: 500, // milliseconds
    
    // Tool Defaults
    DEFAULT_LIMIT: 20,
    DEFAULT_TIMEOUT: 30000, // 30 seconds
    
    // Report Settings
    REPORTS_DIR: 'reports',
    
    // Field Names (standardized)
    FIELDS: {
        NAME: 'Name',
        WEBSITE: 'Website',
        EMAIL: 'Email',
        LINKEDIN: 'LinkedIn',
        PHONE: 'Phone',
        CITY_REGION: 'City/Region',
        BC_REGION: 'BC Region',
        CATEGORY: 'Category',
        AI_FOCUS: 'AI Focus Areas',
        YEAR_FOUNDED: 'Year Founded',
        SIZE: 'Size',
        KEY_PEOPLE: 'Key People',
        FUNDING: 'Funding',
        SHORT_BLURB: 'Short Blurb',
        LOGO: 'Logo',
        LATITUDE: 'Latitude',
        LONGITUDE: 'Longitude'
    }
};