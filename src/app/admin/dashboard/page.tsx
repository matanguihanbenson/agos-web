'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import WeatherDashboard from '@/components/weather/WeatherDashboard';
import NotificationBell from '@/components/layout/NotificationBell';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Users,
  Settings,
  Plus,
  TrendingUp,
  MapPin,
  Droplets,
  Thermometer,
  Eye,
  Package,
  AlertTriangle,
  Activity,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import type { RiverMonitoringData, TrashHotspot } from '@/types';

interface Deployment {
  id: string;
  river_id: string;
  river_name: string;
  operation_lat: number;
  operation_lng: number;
  trash_collection: {
    total_items: number;
    total_weight: number;
  };
  status: string;
  owner_admin_id: string;
}

export default function AdminDashboard() {
  const { logout, user } = useAuth();
  const [riverData, setRiverData] = useState<RiverMonitoringData[]>([]);
  const [hotspots, setHotspots] = useState<TrashHotspot[]>([]);
  const [loading, setLoading] = useState(true);
  const [hotspotsLoading, setHotspotsLoading] = useState(true);
  const [allowedUserIds, setAllowedUserIds] = useState<string[]>([]);

  // Fetch active schedules from Firebase with real-time updates
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    try {
      // Query schedules collection for active schedules
      const schedulesRef = collection(db, 'schedules');
      const q = query(schedulesRef, where('status', '==', 'active'));
      
      // Use onSnapshot for real-time updates
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const activeRiverData: RiverMonitoringData[] = [];

        snapshot.forEach((doc) => {
          const schedule = doc.data();
          
          // Map schedule data to RiverMonitoringData format
          if (schedule.river_name || schedule.location) {
            activeRiverData.push({
              id: doc.id,
              name: schedule.river_name || schedule.name || 'Unknown River',
              location: {
                latitude: schedule.operation_area?.center?.latitude || schedule.location?.latitude || schedule.lat || 0,
                longitude: schedule.operation_area?.center?.longitude || schedule.location?.longitude || schedule.lng || 0
              },
              waterQuality: {
                ph: schedule.water_quality?.ph || 7.0,
                turbidity: schedule.water_quality?.turbidity || 0,
                temperature: schedule.water_quality?.temperature || 25,
                dissolvedOxygen: schedule.water_quality?.dissolved_oxygen || 0
              },
              trashCollection: {
                totalKg: schedule.trash_collected?.total_kg || 0,
                totalItems: schedule.trash_collected?.total_items || 0,
                todayKg: schedule.trash_collected?.today_kg || 0,
                todayItems: schedule.trash_collected?.today_items || 0
              },
              botId: schedule.bot_id || schedule.assigned_bot || 'N/A',
              lastUpdated: schedule.updated_at?.toDate?.() || schedule.started_at?.toDate?.() || new Date(),
              status: schedule.water_status || 'good'
            });
          }
        });

        setRiverData(activeRiverData);
        setLoading(false);
      }, (error) => {
        console.error('Error fetching active schedules:', error);
        setLoading(false);
      });

      // Cleanup subscription on unmount
      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up schedules listener:', error);
      setLoading(false);
    }
  }, [user?.uid]);

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

  // Fetch deployments and aggregate by river_id for hotspots
  useEffect(() => {
    if (allowedUserIds.length === 0) {
      setHotspotsLoading(false);
      return;
    }

    try {
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
        const aggregated = new Map<string, {
          river_id: string;
          river_name: string;
          totalItems: number;
          totalWeight: number;
          deploymentCount: number;
          lat: number;
          lng: number;
          lastItems: number; // For trend calculation
        }>();

        deployments.forEach((deployment) => {
          if (!deployment.river_id) return;

          const existing = aggregated.get(deployment.river_id);
          const items = deployment.trash_collection.total_items || 0;

          if (existing) {
            existing.totalItems += items;
            existing.totalWeight += deployment.trash_collection.total_weight || 0;
            existing.deploymentCount += 1;
            existing.lastItems = items; // Store last deployment items for trend
          } else {
            aggregated.set(deployment.river_id, {
              river_id: deployment.river_id,
              river_name: deployment.river_name,
              totalItems: items,
              totalWeight: deployment.trash_collection.total_weight || 0,
              deploymentCount: 1,
              lat: deployment.operation_lat,
              lng: deployment.operation_lng,
              lastItems: items
            });
          }
        });

        // Convert to TrashHotspot array and calculate density
        const hotspotsData: TrashHotspot[] = Array.from(aggregated.values()).map((agg) => {
          const avgItemsPerDeployment = agg.deploymentCount > 1 ? agg.totalItems / agg.deploymentCount : agg.totalItems;
          
          // Determine density based on total items
          let density: 'very-high' | 'high' | 'medium' | 'low';
          if (agg.totalItems >= 1500) density = 'very-high';
          else if (agg.totalItems >= 1000) density = 'high';
          else if (agg.totalItems >= 500) density = 'medium';
          else density = 'low';

          // Simple trend: compare last deployment to average
          let trend: 'increasing' | 'decreasing' | 'stable';
          if (agg.lastItems > avgItemsPerDeployment * 1.1) trend = 'increasing';
          else if (agg.lastItems < avgItemsPerDeployment * 0.9) trend = 'decreasing';
          else trend = 'stable';

          return {
            id: agg.river_id,
            name: agg.river_name,
            location: { latitude: agg.lat, longitude: agg.lng },
            density,
            itemCount: agg.totalItems,
            area: agg.river_name,
            lastUpdated: new Date(),
            trend
          };
        });

        // Sort by item count and get top 3
        const top3 = hotspotsData
          .sort((a, b) => b.itemCount - a.itemCount)
          .slice(0, 3);

        setHotspots(top3);
        setHotspotsLoading(false);
      }, (error) => {
        console.error('Error fetching deployments for hotspots:', error);
        setHotspotsLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up deployments listener:', error);
      setHotspotsLoading(false);
    }
  }, [allowedUserIds]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error: unknown) {
      console.error('Logout failed:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-50';
      case 'fair': return 'text-yellow-600 bg-yellow-50';
      case 'poor': return 'text-orange-600 bg-orange-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getDensityColor = (density: string) => {
    switch (density) {
      case 'very-high': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <ArrowUp className="h-3 w-3 text-red-500" />;
      case 'decreasing': return <ArrowDown className="h-3 w-3 text-green-500" />;
      case 'stable': return <Minus className="h-3 w-3 text-gray-500" />;
      default: return <Minus className="h-3 w-3 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white">
        <div className="mx-8 flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
          <div className="flex gap-6 md:gap-10">
            <div className="flex items-center space-x-3">
              <div className="flex h-12 w-12 items-center justify-center">
                <Image 
                  src="/img/app_launcher.png" 
                  alt="AGOS Logo" 
                  width={64} 
                  height={64}
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AGOS Admin Portal</h1>
                <p className="text-sm text-gray-600">System Management Dashboard</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-1 items-center justify-end space-x-4">
            <NotificationBell />
            <Button variant="ghost" size="icon" className="hover:bg-gray-100">
              <Settings className="h-4 w-4 text-gray-600" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full hover:bg-gray-100">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/avatars/01.png" alt="Admin" />
                    <AvatarFallback className="bg-blue-600 text-white">AD</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Admin User</p>
                    <p className="text-xs leading-none text-muted-foreground">admin@agos.com</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="mx-8 my-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Weather Dashboard - Full Width at Top */}
          <WeatherDashboard />

          {/* Top 3 Trash Density Hotspots and Quick Actions Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Top 3 Trash Density Hotspots - Left side (2/3 width) */}
            <div className="lg:col-span-2">
              <Card className="border border-gray-200 bg-white h-full">
                <CardHeader className="border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg text-gray-900 flex items-center">
                        <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                        Top 3 Trash Density Hotspots
                      </CardTitle>
                      <CardDescription className="text-gray-600">Critical areas requiring immediate attention</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" className="hover:bg-gray-50">
                      View All Hotspots
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {hotspotsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                        <p className="mt-2 text-sm text-gray-600">Loading hotspots...</p>
                      </div>
                    </div>
                  ) : hotspots.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <AlertTriangle className="h-10 w-10 text-gray-300 mb-3" />
                      <p className="text-sm text-gray-600">No hotspot data available</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {hotspots.map((hotspot, index) => (
                        <div 
                          key={hotspot.id} 
                          className={`border rounded-lg p-4 ${getDensityColor(hotspot.density)} transition-colors hover:border-gray-300`}
                        >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white shadow-sm">
                              <span className="text-xs font-bold text-gray-700">#{index + 1}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              {getTrendIcon(hotspot.trend)}
                            </div>
                          </div>
                          <span className="text-xs px-2 py-1 rounded-full bg-white/70 font-medium capitalize">
                            {hotspot.density.replace('-', ' ')}
                          </span>
                        </div>
                        <h4 className="font-semibold text-sm mb-2">{hotspot.name}</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs opacity-75">Items</span>
                            <span className="text-sm font-bold">{hotspot.itemCount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs opacity-75">Area</span>
                            <span className="text-xs">{hotspot.area}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs opacity-75">Trend</span>
                            <span className="text-xs capitalize flex items-center space-x-1">
                              {getTrendIcon(hotspot.trend)}
                              <span>{hotspot.trend}</span>
                            </span>
                          </div>
                        </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions - Right side (1/3 width) */}
            <div className="lg:col-span-1">
              <Card className="border border-gray-200 bg-white h-full">
                <CardHeader className="border-b border-gray-200">
                  <CardTitle className="text-lg text-gray-900">Quick Actions</CardTitle>
                  <CardDescription className="text-gray-600">Common administrative tasks</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 gap-3">
                    <Link href="/admin/user-bot-management/add-operator">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start h-11 hover:bg-gray-50 border-gray-200 group transition-colors"
                      >
                        <Users className="h-4 w-4 mr-3 text-blue-600" />
                        <span className="text-gray-700">Add Field Operator</span>
                      </Button>
                    </Link>
                    <Link href="/admin/user-bot-management/add-bot">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start h-11 hover:bg-gray-50 border-gray-200 group transition-colors"
                      >
                        <Plus className="h-4 w-4 mr-3 text-green-600" />
                        <span className="text-gray-700">Add New Bot</span>
                      </Button>
                    </Link>
                    <Link href="/admin/reports">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start h-11 hover:bg-gray-50 border-gray-200 group transition-colors"
                      >
                        <TrendingUp className="h-4 w-4 mr-3 text-purple-600" />
                        <span className="text-gray-700">View Reports</span>
                      </Button>
                    </Link>
                    <Link href="/admin/heatmaps">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start h-11 hover:bg-gray-50 border-gray-200 group transition-colors"
                      >
                        <MapPin className="h-4 w-4 mr-3 text-orange-600" />
                        <span className="text-gray-700">View Heatmap</span>
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Real-time River Monitoring */}
          <Card className="border border-gray-200 bg-white">
            <CardHeader className="border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-gray-900 flex items-center">
                    <Activity className="h-5 w-5 mr-2 text-blue-600" />
                    Real-time River Monitoring
                  </CardTitle>
                  <CardDescription className="text-gray-600">Live water quality and trash collection data</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-600 font-medium">Live</span>
                  </div>
                  <Button variant="outline" size="sm" className="hover:bg-gray-50">
                    View Details
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                    <p className="mt-4 text-sm text-gray-600">Loading active schedules...</p>
                  </div>
                </div>
              ) : riverData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Activity className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Schedules</h3>
                  <p className="text-sm text-gray-600 mb-6 max-w-md">
                    There are currently no active river monitoring schedules. 
                  </p>
               
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {riverData.map((river) => (
                  <div key={river.id} className="border border-gray-200 rounded-lg p-5 bg-white hover:border-gray-300 transition-colors">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">{river.name}</h3>
                        <p className="text-xs text-gray-500">Bot: {river.botId}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(river.status)}`}>
                        {river.status.toUpperCase()}
                      </span>
                    </div>

                    {/* Water Quality Metrics */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                        <Droplets className="h-4 w-4 mr-1 text-blue-500" />
                        Water Quality
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-blue-600">pH</span>
                            <Eye className="h-3 w-3 text-blue-400" />
                          </div>
                          <p className="text-lg font-bold text-blue-800">{river.waterQuality.ph}</p>
                        </div>
                        <div className="bg-cyan-50 rounded-lg p-3 border border-cyan-100">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-cyan-600">Turbidity</span>
                            <Eye className="h-3 w-3 text-cyan-400" />
                          </div>
                          <p className="text-lg font-bold text-cyan-800">{river.waterQuality.turbidity} NTU</p>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-orange-600">Temp</span>
                            <Thermometer className="h-3 w-3 text-orange-400" />
                          </div>
                          <p className="text-lg font-bold text-orange-800">{river.waterQuality.temperature}°C</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-green-600">DO</span>
                            <Droplets className="h-3 w-3 text-green-400" />
                          </div>
                          <p className="text-lg font-bold text-green-800">{river.waterQuality.dissolvedOxygen} mg/L</p>
                        </div>
                      </div>
                    </div>

                    {/* Trash Collection */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                        <Package className="h-4 w-4 mr-1 text-purple-500" />
                        Trash Collection
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-2 bg-purple-50 rounded-lg border border-purple-100">
                          <span className="text-xs text-purple-600">Total Weight</span>
                          <span className="text-sm font-bold text-purple-800">{river.trashCollection.totalKg} kg</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-indigo-50 rounded-lg border border-indigo-100">
                          <span className="text-xs text-indigo-600">Total Items</span>
                          <span className="text-sm font-bold text-indigo-800">{river.trashCollection.totalItems.toLocaleString()}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-center p-2 bg-emerald-50 rounded-lg border border-emerald-100">
                            <p className="text-xs text-emerald-600 mb-1">Today</p>
                            <p className="text-sm font-bold text-emerald-800">{river.trashCollection.todayKg} kg</p>
                            <p className="text-xs text-emerald-600">{river.trashCollection.todayItems} items</p>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-xs text-gray-600 mb-1">Updated</p>
                            <p className="text-xs text-gray-800 font-medium">
                              {new Date(river.lastUpdated).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}