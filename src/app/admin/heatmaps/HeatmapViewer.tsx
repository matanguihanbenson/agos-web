'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Next.js
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface HeatmapArea {
  name: string;
  coordinates: number[][];
  value: number;
  intensity: string;
  color: string;
}

interface HeatmapViewerProps {
  areas: HeatmapArea[];
}

const HeatmapViewer: React.FC<HeatmapViewerProps> = ({ areas }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersRef = useRef<L.Polygon[]>([]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map centered on Oriental Mindoro
    const map = L.map(mapRef.current, {
      zoomControl: false,
    }).setView([13.4115, 121.1803], 10);

    // Add OpenStreetMap tiles
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Add zoom control to top-right
    L.control.zoom({
      position: 'topright'
    }).addTo(map);

    mapInstanceRef.current = map;

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing layers
    layersRef.current.forEach(layer => {
      mapInstanceRef.current?.removeLayer(layer);
    });
    layersRef.current = [];

    // Add heatmap areas as colored polygons
    areas.forEach(area => {
      // Convert coordinates to LatLng format for Leaflet
      const latlngs = area.coordinates.map(coord => [coord[0], coord[1]] as [number, number]);
      
      // Create polygon with area-specific styling
      const polygon = L.polygon(latlngs, {
        color: area.color,
        weight: 2,
        opacity: 0.8,
        fillColor: area.color,
        fillOpacity: 0.4,
        className: 'heatmap-polygon'
      });

      // Create popup content
      const popupContent = `
        <div style="font-family: system-ui, sans-serif; min-width: 200px;">
          <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 8px;">
            <h3 style="margin: 0; font-size: 16px; font-weight: bold; color: #1f2937;">
              ${area.name}
            </h3>
          </div>
          
          <div style="margin-bottom: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-size: 12px; color: #6b7280;">Value:</span>
              <span style="font-size: 14px; font-weight: 600; color: #1f2937;">
                ${typeof area.value === 'number' && area.value % 1 !== 0 ? area.value.toFixed(1) : area.value}
                ${area.name.includes('Quality') ? '' : area.name.includes('Efficiency') ? '%' : ' items'}
              </span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-size: 12px; color: #6b7280;">Intensity:</span>
              <span style="font-size: 12px; font-weight: 500; color: ${area.color}; text-transform: capitalize;">
                ${area.intensity.replace('-', ' ')}
              </span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 12px; color: #6b7280;">Status:</span>
              <div style="display: flex; align-items: center;">
                <div style="width: 8px; height: 8px; background-color: ${area.color}; border-radius: 50%; margin-right: 6px;"></div>
                <span style="font-size: 12px; color: #374151;">Active</span>
              </div>
            </div>
          </div>
          
          <div style="background-color: #f9fafb; padding: 6px; border-radius: 4px; font-size: 10px; color: #6b7280; text-align: center;">
            Last updated: ${new Date().toLocaleTimeString()}
          </div>
        </div>
      `;

      // Bind popup to polygon
      polygon.bindPopup(popupContent, {
        maxWidth: 300,
        className: 'heatmap-popup'
      });

      // Add hover effects
      polygon.on('mouseover', function(this: L.Polygon, e: L.LeafletMouseEvent) {
        const layer = e.target as L.Polygon;
        layer.setStyle({
          weight: 3,
          fillOpacity: 0.7,
          opacity: 1.0
        });
      });

      polygon.on('mouseout', function(this: L.Polygon, e: L.LeafletMouseEvent) {
        const layer = e.target as L.Polygon;
        layer.setStyle({
          weight: 2,
          fillOpacity: 0.4,
          opacity: 0.8
        });
      });

      // Add click handler
      polygon.on('click', function(this: L.Polygon, e: L.LeafletMouseEvent) {
        // Stop event propagation to prevent map zoom
        L.DomEvent.stopPropagation(e.originalEvent);
        // Simply open the popup - no external API calls
        this.openPopup();
      });

      polygon.addTo(mapInstanceRef.current!);
      layersRef.current.push(polygon);
    });

    // Fit map bounds to show all areas
    if (areas.length > 0) {
      const group = new L.FeatureGroup(layersRef.current);
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
    }

  }, [areas]);

  return (
    <>
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-lg relative z-10"
        style={{ minHeight: '400px' }}
      />
      
      {/* Custom CSS for styling */}
      <style jsx global>{`
        .leaflet-container {
          z-index: 10 !important;
        }
        
        .leaflet-control-container {
          z-index: 50 !important;
        }
        
        .leaflet-popup {
          z-index: 100 !important;
        }
        
        .heatmap-polygon {
          transition: all 0.3s ease;
        }
        
        .heatmap-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
          border: 1px solid #e5e7eb;
          z-index: 200 !important;
        }
        
        .heatmap-popup .leaflet-popup-content {
          margin: 12px 14px;
          line-height: 1.4;
          font-family: system-ui, -apple-system, sans-serif;
        }
        
        .heatmap-popup .leaflet-popup-tip {
          background: white;
          border: 1px solid #e5e7eb;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .heatmap-popup .leaflet-popup-close-button {
          color: #6b7280;
          font-size: 18px;
          padding: 4px 8px;
          font-weight: bold;
          right: 6px;
          top: 6px;
        }
        
        .heatmap-popup .leaflet-popup-close-button:hover {
          color: #374151;
          background-color: #f3f4f6;
          border-radius: 6px;
        }
      `}</style>
    </>
  );
};

export default HeatmapViewer;
          