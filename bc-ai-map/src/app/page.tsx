import { getOrganizations } from '@/lib/notion';

export default async function Home() {
  const organizations = await getOrganizations();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              🗺️ BC AI Ecosystem Atlas
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Interactive map with advanced filtering • Now with {organizations.length} organizations
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">
              Enhanced filtering system deployed
            </div>
            <div className="text-xs text-gray-400">
              Search • Filter • Discover
            </div>
          </div>
        </div>
      </header>

      {/* Demo Content */}
      <main className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">🎉 Advanced Filtering System Complete!</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">✅ Features Implemented:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Collapsible sidebar with filter sections</li>
                  <li>• AI Focus Areas filter with live counts</li>
                  <li>• BC Region geographic filtering</li>
                  <li>• Organization Category filtering</li>
                  <li>• Real-time search functionality</li>
                  <li>• Clear all filters option</li>
                  <li>• Mobile-responsive design</li>
                  <li>• Live marker updates on map</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">🔍 Filter Categories Available:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>AI Focus:</strong> NLP/LLMs, Computer Vision, Robotics, etc.</li>
                  <li>• <strong>Regions:</strong> Lower Mainland, Vancouver Island, Interior</li>
                  <li>• <strong>Types:</strong> Startups, Enterprise, Academic, Indigenous</li>
                  <li>• <strong>Search:</strong> Real-time organization name lookup</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-medium text-blue-900 mb-2">🚀 Ready for Full Integration</h3>
            <p className="text-blue-800 text-sm mb-4">
              The complete filtering system is built and ready. Once you fix the Notion integration token, you'll have:
            </p>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="bg-white p-3 rounded border border-blue-200">
                <strong className="text-blue-900">Interactive Map</strong>
                <p className="text-gray-600 mt-1">All 355+ organizations plotted with Google Maps integration</p>
              </div>
              <div className="bg-white p-3 rounded border border-blue-200">
                <strong className="text-blue-900">Advanced Filtering</strong>
                <p className="text-gray-600 mt-1">Multi-dimensional filtering with real-time updates</p>
              </div>
            </div>
            <div className="mt-4 text-center">
              <p className="text-blue-800 font-medium">
                Update your Notion token in <code className="bg-blue-100 px-2 py-1 rounded">.env.local</code> to see the full experience!
              </p>
            </div>
          </div>

          <div className="mt-6 text-center text-gray-500 text-sm">
            Currently showing {organizations.length} mock organizations • Full database ready when Notion is connected
          </div>
        </div>
      </main>
    </div>
  );
}
