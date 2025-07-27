# CLAUDE.md - BC AI Ecosystem Project

## Important User Preferences

**ALWAYS USE MCP FOR NOTION OPERATIONS**
- User requires MCP (Model Context Protocol) for all Notion database interactions
- If MCP is not working, troubleshoot and get it working before proceeding
- MCP configuration is located at `/Users/kk/.cursor/mcp.json`
- Uses official Notion MCP server: `@notionhq/notion-mcp-server`

## Project Overview
This project maintains the BC AI Ecosystem Community Atlas - a comprehensive database of AI organizations across British Columbia.

## Database Information
- **Notion Database ID**: `1f0c6f799a3381bd8332ca0235c24655`
- **Database Name**: AI Ecosystem Map
- **Public Database URL**: https://vancouver.bc-ai.net/1f0c6f799a3381bd8332ca0235c24655

## Key Files
- `new_organizations.md` - Organizations to be added (✅ marks indicate already added)
- `README.md` - Project documentation and overview
- `database-schema.md` - Database structure documentation
- `organization-examples.md` - Example organization entries

## MCP Configuration
- **Server**: `@notionhq/notion-mcp-server` (official Notion MCP server)
- **Location**: `/Users/kk/.cursor/mcp.json`
- **Status**: ✅ Working and verified

## Workflow
1. Check existing database for duplicates using MCP tools
2. Identify unmarked organizations in `new_organizations.md`
3. Use MCP tools to add new organizations
4. Verify additions and mark as complete (✅) in markdown file

## Database Schema
25+ properties including:
- **Core Info**: Name, Website, City/Region, BC Region, Contact details
- **Classification**: Category, AI Focus Areas, Size, Status
- **Content**: Short Blurb, Notable Projects, Data Source
- **Relationships**: Related Organizations, Warm-Intro Vector

## Commands
- Lint/typecheck: Check project structure for specific commands
- MCP tools automatically available through Cursor with proper configuration