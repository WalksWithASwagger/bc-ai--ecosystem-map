# Geocoding & Map Readiness – Task Brief (2025-07-30)

**Assignee** Builder (with Cartographer support)

## Objective
Populate accurate latitude / longitude coordinates for every organization so the upcoming map view can render pins instantly.

## Steps
1. **Add DB Properties**  
   – `Latitude` (Number)  
   – `Longitude` (Number)

2. **Export Org List**  
   Query Notion for rows where either `Latitude` **or** `Longitude` is empty.  
   Export `Name`, `City/Region`, `BC Region` to CSV.

3. **Geocode**  
   • Use Google Maps Geocoding API (or Open-Cage).  
   • Query pattern: `"<City/Region>, British Columbia, Canada"`.  
   • **Fallback**: If API fails, use the predefined centre-point for the BC Region:  
     | BC Region | Lat | Long |
     |-----------|-----|------|
     | Lower Mainland | 49.246 | -123.116 |
     | Vancouver Island | 48.428 | -123.365 |
     | Interior | 50.116 | -120.801 |
     | Northern BC | 54.004 | -125.002 |
     | Other Regions | 53.726 | -127.647 |

4. **Write Back**  
   Update `Latitude` & `Longitude` properties in Notion for each org.

5. **Validation**  
   • Spot-check 10 random points in Google Maps.  
   • Ensure no zeros and coords remain inside BC: 48° ≤ lat ≤ 60°, long ≥ −140° & ≤ −115°.

## Deliverables
- Updated coordinates in the Notion database.  
- `/tasks/2025-07-30_geocoding_log.md` listing orgs that used fallback coords.  
- `map/org_points.geojson` containing all org points for Builder’s map layer.

## Estimated Time
One 4-hour focused work cycle. 