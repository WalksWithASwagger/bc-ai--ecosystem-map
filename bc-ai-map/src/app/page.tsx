import { getOrganizations } from '@/lib/notion';
import MapContainer from '@/components/MapContainer';

export default async function Home() {
  const organizations = await getOrganizations();

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              🗺️ BC AI Ecosystem Atlas
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Interactive map of British Columbia's AI landscape
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">
              {organizations.length} organizations mapped
            </div>
            <div className="text-xs text-gray-400">
              ~80% ecosystem coverage
            </div>
          </div>
        </div>
      </header>

      {/* Map */}
      <main className="flex-1 overflow-hidden">
        <MapContainer organizations={organizations} />
      </main>
    </div>
  );
}
