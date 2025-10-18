'use client';

import React, { useState } from 'react';
import { Download, FileText, BarChart3, Loader2 } from 'lucide-react';
import { exportService, type ExportData, type ExportOptions } from '@/services/exportService';
import { notificationService } from '@/services/notificationService';

const ExportDemo: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);

  const handleTestExport = async (format: 'pdf' | 'excel' | 'csv') => {
    if (isExporting) return;

    setIsExporting(true);

    try {
      const exportData: ExportData = {
        reportType: 'trash-distribution',
        title: 'AGOS Trash Distribution Report',
        subtitle: 'Sample report generated for testing',
        timeline: 'month',
        selectedAreas: ['pasig', 'marikina'],
        comparisonMode: 'areas',
        data: []
      };

      const exportOptions: ExportOptions = {
        format: format
      };

      notificationService.info(
        'Test Export Started',
        `Generating ${format.toUpperCase()} test report...`,
        2000
      );

      await exportService.exportReport(exportData, exportOptions);

      notificationService.success(
        'Test Export Complete',
        `${format.toUpperCase()} test report has been downloaded.`,
        3000
      );

    } catch (error) {
      console.error('Test export failed:', error);
      notificationService.error(
        'Test Export Failed',
        error instanceof Error ? error.message : 'An error occurred during export.',
        5000
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Functionality Test</h3>
      <p className="text-sm text-gray-600 mb-6">
        Test the export functionality with sample data. Each format will generate a test report with mock data.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => handleTestExport('pdf')}
          disabled={isExporting}
          className="flex items-center justify-center px-4 py-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
        >
          {isExporting ? (
            <Loader2 className="h-5 w-5 text-red-600 animate-spin mr-2" />
          ) : (
            <FileText className="h-5 w-5 text-red-600 mr-2" />
          )}
          <span className="font-medium text-red-800">Export PDF</span>
        </button>

        <button
          onClick={() => handleTestExport('excel')}
          disabled={isExporting}
          className="flex items-center justify-center px-4 py-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
        >
          {isExporting ? (
            <Loader2 className="h-5 w-5 text-green-600 animate-spin mr-2" />
          ) : (
            <BarChart3 className="h-5 w-5 text-green-600 mr-2" />
          )}
          <span className="font-medium text-green-800">Export Excel</span>
        </button>

        <button
          onClick={() => handleTestExport('csv')}
          disabled={isExporting}
          className="flex items-center justify-center px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
        >
          {isExporting ? (
            <Loader2 className="h-5 w-5 text-blue-600 animate-spin mr-2" />
          ) : (
            <Download className="h-5 w-5 text-blue-600 mr-2" />
          )}
          <span className="font-medium text-blue-800">Export CSV</span>
        </button>
      </div>
    </div>
  );
};

export default ExportDemo;
