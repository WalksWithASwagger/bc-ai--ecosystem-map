/**
 * Verify Logos & Create Board Views - Complete setup for visual database
 * 1. Verify logos are actually in Notion database
 * 2. Create visual board views 
 * 3. Update UI to use real database logos
 */

const { Client } = require('@notionhq/client');
const fs = require('fs').promises;
const path = require('path');

// Notion credentials from environment variables
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

if (!NOTION_TOKEN || !NOTION_DATABASE_ID) {
    console.error('❌ Missing required environment variables: NOTION_TOKEN and NOTION_DATABASE_ID');
    process.exit(1);
}

class NotionVisualSetup {
    constructor() {
        this.notion = new Client({
            auth: NOTION_TOKEN
        });
        this.databaseId = NOTION_DATABASE_ID;
        this.results = {
            logosVerified: 0,
            boardViewsReady: 0,
            companiesWithLogos: [],
            errors: []
        };
    }

    // Step 1: Verify logos are actually in the database
    async verifyLogosInDatabase() {
        console.log('🔍 STEP 1: Verifying logos are actually in Notion database...\n');
        
        try {
            // Query companies with logos
            const response = await this.notion.databases.query({
                database_id: this.databaseId,
                filter: {
                    property: 'Logo',
                    files: {
                        is_not_empty: true
                    }
                },
                page_size: 50
            });
            
            console.log(`📊 Found ${response.results.length} companies with logos in database\n`);
            
            // Display each company with logo
            for (const page of response.results) {
                const companyName = page.properties.Name?.title?.[0]?.text?.content || 'Unknown';
                const logoFiles = page.properties.Logo?.files || [];
                const category = page.properties.Category?.select?.name || 'Uncategorized';
                const funding = page.properties.Funding?.rich_text?.[0]?.text?.content || 'Not specified';
                
                if (logoFiles.length > 0) {
                    const logoUrl = logoFiles[0].external?.url || logoFiles[0].file?.url || 'No URL';
                    console.log(`✅ ${companyName}`);
                    console.log(`   Category: ${category}`);
                    console.log(`   Funding: ${funding}`);
                    console.log(`   Logo: ${logoUrl.substring(0, 60)}...`);
                    console.log('');
                    
                    this.results.companiesWithLogos.push({
                        id: page.id,
                        name: companyName,
                        category: category,
                        funding: funding,
                        logoUrl: logoUrl
                    });
                }
            }
            
            this.results.logosVerified = response.results.length;
            console.log(`🎯 VERIFICATION COMPLETE: ${this.results.logosVerified} companies have logos in Notion\n`);
            
            return this.results.logosVerified > 0;
            
        } catch (error) {
            console.error('❌ Error verifying logos:', error.message);
            this.results.errors.push(`Logo verification: ${error.message}`);
            return false;
        }
    }

    // Step 2: Create visual board view configurations
    async createBoardViewConfigurations() {
        console.log('🎨 STEP 2: Creating board view configurations...\n');
        
        const boardViews = [
            {
                name: "🏆 Champions Gallery",
                purpose: "High-value companies with logos for presentations",
                groupBy: "Category",
                filter: "Logo 'Is not empty' AND (Funding contains '$100M' OR Size equals 'Large')",
                sort: "Funding (descending)",
                description: "Showcase tier 1 champions like Clio, D-Wave Systems, Sanctuary AI"
            },
            {
                name: "🗺️ BC Regional Ecosystem", 
                purpose: "Geographic view with brand identity",
                groupBy: "Location or BC Region",
                filter: "Logo 'Is not empty'",
                sort: "Year Founded (descending)",
                description: "Regional clusters showing Vancouver, Burnaby with company logos"
            },
            {
                name: "🚀 Innovation Timeline",
                purpose: "Growth story of BC AI innovations",
                groupBy: "Year Founded",
                filter: "Logo 'Is not empty' AND Year Founded >= 2015",
                sort: "Year Founded (descending)",
                description: "Timeline showing company evolution with visual branding"
            },
            {
                name: "💰 Funding Powerhouse",
                purpose: "Investment landscape with branding",
                groupBy: "Funding Stage or Size",
                filter: "Logo 'Is not empty' AND Funding 'Is not empty'",
                sort: "Funding (descending)",
                description: "Investment tiers showing funding levels with logos"
            },
            {
                name: "🎯 AI Focus Discovery",
                purpose: "Technical specialization showcase",
                groupBy: "Category or AI Focus Areas",
                filter: "Logo 'Is not empty'",
                sort: "Name (ascending)",
                description: "Technical categories with branded companies"
            },
            {
                name: "🏢 Size & Scale",
                purpose: "Company maturity visualization",
                groupBy: "Size",
                filter: "Logo 'Is not empty'",
                sort: "Employee Count or Funding (descending)",
                description: "Company size tiers with visual branding"
            }
        ];
        
        console.log('📋 BOARD VIEW CONFIGURATIONS READY:\n');
        
        boardViews.forEach((view, index) => {
            console.log(`${index + 1}. ${view.name}`);
            console.log(`   Purpose: ${view.purpose}`);
            console.log(`   Group by: ${view.groupBy}`);
            console.log(`   Filter: ${view.filter}`);
            console.log(`   Sort: ${view.sort}`);
            console.log(`   Result: ${view.description}`);
            console.log('');
        });
        
        this.results.boardViewsReady = boardViews.length;
        
        // Save configuration for user reference
        const configPath = path.join(__dirname, '..', 'data', 'reports', 'board-view-configurations.json');
        await fs.writeFile(configPath, JSON.stringify(boardViews, null, 2));
        
        console.log(`✅ ${boardViews.length} board view configurations ready for manual setup in Notion\n`);
        
        return boardViews;
    }

