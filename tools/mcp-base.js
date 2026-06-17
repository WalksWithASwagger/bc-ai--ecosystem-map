const fs = require('fs').promises;
const path = require('path');
const {
  NOTION_TOKEN,
  DATABASE_ID,
  BATCH_SIZE,
  RATE_LIMIT_DELAY,
} = require('./mcp-constants');

class MCPBase {
  constructor() {
    if (!NOTION_TOKEN || !DATABASE_ID) {
      throw new Error('Set NOTION_TOKEN and NOTION_DATABASE_ID before running this tool.');
    }

    const { Client } = require('@notionhq/client');
    this.notion = new Client({ auth: NOTION_TOKEN });
    this.databaseId = DATABASE_ID;
    this.batchSize = BATCH_SIZE;
    this.rateLimitDelay = RATE_LIMIT_DELAY;
  }

  async fetchAllPages(filter = null) {
    const pages = [];
    let hasMore = true;
    let startCursor = undefined;

    while (hasMore) {
      const params = {
        database_id: this.databaseId,
        start_cursor: startCursor,
        page_size: this.batchSize,
      };

      if (filter) params.filter = filter;

      const response = await this.notion.databases.query(params);
      pages.push(...response.results);

      hasMore = response.has_more;
      startCursor = response.next_cursor;

      if (hasMore) {
        await this.rateLimit();
      }
    }

    return pages;
  }

  async getPage(pageId) {
    return await this.notion.pages.retrieve({ page_id: pageId });
  }

  async updatePage(pageId, properties) {
    try {
      return await this.notion.pages.update({
        page_id: pageId,
        properties,
      });
    } catch (error) {
      console.error(`Failed to update ${pageId}:`, error.message);
      throw error;
    }
  }

  async createPage(properties) {
    return await this.notion.pages.create({
      parent: { database_id: this.databaseId },
      properties,
    });
  }

  async archivePage(pageId) {
    return await this.notion.pages.update({
      page_id: pageId,
      archived: true,
    });
  }

  async rateLimit() {
    await new Promise((resolve) => setTimeout(resolve, this.rateLimitDelay));
  }

  getPropertyValue(page, propertyName) {
    const property = page.properties[propertyName];
    if (!property) return null;

    switch (property.type) {
      case 'title':
        return property.title?.[0]?.plain_text || null;
      case 'rich_text':
        return property.rich_text?.[0]?.plain_text || null;
      case 'url':
        return property.url || null;
      case 'email':
        return property.email || null;
      case 'phone_number':
        return property.phone_number || null;
      case 'number':
        return property.number || null;
      case 'select':
        return property.select?.name || null;
      case 'multi_select':
        return property.multi_select?.map((s) => s.name) || [];
      case 'checkbox':
        return property.checkbox || false;
      case 'date':
        return property.date?.start || null;
      default:
        return null;
    }
  }

  buildProperty(type, value) {
    switch (type) {
      case 'title':
        return { title: [{ text: { content: value } }] };
      case 'rich_text':
        return { rich_text: [{ text: { content: value } }] };
      case 'url':
        return { url: value };
      case 'email':
        return { email: value };
      case 'phone_number':
        return { phone_number: value };
      case 'number':
        return { number: value };
      case 'select':
        return { select: { name: value } };
      case 'multi_select':
        return {
          multi_select: Array.isArray(value)
            ? value.map((v) => ({ name: v }))
            : [{ name: value }],
        };
      case 'checkbox':
        return { checkbox: value };
      case 'date':
        return { date: { start: value } };
      default:
        throw new Error(`Unknown property type: ${type}`);
    }
  }

  getTimestamp() {
    return new Date().toISOString().split('T')[0];
  }

  async saveReport(filename, content) {
    const reportDir = path.join(__dirname, '..', 'reports');
    await fs.mkdir(reportDir, { recursive: true });

    const filepath = path.join(reportDir, filename);
    await fs.writeFile(filepath, content);

    return filepath;
  }

  logProgress(current, total, message = '') {
    const percentage = Math.round((current / total) * 100);
    const bar = '='.repeat(Math.floor(percentage / 2)) +
      '.'.repeat(50 - Math.floor(percentage / 2));

    process.stdout.write(`\r[${bar}] ${percentage}% (${current}/${total}) ${message}`);

    if (current === total) {
      console.log('');
    }
  }

  formatTable(data, columns) {
    if (!data.length) return '';

    const widths = {};
    columns.forEach((col) => {
      widths[col] = Math.max(
        col.length,
        ...data.map((row) => String(row[col] || '').length),
      );
    });

    let table = columns.map((col) => col.padEnd(widths[col])).join(' | ') + '\n';
    table += columns.map((col) => '-'.repeat(widths[col])).join('-|-') + '\n';

    data.forEach((row) => {
      table += columns.map((col) => String(row[col] || '').padEnd(widths[col])).join(' | ') + '\n';
    });

    return table;
  }
}

module.exports = MCPBase;
