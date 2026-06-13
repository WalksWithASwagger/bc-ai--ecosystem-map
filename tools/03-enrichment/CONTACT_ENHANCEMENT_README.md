# Contact Information Enhancement Tools

This directory contains scripts for enhancing contact information in the BC AI Ecosystem database. These tools are designed to systematically discover and add missing contact details for organizations.

## Data Quality Policy

**IMPORTANT: No Simulated or Fake Data**

All contact enhancement tools follow a strict policy of only adding real, verified data:
- **NO** simulated URLs or guessed website addresses
- **NO** auto-generated LinkedIn profiles based on company names
- **NO** fake email addresses or phone numbers
- **ONLY** real data extracted from actual websites or verified sources

If a tool cannot find real, verified information, it will skip the organization rather than adding fake data.

## Standard Batch Size

**Default: 50 organizations per run**

The contact enhancement tools process organizations in batches of 50 by default. This batch size is optimal for:
- Efficient processing without overwhelming APIs
- Completing runs within reasonable time limits (under 2-3 minutes)
- Minimizing rate limit issues
- Providing meaningful progress updates

## Overview

The contact enhancement suite consists of three main scripts:

1. **enhance-websites.js** - Finds and verifies websites for organizations with missing website information
2. **find-linkedin.js** - Discovers LinkedIn profiles for organizations with missing LinkedIn information
3. **extract-contact-info.js** - Extracts emails and phone numbers from organization websites

Additionally, there's a verification script:

4. **verify-linkedin-urls.js** - Verifies existing LinkedIn URLs and removes auto-generated/fake ones

## Prerequisites

Before running these scripts, ensure you have:

1. Node.js (v14 or higher) installed
2. Required dependencies installed: `npm install`
3. Notion API token and database ID set as environment variables

## Environment Setup

Set the following environment variables:

```bash
export NOTION_TOKEN=your_notion_api_token
export NOTION_DATABASE_ID=your_notion_database_id
```

Alternatively, create a `.env` file in the scripts directory with:

```
NOTION_TOKEN=your_notion_api_token
NOTION_DATABASE_ID=your_notion_database_id
```

## Script Usage

### 1. enhance-websites.js

This script finds and verifies websites for organizations with missing website information.

```bash
# Process all organizations
NOTION_TOKEN=... NOTION_DATABASE_ID=... node scripts/enhance-websites.js

# Process only 10 organizations
NOTION_TOKEN=... NOTION_DATABASE_ID=... node scripts/enhance-websites.js --limit=10

# Process batch 2 (organizations 11-20) with a limit of 10
NOTION_TOKEN=... NOTION_DATABASE_ID=... node scripts/enhance-websites.js --limit=10 --batch=2

# Dry run (don't update Notion, just show what would be updated)
NOTION_TOKEN=... NOTION_DATABASE_ID=... node scripts/enhance-websites.js --dryrun
```

#### How it works:

1. Queries the Notion database for organizations with missing websites
2. For each organization, searches for a potential website
3. Verifies the website by checking if it contains the organization name
4. Updates the Notion database with verified websites
5. Generates a report of added websites

### 2. find-linkedin.js

This script discovers LinkedIn profiles for organizations with missing LinkedIn information.

```bash
# Process all organizations
NOTION_TOKEN=... NOTION_DATABASE_ID=... node scripts/find-linkedin.js

# Process only 10 organizations
NOTION_TOKEN=... NOTION_DATABASE_ID=... node scripts/find-linkedin.js --limit=10

# Process batch 2 (organizations 11-20) with a limit of 10
NOTION_TOKEN=... NOTION_DATABASE_ID=... node scripts/find-linkedin.js --limit=10 --batch=2

# Dry run (don't update Notion, just show what would be updated)
NOTION_TOKEN=... NOTION_DATABASE_ID=... node scripts/find-linkedin.js --dryrun
```

#### How it works:

1. Queries the Notion database for organizations with missing LinkedIn profiles
2. For each organization:
   - First tries to extract LinkedIn URL from the organization's website (if available)
   - Falls back to a search-based approach if no LinkedIn URL is found on the website
3. Verifies the LinkedIn profile by checking if it's a valid company page
4. Updates the Notion database with verified LinkedIn profiles
5. Generates a report of added LinkedIn profiles

### 3. extract-contact-info.js

This script extracts emails and phone numbers from organization websites.

```bash
# Process all organizations
NOTION_TOKEN=... NOTION_DATABASE_ID=... node scripts/extract-contact-info.js

# Process only 10 organizations
NOTION_TOKEN=... NOTION_DATABASE_ID=... node scripts/extract-contact-info.js --limit=10

# Process batch 2 (organizations 11-20) with a limit of 10
NOTION_TOKEN=... NOTION_DATABASE_ID=... node scripts/extract-contact-info.js --limit=10 --batch=2

# Dry run (don't update Notion, just show what would be updated)
NOTION_TOKEN=... NOTION_DATABASE_ID=... node scripts/extract-contact-info.js --dryrun

# Extract only emails
NOTION_TOKEN=... NOTION_DATABASE_ID=... node scripts/extract-contact-info.js --email

# Extract only phone numbers
NOTION_TOKEN=... NOTION_DATABASE_ID=... node scripts/extract-contact-info.js --phone
```

#### How it works:

1. Queries the Notion database for organizations with websites but missing contact information
2. For each organization:
   - Fetches the website content
   - Tries to find a contact page and fetches it if available
   - Extracts emails and phone numbers from the content
   - Selects the best email and phone number based on predefined criteria
3. Updates the Notion database with extracted contact information
4. Generates a report of added contact information

## Reports

Each script generates a detailed report in the `reports` directory with:

- Summary statistics (processed, updated, skipped, failed)
- List of added information with confidence scores
- Links to the Notion pages that were updated

Reports are named with the current date and script name, e.g., `2025-07-31_website-enhancement.md`.

## Best Practices

1. **Run in batches**: For large databases, use the `--limit` and `--batch` options to process organizations in manageable chunks.
2. **Start with dry runs**: Use the `--dryrun` option to see what would be updated before making actual changes.
3. **Sequential execution**: Run the scripts in the following order for best results:
   1. enhance-websites.js
   2. find-linkedin.js
   3. extract-contact-info.js
4. **Monitor results**: Review the generated reports to assess the effectiveness of each script.

## Limitations

- Website discovery relies on simulated search results in the current implementation
- LinkedIn profile verification is limited due to LinkedIn's restrictions on scraping
- Website content extraction may fail for sites with complex JavaScript rendering
- Some websites may block automated requests

## Troubleshooting

- If a script fails with a timeout error, try running it again with a smaller batch size
- If you encounter rate limiting issues, add delays between requests or use a smaller batch size
- For websites that block automated requests, consider using a proxy or rotating user agents

## Future Improvements

- Implement proper search API integration for website discovery
- Add support for handling JavaScript-rendered websites
- Improve contact information extraction with machine learning techniques
- Add support for additional contact channels (Twitter, Facebook, etc.) 