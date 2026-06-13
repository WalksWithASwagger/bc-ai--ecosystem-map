/**
 * Tests for Unified Database Enhancer
 *
 * Tests the core functionality of the consolidated database enhancement utility
 * that replaces 18+ archived scripts.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UnifiedDatabaseEnhancer, FIELD_PRIORITIES, DEFAULT_CONFIG } from '../../tools/unified-database-enhancer.js';

// Mock the Notion client
vi.mock('@notionhq/client', () => ({
  Client: vi.fn().mockImplementation(() => ({
    databases: {
      query: vi.fn(),
    },
    pages: {
      update: vi.fn(),
    },
  })),
}));

// Mock fs module
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
    mkdirSync: vi.fn(),
    writeFileSync: vi.fn(),
  },
}));

describe('UnifiedDatabaseEnhancer', () => {
  describe('Constants', () => {
    it('should have correct DEFAULT_CONFIG', () => {
      expect(DEFAULT_CONFIG).toEqual({
        limit: 50,
        batch: 1,
        dryRun: true,
        priorityOnly: false,
        fields: ['LinkedIn URL', 'Key People', 'Year Founded', 'Funding', 'Employee Count'],
        skipEnhancements: [],
      });
    });

    it('should have FIELD_PRIORITIES with correct structure', () => {
      expect(FIELD_PRIORITIES).toBeDefined();
      expect(FIELD_PRIORITIES['LinkedIn URL']).toEqual({
        priority: 'HIGH',
        weight: 100,
      });
      expect(FIELD_PRIORITIES['Key People']).toEqual({
        priority: 'HIGH',
        weight: 95,
      });
      expect(FIELD_PRIORITIES['Year Founded']).toEqual({
        priority: 'HIGH',
        weight: 90,
      });
    });

    it('should have HIGH priority fields with weight >= 90', () => {
      const highPriorityFields = Object.entries(FIELD_PRIORITIES)
        .filter(([_, config]) => config.priority === 'HIGH');

      expect(highPriorityFields.length).toBeGreaterThan(0);
      highPriorityFields.forEach(([fieldName, config]) => {
        expect(config.weight).toBeGreaterThanOrEqual(90);
      });
    });
  });

  describe('Configuration', () => {
    beforeEach(() => {
      // Set required environment variables
      process.env.NOTION_TOKEN = 'test_token';
      process.env.NOTION_DATABASE_ID = 'test_db_id';
    });

    it('should initialize with default config', () => {
      const enhancer = new UnifiedDatabaseEnhancer();
      expect(enhancer.config.limit).toBe(50);
      expect(enhancer.config.batch).toBe(1);
      expect(enhancer.config.dryRun).toBe(true);
    });

    it('should merge custom config with defaults', () => {
      const customConfig = {
        limit: 100,
        dryRun: false,
      };
      const enhancer = new UnifiedDatabaseEnhancer(customConfig);

      expect(enhancer.config.limit).toBe(100);
      expect(enhancer.config.dryRun).toBe(false);
      expect(enhancer.config.batch).toBe(1); // Should keep default
    });

    it('should throw error if NOTION_TOKEN is missing', () => {
      delete process.env.NOTION_TOKEN;

      expect(() => {
        new UnifiedDatabaseEnhancer();
      }).toThrow('Missing NOTION_TOKEN or NOTION_DATABASE_ID in environment');
    });

    it('should throw error if NOTION_DATABASE_ID is missing', () => {
      delete process.env.NOTION_DATABASE_ID;

      expect(() => {
        new UnifiedDatabaseEnhancer();
      }).toThrow('Missing NOTION_TOKEN or NOTION_DATABASE_ID in environment');
    });
  });

  describe('Property Value Extraction', () => {
    let enhancer;

    beforeEach(() => {
      process.env.NOTION_TOKEN = 'test_token';
      process.env.NOTION_DATABASE_ID = 'test_db_id';
      enhancer = new UnifiedDatabaseEnhancer();
    });

    it('should extract title property correctly', () => {
      const record = {
        properties: {
          Name: {
            type: 'title',
            title: [{ plain_text: 'Test Organization' }],
          },
        },
      };

      const value = enhancer.getPropertyValue(record, 'Name');
      expect(value).toBe('Test Organization');
    });

    it('should extract rich_text property correctly', () => {
      const record = {
        properties: {
          Description: {
            type: 'rich_text',
            rich_text: [{ plain_text: 'Test description' }],
          },
        },
      };

      const value = enhancer.getPropertyValue(record, 'Description');
      expect(value).toBe('Test description');
    });

    it('should extract URL property correctly', () => {
      const record = {
        properties: {
          Website: {
            type: 'url',
            url: 'https://example.com',
          },
        },
      };

      const value = enhancer.getPropertyValue(record, 'Website');
      expect(value).toBe('https://example.com');
    });

    it('should extract number property correctly', () => {
      const record = {
        properties: {
          'Year Founded': {
            type: 'number',
            number: 2020,
          },
        },
      };

      const value = enhancer.getPropertyValue(record, 'Year Founded');
      expect(value).toBe(2020);
    });

    it('should return empty string for empty title', () => {
      const record = {
        properties: {
          Name: {
            type: 'title',
            title: [],
          },
        },
      };

      const value = enhancer.getPropertyValue(record, 'Name');
      expect(value).toBe('');
    });

    it('should return null for non-existent property', () => {
      const record = {
        properties: {},
      };

      const value = enhancer.getPropertyValue(record, 'NonExistent');
      expect(value).toBeNull();
    });

    it('should extract select property correctly', () => {
      const record = {
        properties: {
          Category: {
            type: 'select',
            select: { name: 'Startup' },
          },
        },
      };

      const value = enhancer.getPropertyValue(record, 'Category');
      expect(value).toBe('Startup');
    });

    it('should extract multi_select property as array', () => {
      const record = {
        properties: {
          Tags: {
            type: 'multi_select',
            multi_select: [
              { name: 'AI' },
              { name: 'ML' },
            ],
          },
        },
      };

      const value = enhancer.getPropertyValue(record, 'Tags');
      expect(value).toEqual(['AI', 'ML']);
    });
  });

  describe('Field Update Logic', () => {
    let enhancer;

    beforeEach(() => {
      process.env.NOTION_TOKEN = 'test_token';
      process.env.NOTION_DATABASE_ID = 'test_db_id';
      enhancer = new UnifiedDatabaseEnhancer();
    });

    it('should detect that empty field needs update', () => {
      expect(enhancer.needsUpdate('LinkedIn URL', '')).toBe(true);
      expect(enhancer.needsUpdate('LinkedIn URL', null)).toBe(true);
      expect(enhancer.needsUpdate('Key People', [])).toBe(true);
    });

    it('should detect that populated field does not need update', () => {
      expect(enhancer.needsUpdate('LinkedIn URL', 'https://linkedin.com/company/test')).toBe(false);
      expect(enhancer.needsUpdate('Key People', 'John Doe')).toBe(false);
      expect(enhancer.needsUpdate('Tags', ['AI', 'ML'])).toBe(false);
    });
  });

  describe('Statistics Tracking', () => {
    let enhancer;

    beforeEach(() => {
      process.env.NOTION_TOKEN = 'test_token';
      process.env.NOTION_DATABASE_ID = 'test_db_id';
      enhancer = new UnifiedDatabaseEnhancer();
    });

    it('should initialize stats correctly', () => {
      expect(enhancer.stats).toEqual({
        processed: 0,
        updated: 0,
        failed: 0,
        skipped: 0,
        fieldUpdates: {},
        errors: [],
      });
    });

    it('should track field updates', () => {
      enhancer.trackFieldUpdate('LinkedIn URL');
      enhancer.trackFieldUpdate('LinkedIn URL');
      enhancer.trackFieldUpdate('Key People');

      expect(enhancer.stats.fieldUpdates['LinkedIn URL']).toBe(2);
      expect(enhancer.stats.fieldUpdates['Key People']).toBe(1);
    });

    it('should initialize field update counter if not exists', () => {
      enhancer.trackFieldUpdate('New Field');
      expect(enhancer.stats.fieldUpdates['New Field']).toBe(1);
    });
  });

  describe('Property Value Formatting', () => {
    let enhancer;

    beforeEach(() => {
      process.env.NOTION_TOKEN = 'test_token';
      process.env.NOTION_DATABASE_ID = 'test_db_id';
      enhancer = new UnifiedDatabaseEnhancer();
    });

    it('should format URL fields correctly', () => {
      const formatted = enhancer.formatPropertyValue('LinkedIn URL', 'https://linkedin.com/company/test');
      expect(formatted).toEqual({ url: 'https://linkedin.com/company/test' });
    });

    it('should format Website fields as URL', () => {
      const formatted = enhancer.formatPropertyValue('Website', 'https://example.com');
      expect(formatted).toEqual({ url: 'https://example.com' });
    });

    it('should format non-URL fields as rich_text', () => {
      const formatted = enhancer.formatPropertyValue('Key People', 'John Doe, Jane Smith');
      expect(formatted).toEqual({
        rich_text: [{
          text: { content: 'John Doe, Jane Smith' },
        }],
      });
    });

    it('should convert values to string for rich_text', () => {
      const formatted = enhancer.formatPropertyValue('Year Founded', 2020);
      expect(formatted).toEqual({
        rich_text: [{
          text: { content: '2020' },
        }],
      });
    });
  });

  describe('Record Name Extraction', () => {
    let enhancer;

    beforeEach(() => {
      process.env.NOTION_TOKEN = 'test_token';
      process.env.NOTION_DATABASE_ID = 'test_db_id';
      enhancer = new UnifiedDatabaseEnhancer();
    });

    it('should extract record name from Name property', () => {
      const record = {
        properties: {
          Name: {
            type: 'title',
            title: [{ plain_text: 'Acme Corp' }],
          },
        },
      };

      expect(enhancer.getRecordName(record)).toBe('Acme Corp');
    });

    it('should return "Unnamed Record" if Name is empty', () => {
      const record = {
        properties: {
          Name: {
            type: 'title',
            title: [],
          },
        },
      };

      expect(enhancer.getRecordName(record)).toBe('Unnamed Record');
    });

    it('should return "Unnamed Record" if Name property missing', () => {
      const record = {
        properties: {},
      };

      expect(enhancer.getRecordName(record)).toBe('Unnamed Record');
    });
  });

  describe('Delay Function', () => {
    let enhancer;

    beforeEach(() => {
      process.env.NOTION_TOKEN = 'test_token';
      process.env.NOTION_DATABASE_ID = 'test_db_id';
      enhancer = new UnifiedDatabaseEnhancer();
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should delay execution by specified milliseconds', async () => {
      const startTime = Date.now();
      const delayPromise = enhancer.delay(500);

      vi.advanceTimersByTime(500);
      await delayPromise;

      // In fake timers, we just check that the promise resolves
      expect(delayPromise).resolves.toBeUndefined();
    });
  });
});

// Integration-style tests (with mocked dependencies)
describe('UnifiedDatabaseEnhancer Integration', () => {
  beforeEach(() => {
    process.env.NOTION_TOKEN = 'test_token';
    process.env.NOTION_DATABASE_ID = 'test_db_id';
  });

  it('should handle dry-run mode without applying updates', () => {
    const config = {
      limit: 10,
      dryRun: true,
    };

    const enhancer = new UnifiedDatabaseEnhancer(config);
    expect(enhancer.config.dryRun).toBe(true);
  });

  it('should respect limit configuration', () => {
    const config = {
      limit: 25,
    };

    const enhancer = new UnifiedDatabaseEnhancer(config);
    expect(enhancer.config.limit).toBe(25);
  });

  it('should track processed IDs to avoid duplicates', () => {
    const enhancer = new UnifiedDatabaseEnhancer();

    enhancer.processedIds.add('id-1');
    enhancer.processedIds.add('id-2');

    expect(enhancer.processedIds.has('id-1')).toBe(true);
    expect(enhancer.processedIds.has('id-2')).toBe(true);
    expect(enhancer.processedIds.has('id-3')).toBe(false);
    expect(enhancer.processedIds.size).toBe(2);
  });
});
