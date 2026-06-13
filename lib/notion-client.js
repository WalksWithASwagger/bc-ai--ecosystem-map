#!/usr/bin/env node

/**
 * Shared Notion Client Configuration
 * Centralizes Notion client initialization and database IDs
 * Used by all tools to eliminate code duplication
 */

const { Client } = require('@notionhq/client');
require('dotenv').config();

// Initialize Notion client
const notion = new Client({
    auth: process.env.NOTION_TOKEN
});

// Secondary client if needed (for tools that need both tokens)
const notionSecondary = process.env.NOTION_TOKEN_SECONDARY
    ? new Client({ auth: process.env.NOTION_TOKEN_SECONDARY })
    : null;

// Database IDs
const databaseIds = {
    aiCompanies: process.env.AI_COMPANY_DB_ID,
    funders: process.env.FUNDER_DB_ID,
    people: process.env.PEOPLE_DB_ID,
    tasks: process.env.TASK_DB_ID,
    youtube: process.env.YOUTUBE_DB_ID
};

module.exports = {
    notion,
    notionSecondary,
    databaseIds
};
