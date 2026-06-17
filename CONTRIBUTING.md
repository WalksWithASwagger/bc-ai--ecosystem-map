# Contributing to BC AI Ecosystem Atlas

*Building BC's AI ecosystem together* 🇨🇦

---

## 🎯 Welcome Contributors!

Thank you for your interest in contributing to the BC AI Ecosystem Atlas! This project maps British Columbia's artificial intelligence landscape and relies on community contributions to maintain accuracy and completeness.

---

## 🤝 Ways to Contribute

### 🔍 **Organization Updates**
- **Correct existing information** - Fix outdated details, contact info, or descriptions
- **Add missing data** - Fill in gaps like websites, LinkedIn profiles, founding years
- **Update status changes** - Report acquisitions, closures, or major pivots

### 🏢 **New Organizations**
- **Nominate missing companies** - AI startups, enterprises, or initiatives we've missed
- **Research institutions** - University labs, research centers, or academic programs
- **Government initiatives** - Public sector AI programs or policy groups
- **Indigenous AI projects** - First Nations technology initiatives and programs

### ✅ **Data Validation**
- **Verify existing profiles** - Confirm accuracy of organization details
- **Quality assurance** - Help identify and fix data inconsistencies
- **Duplicate detection** - Report potential duplicate entries

### 🌐 **Community Outreach**
- **Connect stakeholders** - Introduce us to ecosystem participants
- **Share expertise** - Provide insights on BC's AI landscape
- **Spread awareness** - Help promote the atlas within the community

---

## 🚀 Getting Started

### Quick Contributions (No Technical Setup)

