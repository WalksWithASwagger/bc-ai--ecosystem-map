'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Organization, OrganizationMarker } from '@/types/organization';
import { geocodeOrganization } from '@/lib/geocoding';

interface MapContainerProps {
  organizations: Organization[];
}

export default function MapContainer({ organizations }: MapContainerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize Google Maps
  useEffect(() => {
    const initMap = async () => {
      if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
        console.error('Google Maps API key not found');
        setIsLoading(false);
        return;
      }

      try {
        const loader = new Loader({
          apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
          version: 'weekly',
          libraries: ['marker'],
        });

        await loader.load();

        if (mapRef.current) {
          const mapInstance = new google.maps.Map(mapRef.current, {
            center: { lat: 49.2827, lng: -123.1207 }, // Vancouver center
            zoom: 8,
            styles: [
              {
                featureType: 'poi.business',
                stylers: [{ visibility: 'off' }],
              },
              {
                featureType: 'poi.medical',
                stylers: [{ visibility: 'off' }],
              },
            ],
          });

          setMap(mapInstance);
        }
      } catch (error) {
        console.error('Error loading Google Maps:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initMap();
  }, []);

  // Add markers when map and organizations are ready
  useEffect(() => {
    if (!map || organizations.length === 0) return;

    const addMarkers = async () => {
      // Clear existing markers
      markers.forEach(marker => marker.setMap(null));
      setMarkers([]);

      const newMarkers: google.maps.Marker[] = [];
      const bounds = new google.maps.LatLngBounds();

      for (const org of organizations) {
        try {
          const coordinates = await geocodeOrganization(org);
          
          if (coordinates) {
            const marker = new google.maps.Marker({
              position: coordinates,
              map: map,
              title: org.name,
              icon: {
                url: getCategoryIcon(org.category),
                scaledSize: new google.maps.Size(32, 32),
              },
            });

            // Add info window
            const infoWindow = new google.maps.InfoWindow({
              content: createInfoWindowContent(org),
            });

            marker.addListener('click', () => {
              infoWindow.open(map, marker);
            });

            newMarkers.push(marker);
            bounds.extend(coordinates);
          }
        } catch (error) {
          console.error(`Error adding marker for ${org.name}:`, error);
        }
      }

      setMarkers(newMarkers);
      
      // Fit map to show all markers
      if (newMarkers.length > 0) {
        map.fitBounds(bounds);
        
        // Don't zoom in too much if there's only one marker
        google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
          if (map.getZoom()! > 15) {
            map.setZoom(15);
          }
        });
      }
    };

    addMarkers();
  }, [map, organizations]);

  function getCategoryIcon(category?: string): string {
    const iconBase = 'https://maps.google.com/mapfiles/ms/icons/';
    
    switch (category) {
      case 'Start-ups & Scale-ups':
        return iconBase + 'red-dot.png';
      case 'Enterprise / Corporate Divisions':
        return iconBase + 'blue-dot.png';
      case 'Academic & Research Labs':
        return iconBase + 'green-dot.png';
      case 'Government & Crown Programs':
        return iconBase + 'purple-dot.png';
      case 'Indigenous Tech & Creative Orgs':
        return iconBase + 'orange-dot.png';
      case 'Investors & Funds':
        return iconBase + 'yellow-dot.png';
      default:
        return iconBase + 'red-dot.png';
    }
  }

  function createInfoWindowContent(org: Organization): string {
    return `
      <div class="p-2 max-w-xs">
        <h3 class="font-bold text-lg mb-2">${org.name}</h3>
        ${org.shortBlurb ? `<p class="text-sm text-gray-600 mb-2">${org.shortBlurb}</p>` : ''}
        ${org.city ? `<p class="text-sm"><strong>Location:</strong> ${org.city}</p>` : ''}
        ${org.category ? `<p class="text-sm"><strong>Category:</strong> ${org.category}</p>` : ''}
        ${org.aiFocusAreas && org.aiFocusAreas.length > 0 ? 
          `<p class="text-sm"><strong>AI Focus:</strong> ${org.aiFocusAreas.join(', ')}</p>` : ''}
        ${org.website ? 
          `<a href="${org.website}" target="_blank" class="text-blue-600 hover:underline text-sm">Visit Website</a>` : ''}
      </div>
    `;
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading BC AI Ecosystem Map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      <div ref={mapRef} className="h-full w-full" />
      
      {/* Organization count badge */}
      <div className="absolute top-4 left-4 bg-white shadow-lg rounded-lg px-3 py-2">
        <p className="text-sm font-medium text-gray-800">
          {organizations.length} Organizations Mapped
        </p>
      </div>
    </div>
  );
}