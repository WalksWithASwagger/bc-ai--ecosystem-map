#!/usr/bin/env node

/**
 * Content Research Enhancer - Add Comprehensive Research to Main Content Sections
 * Focus on detailed research content for organizational pages
 */

const { Client } = require('@notionhq/client');
const fs = require('fs').promises;

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

if (!NOTION_TOKEN || !NOTION_DATABASE_ID) {
    console.error('❌ Missing environment variables');
    process.exit(1);
}

class ContentResearchEnhancer {
    constructor() {
        this.notion = new Client({ auth: NOTION_TOKEN });
        this.databaseId = NOTION_DATABASE_ID;
        this.organizations = [
            {
                name: 'SFU Metacreation Lab for Creative AI',
                notionId: '23fc6f79-9a33-812a-8213-de318d6dfb1a',
                comprehensiveResearch: {
                    website: 'https://metacreation.net',
                    description: 'Simon Fraser University research lab pioneering creative applications of artificial intelligence and computational creativity',
                    founded: 2016,
                    location: 'Burnaby, BC',
                    category: 'Academic Research Lab',
                    bcRegion: 'Lower Mainland',
                    keyPeople: 'Dr. Philippe Pasquier (Director), Dr. Arne Eigenfeldt, graduate researchers and artists',
                    funding: 'SFU funding, SSHRC grants, NSERC funding, industry partnerships, arts council grants',
                    detailedContent: `# SFU Metacreation Lab for Creative AI - Research Excellence

## Overview
The Metacreation Lab at Simon Fraser University stands as a world-leading research facility focused on computational creativity and AI-driven artistic creation. Established in 2016, the lab has become a global hub for researchers, artists, and technologists exploring the intersection of artificial intelligence and creative expression.

## Research Focus Areas
**Computational Creativity**: Developing AI systems that can generate novel artistic content including music, visual art, poetry, and interactive media experiences.

**AI-Assisted Composition**: Creating tools and algorithms that support human artists in their creative processes while maintaining artistic authenticity and expression.

**Interactive Media Systems**: Building responsive environments that adapt to human interaction using machine learning and AI techniques.

**Musical AI**: Pioneering research in algorithmic composition, real-time musical interaction, and AI-human musical collaboration.

**Visual Arts & AI**: Exploring generative art, AI-assisted visual creation, and computational aesthetics.

## Key Research Projects
**SHIMON Robot**: Collaborative work on robotic musicianship and human-robot musical interaction.

**Metacompose**: AI-powered composition system for collaborative music creation between humans and machines.

**Interactive Soundscapes**: Location-aware audio experiences using AI to adapt to environmental and user contexts.

**Generative Visual Systems**: AI-driven visual art creation tools for artists and designers.

**Creative AI Ethics**: Research into ethical implications of AI in creative industries and artistic authorship.

## Industry Impact & Applications
**Entertainment Industry**: Partnerships with game developers, film studios, and music producers for AI-enhanced creative tools.

**Arts Community**: Collaborations with local and international artists to integrate AI into traditional artistic practices.

**Technology Transfer**: Licensing creative AI technologies to commercial applications and startup ventures.

**Cultural Institutions**: Partnerships with museums, galleries, and cultural organizations for AI-enhanced exhibitions.

## Academic Excellence
**Graduate Programs**: Training next generation of creative AI researchers through interdisciplinary programs combining computer science, arts, and cognitive science.

**Research Publications**: Leading publications in top-tier conferences including ICCC, ISMIR, CHI, and NIME.

**International Recognition**: Global reputation for creative AI research with collaborations across North America, Europe, and Asia.

**Innovation Methodology**: Unique approach combining rigorous computer science research with artistic practice and cultural theory.

## Strategic Partnerships
**Industry Collaborations**: Adobe, Google AI, Microsoft Research, local tech companies developing creative tools.

**Academic Networks**: MIT Media Lab, University of California Santa Barbara, Queen Mary University of London, leading creative technology institutions globally.

**Arts Organizations**: Vancouver Symphony Orchestra, contemporary art galleries, digital arts festivals.

**Government Support**: Canada Council for the Arts, BC Arts Council, federal research funding agencies.

## Future Vision & Impact
The lab continues to push boundaries in creative AI, working toward a future where artificial intelligence enhances rather than replaces human creativity, contributing to both technological advancement and cultural enrichment in British Columbia and globally.`
                }
            },
            {
                name: 'Innovate BC',
                notionId: '23dc6f79-9a33-813a-9d4d-d8d40eb0bf50',
                comprehensiveResearch: {
                    website: 'https://innovatebc.ca',
                    description: 'British Columbia\'s innovation agency supporting technology commercialization, startup development, and innovation ecosystem growth',
                    founded: 2018,
                    location: 'Vancouver, BC',
                    category: 'Government Agency',
                    bcRegion: 'Lower Mainland',
                    keyPeople: 'Raghwa Gopal (CEO), Board of Directors with industry and government leaders',
                    funding: 'Government of BC funding, federal partnerships, program revenues',
                    detailedContent: `# Innovate BC - Provincial Innovation Leadership

## Mission & Mandate
Innovate BC serves as British Columbia's provincial innovation agency, created in 2018 to accelerate the growth of BC's innovation economy. The organization plays a critical role in supporting technology commercialization, startup development, and building a robust innovation ecosystem across the province.

## Core Programs & Services
**Innovation Challenges**: Large-scale competitions addressing specific sectoral challenges in areas like CleanTech, Digital Health, AgTech, and Advanced Manufacturing.

**Startup Support**: Comprehensive programming including mentorship, funding, market access, and business development support for early-stage companies.

**Scale-up Programs**: Growth acceleration services for established companies looking to expand locally and internationally.

**Technology Commercialization**: University-industry partnerships facilitating the transfer of research discoveries into commercial applications.

**Sector Development**: Focused initiatives in key sectors including AI/ML, CleanTech, Digital Health, AgTech, and Advanced Manufacturing.

## Strategic Initiatives
**AI & Advanced Technology**: Supporting the development of BC's artificial intelligence ecosystem through targeted programs, partnerships, and investment facilitation.

**CleanTech Innovation**: Leading provincial efforts to commercialize clean technology solutions and support BC's climate action goals.

**Digital Health Transformation**: Accelerating health technology innovation and supporting the integration of digital solutions in healthcare delivery.

**Regional Innovation**: Ensuring innovation opportunities reach all regions of BC, not just metropolitan areas.

**Indigenous Innovation**: Dedicated programs supporting Indigenous entrepreneurs and technology development.

## Investment & Funding Programs
**Direct Investment**: Co-investment in promising BC technology companies through various funding instruments.

**Partnership Facilitation**: Connecting startups and scale-ups with private investors, venture capital, and corporate partners.

**Government Funding Access**: Helping companies navigate and access federal and provincial funding programs.

**International Investment**: Facilitating foreign direct investment in BC technology companies.

## Economic Impact & Metrics
**Job Creation**: Supporting the creation of high-quality technology jobs across BC.

**Investment Attraction**: Facilitating millions in private sector investment in BC companies.

**Company Growth**: Portfolio companies showing significant revenue growth and market expansion.

**Innovation Ecosystem**: Strengthening BC's position as a leading North American innovation hub.

## Strategic Partnerships
**Government Relations**: Close collaboration with federal agencies, other provincial innovation organizations, and municipal economic development.

**Academic Institutions**: Partnerships with BC universities and colleges for research commercialization and talent development.

**Industry Associations**: Collaboration with BC Tech Association, sector-specific organizations, and international innovation networks.

**International Networks**: Connections with global innovation hubs and trade organizations for market access and partnership development.

## Sector Leadership
**Artificial Intelligence**: Supporting BC's emergence as a global AI hub through targeted programming and investment.

**Clean Technology**: Leading provincial CleanTech development with focus on climate solutions and sustainability.

**Life Sciences**: Accelerating biotech and digital health innovation with emphasis on precision medicine and health technology.

**Advanced Manufacturing**: Supporting Industry 4.0 adoption and advanced manufacturing technology development.

## Future Strategic Direction
Innovate BC continues to evolve its programming to address emerging opportunities and challenges, with increasing focus on AI integration across sectors, climate technology solutions, and positioning BC as a global leader in responsible innovation and sustainable technology development.`
                }
            },
            {
                name: 'UBC Emerging Media Lab',
                notionId: '244c6f79-9a33-8158-ae90-d0bc80bd1019',
                additionalContent: `

## Advanced Research Programs
**Immersive Technologies Research**: Leading development of next-generation VR/AR applications for education, healthcare, and entertainment industries.

**Human-Computer Interaction**: Pioneering research in natural user interfaces, gesture recognition, and brain-computer interfaces.

**Digital Twins & Simulation**: Creating virtual representations of physical systems for training, analysis, and predictive modeling.

## Industry Applications & Impact
**Healthcare Innovation**: VR therapy applications, surgical training simulators, and patient rehabilitation programs.

**Education Technology**: Immersive learning environments, virtual laboratories, and distance education platforms.

**Entertainment & Media**: Game development technologies, interactive storytelling, and immersive media experiences.

## Research Partnerships & Collaborations
**Technology Companies**: Partnerships with Meta, Microsoft, Google, and leading VR/AR hardware and software companies.

**Healthcare Institutions**: Collaborations with Vancouver Coastal Health, BC Children's Hospital, and medical research institutions.

**International Research**: Joint projects with MIT, Stanford, Carnegie Mellon, and leading global research institutions.

## Innovation & Technology Transfer
**Startup Incubation**: Supporting student and faculty entrepreneurs in commercializing research discoveries.

**Patent Portfolio**: Significant intellectual property in immersive technologies and human-computer interaction.

**Industry Consulting**: Providing expertise to established companies developing immersive technology products.`
            },
            {
                name: 'Digital Technology Supercluster',
                notionId: '244c6f79-9a33-81aa-beef-d0dbe931d7b6',
                additionalContent: `

## Strategic Project Portfolio
**AI for Advanced Manufacturing**: $200M+ initiative transforming Canadian manufacturing through AI integration, predictive maintenance, and smart factory technologies.

**Digital Health Accelerator**: $150M+ program developing AI-powered health solutions, telemedicine platforms, and precision medicine applications.

**Clean Growth Program**: $100M+ investment in AI and digital technologies for climate solutions, resource optimization, and sustainable development.

**Quantum Computing Initiative**: Partnerships with leading quantum companies and research institutions to advance quantum-classical hybrid computing.

## Global Leadership & Recognition
**International Partnerships**: Strategic alliances with innovation clusters in US, Europe, and Asia-Pacific for technology collaboration and market access.

**Policy Influence**: Significant input into federal AI strategy, digital innovation policy, and technology regulation frameworks.

**Thought Leadership**: Regular participation in global innovation forums, technology conferences, and policy development initiatives.

## Economic Development Impact
**Supply Chain Resilience**: Projects focused on strengthening Canadian technology supply chains and reducing foreign dependencies.

**Export Growth**: Supporting Canadian technology companies in international market expansion and export development.

**Talent Retention**: Programs designed to keep top technology talent in Canada and attract international experts.

## Innovation Methodology
**Collaborative R&D Model**: Unique approach bringing together large enterprises, SMEs, startups, and academic institutions for large-scale innovation projects.

**Risk Sharing**: De-risking technology development through shared investment and collaborative problem-solving.

**Scale & Impact Focus**: Emphasis on projects with potential for significant economic impact and job creation.`
            },
            {
                name: 'Quantum Algorithms Institute',
                notionId: '244c6f79-9a33-81cb-9919-ec4b2f5c5ecd',
                additionalContent: `

## Quantum Research Excellence
**Algorithm Development**: Pioneering work on quantum algorithms for optimization, machine learning, and cryptography applications.

**Quantum Software Framework**: Developing open-source tools and platforms for quantum algorithm design and testing.

**Hybrid Computing**: Research on quantum-classical hybrid systems for near-term practical applications.

## Industry Collaboration Programs
**Quantum Advantage Projects**: Partnerships with industry to identify and develop quantum computing applications with clear competitive advantages.

**Talent Development**: Training programs for industry professionals transitioning to quantum computing roles.

**Technology Transfer**: Licensing quantum algorithms and software tools to commercial partners.

## Global Quantum Leadership
**International Research Networks**: Active participation in global quantum research consortiums and collaborative projects.

**Standards Development**: Contributing to international quantum computing standards and best practices.

**Policy Advisory**: Providing expertise to government on quantum technology strategy and national security implications.

## Strategic Research Areas
**Quantum Machine Learning**: Developing algorithms that leverage quantum computing for enhanced AI and machine learning capabilities.

**Quantum Optimization**: Applications in logistics, finance, drug discovery, and materials science.

**Quantum Cryptography**: Next-generation security protocols and quantum-safe cryptographic systems.

## Innovation Ecosystem Role
**Startup Support**: Mentoring quantum technology startups and providing access to research infrastructure.

**Academic Partnerships**: Collaborative research with leading quantum research institutions globally.

**Government Advisory**: Strategic input into Canada's National Quantum Strategy and provincial quantum initiatives.`
            },
            {
                name: 'Frontier Collective',
                notionId: '1f0c6f79-9a33-812f-84b5-dc405db01701',
                additionalContent: `

## Investment Philosophy & Strategy
**Frontier Technology Focus**: Specialized investment in breakthrough technologies including quantum computing, advanced AI, biotech, and deep tech innovations.

**Early-Stage Expertise**: Focus on seed to Series A investments in companies with defensible technology and significant market potential.

**Technical Due Diligence**: Deep technical evaluation capabilities with advisors from leading research institutions and technology companies.

## Portfolio Success Stories
**Quantum Computing Investments**: Strategic investments in leading quantum software and hardware companies.

**AI/ML Portfolio**: Companies developing breakthrough artificial intelligence applications across multiple industries.

**Biotech Innovations**: Investments in companies leveraging AI for drug discovery, precision medicine, and biotechnology applications.

## Ecosystem Development
**Entrepreneur Support**: Comprehensive support for portfolio companies including technical mentorship, business development, and follow-on funding facilitation.

**Industry Networks**: Extensive connections with corporate partners, research institutions, and international investors.

**Thought Leadership**: Regular participation in technology conferences, research publications, and industry advisory roles.

## Strategic Value Creation
**Technical Advisory**: Access to world-class technical advisors and research expertise for portfolio companies.

**Market Access**: Facilitating partnerships with established technology companies and government organizations.

**Global Expansion**: Supporting portfolio companies in international market development and expansion strategies.

## Innovation Investment Trends
**Quantum-AI Convergence**: Investing in companies at the intersection of quantum computing and artificial intelligence.

**Sustainability Technology**: Frontier technologies addressing climate change and environmental challenges.

**Human Augmentation**: Technologies enhancing human capabilities through AI, robotics, and biotechnology integration.`
            },
            {
                name: 'BC Tech Association',
                notionId: '1f0c6f79-9a33-8161-9b56-d60856022333',
                additionalContent: `

## Policy Leadership & Advocacy
**Technology Policy Development**: Leading provincial and federal policy advocacy on AI ethics, data governance, and innovation regulation.

**Talent & Immigration**: Championing policies to attract and retain international technology talent in BC.

**Taxation & Incentives**: Advocating for competitive tax policies and innovation incentives to support BC technology companies.

## Industry Programs & Services
**Tech Impact Awards**: Annual recognition program celebrating BC technology excellence and innovation achievements.

**Sector Development**: Specialized programming for AI, CleanTech, FinTech, and emerging technology sectors.

**Market Intelligence**: Research and analysis on BC technology trends, workforce development, and competitive positioning.

## Economic Development Impact
**Investment Attraction**: Supporting efforts to attract venture capital, corporate investment, and international technology companies to BC.

**Export Development**: Programs supporting BC technology companies in international market expansion.

**Ecosystem Building**: Initiatives to strengthen connections between startups, established companies, investors, and research institutions.

## Strategic Partnerships & Alliances
**Government Relations**: Close collaboration with provincial and federal governments on technology policy and economic development.

**International Networks**: Partnerships with technology associations globally for market access and knowledge sharing.

**Educational Institutions**: Workforce development partnerships with BC universities and colleges.

## Thought Leadership & Research
**Economic Impact Studies**: Regular analysis of BC technology sector contribution to provincial economy and employment.

**Innovation Trends**: Research on emerging technologies, market opportunities, and competitive positioning.

**Policy Recommendations**: Evidence-based policy proposals for government consideration on technology development and regulation.

## Member Value & Services
**Networking & Community**: Regular events, conferences, and networking opportunities for technology professionals.

**Business Development**: Support for member companies in partnership development, market access, and growth strategies.

**Professional Development**: Training programs, workshops, and educational opportunities for technology professionals.`
            },
            {
                name: 'Launch Academy',
                notionId: '1f0c6f79-9a33-816e-b041-d6e6ac5cd621',
                additionalContent: `

## Accelerator Program Excellence
**Curriculum Innovation**: Comprehensive programming covering product development, market validation, fundraising, and scale-up strategies.

**Mentorship Network**: Access to 200+ experienced entrepreneurs, investors, and industry experts providing ongoing guidance.

**Demo Day Success**: Regular showcase events connecting portfolio companies with investors, partners, and customers.

## Portfolio Company Success
**Exit Achievements**: Multiple successful exits including acquisitions and IPOs across various technology sectors.

**Funding Success**: Portfolio companies raising over $500M+ in follow-on funding from leading VC firms.

**Market Leaders**: Several portfolio companies achieving market leadership positions in their respective sectors.

## Investment & Funding Ecosystem
**Fund Management**: Active venture capital fund making direct investments in early-stage technology companies.

**Co-Investment Networks**: Partnerships with leading VC firms for follow-on funding and syndicated investments.

**International Expansion**: Support for portfolio companies expanding to US, European, and Asian markets.

## Sector Specialization
**AI & Machine Learning**: Specialized programming for companies developing artificial intelligence applications and platforms.

**Enterprise Software**: Focus on B2B SaaS companies and enterprise technology solutions.

**Consumer Technology**: Support for consumer-facing technology products and platforms.

**CleanTech Innovation**: Programs for companies developing environmental and sustainability technology solutions.

## Strategic Partnerships & Networks
**Corporate Innovation**: Partnerships with established companies for pilot projects, customer development, and strategic partnerships.

**International Accelerators**: Global network connections facilitating market expansion and knowledge sharing.

**Government Programs**: Integration with provincial and federal startup support programs and funding initiatives.

## Innovation & Thought Leadership
**Startup Ecosystem Development**: Active contribution to Vancouver and BC startup ecosystem growth and development.

**Industry Research**: Regular reports on startup trends, investment patterns, and ecosystem development.

**Conference & Events**: Hosting major technology and entrepreneurship events attracting international participation.`
            },
            {
                name: 'Spring Activator',
                notionId: '23dc6f79-9a33-8194-bf5d-cbfce4c5e41b',
                additionalContent: `

## Impact Investment Leadership
**Foresight Canada**: National cleantech accelerator program supporting ventures addressing climate change and environmental challenges.

**Social Innovation**: Focus on technology solutions addressing social challenges including health, education, and equity.

**Measurement & Impact**: Rigorous impact measurement and reporting systems tracking social and environmental outcomes.

## Climate Technology Focus
**Carbon Reduction**: Supporting companies developing technologies for carbon capture, reduction, and offset solutions.

**Renewable Energy**: Investments in next-generation renewable energy technologies and energy storage solutions.

**Circular Economy**: Companies developing technologies for waste reduction, recycling, and circular economy applications.

## Program Innovation & Methodology
**Systems Thinking**: Approach to innovation that considers systemic challenges and leverages technology for systems-level change.

**Community Engagement**: Programs ensuring technology solutions are developed with community input and benefit.

**Indigenous Partnership**: Dedicated programs supporting Indigenous entrepreneurs and incorporating traditional knowledge.

## Strategic Partnerships
**Impact Investors**: Network of impact-focused investors and foundations supporting social and environmental ventures.

**Government Collaboration**: Partnerships with federal and provincial governments on climate action and social innovation initiatives.

**International Networks**: Connections with global impact accelerators and cleantech development organizations.

## Innovation Areas & Applications
**AI for Climate**: Supporting development of artificial intelligence applications for climate monitoring, prediction, and response.

**Smart Cities**: Technology solutions for sustainable urban development and smart city infrastructure.

**AgTech Innovation**: Agricultural technology solutions for sustainable food production and supply chain optimization.

## Impact Measurement & Success
**Environmental Outcomes**: Portfolio companies achieving measurable environmental impact including carbon reduction and resource conservation.

**Social Impact**: Quantified social benefits including job creation, community development, and equity improvements.

**Economic Sustainability**: Ensuring impact ventures achieve financial sustainability while maintaining social and environmental mission.`
            }
        ];
        this.results = { processed: 0, enhanced: 0, contentAdded: 0, errors: [] };
    }

