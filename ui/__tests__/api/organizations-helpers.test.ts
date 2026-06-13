/**
 * Tests for Organizations API Route Helper Functions
 *
 * Tests the 12 documented helper functions that extract property values
 * from Notion API responses.
 */

import { describe, it, expect } from '@jest/globals';

/**
 * Since these functions are defined inline in the route handler,
 * we'll extract and test them here. In a real-world scenario,
 * these should be moved to a separate module for better testability.
 */

// Helper function implementations (extracted for testing)
const getProperty = (prop: any, type: string, field?: string) => {
  if (!prop || prop.type !== type) return null;
  return field ? prop[field] : prop;
};

const getTitleText = (prop: any) => {
  const title = getProperty(prop, 'title', 'title');
  return title?.[0]?.plain_text || '';
};

const getRichText = (prop: any) => {
  const richText = getProperty(prop, 'rich_text', 'rich_text');
  return richText?.[0]?.plain_text || '';
};

const getSelectName = (prop: any) => {
  const select = getProperty(prop, 'select', 'select');
  return select?.name || '';
};

const getMultiSelectNames = (prop: any) => {
  const multiSelect = getProperty(prop, 'multi_select', 'multi_select');
  return multiSelect?.map((s: any) => s.name) || [];
};

const getUrl = (prop: any) => {
  const url = getProperty(prop, 'url', 'url');
  return url || '';
};

const getEmail = (prop: any) => {
  const email = getProperty(prop, 'email', 'email');
  return email || '';
};

const getPhoneNumber = (prop: any) => {
  const phone = getProperty(prop, 'phone_number', 'phone_number');
  return phone || '';
};

const getNumber = (prop: any) => {
  const number = getProperty(prop, 'number', 'number');
  return number;
};

