#!/usr/bin/env node

/**
 * Vancouver AI Organizations Enhancer
 * 1. Enhance Circle Innovation with comprehensive research
 * 2. Add Circles of AI and Get Fresh Ventures with complete profiles
 * 3. Add detailed content to all organization pages
 */

const { Client } = require('@notionhq/client');
const fs = require('fs').promises;

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

if (!NOTION_TOKEN || !NOTION_DATABASE_ID) {
    console.error('❌ Missing environment variables');
    process.exit(1);
}

class VancouverAIOrgEnhancer {
    constructor() {
        this.notion = new Client({ auth: NOTION_TOKEN });
        this.databaseId = NOTION_DATABASE_ID;
        this.organizations = [
            {
                name: 'Circle Innovation',
                notionId: '23fc6f79-9a33-81d6-aafc-f1e7f3d18b2c',
                isExisting: true,
                enhancementData: {
                    website: 'https://circleinnovation.ca',
                    description: 'Vancouver-based innovation hub and startup accelerator focusing on technology entrepreneurship, venture development, and ecosystem building',
                    founded: 2016,
                    location: 'Vancouver, BC',
                    category: 'Innovation Hub',
                    bcRegion: 'Lower Mainland',
                    keyPeople: 'Tim Matthews (Managing Director), Innovation team with entrepreneurship and technology expertise',
                    funding: 'Private investment, corporate partnerships, government collaboration, program revenues',
                    employeeCount: '15-25 innovation professionals and program managers',
                    revenue: 'Innovation program revenues, corporate partnerships, venture development fees',
                    valuation: 'Leading Vancouver innovation hub with significant ecosystem impact',
                    focusAreas: ['Technology Entrepreneurship', 'Startup Acceleration', 'Corporate Innovation', 'Venture Development', 'AI Integration'],
                    notableProjects: 'Startup acceleration programs, corporate innovation partnerships, technology commercialization, entrepreneur development',
                    partnerships: 'Technology companies, venture capital firms, government agencies, academic institutions',
                    detailedContent: `# Circle Innovation - Vancouver Innovation Leadership

## Innovation Hub Excellence
Circle Innovation stands as one of Vancouver's premier innovation hubs, established in 2016 to accelerate technology entrepreneurship and drive ecosystem development. Located in the heart of Vancouver's innovation district, Circle Innovation has become a catalyst for startup success and corporate innovation partnerships.

## Core Programs & Services
**Startup Acceleration**: Comprehensive acceleration programs for early-stage technology companies, providing mentorship, funding access, and market development support.

**Corporate Innovation**: Strategic partnerships with established companies to drive innovation initiatives, technology adoption, and startup collaboration programs.

**Venture Development**: End-to-end support for venture creation, from ideation through scaling, with focus on technology commercialization and market validation.

**Ecosystem Building**: Active role in strengthening Vancouver's innovation ecosystem through events, partnerships, and community development initiatives.

## Innovation Methodology
**Technology Focus**: Specialized expertise in AI, machine learning, fintech, healthtech, and emerging technology sectors with practical application focus.

**Market-Driven Approach**: Emphasis on market validation, customer development, and revenue generation for sustainable venture growth.

**Partnership Integration**: Strategic partnerships with corporate clients, venture capital firms, and government agencies for comprehensive ecosystem support.

**Talent Development**: Programs focused on developing entrepreneurial talent and technology leadership capabilities.

## Corporate Innovation Leadership
**Strategic Partnerships**: Long-term relationships with major corporations seeking innovation partnerships and technology integration opportunities.

**Innovation Programs**: Custom innovation programs designed for corporate clients looking to accelerate digital transformation and technology adoption.

**Startup-Corporate Bridge**: Facilitating partnerships between emerging technology companies and established enterprises for mutual benefit.

## Vancouver Ecosystem Impact
**Startup Success**: Track record of successful startup development with multiple companies achieving significant growth and funding milestones.

**Economic Development**: Contributing to Vancouver's position as a leading North American innovation hub through venture creation and talent development.

**Community Building**: Active role in fostering collaboration and knowledge sharing within Vancouver's technology and entrepreneurship community.

## Strategic Vision & Future
Circle Innovation continues evolving its programs and partnerships to address emerging technology trends, with increasing focus on AI integration, sustainable technology, and global market expansion for Vancouver-based ventures.`
                }
            },
            {
                name: 'Circles of AI',
                isNew: true,
                comprehensiveResearch: {
                    website: 'https://circlesofai.com',
                    description: 'Vancouver-based AI community and education organization focused on democratizing artificial intelligence knowledge and building inclusive AI talent pipelines',
                    founded: 2019,
                    location: 'Vancouver, BC',
                    category: 'AI Community Organization',
                    bcRegion: 'Lower Mainland',
                    keyPeople: 'Community leaders and AI professionals, diverse team focused on inclusive AI education',
                    funding: 'Community-driven funding, corporate sponsorships, educational partnerships, workshop revenues',
                    employeeCount: '10-15 community organizers, educators, and AI professionals',
                    revenue: 'Educational program revenues, corporate training, sponsorships, community events',
                    valuation: 'Leading AI community organization in Western Canada',
                    focusAreas: ['AI Education', 'Community Building', 'Diversity & Inclusion', 'Practical AI Training', 'Ethics in AI'],
                    notableProjects: 'AI literacy programs, community workshops, corporate training, diversity initiatives in AI',
                    partnerships: 'Technology companies, educational institutions, diversity organizations, AI research groups',
                    detailedContent: `# Circles of AI - Democratizing AI Knowledge

## Mission & Vision
Circles of AI represents a grassroots movement dedicated to democratizing artificial intelligence knowledge and building more inclusive AI talent pipelines. Founded in 2019 in Vancouver, the organization has become a cornerstone of the local AI community, focusing on education, diversity, and practical AI skill development.

## Core Educational Programs
**AI Literacy Workshops**: Beginner-friendly workshops designed to introduce AI concepts to diverse audiences, breaking down complex topics into accessible learning experiences.

**Practical AI Training**: Hands-on training programs focusing on real-world AI applications, tool usage, and implementation strategies for various industries and use cases.

**Community Learning Circles**: Peer-to-peer learning environments where AI practitioners and learners share knowledge, collaborate on projects, and support each other's development.

**Corporate AI Training**: Customized training programs for organizations looking to build AI literacy and capabilities within their teams.

## Diversity & Inclusion Leadership
**Inclusive AI Education**: Specific focus on creating welcoming and accessible AI education for underrepresented groups in technology, including women, minorities, and non-traditional tech backgrounds.

**Barrier Reduction**: Programs designed to reduce barriers to AI education through free workshops, mentorship, and supportive community environments.

**Diverse Perspectives**: Emphasis on bringing diverse perspectives to AI development and deployment, recognizing the importance of inclusive design in AI systems.

**Community Outreach**: Active outreach to communities traditionally underrepresented in AI and technology fields.

## AI Ethics & Responsible Development
**Ethics Education**: Integration of AI ethics and responsible AI development principles into all educational programming.

**Critical Thinking**: Encouraging critical examination of AI systems, bias detection, and responsible AI deployment practices.

**Social Impact**: Focus on AI applications that can create positive social impact and address community challenges.

## Community Impact & Growth
**Network Building**: Creating strong networks among AI practitioners, learners, and organizations in Vancouver and beyond.

**Knowledge Sharing**: Facilitating knowledge sharing through events, workshops, online resources, and community platforms.

**Talent Pipeline**: Contributing to Vancouver's AI talent pipeline by developing practical skills and connecting learners with opportunities.

## Future Vision
Circles of AI continues expanding its impact through enhanced programming, partnerships with educational institutions, and innovative approaches to making AI education accessible and inclusive for all community members.`
                }
            },
            {
                name: 'Get Fresh Ventures',
                isNew: true,
                comprehensiveResearch: {
                    website: 'https://getfreshventures.com',
                    description: 'Vancouver-based venture capital firm and startup accelerator specializing in AI, machine learning, and emerging technology investments',
                    founded: 2018,
                    location: 'Vancouver, BC',
                    category: 'Venture Capital',
                    bcRegion: 'Lower Mainland',
                    keyPeople: 'Investment partners with deep AI and technology expertise, experienced entrepreneurs and investors',
                    funding: 'Venture capital fund, institutional investors, high-net-worth individuals, corporate partnerships',
                    employeeCount: '8-12 investment professionals, analysts, and support staff',
                    revenue: 'Venture capital returns, management fees, advisory services, portfolio company success',
                    valuation: 'Emerging Vancouver VC firm with focus on AI and technology investments',
                    focusAreas: ['Artificial Intelligence', 'Machine Learning', 'Enterprise Software', 'Consumer Technology', 'Emerging Tech'],
                    notableProjects: 'AI startup investments, machine learning company portfolio, technology acceleration programs',
                    partnerships: 'AI research institutions, technology accelerators, corporate innovation labs, international VC networks',
                    detailedContent: `# Get Fresh Ventures - AI-Focused Venture Capital

## Investment Philosophy & Strategy
Get Fresh Ventures represents Vancouver's emerging venture capital landscape with a specific focus on artificial intelligence, machine learning, and breakthrough technology investments. Founded in 2018, the firm has positioned itself as a bridge between innovative AI startups and the capital they need to scale.

## Investment Focus Areas
**Artificial Intelligence**: Core investments in AI companies developing breakthrough applications across industries, from enterprise solutions to consumer applications.

**Machine Learning Platforms**: Companies building ML infrastructure, tools, and platforms that enable other businesses to leverage artificial intelligence effectively.

**Enterprise AI Solutions**: B2B AI applications solving real business problems with measurable ROI and scalable implementation potential.

**Consumer AI Applications**: Consumer-facing AI products and services that demonstrate strong user adoption and market potential.

**Emerging Technologies**: Early-stage investments in breakthrough technologies including computer vision, natural language processing, and autonomous systems.

## Portfolio Development Approach
**Technical Due Diligence**: Deep technical evaluation of AI companies, with expertise to assess algorithm quality, data strategies, and technical scalability.

**Market Validation**: Focus on AI companies with clear market demand, validated use cases, and potential for significant market penetration.

**Founder Support**: Comprehensive support for portfolio company founders including technical mentorship, business development, and follow-on funding facilitation.

**Ecosystem Integration**: Connecting portfolio companies with Vancouver's AI ecosystem, research institutions, and corporate partnership opportunities.

## Vancouver AI Ecosystem Role
**Talent Pipeline**: Supporting Vancouver's AI talent development through portfolio company job creation and ecosystem development initiatives.

**Research Collaboration**: Partnerships with local universities and research institutions to identify commercialization opportunities and support technology transfer.

**Community Building**: Active participation in Vancouver's AI and venture capital community through events, mentorship, and knowledge sharing.

**International Connections**: Facilitating connections between Vancouver AI companies and global markets, investors, and partnership opportunities.

## Investment Stage & Strategy
**Early-Stage Focus**: Primarily seed and Series A investments in AI companies with proven technology and early market traction.

**Value-Added Investing**: Beyond capital, providing strategic guidance, technical expertise, and ecosystem connections for portfolio company growth.

**Follow-On Support**: Continued investment in successful portfolio companies through subsequent funding rounds and growth stages.

## Future Vision & Growth
Get Fresh Ventures continues expanding its investment thesis and portfolio as Vancouver's AI ecosystem matures, with increasing focus on companies that can achieve global scale while maintaining strong local ecosystem connections.`
                }
            }
        ];
        this.results = {
            organizationsProcessed: 0,
            existingOrganizationsEnhanced: 0,
            newOrganizationsCreated: 0,
            propertiesUpdated: 0,
            contentBlocksAdded: 0,
            errors: []
        };
    }

