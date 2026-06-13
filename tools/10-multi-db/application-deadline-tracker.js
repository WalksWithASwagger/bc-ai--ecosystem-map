#!/usr/bin/env node

/**
 * Application Deadline Tracker
 * Monitors and updates application deadlines for government programs and grants
 */

const { Client } = require('@notionhq/client');
require('dotenv').config();

class ApplicationDeadlineTracker {
    constructor() {
        this.notion = new Client({
            auth: process.env.NOTION_TOKEN
        });
        this.databaseId = '246c6f799a3381eea3f1e329b7120b44';
        
        // Known program deadlines (2025)
        this.knownDeadlines = {
            // Government Programs
            'IRAP': {
                type: 'rolling',
                description: 'Rolling applications year-round',
                nextDeadline: null,
                notes: 'Submit anytime, 4-6 week review cycle'
            },
            'MITACS': {
                type: 'quarterly',
                deadlines: ['2025-03-15', '2025-06-15', '2025-09-15', '2025-12-15'],
                description: 'Quarterly submission windows',
                notes: 'Partner with university required'
            },
            'SR&ED': {
                type: 'annual',
                description: '18 months after fiscal year end',
                notes: 'File with corporate tax return'
            },
            'PacifiCan': {
                type: 'rolling',
                description: 'Continuous intake',
                notes: 'Regional development priorities'
            },
            'Western Economic Diversification': {
                type: 'project-based',
                description: 'Project-specific calls',
                notes: 'Check website for open calls'
            },
            'BC Tech Fund': {
                type: 'rolling',
                description: 'Rolling for qualified companies',
                notes: 'Must meet investment criteria'
            },
            'Launch Online Grant': {
                type: 'intake-periods',
                deadlines: ['2025-02-28', '2025-05-31', '2025-08-31', '2025-11-30'],
                description: 'Quarterly intake periods',
                notes: 'First-come, first-served within intake'
            },
            
            // Federal Programs
            'CanExport': {
                type: 'continuous',
                description: 'Continuous intake until funds exhausted',
                notes: 'Apply early in fiscal year (April)'
            },
            'NRC-IRAP': {
                type: 'rolling',
                description: 'Year-round applications',
                notes: 'Advisor consultation required first'
            },
            
            // Innovation Programs
            'Innovative Solutions Canada': {
                type: 'challenges',
                description: 'Challenge-specific deadlines',
                notes: 'Check for open challenges monthly'
            },
            'NSERC': {
                type: 'program-specific',
                deadlines: {
                    'Alliance': 'Rolling',
                    'Engage': 'Quarterly',
                    'CRD': '2025-05-01'
                },
                description: 'Varies by program',
                notes: 'Academic partnership required'
            },
            'SSHRC': {
                type: 'annual',
                deadlines: ['2025-02-01', '2025-10-15'],
                description: 'Annual competition rounds',
                notes: 'Social sciences and humanities focus'
            },
            
            // Accelerators/Incubators
            'CDL West': {
                type: 'cohort',
                deadlines: ['2025-03-01', '2025-09-01'],
                description: 'Bi-annual cohort intake',
                notes: 'Deep tech focus, 9-month program'
            },
            'Foresight': {
                type: 'program-based',
                description: 'Multiple programs with different dates',
                notes: 'Cleantech focus'
            },
            'Spring Activator': {
                type: 'cohort',
                deadlines: ['2025-04-30', '2025-10-31'],
                description: 'Spring and Fall cohorts',
                notes: 'Social impact focus'
            }
        };
    }

    async run() {
        console.log('📅 Application Deadline Tracker\n');
        console.log('=' .repeat(50) + '\n');
        
        // Update known deadlines
        await this.updateKnownDeadlines();
        
        // Find upcoming deadlines
        await this.findUpcomingDeadlines();
        
        // Generate deadline report
        await this.generateDeadlineReport();
    }

    async updateKnownDeadlines() {
        console.log('🔄 Updating known program deadlines...\n');
        
        for (const [programName, deadlineInfo] of Object.entries(this.knownDeadlines)) {
            // Search for this program in database
            const response = await this.notion.databases.query({
                database_id: this.databaseId,
                filter: {
                    property: 'Name',
                    title: { contains: programName.split('-')[0] } // Handle NRC-IRAP etc
                },
                page_size: 5
            });
            
            if (response.results.length > 0) {
                for (const funder of response.results) {
                    const name = funder.properties.Name?.title?.[0]?.plain_text || '';
                    console.log(`📌 ${name}`);
                    
                    // Build deadline information
                    let deadlineText = this.formatDeadlineInfo(deadlineInfo);
                    
                    // Update the funder
                    await this.updateFunderDeadline(funder.id, deadlineText);
                }
            }
        }
        
        console.log('');
    }

    formatDeadlineInfo(info) {
        let text = `📅 Application Timeline:\n`;
        
        if (info.type === 'rolling') {
            text += `• Type: Rolling applications\n`;
            text += `• ${info.description}\n`;
        } else if (info.type === 'quarterly' && info.deadlines) {
            text += `• Type: Quarterly deadlines\n`;
            const upcoming = this.getUpcomingDates(info.deadlines);
            if (upcoming.length > 0) {
                text += `• Next deadline: ${upcoming[0]}\n`;
                text += `• Following: ${upcoming.slice(1).join(', ')}\n`;
            }
        } else if (info.type === 'annual' && info.deadlines) {
            text += `• Type: Annual competition\n`;
            const upcoming = this.getUpcomingDates(info.deadlines);
            if (upcoming.length > 0) {
                text += `• Next deadline: ${upcoming[0]}\n`;
            }
        } else if (info.type === 'cohort' && info.deadlines) {
            text += `• Type: Cohort-based program\n`;
            const upcoming = this.getUpcomingDates(info.deadlines);
            if (upcoming.length > 0) {
                text += `• Next cohort deadline: ${upcoming[0]}\n`;
            }
        } else if (info.type === 'intake-periods' && info.deadlines) {
            text += `• Type: Intake periods\n`;
            const upcoming = this.getUpcomingDates(info.deadlines);
            if (upcoming.length > 0) {
                text += `• Current/Next intake closes: ${upcoming[0]}\n`;
            }
        } else {
            text += `• Type: ${info.type}\n`;
            text += `• ${info.description}\n`;
        }
        
        if (info.notes) {
            text += `• Note: ${info.notes}\n`;
        }
        
        return text;
    }

