# BC AI Ecosystem Database Schema

## Overview

This document details the database schema used in the BC AI Ecosystem Community Atlas. The database is implemented in Notion and contains comprehensive metadata for each organization in the BC AI ecosystem.

## Database ID
- **Database ID**: `1f0c6f79-9a33-81bd-8332-ca0235c24655`
- **Public URL**: https://vancouver.bc-ai.net/1f0c6f799a3381bd8332ca0235c24655

## Core Fields

### Identification
| Field | Type | Description |
|-------|------|-------------|
| **Name** | Title | Organization name (primary identifier) |
| **Website** | URL | Primary website URL |
| **LinkedIn** | URL | LinkedIn company page |

### Contact Information
| Field | Type | Description |
|-------|------|-------------|
| **Email** | Email | Primary contact email |
| **Phone** | Phone Number | Primary contact phone |
| **Primary Contact** | Rich Text | Name and role of primary contact person |
| **Key People** | Rich Text | Additional key personnel and their roles |
| **Contact/Links** | Rich Text | Additional contact methods and links |

### Geographic Information
| Field | Type | Description |
|-------|------|-------------|
| **City/Region** | Rich Text | Specific city or regional location |
| **BC Region** | Select | Provincial region classification |

#### BC Region Options:
- Lower Mainland
- Vancouver Island  
- Interior
- Northern BC
- Other Regions

### Organization Classification
| Field | Type | Description |
|-------|------|-------------|
| **Category** | Select | Primary organization type |
| **Size** | Select | Organization size classification |
| **Year Founded** | Number | Year the organization was established |

#### Category Options:
- Grassroots Communities
- Academic & Research Labs
- Start-ups & Scale-ups
- Enterprise / Corporate Divisions
- Government & Crown Programs
- Indigenous Tech & Creative Orgs
- Social-Impact & Climate-Tech Hubs
- Investors & Funds
- Service Studios / Agencies
- Media & Storytellers
- Open-Source Projects
- Education & Training Providers
- Advocacy & Policy Groups

#### Size Options:
- Startup (1-50)
- Scale-up (51-250)
- Enterprise (250+)
- Non-profit/Public

### AI & Technology Focus
| Field | Type | Description |
|-------|------|-------------|
| **AI Focus Areas** | Multi-select | Primary AI technologies and applications |
| **Notable Projects** | Rich Text | Significant projects and achievements |
| **Short Blurb** | Rich Text | Brief description of the organization |
| **Focus & Notes** | Rich Text | Detailed notes on AI focus and capabilities |

#### AI Focus Areas Options:
- NLP/LLMs
- Computer Vision
- Robotics
- MLOps
- AI Ethics
- GenAI
- Data Science
- XR/Metaverse
- Healthcare AI
- Indigenous AI Applications
- CleanTech AI
- Film/VFX AI
- Resource Sector AI
- EdTech AI

### Relationship Management
| Field | Type | Description |
|-------|------|-------------|
| **Status** | Select | Current engagement status |
| **Relationship** | Select | Relationship strength/type |
| **Opt-In Status** | Select | Communication preferences |
| **Last Touch Date** | Date | Most recent contact date |
| **Date Added** | Date | When organization was added to database |
| **Warm-Intro Vector** | Rich Text | Potential introduction paths |

#### Status Options:
- Researching
- Contacted
- Meeting Scheduled
- Partnership Established
- On Hold

#### Relationship Options:
- New
- Acquaintance
- Established
- Partner
- Collaborator

#### Opt-In Status Options:
- Pending
- Engaged
- Dormant
- Opt-Out

### Support & Collaboration
| Field | Type | Description |
|-------|------|-------------|
| **Support Need** | Multi-select | What the organization needs |
| **Related Organizations** | Relation | Connected organizations in database |

#### Support Need Options:
- Funding
- Talent
- Venue
- Mentorship
- Policy Support
- Technical Resources
- Market Access
- Partnerships

### Data Management
| Field | Type | Description |
|-------|------|-------------|
| **Data Source** | Select | How the organization was discovered |
| **Logo** | Files | Organization logo and branding materials |

#### Data Source Options:
- Form Submission
- Manual Scrape
- Referral
- API
- Event

## Database Relationships

### Self-Referencing Relationships
- **Related Organizations**: Links organizations that are connected, subsidiaries, or partners

## Database Views

The database supports multiple views for different use cases:
- **All Organizations**: Complete database view
- **By Category**: Filtered by organization type
- **By Region**: Filtered by geographic location
- **By AI Focus**: Filtered by technology area
- **Engagement Pipeline**: Filtered by relationship status
- **Support Needs**: Filtered by what organizations need

## Data Quality Guidelines

### Required Fields
- Name (title field)
- Category
- BC Region

### Recommended Fields
- Website
- City/Region
- AI Focus Areas
- Short Blurb
- Status

### Data Validation Rules
- URLs must be properly formatted
- Dates must be valid
- Select fields must use predefined options
- Rich text fields support formatting and links

## Export Capabilities

The database supports export in multiple formats:
- CSV for analysis
- JSON for integration
- Markdown for documentation
- Public web view for sharing

## API Access

Database can be accessed via:
- Notion API (with proper authentication)
- Public web URLs for individual records
- Embedded views for external websites

## Privacy & Permissions

- Public information is available via public URLs
- Contact details may be restricted based on opt-in status
- Database maintains audit trail of changes
- GDPR/privacy compliance for personal information 