    // Step 3: Generate real UI components with database integration
    async updateUIForRealDatabase() {
        console.log('🖥️ STEP 3: Creating UI components for real database integration...\n');
        
        if (this.results.companiesWithLogos.length === 0) {
            console.log('⚠️ No companies with logos found - skipping UI update');
            return;
        }
        
        // Create real API endpoint that fetches from actual database
        const apiEndpoint = `
import { NextRequest, NextResponse } from 'next/server'
import { Client } from '@notionhq/client'

const notion = new Client({
  auth: process.env.NOTION_TOKEN || '${NOTION_TOKEN}'
})

const DATABASE_ID = process.env.NOTION_DATABASE_ID || '${NOTION_DATABASE_ID}'

export async function GET(request: NextRequest) {
  try {
    // Fetch companies with logos from real Notion database
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      filter: {
        property: 'Logo',
        files: {
          is_not_empty: true
        }
      },
      page_size: 50
    })
    
    const companies = response.results.map(page => ({
      id: page.id,
      name: page.properties.Name?.title?.[0]?.text?.content || '',
      category: page.properties.Category?.select?.name || '',
      funding: page.properties.Funding?.rich_text?.[0]?.text?.content || '',
      size: page.properties.Size?.select?.name || '',
      website: page.properties.Website?.url || '',
      region: page.properties['BC Region']?.select?.name || '',
      yearFounded: page.properties['Year Founded']?.number || null,
      logo: page.properties.Logo?.files?.[0]?.external?.url || 
            page.properties.Logo?.files?.[0]?.file?.url || null
    }))
    
    return NextResponse.json(companies)
    
  } catch (error) {
    console.error('Error fetching companies:', error)
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 })
  }
}`;
        
        // Write the real API endpoint
        const apiPath = path.join(__dirname, '..', 'ui', 'app', 'api', 'notion', 'companies', 'route.ts');
        await fs.mkdir(path.dirname(apiPath), { recursive: true });
        await fs.writeFile(apiPath, apiEndpoint);
        
        console.log('✅ Created real API endpoint: /api/notion/companies');
        
        // Create enhanced dashboard component with real data
        const enhancedDashboard = `'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import LogoDisplay from '../LogoDisplay'

interface RealCompany {
  id: string
  name: string
  logo?: string | null
  category: string
  funding?: string
  size?: string
  website?: string
  region?: string
  yearFounded?: number
}

export default function RealNotionDashboard() {
  const [companies, setCompanies] = useState<RealCompany[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRealCompanies() {
      try {
        const response = await fetch('/api/notion/companies')
        if (!response.ok) throw new Error('Failed to fetch companies')
        
        const data = await response.json()
        setCompanies(data)
        console.log(\`✅ Loaded \${data.length} real companies with logos from Notion\`)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        console.error('❌ Error loading companies:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchRealCompanies()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading real companies from Notion...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
        <p className="text-red-400">Error loading companies: {error}</p>
      </div>
    )
  }

  const featuredCompanies = companies.slice(0, 8)

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            🏆 Real Companies from Notion Database
            <span className="text-sm font-normal text-slate-400">
              ({companies.length} with logos)
            </span>
          </h3>
          <motion.span 
            className="text-xs px-3 py-1 bg-gradient-to-r from-green-500/20 to-cyan-500/20 text-green-300 rounded-full border border-green-500/30"
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            Live from Database
          </motion.span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {featuredCompanies.map((company, index) => (
            <motion.div
              key={company.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              className="group cursor-pointer"
            >
              <div className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-slate-700/30 transition-colors duration-200">
                <LogoDisplay 
                  company={company}
                  size="lg"
                  className="group-hover:shadow-lg transition-shadow duration-200"
                />
                <div className="text-center">
                  <div className="text-sm font-medium text-white group-hover:text-cyan-300 transition-colors">
                    {company.name}
                  </div>
                  <div className="text-xs text-slate-400">
                    {company.category}
                  </div>
                  {company.funding && (
                    <div className="text-xs text-green-400 mt-1">
                      {company.funding.substring(0, 20)}
                      {company.funding.length > 20 ? '...' : ''}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        {companies.length > 8 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-slate-400">
              And {companies.length - 8} more companies with logos in your database
            </p>
          </div>
        )}
      </div>
      
      {/* Real Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-cyan-400">{companies.length}</div>
          <div className="text-sm text-slate-300">Companies with Logos</div>
        </div>
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-400">
            {Math.round((companies.length / 692) * 100)}%
          </div>
          <div className="text-sm text-slate-300">Visual Coverage</div>
        </div>
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">
            {new Set(companies.map(c => c.category)).size}
          </div>
          <div className="text-sm text-slate-300">Categories</div>
        </div>
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-400">
            {companies.filter(c => c.funding?.includes('$')).length}
          </div>
          <div className="text-sm text-slate-300">Funded Companies</div>
        </div>
      </div>
    </div>
  )
}`;
        
        // Write the enhanced dashboard component
        const dashboardPath = path.join(__dirname, '..', 'ui', 'components', 'dashboard', 'RealNotionDashboard.tsx');
        await fs.writeFile(dashboardPath, enhancedDashboard);
        
        console.log('✅ Created enhanced dashboard component with real Notion integration');
        console.log(`📊 Component will display ${this.results.companiesWithLogos.length} real companies with logos\n`);
        
        return true;
    }

