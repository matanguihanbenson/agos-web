import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { 
  Chart, 
  ChartConfiguration, 
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
  DoughnutController,
  PieController,
  LineController,
  BarController,
  RadarController,
  ScatterController
} from 'chart.js';

// Register all Chart.js components
Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
  DoughnutController,
  PieController,
  LineController,
  BarController,
  RadarController,
  ScatterController
);

export interface ExportData {
  reportType: string;
  title: string;
  subtitle?: string;
  timeline: string;
  selectedAreas: string[];
  comparisonMode: string;
  data: any[];
  metadata?: Record<string, any>;
  charts?: HTMLElement[];
}

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  filename?: string;
  includeCharts?: boolean;
  customHeaders?: string[];
}

export interface ExportPDFOptions {
  filename?: string;
  includeCharts?: boolean;
  customHeaders?: string[];
}

export interface ExportExcelOptions {
  filename?: string;
  customHeaders?: string[];
}

export interface ExportCSVOptions {
  filename?: string;
  customHeaders?: string[];
}

class ExportService {
  constructor() {
    // No need for server-side chart renderer in browser environment
  }

  private generateFilename(reportType: string, format: string): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const sanitizedType = reportType.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    return `agos-${sanitizedType}-${timestamp}.${format}`;
  }

  private generateReportData(exportData: ExportData) {
    const { reportType, timeline, selectedAreas, comparisonMode } = exportData;
    
    // Generate mock data based on report type and parameters
    switch (reportType) {
      case 'trash-distribution':
        return this.generateTrashDistributionData(selectedAreas, timeline);
      case 'volume-trends':
        return this.generateVolumeTrendsData(selectedAreas, timeline);
      case 'hotspot-mapping':
        return this.generateHotspotData(selectedAreas, timeline);
      case 'water-quality':
        return this.generateWaterQualityData(selectedAreas, timeline);
      case 'bot-performance':
        return this.generateBotPerformanceData(timeline);
      default:
        return [];
    }
  }

  private generateTrashDistributionData(areas: string[], timeline: string): any[] {
    const trashTypes = ['Plastic Bottles', 'Food Containers', 'Plastic Bags', 'Metal Cans', 'Other'];
    const data: any[] = [];
    
    // Generate data for each area
    areas.forEach(area => {
      trashTypes.forEach(type => {
        data.push({
          'Area': this.getAreaDisplayName(area),
          'Trash Type': type,
          'Count': Math.floor(Math.random() * 500) + 50,
          'Weight (kg)': (Math.random() * 25 + 5).toFixed(2),
          'Timeline': timeline,
          'Density Level': ['Low', 'Medium', 'High', 'Very High'][Math.floor(Math.random() * 4)],
          'Collection Date': new Date().toLocaleDateString(),
          'Bot ID': `AGOS-00${Math.floor(Math.random() * 3) + 1}`
        });
      });
    });
    
    return data;
  }

  private generateVolumeTrendsData(areas: string[], timeline: string): any[] {
    const data: any[] = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    
    areas.forEach(area => {
      months.forEach((month, index) => {
        data.push({
          'Area': this.getAreaDisplayName(area),
          'Period': `${month} 2024`,
          'Total Weight (kg)': (Math.random() * 200 + 100).toFixed(2),
          'Total Items': Math.floor(Math.random() * 1000) + 500,
          'Collection Efficiency (%)': (Math.random() * 20 + 80).toFixed(1),
          'Bot Hours': (Math.random() * 50 + 20).toFixed(1),
          'Average Daily Collection': (Math.random() * 10 + 5).toFixed(2)
        });
      });
    });
    
    return data;
  }

  private generateHotspotData(areas: string[], timeline: string): any[] {
    const data: any[] = [];
    
    areas.forEach(area => {
      for (let i = 1; i <= 3; i++) {
        data.push({
          'Area': this.getAreaDisplayName(area),
          'Hotspot Zone': `Zone ${i}`,
          'Latitude': (13.4000 + Math.random() * 0.1).toFixed(6),
          'Longitude': (121.1700 + Math.random() * 0.1).toFixed(6),
          'Density Level': ['Medium', 'High', 'Very High'][Math.floor(Math.random() * 3)],
          'Item Count': Math.floor(Math.random() * 1500) + 500,
          'Priority': ['Low', 'Medium', 'High', 'Critical'][Math.floor(Math.random() * 4)],
          'Last Updated': new Date().toLocaleDateString(),
          'Trend': ['Increasing', 'Decreasing', 'Stable'][Math.floor(Math.random() * 3)]
        });
      }
    });
    
    return data;
  }

  private generateWaterQualityData(areas: string[], timeline: string): any[] {
    const data: any[] = [];
    
    areas.forEach(area => {
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        data.push({
          'Area': this.getAreaDisplayName(area),
          'Date': date.toLocaleDateString(),
          'pH Level': (Math.random() * 2 + 6.5).toFixed(2),
          'Dissolved Oxygen (mg/L)': (Math.random() * 3 + 6).toFixed(2),
          'Turbidity (NTU)': (Math.random() * 15 + 5).toFixed(2),
          'Temperature (°C)': (Math.random() * 5 + 24).toFixed(1),
          'Quality Index': Math.floor(Math.random() * 4) + 6,
          'Status': ['Good', 'Fair', 'Poor'][Math.floor(Math.random() * 3)],
          'Bot ID': `AGOS-00${Math.floor(Math.random() * 3) + 1}`
        });
      }
    });
    
    return data;
  }

  private generateBotPerformanceData(timeline: string): any[] {
    const data: any[] = [];
    const botIds = ['AGOS-001', 'AGOS-002', 'AGOS-003'];
    
    botIds.forEach(botId => {
      data.push({
        'Bot ID': botId,
        'Status': ['Active', 'Maintenance', 'Charging'][Math.floor(Math.random() * 3)],
        'Battery Level (%)': Math.floor(Math.random() * 50) + 50,
        'Total Collection (kg)': (Math.random() * 100 + 50).toFixed(2),
        'Operating Hours': (Math.random() * 100 + 50).toFixed(1),
        'Efficiency (%)': (Math.random() * 20 + 80).toFixed(1),
        'Location': ['Calapan River', 'Bucayao River', 'Naujan Lake'][Math.floor(Math.random() * 3)],
        'Last Maintenance': new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        'Total Distance (km)': (Math.random() * 50 + 20).toFixed(2),
        'Signal Strength': ['Strong', 'Good', 'Weak'][Math.floor(Math.random() * 3)]
      });
    });
    
    return data;
  }

  private getAreaDisplayName(area: string): string {
    const areaNames: Record<string, string> = {
      'pasig': 'Pasig River',
      'marikina': 'Marikina River',
      'taguig': 'Taguig Area',
      'calapan': 'Calapan River',
      'bucayao': 'Bucayao River',
      'panggalaan': 'Panggalaan River',
      'baruyan': 'Baruyan River'
    };
    return areaNames[area] || area;
  }

  private getTimeframeCovered(timeline: string): string {
    switch (timeline) {
      case 'today': return 'Today';
      case 'week': return 'Last 7 days';
      case 'month': return 'Last 30 days';
      case 'year': return 'Last 365 days';
      case 'current': return 'Current period';
      default: return timeline || 'All time';
    }
  }

  private getReportTypeDisplay(reportType: string): string {
    const typeNames: Record<string, string> = {
      'trash-distribution': 'Trash Distribution Analysis',
      'volume-trends': 'Volume Trends Report',
      'hotspot-mapping': 'Hotspot Mapping Analysis',
      'water-quality': 'Water Quality Assessment',
      'bot-performance': 'Bot Performance Report',
      'classification-analysis': 'Classification Analysis',
      'pollution-trends': 'Pollution Trends',
      'collection-efficiency': 'Collection Efficiency'
    };
    return typeNames[reportType] || reportType;
  }

  private generateKeyMetrics(data: any[], reportType: string): any[] {
    if (data.length === 0) return [];
    
    switch (reportType) {
      case 'trash-distribution': {
        const totalItems = data.reduce((sum, item) => sum + (parseInt(item.Count) || 0), 0);
        const totalWeight = data.reduce((sum, item) => sum + (parseFloat(item['Weight (kg)']) || 0), 0);
        const avgWeight = totalWeight / data.length;
        const mostCommon = this.getMostCommonTrashType(data);
        
        // Calculate realistic trends based on data patterns
        const plasticItems = data.filter(item => item['Trash Type']?.toLowerCase().includes('plastic')).length;
        const plasticPercentage = (plasticItems / data.length) * 100;
        
        return [
          { 
            label: 'Total Items Collected', 
            value: `${totalItems.toLocaleString()} items`, 
            trend: `+12% vs last month` 
          },
          { 
            label: 'Total Weight Collected', 
            value: `${totalWeight.toFixed(1)} kg`, 
            trend: `+8.5% vs last month` 
          },
          { 
            label: 'Average Item Weight', 
            value: `${avgWeight.toFixed(2)} kg`, 
            trend: plasticPercentage > 60 ? `-3% (more light items)` : `+2% (heavier items)` 
          },
          { 
            label: 'Dominant Waste Type', 
            value: mostCommon, 
            trend: `${plasticPercentage.toFixed(0)}% of total` 
          }
        ];
      }
      case 'water-quality': {
        const avgPH = data.reduce((sum, item) => sum + parseFloat(item['pH Level'] || 0), 0) / data.length;
        const avgDO = data.reduce((sum, item) => sum + parseFloat(item['Dissolved Oxygen (mg/L)'] || 0), 0) / data.length;
        const goodQuality = data.filter(item => item.Status === 'Good').length;
        const qualityPercent = (goodQuality / data.length) * 100;
        
        return [
          { 
            label: 'Average pH Level', 
            value: avgPH.toFixed(2), 
            trend: avgPH > 7.5 ? `+0.1 (alkaline trend)` : avgPH < 6.5 ? `-0.1 (acidic trend)` : `stable (optimal)` 
          },
          { 
            label: 'Dissolved Oxygen', 
            value: `${avgDO.toFixed(1)} mg/L`, 
            trend: avgDO > 8 ? `+0.5 mg/L (improving)` : `needs attention` 
          },
          { 
            label: 'Water Quality Rating', 
            value: `${qualityPercent.toFixed(0)}% Good`, 
            trend: qualityPercent > 80 ? `+5% improvement` : `monitoring needed` 
          },
          { 
            label: 'Monitoring Points', 
            value: `${data.length} readings`, 
            trend: `${Math.ceil(data.length / 7)} per day avg` 
          }
        ];
      }
      case 'volume-trends': {
        const totalVolume = data.reduce((sum, item) => sum + (parseFloat(item.Volume) || 0), 0);
        const avgDaily = totalVolume / 30; // Assuming monthly data
        const peakDay = Math.max(...data.map(item => parseFloat(item.Volume) || 0));
        
        return [
          { 
            label: 'Total Volume Collected', 
            value: `${totalVolume.toFixed(1)} m³`, 
            trend: `+15% vs last period` 
          },
          { 
            label: 'Daily Average', 
            value: `${avgDaily.toFixed(1)} m³/day`, 
            trend: `+10% efficiency gain` 
          },
          { 
            label: 'Peak Collection Day', 
            value: `${peakDay.toFixed(1)} m³`, 
            trend: `highest this month` 
          },
          { 
            label: 'Collection Consistency', 
            value: `${(avgDaily / peakDay * 100).toFixed(0)}%`, 
            trend: `stable operations` 
          }
        ];
      }
      default: {
        const dataQuality = Math.min(98, 85 + Math.random() * 13);
        const coverage = Math.min(100, 90 + Math.random() * 10);
        
        return [
          { 
            label: 'Total Data Records', 
            value: `${data.length.toLocaleString()} entries`, 
            trend: `+${Math.floor(Math.random() * 20 + 5)}% growth` 
          },
          { 
            label: 'Data Quality Score', 
            value: `${dataQuality.toFixed(1)}%`, 
            trend: dataQuality > 95 ? `+2% improvement` : `monitoring quality` 
          },
          { 
            label: 'Area Coverage', 
            value: `${coverage.toFixed(0)}%`, 
            trend: coverage === 100 ? `complete coverage` : `expanding reach` 
          },
          { 
            label: 'System Status', 
            value: 'Operational', 
            trend: `24/7 active monitoring` 
          }
        ];
      }
    }
  }

  private getMostCommonTrashType(data: any[]): string {
    const typeCounts: Record<string, number> = {};
    data.forEach(item => {
      const type = item['Trash Type'];
      typeCounts[type] = (typeCounts[type] || 0) + (parseInt(item.Count) || 0);
    });
    
    const mostCommon = Object.entries(typeCounts)
      .sort(([,a], [,b]) => b - a)[0];
    return mostCommon ? mostCommon[0] : 'N/A';
  }

  private generateInsights(data: any[], reportType: string): string[] {
    if (data.length === 0) return ['No data available for analysis.'];
    
    switch (reportType) {
      case 'trash-distribution': {
        const totalItems = data.reduce((sum, item) => sum + (parseInt(item.Count) || 0), 0);
        const totalWeight = data.reduce((sum, item) => sum + (parseFloat(item['Weight (kg)']) || 0), 0);
        const mostCommon = this.getMostCommonTrashType(data);
        const areas = [...new Set(data.map(item => item.Area))];
        
        // Calculate plastic percentage
        const plasticItems = data.filter(item => 
          item['Trash Type']?.toLowerCase().includes('plastic')
        ).reduce((sum, item) => sum + (parseInt(item.Count) || 0), 0);
        const plasticPercentage = (plasticItems / totalItems * 100).toFixed(1);
        
        // Find highest collection area
        const areaStats = areas.map(area => ({
          area,
          total: data.filter(item => item.Area === area)
            .reduce((sum, item) => sum + (parseFloat(item['Weight (kg)']) || 0), 0)
        }));
        const topArea = areaStats.sort((a, b) => b.total - a.total)[0];
        
        return [
          `Plastic waste dominates collections at ${plasticPercentage}% of total items, with ${mostCommon} being the most frequent type collected. This indicates a need for enhanced plastic reduction campaigns and better recycling infrastructure.`,
          `${topArea.area} area shows highest pollution levels with ${topArea.total.toFixed(1)} kg collected, suggesting this location requires immediate attention for preventive measures and increased monitoring frequency.`,
          `Average item weight of ${(totalWeight/totalItems).toFixed(3)} kg indicates predominantly small debris items, requiring fine-mesh collection systems and regular maintenance schedules for optimal efficiency.`,
          `Collection volume of ${totalWeight.toFixed(1)} kg across ${areas.length} areas demonstrates system effectiveness, but ${plasticPercentage}% plastic content suggests upstream waste management improvements are critical.`,
          `Data pattern analysis reveals consistent waste input, recommending deployment of additional collection units during peak periods and enhanced public awareness campaigns in high-pollution zones.`
        ];
      }
      case 'water-quality': {
        const avgPH = data.reduce((sum, item) => sum + parseFloat(item['pH Level'] || 0), 0) / data.length;
        const avgDO = data.reduce((sum, item) => sum + parseFloat(item['Dissolved Oxygen (mg/L)'] || 0), 0) / data.length;
        const goodReadings = data.filter(item => item.Status === 'Good').length;
        const qualityPercent = (goodReadings / data.length) * 100;
        const areas = [...new Set(data.map(item => item.Area))];
        
        return [
          `Water quality assessment shows ${qualityPercent.toFixed(0)}% of readings meet environmental standards, with average pH of ${avgPH.toFixed(2)} indicating ${avgPH > 7.5 ? 'slightly alkaline' : avgPH < 6.5 ? 'acidic' : 'neutral'} conditions across monitored areas.`,
          `Dissolved oxygen levels average ${avgDO.toFixed(1)} mg/L, ${avgDO > 8 ? 'exceeding healthy aquatic life thresholds and indicating good ecosystem health' : avgDO > 5 ? 'meeting minimum requirements for aquatic life' : 'falling below recommended levels, requiring immediate intervention'}.`,
          `Quality monitoring across ${areas.length} locations reveals ${qualityPercent > 80 ? 'consistently good water conditions with localized improvement opportunities' : 'concerning variations requiring targeted remediation efforts'}.`,
          `Trend analysis suggests ${qualityPercent > 85 ? 'stable ecosystem recovery with continued monitoring recommended' : 'need for enhanced pollution control measures and increased collection frequency in affected areas'}.`,
          `Data indicates correlation between trash collection activities and water quality improvements, supporting continued autonomous cleaning operations and expansion to additional monitoring points.`
        ];
      }
      case 'volume-trends': {
        const totalVolume = data.reduce((sum, item) => sum + (parseFloat(item.Volume) || 0), 0);
        const avgDaily = totalVolume / 30;
        const maxVolume = Math.max(...data.map(item => parseFloat(item.Volume) || 0));
        const minVolume = Math.min(...data.map(item => parseFloat(item.Volume) || 0));
        const variability = ((maxVolume - minVolume) / avgDaily * 100).toFixed(0);
        
        return [
          `Collection volume analysis shows ${totalVolume.toFixed(1)} m³ total debris removal with daily average of ${avgDaily.toFixed(1)} m³, representing a significant environmental impact through consistent cleanup operations.`,
          `Peak collection day recorded ${maxVolume.toFixed(1)} m³, indicating ${variability}% operational variability that suggests weather-dependent or seasonal pollution patterns requiring adaptive scheduling.`,
          `Volume consistency metrics demonstrate ${avgDaily > 5 ? 'high-efficiency operations' : 'moderate collection rates'} with opportunities for optimization through predictive deployment based on historical patterns.`,
          `Comparative analysis reveals collection efficiency improvements of approximately 15% over previous periods, validating autonomous system effectiveness and recommending expansion to additional waterways.`,
          `Data trends support increasing autonomous fleet capacity during high-volume periods and implementing predictive maintenance schedules to maintain consistent collection performance.`
        ];
      }
      default: {
        const dataQuality = (Math.random() * 10 + 90).toFixed(1);
        const coverage = (Math.random() * 10 + 90).toFixed(0);
        
        return [
          `System performance analysis across ${data.length} data points shows ${dataQuality}% data integrity with comprehensive ${coverage}% area coverage, demonstrating reliable autonomous monitoring capabilities.`,
          `Operational metrics indicate consistent 24/7 system functionality with minimal downtime, supporting continuous environmental monitoring and real-time pollution response capabilities.`,
          `Data quality assessment reveals high-precision sensor accuracy and reliable communication systems, enabling confident decision-making for environmental management strategies.`,
          `Performance benchmarks exceed industry standards for autonomous environmental monitoring, validating technology effectiveness and supporting expansion recommendations.`,
          `Trend analysis supports continued system optimization through machine learning integration and enhanced predictive maintenance protocols for maximum operational efficiency.`
        ];
      }
    }
  }

  private getChartTitles(reportType: string): string[] {
    switch (reportType) {
      case 'trash-distribution':
        return [
          'Trash Distribution by Type',
          'Collection Volume by Area',
          'Daily Collection Trends'
        ];
      case 'volume-trends':
        return [
          'Weekly Volume Trends',
          'Monthly Comparison',
          'Area Performance Analysis'
        ];
      case 'hotspot-mapping':
        return [
          'Pollution Hotspot Locations',
          'Hotspot Intensity Analysis',
          'Geographic Distribution'
        ];
      case 'water-quality':
        return [
          'Water Quality Metrics',
          'pH Level Distribution',
          'Dissolved Oxygen Trends',
          'Temperature Variations'
        ];
      case 'bot-performance':
        return [
          'Bot Collection Efficiency',
          'Operational Hours Analysis',
          'Performance Comparison'
        ];
      default:
        return [
          'Data Analysis Chart',
          'Performance Metrics',
          'Trend Analysis'
        ];
    }
  }

  private async generateCharts(data: any[], reportType: string): Promise<string[]> {
    const charts: string[] = [];
    
    try {
      switch (reportType) {
        case 'trash-distribution':
          const trashCharts = await this.generateTrashDistributionCharts(data);
          charts.push(...trashCharts);
          break;
          
        case 'volume-trends':
          const volumeCharts = await this.generateVolumeTrendsCharts(data);
          charts.push(...volumeCharts);
          break;
          
        case 'hotspot-mapping':
          const hotspotCharts = await this.generateHotspotMappingCharts(data);
          charts.push(...hotspotCharts);
          break;
          
        case 'water-quality':
          const waterCharts = await this.generateWaterQualityCharts(data);
          charts.push(...waterCharts);
          break;
          
        case 'bot-performance':
          const botCharts = await this.generateBotPerformanceCharts(data);
          charts.push(...botCharts);
          break;
      }
    } catch (error) {
      console.warn('Chart generation failed:', error);
    }
    
    return charts;
  }

  private async createChart(config: ChartConfiguration, title: string): Promise<string | null> {
    return new Promise((resolve) => {
      try {
        console.log('Creating chart:', title);
        const canvas = document.createElement('canvas');
        canvas.width = 800; // Optimized width for better fit
        canvas.height = 300; // Reduced height to prevent stretching
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          console.warn('Failed to get canvas context');
          resolve(null);
          return;
        }
        
        // Set white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Disable animations for PDF generation
        const chartConfig = {
          ...config,
          options: {
            ...config.options,
            responsive: false,
            animation: false,
            maintainAspectRatio: false,
            plugins: {
              ...config.options?.plugins,
              title: {
                display: true,
                text: title,
                font: { size: 18, weight: 'bold' },
                color: '#374151',
                padding: 20
              }
            }
          }
        };
        
        console.log('Chart config:', chartConfig);
        const chart = new Chart(ctx, chartConfig as any);
        
        // Wait for chart to render, then capture
        requestAnimationFrame(() => {
          try {
            const dataUrl = canvas.toDataURL('image/png', 1.0);
            console.log('Chart generated successfully:', title, 'Data URL length:', dataUrl.length);
            chart.destroy();
            resolve(dataUrl);
          } catch (error) {
            console.error('Chart rendering failed:', title, error);
            chart.destroy();
            resolve(null);
          }
        });
        
      } catch (error) {
        console.error('Chart creation failed:', title, error);
        resolve(null);
      }
    });
  }

  private async generateTrashDistributionCharts(data: any[]): Promise<string[]> {
    const charts: string[] = [];
    
    // 1. Doughnut chart for trash type distribution
    const trashTypeCounts = data.reduce((acc, item) => {
      const type = item['Trash Type'];
      acc[type] = (acc[type] || 0) + parseInt(item.Count || 0);
      return acc;
    }, {} as Record<string, number>);

    const doughnutChart = await this.createChart({
      type: 'doughnut',
      data: {
        labels: Object.keys(trashTypeCounts),
        datasets: [{
          data: Object.values(trashTypeCounts),
          backgroundColor: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'],
          borderWidth: 3,
          borderColor: '#fff'
        }]
      },
      options: {
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#374151', font: { size: 12 } }
          },
          tooltip: {
            callbacks: {
              label: function(context: any) {
                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                const percentage = ((context.parsed / total) * 100).toFixed(1);
                return `${context.label}: ${context.parsed} (${percentage}%)`;
              }
            }
          }
        }
      }
    }, 'Trash Distribution by Type');
    
    if (doughnutChart) charts.push(doughnutChart);

    // 2. Bar chart for trash by area
    const areaData = data.reduce((acc, item) => {
      const area = item.Area;
      const count = parseInt(item.Count || 0);
      acc[area] = (acc[area] || 0) + count;
      return acc;
    }, {} as Record<string, number>);

    const barChart = await this.createChart({
      type: 'bar',
      data: {
        labels: Object.keys(areaData),
        datasets: [{
          label: 'Total Items',
          data: Object.values(areaData),
          backgroundColor: '#3B82F6',
          borderColor: '#2563EB',
          borderWidth: 2
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Number of Items', color: '#6B7280' }
          },
          x: {
            title: { display: true, text: 'Area', color: '#6B7280' }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(context: any) {
                return `${context.label}: ${context.parsed.y.toLocaleString()} items`;
              }
            }
          }
        }
      }
    }, 'Trash Collection by Area');
    
    if (barChart) charts.push(barChart);

    // 3. Scatter plot for weight vs count correlation
    const scatterData = data.map(item => ({
      x: parseFloat(item['Weight (kg)'] || 0),
      y: parseInt(item.Count || 0)
    }));

    const scatterChart = await this.createChart({
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Weight vs Count',
          data: scatterData,
          backgroundColor: '#10B981',
          borderColor: '#059669',
          pointRadius: 6
        }]
      },
      options: {
        scales: {
          x: {
            title: { display: true, text: 'Weight (kg)', color: '#6B7280' }
          },
          y: {
            title: { display: true, text: 'Item Count', color: '#6B7280' }
          }
        }
      }
    }, 'Weight vs Count Correlation');
    
    if (scatterChart) charts.push(scatterChart);

    return charts;
  }

  private async generateVolumeTrendsCharts(data: any[]): Promise<string[]> {
    const charts: string[] = [];
    
    // 1. Line chart for volume trends over time
    const areaData = data.reduce((acc, item) => {
      const area = item.Area;
      if (!acc[area]) acc[area] = [];
      acc[area].push({
        period: item.Period,
        weight: parseFloat(item['Total Weight (kg)'] || 0),
        efficiency: parseFloat(item['Collection Efficiency (%)'] || 0)
      });
      return acc;
    }, {} as Record<string, any[]>);

    const areas = Object.keys(areaData);
    const periods = [...new Set(data.map(item => item.Period))].sort();
    
    const lineChart = await this.createChart({
      type: 'line',
      data: {
        labels: periods,
        datasets: areas.map((area, index) => ({
          label: area,
          data: periods.map(period => {
            const item = areaData[area].find((d: any) => d.period === period);
            return item ? item.weight : 0;
          }),
          borderColor: ['#3B82F6', '#EF4444', '#10B981'][index % 3],
          backgroundColor: ['#3B82F680', '#EF444480', '#10B98180'][index % 3],
          tension: 0.4,
          fill: false,
          pointRadius: 5
        }))
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Weight (kg)', color: '#6B7280' }
          },
          x: {
            title: { display: true, text: 'Time Period', color: '#6B7280' }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: { color: '#374151', font: { size: 12 } }
          },
          tooltip: {
            callbacks: {
              label: function(context: any) {
                return `${context.dataset.label}: ${context.parsed.y.toFixed(1)} kg`;
              }
            }
          }
        }
      }
    }, 'Volume Trends Over Time');
    
    if (lineChart) charts.push(lineChart);

    // 2. Bar chart for efficiency comparison
    const efficiencyChart = await this.createChart({
      type: 'bar',
      data: {
        labels: areas,
        datasets: [{
          label: 'Average Efficiency (%)',
          data: areas.map(area => {
            const areaItems = data.filter(item => item.Area === area);
            const avgEff = areaItems.reduce((sum, item) => sum + parseFloat(item['Collection Efficiency (%)'] || 0), 0) / areaItems.length;
            return avgEff;
          }),
          backgroundColor: '#F59E0B',
          borderColor: '#D97706',
          borderWidth: 2
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: { display: true, text: 'Efficiency (%)', color: '#6B7280' }
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    }, 'Collection Efficiency by Area');
    
    if (efficiencyChart) charts.push(efficiencyChart);

    return charts;
  }

  private async generateWaterQualityCharts(data: any[]): Promise<string[]> {
    const charts: string[] = [];
    
    // 1. Multi-parameter bar chart
    const areas = [...new Set(data.map(item => item.Area))];
    
    const multiBarChart = await this.createChart({
      type: 'bar',
      data: {
        labels: areas,
        datasets: [
          {
            label: 'pH Level',
            data: areas.map(area => {
              const areaItems = data.filter(item => item.Area === area);
              return areaItems.reduce((sum, item) => sum + parseFloat(item['pH Level'] || 0), 0) / areaItems.length;
            }),
            backgroundColor: '#3B82F6',
            yAxisID: 'y'
          },
          {
            label: 'Dissolved Oxygen (mg/L)',
            data: areas.map(area => {
              const areaItems = data.filter(item => item.Area === area);
              return areaItems.reduce((sum, item) => sum + parseFloat(item['Dissolved Oxygen (mg/L)'] || 0), 0) / areaItems.length;
            }),
            backgroundColor: '#10B981',
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: { display: true, text: 'pH Level', color: '#6B7280' },
            min: 6,
            max: 9
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: { display: true, text: 'Dissolved Oxygen (mg/L)', color: '#6B7280' },
            grid: { drawOnChartArea: false }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: { color: '#374151', font: { size: 12 } }
          }
        }
      }
    }, 'Water Quality Parameters by Area');
    
    if (multiBarChart) charts.push(multiBarChart);

    // 2. Scatter plot for pH vs Dissolved Oxygen correlation
    const correlationData = data.map(item => ({
      x: parseFloat(item['pH Level'] || 0),
      y: parseFloat(item['Dissolved Oxygen (mg/L)'] || 0),
      area: item.Area
    }));

    const scatterChart = await this.createChart({
      type: 'scatter',
      data: {
        datasets: areas.map((area, index) => ({
          label: area,
          data: correlationData.filter(point => point.area === area),
          backgroundColor: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B'][index % 4],
          borderColor: ['#2563EB', '#DC2626', '#059669', '#D97706'][index % 4],
          pointRadius: 6
        }))
      },
      options: {
        scales: {
          x: {
            title: { display: true, text: 'pH Level', color: '#6B7280' },
            min: 6,
            max: 9
          },
          y: {
            title: { display: true, text: 'Dissolved Oxygen (mg/L)', color: '#6B7280' }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: { color: '#374151', font: { size: 12 } }
          }
        }
      }
    }, 'pH vs Dissolved Oxygen Correlation');
    
    if (scatterChart) charts.push(scatterChart);

    // 3. Line chart for temperature trends
    const tempData = data.reduce((acc, item) => {
      const date = item.Date;
      if (!acc[date]) acc[date] = [];
      acc[date].push({
        area: item.Area,
        temp: parseFloat(item['Temperature (°C)'] || 0)
      });
      return acc;
    }, {} as Record<string, any[]>);

    const dates = Object.keys(tempData).sort();
    
    const tempChart = await this.createChart({
      type: 'line',
      data: {
        labels: dates,
        datasets: areas.map((area, index) => ({
          label: area,
          data: dates.map(date => {
            const dayData = tempData[date] || [];
            const areaData = dayData.filter((d: any) => d.area === area);
            if (areaData.length === 0) return null;
            return areaData.reduce((sum: number, d: any) => sum + d.temp, 0) / areaData.length;
          }),
          borderColor: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B'][index % 4],
          backgroundColor: ['#3B82F680', '#EF444480', '#10B98180', '#F59E0B80'][index % 4],
          tension: 0.4,
          fill: false,
          pointRadius: 4
        }))
      },
      options: {
        scales: {
          y: {
            title: { display: true, text: 'Temperature (°C)', color: '#6B7280' }
          },
          x: {
            title: { display: true, text: 'Date', color: '#6B7280' }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: { color: '#374151', font: { size: 12 } }
          }
        }
      }
    }, 'Temperature Trends Over Time');
    
    if (tempChart) charts.push(tempChart);

    return charts;
  }

  private async generateHotspotMappingCharts(data: any[]): Promise<string[]> {
    const charts: string[] = [];
    
    // 1. Bar chart for hotspot density levels
    const densityData = data.reduce((acc, item) => {
      const density = item['Density Level'];
      acc[density] = (acc[density] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const densityChart = await this.createChart({
      type: 'bar',
      data: {
        labels: Object.keys(densityData),
        datasets: [{
          label: 'Number of Zones',
          data: Object.values(densityData),
          backgroundColor: ['#10B981', '#F59E0B', '#EF4444', '#DC2626'],
          borderColor: ['#059669', '#D97706', '#DC2626', '#B91C1C'],
          borderWidth: 2
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Number of Zones', color: '#6B7280' }
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    }, 'Hotspot Density Distribution');
    
    if (densityChart) charts.push(densityChart);

    // 2. Scatter plot for geographic distribution
    const geoData = data.map(item => ({
      x: parseFloat(item.Longitude || 0),
      y: parseFloat(item.Latitude || 0),
      area: item.Area,
      count: parseInt(item['Item Count'] || 0)
    }));

    const geoChart = await this.createChart({
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Hotspot Locations',
          data: geoData,
          backgroundColor: '#EF4444',
          borderColor: '#DC2626',
          pointRadius: (context: any) => {
            const count = (context.raw as any)?.count || 0;
            return Math.max(4, Math.min(12, count / 100));
          }
        }]
      },
      options: {
        scales: {
          x: {
            title: { display: true, text: 'Longitude', color: '#6B7280' }
          },
          y: {
            title: { display: true, text: 'Latitude', color: '#6B7280' }
          }
        }
      }
    }, 'Geographic Distribution of Hotspots');
    
    if (geoChart) charts.push(geoChart);

    // 3. Priority analysis pie chart
    const priorityData = data.reduce((acc, item) => {
      const priority = item.Priority;
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const priorityChart = await this.createChart({
      type: 'pie',
      data: {
        labels: Object.keys(priorityData),
        datasets: [{
          data: Object.values(priorityData),
          backgroundColor: ['#10B981', '#F59E0B', '#EF4444', '#DC2626'],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        plugins: {
          legend: {
            position: 'right',
            labels: { color: '#374151', font: { size: 12 } }
          },
          tooltip: {
            callbacks: {
              label: function(context: any) {
                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                const percentage = ((context.parsed / total) * 100).toFixed(1);
                return `${context.label}: ${context.parsed} (${percentage}%)`;
              }
            }
          }
        }
      }
    }, 'Priority Level Distribution');
    
    if (priorityChart) charts.push(priorityChart);

    return charts;
  }

  private async generateBotPerformanceCharts(data: any[]): Promise<string[]> {
    const charts: string[] = [];
    
    // 1. Radar chart for bot performance comparison
    const radarChart = await this.createChart({
      type: 'radar',
      data: {
        labels: ['Efficiency (%)', 'Battery Level (%)', 'Collection (kg)', 'Operating Hours', 'Distance (km)'],
        datasets: data.map((bot, index) => ({
          label: bot['Bot ID'],
          data: [
            parseFloat(bot['Efficiency (%)'] || 0),
            parseInt(bot['Battery Level (%)'] || 0),
            parseFloat(bot['Total Collection (kg)'] || 0),
            parseFloat(bot['Operating Hours'] || 0),
            parseFloat(bot['Total Distance (km)'] || 0)
          ],
          borderColor: ['#3B82F6', '#EF4444', '#10B981'][index % 3],
          backgroundColor: ['#3B82F620', '#EF444420', '#10B98120'][index % 3],
          pointBackgroundColor: ['#3B82F6', '#EF4444', '#10B981'][index % 3],
          pointRadius: 6
        }))
      },
      options: {
        scales: {
          r: {
            beginAtZero: true,
            max: 100
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: { color: '#374151', font: { size: 12 } }
          }
        }
      }
    }, 'Bot Performance Comparison');
    
    if (radarChart) charts.push(radarChart);

    // 2. Bar chart for collection efficiency
    const efficiencyChart = await this.createChart({
      type: 'bar',
      data: {
        labels: data.map(bot => bot['Bot ID']),
        datasets: [{
          label: 'Efficiency (%)',
          data: data.map(bot => parseFloat(bot['Efficiency (%)'] || 0)),
          backgroundColor: '#3B82F6',
          borderColor: '#2563EB',
          borderWidth: 2
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: { display: true, text: 'Efficiency (%)', color: '#6B7280' }
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    }, 'Bot Efficiency Comparison');
    
    if (efficiencyChart) charts.push(efficiencyChart);

    // 3. Scatter plot for efficiency vs operating hours
    const performanceData = data.map(bot => ({
      x: parseFloat(bot['Operating Hours'] || 0),
      y: parseFloat(bot['Efficiency (%)'] || 0),
      label: bot['Bot ID']
    }));

    const performanceChart = await this.createChart({
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Performance Analysis',
          data: performanceData,
          backgroundColor: '#10B981',
          borderColor: '#059669',
          pointRadius: 8
        }]
      },
      options: {
        scales: {
          x: {
            title: { display: true, text: 'Operating Hours', color: '#6B7280' }
          },
          y: {
            title: { display: true, text: 'Efficiency (%)', color: '#6B7280' },
            max: 100
          }
        }
      }
    }, 'Efficiency vs Operating Hours');
    
    if (performanceChart) charts.push(performanceChart);

    return charts;
  }

  async exportToPDF(exportData: ExportData, options: ExportPDFOptions = {}): Promise<void> {
    const data = this.generateReportData(exportData);
    const filename = options.filename || this.generateFilename(exportData.reportType, 'pdf');
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    
    // Load and add logo
    const logoImg = new Image();
    logoImg.src = '/img/logo.png';
    
    await new Promise((resolve) => {
      logoImg.onload = resolve;
      logoImg.onerror = resolve; // Continue even if logo fails to load
    });
    
    // Cover Page with Enhanced Design
    // Background gradient effect with rectangles
    doc.setFillColor(59, 130, 246); // Blue
    doc.rect(0, 0, pageWidth, 100, 'F');
    doc.setFillColor(79, 150, 255); // Lighter blue
    doc.rect(0, 100, pageWidth, 30, 'F');
    
    // Add logo if loaded successfully
    try {
      if (logoImg.complete && logoImg.naturalHeight !== 0) {
        // Create canvas to convert logo to base64 (with transparent background)
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = logoImg.width;
          canvas.height = logoImg.height;
          // Don't fill with white - keep transparent
          ctx.drawImage(logoImg, 0, 0);
          const logoDataUrl = canvas.toDataURL('image/png');
          
          // Add logo to PDF (centered, maintaining aspect ratio)
          const maxLogoWidth = 40;
          const maxLogoHeight = 40;
          
          // Calculate aspect ratio to prevent stretching
          const logoAspectRatio = logoImg.width / logoImg.height;
          let logoWidth, logoHeight;
          
          if (logoAspectRatio > 1) {
            // Logo is wider than tall
            logoWidth = Math.min(maxLogoWidth, logoImg.width * 0.1);
            logoHeight = logoWidth / logoAspectRatio;
          } else {
            // Logo is taller than wide or square
            logoHeight = Math.min(maxLogoHeight, logoImg.height * 0.1);
            logoWidth = logoHeight * logoAspectRatio;
          }
          
          const logoX = (pageWidth - logoWidth) / 2;
          doc.addImage(logoDataUrl, 'PNG', logoX, 25, logoWidth, logoHeight);
        }
      }
    } catch (error) {
      console.warn('Failed to add logo to PDF:', error);
    }
    
    // AGOS Title
    doc.setFontSize(28);
    doc.setTextColor(255, 255, 255);
    doc.text('AGOS', pageWidth / 2, 70, { align: 'center' });
    
    doc.setFontSize(11);
    doc.text('Autonomous Garbage-cleaning and Operation System', pageWidth / 2, 80, { align: 'center' });
    
    // Report Title with enhanced styling
    doc.setFontSize(22);
    doc.setTextColor(40, 44, 52);
    doc.text(exportData.title, pageWidth / 2, 150, { align: 'center' });
    
    if (exportData.subtitle) {
      doc.setFontSize(14);
      doc.setTextColor(100, 100, 100);
      doc.text(exportData.subtitle, pageWidth / 2, 165, { align: 'center' });
    }
    
    // Enhanced Report Metadata Section
    const metadataY = 185;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(229, 231, 235);
    doc.roundedRect(margin, metadataY, pageWidth - 2 * margin, 80, 5, 5, 'FD');
    
    // Header information
    doc.setFontSize(12);
    doc.setTextColor(40, 44, 52);
    doc.text('Report Information', margin + 10, metadataY + 15);
    
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    const currentDate = new Date();
    
    // Left column
    doc.text('Generated by:', margin + 10, metadataY + 28);
    doc.setTextColor(40, 44, 52);
    doc.text('AGOS System', margin + 10, metadataY + 35);
    
    doc.setTextColor(100, 100, 100);
    doc.text('Date & Time:', margin + 10, metadataY + 45);
    doc.setTextColor(40, 44, 52);
    doc.text(currentDate.toLocaleString(), margin + 10, metadataY + 52);
    
    doc.setTextColor(100, 100, 100);
    doc.text('Timeline:', margin + 10, metadataY + 62);
    doc.setTextColor(40, 44, 52);
    doc.text(this.getTimeframeCovered(exportData.timeline), margin + 10, metadataY + 69);
    
    // Right column
    const rightColX = pageWidth / 2 + 10;
    doc.setTextColor(100, 100, 100);
    doc.text('Report Type:', rightColX, metadataY + 28);
    doc.setTextColor(40, 44, 52);
    doc.text(this.getReportTypeDisplay(exportData.reportType), rightColX, metadataY + 35);
    
    if (exportData.selectedAreas.length > 0) {
      doc.setTextColor(100, 100, 100);
      doc.text('Scope/Areas:', rightColX, metadataY + 45);
      doc.setTextColor(40, 44, 52);
      const areasText = exportData.selectedAreas.map(this.getAreaDisplayName).join(', ');
      doc.text(areasText, rightColX, metadataY + 52);
    }
    
    doc.setTextColor(100, 100, 100);
    doc.text('Records:', rightColX, metadataY + 62);
    doc.setTextColor(40, 44, 52);
    doc.text(`${data.length} entries`, rightColX, metadataY + 69);

    // Key Metrics Dashboard - moved to second page
    if (data.length > 0) {
      doc.addPage();
      
      doc.setFontSize(18);
      doc.setTextColor(40, 44, 52);
      doc.text('Key Metrics Dashboard', margin, 30);
      
      const metrics = this.generateKeyMetrics(data, exportData.reportType);
      
      // Arrange in 2x2 grid for better fit
      const cardWidth = (pageWidth - 2 * margin - 15) / 2; // 2 columns
      const cardHeight = 50;
      const metricsStartY = 50;
      
      metrics.slice(0, 4).forEach((metric, index) => {
        const col = index % 2;
        const row = Math.floor(index / 2);
        const cardX = margin + (col * (cardWidth + 15));
        const cardY = metricsStartY + (row * (cardHeight + 15));
        
        // Enhanced metric card background with gradient effect
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(59, 130, 246);
        doc.setLineWidth(0.5);
        doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 5, 5, 'FD');
        
        // Metric icon/indicator (colored rectangle)
        doc.setFillColor(59, 130, 246);
        doc.rect(cardX + 5, cardY + 5, 3, cardHeight - 10, 'F');
        
        // Metric value with enhanced styling
        doc.setFontSize(20);
        doc.setTextColor(40, 44, 52);
        doc.text(metric.value, cardX + 15, cardY + 20);
        
        // Metric label
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(metric.label, cardX + 15, cardY + 32);
        
        // Enhanced trend indicator with context
        if (metric.trend) {
          doc.setFontSize(9);
          if (metric.trend.includes('+') || metric.trend.includes('increase')) {
            doc.setTextColor(34, 197, 94); // Green for positive trend
          } else if (metric.trend.includes('-') || metric.trend.includes('decrease')) {
            doc.setTextColor(239, 68, 68); // Red for negative trend
          } else {
            doc.setTextColor(100, 100, 100); // Gray for neutral
          }
          doc.text(metric.trend, cardX + 15, cardY + 42);
        }
      });
    }
    
    // Generate and add charts if data exists
    if (data.length > 0 && (options.includeCharts !== false)) {
      try {
        const charts = await this.generateCharts(data, exportData.reportType);
        
        if (charts.length > 0) {
          // Data Visualizations Page
          doc.addPage();
          
          // Page header
          doc.setFontSize(18);
          doc.setTextColor(40, 44, 52);
          doc.text('Data Visualizations', margin, 30);
          
          // Chart titles for different report types
          const chartTitles = this.getChartTitles(exportData.reportType);
          
          // Dashboard-style layout: 2 charts per page for better space utilization
          const chartWidth = pageWidth - 2 * margin;
          const chartHeight = 100; // Optimized height for better proportions
          const chartsPerPage = 2;
          let currentY = 50;
          let chartsOnCurrentPage = 0;
          
          charts.forEach((chartDataUrl, index) => {
            // Check if we need a new page
            if (chartsOnCurrentPage >= chartsPerPage) {
              doc.addPage();
              doc.setFontSize(18);
              doc.setTextColor(40, 44, 52);
              doc.text('Data Visualizations (continued)', margin, 30);
              currentY = 50;
              chartsOnCurrentPage = 0;
            }
            
            // Chart title with improved styling
            if (chartTitles[index]) {
              doc.setFontSize(14);
              doc.setTextColor(40, 44, 52);
              doc.text(chartTitles[index], margin, currentY);
              currentY += 18;
            }
            
            // Enhanced chart container with shadow effect
            doc.setFillColor(248, 250, 252); // Light background
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.5);
            doc.roundedRect(margin, currentY, chartWidth, chartHeight, 3, 3, 'FD');
            
            // Add chart image with optimized padding
            const padding = 8;
            doc.addImage(chartDataUrl, 'PNG', margin + padding, currentY + padding, 
                        chartWidth - 2 * padding, chartHeight - 2 * padding);
            
            currentY += chartHeight + 25; // Optimized spacing between charts
            chartsOnCurrentPage++;
          });
        }
      } catch (error) {
        console.warn('Failed to add charts to PDF:', error);
      }
    }
    
    // Insights & Interpretation Page
    if (data.length > 0) {
      doc.addPage();
      
      doc.setFontSize(18);
      doc.setTextColor(40, 44, 52);
      doc.text('Insights & Analysis', margin, 30);
      
      const insights = this.generateInsights(data, exportData.reportType);
      let insightY = 50;
      
      insights.forEach((insight: string, index: number) => {
        // Insight bullet point
        doc.setFontSize(10);
        doc.setTextColor(59, 130, 246);
        doc.text(`• `, margin, insightY);
        
        // Insight content
        doc.setTextColor(60, 60, 60);
        const lines = doc.splitTextToSize(insight, pageWidth - 2 * margin - 10);
        doc.text(lines, margin + 8, insightY);
        insightY += lines.length * 5 + 8;
        
        if (insightY > pageHeight - 40) {
          doc.addPage();
          insightY = 30;
        }
      });
    }
    
    // Data Summary Table Page
    if (data.length > 0) {
      doc.addPage();
      
      doc.setFontSize(18);
      doc.setTextColor(40, 44, 52);
      doc.text('Data Summary', margin, 30);
      let currentY = 50;
      
      const summaryData = this.generateSummaryData(data, exportData.reportType);
      
      if (summaryData.length > 0) {
        const headers = Object.keys(summaryData[0]);
        const maxCols = Math.min(headers.length, 5);
        const selectedHeaders = headers.slice(0, maxCols);
        const colWidth = (pageWidth - 2 * margin) / maxCols;
        
        // Table header
        doc.setFillColor(59, 130, 246);
        doc.setTextColor(255, 255, 255);
        doc.rect(margin, currentY, pageWidth - 2 * margin, 10, 'F');
        
        doc.setFontSize(8);
        selectedHeaders.forEach((header, index) => {
          const text = header.length > 18 ? header.substring(0, 18) + '...' : header;
          doc.text(text, margin + (index * colWidth) + 2, currentY + 7);
        });
        
        currentY += 10;
        
        // Table rows
        doc.setTextColor(40, 44, 52);
        summaryData.slice(0, 20).forEach((row, rowIndex) => {
          if (rowIndex % 2 === 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(margin, currentY, pageWidth - 2 * margin, 8, 'F');
          }
          
          selectedHeaders.forEach((header, colIndex) => {
            const value = String(row[header] || '');
            const text = value.length > 25 ? value.substring(0, 25) + '...' : value;
            doc.text(text, margin + (colIndex * colWidth) + 2, currentY + 6);
          });
          
          currentY += 8;
          
          if (currentY > pageHeight - 30) {
            doc.addPage();
            currentY = 30;
          }
        });
      }
    }
    
    // Data Sample/Appendix Page
    if (data.length > 0) {
      doc.addPage();
      
      doc.setFontSize(18);
      doc.setTextColor(40, 44, 52);
      doc.text('Data Sample (First 10 Records)', margin, 30);
      let currentY = 50;
      
      const sampleData = data.slice(0, 10);
      const headers = Object.keys(data[0]);
      const maxCols = Math.min(headers.length, 4);
      const selectedHeaders = headers.slice(0, maxCols);
      const colWidth = (pageWidth - 2 * margin) / maxCols;
      
      // Table header
      doc.setFillColor(59, 130, 246);
      doc.setTextColor(255, 255, 255);
      doc.rect(margin, currentY, pageWidth - 2 * margin, 8, 'F');
      
      doc.setFontSize(8);
      selectedHeaders.forEach((header, index) => {
        const text = header.length > 15 ? header.substring(0, 15) + '...' : header;
        doc.text(text, margin + (index * colWidth) + 2, currentY + 6);
      });
      
      currentY += 8;
      
      // Sample data rows
      doc.setTextColor(40, 44, 52);
      sampleData.forEach((row, rowIndex) => {
        if (rowIndex % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(margin, currentY, pageWidth - 2 * margin, 6, 'F');
        }
        
        selectedHeaders.forEach((header, colIndex) => {
          const value = String(row[header] || '');
          const text = value.length > 20 ? value.substring(0, 20) + '...' : value;
          doc.text(text, margin + (colIndex * colWidth) + 2, currentY + 4);
        });
        
        currentY += 6;
      });
    }
    
    // Enhanced Footer on all pages
    const totalPages = doc.internal.pages.length - 1; // Subtract 1 for the first empty page
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      const footerText = `Generated by AGOS System | ${new Date().toLocaleDateString()} | Page ${i} of ${totalPages}`;
      doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }
    
    doc.save(filename);
  }

  async exportToExcel(exportData: ExportData, options: ExportExcelOptions = {}): Promise<void> {
    const data = this.generateReportData(exportData);
    const filename = options.filename || this.generateFilename(exportData.reportType, 'xlsx');
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Create main data sheet
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Add metadata sheet
    const metadata = {
      'Report Title': exportData.title,
      'Report Type': exportData.reportType,
      'Timeline': exportData.timeline,
      'Areas': exportData.selectedAreas.join(', '),
      'Comparison Mode': exportData.comparisonMode,
      'Generated': new Date().toLocaleString(),
      'Total Records': data.length
    };
    
    const metadataWs = XLSX.utils.json_to_sheet([metadata]);
    
    // Add summary sheet
    const summary = this.generateSummaryData(data, exportData.reportType);
    const summaryWs = XLSX.utils.json_to_sheet(summary);
    
    // Add sheets to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    XLSX.utils.book_append_sheet(wb, metadataWs, 'Metadata');
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
    
    // Style the headers
    if (data.length > 0) {
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!ws[cellAddress]) continue;
        ws[cellAddress].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "3B82F6" } }
        };
      }
      
      // Auto-width columns
      const colWidths = Object.keys(data[0]).map(key => ({
        wch: Math.max(key.length, ...data.map(row => String(row[key] || '').length)) + 2
      }));
      ws['!cols'] = colWidths;
    }
    
    XLSX.writeFile(wb, filename);
  }

  private generateSummaryData(data: any[], reportType: string): any[] {
    if (data.length === 0) return [];
    
    switch (reportType) {
      case 'trash-distribution': {
        const summary = data.reduce((acc, item) => {
          const area = item.Area;
          const type = item['Trash Type'];
          const count = parseInt(item.Count) || 0;
          const weight = parseFloat(item['Weight (kg)']) || 0;
          
          if (!acc[area]) acc[area] = {};
          if (!acc[area][type]) acc[area][type] = { count: 0, weight: 0 };
          
          acc[area][type].count += count;
          acc[area][type].weight += weight;
          
          return acc;
        }, {} as any);
        
        // Calculate totals for percentage calculations
        const totalItems = data.reduce((sum, item) => sum + (parseInt(item.Count) || 0), 0);
        const totalWeight = data.reduce((sum, item) => sum + (parseFloat(item['Weight (kg)']) || 0), 0);
        
        return Object.entries(summary).flatMap(([area, types]: [string, any]) =>
          Object.entries(types).map(([type, stats]: [string, any]) => ({
            'Area': area,
            'Trash Type': type,
            'Total Count': stats.count.toLocaleString(),
            'Count %': `${((stats.count / totalItems) * 100).toFixed(1)}%`,
            'Total Weight (kg)': stats.weight.toFixed(2),
            'Weight %': `${((stats.weight / totalWeight) * 100).toFixed(1)}%`,
            'Avg Item Weight': `${(stats.weight / stats.count).toFixed(3)} kg`
          }))
        );
      }
      
      case 'water-quality': {
        const areaStats = data.reduce((acc, item) => {
          const area = item.Area;
          if (!acc[area]) {
            acc[area] = {
              count: 0,
              totalPH: 0,
              totalDO: 0,
              totalTurbidity: 0,
              totalTemp: 0,
              goodReadings: 0
            };
          }
          
          acc[area].count++;
          acc[area].totalPH += parseFloat(item['pH Level']) || 0;
          acc[area].totalDO += parseFloat(item['Dissolved Oxygen (mg/L)']) || 0;
          acc[area].totalTurbidity += parseFloat(item['Turbidity (NTU)']) || 0;
          acc[area].totalTemp += parseFloat(item['Temperature (°C)']) || 0;
          if (item.Status === 'Good') acc[area].goodReadings++;
          
          return acc;
        }, {} as any);
        
        const totalReadings = data.length;
        
        return Object.entries(areaStats).map(([area, stats]: [string, any]) => ({
          'Area': area,
          'Total Readings': stats.count.toLocaleString(),
          'Reading %': `${((stats.count / totalReadings) * 100).toFixed(1)}%`,
          'Avg pH': (stats.totalPH / stats.count).toFixed(2),
          'Avg DO (mg/L)': (stats.totalDO / stats.count).toFixed(2),
          'Avg Turbidity': (stats.totalTurbidity / stats.count).toFixed(1),
          'Avg Temp (°C)': (stats.totalTemp / stats.count).toFixed(1),
          'Quality Score': `${((stats.goodReadings / stats.count) * 100).toFixed(1)}%`
        }));
      }
      
      default: {
        return [{
          'Total Records': data.length.toLocaleString(),
          'Record %': '100%',
          'Report Type': reportType,
          'Generated': new Date().toLocaleString(),
          'Data Quality': '98.5%'
        }];
      }
    }
  }

  async exportToCSV(exportData: ExportData, options: ExportCSVOptions = {}): Promise<void> {
    const data = this.generateReportData(exportData);
    const filename = options.filename || this.generateFilename(exportData.reportType, 'csv');
    
    if (data.length === 0) {
      const csvContent = 'No data available for the selected criteria\n';
      this.downloadFile(csvContent, filename, 'text/csv');
      return;
    }
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      `# AGOS Report - ${exportData.title}`,
      `# Generated: ${new Date().toLocaleString()}`,
      `# Timeline: ${exportData.timeline}`,
      `# Areas: ${exportData.selectedAreas.join(', ')}`,
      `# Comparison: ${exportData.comparisonMode}`,
      `# Total Records: ${data.length}`,
      '',
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        }).join(',')
      )
    ].join('\n');
    
    this.downloadFile(csvContent, filename, 'text/csv');
  }

  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  async exportReport(exportData: ExportData, options: ExportOptions): Promise<void> {
    try {
      switch (options.format) {
        case 'pdf':
          await this.exportToPDF(exportData, options);
          break;
        case 'excel':
          await this.exportToExcel(exportData, options);
          break;
        case 'csv':
          await this.exportToCSV(exportData, options);
          break;
        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }
    } catch (error) {
      console.error('Export failed:', error);
      throw new Error(`Failed to export report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const exportService = new ExportService();
