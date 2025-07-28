import { Organization } from '@/types/organization';

// BC region center coordinates for fallback
const BC_REGION_CENTERS = {
  'Lower Mainland': { lat: 49.2827, lng: -123.1207 }, // Vancouver
  'Vancouver Island': { lat: 48.4284, lng: -123.3656 }, // Victoria
  'Interior': { lat: 50.6762, lng: -120.3413 }, // Kamloops
  'Northern BC': { lat: 53.9171, lng: -122.7497 }, // Prince George
  'Other Regions': { lat: 54.0, lng: -125.0 }, // Central BC
};

export async function geocodeOrganization(org: Organization): Promise<{ lat: number; lng: number } | null> {
  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    console.warn('Google Maps API key not found');
    return getRegionFallback(org);
  }

  try {
    // Build search query
    const searchQuery = buildSearchQuery(org);
    
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchQuery)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    );

    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng,
      };
    } else {
      console.warn(`Geocoding failed for ${org.name}: ${data.status}`);
      return getRegionFallback(org);
    }
  } catch (error) {
    console.error(`Error geocoding ${org.name}:`, error);
    return getRegionFallback(org);
  }
}

function buildSearchQuery(org: Organization): string {
  const parts = [];
  
  if (org.name) parts.push(org.name);
  if (org.city) parts.push(org.city);
  if (org.bcRegion && org.bcRegion !== 'Other Regions') {
    parts.push(org.bcRegion);
  }
  parts.push('British Columbia, Canada');
  
  return parts.join(', ');
}

function getRegionFallback(org: Organization): { lat: number; lng: number } {
  if (org.bcRegion && org.bcRegion in BC_REGION_CENTERS) {
    // Add small random offset to avoid exact overlaps
    const center = BC_REGION_CENTERS[org.bcRegion];
    return {
      lat: center.lat + (Math.random() - 0.5) * 0.1,
      lng: center.lng + (Math.random() - 0.5) * 0.1,
    };
  }
  
  // Default to Vancouver with random offset
  return {
    lat: 49.2827 + (Math.random() - 0.5) * 0.1,
    lng: -123.1207 + (Math.random() - 0.5) * 0.1,
  };
}