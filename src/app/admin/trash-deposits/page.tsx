'use client';

import React, { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { 
  faBox, 
  faWineGlass, 
  faCog,
  faNewspaper,
  faRecycle,
  faLeaf,
  faChevronLeft,
  faChevronRight,
  faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import { 
  MapPin, 
  Filter,
  BarChart3,
  RefreshCw,
  Download,
  Layers,
  Activity,
  Recycle,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

// Alternative dynamic import with full path
const TrashDepositsMap = dynamic(() => import('@/app/admin/trash-deposits/TrashDepositsMap'), {
  ssr: false,
  loading: () => (
    <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-gray-600 font-medium text-sm">Loading map...</p>
      </div>
    </div>
  )
});

interface TrashLocation {
  id: string;
  area: string;
  coordinates: number[];
  totalItems: number;
  totalWeight: number;
  breakdown: {
    cardboard: number;
    glass: number;
    metal: number;
    paper: number;
    plastic: number;
    biodegradable: number;
  };
  density: string;
  deploymentCount: number;
}

interface Deployment {
  id: string;
  river_id: string;
  river_name: string;
  operation_lat: number;
  operation_lng: number;
  trash_collection: {
    total_items: number;
    total_weight: number;
    trash_by_type?: Record<string, number>;
  };
  status: string;
  owner_admin_id: string;
}

interface River {
  id: string;
  name: string;
  created_by: string;
}

export default function TrashDeposits() {
  const { user } = useAuth();
  const [selectedArea, setSelectedArea] = useState('all');
  const [viewMode, setViewMode] = useState('map'); // 'map' or 'chart'
  const [selectedLocation, setSelectedLocation] = useState<TrashLocation | null>(null);
  const [selectedTrashType, setSelectedTrashType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDensityInfo, setShowDensityInfo] = useState(false);
  const [trashData, setTrashData] = useState<TrashLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [allowedUserIds, setAllowedUserIds] = useState<string[]>([]);
  const [availableRivers, setAvailableRivers] = useState<River[]>([]);
  const ITEMS_PER_PAGE = 3;

  // Fetch admin's field operators to get allowed user IDs
  useEffect(() => {
    if (!user?.uid) {
      setAllowedUserIds([]);
      return;
    }

    // Include admin's own ID
    const userIds = [user.uid];

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('created_by', '==', user.uid));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fieldOperatorIds = snapshot.docs.map(doc => doc.id);
        setAllowedUserIds([...userIds, ...fieldOperatorIds]);
      }, (error) => {
        console.error('Error fetching field operators:', error);
        setAllowedUserIds(userIds); // At least include admin's ID
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up field operators listener:', error);
      setAllowedUserIds(userIds);
    }
  }, [user?.uid]);

  // Fetch rivers created by admin and field operators
  useEffect(() => {
    if (allowedUserIds.length === 0) {
      setAvailableRivers([]);
      return;
    }

    try {
      const riversRef = collection(db, 'rivers');
      const q = query(riversRef, where('created_by', 'in', allowedUserIds));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const rivers: River[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          rivers.push({
            id: doc.id,
            name: data.name,
            created_by: data.created_by
          });
        });

        setAvailableRivers(rivers);
      }, (error) => {
        console.error('Error fetching rivers:', error);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up rivers listener:', error);
    }
  }, [allowedUserIds]);

  // Fetch deployments from Firebase and aggregate by river_id
  useEffect(() => {
    if (allowedUserIds.length === 0) {
      setLoading(false);
      return;
    }

    const deploymentsRef = collection(db, 'deployments');
    const q = query(deploymentsRef, where('owner_admin_id', 'in', allowedUserIds));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const deployments: Deployment[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        deployments.push({
          id: doc.id,
          river_id: data.river_id,
          river_name: data.river_name,
          operation_lat: data.operation_lat,
          operation_lng: data.operation_lng,
          trash_collection: data.trash_collection || { total_items: 0, total_weight: 0 },
          status: data.status,
          owner_admin_id: data.owner_admin_id
        } as Deployment);
      });

      // Aggregate data by river_id
      const aggregated = new Map<string, TrashLocation>();

      deployments.forEach((deployment) => {
        if (!deployment.river_id) return;

        const existing = aggregated.get(deployment.river_id);
        const trashByType = deployment.trash_collection.trash_by_type || {};

        if (existing) {
          // Add to existing river data
          existing.totalItems += deployment.trash_collection.total_items || 0;
          existing.totalWeight += deployment.trash_collection.total_weight || 0;
          existing.deploymentCount += 1;

          // Aggregate trash by type
          Object.entries(trashByType).forEach(([type, count]) => {
            const normalizedType = type.toLowerCase();
            if (normalizedType in existing.breakdown) {
              existing.breakdown[normalizedType as keyof typeof existing.breakdown] += count;
            }
          });
        } else {
          // Create new river entry
          const breakdown = {
            cardboard: trashByType['cardboard'] || trashByType['Cardboard'] || 0,
            glass: trashByType['glass'] || trashByType['Glass'] || 0,
            metal: trashByType['metal'] || trashByType['Metal'] || 0,
            paper: trashByType['paper'] || trashByType['Paper'] || 0,
            plastic: trashByType['plastic'] || trashByType['Plastic'] || 0,
            biodegradable: trashByType['biodegradable'] || trashByType['Biodegradable'] || 0
          };

          aggregated.set(deployment.river_id, {
            id: deployment.river_id,
            area: deployment.river_name,
            coordinates: [deployment.operation_lat, deployment.operation_lng],
            totalItems: deployment.trash_collection.total_items || 0,
            totalWeight: deployment.trash_collection.total_weight || 0,
            breakdown,
            density: calculateDensity(deployment.trash_collection.total_items || 0),
            deploymentCount: 1
          });
        }
      });

      // Calculate density for aggregated data
      const result = Array.from(aggregated.values()).map(location => ({
        ...location,
        density: calculateDensity(location.totalItems)
      }));

      setTrashData(result);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching deployments:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [allowedUserIds]);

  // Calculate density based on total items
  const calculateDensity = (totalItems: number): string => {
    if (totalItems >= 1500) return 'Very High';
    if (totalItems >= 1000) return 'High';
    if (totalItems >= 500) return 'Medium';
    if (totalItems > 0) return 'Low';
    return 'None';
  };

  // Icon mapping for consistency
  const getTrashTypeIcon = (type: string) => {
    switch (type) {
      case 'cardboard':
        return <FontAwesomeIcon icon={faBox} className="w-3 h-3" />;
      case 'glass':
        return <FontAwesomeIcon icon={faWineGlass} className="w-3 h-3" />;
      case 'metal':
        return <FontAwesomeIcon icon={faCog} className="w-3 h-3" />;
      case 'paper':
        return <FontAwesomeIcon icon={faNewspaper} className="w-3 h-3" />;
      case 'plastic':
        return <FontAwesomeIcon icon={faRecycle} className="w-3 h-3" />;
      case 'biodegradable':
        return <FontAwesomeIcon icon={faLeaf} className="w-3 h-3" />;
      default:
        return <FontAwesomeIcon icon={faRecycle} className="w-3 h-3" />;
    }
  };

  // Calculate total weight for filtered data using actual Firebase weights
  const calculateTotalWeight = (data: typeof filteredData) => {
    return data.reduce((totalWeight, location) => {
      return totalWeight + location.totalWeight;
    }, 0);
  };



  // Filter data based on selected area and trash type
  const filteredData = useMemo(() => {
    let filtered = trashData;

    // Filter by area - works with dynamic river names
    if (selectedArea !== 'all') {
      filtered = filtered.filter(location => 
        location.area.toLowerCase().includes(selectedArea.toLowerCase())
      );
    }

    // Filter by trash type - only show locations that have the selected type
    if (selectedTrashType !== 'all') {
      filtered = filtered.filter(location => {
        const count = location.breakdown[selectedTrashType as keyof typeof location.breakdown];
        return count > 0;
      });
    }

    return filtered;
  }, [selectedArea, selectedTrashType, trashData]);

  // Pagination for area details
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedArea, selectedTrashType]);

  const getDensityColor = (density: string) => {
    switch (density) {
      case 'Very High': return 'bg-red-500';
      case 'High': return 'bg-orange-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getDensityTextColor = (density: string) => {
    switch (density) {
      case 'Very High': return 'text-red-600';
      case 'High': return 'text-orange-600';
      case 'Medium': return 'text-yellow-600';
      case 'Low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const handleLocationSelect = (location: TrashLocation) => {
    setSelectedLocation(location);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Compact Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-blue-200/30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">Trash Deposits Analysis</h1>
              <p className="text-slate-600 text-sm">Geographic distribution and composition of collected waste</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <button className="inline-flex items-center px-3 py-1.5 border border-slate-200/50 rounded-lg text-sm font-medium text-slate-700 bg-white/70 hover:bg-white transition-all duration-200 shadow-sm hover:shadow-md">
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh
              </button>
              <button className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg">
                <Download className="h-3 w-3 mr-1" />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-4"></div>
              <p className="text-gray-600 font-medium">Loading deployment data...</p>
            </div>
          </div>
        ) : trashData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Recycle className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Deployment Data</h3>
            <p className="text-gray-600 text-sm">There are no completed deployments to display.</p>
          </div>
        ) : (
          <>
        {/* Compact Summary Statistics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <div className="bg-gradient-to-br from-white/90 to-blue-50/80 backdrop-blur-sm rounded-xl border border-blue-200/30 p-4 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md">
                <MapPin className="h-4 w-4 text-white" />
              </div>
              <div className="text-right">
                <p className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">{filteredData.length}</p>
                <p className="text-xs text-blue-600 font-medium">Areas</p>
              </div>
            </div>
            <h3 className="font-semibold text-slate-800 mb-1 text-sm">Monitored Zones</h3>
            <p className="text-xs text-slate-600">
              {selectedArea === 'all' 
                ? 'All waterways tracked' 
                : `${selectedArea} area tracked`}
            </p>
            <div className="mt-2 flex items-center text-xs text-blue-600">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></div>
              All zones active
            </div>
          </div>

          <div className="bg-gradient-to-br from-white/90 to-emerald-50/80 backdrop-blur-sm rounded-xl border border-emerald-200/30 p-4 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg shadow-md">
                <Recycle className="h-4 w-4 text-white" />
              </div>
              <div className="text-right">
                <p className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent">
                  {filteredData.reduce((sum, item) => sum + item.totalItems, 0).toLocaleString()}
                </p>
                <p className="text-xs text-emerald-600 font-medium">Items</p>
                <p className="text-sm font-semibold text-emerald-700 mt-1">
                  {calculateTotalWeight(filteredData).toFixed(2)} kg
                </p>
              </div>
            </div>
            <h3 className="font-semibold text-slate-800 mb-1 text-sm">Total Collected</h3>
            <p className="text-xs text-slate-600">
              {selectedTrashType === 'all' ? 'All trash types' : 
               selectedTrashType === 'plasticBottles' ? 'Plastic bottles only' :
               selectedTrashType === 'foodContainers' ? 'Food containers only' :
               selectedTrashType === 'plasticBags' ? 'Plastic bags only' :
               selectedTrashType === 'metalCans' ? 'Metal cans only' :
               'Other debris only'}
            </p>
            <div className="mt-2 flex items-center justify-between text-xs">
              <div className="flex items-center text-emerald-600">
                <TrendingUp className="w-3 h-3 mr-1" />
                {filteredData.length > 0 ? '+12% from last week' : 'No data for filter'}
              </div>
              <div className="text-emerald-700 font-medium">
                ~{(calculateTotalWeight(filteredData) / (filteredData.reduce((sum, item) => sum + item.totalItems, 0) || 1) * 1000).toFixed(0)}g/item
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white/90 to-purple-50/80 backdrop-blur-sm rounded-xl border border-purple-200/30 p-4 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              <div className="text-right">
                <p className="text-xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                  {filteredData.length > 0 
                    ? Math.round(filteredData.reduce((sum, item) => sum + item.totalItems, 0) / filteredData.length).toLocaleString()
                    : '0'}
                </p>
                <p className="text-xs text-purple-600 font-medium">Avg/Zone</p>
              </div>
            </div>
            <h3 className="font-semibold text-slate-800 mb-1 text-sm">Average Density</h3>
            <p className="text-xs text-slate-600">Items per monitored area</p>
            <div className="mt-2 flex items-center text-xs text-purple-600">
              <Activity className="w-3 h-3 mr-1" />
              Moderate levels
            </div>
          </div>

          <div className="bg-gradient-to-br from-white/90 to-orange-50/80 backdrop-blur-sm rounded-xl border border-orange-200/30 p-4 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-md">
                <AlertTriangle className="h-4 w-4 text-white" />
              </div>
              <div className="text-right">
                <p className="text-xl font-bold bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">
                  {filteredData.filter(loc => loc.density === 'Very High' || loc.density === 'High').length}
                </p>
                <p className="text-xs text-orange-600 font-medium">
                  {filteredData.filter(loc => loc.density === 'Very High' || loc.density === 'High').length === 1 ? 'Zone' : 'Zones'}
                </p>
              </div>
            </div>
            <h3 className="font-semibold text-slate-800 mb-1 text-sm">High Density Alert</h3>
            <p className="text-xs text-slate-600">
              {(() => {
                const highDensityZones = filteredData
                  .filter(loc => loc.density === 'Very High' || loc.density === 'High')
                  .sort((a, b) => b.totalItems - a.totalItems);
                
                if (highDensityZones.length === 0) {
                  return 'No high-density zones';
                }
                
                if (highDensityZones.length === 1) {
                  return highDensityZones[0].area;
                }
                
                return `${highDensityZones[0].area} +${highDensityZones.length - 1} more`;
              })()}
            </p>
            <div className="mt-2 flex items-center text-xs text-orange-600">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1"></div>
              {filteredData.filter(loc => loc.density === 'Very High' || loc.density === 'High').length > 0 
                ? 'Requires attention' 
                : 'All zones normal'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Compact Map/Chart Display */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-white/90 to-slate-50/80 backdrop-blur-sm rounded-xl border border-slate-200/50 shadow-lg">
              <div className="p-4 border-b border-slate-200/50">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-base font-semibold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                      {viewMode === 'map' ? 'Geographic Distribution' : 'Trash Composition Analysis'}
                    </h3>
                    <p className="text-sm text-slate-600 mt-0.5">
                      {viewMode === 'map' 
                        ? 'Interactive map showing trash deposits across waterways' 
                        : 'Statistical breakdown of collected waste types'
                      }
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setViewMode('map')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        viewMode === 'map' 
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md' 
                          : 'bg-gradient-to-r from-slate-50 to-slate-100 text-slate-700 hover:from-slate-100 hover:to-slate-200 border border-slate-200/50'
                      }`}
                    >
                      <MapPin className="h-3 w-3 mr-1 inline" />
                      Map
                    </button>
                    <button
                      onClick={() => setViewMode('chart')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        viewMode === 'chart' 
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md' 
                          : 'bg-gradient-to-r from-slate-50 to-slate-100 text-slate-700 hover:from-slate-100 hover:to-slate-200 border border-slate-200/50'
                      }`}
                    >
                      <BarChart3 className="h-3 w-3 mr-1 inline" />
                      Chart
                    </button>
                  </div>
                </div>

                {/* Compact Filters */}
                <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg p-3 border border-slate-200/50">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center space-x-1.5">
                      <MapPin className="h-3 w-3 text-slate-500" />
                      <select 
                        value={selectedArea}
                        onChange={(e) => setSelectedArea(e.target.value)}
                        className="border border-slate-200/50 rounded-md px-2.5 py-1 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300 bg-white/70 backdrop-blur-sm"
                      >
                        <option value="all">All Areas</option>
                        {availableRivers.map((river) => (
                          <option key={river.id} value={river.name.toLowerCase()}>
                            {river.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <Filter className="h-3 w-3 text-slate-500" />
                      <select 
                        value={selectedTrashType}
                        onChange={(e) => setSelectedTrashType(e.target.value)}
                        className="border border-slate-200/50 rounded-md px-2.5 py-1 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300 bg-white/70 backdrop-blur-sm"
                      >
                        <option value="all">All Types</option>
                        <option value="cardboard">Cardboard</option>
                        <option value="glass">Glass</option>
                        <option value="metal">Metal</option>
                        <option value="paper">Paper</option>
                        <option value="plastic">Plastic</option>
                        <option value="biodegradable">Biodegradable</option>
                      </select>
                    </div>

                    <div className="ml-auto flex items-center space-x-1.5">
                      <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white/50 rounded-lg transition-colors">
                        <Layers className="h-3 w-3" />
                      </button>
                      <button className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-slate-700 bg-white/70 border border-slate-200/50 rounded-md hover:bg-white transition-colors shadow-sm">
                        <RefreshCw className="h-2.5 w-2.5 mr-1" />
                        Refresh
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                {viewMode === 'map' ? (
                  <div className="h-[600px] min-h-[600px]">
                    <TrashDepositsMap 
                      locations={filteredData}
                      onLocationSelect={handleLocationSelect}
                      selectedLocation={selectedLocation}
                      selectedTrashType={selectedTrashType}
                    />
                  </div>
                ) : (
                  // Compact chart view
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Compact Composition Chart */}
                      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-4 border border-slate-200/50">
                        <h4 className="font-medium text-slate-800 mb-3 text-sm">Trash Type Distribution</h4>
                        <div className="space-y-2">
                          {(() => {
                            const totals = filteredData.reduce((acc, item) => ({
                              cardboard: acc.cardboard + item.breakdown.cardboard,
                              glass: acc.glass + item.breakdown.glass,
                              metal: acc.metal + item.breakdown.metal,
                              paper: acc.paper + item.breakdown.paper,
                              plastic: acc.plastic + item.breakdown.plastic,
                              biodegradable: acc.biodegradable + item.breakdown.biodegradable
                            }), { cardboard: 0, glass: 0, metal: 0, paper: 0, plastic: 0, biodegradable: 0 });
                            
                            const grandTotal = Object.values(totals).reduce((sum, val) => sum + val, 0);
                            
                            return [
                              { type: 'Cardboard', count: totals.cardboard, percentage: ((totals.cardboard / grandTotal) * 100).toFixed(2), color: 'bg-blue-500', icon: getTrashTypeIcon('cardboard') },
                              { type: 'Glass', count: totals.glass, percentage: ((totals.glass / grandTotal) * 100).toFixed(2), color: 'bg-green-500', icon: getTrashTypeIcon('glass') },
                              { type: 'Metal', count: totals.metal, percentage: ((totals.metal / grandTotal) * 100).toFixed(2), color: 'bg-yellow-500', icon: getTrashTypeIcon('metal') },
                              { type: 'Paper', count: totals.paper, percentage: ((totals.paper / grandTotal) * 100).toFixed(2), color: 'bg-purple-500', icon: getTrashTypeIcon('paper') },
                              { type: 'Plastic', count: totals.plastic, percentage: ((totals.plastic / grandTotal) * 100).toFixed(2), color: 'bg-red-500', icon: getTrashTypeIcon('plastic') },
                              { type: 'Biodegradable', count: totals.biodegradable, percentage: ((totals.biodegradable / grandTotal) * 100).toFixed(2), color: 'bg-emerald-500', icon: getTrashTypeIcon('biodegradable') },
                            ];
                          })().map((item) => (
                            <div key={item.type} className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div className={`w-2.5 h-2.5 rounded-full ${item.color}`}></div>
                                <span className="text-blue-600">{item.icon}</span>
                                <span className="text-xs text-slate-800">{item.type}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-xs font-medium text-slate-800">{item.count}</span>
                                <span className="text-xs text-slate-500 ml-1">({item.percentage}%)</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Compact Area Comparison */}
                      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-4 border border-slate-200/50">
                        <h4 className="font-medium text-slate-800 mb-3 text-sm">Area Comparison</h4>
                        <div className="space-y-2">
                          {filteredData.length > 0 ? filteredData.map((area) => (
                            <div key={area.area} className="flex items-center justify-between">
                              <div>
                                <span className="text-xs font-medium text-slate-800">{area.area}</span>
                                <span className={`text-xs ml-1.5 px-1.5 py-0.5 rounded-full ${
                                  area.density === 'Very High' ? 'bg-red-100 text-red-800' :
                                  area.density === 'High' ? 'bg-orange-100 text-orange-800' :
                                  area.density === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {area.density}
                                </span>
                              </div>
                              <span className="text-xs font-bold text-slate-800">{area.totalItems}</span>
                            </div>
                          )) : (
                            <div className="text-center text-slate-500 py-4">
                              <p className="text-xs">No data matches current filters</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Compact Sidebar */}
          <div className="space-y-4">
            {/* Compact Area Details */}
            <div className="bg-gradient-to-br from-white/90 to-slate-50/80 backdrop-blur-sm rounded-xl border border-slate-200/50 shadow-lg">
              <div className="p-4 border-b border-slate-200/50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-semibold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">Area Details</h3>
                      <div className="relative">
                        <button
                          onClick={() => setShowDensityInfo(!showDensityInfo)}
                          onMouseEnter={() => setShowDensityInfo(true)}
                          onMouseLeave={() => setShowDensityInfo(false)}
                          className="text-gray-400 hover:text-gray-600 transition-colors p-0.5 rounded"
                          aria-label="Density information"
                        >
                          <FontAwesomeIcon icon={faInfoCircle} className="w-3 h-3" />
                        </button>
                        
                        {/* Density Info Popover */}
                        {showDensityInfo && (
                          <div className="absolute bottom-full left-0 mb-2 bg-gray-800 text-white text-xs rounded-md p-2 whitespace-nowrap z-[1001] shadow-lg">
                            <div className="space-y-1">
                              <div><strong>Very High:</strong> 1500+ items</div>
                              <div><strong>High:</strong> 1000-1499 items</div>
                              <div><strong>Medium:</strong> 500-999 items</div>
                              <div><strong>Low:</strong> 0-499 items</div>
                            </div>
                            {/* Arrow pointing down */}
                            <div className="absolute top-full left-2 border-4 border-transparent border-t-gray-800"></div>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 mt-0.5">
                      {filteredData.length > 0 ? `Showing ${paginatedData.length} of ${filteredData.length} areas` : 'No areas match current filters'}
                    </p>
                  </div>
                  {filteredData.length > ITEMS_PER_PAGE && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <FontAwesomeIcon icon={faChevronLeft} className="w-3 h-3" />
                      </button>
                      <span className="text-xs text-slate-600 font-medium">
                        {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <FontAwesomeIcon icon={faChevronRight} className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  {paginatedData.length > 0 ? paginatedData.map((area) => (
                    <div 
                      key={area.id} 
                      className={`border rounded-lg p-3 cursor-pointer transition-all duration-200 hover:shadow-md ${
                        selectedLocation?.id === area.id 
                          ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 shadow-md' 
                          : 'border-slate-200/50 hover:border-slate-300/50 bg-gradient-to-r from-white to-slate-50'
                      }`}
                      onClick={() => handleLocationSelect(area)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-slate-800 text-sm">{area.area}</h4>
                          <p className={`text-xs font-medium ${getDensityTextColor(area.density)} flex items-center mt-0.5`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${getDensityColor(area.density)} inline-block`}></span>
                            {area.density} Density
                          </p>
                        </div>
                        <span className="text-base font-bold text-slate-800">{area.totalItems}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-1.5 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600 flex items-center space-x-1">
                            <span className="text-blue-600">{getTrashTypeIcon('cardboard')}</span>
                            <span>Cardboard</span>
                          </span>
                          <span className="font-medium">{area.breakdown.cardboard}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600 flex items-center space-x-1">
                            <span className="text-green-600">{getTrashTypeIcon('glass')}</span>
                            <span>Glass</span>
                          </span>
                          <span className="font-medium">{area.breakdown.glass}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600 flex items-center space-x-1">
                            <span className="text-yellow-600">{getTrashTypeIcon('metal')}</span>
                            <span>Metal</span>
                          </span>
                          <span className="font-medium">{area.breakdown.metal}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600 flex items-center space-x-1">
                            <span className="text-purple-600">{getTrashTypeIcon('paper')}</span>
                            <span>Paper</span>
                          </span>
                          <span className="font-medium">{area.breakdown.paper}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600 flex items-center space-x-1">
                            <span className="text-red-600">{getTrashTypeIcon('plastic')}</span>
                            <span>Plastic</span>
                          </span>
                          <span className="font-medium">{area.breakdown.plastic}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600 flex items-center space-x-1">
                            <span className="text-emerald-600">{getTrashTypeIcon('biodegradable')}</span>
                            <span>Biodegradable</span>
                          </span>
                          <span className="font-medium">{area.breakdown.biodegradable}</span>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center text-slate-500 py-6">
                      <p className="text-sm mb-1">No areas found</p>
                      <p className="text-xs">Try adjusting your filters</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
}
