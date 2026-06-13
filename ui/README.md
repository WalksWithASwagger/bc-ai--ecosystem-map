# BC AI Ecosystem Atlas - Web UI

A Next.js web application for exploring and visualizing British Columbia's AI ecosystem organizations.

## ✨ Features

### 🎭 **Premium AI-First Interface**
- **Dark Mode by Default**: Modern AI-focused design with glass morphism
- **Smooth Animations**: Framer Motion powered micro-interactions and transitions
- **Premium Typography**: Gradient text treatments and modern font hierarchy
- **Glass Cards**: Backdrop blur with gradient overlays and hover effects

### 📊 **Interactive Data Platform**
- **Organization Directory**: Browse 581+ BC AI organizations with premium card design
- **Advanced Search**: Real-time search with modern input styling and icons
- **Smart Filters**: Filter by BC region, category with dynamic counts
- **Data Visualizations**: Interactive charts for ecosystem analytics
  - Category distribution pie chart
  - Regional analytics bar chart  
  - Growth timeline with cumulative data
  - AI focus areas popularity ranking

### 🗺️ **Interactive Mapping**
- **BC Ecosystem Map**: OpenStreetMap with custom color-coded markers
- **Organization Popups**: Rich hover details with contact links
- **Two-way Selection**: Click cards to highlight on map, click markers to select cards
- **Responsive Bounds**: Auto-zooming to British Columbia region

### 📱 **Organization Detail Modals**
- **Sliding Panel Design**: Premium right-side modal with spring animations
- **Rich Content Sections**: About, contact info, organization details, AI focus areas
- **Interactive Contact Items**: Clickable links with external indicators
- **Progressive Disclosure**: Staggered entrance animations

### 🔍 **Advanced Search System**
- **Fuzzy Search**: Intelligent text matching with Fuse.js
- **Real-time Autocomplete**: Instant suggestions with debounced input
- **Advanced Filters**: Size, year range, location radius, category, region
- **Search Analytics**: Track user search patterns and popular queries
- **Performance Optimized**: Memoized results and stable callbacks

### 🔗 **Real-time Integration**
- **Notion API**: Live data from centralized database with smart caching
- **Type-Safe Operations**: Comprehensive TypeScript implementation
- **Environment Management**: Secure token handling
- **Responsive Design**: Mobile-optimized interface

## Quick Start

### Prerequisites

- Node.js 16+ and npm
- Valid Notion API token and database access

### Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Create `.env.local` file:
   ```bash
   NOTION_TOKEN=your_notion_token_here
   NOTION_DATABASE_ID=your_database_id_here
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Access the app**: http://localhost:3000

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with custom AI-first theme
- **Animations**: Framer Motion for premium interactions
- **Database**: Notion API with real-time data
- **Maps**: React Leaflet + OpenStreetMap with custom markers
- **Charts**: Recharts for data visualizations
- **Icons**: Lucide React with modern icon set
- **Typography**: Inter font for professional appearance

## Environment Configuration

### Notion Setup Requirements

- **API Token**: Must have access to the target workspace
- **Database Permissions**: Token must have read access to the database
- **Schema Compatibility**: Works with the BC AI Ecosystem database schema

### Key Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NOTION_TOKEN` | Notion integration API token | `ntn_534098...` |
| `NOTION_DATABASE_ID` | Target database ID | `1f0c6f79...` |

## Architecture

### API Routes

- **`/api/organizations`**: Fetches organization data from Notion
  - Returns: organizations array, total count, statistics
  - Handles pagination automatically
  - Sorts by organization name

### Key Components

- **`app/page.tsx`**: Main UI component with search/filter functionality
- **`components/LoadingSpinner.tsx`**: Reusable loading component
- **`app/api/organizations/route.ts`**: Notion API integration

### Data Flow

1. UI requests data from `/api/organizations`
2. API queries Notion database using official SDK
3. Data transformed and returned as JSON
4. UI renders organization cards with search/filter capabilities

## Database Schema Compatibility

The UI expects the following Notion database properties:

| Property | Type | Description |
|----------|------|-------------|
| `Name` | Title | Organization name |
| `Website` | URL | Organization website |
| `LinkedIn` | URL | LinkedIn profile |
| `Email` | Email | Contact email |
| `Phone` | Phone | Contact phone |
| `City/Region` | Rich Text | Location |
| `BC Region` | Select | BC geographical region |
| `Category` | Select | Organization category |
| `AI Focus Areas` | Multi-select | AI specializations |
| `Year Founded` | Number | Founding year |
| `Size` | Select | Organization size |
| `Short Blurb` | Rich Text | Description |
| `Key People` | Rich Text | Notable team members |
| `Latitude` | Number | Geographic coordinate |
| `Longitude` | Number | Geographic coordinate |

