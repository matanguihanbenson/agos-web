import ExportTest from '../../components/ExportTest';

export default function ExportDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AGOS Export Demo
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Test the enhanced export functionality with beautiful charts, attractive layouts, 
            and comprehensive data visualization across PDF, Excel, and CSV formats.
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <ExportTest />
            
            <div className="mt-8 p-6 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Enhanced Features:</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-blue-800 mb-2">PDF Export</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Professional branded cover page</li>
                    <li>• Interactive charts and visualizations</li>
                    <li>• Clean data tables with styling</li>
                    <li>• Key metrics and summaries</li>
                    <li>• Multi-page layout with navigation</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-blue-800 mb-2">Excel & CSV</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Multiple worksheets (Data, Metadata, Summary)</li>
                    <li>• Styled headers and formatting</li>
                    <li>• Auto-sized columns for readability</li>
                    <li>• Complete data export with metadata</li>
                    <li>• Summary calculations by report type</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-6 p-6 bg-green-50 rounded-lg">
              <h3 className="text-lg font-semibold text-green-900 mb-4">Chart Types by Report:</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p><span className="font-medium">Trash Distribution:</span> Doughnut chart showing trash types</p>
                  <p><span className="font-medium">Volume Trends:</span> Line chart showing trends over time</p>
                </div>
                <div>
                  <p><span className="font-medium">Water Quality:</span> Bar chart showing pH levels by area</p>
                  <p><span className="font-medium">Bot Performance:</span> Radar chart comparing bot metrics</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