    // Generate comprehensive report
    async generateFinalReport() {
        console.log('📋 GENERATING FINAL VERIFICATION & SETUP REPORT...\n');
        
        const report = {
            timestamp: new Date().toISOString(),
            verification: {
                logosInDatabase: this.results.logosVerified,
                companiesWithLogos: this.results.companiesWithLogos.length,
                success: this.results.logosVerified > 0
            },
            boardViews: {
                configurationsReady: this.results.boardViewsReady,
                manualSetupRequired: true
            },
            uiComponents: {
                realApiEndpoint: '/api/notion/companies',
                enhancedDashboard: 'RealNotionDashboard.tsx',
                databaseIntegration: true
            },
            companies: this.results.companiesWithLogos,
            errors: this.results.errors
        };
        
        // Save comprehensive report
        const reportPath = path.join(__dirname, '..', 'data', 'reports', 'notion-visual-setup-complete.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        
        console.log('='.repeat(80));
        console.log('🎯 NOTION VISUAL SETUP VERIFICATION COMPLETE');
        console.log('='.repeat(80));
        
        console.log(`📊 VERIFICATION RESULTS:`);
        console.log(`   ✅ Logos verified in database: ${this.results.logosVerified}`);
        console.log(`   ✅ Companies with logos: ${this.results.companiesWithLogos.length}`);
        console.log(`   ✅ Board view configs ready: ${this.results.boardViewsReady}`);
        console.log(`   ✅ UI components created: Real database integration`);
        
        if (this.results.companiesWithLogos.length > 0) {
            console.log(`\n🏆 TOP COMPANIES WITH LOGOS IN DATABASE:`);
            this.results.companiesWithLogos.slice(0, 10).forEach((company, index) => {
                console.log(`   ${index + 1}. ${company.name} (${company.category})`);
            });
        }
        
        console.log(`\n🎨 NEXT ACTIONS:`);
        console.log(`   1. ✅ Logos verified in Notion database`);
        console.log(`   2. 📋 Manual board view setup (6 configurations ready)`);
        console.log(`   3. ✅ UI updated for real database integration`);
        console.log(`   4. 🚀 Visual ecosystem ready for showcase`);
        
        console.log(`\n🏆 SUCCESS: Your BC AI Ecosystem database is visually transformed!`);
        
        return report;
    }

    // Main execution
    async execute() {
        console.log('🚀 NOTION VISUAL SETUP & VERIFICATION');
        console.log('Ensuring logos, board views, and UI are properly configured\n');
        
        // Step 1: Verify logos in database
        const logosVerified = await this.verifyLogosInDatabase();
        
        if (!logosVerified) {
            console.log('❌ No logos found in database - setup incomplete');
            return false;
        }
        
        // Step 2: Create board view configurations  
        await this.createBoardViewConfigurations();
        
        // Step 3: Update UI for real database
        await this.updateUIForRealDatabase();
        
        // Step 4: Generate final report
        await this.generateFinalReport();
        
        return true;
    }
}

// Main execution
async function main() {
    const setup = new NotionVisualSetup();
    const success = await setup.execute();
    
    if (success) {
        console.log('🎉 COMPLETE: Visual setup verified and enhanced!');
    } else {
        console.log('❌ INCOMPLETE: Setup needs attention');
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
}

module.exports = NotionVisualSetup;