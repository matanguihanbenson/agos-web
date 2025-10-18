'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Download,
  MapPin,
  BarChart3,
  TrendingUp,
  Ship,
  Gauge,
  Leaf,
  Settings,
  Calendar,
  RefreshCw,
  AlertTriangle,
  Droplets,
  PieChart as PieChartIcon,
  Target,
  Filter,
  Package
} from 'lucide-react';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TrashBreakdown {
  cardboard: number;
  glass: number;
  metal: number;
  paper: number;
  plastic: number;
  biodegradable: number;
  [key: string]: number;
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
  bot_id?: string;
  created_at?: any;
}

interface River {
  id: string;
  name: string;
  created_by: string;
}

interface Bot {
  id: string;
  bot_id: string;
  owner_admin_id: string;
  location?: {
    lat: number;
    lng: number;
  };
}

export default function AdminReports() {
  const { user } = useAuth();
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [rivers, setRivers] = useState<River[]>([]);
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [allowedUserIds, setAllowedUserIds] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('month');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedBots, setSelectedBots] = useState<string[]>([]);

  // Fetch admin's field operators to get allowed user IDs
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

  // Fetch rivers
  useEffect(() => {
    if (allowedUserIds.length === 0) {
      setRivers([]);
      return;
    }

    try {
      const riversRef = collection(db, 'rivers');
      const q = query(riversRef, where('created_by', 'in', allowedUserIds));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const riversData: River[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          riversData.push({
            id: doc.id,
            name: data.name,
            created_by: data.created_by
          });
        });

        setRivers(riversData);
      }, (error) => {
        console.error('Error fetching rivers:', error);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up rivers listener:', error);
    }
  }, [allowedUserIds]);

  // Fetch bots
  useEffect(() => {
    if (allowedUserIds.length === 0) {
      setBots([]);
      return;
    }

    try {
      const botsRef = collection(db, 'bots');
      const q = query(botsRef, where('owner_admin_id', 'in', allowedUserIds));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const botsData: Bot[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          botsData.push({
            id: doc.id,
            bot_id: data.bot_id,
            owner_admin_id: data.owner_admin_id,
            location: data.location
          });
        });

        setBots(botsData);
      }, (error) => {
        console.error('Error fetching bots:', error);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up bots listener:', error);
    }
  }, [allowedUserIds]);

  // Fetch deployments
  useEffect(() => {
    if (allowedUserIds.length === 0) {
      setLoading(false);
      return;
    }

    const deploymentsRef = collection(db, 'deployments');
    const q = query(deploymentsRef, where('owner_admin_id', 'in', allowedUserIds));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const deploymentsData: Deployment[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        deploymentsData.push({
          id: doc.id,
          river_id: data.river_id,
          river_name: data.river_name,
          operation_lat: data.operation_lat,
          operation_lng: data.operation_lng,
          trash_collection: data.trash_collection || { total_items: 0, total_weight: 0 },
          status: data.status,
          owner_admin_id: data.owner_admin_id,
          bot_id: data.bot_id,
          created_at: data.created_at
        });
      });

      setDeployments(deploymentsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching deployments:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [allowedUserIds]);

  // Filter deployments based on selected filters
  const filteredDeployments = useMemo(() => {
    let filtered = deployments;

    // Filter by date
    if (dateFilter !== 'custom') {
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
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          filtered = filtered.filter(d => {
            const createdAt = d.created_at?.toDate ? d.created_at.toDate() : new Date(d.created_at);
            return createdAt >= startDate;
          });
          break;
      }
    } else if (customDateRange.start && customDateRange.end) {
      const start = new Date(customDateRange.start);
      const end = new Date(customDateRange.end);
      end.setHours(23, 59, 59, 999);
      
      filtered = filtered.filter(d => {
        const createdAt = d.created_at?.toDate ? d.created_at.toDate() : new Date(d.created_at);
        return createdAt >= start && createdAt <= end;
      });
    }

    // Filter by areas
    if (selectedAreas.length > 0) {
      filtered = filtered.filter(d => selectedAreas.includes(d.river_id));
    }

    // Filter by bots
    if (selectedBots.length > 0) {
      filtered = filtered.filter(d => d.bot_id && selectedBots.includes(d.bot_id));
    }

    return filtered;
  }, [deployments, dateFilter, customDateRange, selectedAreas, selectedBots]);

  // Get only bots that have deployments
  const activeBots = useMemo(() => {
    const deployedBotIds = new Set(deployments.filter(d => d.bot_id).map(d => d.bot_id));
    return bots.filter(bot => deployedBotIds.has(bot.bot_id));
  }, [bots, deployments]);

  // Calculate summary data from filtered deployments
  const summaryData = useMemo(() => {
    if (!filteredDeployments.length) {
      return {
        totalWeight: 0,
        totalItems: 0,
        averageDaily: 0,
        trashBreakdown: {
          cardboard: 0,
          glass: 0,
          metal: 0,
          paper: 0,
          plastic: 0,
          biodegradable: 0
        },
        areaBreakdown: {},
        activeBots: 0,
        totalDeployments: 0
      };
    }

    const totalWeight = filteredDeployments.reduce((sum, d) => sum + (d.trash_collection.total_weight || 0), 0);
    const totalItems = filteredDeployments.reduce((sum, d) => sum + (d.trash_collection.total_items || 0), 0);

    // Aggregate trash types
    const trashTotals: TrashBreakdown = {
      cardboard: 0,
      glass: 0,
      metal: 0,
      paper: 0,
      plastic: 0,
      biodegradable: 0
    };

    filteredDeployments.forEach(deployment => {
      const trashByType = deployment.trash_collection.trash_by_type || {};
      Object.entries(trashByType).forEach(([type, count]) => {
        const normalizedType = type.toLowerCase();
        if (normalizedType in trashTotals) {
          trashTotals[normalizedType] += count;
        }
      });
    });

    // Aggregate by area
    const areaTotals: Record<string, number> = {};
    filteredDeployments.forEach(deployment => {
      if (deployment.river_name) {
        areaTotals[deployment.river_name] = (areaTotals[deployment.river_name] || 0) + (deployment.trash_collection.total_weight || 0);
      }
    });

    // Count unique bots
    const uniqueBots = new Set(filteredDeployments.filter(d => d.bot_id).map(d => d.bot_id));

    return {
      totalWeight,
      totalItems,
      averageDaily: filteredDeployments.length > 0 ? totalWeight / filteredDeployments.length : 0,
      trashBreakdown: trashTotals,
      areaBreakdown: areaTotals,
      activeBots: uniqueBots.size,
      totalDeployments: filteredDeployments.length
    };
  }, [filteredDeployments]);

  const refreshData = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const getDateRangeLabel = () => {
    switch (dateFilter) {
      case 'today': return 'Today';
      case 'week': return 'Last 7 days';
      case 'month': return 'Last 30 days';
      case 'year': return 'Last 365 days';
      case 'custom':
        if (customDateRange.start && customDateRange.end) {
          return `${customDateRange.start} to ${customDateRange.end}`;
        }
        return 'Custom period';
      default: return 'Last 30 days';
    }
  };

  // Colors for charts
  const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#f97316'];

  const formatNumber = (num: number): string => {
    return num.toFixed(2);
  };

  // Prepare data for Recharts
  const trashDistributionData = useMemo(() => {
    return Object.entries(summaryData.trashBreakdown).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: Number(formatNumber(value)),
      percentage: summaryData.totalWeight > 0 ? Number(formatNumber((value / summaryData.totalWeight) * 100)) : 0
    })).filter(item => item.value > 0);
  }, [summaryData]);

  const areaDistributionData = useMemo(() => {
    return Object.entries(summaryData.areaBreakdown)
      .map(([name, value]) => ({
        name,
        weight: Number(formatNumber(value))
      }))
      .sort((a, b) => b.weight - a.weight);
  }, [summaryData]);

  const reports = [
    {
      id: 'trash-classification',
      title: 'Trash Classification & Distribution',
      subtitle: `${getDateRangeLabel()} • ${summaryData.totalDeployments} deployments analyzed`,
      icon: PieChartIcon,
      color: 'blue',
      content: (
        <div className="p-4">
          {trashDistributionData.length > 0 ? (
            <>
              <div className="mb-4">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={trashDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {trashDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${formatNumber(value)}kg`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="space-y-2">
                {trashDistributionData.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}></div>
                      <span className="text-sm font-medium text-slate-800">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-slate-800">{item.value}kg</span>
                      <span className="text-slate-500 text-xs ml-1">({item.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-800">
                  <strong>Total Collected:</strong> {formatNumber(summaryData.totalWeight)}kg from {summaryData.totalDeployments} deployments
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-slate-500 text-sm">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No trash classification data available</p>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'collection-by-area',
      title: 'Collection by Area',
      subtitle: `${getDateRangeLabel()} • Distribution across ${Object.keys(summaryData.areaBreakdown).length} areas`,
      icon: MapPin,
      color: 'green',
      content: (
        <div className="p-4">
          {areaDistributionData.length > 0 ? (
            <>
              <div className="mb-4">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={areaDistributionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      height={80}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value: number) => `${formatNumber(value)}kg`} />
                    <Bar dataKey="weight" fill="#10b981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2">
                {areaDistributionData.slice(0, 5).map((area, i) => {
                  const maxWeight = areaDistributionData[0]?.weight || 1;
                  const percentage = (area.weight / maxWeight) * 100;
                  return (
                    <div key={area.name} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-700">{area.name}</span>
                        <span className="text-sm font-semibold text-slate-800">{area.weight}kg</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-slate-500 text-sm">
              <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No area data available</p>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'water-quality',
      title: 'Water Quality Monitoring',
      subtitle: `Active monitoring • ${rivers.length} rivers tracked`,
      icon: Droplets,
      color: 'cyan',
      content: (
        <div className="p-4">
          {rivers.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-green-700">Rivers Monitored</span>
                  </div>
                  <p className="text-2xl font-bold text-green-900">{rivers.length}</p>
                  <p className="text-xs text-green-600 mt-1">Active tracking</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-blue-700">Total Collection</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">{formatNumber(summaryData.totalWeight)}kg</p>
                  <p className="text-xs text-blue-600 mt-1">Waste removed</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Monitored Rivers</h4>
                {rivers.map((river) => {
                  const riverWeight = filteredDeployments
                    .filter(d => d.river_id === river.id)
                    .reduce((sum, d) => sum + (d.trash_collection.total_weight || 0), 0);
                  
                  return (
                    <div key={river.id} className="p-3 bg-slate-50 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-800 text-sm">{river.name}</p>
                          <p className="text-xs text-slate-500">{formatNumber(riverWeight)}kg collected</p>
                        </div>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                          Active
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-slate-500 text-sm">
              <Droplets className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No rivers monitored yet</p>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'top-polluted-areas',
      title: 'Top Polluted Spots',
      subtitle: `${getDateRangeLabel()} • High-density collection zones`,
      icon: Target,
      color: 'red',
      content: (
        <div className="p-4">
          {areaDistributionData.length > 0 ? (
            <>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-slate-800 text-sm flex items-center">
                    <Target className="h-4 w-4 mr-1.5 text-red-600" />
                    Hotspot Ranking
                  </h4>
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">High Priority</span>
                </div>
              </div>

              <div className="space-y-3">
                {areaDistributionData.slice(0, 5).map((area, i) => {
                  const densityLevels = ['Critical', 'Very High', 'High', 'Medium', 'Low'];
                  const densityColors = [
                    'bg-red-100 text-red-800 border-red-200',
                    'bg-orange-100 text-orange-800 border-orange-200',
                    'bg-yellow-100 text-yellow-800 border-yellow-200',
                    'bg-blue-100 text-blue-800 border-blue-200',
                    'bg-green-100 text-green-800 border-green-200'
                  ];
                  const bgGradients = [
                    'from-red-50 to-orange-50 border-red-200',
                    'from-orange-50 to-yellow-50 border-orange-200',
                    'from-yellow-50 to-amber-50 border-yellow-200',
                    'from-blue-50 to-cyan-50 border-blue-200',
                    'from-green-50 to-emerald-50 border-green-200'
                  ];
                  
                  const deploymentCount = filteredDeployments.filter(d => d.river_name === area.name).length;
                  
                  return (
                    <div key={area.name} className={`bg-gradient-to-r ${bgGradients[i]} border rounded-lg p-3`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center text-sm font-bold">
                            #{i + 1}
                          </div>
                          <div>
                            <h5 className="font-semibold text-slate-800 text-sm">{area.name}</h5>
                            <p className="text-xs text-slate-600">{deploymentCount} deployment{deploymentCount !== 1 ? 's' : ''}</p>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium border ${densityColors[i]}`}>
                          {densityLevels[i]}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-600">Total waste collected</span>
                        <span className="text-lg font-bold text-slate-800">{area.weight}kg</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-700">
                  <strong>Analysis:</strong> Top {Math.min(5, areaDistributionData.length)} areas by total waste collection. 
                  Higher rankings indicate more pollution detected.
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-slate-500 text-sm">
              <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No hotspot data available</p>
            </div>
          )}
        </div>
      )
    }
  ];


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-4"></div>
          <p className="text-gray-600 font-medium">Loading reports data...</p>
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
              <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">Reports & Analytics</h1>
              <p className="text-slate-600 text-sm">Environmental monitoring and system performance insights • {getDateRangeLabel()}</p>
              {summaryData && summaryData.totalWeight > 0 ? (
                <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                  <span>Total: {formatNumber(summaryData.totalWeight)}kg</span>
                  <span>•</span>
                  <span>{summaryData.totalItems.toLocaleString()} items</span>
                  <span>•</span>
                  <span>{summaryData.activeBots} active ships</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-2 text-xs text-orange-600">
                  <AlertTriangle className="h-3 w-3" />
                  <span>No deployment data available</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={refreshData}
                disabled={isRefreshing}
                className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-slate-500 to-slate-600 text-white rounded-lg text-sm font-medium hover:from-slate-600 hover:to-slate-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Comprehensive Filters */}
          <div className="mt-4 bg-gradient-to-br from-white/90 to-slate-50/80 backdrop-blur-sm rounded-xl border border-slate-200/50 p-4 shadow-lg">
            <div className="space-y-4">
              {/* Date Filter */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">Period:</span>
                </div>
                <div className="flex gap-1">
                  {[
                    { id: 'today', label: 'Today' },
                    { id: 'week', label: 'Week' },
                    { id: 'month', label: 'Month' },
                    { id: 'year', label: 'Year' },
                    { id: 'custom', label: 'Custom' }
                  ].map((period) => (
                    <button
                      key={period.id}
                      onClick={() => setDateFilter(period.id as 'today' | 'week' | 'month' | 'year' | 'custom')}
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

                {/* Custom Date Range */}
                {dateFilter === 'custom' && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="date"
                      value={customDateRange.start}
                      onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="px-2 py-1 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <span className="text-xs text-slate-500">to</span>
                    <input
                      type="date"
                      value={customDateRange.end}
                      onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="px-2 py-1 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>

              {/* Area Filter */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">Areas:</span>
                </div>
                <div className="flex gap-1 flex-wrap">
                  <button
                    onClick={() => setSelectedAreas([])}
                    className={`px-2 py-1 text-xs rounded-md transition-all ${
                      selectedAreas.length === 0
                        ? 'bg-green-600 text-white shadow-sm'
                        : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                    }`}
                  >
                    All Areas
                  </button>
                  {rivers.map((river) => (
                    <button
                      key={river.id}
                      onClick={() => {
                        setSelectedAreas(prev => 
                          prev.includes(river.id)
                            ? prev.filter(id => id !== river.id)
                            : [...prev, river.id]
                        );
                      }}
                      className={`px-2 py-1 text-xs rounded-md transition-all ${
                        selectedAreas.includes(river.id)
                          ? 'bg-green-600 text-white shadow-sm'
                          : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                      }`}
                    >
                      {river.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bot Filter */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center space-x-2">
                  <Ship className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">Ships:</span>
                </div>
                <div className="flex gap-1 flex-wrap">
                  <button
                    onClick={() => setSelectedBots([])}
                    className={`px-2 py-1 text-xs rounded-md transition-all ${
                      selectedBots.length === 0
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                    }`}
                  >
                    All Ships
                  </button>
                  {activeBots.map((bot) => (
                    <button
                      key={bot.id}
                      onClick={() => {
                        setSelectedBots(prev => 
                          prev.includes(bot.bot_id)
                            ? prev.filter(id => id !== bot.bot_id)
                            : [...prev, bot.bot_id]
                        );
                      }}
                      className={`px-2 py-1 text-xs rounded-md transition-all ${
                        selectedBots.includes(bot.bot_id)
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                      }`}
                    >
                      {bot.bot_id}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filter Summary */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Filter className="h-3 w-3" />
                  <span>
                    Showing {filteredDeployments.length} of {deployments.length} deployments
                    {selectedAreas.length > 0 && ` • ${selectedAreas.length} area${selectedAreas.length > 1 ? 's' : ''}`}
                    {selectedBots.length > 0 && ` • ${selectedBots.length} ship${selectedBots.length > 1 ? 's' : ''}`}
                  </span>
                </div>
                {(selectedAreas.length > 0 || selectedBots.length > 0 || dateFilter === 'custom') && (
                  <button
                    onClick={() => {
                      setSelectedAreas([]);
                      setSelectedBots([]);
                      setDateFilter('month');
                      setCustomDateRange({ start: '', end: '' });
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Empty State */}
        {(!summaryData || summaryData.totalWeight === 0) && (
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-8 mb-6 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-orange-800 mb-2">No Data Available</h3>
                <p className="text-orange-700 text-sm">
                  No deployment data found. Start collecting data with your autonomous fleet.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Reports Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {reports.map((report) => {
            const Icon = report.icon;
            return (
              <div key={report.id} className="bg-gradient-to-br from-white/90 to-slate-50/80 backdrop-blur-sm rounded-xl border border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="p-4 border-b border-slate-200/50">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <div className={`bg-${report.color}-100 p-2 rounded-lg`}>
                        <Icon className={`h-4 w-4 text-${report.color}-600`} />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">{report.title}</h3>
                        <p className="text-sm text-slate-600">{report.subtitle}</p>
                      </div>
                    </div>
                    <button 
                      className="text-blue-600 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                      title="Export Report"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {report.content}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