    getUpcomingDates(dates) {
        const today = new Date();
        const upcoming = [];
        
        if (Array.isArray(dates)) {
            dates.forEach(date => {
                const deadlineDate = new Date(date);
                if (deadlineDate > today) {
                    upcoming.push(date);
                }
            });
        }
        
        return upcoming.sort();
    }

    async updateFunderDeadline(funderId, deadlineText) {
        try {
            // Get existing description
            const page = await this.notion.pages.retrieve({ page_id: funderId });
            const existingDesc = page.properties.Description?.rich_text?.[0]?.text?.content || '';
            
            // Check if deadline info already exists
            if (existingDesc.includes('Application Timeline')) {
                // Replace existing deadline info
                const updatedDesc = existingDesc.replace(
                    /📅 Application Timeline:[\s\S]*?(?=\n\n|$)/,
                    deadlineText.trim()
                );
                
                await this.notion.pages.update({
                    page_id: funderId,
                    properties: {
                        'Description': {
                            rich_text: [{
                                text: { content: updatedDesc }
                            }]
                        }
                    }
                });
                console.log(`   ✅ Updated deadline information`);
            } else {
                // Add deadline info
                await this.notion.pages.update({
                    page_id: funderId,
                    properties: {
                        'Description': {
                            rich_text: [{
                                text: { 
                                    content: existingDesc + '\n\n' + deadlineText
                                }
                            }]
                        }
                    }
                });
                console.log(`   ✅ Added deadline information`);
            }
        } catch (error) {
            console.log(`   ❌ Failed to update: ${error.message}`);
        }
    }

    async findUpcomingDeadlines() {
        console.log('🎯 Upcoming Deadlines (Next 90 Days):\n');
        
        const today = new Date();
        const ninetyDays = new Date(today.getTime() + (90 * 24 * 60 * 60 * 1000));
        const upcomingDeadlines = [];
        
        for (const [program, info] of Object.entries(this.knownDeadlines)) {
            if (info.deadlines) {
                const dates = Array.isArray(info.deadlines) ? info.deadlines : Object.values(info.deadlines);
                
                dates.forEach(date => {
                    if (date && date !== 'Rolling' && date !== 'Continuous') {
                        const deadlineDate = new Date(date);
                        if (deadlineDate > today && deadlineDate < ninetyDays) {
                            upcomingDeadlines.push({
                                program,
                                date,
                                daysUntil: Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24)),
                                type: info.type,
                                notes: info.notes
                            });
                        }
                    }
                });
            }
        }
        
        // Sort by date
        upcomingDeadlines.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Display upcoming deadlines
        if (upcomingDeadlines.length > 0) {
            upcomingDeadlines.forEach(deadline => {
                const urgency = deadline.daysUntil < 30 ? '🚨' : 
                               deadline.daysUntil < 60 ? '⚠️' : '📌';
                
                console.log(`${urgency} ${deadline.program}`);
                console.log(`   Date: ${deadline.date} (${deadline.daysUntil} days)`);
                if (deadline.notes) {
                    console.log(`   Note: ${deadline.notes}`);
                }
                console.log('');
            });
        } else {
            console.log('No fixed deadlines in the next 90 days.\n');
            console.log('Rolling/Continuous Programs Available:');
            
            Object.entries(this.knownDeadlines).forEach(([program, info]) => {
                if (info.type === 'rolling' || info.type === 'continuous') {
                    console.log(`• ${program}: ${info.description}`);
                }
            });
        }
        
        return upcomingDeadlines;
    }

    async generateDeadlineReport() {
        const fs = require('fs').promises;
        const path = require('path');
        
        console.log('\n📄 Generating Deadline Report...');
        
        let report = '# 📅 Funding Application Deadlines Report\n';
        report += `*Generated: ${new Date().toISOString().split('T')[0]}*\n\n`;
        
        report += '## 🚨 Urgent Deadlines (Next 30 Days)\n\n';
        report += '## ⚠️ Upcoming Deadlines (30-60 Days)\n\n';
        report += '## 📌 Future Deadlines (60-90 Days)\n\n';
        
        report += '## 🔄 Rolling/Continuous Programs\n';
        report += 'These programs accept applications year-round:\n\n';
        
        Object.entries(this.knownDeadlines).forEach(([program, info]) => {
            if (info.type === 'rolling' || info.type === 'continuous') {
                report += `### ${program}\n`;
                report += `- ${info.description}\n`;
                if (info.notes) {
                    report += `- ${info.notes}\n`;
                }
                report += '\n';
            }
        });
        
        const reportPath = path.join(
            __dirname,
            '../../data/reports',
            `deadline-report-${new Date().toISOString().split('T')[0]}.md`
        );
        
        await fs.writeFile(reportPath, report);
        console.log(`✅ Report saved to: ${reportPath}\n`);
    }
}

// Run if called directly
if (require.main === module) {
    const tracker = new ApplicationDeadlineTracker();
    tracker.run().catch(console.error);
}

module.exports = ApplicationDeadlineTracker;