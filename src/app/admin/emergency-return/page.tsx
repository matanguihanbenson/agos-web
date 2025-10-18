'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  collection, 
  getDocs, 
  updateDoc, 
  doc, 
  query, 
  where,
  Timestamp 
} from 'firebase/firestore';
import { 
  ref, 
  get 
} from 'firebase/database';
import { db, realtimeDb } from '@/lib/firebase';
import { 
  ArrowLeft, 
  AlertTriangle, 
  MapPin, 
  Battery, 
  Clock, 
  CheckCircle, 
  XCircle,
  RotateCcw,
  Zap,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { notificationService } from '@/services/notificationService';

interface Bot {
  // Firestore metadata fields
  id: string;
  bot_id: string;
  name: string;
  organization: string;
  owner_admin_id: string;
  command: string;
  assigned_to: string;
  notes: string;
  created_at: Timestamp;
  updated_at: Timestamp;
  assigned_at?: Timestamp;
  
  // Realtime Database live fields
  active?: boolean;
  battery?: number;
  last_updated?: string;
  lat?: number;
  lng?: number;
  status?: 'online' | 'offline' | 'deployed' | 'returning' | 'idle' | 'maintenance' | 'emergency_return';
  
  // Computed fields for UI
  battery_level?: number;
  current_task?: string;
  operating_hours?: number;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  distance_from_base?: number;
  emergency_capable?: boolean;
  last_seen?: Date;
}

export default function EmergencyReturnPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [bots, setBots] = useState<Bot[]>([]);
  const [selectedBots, setSelectedBots] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [returning, setReturning] = useState<Set<string>>(new Set());

  // Reverse geocoding function to convert lat/lng to address
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`);
      if (response.ok) {
        const data = await response.json();
        
        // Extract a readable address from the OpenStreetMap response
        if (data.display_name) {
          return data.display_name;
        } else if (data.address) {
          // Build address from components
          const addressComponents = [];
          if (data.address.road) addressComponents.push(data.address.road);
          if (data.address.municipality) addressComponents.push(data.address.municipality);
          if (data.address.county) addressComponents.push(data.address.county);
          if (data.address.state) addressComponents.push(data.address.state);
          
          return addressComponents.length > 0 
            ? addressComponents.join(', ') 
            : `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        }
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  };

  useEffect(() => {
    const fetchBots = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching bots for user:', user.uid);
        
        // Step 1: Fetch bot metadata from Firestore
        const botsRef = collection(db, 'bots');
        const q = query(botsRef, where('owner_admin_id', '==', user.uid));
        const botsSnap = await getDocs(q);
        
        const userBots: Bot[] = [];
        
        // Step 2: Process each bot and fetch its live data from Realtime Database
        const fetchPromises = Array.from(botsSnap.docs).map(async (doc) => {
          const firestoreData = doc.data();
          console.log('Bot metadata from Firestore:', { id: doc.id, data: firestoreData });
          
          // Fetch live data from Realtime Database
          const realtimeBotRef = ref(realtimeDb, `bots/${firestoreData.bot_id}`);
          let realtimeData = null;
          
          try {
            const realtimeSnapshot = await get(realtimeBotRef);
            if (realtimeSnapshot.exists()) {
              realtimeData = realtimeSnapshot.val();
              console.log('Live data from Realtime DB:', { bot_id: firestoreData.bot_id, data: realtimeData });
            } else {
              console.log('No live data found for bot:', firestoreData.bot_id);
            }
          } catch (realtimeError) {
            console.error('Error fetching realtime data for bot:', firestoreData.bot_id, realtimeError);
          }
          
          // Get address from coordinates if available
          let address = null;
          if (realtimeData?.lat && realtimeData?.lng) {
            address = await reverseGeocode(realtimeData.lat, realtimeData.lng);
          }
          
          const bot: Bot = {
            // Firestore metadata
            id: doc.id,
            bot_id: firestoreData.bot_id || `BOT-${doc.id.slice(-6)}`,
            name: firestoreData.name || `Bot ${doc.id.slice(-4)}`,
            organization: firestoreData.organization || 'Unknown',
            owner_admin_id: firestoreData.owner_admin_id,
            command: firestoreData.command || 'idle',
            assigned_to: firestoreData.assigned_to || '',
            notes: firestoreData.notes || '',
            created_at: firestoreData.created_at,
            updated_at: firestoreData.updated_at,
            assigned_at: firestoreData.assigned_at,
            
            // Realtime Database live data
            active: realtimeData?.active ?? false,
            battery: realtimeData?.battery,
            last_updated: realtimeData?.last_updated,
            lat: realtimeData?.lat,
            lng: realtimeData?.lng,
            status: realtimeData?.status || firestoreData.status || 'idle',
            
            // Computed fields for UI
            battery_level: realtimeData?.battery || 0,
            location: realtimeData?.lat && realtimeData?.lng ? {
              lat: realtimeData.lat,
              lng: realtimeData.lng,
              address: address || undefined
            } : undefined,
            distance_from_base: realtimeData?.lat && realtimeData?.lng 
              ? Math.sqrt(Math.pow(realtimeData.lat - 14.5995, 2) + Math.pow(realtimeData.lng - 120.9842, 2)) * 111 // Rough km conversion
              : undefined,
            emergency_capable: true,
            last_seen: realtimeData?.last_updated ? new Date(realtimeData.last_updated) : undefined,
            current_task: realtimeData?.active ? 'Active in field' : 'Standby'
          };
          
          return bot;
        });
        
        const resolvedBots = await Promise.all(fetchPromises);
        userBots.push(...resolvedBots);

        console.log('Merged bot data:', userBots);
        setBots(userBots);
      } catch (error) {
        console.error('Error fetching bots:', error);
        notificationService.error('Failed to load bots');
      } finally {
        setLoading(false);
      }
    };

    fetchBots();
  }, [user?.uid]);

  const handleSelectBot = (botId: string) => {
    const newSelected = new Set(selectedBots);
    if (newSelected.has(botId)) {
      newSelected.delete(botId);
    } else {
      newSelected.add(botId);
    }
    setSelectedBots(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedBots.size === bots.length) {
      setSelectedBots(new Set());
    } else {
      setSelectedBots(new Set(bots.map(bot => bot.id)));
    }
  };

  const handleReturnBot = async (botId: string) => {
    setReturning(prev => new Set([...prev, botId]));
    
    try {
      console.log('Initiating return for bot:', botId);
      
      // Update bot status in Firebase
      const botRef = doc(db, 'bots', botId);
      await updateDoc(botRef, {
        status: 'returning',
        command: 'return',
        updated_at: Timestamp.now(),
        notes: 'Emergency return initiated due to weather alert'
      });
      
      // Update local state
      setBots(prev => prev.map(bot => 
        bot.id === botId 
          ? { ...bot, status: 'returning' as const, command: 'return' }
          : bot
      ));
      
      console.log('Bot return command sent successfully for:', botId);
      notificationService.success(`${bots.find(b => b.id === botId)?.name} return command sent successfully`);
    } catch (error) {
      console.error('Error sending return command:', error);
      notificationService.error('Failed to send return command');
    } finally {
      setReturning(prev => {
        const newSet = new Set(prev);
        newSet.delete(botId);
        return newSet;
      });
    }
  };

  const handleReturnSelected = async () => {
    if (selectedBots.size === 0) return;

    const promises = Array.from(selectedBots).map(botId => handleReturnBot(botId));
    
    try {
      await Promise.all(promises);
      setSelectedBots(new Set());
      notificationService.success(`${selectedBots.size} bots are returning to base`);
    } catch {
      notificationService.error('Some bots failed to receive return command');
    }
  };

  const getBatteryColor = (level: number) => {
    if (level > 60) return 'text-green-600';
    if (level > 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusColor = (status?: Bot['status']) => {
    switch (status) {
      case 'online': return 'bg-green-100 text-green-800';
      case 'offline': return 'bg-gray-100 text-gray-800';
      case 'returning': return 'bg-blue-100 text-blue-800';
      case 'emergency_return': return 'bg-orange-100 text-orange-800';
      case 'maintenance': return 'bg-purple-100 text-purple-800';
      case 'deployed': return 'bg-cyan-100 text-cyan-800';
      case 'idle': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status?: Bot['status']) => {
    switch (status) {
      case 'online': return <Wifi className="h-4 w-4" />;
      case 'offline': return <WifiOff className="h-4 w-4" />;
      case 'returning': 
      case 'emergency_return': return <RotateCcw className="h-4 w-4" />;
      case 'maintenance': return <XCircle className="h-4 w-4" />;
      case 'deployed': return <CheckCircle className="h-4 w-4" />;
      case 'idle': return <Clock className="h-4 w-4" />;
      default: return <WifiOff className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-red-600 font-medium">Loading emergency data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white  border-b-4 border-red-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back</span>
              </button>
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Emergency Bot Return</h1>
                  <p className="text-sm text-gray-600">Return bots to base immediately</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{bots.length} Bots Online</p>
                <p className="text-xs text-gray-600">{selectedBots.size} Selected</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Weather Alert Card */}
        {/* Action Buttons */}
        <div className="bg-white rounded-lg  p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleSelectAll}
                className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
              >
                {selectedBots.size === bots.length ? 'Deselect All' : 'Select All'}
              </button>
              
              <button
                onClick={handleReturnSelected}
                disabled={selectedBots.size === 0}
                className={`px-6 py-2 text-sm font-medium rounded-lg transition-colors ${
                  selectedBots.size > 0
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <RotateCcw className="h-4 w-4" />
                  <span>Return Selected ({selectedBots.size})</span>
                </div>
              </button>
            </div>

            <div className="text-sm text-gray-600">
              <span className="font-medium">Emergency Protocol Active</span>
            </div>
          </div>
        </div>

        {/* Bots Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bots.map((bot) => (
            <div
              key={bot.id}
              className={`bg-white rounded-lg  overflow-hidden transition-all duration-200 hover: ${
                selectedBots.has(bot.id) ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {/* Card Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedBots.has(bot.id)}
                      onChange={() => handleSelectBot(bot.id)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <h3 className="text-lg font-semibold text-gray-900">{bot.name}</h3>
                  </div>
                  
                  <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bot.status)}`}>
                    {getStatusIcon(bot.status)}
                    <span className="capitalize">{(bot.status || 'idle').replace('_', ' ')}</span>
                  </span>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-4 space-y-4">
                {/* Location */}
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{bot.location?.address || (bot.location ? `${bot.location.lat}, ${bot.location.lng}` : 'Location unknown')}</span>
                </div>

                {/* Current Task */}
                {bot.current_task && (
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">Task:</span> {bot.current_task}
                  </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Battery className={`h-4 w-4 ${getBatteryColor(bot.battery_level || 0)}`} />
                    <span className={`text-sm font-medium ${getBatteryColor(bot.battery_level || 0)}`}>
                      {bot.battery_level || 0}%
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {(bot.operating_hours || 0).toFixed(1)}h
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {(bot.distance_from_base || 0).toFixed(1)}km
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Zap className={`h-4 w-4 ${bot.emergency_capable ? 'text-green-500' : 'text-gray-400'}`} />
                    <span className={`text-sm ${bot.emergency_capable ? 'text-green-600' : 'text-gray-500'}`}>
                      {bot.emergency_capable ? 'Emergency' : 'Standard'}
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => handleReturnBot(bot.id)}
                  disabled={returning.has(bot.id) || bot.status === 'emergency_return' || bot.status === 'returning'}
                  className={`w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    bot.status === 'emergency_return' || bot.status === 'returning'
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : returning.has(bot.id)
                      ? 'bg-yellow-100 text-yellow-800 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {returning.has(bot.id) ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Sending Command...</span>
                    </div>
                  ) : bot.status === 'emergency_return' || bot.status === 'returning' ? (
                    <div className="flex items-center justify-center space-x-2">
                      <CheckCircle className="h-4 w-4" />
                      <span>Already Returning</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <RotateCcw className="h-4 w-4" />
                      <span>Return to Base</span>
                    </div>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* No Bots Message */}
        {bots.length === 0 && (
          <div className="text-center py-12">
            <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Bots Found</h3>
            <p className="text-gray-600">No bots are currently assigned to your account.</p>
          </div>
        )}
      </div>
    </div>
  );
}