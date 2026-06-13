# BC AI Ecosystem Database Enhancement Plan

*Based on completeness scan from July 29, 2025*

## Executive Summary

The BC AI Ecosystem database currently contains **458 organizations** with varying levels of data completeness. This document outlines a structured approach to enhance the database quality based on the completeness scan results.

Key findings:
- **Geographic data** is mostly complete (84-91%)
- **Basic categorization** is strong (77-90%)
- **Contact information** is significantly lacking (25-52%)
- **Detailed organization data** is sparse, particularly logos (0%), key people (10%), and founding year (15%)

## Priority Enhancement Areas

### 1. Logo Acquisition (0% complete)
**Goal:** Add logos for at least 100 organizations in the first phase.

**Process:**
1. Focus on most prominent/complete organizations first
2. Search company websites and LinkedIn profiles
3. Use Google Image search with "company name logo filetype:png" or similar
4. Save to `/logos` directory following naming convention: `Organization_Name_logo.png`
5. Update Notion entries with logo files

**Tools:**
- Create a simple script to batch upload logos once collected

### 2. Key People Information (10% complete)
**Goal:** Add key leadership/founders for at least 150 organizations.

**Process:**
1. Prioritize organizations with complete contact information
2. Extract from:
   - Company "About" or "Team" pages
   - LinkedIn company pages
   - BC business registry records
3. Format consistently as "Name (Title), Name (Title)"

### 3. Year Founded (15% complete)
**Goal:** Add founding year for at least 200 organizations.

**Process:**
1. Check company websites ("About Us" sections)
2. LinkedIn company profiles
3. Crunchbase/PitchBook data
4. BC business registry records

### 4. Contact Information (25-52% complete)
**Goal:** Improve email (26%) and phone (25%) completion rates to at least 50%.

**Process:**
1. Company website contact pages
2. LinkedIn company profiles
3. Business directories
4. Direct outreach for verification

## Implementation Strategy

### Phase 1: Quick Wins (Weeks 1-2)
- Set up Logo directory structure and naming convention
- Collect founding years from readily available sources
- Add emails/phones from company websites

### Phase 2: Deep Research (Weeks 3-4)
- Research key people for top 100 organizations
- Conduct targeted outreach for missing contact information
- Fill gaps in AI Focus Areas and Short Blurbs

### Phase 3: Batch Processing (Weeks 5-6)
- Develop and run batch update scripts for similar organizations
- Focus on organizations in the same category or region
- Normalize data formats across all entries

## Batch Processing Groups

### Group A: Most Incomplete Organizations
The scan identified 25 organizations with only 13% completeness. These should be prioritized for:
1. Basic contact information
2. Geographic data
3. Categorization

### Group B: Geographic Clusters
Organizations can be processed in regional batches:
- Lower Mainland
- Vancouver Island
- Interior
- Northern BC

### Group C: Category-Based Enhancement
Process organizations by category to leverage domain-specific research:
- Startups
- Service Providers
- Research Institutions
- Enterprise/Corporate

## Data Quality Standards

For each field type, we should establish minimum quality standards:

### Contact Information
- **Website:** Must include protocol (http/https)
- **Email:** Valid format with organizational domain (not personal email)
- **Phone:** Consistent format with country/area code

### Organization Details
- **Short Blurb:** 1-3 sentences describing core AI activities
- **Key People:** Name and title format
- **Year Founded:** Verified from multiple sources when possible

### Geographic Data
- **City/Region:** Specific city when available
- **BC Region:** Must match one of the established categories

## Tooling Enhancements

To support this work, we should develop:

1. **Batch Logo Processor:** Script to resize and optimize logos before upload
2. **Data Validation Script:** Check for format consistency across fields
3. **Completeness Tracker:** Regular scans to monitor progress

## Success Metrics

Progress will be tracked by:
1. Overall completeness percentage (currently ~53%)
2. Number of organizations with >80% complete data
3. Field-specific completion rates

## Next Steps

1. Create a prioritized list of the 100 most important organizations
2. Establish a consistent research workflow
3. Set up weekly progress tracking
4. Begin with Logo and Year Founded acquisition

---

*This plan will be updated as work progresses and new insights emerge.* 