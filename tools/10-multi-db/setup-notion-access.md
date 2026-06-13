# 🔑 Setup Notion Access for Your Funding List

## Quick Setup (2 minutes):

### 1. Create Integration for Your Page
- Go to: https://www.notion.so/my-integrations
- Click "New integration"
- Name: "Funding Intelligence Extractor"
- Associate with your workspace
- Copy the "Internal Integration Token"

### 2. Share Your Page with Integration
- Open: https://kriskrug.notion.site/Long-List-of-Awesome-Funders-9212662f2cd3451bbde3470b9018ea12
- Click "Share" button (top right)
- Click "Invite"
- Paste your integration name
- Give it "Read" access

### 3. Set Environment Variable
```bash
export NOTION_TOKEN_FUNDING=your_new_integration_token_here
```

### 4. Test Extraction
```bash
cd tools/10-multi-db
NOTION_TOKEN_FUNDING=your_token node notion-funding-extractor.js
```

## Alternative: Manual Export
If Notion API doesn't work immediately:
1. Go to your funding page
2. Click "..." menu → Export → CSV
3. Save as `funding-list-export.csv`
4. We'll process the CSV directly

**Ready to extract hundreds of real funders!** 🚀