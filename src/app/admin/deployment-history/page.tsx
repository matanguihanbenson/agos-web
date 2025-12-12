'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  ArrowRight,
  Ship,
  MapPin,
  Package,
  Weight,
  RefreshCw,
  AlertTriangle,
  Clock,
  Filter,
  Tag,
  Droplets,
  Gauge,
  Thermometer
} from 'lucide-react';
import { collection, query, onSnapshot, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

interface Deployment {
  id: string;
  river_id: string;
  river_name: string;
  bot_id: string;
  operation_lat: number;
  operation_lng: number;
  trash_collection: {
    total_items: number;
    total_weight: number;
    trash_by_type?: Record<string, number>;
  };
  water_quality?: {
    avg_ph_level?: number;
    avg_turbidity?: number;
    avg_temperature?: number;
    avg_dissolved_oxygen?: number;
  };
  ph_level?: number;
  turbidity?: number;
  temperature?: number;
  dissolved_oxygen?: number;
  status: string;
  owner_admin_id: string;
  created_at: any;
  deployment_date?: string;
}

interface GroupedDeployment {
  date: string;
  river_id: string;
  river_name: string;
  deployments: Deployment[];
  totalWeight: number;
  totalItems: number;
  botCount: number;
  avgPh?: number;
  avgTurbidity?: number;
  avgTemperature?: number;
  avgDissolvedOxygen?: number;
  hasWaterQuality: boolean;
}

export default function DeploymentHistory() {
  const router = useRouter();
  const { user } = useAuth();
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [allowedUserIds, setAllowedUserIds] = useState<string[]>([]);
  const [selectedRiver, setSelectedRiver] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('month');

  // Fetch admin's field operators
  useEffect(() => {
    if (!user?.uid) {
      setAllowedUserIds([]);
      return;
    }

    const userIds = [user.uid];
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('created_by', '==', user.uid));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fieldOperatorIds = snapshot.docs.map(doc => doc.id);
        setAllowedUserIds([...userIds, ...fieldOperatorIds]);
      }, (error) => {
        console.error('Error fetching field operators:', error);
        setAllowedUserIds(userIds);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up field operators listener:', error);
      setAllowedUserIds(userIds);
    }
  }, [user?.uid]);

  // Fetch deployments
  useEffect(() => {
    if (allowedUserIds.length === 0) {
      setLoading(false);
      return;
    }

    const deploymentsRef = collection(db, 'deployments');
    const q = query(
      deploymentsRef,
      where('owner_admin_id', 'in', allowedUserIds)
      // orderBy removed to avoid index requirement - sorting done client-side below
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const deploymentsData: Deployment[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        deploymentsData.push({
          id: doc.id,
          river_id: data.river_id,
          river_name: data.river_name,
          bot_id: data.bot_id,
          operation_lat: data.operation_lat,
          operation_lng: data.operation_lng,
          trash_collection: data.trash_collection || { total_items: 0, total_weight: 0 },
          water_quality: data.water_quality,
          ph_level: data.ph_level,
          turbidity: data.turbidity,
          temperature: data.temperature,
          dissolved_oxygen: data.dissolved_oxygen,
          status: data.status,
          owner_admin_id: data.owner_admin_id,
          created_at: data.created_at
        });
      });

      // Sort client-side since we removed orderBy from query
      deploymentsData.sort((a, b) => {
        const dateA = a.created_at?.toDate ? a.created_at.toDate() : new Date(a.created_at);
        const dateB = b.created_at?.toDate ? b.created_at.toDate() : new Date(b.created_at);
        return dateB.getTime() - dateA.getTime();
      });

      setDeployments(deploymentsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching deployments:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [allowedUserIds]);

  // Filter deployments by date
  const filteredDeployments = useMemo(() => {
    let filtered = deployments;

    // Filter by date
    if (dateFilter !== 'all') {
      const now = new Date();
      const startDate = new Date();

      switch (dateFilter) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(d => {
            const createdAt = d.created_at?.toDate ? d.created_at.toDate() : new Date(d.created_at);
            return createdAt >= startDate && createdAt <= now;
          });
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          filtered = filtered.filter(d => {
            const createdAt = d.created_at?.toDate ? d.created_at.toDate() : new Date(d.created_at);
            return createdAt >= startDate;
          });
          break;
        case 'month':
          startDate.setDate(now.getDate() - 30);
          filtered = filtered.filter(d => {
            const createdAt = d.created_at?.toDate ? d.created_at.toDate() : new Date(d.created_at);
            return createdAt >= startDate;
          });
          break;
      }
    }

    // Filter by river
    if (selectedRiver !== 'all') {
      filtered = filtered.filter(d => d.river_id === selectedRiver);
    }

    return filtered;
  }, [deployments, dateFilter, selectedRiver]);

  // Group deployments by date and river
  const groupedDeployments = useMemo(() => {
    const groups: GroupedDeployment[] = [];
    const groupMap = new Map<string, GroupedDeployment>();

    filteredDeployments.forEach(deployment => {
      const createdAt = deployment.created_at?.toDate ? deployment.created_at.toDate() : new Date(deployment.created_at);
      const year = createdAt.getFullYear();
      const month = String(createdAt.getMonth() + 1).padStart(2, '0');
      const day = String(createdAt.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const groupKey = `${dateStr}-${deployment.river_id}`;

      if (groupMap.has(groupKey)) {
        const group = groupMap.get(groupKey)!;
        group.deployments.push(deployment);
        group.totalWeight += deployment.trash_collection.total_weight || 0;
        group.totalItems += deployment.trash_collection.total_items || 0;
        const uniqueBots = new Set(group.deployments.map(d => d.bot_id).filter(Boolean));
        group.botCount = uniqueBots.size;
        
        // Recalculate water quality averages
        const wqData = group.deployments.filter(d => d.water_quality || d.ph_level || d.temperature);
        if (wqData.length > 0) {
          group.avgPh = wqData.reduce((sum, d) => sum + (d.water_quality?.avg_ph_level || d.ph_level || 0), 0) / wqData.length;
          group.avgTurbidity = wqData.reduce((sum, d) => sum + (d.water_quality?.avg_turbidity || d.turbidity || 0), 0) / wqData.length;
          group.avgTemperature = wqData.reduce((sum, d) => sum + (d.water_quality?.avg_temperature || d.temperature || 0), 0) / wqData.length;
          group.avgDissolvedOxygen = wqData.reduce((sum, d) => sum + (d.water_quality?.avg_dissolved_oxygen || d.dissolved_oxygen || 0), 0) / wqData.length;
          group.hasWaterQuality = true;
        }
      } else {
        const hasWQ = !!(deployment.water_quality || deployment.ph_level || deployment.temperature);
        const group: GroupedDeployment = {
          date: dateStr,
          river_id: deployment.river_id,
          river_name: deployment.river_name,
          deployments: [deployment],
          totalWeight: deployment.trash_collection.total_weight || 0,
          totalItems: deployment.trash_collection.total_items || 0,
          botCount: deployment.bot_id ? 1 : 0,
          avgPh: hasWQ ? (deployment.water_quality?.avg_ph_level || deployment.ph_level) : undefined,
          avgTurbidity: hasWQ ? (deployment.water_quality?.avg_turbidity || deployment.turbidity) : undefined,
          avgTemperature: hasWQ ? (deployment.water_quality?.avg_temperature || deployment.temperature) : undefined,
          avgDissolvedOxygen: hasWQ ? (deployment.water_quality?.avg_dissolved_oxygen || deployment.dissolved_oxygen) : undefined,
          hasWaterQuality: hasWQ
        };
        groupMap.set(groupKey, group);
        groups.push(group);
      }
    });

    return groups.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredDeployments]);

  // Get unique rivers for filter
  const uniqueRivers = useMemo(() => {
    const riverMap = new Map<string, string>();
    deployments.forEach(d => {
      if (d.river_id && d.river_name) {
        riverMap.set(d.river_id, d.river_name);
      }
    });
    return Array.from(riverMap.entries()).map(([id, name]) => ({ id, name }));
  }, [deployments]);

  const navigateToDetail = (groupKey: string) => {
    router.push(`/admin/deployment-history/${encodeURIComponent(groupKey)}`);
  };


  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const formatTime = (timestamp: any) => {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-4"></div>
          <p className="text-gray-600 font-medium">Loading deployment history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="bg-white/80 backdrop-blur-sm border-b border-blue-200/30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">Deployment History</h1>
              <p className="text-slate-600 text-sm">View detailed deployment records and trip data</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-slate-500 to-slate-600 text-white rounded-lg text-sm font-medium hover:from-slate-600 hover:to-slate-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-4 bg-gradient-to-br from-white/90 to-slate-50/80 backdrop-blur-sm rounded-xl border border-slate-200/50 p-4 shadow-lg">
            <div className="flex flex-wrap items-center gap-4">
              {/* Date Filter */}
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">Period:</span>
                <div className="flex gap-1">
                  {[
                    { id: 'today', label: 'Today' },
                    { id: 'week', label: 'Week' },
                    { id: 'month', label: 'Month' },
                    { id: 'all', label: 'All' }
                  ].map((period) => (
                    <button
                      key={period.id}
                      onClick={() => setDateFilter(period.id as 'today' | 'week' | 'month' | 'all')}
                      className={`px-2 py-1 text-xs rounded-md transition-all ${
                        dateFilter === period.id
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                      }`}
                    >
                      {period.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* River Filter */}
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">River:</span>
                <select
                  value={selectedRiver}
                  onChange={(e) => setSelectedRiver(e.target.value)}
                  className="px-2 py-1 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Rivers</option>
                  {uniqueRivers.map((river) => (
                    <option key={river.id} value={river.id}>{river.name}</option>
                  ))}
                </select>
              </div>

              {/* Summary */}
              <div className="ml-auto flex items-center gap-2 text-xs text-slate-600">
                <Filter className="h-3 w-3" />
                <span>{groupedDeployments.length} deployment group{groupedDeployments.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {groupedDeployments.length === 0 ? (
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-orange-800 mb-2">No Deployments Found</h3>
                <p className="text-orange-700 text-sm">
                  No deployment records match your current filters.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {groupedDeployments.map((group) => {
              const groupKey = `${group.date}-${group.river_id}`;

              return (
                <button
                  key={groupKey}
                  onClick={() => navigateToDetail(groupKey)}
                  className="w-full bg-white/90 backdrop-blur-sm rounded-xl border border-slate-200/50 shadow-lg overflow-hidden hover:shadow-xl hover:border-blue-300 transition-all group"
                >
                  <div className="p-5">
                    {/* Header Section */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                          <Calendar className="h-6 w-6 text-white" />
                        </div>
                        <div className="text-left">
                          <div className="font-bold text-slate-900 text-lg">{formatDate(group.date)}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <MapPin className="h-3 w-3 text-green-600" />
                            <span className="text-sm font-medium text-slate-600">{group.river_name}</span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs text-slate-500">{group.date}</span>
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all mt-2" />
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-4 gap-3 mb-4">
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
                        <div className="flex items-center gap-2 mb-1">
                          <Weight className="h-3 w-3 text-green-600" />
                          <span className="text-xs text-slate-600">Weight</span>
                        </div>
                        <div className="text-lg font-bold text-slate-900">{group.totalWeight.toFixed(2)}</div>
                        <div className="text-xs text-slate-500">kg</div>
                      </div>

                      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-3 border border-blue-200">
                        <div className="flex items-center gap-2 mb-1">
                          <Package className="h-3 w-3 text-blue-600" />
                          <span className="text-xs text-slate-600">Items</span>
                        </div>
                        <div className="text-lg font-bold text-slate-900">{group.totalItems}</div>
                        <div className="text-xs text-slate-500">collected</div>
                      </div>

                      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-3 border border-purple-200">
                        <div className="flex items-center gap-2 mb-1">
                          <Ship className="h-3 w-3 text-purple-600" />
                          <span className="text-xs text-slate-600">Bots</span>
                        </div>
                        <div className="text-lg font-bold text-slate-900">{group.botCount}</div>
                        <div className="text-xs text-slate-500">deployed</div>
                      </div>

                      <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-3 border border-orange-200">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="h-3 w-3 text-orange-600" />
                          <span className="text-xs text-slate-600">Trips</span>
                        </div>
                        <div className="text-lg font-bold text-slate-900">{group.deployments.length}</div>
                        <div className="text-xs text-slate-500">total</div>
                      </div>
                    </div>

                    {/* Water Quality Section */}
                    {group.hasWaterQuality && (
                      <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg p-3 border border-cyan-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Droplets className="h-3 w-3 text-cyan-600" />
                          <span className="text-xs font-semibold text-slate-700">Avg Water Quality</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {group.avgPh !== undefined && (
                            <div className="text-center">
                              <div className="text-sm font-bold text-blue-700">{group.avgPh.toFixed(2)}</div>
                              <div className="text-[10px] text-slate-600">pH</div>
                            </div>
                          )}
                          {group.avgTurbidity !== undefined && (
                            <div className="text-center">
                              <div className="text-sm font-bold text-amber-700">{group.avgTurbidity.toFixed(1)}</div>
                              <div className="text-[10px] text-slate-600">NTU</div>
                            </div>
                          )}
                          {group.avgTemperature !== undefined && (
                            <div className="text-center">
                              <div className="text-sm font-bold text-red-700">{group.avgTemperature.toFixed(1)}°C</div>
                              <div className="text-[10px] text-slate-600">Temp</div>
                            </div>
                          )}
                          {group.avgDissolvedOxygen !== undefined && (
                            <div className="text-center">
                              <div className="text-sm font-bold text-teal-700">{group.avgDissolvedOxygen.toFixed(2)}</div>
                              <div className="text-[10px] text-slate-600">DO mg/L</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