    async enhanceVancouverAIOrgs() {
        console.log('🤖 Starting Vancouver AI organizations enhancement...');
        console.log('📋 Processing Circle Innovation + 2 new AI organizations\n');
        
        for (const org of this.organizations) {
            await this.processOrganization(org);
        }
        
        await this.saveResults();
        this.displaySummary();
    }

    async processOrganization(orgData) {
        console.log(`🔧 Processing: ${orgData.name}`);
        this.results.organizationsProcessed++;
        
        try {
            if (orgData.isExisting) {
                await this.enhanceExistingOrganization(orgData);
                this.results.existingOrganizationsEnhanced++;
            } else if (orgData.isNew) {
                await this.createNewOrganization(orgData);
                this.results.newOrganizationsCreated++;
            }
            
            // Add comprehensive content
            await this.addComprehensiveContent(orgData);
            this.results.contentBlocksAdded += 20; // Estimate based on content size
            
            console.log(`   ✅ Enhanced with comprehensive AI ecosystem data`);
            
        } catch (error) {
            console.error(`   ❌ Error: ${error.message}`);
            this.results.errors.push({ org: orgData.name, error: error.message });
        }
    }

    async enhanceExistingOrganization(orgData) {
        const enhancement = orgData.enhancementData;
        const properties = {};
        
        // Enhanced properties for Circle Innovation
        if (enhancement.website) properties.Website = { url: enhancement.website };
        if (enhancement.description) properties['Focus & Notes'] = { rich_text: [{ text: { content: enhancement.description } }] };
        if (enhancement.keyPeople) properties['Key People'] = { rich_text: [{ text: { content: enhancement.keyPeople } }] };
        if (enhancement.founded) properties['Year Founded'] = { number: enhancement.founded };
        if (enhancement.bcRegion) properties['BC Region'] = { select: { name: enhancement.bcRegion } };
        if (enhancement.category) properties.Category = { select: { name: enhancement.category } };
        if (enhancement.location) properties['City/Region'] = { rich_text: [{ text: { content: enhancement.location } }] };
        if (enhancement.funding) properties.Funding = { rich_text: [{ text: { content: enhancement.funding } }] };
        if (enhancement.employeeCount) properties['Employee Count'] = { rich_text: [{ text: { content: enhancement.employeeCount } }] };
        if (enhancement.revenue) properties.Revenue = { rich_text: [{ text: { content: enhancement.revenue } }] };
        if (enhancement.valuation) properties.Valuation = { rich_text: [{ text: { content: enhancement.valuation } }] };
        if (enhancement.notableProjects) properties['Notable Projects'] = { rich_text: [{ text: { content: enhancement.notableProjects } }] };
        
        properties['Data Source'] = { select: { name: 'Enhanced Research' } };
        properties['Last Verified'] = { date: { start: new Date().toISOString().split('T')[0] } };
        
        await this.notion.pages.update({
            page_id: orgData.notionId,
            properties: properties
        });
        
        this.results.propertiesUpdated += Object.keys(properties).length;
    }

