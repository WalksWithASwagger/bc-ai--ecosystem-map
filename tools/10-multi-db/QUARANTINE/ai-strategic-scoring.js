#!/usr/bin/env node

/**
 * AI Strategic Scoring - Score and prioritize funders
 * Adds research scores, strategic priority, and actionable insights
 */

const { Client } = require('@notionhq/client');
require('dotenv').config();
const OpenAI = require('openai');

class AIStrategicScoring {
    constructor() {
        this.notion = new Client({
            auth: process.env.NOTION_TOKEN
        });
        this.databaseId = '246c6f799a3381eea3f1e329b7120b44';
        this.scoredCount = 0;
        
        // Initialize OpenAI if available
        this.openai = null;
        if (process.env.OPENAI_API_KEY) {
            this.openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY
            });
        }
    }

    async run() {
        console.log('🧠 AI Strategic Scoring Starting...\n');
        
        // Get all funders
        const funders = await this.getAllFunders();
        console.log(`📊 Found ${funders.length} funders to score\n`);
        
        // Score in batches
        const batchSize = 10;
        for (let i = 0; i < funders.length; i += batchSize) {
            const batch = funders.slice(i, Math.min(i + batchSize, funders.length));
            await Promise.all(batch.map(f => this.scoreFunder(f)));
            
            console.log(`\n✅ Progress: ${Math.min(i + batchSize, funders.length)}/${funders.length}\n`);
        }
        
        console.log('\n🎉 Scoring Complete!');
        console.log(`   Scored: ${this.scoredCount} funders`);
        
        // Show top priority funders
        await this.showTopFunders();
    }

    async getAllFunders() {
        const allFunders = [];
        let hasMore = true;
        let cursor = undefined;
        
        while (hasMore) {
            const response = await this.notion.databases.query({
                database_id: this.databaseId,
                start_cursor: cursor,
                page_size: 100
            });
            
            allFunders.push(...response.results);
            hasMore = response.has_more;
            cursor = response.next_cursor;
        }
        
        return allFunders;
    }

    async scoreFunder(funder) {
        const name = funder.properties.Name?.title?.[0]?.plain_text || '';
        if (!name) return;
        
        const type = funder.properties.Type?.select?.name || 'Fund';
        const website = funder.properties.Website?.url;
        const location = funder.properties.Location?.rich_text?.[0]?.plain_text || '';
        const focusAreas = funder.properties['Focus Areas']?.multi_select?.map(s => s.name) || [];
        
        console.log(`   🎯 Scoring: ${name}`);
        
        // Calculate strategic score
        const scoring = this.calculateScore(name, type, website, location, focusAreas);
        
        // Generate insights
        const insights = this.generateInsights(name, type, scoring);
        
        // Update the funder
        try {
            const updates = {
                'Research Score': { number: scoring.score },
                'Strategic Priority': { 
                    select: { name: scoring.priority }
                }
            };
            
            // Add insights if we have rich text field
            if (insights.keyInsights) {
                updates['Key Insights'] = {
                    rich_text: [{ text: { content: insights.keyInsights } }]
                };
            }
            
            // Add action items if we have the field
            if (insights.actionItems) {
                updates['Action Items'] = {
                    rich_text: [{ text: { content: insights.actionItems } }]
                };
            }
            
            await this.notion.pages.update({
                page_id: funder.id,
                properties: updates
            });
            
            this.scoredCount++;
            console.log(`      ✓ Score: ${scoring.score} | Priority: ${scoring.priority}`);
            
        } catch (error) {
            // Try simpler update if fields don't exist
            try {
                await this.notion.pages.update({
                    page_id: funder.id,
                    properties: {
                        'Description': {
                            rich_text: [{
                                text: {
                                    content: `Strategic Score: ${scoring.score}/100 | Priority: ${scoring.priority}\n\n${insights.summary}`
                                }
                            }]
                        }
                    }
                });
                this.scoredCount++;
            } catch (err) {
                console.log(`      ❌ Failed to update: ${err.message}`);
            }
        }
    }

    calculateScore(name, type, website, location, focusAreas) {
        let score = 50; // Base score
        let priority = 'Medium';
        
        // Type-based scoring
        const typeScores = {
            'Government': 30,  // Non-dilutive funding
            'VC': 25,          // Venture capital
            'Corporate': 20,   // Strategic partnerships
            'Grant': 25,       // Non-dilutive
            'Accelerator': 15,
            'Angel': 10,
            'Foundation': 15,
            'PE': 20
        };
        
        score += typeScores[type] || 5;
        
        // Location bonus for BC
        if (location) {
            const locLower = location.toLowerCase();
            if (locLower.includes('bc') || locLower.includes('british columbia') || 
                locLower.includes('vancouver') || locLower.includes('victoria')) {
                score += 20; // Strong BC preference
            } else if (locLower.includes('canada')) {
                score += 10; // Canadian preference
            }
        }
        
        // Name-based BC bonus
        const nameLower = name.toLowerCase();
        if (nameLower.includes('bc') || nameLower.includes('british columbia') ||
            nameLower.includes('vancouver') || nameLower.includes('victoria')) {
            score += 15;
        }
        
        // Key strategic funders
        const strategicFunders = [
            'irap', 'mitacs', 'nrc', 'nserc', 'sshrc',  // Government
            'bdc', 'edc', 'innovate bc', 'new ventures bc',  // BC/Canada
            'lightspeed', 'greylock', 'bessemer', 'sequoia',  // Top VCs
            'microsoft', 'google', 'amazon', 'meta'  // Corporate
        ];
        
        if (strategicFunders.some(sf => nameLower.includes(sf))) {
            score += 15;
        }
        
        // Website presence
        if (website) {
            score += 5;
        }
        
        // Focus area alignment (AI/Tech focus)
        const techFocus = ['AI/ML', 'Technology', 'DeepTech', 'Innovation', 'R&D'];
        const matchingFocus = focusAreas.filter(fa => techFocus.includes(fa));
        score += matchingFocus.length * 5;
        
        // Cap at 100
        score = Math.min(100, score);
        
        // Determine priority
        if (score >= 85) {
            priority = 'High';
        } else if (score >= 70) {
            priority = 'Medium-High';
        } else if (score >= 50) {
            priority = 'Medium';
        } else {
            priority = 'Low';
        }
        
        return { score, priority };
    }

    generateInsights(name, type, scoring) {
        const insights = {
            summary: '',
            keyInsights: '',
            actionItems: ''
        };
        
        // Type-specific insights
        const typeInsights = {
            'Government': {
                insights: 'Non-dilutive funding source. Structured application process with clear criteria.',
                actions: '1. Review eligibility requirements\n2. Prepare detailed documentation\n3. Check application deadlines'
            },
            'VC': {
                insights: 'Equity investment opportunity. Focus on warm introductions and strong pitch deck.',
                actions: '1. Research portfolio companies\n2. Find warm introduction path\n3. Prepare compelling pitch deck'
            },
            'Corporate': {
                insights: 'Strategic partnership potential. Align with corporate innovation goals.',
                actions: '1. Identify strategic alignment\n2. Prepare partnership proposal\n3. Connect through innovation team'
            },
            'Grant': {
                insights: 'Non-dilutive grant funding. Often specific focus areas and requirements.',
                actions: '1. Verify focus area alignment\n2. Prepare grant application\n3. Gather required documentation'
            }
        };
        
        const typeInfo = typeInsights[type] || {
            insights: 'Funding opportunity requiring further research.',
            actions: '1. Research funding criteria\n2. Identify application process\n3. Prepare initial outreach'
        };
        
        // Build summary
        insights.summary = `${type} funding source with strategic score of ${scoring.score}/100. Priority: ${scoring.priority}.`;
        
        // Key insights
        insights.keyInsights = typeInfo.insights;
        
        // Add priority-specific guidance
        if (scoring.priority === 'High') {
            insights.keyInsights += '\n⭐ HIGH PRIORITY: Immediate action recommended.';
        } else if (scoring.priority === 'Medium-High') {
            insights.keyInsights += '\n📌 MEDIUM-HIGH PRIORITY: Strong opportunity worth pursuing.';
        }
        
        // Action items
        insights.actionItems = typeInfo.actions;
        
        // Add urgency for high priority
        if (scoring.score >= 85) {
            insights.actionItems = '🚨 IMMEDIATE ACTIONS:\n' + insights.actionItems;
        }
        
        return insights;
    }

    async showTopFunders() {
        console.log('\n📊 Top Priority Funders:\n');
        
        const response = await this.notion.databases.query({
            database_id: this.databaseId,
            sorts: [
                { property: 'Research Score', direction: 'descending' }
            ],
            page_size: 10
        });
        
        console.log('Top 10 Highest Scored Funders:');
        console.log('================================');
        
        response.results.forEach((funder, index) => {
            const name = funder.properties.Name?.title?.[0]?.plain_text || 'Unknown';
            const score = funder.properties['Research Score']?.number || 
                         funder.properties['Description']?.rich_text?.[0]?.plain_text?.match(/Score: (\d+)/)?.[1] || 
                         'N/A';
            const priority = funder.properties['Strategic Priority']?.select?.name ||
                           funder.properties['Description']?.rich_text?.[0]?.plain_text?.match(/Priority: (\w+)/)?.[1] ||
                           'N/A';
            const type = funder.properties.Type?.select?.name || 'Fund';
            
            console.log(`${index + 1}. ${name}`);
            console.log(`   Type: ${type} | Score: ${score} | Priority: ${priority}`);
        });
    }
}

// Run the scoring
if (require.main === module) {
    const scorer = new AIStrategicScoring();
    scorer.run().catch(console.error);
}

module.exports = AIStrategicScoring;