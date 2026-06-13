# ⚡ Quick MCP Notion Fix for Your Funding List

## The Issue
Your funding page is in the "kriskrug" workspace, but the current MCP token can't access it.

## 30-Second Fix:

### Option A: Share Page with Current Integration
1. Go to: https://www.notion.so/kriskrug/Long-List-of-Awesome-Funders-9212662f2cd3451bbde3470b9018ea12
2. Click "Share" (top right)
3. Click "Invite"
4. Add the integration that's currently configured in MCP
5. Give it "Read" access

### Option B: Quick CSV Export (Faster!)
1. Go to your funding page
2. Click "..." menu → Export → CSV
3. Save as `funding-list.csv`
4. Drop it in this folder
5. Run: `node csv-funding-extractor.js funding-list.csv`

## Test Access
Once fixed, I'll run:
```bash
node mcp-funding-extractor.js
```

And extract ALL your hundreds of real funders! 🚀