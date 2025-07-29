export interface Organization {
  id: string;
  name: string;
  website?: string;
  linkedin?: string;
  email?: string;
  phone?: string;
  primaryContact?: string;
  keyPeople?: string;
  city?: string;
  bcRegion?: 'Lower Mainland' | 'Vancouver Island' | 'Interior' | 'Northern BC' | 'Other Regions';
  category?: string;
  size?: string;
  yearFounded?: number;
  aiFocusAreas?: string[];
  shortBlurb?: string;
  focusNotes?: string;
  logo?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}