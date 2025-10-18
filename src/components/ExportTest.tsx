'use client';

import React from 'react';
import { exportService, ExportData } from '../services/exportService';

export default function ExportTest() {
  const handleTestExport = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      // notificationService.showLoading('Generating export...');
      console.log('Generating export...');

      const exportData: ExportData = {
        reportType: 'trash-distribution',
        title: 'Trash Distribution Report',
        subtitle: 'Test Export',
        timeline: '2024-Q4',
        selectedAreas: ['pasig', 'marikina'],
        comparisonMode: 'area',
        data: []
      };

      await exportService.exportReport(exportData, { format });
      
      // notificationService.showSuccess(`Export completed! ${format.toUpperCase()} file downloaded successfully.`);
      console.log(`Export completed! ${format.toUpperCase()} file downloaded successfully.`);
      alert(`Export completed! ${format.toUpperCase()} file downloaded successfully.`);
    } catch (error) {
      console.error('Export test failed:', error);
      // notificationService.showError(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold mb-4">Export Functionality Test</h2>
      <div className="space-x-4">
        <button
          onClick={() => handleTestExport('pdf')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Test PDF Export
        </button>
        <button
          onClick={() => handleTestExport('excel')}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Test Excel Export
        </button>
        <button
          onClick={() => handleTestExport('csv')}
          className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
        >
          Test CSV Export
        </button>
      </div>
      <p className="text-sm text-gray-600">
        Click any button to test the export functionality. The file should download automatically.
      </p>
    </div>
  );
}
