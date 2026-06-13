# Contact Information Enhancement Plan

This document outlines the plan for developing three scripts to enhance contact information in the BC AI Ecosystem database.

## 1. enhance-websites.js

**Purpose:** Find and verify missing websites for organizations.

**Approach:**
1. Query the Notion database for organizations with missing websites
2. For each organization:
   - Use web search API to find potential websites based on organization name
   - Verify discovered websites by checking for organization name on the site
   - Score results based on relevance and confidence
   - Update the Notion database with verified websites

**Dependencies:**
- Google Search API or similar web search service
- HTML parsing library (e.g., cheerio) for website verification

**Expected Outcome:**
- Improve website completion from 45% to 60-70%
- Generate a detailed report of added websites and confidence scores

## 2. find-linkedin.js

**Purpose:** Discover LinkedIn profiles for organizations.

**Approach:**
1. Query the Notion database for organizations with missing LinkedIn profiles
2. For each organization:
   - Use web search API to search for "[Organization Name] LinkedIn"
   - Filter results to identify LinkedIn company pages
   - Verify by checking the LinkedIn page content matches the organization
   - Update the Notion database with verified LinkedIn URLs

**Dependencies:**
- Web search API
- URL pattern matching for LinkedIn company pages

**Expected Outcome:**
- Improve LinkedIn completion from 29% to 45-55%
- Generate a detailed report of added LinkedIn profiles

## 3. extract-contact-info.js

**Purpose:** Extract emails and phone numbers from organization websites.

**Approach:**
1. Query the Notion database for organizations with websites but missing contact information
2. For each organization:
   - Fetch the website content
   - Parse HTML to identify contact pages
   - Extract emails and phone numbers using regex patterns
   - Validate extracted information
   - Update the Notion database with verified contact information

**Dependencies:**
- HTML parsing library (cheerio)
- HTTP request library (axios or node-fetch)
- Email and phone number validation libraries

**Expected Outcome:**
- Improve email completion from 19% to 30-40%
- Improve phone completion from 19% to 30-40%
- Generate a detailed report of extracted contact information

## Implementation Schedule

1. **Week 1:**
   - Develop and test enhance-websites.js
   - Run for a batch of 50 organizations to validate approach

2. **Week 2:**
   - Develop and test find-linkedin.js
   - Run for a batch of 50 organizations to validate approach

3. **Week 3:**
   - Develop and test extract-contact-info.js
   - Run for organizations with newly discovered websites

4. **Week 4:**
   - Run all scripts for remaining organizations
   - Generate comprehensive report on improvements

## Monitoring and Evaluation

- Track completion rates before and after each script run
- Evaluate accuracy of discovered information
- Document any challenges or limitations encountered
- Refine scripts based on results and feedback 