'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Weight,
  Package,
  Ship,
  Clock,
  Tag,
  TrendingUp,
  Droplets,
  Gauge,
  Thermometer
} from 'lucide-react';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

interface Deployment {
  id: string;
  river_id: string;
  river_name: string;
  bot_id: string;
  bot_name?: string;
  operation_lat: number;
  operation_lng: number;
  operation_location?: string;
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
    sample_count?: number;
  };
  ph_level?: number;
  turbidity?: number;
  temperature?: number;
  dissolved_oxygen?: number;
  status: string;
  owner_admin_id: string;
  created_at: any;
  duration_minutes?: number;
  distance_traveled?: number;
}

interface BotTrips {
  botId: string;
  trips: Deployment[];
  totalWeight: number;
  totalItems: number;
}

export default function DeploymentDetail() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const groupKey = decodeURIComponent(params.groupKey as string);
  
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [allowedUserIds, setAllowedUserIds] = useState<string[]>([]);

  // Parse groupKey to extract date and river_id
  const [targetDate, targetRiverId] = useMemo(() => {
    const parts = groupKey.split('-');
    if (parts.length >= 4) {
      // Format: YYYY-MM-DD-riverId
      const date = `${parts[0]}-${parts[1]}-${parts[2]}`;
      const riverId = parts.slice(3).join('-');
      return [date, riverId];
    }
    return ['', ''];
  }, [groupKey]);

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

  // Fetch deployments for this specific date and river
  useEffect(() => {
    if (allowedUserIds.length === 0 || !targetDate || !targetRiverId) {
      setLoading(false);
      return;
    }

    const deploymentsRef = collection(db, 'deployments');
    const q = query(
      deploymentsRef,
      where('owner_admin_id', 'in', allowedUserIds),
      where('river_id', '==', targetRiverId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const deploymentsData: Deployment[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const createdAt = data.created_at?.toDate ? data.created_at.toDate() : new Date(data.created_at);
        const dateStr = createdAt.toISOString().split('T')[0];
        
        // Only include deployments from target date
        if (dateStr === targetDate) {
          deploymentsData.push({
            id: doc.id,
            river_id: data.river_id,
            river_name: data.river_name,
            bot_id: data.bot_id,
            bot_name: data.bot_name,
            operation_lat: data.operation_lat,
            operation_lng: data.operation_lng,
            operation_location: data.operation_location,
            trash_collection: data.trash_collection || { total_items: 0, total_weight: 0 },
            water_quality: data.water_quality,
            ph_level: data.ph_level,
            turbidity: data.turbidity,
            temperature: data.temperature,
            dissolved_oxygen: data.dissolved_oxygen,
            status: data.status,
            owner_admin_id: data.owner_admin_id,
            created_at: data.created_at,
            duration_minutes: data.duration_minutes,
            distance_traveled: data.distance_traveled
          });
        }
      });

      // Sort by time
      deploymentsData.sort((a, b) => {
        const dateA = a.created_at?.toDate ? a.created_at.toDate() : new Date(a.created_at);
        const dateB = b.created_at?.toDate ? b.created_at.toDate() : new Date(b.created_at);
        return dateA.getTime() - dateB.getTime();
      });

      setDeployments(deploymentsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching deployment details:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [allowedUserIds, targetDate, targetRiverId]);

  // Calculate summary stats
  const summary = useMemo(() => {
    const totalWeight = deployments.reduce((sum, d) => sum + (d.trash_collection.total_weight || 0), 0);
    const totalItems = deployments.reduce((sum, d) => sum + (d.trash_collection.total_items || 0), 0);
    const uniqueBots = new Set(deployments.map(d => d.bot_id).filter(Boolean)).size;
    const riverName = deployments[0]?.river_name || 'Unknown River';

    // Aggregate trash by type
    const trashByType: Record<string, number> = {};
    deployments.forEach(d => {
      if (d.trash_collection.trash_by_type) {
        Object.entries(d.trash_collection.trash_by_type).forEach(([type, count]) => {
          trashByType[type] = (trashByType[type] || 0) + count;
        });
      }
    });

    // Calculate average water quality from water_quality map or fallback to top-level fields
    const waterQualityData = deployments.filter(d => d.water_quality || d.ph_level || d.temperature || d.turbidity || d.dissolved_oxygen);
    const avgPh = waterQualityData.length > 0 
      ? waterQualityData.reduce((sum, d) => sum + (d.water_quality?.avg_ph_level || d.ph_level || 0), 0) / waterQualityData.length 
      : null;
    const avgTurbidity = waterQualityData.length > 0
      ? waterQualityData.reduce((sum, d) => sum + (d.water_quality?.avg_turbidity || d.turbidity || 0), 0) / waterQualityData.length
      : null;
    const avgTemperature = waterQualityData.length > 0
      ? waterQualityData.reduce((sum, d) => sum + (d.water_quality?.avg_temperature || d.temperature || 0), 0) / waterQualityData.length
      : null;
    const avgDissolvedOxygen = waterQualityData.length > 0
      ? waterQualityData.reduce((sum, d) => sum + (d.water_quality?.avg_dissolved_oxygen || d.dissolved_oxygen || 0), 0) / waterQualityData.length
      : null;

    return { totalWeight, totalItems, uniqueBots, riverName, trashByType, avgPh, avgTurbidity, avgTemperature, avgDissolvedOxygen, hasWaterQuality: waterQualityData.length > 0 };
  }, [deployments]);

  // Group trips by bot
  const botTrips = useMemo<BotTrips[]>(() => {
    const botMap = new Map<string, Deployment[]>();
    
    deployments.forEach(d => {
      if (d.bot_id) {
        if (!botMap.has(d.bot_id)) {
          botMap.set(d.bot_id, []);
        }
        botMap.get(d.bot_id)!.push(d);
      }
    });

    const result: BotTrips[] = [];
    botMap.forEach((trips, botId) => {
      const totalWeight = trips.reduce((sum, t) => sum + (t.trash_collection.total_weight || 0), 0);
      const totalItems = trips.reduce((sum, t) => sum + (t.trash_collection.total_items || 0), 0);
      result.push({ botId, trips, totalWeight, totalItems });
    });

    return result;
  }, [deployments]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
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
          <p className="text-gray-600 font-medium">Loading deployment details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-blue-200/30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 mb-3 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Deployment History
          </button>
          
          <div className="flex items-center gap-3">
            <Calendar className="h-6 w-6 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-slate-900">{formatDate(targetDate)}</h1>
              <p className="text-sm text-slate-600 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {summary.riverName}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-white to-slate-50 rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <Weight className="h-5 w-5 text-green-600" />
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{summary.totalWeight.toFixed(2)}kg</div>
            <div className="text-xs text-slate-500">Total Weight Collected</div>
          </div>

          <div className="bg-gradient-to-br from-white to-blue-50 rounded-xl border border-blue-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{summary.totalItems}</div>
            <div className="text-xs text-slate-500">Total Items Collected</div>
          </div>

          <div className="bg-gradient-to-br from-white to-purple-50 rounded-xl border border-purple-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <Ship className="h-5 w-5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{summary.uniqueBots}</div>
            <div className="text-xs text-slate-500">Bots Deployed</div>
          </div>

          <div className="bg-gradient-to-br from-white to-orange-50 rounded-xl border border-orange-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{deployments.length}</div>
            <div className="text-xs text-slate-500">Total Trips</div>
          </div>
        </div>

        {/* Trash Type Breakdown */}
        {Object.keys(summary.trashByType).length > 0 && (
          <div className="bg-white/90 rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Tag className="h-4 w-4 text-blue-600" />
              Trash Type Breakdown
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {Object.entries(summary.trashByType).map(([type, count]) => (
                <div key={type} className="bg-slate-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-slate-900">{count}</div>
                  <div className="text-xs text-slate-600 capitalize">{type}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Water Quality Data */}
        {summary.hasWaterQuality && (
          <div className="bg-white/90 rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Droplets className="h-4 w-4 text-cyan-600" />
              Average Water Quality
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {summary.avgPh !== null && (
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Droplets className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-slate-600 font-medium">pH Level</div>
                      <div className="text-2xl font-bold text-slate-900">{summary.avgPh.toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500">
                    {summary.avgPh < 6.5 ? 'Acidic' : summary.avgPh > 8.5 ? 'Alkaline' : 'Neutral'}
                  </div>
                </div>
              )}
              {summary.avgTurbidity !== null && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                      <Gauge className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-slate-600 font-medium">Turbidity</div>
                      <div className="text-2xl font-bold text-slate-900">{summary.avgTurbidity.toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500">NTU</div>
                </div>
              )}
              {summary.avgTemperature !== null && (
                <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-lg p-4 border border-red-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <Thermometer className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-slate-600 font-medium">Temperature</div>
                      <div className="text-2xl font-bold text-slate-900">{summary.avgTemperature.toFixed(1)}°C</div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500">
                    {summary.avgTemperature < 15 ? 'Cold' : summary.avgTemperature > 30 ? 'Warm' : 'Moderate'}
                  </div>
                </div>
              )}
              {summary.avgDissolvedOxygen !== null && (
                <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-lg p-4 border border-teal-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                      <Droplets className="h-5 w-5 text-teal-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-slate-600 font-medium">Dissolved O₂</div>
                      <div className="text-2xl font-bold text-slate-900">{summary.avgDissolvedOxygen.toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500">mg/L</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bot Timeline */}
        <div className="bg-white/90 rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Trip Timeline by Bot</h3>
          
          {botTrips.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No trips recorded for this deployment.</p>
          ) : (
            <div className="space-y-6">
              {botTrips.map((bot) => (
                <div key={bot.botId} className="relative">
                  {/* Bot Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                      <Ship className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900">{bot.botId}</div>
                      <div className="text-xs text-slate-500">{bot.trips.length} trip{bot.trips.length !== 1 ? 's' : ''} • {bot.totalWeight.toFixed(2)}kg • {bot.totalItems} items</div>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="ml-5 border-l-2 border-slate-200 pl-6 space-y-4">
                    {bot.trips.map((trip, idx) => (
                      <div key={trip.id} className="relative">
                        {/* Timeline dot */}
                        <div className="absolute -left-[29px] top-1 w-4 h-4 rounded-full bg-blue-500 border-2 border-white"></div>
                        
                        {/* Trip Card */}
                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3 text-slate-500" />
                              <span className="text-xs font-medium text-slate-700">Trip #{idx + 1}</span>
                              <span className="text-xs text-slate-500">{formatTime(trip.created_at)}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1 text-xs">
                                <Weight className="h-3 w-3 text-green-600" />
                                <span className="font-semibold text-slate-800">{trip.trash_collection.total_weight?.toFixed(2) || 0}kg</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs">
                                <Package className="h-3 w-3 text-blue-600" />
                                <span className="font-semibold text-slate-800">{trip.trash_collection.total_items || 0}</span>
                              </div>
                            </div>
                          </div>

                          {/* Trash Types */}
                          {trip.trash_collection.trash_by_type && Object.keys(trip.trash_collection.trash_by_type).length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {Object.entries(trip.trash_collection.trash_by_type).map(([type, count]) => (
                                <div key={type} className="inline-flex items-center gap-1 text-xs bg-white rounded px-2 py-1 border border-slate-200">
                                  <Tag className="h-2 w-2 text-blue-600" />
                                  <span className="text-slate-700 capitalize">{type}:</span>
                                  <span className="font-semibold text-slate-800">{count}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Water Quality Data */}
                          {(trip.water_quality || trip.ph_level || trip.temperature || trip.turbidity || trip.dissolved_oxygen) && (
                            <div className="mt-3 pt-3 border-t border-slate-200">
                              <div className="flex items-center gap-2 mb-2">
                                <Droplets className="h-3 w-3 text-cyan-600" />
                                <span className="text-xs font-medium text-slate-700">Water Quality</span>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {(trip.water_quality?.avg_ph_level !== undefined || trip.ph_level !== undefined) && (
                                  <div className="bg-blue-50 rounded px-2 py-1 text-center border border-blue-200">
                                    <div className="text-xs text-blue-600 font-medium">{(trip.water_quality?.avg_ph_level || trip.ph_level || 0).toFixed(2)}</div>
                                    <div className="text-[10px] text-slate-600">pH</div>
                                  </div>
                                )}
                                {(trip.water_quality?.avg_turbidity !== undefined || trip.turbidity !== undefined) && (
                                  <div className="bg-amber-50 rounded px-2 py-1 text-center border border-amber-200">
                                    <div className="text-xs text-amber-600 font-medium">{(trip.water_quality?.avg_turbidity || trip.turbidity || 0).toFixed(2)}</div>
                                    <div className="text-[10px] text-slate-600">NTU</div>
                                  </div>
                                )}
                                {(trip.water_quality?.avg_temperature !== undefined || trip.temperature !== undefined) && (
                                  <div className="bg-red-50 rounded px-2 py-1 text-center border border-red-200">
                                    <div className="text-xs text-red-600 font-medium">{(trip.water_quality?.avg_temperature || trip.temperature || 0).toFixed(1)}°C</div>
                                    <div className="text-[10px] text-slate-600">Temp</div>
                                  </div>
                                )}
                                {(trip.water_quality?.avg_dissolved_oxygen !== undefined || trip.dissolved_oxygen !== undefined) && (
                                  <div className="bg-teal-50 rounded px-2 py-1 text-center border border-teal-200">
                                    <div className="text-xs text-teal-600 font-medium">{(trip.water_quality?.avg_dissolved_oxygen || trip.dissolved_oxygen || 0).toFixed(2)}</div>
                                    <div className="text-[10px] text-slate-600">DO mg/L</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
