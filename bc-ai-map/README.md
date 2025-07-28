# 🗺️ BC AI Ecosystem Interactive Map

An interactive web application visualizing British Columbia's AI ecosystem with 355+ organizations mapped across the province.

## 🚀 Features

- **Interactive Google Maps** with organization markers
- **Real-time Notion integration** for live data updates
- **Category-based filtering** with color-coded markers
- **Detailed organization popups** with contact info and AI focus areas
- **Responsive design** for desktop and mobile
- **Geocoding support** for accurate location placement

## 🛠️ Tech Stack

- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Google Maps JavaScript API** for mapping
- **Notion API** for data source
- **Vercel** ready for deployment

## 📋 Prerequisites

1. **Google Maps API key** with Maps JavaScript API enabled
2. **Notion integration token** with read access to the database
3. **Node.js 18+** and npm

## ⚙️ Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   
   Edit `.env.local` with your API keys:
   ```env
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   NOTION_TOKEN=your_notion_integration_token
   NOTION_DATABASE_ID=1f0c6f79-9a33-81bd-8332-ca0235c24655
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Open http://localhost:3000** to view the map

## 🗄️ Data Source

The application connects to the BC AI Ecosystem Notion database containing:
- **355+ organizations** across BC
- **Comprehensive profiles** with AI focus areas, contact info, and categories
- **Geographic distribution** across 4 major BC regions
- **Real-time updates** via Notion API

## 🎨 Organization Categories

Markers are color-coded by category:
- 🔴 **Start-ups & Scale-ups** (Red)
- 🔵 **Enterprise / Corporate Divisions** (Blue)  
- 🟢 **Academic & Research Labs** (Green)
- 🟣 **Government & Crown Programs** (Purple)
- 🟠 **Indigenous Tech & Creative Orgs** (Orange)
- 🟡 **Investors & Funds** (Yellow)

## 📱 API Endpoints

- `GET /api/organizations` - Fetch all organizations with metadata

## 🚀 Deployment

The application is optimized for Vercel deployment:

```bash
npm run build
npm run start
```

## 📈 Performance Features

- **Server-side rendering** for fast initial load
- **Optimized geocoding** with regional fallbacks
- **Marker clustering** for better performance
- **Responsive images** and icons
- **SEO optimization** with meta tags

## 🤝 Contributing

This map is part of the larger BC AI Ecosystem Atlas project. See the main project documentation for contribution guidelines.

## 📞 Support

- **Data issues**: Report via the main project repository
- **Technical issues**: Check the console for API key or connectivity issues
- **Feature requests**: Submit via GitHub issues

---

*Connecting BC's AI ecosystem one marker at a time* 🇨🇦