## Troubleshooting

### Common Issues

**"API token is invalid" (401 error)**
- Verify token is correct and hasn't expired
- Ensure token belongs to the correct Notion workspace
- Check that database is shared with the integration

**"Could not find property" errors**
- Verify database schema matches expected properties
- Check property names are exact matches (case-sensitive)
- Ensure all required properties exist in the database

**"No organizations match your search"**
- Check if database actually contains data
- Verify API is returning data (check browser dev tools)
- Test API endpoint directly: `curl http://localhost:3000/api/organizations`

**Page won't load**
- Ensure development server is running (`npm run dev`)
- Check for environment variable issues
- Look at terminal/console for error messages

### Debug Mode

To enable debugging, temporarily add console logs to the API route:

```typescript
console.log('Environment check:');
console.log('NOTION_TOKEN:', process.env.NOTION_TOKEN ? 'present' : 'missing');
console.log('NOTION_DATABASE_ID:', process.env.NOTION_DATABASE_ID);
```

### Testing the API

```bash
# Test API endpoint directly
curl http://localhost:3000/api/organizations

# Check specific fields
curl -s http://localhost:3000/api/organizations | jq '.total'
```

## Development

### Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint

### Adding Features

The UI is built with modern React patterns and is ready for extension:

- **Advanced filters**: Add more filter options to the search bar
- **Detail views**: Create modal/page views for individual organizations
- **Data visualization**: Add charts/graphs for ecosystem insights
- **Export functionality**: Add CSV/PDF export capabilities
- **Map integration**: Add interactive map using Latitude/Longitude data

## Production Deployment

### Build and Deploy

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Set production environment variables**:
   ```bash
   export NOTION_TOKEN="your_production_token"
   export NOTION_DATABASE_ID="your_database_id"
   ```

3. **Start production server**:
   ```bash
   npm start
   ```

### Deployment Platforms

This Next.js app can be deployed to:
- **Vercel** (recommended for Next.js)
- **Netlify**
- **Railway**
- **Digital Ocean App Platform**
- **Traditional VPS** (with PM2 or similar)

### Environment Variables in Production

Ensure production environment has:
- `NOTION_TOKEN`: Production Notion API token
- `NOTION_DATABASE_ID`: Production database ID
- `NODE_ENV=production`: For optimizations

## 🏗️ Technical Architecture

### **Type System**
- **Centralized Types**: All interfaces defined in `ui/types/index.ts`
- **Type Safety**: Full TypeScript coverage with strict type checking
- **API Integration**: Type-safe Notion API response handling

### **Performance Optimizations**
- **Search Debouncing**: 300ms delay to reduce API calls
- **Memoization**: Strategic use of `useMemo` and `useCallback`
- **API Caching**: 1-minute response caching to reduce Notion API load
- **Stable References**: Prevents unnecessary re-renders

### **Component Architecture**
```
ui/
├── types/index.ts          # Shared TypeScript interfaces
├── hooks/useSearch.ts      # Advanced search logic
├── components/             # Reusable UI components
│   ├── InteractiveMap.tsx  # Leaflet map integration
│   ├── AdvancedSearch.tsx  # Search UI with autocomplete
│   └── OrganizationModal.tsx # Detail modal
└── app/
    ├── page.tsx           # Main application
    └── api/organizations/ # Notion API integration
```

### **Dependencies**
- **Next.js 14.1.0**: React framework with App Router
- **TypeScript 5**: Full type safety
- **Framer Motion**: Smooth animations
- **Leaflet**: Interactive mapping
- **Fuse.js**: Fuzzy search capabilities
- **Recharts**: Data visualizations

## Success Metrics

The current deployment successfully displays:
- **325+ organizations** from the BC AI ecosystem
- **7 BC regions** represented  
- **25+ categories** of organizations
- **Advanced search and filtering** with autocomplete
- **Interactive map and data visualizations**
- **Responsive design** working across devices

## Support

For issues or questions:
1. Check this README's troubleshooting section
2. Review the main project documentation
3. Examine terminal/browser console for error messages
4. Test API endpoints directly for debugging

---

**Built with**: Next.js 14, React, Tailwind CSS, Notion API
**Last updated**: January 2025