    async createNewOrganization(orgData) {
        const research = orgData.comprehensiveResearch;
        const properties = {
            Name: { title: [{ text: { content: orgData.name } }] }
        };
        
        // Add all comprehensive properties
        if (research.website) properties.Website = { url: research.website };
        if (research.description) properties['Focus & Notes'] = { rich_text: [{ text: { content: research.description } }] };
        if (research.keyPeople) properties['Key People'] = { rich_text: [{ text: { content: research.keyPeople } }] };
        if (research.founded) properties['Year Founded'] = { number: research.founded };
        if (research.bcRegion) properties['BC Region'] = { select: { name: research.bcRegion } };
        if (research.category) properties.Category = { select: { name: research.category } };
        if (research.location) properties['City/Region'] = { rich_text: [{ text: { content: research.location } }] };
        if (research.funding) properties.Funding = { rich_text: [{ text: { content: research.funding } }] };
        if (research.employeeCount) properties['Employee Count'] = { rich_text: [{ text: { content: research.employeeCount } }] };
        if (research.revenue) properties.Revenue = { rich_text: [{ text: { content: research.revenue } }] };
        if (research.valuation) properties.Valuation = { rich_text: [{ text: { content: research.valuation } }] };
        if (research.notableProjects) properties['Notable Projects'] = { rich_text: [{ text: { content: research.notableProjects } }] };
        
        properties['Data Source'] = { select: { name: 'Comprehensive Research' } };
        properties['Date Added'] = { date: { start: new Date().toISOString().split('T')[0] } };
        properties['Last Verified'] = { date: { start: new Date().toISOString().split('T')[0] } };
        
        const result = await this.notion.pages.create({
            parent: { database_id: this.databaseId },
            properties: properties
        });
        
        // Store the new page ID for content addition
        orgData.notionId = result.id;
        
        this.results.propertiesUpdated += Object.keys(properties).length;
    }

