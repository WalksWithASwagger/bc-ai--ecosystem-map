# 🚀 Research Pipelines - Quick Start Guide

**Transform your database into a living intelligence platform in 5 minutes!**

---

## 🎯 **WHAT THIS DOES**

Your new research pipeline system will:
- **Find new companies** automatically every day
- **Track funding rounds** as they happen
- **Monitor competitors** and alert you to threats
- **Score everything** with AI to show you what matters most
- **Generate weekly intelligence reports** for strategic planning

---

## ⚡ **INSTANT DEMO (No Setup Required)**

Test everything safely with sample data:

```bash
# Navigate to pipelines
cd tools/08-pipelines

# Try the AI scoring system
node quick-start.js test-scoring

# Test funding intelligence
node quick-start.js test-funding

# Test competitive monitoring
node quick-start.js test-competitive

# Test company discovery
node quick-start.js test-discovery

# Run complete demo
node quick-start.js full-demo
```

**This uses sample data - completely safe to test!**

---

## 🔧 **SETUP FOR REAL DATA**

### Step 1: Install Dependencies
```bash
cd tools/08-pipelines
npm install node-cron axios cheerio
```

### Step 2: Test With Limited Real Data
```bash
# Test existing scrapers (safe, limited results)
node quick-start.js live-test

# Test BetaKit funding scraper
node ../scrapers/scrape-betakit-funding.js

# Test company discovery
node ../scrapers/discover-new-companies.js
```

### Step 3: Add API Keys (Optional but Recommended)
Add to your `.env` file:
```bash
# For advanced features (get free keys)
CRUNCHBASE_API_KEY=your_key_here
SLACK_WEBHOOK=your_webhook_for_alerts
```

---

## 🚀 **START THE AUTOMATION**

Once you're happy with testing:

```bash
# Start continuous monitoring
node pipeline-orchestrator.js start

# Or run specific pipelines manually
node pipeline-orchestrator.js funding     # Just funding intel
node pipeline-orchestrator.js discovery   # Just find new companies
```

---

## 📊 **WHAT YOU'LL GET**

### **Immediate Results** (in `/data/` folders):
- `funding-intelligence/` - Latest funding events with scores
- `competitive-intelligence/` - Threat alerts and competitor moves  
- `pipeline-outputs/` - New company discoveries
- `scoring-results/` - AI-prioritized target lists

### **Weekly Intelligence Briefings**:
- Market movement summary
- Top funding opportunities
- Competitive landscape changes
- Strategic recommendations

---

## 🎯 **PRIORITY SCORING SYSTEM**

Everything gets scored 0-100 and sorted into tiers:

- **Tier 1 (80-100)**: 🔥 Urgent - Act within 24 hours
- **Tier 2 (60-79)**: 📊 High Priority - Monitor closely  
- **Tier 3 (40-59)**: 📋 Medium Priority - Quarterly review
- **Tier 4 (20-39)**: 👀 Low Priority - Annual review
- **Tier 5 (0-19)**: 🗃️ Archive - Monitor only

---

## 🔍 **EXAMPLE OUTPUTS**

### **Company Discovery**:
```
🎯 Discovery #1: VancouverAI Corp
   Overall Score: 87/100 (Tier 1 - Critical)
   Confidence: 92%
   Recommendations:
   🔥 High-priority target for immediate research
   💼 Consider for strategic partnership tracking
```

### **Funding Intelligence**:
```
💵 Funding Event: TechFlow Systems
   Amount: $8.5M (Series A)
   Intelligence Score: 94/100 (Tier 1 - Critical)
   Urgency: Immediate
   Key Factors: Large round size ⭐, Top-tier investors ⭐
```

---

## 🛠️ **CUSTOMIZATION**

### **Adjust Scoring Priorities**:
Edit `quality-scoring-engine.js` weights:
```javascript
fundingHistory: 0.30,    // How important is funding track record?
teamQuality: 0.25,       // How important is team experience?
marketSize: 0.15,        // How important is market size?
```

### **Add Custom Data Sources**:
Add new scrapers to `pipeline-orchestrator.js`:
```javascript
{ script: 'scrapers/your-custom-scraper.js', priority: 'high' }
```

---

## 📈 **MONITORING YOUR SUCCESS**

Track your competitive advantage:

- **Discovery Speed**: Days ahead of competitors
- **Investment Accuracy**: % of Tier 1 companies that raise funding
- **Threat Detection**: Early warning time for competitive moves

---

## 🆘 **TROUBLESHOOTING**

### **"Nothing is running"**
```bash
# Check if orchestrator is running
ps aux | grep pipeline-orchestrator

# Check logs
tail -f logs/orchestrator/pipeline-status.log
```

### **"No data being collected"**
```bash
# Test individual components
node quick-start.js test-scoring
node ../scrapers/scrape-betakit-funding.js
```

### **"Scores seem wrong"**
```bash
# Review scoring weights in quality-scoring-engine.js
# Check sample data with: node quick-start.js test-scoring
```

---

## 🎪 **TRY IT NOW**

**Start with the safe demo:**
```bash
cd tools/08-pipelines
node quick-start.js full-demo
```

**Then test with real data:**
```bash
node quick-start.js live-test
```

**Finally, go live:**
```bash
node pipeline-orchestrator.js start
```

---

**🚀 Your database will never be static again - it's now a living intelligence platform!**

*Questions? Run `node quick-start.js` for help and examples.*