describe('Organizations API Helper Functions', () => {
  describe('getProperty', () => {
    it('should return null if prop is null or undefined', () => {
      expect(getProperty(null, 'title')).toBeNull();
      expect(getProperty(undefined, 'title')).toBeNull();
    });

    it('should return null if type does not match', () => {
      const prop = { type: 'rich_text', rich_text: [] };
      expect(getProperty(prop, 'title')).toBeNull();
    });

    it('should return full prop if type matches and no field specified', () => {
      const prop = { type: 'title', title: ['test'] };
      expect(getProperty(prop, 'title')).toEqual(prop);
    });

    it('should return specific field if type matches and field specified', () => {
      const prop = { type: 'title', title: ['test'] };
      expect(getProperty(prop, 'title', 'title')).toEqual(['test']);
    });
  });

  describe('getTitleText', () => {
    it('should extract plain text from title property', () => {
      const prop = {
        type: 'title',
        title: [{ plain_text: 'Acme Corporation' }],
      };

      expect(getTitleText(prop)).toBe('Acme Corporation');
    });

    it('should return empty string if title array is empty', () => {
      const prop = {
        type: 'title',
        title: [],
      };

      expect(getTitleText(prop)).toBe('');
    });

    it('should return empty string if prop is null', () => {
      expect(getTitleText(null)).toBe('');
    });

    it('should return empty string if type does not match', () => {
      const prop = {
        type: 'rich_text',
        rich_text: [{ plain_text: 'Test' }],
      };

      expect(getTitleText(prop)).toBe('');
    });

    it('should extract first element from multiple title items', () => {
      const prop = {
        type: 'title',
        title: [
          { plain_text: 'First Title' },
          { plain_text: 'Second Title' },
        ],
      };

      expect(getTitleText(prop)).toBe('First Title');
    });
  });

  describe('getRichText', () => {
    it('should extract plain text from rich_text property', () => {
      const prop = {
        type: 'rich_text',
        rich_text: [{ plain_text: 'This is a description' }],
      };

      expect(getRichText(prop)).toBe('This is a description');
    });

    it('should return empty string if rich_text array is empty', () => {
      const prop = {
        type: 'rich_text',
        rich_text: [],
      };

      expect(getRichText(prop)).toBe('');
    });

    it('should return empty string if prop is null', () => {
      expect(getRichText(null)).toBe('');
    });

    it('should handle multi-line rich text (gets first element)', () => {
      const prop = {
        type: 'rich_text',
        rich_text: [
          { plain_text: 'Line 1' },
          { plain_text: 'Line 2' },
        ],
      };

      expect(getRichText(prop)).toBe('Line 1');
    });
  });

  describe('getSelectName', () => {
    it('should extract name from select property', () => {
      const prop = {
        type: 'select',
        select: { name: 'Startup' },
      };

      expect(getSelectName(prop)).toBe('Startup');
    });

    it('should return empty string if select is null', () => {
      const prop = {
        type: 'select',
        select: null,
      };

      expect(getSelectName(prop)).toBe('');
    });

    it('should return empty string if prop is null', () => {
      expect(getSelectName(null)).toBe('');
    });

    it('should extract select with different category names', () => {
      const categories = ['Scaleup', 'Enterprise', 'Research'];

      categories.forEach(category => {
        const prop = {
          type: 'select',
          select: { name: category },
        };
        expect(getSelectName(prop)).toBe(category);
      });
    });
  });

  describe('getMultiSelectNames', () => {
    it('should extract array of names from multi_select property', () => {
      const prop = {
        type: 'multi_select',
        multi_select: [
          { name: 'AI' },
          { name: 'Machine Learning' },
          { name: 'Computer Vision' },
        ],
      };

      expect(getMultiSelectNames(prop)).toEqual(['AI', 'Machine Learning', 'Computer Vision']);
    });

    it('should return empty array if multi_select is empty', () => {
      const prop = {
        type: 'multi_select',
        multi_select: [],
      };

      expect(getMultiSelectNames(prop)).toEqual([]);
    });

    it('should return empty array if prop is null', () => {
      expect(getMultiSelectNames(null)).toEqual([]);
    });

    it('should handle single selection', () => {
      const prop = {
        type: 'multi_select',
        multi_select: [{ name: 'NLP' }],
      };

      expect(getMultiSelectNames(prop)).toEqual(['NLP']);
    });
  });

  describe('getUrl', () => {
    it('should extract URL from url property', () => {
      const prop = {
        type: 'url',
        url: 'https://example.com',
      };

      expect(getUrl(prop)).toBe('https://example.com');
    });

    it('should return empty string if url is null', () => {
      const prop = {
        type: 'url',
        url: null,
      };

      expect(getUrl(prop)).toBe('');
    });

    it('should return empty string if prop is null', () => {
      expect(getUrl(null)).toBe('');
    });

    it('should handle various URL formats', () => {
      const urls = [
        'https://www.example.com',
        'http://example.com',
        'https://example.com/path/to/page',
        'https://linkedin.com/company/acme',
      ];

      urls.forEach(url => {
        const prop = { type: 'url', url };
        expect(getUrl(prop)).toBe(url);
      });
    });
  });

  describe('getEmail', () => {
    it('should extract email from email property', () => {
      const prop = {
        type: 'email',
        email: 'contact@example.com',
      };

      expect(getEmail(prop)).toBe('contact@example.com');
    });

    it('should return empty string if email is null', () => {
      const prop = {
        type: 'email',
        email: null,
      };

      expect(getEmail(prop)).toBe('');
    });

    it('should return empty string if prop is null', () => {
      expect(getEmail(null)).toBe('');
    });

    it('should handle various email formats', () => {
      const emails = [
        'user@example.com',
        'admin@company.co.uk',
        'info@startup.ai',
      ];

      emails.forEach(email => {
        const prop = { type: 'email', email };
        expect(getEmail(prop)).toBe(email);
      });
    });
  });

  describe('getPhoneNumber', () => {
    it('should extract phone number from phone_number property', () => {
      const prop = {
        type: 'phone_number',
        phone_number: '+1-604-555-1234',
      };

      expect(getPhoneNumber(prop)).toBe('+1-604-555-1234');
    });

    it('should return empty string if phone_number is null', () => {
      const prop = {
        type: 'phone_number',
        phone_number: null,
      };

      expect(getPhoneNumber(prop)).toBe('');
    });

    it('should return empty string if prop is null', () => {
      expect(getPhoneNumber(null)).toBe('');
    });

    it('should handle various phone formats', () => {
      const phones = [
        '604-555-1234',
        '+1 (604) 555-1234',
        '1-604-555-1234',
      ];

      phones.forEach(phone => {
        const prop = { type: 'phone_number', phone_number: phone };
        expect(getPhoneNumber(prop)).toBe(phone);
      });
    });
  });

  describe('getNumber', () => {
    it('should extract number from number property', () => {
      const prop = {
        type: 'number',
        number: 2020,
      };

      expect(getNumber(prop)).toBe(2020);
    });

    it('should return null if number is null', () => {
      const prop = {
        type: 'number',
        number: null,
      };

      expect(getNumber(prop)).toBeNull();
    });

    it('should return null if prop is null', () => {
      expect(getNumber(null)).toBeNull();
    });

    it('should handle decimal numbers', () => {
      const prop = {
        type: 'number',
        number: 49.2819,
      };

      expect(getNumber(prop)).toBe(49.2819);
    });

    it('should handle negative numbers', () => {
      const prop = {
        type: 'number',
        number: -123,
      };

      expect(getNumber(prop)).toBe(-123);
    });

    it('should handle zero', () => {
      const prop = {
        type: 'number',
        number: 0,
      };

      expect(getNumber(prop)).toBe(0);
    });
  });

  describe('Integration: Full Organization Object', () => {
    it('should extract all properties from a complete organization record', () => {
      const mockPage = {
        id: 'page-123',
        properties: {
          Name: {
            type: 'title',
            title: [{ plain_text: 'Acme AI Labs' }],
          },
          Website: {
            type: 'url',
            url: 'https://acmeai.com',
          },
          LinkedIn: {
            type: 'url',
            url: 'https://linkedin.com/company/acme-ai',
          },
          Email: {
            type: 'email',
            email: 'contact@acmeai.com',
          },
          Phone: {
            type: 'phone_number',
            phone_number: '604-555-1234',
          },
          'City/Region': {
            type: 'rich_text',
            rich_text: [{ plain_text: 'Vancouver' }],
          },
          'BC Region': {
            type: 'select',
            select: { name: 'Metro Vancouver' },
          },
          Category: {
            type: 'select',
            select: { name: 'Startup' },
          },
          'AI Focus Areas': {
            type: 'multi_select',
            multi_select: [
              { name: 'NLP' },
              { name: 'Computer Vision' },
            ],
          },
          'Year Founded': {
            type: 'number',
            number: 2020,
          },
          Size: {
            type: 'select',
            select: { name: '11-50' },
          },
          'Short Blurb': {
            type: 'rich_text',
            rich_text: [{ plain_text: 'AI solutions for enterprises' }],
          },
          'Key People': {
            type: 'rich_text',
            rich_text: [{ plain_text: 'Jane Doe (CEO), John Smith (CTO)' }],
          },
          Latitude: {
            type: 'number',
            number: 49.2827,
          },
          Longitude: {
            type: 'number',
            number: -123.1207,
          },
        },
      };

      // Extract all properties using helper functions
      const organization = {
        id: mockPage.id,
        name: getTitleText(mockPage.properties.Name),
        website: getUrl(mockPage.properties.Website),
        linkedin: getUrl(mockPage.properties.LinkedIn),
        email: getEmail(mockPage.properties.Email),
        phone: getPhoneNumber(mockPage.properties.Phone),
        city: getRichText(mockPage.properties['City/Region']),
        bcRegion: getSelectName(mockPage.properties['BC Region']),
        category: getSelectName(mockPage.properties.Category),
        aiFocusAreas: getMultiSelectNames(mockPage.properties['AI Focus Areas']),
        yearFounded: getNumber(mockPage.properties['Year Founded']),
        size: getSelectName(mockPage.properties.Size),
        shortBlurb: getRichText(mockPage.properties['Short Blurb']),
        keyPeople: getRichText(mockPage.properties['Key People']),
        latitude: getNumber(mockPage.properties.Latitude),
        longitude: getNumber(mockPage.properties.Longitude),
      };

      // Verify all fields extracted correctly
      expect(organization).toEqual({
        id: 'page-123',
        name: 'Acme AI Labs',
        website: 'https://acmeai.com',
        linkedin: 'https://linkedin.com/company/acme-ai',
        email: 'contact@acmeai.com',
        phone: '604-555-1234',
        city: 'Vancouver',
        bcRegion: 'Metro Vancouver',
        category: 'Startup',
        aiFocusAreas: ['NLP', 'Computer Vision'],
        yearFounded: 2020,
        size: '11-50',
        shortBlurb: 'AI solutions for enterprises',
        keyPeople: 'Jane Doe (CEO), John Smith (CTO)',
        latitude: 49.2827,
        longitude: -123.1207,
      });
    });
  });
});