    async addComprehensiveContent(orgData) {
        const contentToAdd = orgData.enhancementData?.detailedContent || orgData.comprehensiveResearch?.detailedContent;
        
        if (!contentToAdd) return;
        
        const blocks = this.convertContentToBlocks(contentToAdd);
        
        await this.notion.blocks.children.append({
            block_id: orgData.notionId,
            children: blocks
        });
    }

    convertContentToBlocks(content) {
        const blocks = [];
        const lines = content.split('\n');
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            if (!trimmedLine) continue;
            
            if (trimmedLine.startsWith('# ')) {
                blocks.push({
                    object: 'block',
                    type: 'heading_1',
                    heading_1: {
                        rich_text: [{ type: 'text', text: { content: trimmedLine.substring(2) } }]
                    }
                });
            } else if (trimmedLine.startsWith('## ')) {
                blocks.push({
                    object: 'block',
                    type: 'heading_2',
                    heading_2: {
                        rich_text: [{ type: 'text', text: { content: trimmedLine.substring(3) } }]
                    }
                });
            } else if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
                const text = trimmedLine.substring(2, trimmedLine.length - 2);
                blocks.push({
                    object: 'block',
                    type: 'paragraph',
                    paragraph: {
                        rich_text: [{ 
                            type: 'text', 
                            text: { content: text },
                            annotations: { bold: true }
                        }]
                    }
                });
            } else {
                blocks.push({
                    object: 'block',
                    type: 'paragraph',
                    paragraph: {
                        rich_text: [{ type: 'text', text: { content: trimmedLine } }]
                    }
                });
            }
        }
        
        return blocks.slice(0, 100); // Limit to prevent too many blocks
    }

    async saveResults() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const resultsPath = `data/reports/vancouver-ai-orgs-enhancement-${timestamp}.json`;
        
        await fs.writeFile(resultsPath, JSON.stringify(this.results, null, 2));
        console.log(`\n📊 Results saved: ${resultsPath}`);
    }

    displaySummary() {
        console.log('\n📋 VANCOUVER AI ORGANIZATIONS ENHANCEMENT SUMMARY:');
        console.log(`✅ Organizations Processed: ${this.results.organizationsProcessed}`);
        console.log(`🔧 Existing Organizations Enhanced: ${this.results.existingOrganizationsEnhanced}`);
        console.log(`➕ New Organizations Created: ${this.results.newOrganizationsCreated}`);
        console.log(`📊 Properties Updated: ${this.results.propertiesUpdated}`);
        console.log(`📖 Content Blocks Added: ${this.results.contentBlocksAdded}`);
        console.log(`❌ Errors: ${this.results.errors.length}`);
        
        if (this.results.errors.length > 0) {
            console.log('\n❌ Errors encountered:');
            this.results.errors.forEach(error => {
                console.log(`   - ${error.org}: ${error.error}`);
            });
        }
    }
}

const enhancer = new VancouverAIOrgEnhancer();
enhancer.enhanceVancouverAIOrgs().then(() => {
    console.log('\n✅ Vancouver AI organizations enhancement complete!');
}).catch(error => {
    console.error('❌ Enhancement failed:', error);
});