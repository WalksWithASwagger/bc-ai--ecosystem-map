'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Organization } from '../types';

// Fix for default markers in Leaflet with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface InteractiveMapProps {
  organizations: Organization[];
  selectedOrganization?: Organization | null;
  onOrganizationClick?: (org: Organization) => void;
}

// Custom icon for different categories
const createCustomIcon = (category: string) => {
  const color = getCategoryColor(category);
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
};

const getCategoryColor = (category: string): string => {
  const colors: { [key: string]: string } = {
    'Start-ups & Scale-ups': '#3B82F6', // Blue
    'Academic & Research Labs': '#10B981', // Green
    'Enterprise / Corporate Divisions': '#8B5CF6', // Purple
    'Service Studios / Agencies': '#F59E0B', // Amber
    'Government & Public Sector': '#EF4444', // Red
    'Investors & Funds': '#06B6D4', // Cyan
    'Non-Profit': '#84CC16', // Lime
    'Grassroots Communities': '#EC4899', // Pink
    'Indigenous Tech & Creative Orgs': '#F97316', // Orange
    'Industry Association': '#6366F1', // Indigo
  };
  return colors[category] || '#6B7280'; // Default gray
};

// Map bounds for BC
const BC_BOUNDS: [number, number][] = [
  [48.0, -139.0], // Southwest
  [60.0, -114.0], // Northeast
];

const BC_CENTER: [number, number] = [54.0, -126.5];

function MapContent({ organizations, selectedOrganization, onOrganizationClick }: InteractiveMapProps) {
  const map = useMap();
  
  // Filter organizations with valid coordinates
  const mappableOrgs = organizations.filter(org => 
    org.latitude !== null && 
    org.longitude !== null &&
    org.latitude >= BC_BOUNDS[0][0] && 
    org.latitude <= BC_BOUNDS[1][0] &&
    org.longitude >= BC_BOUNDS[0][1] && 
    org.longitude <= BC_BOUNDS[1][1]
  );

  // Focus on selected organization
  useEffect(() => {
    if (selectedOrganization && selectedOrganization.latitude && selectedOrganization.longitude) {
      map.setView([selectedOrganization.latitude, selectedOrganization.longitude], 12);
    }
  }, [selectedOrganization, map]);

  return (
    <>
      {mappableOrgs.map((org) => (
        <Marker
          key={org.id}
          position={[org.latitude!, org.longitude!]}
          icon={createCustomIcon(org.category)}
          eventHandlers={{
            click: () => onOrganizationClick?.(org),
          }}
        >
          <Popup>
            <div className="w-64">
              <h3 className="font-semibold text-lg mb-2">{org.name}</h3>
              
              {org.category && (
                <span 
                  className="inline-block px-2 py-1 text-xs text-white rounded mb-2"
                  style={{ backgroundColor: getCategoryColor(org.category) }}
                >
                  {org.category}
                </span>
              )}
              
              {org.shortBlurb && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-3">{org.shortBlurb}</p>
              )}
              
              <div className="space-y-1 text-sm">
                {org.city && (
                  <div className="text-gray-500">📍 {org.city}, {org.bcRegion}</div>
                )}
                
                {org.aiFocusAreas && org.aiFocusAreas.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {org.aiFocusAreas.slice(0, 3).map((area, index) => (
                      <span
                        key={index}
                        className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
                      >
                        {area}
                      </span>
                    ))}
                    {org.aiFocusAreas.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{org.aiFocusAreas.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              <div className="mt-3 flex gap-2">
                {org.website && (
                  <a
                    href={org.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Website →
                  </a>
                )}
                {org.linkedin && (
                  <a
                    href={org.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    LinkedIn →
                  </a>
                )}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}

export default function InteractiveMap({ organizations, selectedOrganization, onOrganizationClick }: InteractiveMapProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-gray-500">Loading map...</div>
      </div>
    );
  }

  const mappableOrgs = organizations.filter(org => 
    org.latitude !== null && org.longitude !== null
  );

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden border border-gray-200 relative">
      <MapContainer
        center={BC_CENTER}
        zoom={6}
        style={{ height: '100%', width: '100%' }}
        maxBounds={BC_BOUNDS}
        maxBoundsViscosity={1.0}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapContent 
          organizations={organizations}
          selectedOrganization={selectedOrganization}
          onOrganizationClick={onOrganizationClick}
        />
      </MapContainer>
      
      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg max-w-xs z-[1000]">
        <h4 className="font-semibold text-sm mb-2">Map Legend</h4>
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full border border-gray-300"
              style={{ backgroundColor: getCategoryColor('Start-ups & Scale-ups') }}
            ></div>
            <span>Start-ups & Scale-ups</span>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full border border-gray-300"
              style={{ backgroundColor: getCategoryColor('Academic & Research Labs') }}
            ></div>
            <span>Academic & Research</span>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full border border-gray-300"
              style={{ backgroundColor: getCategoryColor('Enterprise / Corporate Divisions') }}
            ></div>
            <span>Enterprise</span>
          </div>
          <div className="text-gray-500 pt-1">
            {mappableOrgs.length} of {organizations.length} organizations mapped
          </div>
        </div>
      </div>
    </div>
  );
} 