#### Submit Organization Updates via Issues
1. Go to [GitHub Issues](https://github.com/WalksWithASwagger/bc-ai--ecosystem-map/issues)
2. Click "New Issue"
3. Use the "Organization Update" template
4. Provide as much detail as possible

#### Organization Update Template
```markdown
**Organization Name:** [Name]
**Type of Update:** [New/Update/Correction]
**Current Information:** [What needs to be changed]
**Proposed Changes:** [Your suggested updates]
**Source/Verification:** [How you verified this information]
**Additional Notes:** [Any other relevant details]
```

### Technical Contributions (Setup Required)

#### Prerequisites
- **Node.js** (v16 or higher)
- **Git** for version control
- **GitHub account** for pull requests

#### Development Setup
```bash
# 1. Fork the repository on GitHub
# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/bc-ai--ecosystem-map.git
cd bc-ai--ecosystem-map

# 3. Install dependencies
npm install

# 4. Configure Notion access for database tools
export NOTION_TOKEN=secret_xxx
export NOTION_DATABASE_ID=1f0c6f799a3381bd8332ca0235c24655

# 5. Create a new branch for your changes
git checkout -b feature/your-feature-name
```

⚠️ **IMPORTANT: Never hard-code Notion tokens**
- Use `NOTION_TOKEN` and `NOTION_DATABASE_ID` from your local shell, uncommitted `.env` file, or approved CI secret store.
- Do not commit `.env`, credentials, tokens, generated config with secrets, or copied API responses containing private credentials.
- See [MCP_NOTION_GUIDE.md](MCP_NOTION_GUIDE.md) for details.

---

## 🛠️ Technical Contribution Guide

### Database Enhancement Contributions

#### Running Enhancement Tools
```bash
# Always start with help or dry-run style modes before live updates
npm run mcp -- --help
npm run analyze -- --help
npm run enrich -- --help
```

#### Adding New Organizations
```bash
# Use the package entrypoints and documented import workflow
npm run mcp -- --help
```

#### Quality Assurance
```bash
# Check analysis and enrichment options
npm run analyze -- --help
npm run enrich -- --help
```

### Code Contributions

#### Script Development Guidelines

1. **Follow existing patterns** - Use similar structure to existing scripts
2. **Include comprehensive error handling** - Graceful failures with detailed logging
3. **Add dry run capabilities** - Always allow testing without database changes
4. **Generate detailed reports** - Output results in markdown format
5. **Document thoroughly** - Include usage instructions and examples

#### Example Script Structure
```javascript
#!/usr/bin/env node
/**
 * Script description and usage instructions
 * Usage: node scripts/your-script.js [options]
 */

const { Client } = require('@notionhq/client');

const notionToken = process.env.NOTION_TOKEN;
const databaseId = process.env.NOTION_DATABASE_ID;

if (!notionToken || !databaseId) {
  throw new Error('Set NOTION_TOKEN and NOTION_DATABASE_ID before running this tool.');
}

const notion = new Client({ auth: notionToken });

// Argument parsing
const args = process.argv.slice(2);
const options = {
  dryrun: args.includes('--dryrun'),
  limit: parseInt(args.find(arg => arg.startsWith('--limit='))?.split('=')[1]) || 10
};

// Main function with error handling
async function main() {
  try {
    // Your script logic here
    console.log('Script completed successfully');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
```

---

## 📊 Data Standards & Quality

### Organization Data Requirements

#### Required Fields
- **Name** - Official organization name
- **Category** - Primary business category
- **City** - Primary location in BC
- **Description** - Brief description of AI focus

#### Preferred Fields
- **Website** - Official website URL
- **LinkedIn** - Company LinkedIn profile
- **Email** - Primary contact email
- **AI Focus Areas** - Specific AI technologies/applications

#### Quality Standards
- **Accuracy** - All information must be current and verified
- **Completeness** - Aim for 80%+ field completion
- **Consistency** - Follow established naming conventions
- **Sources** - Provide verification sources when possible

### Data Verification Process

1. **Primary Sources** - Official websites, press releases, company announcements
2. **Secondary Sources** - News articles, industry reports, LinkedIn profiles
3. **Cross-Validation** - Verify information across multiple sources
4. **Recency** - Prioritize information from the last 12 months

---

## 🔄 Contribution Workflow

### For Non-Technical Contributors

1. **Identify Contribution** - Find missing or incorrect information
2. **Gather Evidence** - Collect verification sources
3. **Submit Issue** - Use GitHub Issues with organization template
4. **Provide Details** - Include all relevant information and sources
5. **Follow Up** - Respond to questions from maintainers

### For Technical Contributors

1. **Fork Repository** - Create your own copy on GitHub
2. **Create Branch** - Use descriptive branch names
3. **Make Changes** - Follow coding standards and test thoroughly
4. **Test Changes** - Always run dry runs before submitting
5. **Commit Changes** - Use clear, descriptive commit messages
6. **Submit Pull Request** - Include detailed description of changes
7. **Address Feedback** - Respond to review comments promptly

#### Branch Naming Convention
```
feature/add-new-organizations
fix/duplicate-detection-bug
docs/update-workflow-guide
enhancement/contact-extraction-improvements
```

#### Commit Message Format
```
type: brief description

Detailed explanation of what changed and why.
Include any breaking changes or important notes.

Closes #123 (if fixing an issue)
```

---

## 🧪 Testing Guidelines

### Before Submitting Changes

1. **Run Dry Runs** - Test all scripts with `--dryrun` flag
2. **Check for Duplicates** - Run duplicate detection after imports
3. **Validate Data Quality** - Ensure no broken links or invalid data
4. **Test Edge Cases** - Consider unusual organization names or structures
5. **Generate Reports** - Review output reports for accuracy

### Testing Checklist
- [ ] All scripts run without errors
- [ ] Dry run produces expected results
- [ ] No new duplicates introduced
- [ ] Reports are generated correctly
- [ ] Data follows quality standards
- [ ] Documentation is updated if needed

---

## 📝 Documentation Guidelines

### When to Update Documentation

- **New scripts or tools** - Add or update `tools/README.md` and the nearest tool-specific README
- **Workflow changes** - Update `docs/guides/WORKFLOW_GUIDE.md`
- **New features** - Update README.md and relevant docs
- **Breaking changes** - Update all affected documentation

### Documentation Standards

1. **Clear Instructions** - Step-by-step procedures
2. **Examples** - Include code examples and usage scenarios
3. **Error Handling** - Document common issues and solutions
4. **Up-to-Date** - Keep documentation current with code changes

---

## 🎯 Contribution Priorities

### High Priority
- **Missing contact information** - Websites, emails, LinkedIn profiles
- **New organization discovery** - Recently founded or overlooked companies
- **Data accuracy** - Fixing outdated or incorrect information
- **Geographic coverage** - Organizations outside Lower Mainland

### Medium Priority
- **Enhanced profiles** - Adding founding years, key people, detailed descriptions
- **Logo collection** - Professional logos for visual representation
- **Category refinement** - Improving AI focus area classifications

### Lower Priority
- **Advanced features** - New automation tools or integrations
- **Performance optimizations** - Speed improvements for existing tools
- **Additional data fields** - Expanding database schema

---

## 🏆 Recognition

### Contributor Recognition

- **GitHub Contributors** - Automatic recognition in repository
- **Changelog Credits** - Major contributions noted in CHANGELOG.md
- **Community Mentions** - Recognition in project updates and announcements

### Types of Recognition

- **Data Contributors** - Those who add/update organization information
- **Technical Contributors** - Developers who improve tools and infrastructure
- **Community Builders** - Those who help grow and engage the community
- **Quality Assurance** - Contributors who help maintain data accuracy

---

## 📞 Getting Help

### Communication Channels

- **GitHub Issues** - For bug reports and feature requests
- **GitHub Discussions** - For questions and community conversations
- **Pull Request Reviews** - For code-related discussions

### Getting Support

1. **Check Documentation** - Review README, the workflow guide, and tool README files
2. **Search Issues** - Look for similar problems or questions
3. **Ask Questions** - Create a GitHub Discussion for general questions
4. **Report Bugs** - Use GitHub Issues for problems or errors

### Response Times

- **Critical Issues** - 24-48 hours
- **General Questions** - 2-5 days
- **Feature Requests** - 1-2 weeks
- **Pull Reviews** - 3-7 days

---

## 🔒 Code of Conduct

### Our Standards

- **Be Respectful** - Treat all contributors with respect and kindness
- **Be Inclusive** - Welcome contributors from all backgrounds and skill levels
- **Be Collaborative** - Work together to improve the project
- **Be Professional** - Maintain professional communication and behavior

### Unacceptable Behavior

- Harassment or discrimination of any kind
- Offensive or inappropriate language
- Personal attacks or insults
- Spam or off-topic discussions

### Enforcement

Violations of the code of conduct will be addressed by project maintainers. Serious violations may result in removal from the project.

---

## 🚀 Advanced Contributions

### Research Initiatives

- **Ecosystem Analysis** - Deep research into BC's AI landscape
- **Trend Identification** - Spotting emerging patterns and opportunities
- **Gap Analysis** - Identifying underrepresented sectors or regions

### Technical Enhancements

- **New Enhancement Tools** - Developing additional automation scripts
- **API Integrations** - Connecting with external data sources
- **Quality Algorithms** - Improving data validation and scoring

### Community Building

- **Outreach Programs** - Engaging with ecosystem stakeholders
- **Partnership Development** - Building relationships with organizations
- **Event Coordination** - Organizing community meetups or presentations

---

## 📚 Resources

### Project Documentation
- **[README.md](README.md)** - Project overview and current status
- **[docs/guides/WORKFLOW_GUIDE.md](docs/guides/WORKFLOW_GUIDE.md)** - Complete operational procedures
- **[tools/README.md](tools/README.md)** - Tool documentation
- **[tools/03-enrichment/CONTACT_ENHANCEMENT_README.md](tools/03-enrichment/CONTACT_ENHANCEMENT_README.md)** - Contact enhancement documentation
- **[database-schema.md](database-schema.md)** - Database structure

### External Resources
- **[Notion API Documentation](https://developers.notion.com/)** - For database integration
- **[Node.js Documentation](https://nodejs.org/docs/)** - For script development
- **[GitHub Guides](https://guides.github.com/)** - For Git and GitHub usage

---

## 🎉 Thank You!

Your contributions help build the most comprehensive mapping of BC's AI ecosystem. Whether you're fixing a typo, adding a new organization, or developing advanced features, every contribution matters.

Together, we're creating a valuable resource for entrepreneurs, researchers, investors, and policymakers working to grow British Columbia's AI community.

---

*Last updated: August 1, 2025*

**[🏠 Back to README](README.md)** • **[📋 Workflow Guide](docs/guides/WORKFLOW_GUIDE.md)** • **[🔧 Tool Docs](tools/README.md)**
