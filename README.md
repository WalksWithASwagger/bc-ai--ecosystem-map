# BC AI Ecosystem Community Atlas

## Project Overview

The BC AI Ecosystem Community Atlas is a comprehensive mapping initiative documenting the artificial intelligence landscape across British Columbia. This project catalogs organizations, companies, research institutions, and community groups involved in AI development, research, and application throughout the province.

## Project Goals

- **Map the Ecosystem**: Create a comprehensive database of AI-related organizations across BC
- **Foster Connections**: Enable networking and collaboration within the BC AI community
- **Support Growth**: Identify gaps, opportunities, and support needs within the ecosystem
- **Policy Insights**: Provide data to inform AI policy and investment decisions
- **Community Building**: Strengthen the grassroots AI movement in BC

## Scope & Coverage

### Geographic Regions
- **Lower Mainland**: Vancouver, Burnaby, Richmond, Surrey, etc.
- **Vancouver Island**: Victoria, Nanaimo, etc.
- **Interior**: Kelowna, Kamloops, Prince George, etc.
- **Northern BC**: Prince Rupert, Fort St. John, etc.

### Organization Types
- **Grassroots Communities**: Meetups, user groups, informal networks
- **Academic & Research Labs**: Universities, research institutes
- **Start-ups & Scale-ups**: Early-stage companies and growing businesses
- **Enterprise / Corporate Divisions**: Large company AI initiatives
- **Government & Crown Programs**: Public sector AI initiatives
- **Indigenous Tech & Creative Orgs**: Indigenous-led technology organizations
- **Social-Impact & Climate-Tech Hubs**: Mission-driven organizations
- **Investors & Funds**: VCs, angels, funding organizations
- **Service Studios / Agencies**: Consulting and development services
- **Media & Storytellers**: Content creators and journalists
- **Open-Source Projects**: Community-driven development initiatives
- **Education & Training Providers**: Learning and skills development
- **Advocacy & Policy Groups**: Policy and ethics organizations

### AI Focus Areas
- **NLP/LLMs**: Natural language processing and large language models
- **Computer Vision**: Image and video analysis
- **Robotics**: Autonomous systems and robotics
- **MLOps**: Machine learning operations and infrastructure
- **GenAI**: Generative artificial intelligence
- **Data Science**: Analytics and data-driven insights
- **XR/Metaverse**: Extended reality and virtual worlds
- **Healthcare AI**: Medical and health applications
- **CleanTech AI**: Environmental and sustainability applications
- **Film/VFX AI**: Entertainment and media applications
- **Resource Sector AI**: Mining, forestry, and natural resources
- **EdTech AI**: Educational technology applications
- **Indigenous AI Applications**: Culturally-appropriate AI applications

## Database Structure

The project maintains a structured database with detailed metadata for each organization:

### Core Information
- Organization name and contact details
- Website, LinkedIn, email, phone
- Primary contacts and key personnel
- Geographic location and BC region

### Classification & Categorization
- Organization category and type
- AI focus areas and technologies
- Company size and stage
- Year founded

### Relationship Management
- Engagement status and opt-in preferences
- Relationship strength and history
- Last contact date and interaction notes
- Warm introduction vectors

### Strategic Information
- Support needs (funding, talent, venue, partnerships, etc.)
- Notable projects and achievements
- Data sources and research notes
- Related organizations and connections

## Key Features

### Community-Driven Approach
- Grassroots data collection and validation
- Community input forms and submission processes
- Collaborative maintenance and updates

### Comprehensive Tracking
- Multi-dimensional organization profiling
- Relationship and engagement tracking
- Geographic distribution analysis
- Technology focus mapping

### Public Access
- Public-facing database views
- Searchable and filterable interfaces
- Export capabilities for research and analysis

## Current Status

The database contains hundreds of organizations across BC, with active data collection and validation processes. The project includes:

- **Active Database**: Living database with regular updates
- **Submission Forms**: Community input mechanisms
- **Custom Views**: Specialized database views for different use cases
- **Outreach Strategy**: Systematic engagement and relationship building
- **Setup Guides**: Documentation for database customization and use

## Public URLs

- **Main Atlas**: https://vancouver.bc-ai.net/ai-ecosystem
- **Public Database**: https://vancouver.bc-ai.net/1f0c6f799a3381bd8332ca0235c24655

## Technical Setup

### MCP Integration
This project uses **Model Context Protocol (MCP)** for all Notion database operations:
- **MCP Server**: `@notionhq/notion-mcp-server` (official Notion MCP server)
- **Configuration**: `/Users/kk/.cursor/mcp.json` 
- **Database ID**: `1f0c6f799a3381bd8332ca0235c24655`
- **Status**: ✅ Configured and ready

### Key Files
- `new_organizations.md` - Organizations pending addition (✅ = already added)
- `CLAUDE.md` - Development preferences and MCP configuration details
- `database-schema.md` - Database structure documentation
- `organization-examples.md` - Example organization entries

## Contributing

Organizations can be added to the database through:
1. **MCP Tools** - Preferred method for AI-assisted data entry
2. Community submission forms
3. Direct research and outreach
4. Partner referrals and recommendations
5. Event and networking connections

## Maintenance

The project requires ongoing maintenance for:
- Data accuracy and currency using MCP tools
- Relationship status updates
- New organization discovery and validation
- Community engagement tracking
- Duplicate detection and cleanup

## Impact

This mapping effort supports:
- **Economic Development**: Understanding BC's AI capacity and capabilities
- **Policy Development**: Informing government AI strategies and investments
- **Community Building**: Connecting organizations and individuals
- **Research & Analysis**: Supporting academic and industry research
- **Investment Decisions**: Guiding funding and partnership opportunities 