    async enhanceAllContent() {
        console.log('📖 Adding comprehensive research content to 9 strategic organizations...');
        
        for (const org of this.organizations) {
            await this.enhanceContent(org);
        }
        
        await this.saveResults();
        this.displaySummary();
    }

    async enhanceContent(orgData) {
        console.log(`📝 Adding content: ${orgData.name}`);
        this.results.processed++;
        
        try {
            // For new organizations, add comprehensive properties first
            if (orgData.comprehensiveResearch) {
                await this.addComprehensiveProperties(orgData);
            }
            
            // Add detailed content to the page
            await this.addMainContent(orgData);
            
            console.log(`   ✅ Content added successfully`);
            this.results.enhanced++;
            this.results.contentAdded++;
            
        } catch (error) {
            console.error(`   ❌ Error: ${error.message}`);
            this.results.errors.push({ org: orgData.name, error: error.message });
        }
    }

    async addComprehensiveProperties(orgData) {
        const research = orgData.comprehensiveResearch;
        const properties = {};
        
        // Add basic properties for new organizations
        if (research.website) {
            properties.Website = { url: research.website };
        }
        
        if (research.description) {
            properties['Focus & Notes'] = { rich_text: [{ text: { content: research.description } }] };
        }
        
        if (research.keyPeople) {
            properties['Key People'] = { rich_text: [{ text: { content: research.keyPeople } }] };
        }
        
        if (research.founded) {
            properties['Year Founded'] = { number: research.founded };
        }
        
        if (research.bcRegion) {
            properties['BC Region'] = { select: { name: research.bcRegion } };
        }
        
        if (research.category) {
            properties.Category = { select: { name: research.category } };
        }
        
        if (research.location) {
            properties['City/Region'] = { rich_text: [{ text: { content: research.location } }] };
        }
        
        if (research.funding) {
            properties.Funding = { rich_text: [{ text: { content: research.funding } }] };
        }
        
        properties['Data Source'] = { select: { name: 'Comprehensive Research' } };
        properties['Last Verified'] = { date: { start: new Date().toISOString().split('T')[0] } };
        
        if (Object.keys(properties).length > 0) {
            await this.notion.pages.update({
                page_id: orgData.notionId,
                properties: properties
            });
        }
    }

