'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBox, 
  faWineGlass, 
  faCog,
  faNewspaper,
  faRecycle,
  faLeaf,
  faChevronUp,
  faChevronDown,
  faTrash,
  faCalendar
} from '@fortawesome/free-solid-svg-icons';

// Fix for default markers in Next.js
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface TrashBreakdown {
  cardboard: number;
  glass: number;
  metal: number;
  paper: number;
  plastic: number;
  biodegradable: number;
  [key: string]: number; // Add index signature for dynamic access
}

interface TrashLocation {
  id: string;
  area: string;
  coordinates: number[];
  totalItems: number;
  totalWeight: number;
  breakdown: TrashBreakdown;
  density: string;
  deploymentCount: number;
}

interface TrashDepositsMapProps {
  locations: TrashLocation[];
  onLocationSelect: (location: TrashLocation) => void;
  selectedLocation: TrashLocation | null;
  selectedTrashType?: string;
}

const TrashDepositsMap: React.FC<TrashDepositsMapProps> = ({
  locations,
  onLocationSelect,
  selectedLocation,
  selectedTrashType = 'all'
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  
  // State for legend interactions
  const [isLegendCollapsed, setIsLegendCollapsed] = useState(false);
  const markersRef = useRef<L.Marker[]>([]);

  // Icon mapping for consistency with the main page
  const getTrashTypeIcon = (type: string) => {
    switch (type) {
      case 'cardboard':
        return { 
          icon: faBox, 
          color: '#3b82f6'
        };
      case 'glass':
        return { 
          icon: faWineGlass, 
          color: '#22c55e'
        };
      case 'metal':
        return { 
          icon: faCog, 
          color: '#eab308'
        };
      case 'paper':
        return { 
          icon: faNewspaper, 
          color: '#a855f7'
        };
      case 'plastic':
        return { 
          icon: faRecycle, 
          color: '#ef4444'
        };
      case 'biodegradable':
        return { 
          icon: faLeaf, 
          color: '#10b981'
        };
      default:
        return { 
          icon: faRecycle, 
          color: '#6b7280'
        };
    }
  };

  const getDensityColor = (density: string) => {
    switch (density) {
      case 'Very High': return '#ef4444'; // red-500
      case 'High': return '#f97316'; // orange-500
      case 'Medium': return '#eab308'; // yellow-500
      case 'Low': return '#22c55e'; // green-500
      default: return '#6b7280'; // gray-500
    }
  };

  // Create icon for specific trash type
  const getTrashTypeMarkerIcon = useCallback((trashType: string, density: string) => {
    const color = getDensityColor(density);
    const iconData = getTrashTypeIcon(trashType);
    
    // Get the FontAwesome icon unicode or use a data URI approach
    const iconClass = iconData.icon.iconName;
    
    return L.divIcon({
      className: 'custom-trash-marker',
      html: `
        <div style="
          width: 32px;
          height: 32px;
          background-color: ${color};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 14px;
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          position: relative;
          transform: translate(-50%, -50%);
        ">
          <i class="fas fa-${iconClass}" style="font-size: 14px;"></i>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  }, []);

  // Create clustered icon for multiple trash types
  const getMultiTrashIcon = useCallback((location: TrashLocation) => {
    const color = getDensityColor(location.density);
    const trashTypes = Object.entries(location.breakdown).filter(([, count]) => count > 0);
    const displayTypes = trashTypes.slice(0, 4); // Show up to 4 types
    
    return L.divIcon({
      className: 'custom-trash-marker-cluster',
      html: `
        <div style="
          width: 40px;
          height: 40px;
          background-color: ${color};
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          border: 3px solid white;
          box-shadow: 0 3px 12px rgba(0,0,0,0.4);
          position: relative;
          transform: translate(-50%, -50%);
        ">
          <div style="
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1px;
            font-size: 8px;
            text-align: center;
            width: 100%;
            height: 100%;
            align-items: center;
            justify-items: center;
          ">
            ${displayTypes.map(([type]) => {
              const iconData = getTrashTypeIcon(type);
              const iconClass = iconData.icon.iconName;
              return `<div><i class="fas fa-${iconClass}"></i></div>`;
            }).join('')}
            ${trashTypes.length > 4 ? '<div style="font-size: 8px;">+' + (trashTypes.length - 4) + '</div>' : ''}
          </div>
          <div style="
            position: absolute;
            bottom: -8px;
            right: -8px;
            background-color: #1f2937;
            color: white;
            border-radius: 50%;
            width: 18px;
            height: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: bold;
            border: 2px solid white;
          ">
            ${location.totalItems}
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });
  }, []);

  // Reverse geocoding function using internal API
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.display_name) {
        // Format the address nicely
        const address = data.address || {};
        const parts = [
          address.house_number,
          address.road,
          address.neighbourhood || address.suburb,
          address.city || address.town || address.municipality,
          address.state,
          address.country
        ].filter(Boolean);
        
        return parts.join(', ') || data.display_name;
      }
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      // Fallback to coordinates only
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  // Format coordinates for display
  const formatCoordinates = (lat: number, lng: number): string => {
    const latDir = lat >= 0 ? 'N' : 'S';
    const lngDir = lng >= 0 ? 'E' : 'W';
    return `${Math.abs(lat).toFixed(6)}°${latDir}, ${Math.abs(lng).toFixed(6)}°${lngDir}`;
  };

  // Helper function to create FontAwesome icon HTML
  const getFAIconHTML = (iconName: string, color: string = '#374151', size: string = '14px'): string => {
    const iconMap: Record<string, string> = {
      'trash': 'fas fa-trash',
      'location': 'fas fa-map-pin',
      'chart': 'fas fa-chart-bar',
      'error': 'fas fa-times',
      'check': 'fas fa-check',
      'recycle': 'fas fa-recycle',
      'trend': 'fas fa-chart-line'
    };
    
    const iconClass = iconMap[iconName] || 'fas fa-question';
    return `<i class="${iconClass}" style="color: ${color}; font-size: ${size}; margin-right: 6px;"></i>`;
  };

  // Get trash type details
  const getTrashTypeDetails = useCallback((type: string) => {
    const iconData = getTrashTypeIcon(type);
    const iconClass = iconData.icon.iconName;
    const iconHTML = `<i class="fas fa-${iconClass}" style="color: ${iconData.color};"></i>`;
    
    const details: Record<string, {
      name: string;
      icon: string;
      description: string;
      environmental_impact: string;
      recyclable: boolean;
    }> = {
      cardboard: {
        name: 'Cardboard',
        icon: iconHTML,
        description: 'Cardboard boxes and packaging materials',
        environmental_impact: 'Highly recyclable and biodegradable',
        recyclable: true
      },
      glass: {
        name: 'Glass',
        icon: iconHTML,
        description: 'Glass bottles and containers',
        environmental_impact: 'Takes 1 million years to decompose',
        recyclable: true
      },
      metal: {
        name: 'Metal',
        icon: iconHTML,
        description: 'Metal cans and containers',
        environmental_impact: 'Highly recyclable material',
        recyclable: true
      },
      paper: {
        name: 'Paper',
        icon: iconHTML,
        description: 'Paper products and documents',
        environmental_impact: 'Biodegradable and recyclable',
        recyclable: true
      },
      plastic: {
        name: 'Plastic',
        icon: iconHTML,
        description: 'Plastic bottles, bags, and containers',
        environmental_impact: 'Takes 450+ years to decompose',
        recyclable: false
      },
      biodegradable: {
        name: 'Biodegradable Waste',
        icon: iconHTML,
        description: 'Organic waste and food scraps',
        environmental_impact: 'Naturally decomposes quickly',
        recyclable: false
      }
    };

    
    return details[type] || details.plastic;
  }, []);
  // Load FontAwesome CSS for popup icons
  useEffect(() => {
    if (!document.querySelector('link[href*="font-awesome"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current, {
      zoomControl: false,
    }).setView([14.5995, 120.9842], 11);

    // Add OpenStreetMap tiles
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Add zoom control to bottom-right
    L.control.zoom({
      position: 'bottomright'
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

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapInstanceRef.current?.removeLayer(marker);
    });
    markersRef.current = [];

    // Only add markers if we have locations
    if (locations.length === 0) {
      return;
    }

    // Add markers for each location
    locations.forEach(location => {
      // For 'all' trash types, show clustered icon with multiple trash types
      if (selectedTrashType === 'all') {
        const marker = L.marker(
          [location.coordinates[0], location.coordinates[1]],
          { icon: getMultiTrashIcon(location) }
        );

        // Create comprehensive popup content for all trash types
        const initialPopupContent = `
          <div style="min-width: 200px; padding: 12px; font-family: system-ui, sans-serif;">
            <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 8px;">
              <h3 style="margin: 0; font-size: 15px; font-weight: bold; color: #1f2937; display: flex; align-items: center;">
                ${getFAIconHTML('trash', '#374151', '18px')}
                ${location.area}
              </h3>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #6b7280;">All Trash Types</p>
            </div>
            <div style="font-size: 12px; line-height: 1.4;">
              <div><strong>Total Items:</strong> ${location.totalItems}</div>
              <div><strong>Density:</strong> ${location.density}</div>
              <div style="margin-top: 8px;">
                ${Object.entries(location.breakdown).filter(([, count]) => count > 0).map(([type, count]) => {
                  const iconData = getTrashTypeIcon(type);
                  const iconClass = iconData.icon.iconName;
                  return `<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                    <span style="display: flex; align-items: center;">
                      <i class="fas fa-${iconClass}" style="margin-right: 6px; color: ${iconData.color};"></i>
                      ${type.charAt(0).toUpperCase() + type.slice(1)}
                    </span>
                    <strong>${count}</strong>
                  </div>`;
                }).join('')}
              </div>
            </div>
            <div style="margin-top: 8px; text-align: center; font-size: 10px; color: #6b7280;">
              Loading more details...
            </div>
          </div>
        `;

        marker.bindPopup(initialPopupContent, {
          maxWidth: 300,
          minWidth: 200,
          autoPan: true,
          closeButton: true,
          autoClose: true,
          className: 'custom-trash-popup'
        });

        // Enhanced click event for all trash types
        marker.on('click', async function(this: L.Marker, e: L.LeafletMouseEvent) {
          L.DomEvent.stopPropagation(e.originalEvent);
          onLocationSelect(location);
          this.openPopup();
          
          try {
            const address = await reverseGeocode(location.coordinates[0], location.coordinates[1]);
            const coordinates = formatCoordinates(location.coordinates[0], location.coordinates[1]);
            const collectionDate = new Date().toLocaleDateString();

            const detailedContent = `
              <div style="min-width: 260px; max-width: 320px; font-family: system-ui, sans-serif;">
                <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 8px;">
                  <h3 style="margin: 0; font-size: 16px; font-weight: bold; color: #1f2937; display: flex; align-items: center;">
                    ${getFAIconHTML('trash', '#374151', '18px')}
                    ${location.area}
                  </h3>
                  <p style="margin: 4px 0 0 0; font-size: 12px; color: #6b7280;">Complete Waste Breakdown</p>
                </div>

                <div style="margin-bottom: 8px; padding: 6px; background-color: #f9fafb; border-radius: 4px;">
                  <h4 style="margin: 0 0 4px 0; font-size: 12px; font-weight: 600; color: #374151;">${getFAIconHTML('location', '#374151', '12px')}Location</h4>
                  <div style="font-size: 11px; color: #6b7280; line-height: 1.4;">
                    <div style="margin-bottom: 2px;"><strong>Address:</strong> ${address}</div>
                    <div style="margin-bottom: 2px;"><strong>Coordinates:</strong> ${coordinates}</div>
                    <div><strong>Density:</strong> 
                      <span style="display: inline-block; width: 8px; height: 8px; background-color: ${getDensityColor(location.density)}; border-radius: 50%; margin: 0 4px;"></span>
                      ${location.density}
                    </div>
                  </div>
                </div>

                <div style="margin-bottom: 8px; padding: 6px; background-color: #eff6ff; border-radius: 4px;">
                  <h4 style="margin: 0 0 4px 0; font-size: 12px; font-weight: 600; color: #1d4ed8;">${getFAIconHTML('trash', '#1d4ed8', '12px')}Detailed Breakdown</h4>
                  <div style="font-size: 11px; color: #1e40af; line-height: 1.3;">
                    ${Object.entries(location.breakdown).map(([type, count]) => {
                      const iconData = getTrashTypeIcon(type);
                      const iconClass = iconData.icon.iconName;
                      const percentage = ((count / location.totalItems) * 100).toFixed(1);
                      return `<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px; padding: 2px 4px; background-color: #f8fafc; border-radius: 3px;">
                        <span style="display: flex; align-items: center;">
                          <i class="fas fa-${iconClass}" style="margin-right: 6px; color: ${iconData.color};"></i>
                          ${type.charAt(0).toUpperCase() + type.slice(1)}
                        </span>
                        <span><strong>${count}</strong> <small>(${percentage}%)</small></span>
                      </div>`;
                    }).join('')}
                    <div style="padding-top: 6px; border-top: 1px solid #dbeafe; font-weight: 600; text-align: center;">
                      ${getFAIconHTML('trend', '#1e40af', '12px')}Total: ${location.totalItems} items
                    </div>
                  </div>
                </div>

                <div style="padding: 4px 6px; background-color: #f3f4f6; border-radius: 4px; font-size: 10px; color: #6b7280; text-align: center;">
                  <i class="fas fa-calendar" style="margin-right: 4px;"></i> Updated: ${collectionDate}
                </div>
              </div>
            `;
            
            this.setPopupContent(detailedContent);
            
          } catch (error) {
            console.error('Failed to load detailed popup:', error);
            this.setPopupContent(`
              <div style="padding: 16px; color: #dc2626; text-align: center;">
                <h3 style="margin: 0 0 8px 0; font-size: 14px;">${getFAIconHTML('error', '#dc2626', '14px')}Error</h3>
                <p style="margin: 0; font-size: 12px;">Failed to load details</p>
              </div>
            `);
          }
        });

        marker.addTo(mapInstanceRef.current!);
        markersRef.current.push(marker);
      } else {
        // For specific trash type, only show marker if that type exists at this location
        const count = location.breakdown[selectedTrashType as keyof typeof location.breakdown];
        if (count && count > 0) {
          const marker = L.marker(
            [location.coordinates[0], location.coordinates[1]],
            { icon: getTrashTypeMarkerIcon(selectedTrashType, location.density) }
          );

          const trashDetails = getTrashTypeDetails(selectedTrashType);
          
          const initialPopupContent = `
            <div style="min-width: 200px; padding: 12px; font-family: system-ui, sans-serif;">
              <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 8px;">
                <h3 style="margin: 0; font-size: 15px; font-weight: bold; color: #1f2937; display: flex; align-items: center;">
                  <span style="font-size: 18px; margin-right: 6px;">${trashDetails.icon}</span>
                  ${trashDetails.name}
                </h3>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: #6b7280;">${location.area}</p>
              </div>
              <div style="font-size: 12px; line-height: 1.4;">
                <div><strong>Count:</strong> ${count} items</div>
                <div><strong>Density:</strong> ${location.density}</div>
              </div>
              <div style="margin-top: 8px; text-align: center; font-size: 10px; color: #6b7280;">
                Loading more details...
              </div>
            </div>
          `;

          marker.bindPopup(initialPopupContent, {
            maxWidth: 300,
            minWidth: 200,
            autoPan: true,
            closeButton: true,
            autoClose: true,
            className: 'custom-trash-popup'
          });

          // Specific trash type click event
          marker.on('click', async function(this: L.Marker, e: L.LeafletMouseEvent) {
            L.DomEvent.stopPropagation(e.originalEvent);
            onLocationSelect(location);
            this.openPopup();
            
            try {
              const address = await reverseGeocode(location.coordinates[0], location.coordinates[1]);
              const coordinates = formatCoordinates(location.coordinates[0], location.coordinates[1]);
              const collectionDate = new Date().toLocaleDateString();
              const totalAreaItems = location.totalItems;

              const detailedContent = `
                <div style="min-width: 240px; max-width: 300px; font-family: system-ui, sans-serif;">
                  <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 8px;">
                    <h3 style="margin: 0; font-size: 16px; font-weight: bold; color: #1f2937; display: flex; align-items: center;">
                      <span style="font-size: 18px; margin-right: 6px;">${trashDetails.icon}</span>
                      ${trashDetails.name}
                    </h3>
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #6b7280;">${location.area}</p>
                  </div>

                  <div style="margin-bottom: 8px; padding: 6px; background-color: #f9fafb; border-radius: 4px;">
                    <h4 style="margin: 0 0 4px 0; font-size: 12px; font-weight: 600; color: #374151;">${getFAIconHTML('location', '#374151', '12px')}Location</h4>
                    <div style="font-size: 11px; color: #6b7280; line-height: 1.4;">
                      <div style="margin-bottom: 2px;"><strong>Address:</strong> ${address}</div>
                      <div style="margin-bottom: 2px;"><strong>Coordinates:</strong> ${coordinates}</div>
                      <div><strong>Density:</strong> 
                        <span style="display: inline-block; width: 8px; height: 8px; background-color: ${getDensityColor(location.density)}; border-radius: 50%; margin: 0 4px;"></span>
                        ${location.density}
                      </div>
                    </div>
                  </div>

                  <div style="margin-bottom: 8px; padding: 6px; background-color: #eff6ff; border-radius: 4px;">
                    <h4 style="margin: 0 0 4px 0; font-size: 12px; font-weight: 600; color: #1d4ed8;">${getFAIconHTML('chart', '#1d4ed8', '12px')}Complete Area Breakdown</h4>
                    <div style="font-size: 10px; color: #1e40af; line-height: 1.3;">
                      ${Object.entries(location.breakdown).map(([type, count]) => {
                        const iconData = getTrashTypeIcon(type);
                        const iconClass = iconData.icon.iconName;
                        return `<div style="display: flex; justify-content: space-between; margin-bottom: 1px;">
                          <span><i class="fas fa-${iconClass}" style="margin-right: 4px; color: ${iconData.color};"></i>${type.charAt(0).toUpperCase() + type.slice(1)}</span>
                          <strong>${count}</strong>
                        </div>`;
                      }).join('')}
                      <div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid #dbeafe; font-weight: 600; text-align: center;">
                        ${getFAIconHTML('trend', '#1e40af', '12px')}Total: ${totalAreaItems} items
                      </div>
                    </div>
                  </div>

                  <div style="padding: 4px 6px; background-color: #f3f4f6; border-radius: 4px; font-size: 10px; color: #6b7280; text-align: center;">
                    <i class="fas fa-calendar" style="margin-right: 4px;"></i> Updated: ${collectionDate}
                  </div>
                </div>
              `;
              
              this.setPopupContent(detailedContent);
              
            } catch (error) {
              console.error('Failed to load detailed popup:', error);
              this.setPopupContent(`
                <div style="padding: 16px; color: #dc2626; text-align: center;">
                  <h3 style="margin: 0 0 8px 0; font-size: 14px;">${getFAIconHTML('error', '#dc2626', '14px')}Error</h3>
                  <p style="margin: 0; font-size: 12px;">Failed to load details</p>
                </div>
              `);
            }
          });

          marker.addTo(mapInstanceRef.current!);
          markersRef.current.push(marker);
        }
      }
    });

    // Fit map to show all markers if there are locations and markers were added
    if (locations.length > 0 && markersRef.current.length > 0) {
      const group = new L.FeatureGroup(markersRef.current);
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
    }
  }, [locations, selectedLocation, selectedTrashType, onLocationSelect]);

  // Center map on selected location
  useEffect(() => {
    if (selectedLocation && mapInstanceRef.current) {
      mapInstanceRef.current.setView(
        [selectedLocation.coordinates[0], selectedLocation.coordinates[1]], 
        14,
        { animate: true }
      );
    }
  }, [selectedLocation]);

  return (
    <div className="relative w-full h-full">
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-lg"
        style={{ minHeight: '400px' }}
      />
      
      {/* Add CSS for popup animation and styling */}
      <style jsx global>{`
        @keyframes leaflet-popup-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
          border: 1px solid #e5e7eb;
        }
        
        .leaflet-popup-content {
          margin: 12px 14px;
          line-height: 1.4;
          font-family: system-ui, -apple-system, sans-serif;
        }
        
        .leaflet-popup-tip {
          background: white;
          border: 1px solid #e5e7eb;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .custom-trash-popup .leaflet-popup-close-button {
          color: #6b7280;
          font-size: 18px;
          padding: 4px 8px;
          font-weight: bold;
          right: 6px;
          top: 6px;
        }
        
        .custom-trash-popup .leaflet-popup-close-button:hover {
          color: #374151;
          background-color: #f3f4f6;
          border-radius: 6px;
        }
        
        .custom-marker,
        .custom-trash-marker,
        .custom-trash-marker-cluster {
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .custom-trash-marker:hover,
        .custom-trash-marker-cluster:hover {
          transform: translate(-50%, -50%) scale(1.1);
          z-index: 1000;
        }
        
        .leaflet-marker-icon.custom-trash-marker-cluster {
          animation: pulse 2s ease-in-out infinite alternate;
        }
        
        @keyframes pulse {
          0% { opacity: 0.8; }
          100% { opacity: 1; }
        }
        
        .leaflet-popup-scrolled {
          border-top: 1px solid #e5e7eb;
          border-bottom: 1px solid #e5e7eb;
        }
      `}</style>
      
      {/* Map Legend - Positioned at bottom left */}
      <div className="absolute bottom-4 left-4 bg-white bg-opacity-95 backdrop-blur-sm rounded-lg shadow-lg z-[1000] max-w-[200px]">
        {/* Legend Header with Collapse Button */}
        <div className="flex items-center justify-between p-3 pb-2 border-b border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900">Legend</h4>
          <button
            onClick={() => setIsLegendCollapsed(!isLegendCollapsed)}
            className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded"
            aria-label={isLegendCollapsed ? "Expand legend" : "Collapse legend"}
          >
            <FontAwesomeIcon 
              icon={isLegendCollapsed ? faChevronUp : faChevronDown} 
              className="w-3 h-3" 
            />
          </button>
        </div>
        
        {/* Legend Content - Collapsible */}
        <div className={`transition-all duration-300 overflow-hidden ${
          isLegendCollapsed ? 'max-h-0' : 'max-h-96'
        }`}>
          <div className="p-3 pt-2">
            {/* Trash Types */}
            <div className="mb-3">
              <h5 className="text-xs font-medium text-gray-700 mb-1.5">Trash Types</h5>
              <div className="space-y-1.5">
                {[
                  { type: 'Cardboard', iconType: 'cardboard', key: 'cardboard' },
                  { type: 'Glass', iconType: 'glass', key: 'glass' },
                  { type: 'Metal', iconType: 'metal', key: 'metal' },
                  { type: 'Paper', iconType: 'paper', key: 'paper' },
                  { type: 'Plastic', iconType: 'plastic', key: 'plastic' },
                  { type: 'Biodegradable', iconType: 'biodegradable', key: 'biodegradable' },
                ].map((item) => {
                  const iconData = getTrashTypeIcon(item.iconType);
                  return (
                    <div key={item.key} className="flex items-center space-x-2">
                      <FontAwesomeIcon icon={iconData.icon} className="w-3 h-3" style={{ color: iconData.color }} />
                      <span className="text-xs text-gray-700">{item.type}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Icon Types */}
            <div className="mb-3">
              <h5 className="text-xs font-medium text-gray-700 mb-1.5">Icon Types</h5>
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full border border-white flex items-center justify-center text-white text-xs">
                    <FontAwesomeIcon icon={faTrash} className="text-xs" />
                  </div>
                  <span className="text-xs text-gray-700">Single Type</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 bg-orange-500 rounded-lg border-2 border-white flex items-center justify-center text-white text-xs" style={{ fontSize: '8px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px' }}>
                      <FontAwesomeIcon icon={faBox} style={{ fontSize: '6px' }} />
                      <FontAwesomeIcon icon={faLeaf} style={{ fontSize: '6px' }} />
                    </div>
                  </div>
                  <span className="text-xs text-gray-700">Multiple Types</span>
                </div>
              </div>
            </div>

            {/* Density Levels */}
            <div>
              <h5 className="text-xs font-medium text-gray-700 mb-1.5">Density Levels</h5>
              <div className="space-y-1.5">
                {[
                  { level: 'Very High', color: '#ef4444' },
                  { level: 'High', color: '#f97316' },
                  { level: 'Medium', color: '#eab308' },
                  { level: 'Low', color: '#22c55e' },
                 ].map((item) => (
                  <div key={item.level} className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded border border-white shadow-sm"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-xs text-gray-700">{item.level}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map Controls Info */}
      <div className="absolute top-4 right-4 bg-white bg-opacity-95 backdrop-blur-sm rounded-lg shadow-lg p-3 z-[1000]">
        <p className="text-xs text-gray-600">
          Click markers for details • Drag to pan • Scroll to zoom
        </p>
      </div>
    </div>
  );
};

export default TrashDepositsMap;