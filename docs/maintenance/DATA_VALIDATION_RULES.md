# 🛡️ Data Validation Rules for BC AI Ecosystem Database

## Purpose
Prevent invalid data from entering the Notion database and maintain data quality.

## 🚫 Entry Rejection Rules

### 1. Name Validation
```javascript
// Reject if name:
- Length < 4 characters
- Matches field names: /^(name|email|website|category|status|revenue|funding)$/i
- Is just a number: /^\d+$/
- Is a single letter: /^[a-z]$/i
- Contains URL: /^https?:\/\//
- Is an email: /@/
- Is a task: /^(track|monitor|add|create|update|develop)/i
```

### 2. Required Data Points
Every entry MUST have:
- A valid organization name
- At least ONE of:
  - Website URL
  - Email address
  - Physical location
  - Description (min 20 characters)
  - Year founded
  - Key people

### 3. Suspicious Pattern Detection
Block entries matching:
```javascript
const suspiciousPatterns = [
  // Field/property names
  /^(field|property|attribute|column|value|key)$/i,
  
  // Data types
  /^(string|number|boolean|array|object|null)$/i,
  
  // Status values alone
  /^(active|inactive|pending|draft|archived)$/i,
  
  // Time periods
  /^(q[1-4]|quarter|fiscal|yearly|monthly)$/i,
  
  // File extensions
  /\.(json|csv|txt|pdf|doc)$/i,
  
  // Before/After patterns
  /^(before|after|pre|post)[\s\w]*$/i
];
```

## ✅ Valid Entry Requirements

### Minimum Valid Entry
```javascript
{
  name: "Company Name",    // Min 4 chars, passes validation
  website: "https://..."   // At least one additional field
}
```

### Recommended Entry
```javascript
{
  name: "Company Name",
  website: "https://example.com",
  email: "contact@example.com",
  category: "AI/ML",
  location: "Vancouver, BC",
  yearFounded: 2020,
  description: "AI company focused on..."
}
```

## 🔄 Import Process Validation

### Pre-Import Checks
1. Parse incoming data
2. Run validation on each entry
3. Generate report of valid/invalid entries
4. Only import valid entries
5. Log rejected entries with reasons

### Validation Function Template
```javascript
function validateEntry(entry) {
  const errors = [];
  
  // Name validation
  if (!entry.name || entry.name.length < 4) {
    errors.push("Name too short");
  }
  
  if (suspiciousPatterns.some(p => p.test(entry.name))) {
    errors.push("Name matches suspicious pattern");
  }
  
  // Data completeness
  const dataPoints = countDataPoints(entry);
  if (dataPoints < 2) {
    errors.push("Insufficient data");
  }
  
  return {
    valid: errors.length === 0,
    errors: errors
  };
}
```

## 📊 Quality Metrics

### Track These Metrics
1. **Completeness Score**: % of fields filled
2. **Data Freshness**: Last updated date
3. **Source Reliability**: Where data came from
4. **Validation Status**: Passed/Failed/Warning

### Warning Flags (Allow but Flag)
- Companies with only 2 data points
- Founding year in future (> current year)
- Very old founding years (< 1990 for tech)
- Unusually short descriptions (< 50 chars)

## 🚨 Automated Monitoring

### Daily Checks
```bash
# Run daily audit
node tools/daily-data-quality-check.js

# Check for:
- New suspicious patterns
- Declining data quality
- Duplicate entries
- Empty required fields
```

### Weekly Reports
- Total entries
- Quality score trends
- Most incomplete entries
- Recent suspicious additions

## 📝 Implementation Checklist

- [ ] Add validation to all import scripts
- [ ] Create pre-import validation tool
- [ ] Set up automated daily audits
- [ ] Create quality dashboard
- [ ] Document validation failures
- [ ] Regular pattern updates
- [ ] Training for data entry

## 🔧 Enforcement

1. **Strict Mode**: Reject all suspicious entries
2. **Review Mode**: Flag for human review
3. **Learning Mode**: Log but allow (for pattern discovery)

Choose mode based on:
- Data source reliability
- Import volume
- Available review resources