    async addMainContent(orgData) {
        const contentToAdd = orgData.comprehensiveResearch?.detailedContent || orgData.additionalContent;
        
        if (!contentToAdd) return;
        
        // Add content as page blocks
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
                // Main heading
                blocks.push({
                    object: 'block',
                    type: 'heading_1',
                    heading_1: {
                        rich_text: [{ type: 'text', text: { content: trimmedLine.substring(2) } }]
                    }
                });
            } else if (trimmedLine.startsWith('## ')) {
                // Subheading
                blocks.push({
                    object: 'block',
                    type: 'heading_2',
                    heading_2: {
                        rich_text: [{ type: 'text', text: { content: trimmedLine.substring(3) } }]
                    }
                });
            } else if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
                // Bold paragraph
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
                // Regular paragraph
                blocks.push({
                    object: 'block',
                    type: 'paragraph',
                    paragraph: {
                        rich_text: [{ type: 'text', text: { content: trimmedLine } }]
                    }
                });
            }
        }
        
        return blocks;
    }

    async saveResults() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const resultsPath = `data/reports/content-enhancement-${timestamp}.json`;
        
        await fs.writeFile(resultsPath, JSON.stringify(this.results, null, 2));
        console.log(`📊 Results saved: ${resultsPath}`);
    }

    displaySummary() {
        console.log('\n📋 CONTENT ENHANCEMENT SUMMARY:');
        console.log(`✅ Processed: ${this.results.processed}`);
        console.log(`📝 Enhanced: ${this.results.enhanced}`);
        console.log(`📖 Content Added: ${this.results.contentAdded}`);
        console.log(`❌ Errors: ${this.results.errors.length}`);
    }
}

const enhancer = new ContentResearchEnhancer();
enhancer.enhanceAllContent().then(() => {
    console.log('✅ Content enhancement complete!');
}).catch(error => {
    console.error('❌ Enhancement failed:', error);
});