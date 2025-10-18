import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { ref, onValue, off } from 'firebase/database';
import { db, realtimeDb } from '@/lib/firebase';

export interface Bot {
  id: string;
  name: string;
  status: string;
  location?: string;
  battery?: number;
  signal?: string;
  operator?: string;
  streamQuality: string;
  lastUpdate: string;
  organization: string;
  command: string;
  notes: string;
  created_at: Timestamp | Date | string;
  updated_at: Timestamp | Date | string;
  assigned_at?: Timestamp | Date | string;
  reassigned_at?: Timestamp | Date | string;
  stream_url?: string;
  realtimeData?: {
    lat?: number;
    lng?: number;
    mode?: string;
    status?: string;
    last_updated?: string;
  };
}

export function useBots(adminId: string | null) {
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!adminId) {
      setBots([]);
      setLoading(false);
      return;
    }

    const botsQuery = query(
      collection(db, 'bots'),
      where('owner_admin_id', '==', adminId)
    );

    const unsubscribeBots = onSnapshot(
      botsQuery,
      (snapshot) => {
        const botsData = snapshot.docs.map(doc => ({
          id: doc.data().bot_id,
          stream_url: doc.data().stream_url,
          ...doc.data()
        })) as Bot[];

        // Set up real-time listeners for each bot
        const realtimeUnsubscribers: (() => void)[] = [];
        
        botsData.forEach((bot) => {
          const realtimeRef = ref(realtimeDb, `bots/${bot.id}`);
          
          onValue(realtimeRef, (snapshot) => {
            const realtimeData = snapshot.val();
            
            setBots(prevBots => 
              prevBots.map(prevBot => 
                prevBot.id === bot.id 
                  ? { 
                      ...prevBot, 
                      realtimeData,
                      streamQuality: prevBot.stream_url ? 'HD 1080p' : 'N/A',
                      lastUpdate: prevBot.stream_url ? 'Live' : getLastUpdateText(prevBot.updated_at),
                      location: realtimeData?.lat && realtimeData?.lng 
                        ? `${realtimeData.lat.toFixed(3)}, ${realtimeData.lng.toFixed(3)}`
                        : prevBot.organization || 'Location unknown',
                      battery: Math.floor(Math.random() * 100) + 1,
                      signal: prevBot.stream_url ? 'Strong' : 'Offline'
                    }
                  : prevBot
              )
            );
          });
          
          realtimeUnsubscribers.push(() => off(realtimeRef));
        });

        // Initial set of bots data
        setBots(botsData.map(bot => ({
          ...bot,
          streamQuality: bot.stream_url ? 'HD 1080p' : 'N/A',
          lastUpdate: bot.stream_url ? 'Live' : getLastUpdateText(bot.updated_at),
          location: bot.organization || 'Location unknown',
          battery: Math.floor(Math.random() * 100) + 1,
          signal: bot.stream_url ? 'Strong' : 'Offline'
        })));
        
        setLoading(false);

        // Cleanup function for real-time listeners
        return () => {
          realtimeUnsubscribers.forEach(unsub => unsub());
        };
      },
      (error) => {
        console.error('Error fetching bots:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => {
      unsubscribeBots();
    };
  }, [adminId]);

  return { bots, loading, error };
}

function getLastUpdateText(timestamp: Timestamp | Date | string): string {
  if (!timestamp) return 'Unknown';
  
  const now = new Date();
  let updateTime: Date;
  
  if (timestamp instanceof Date) {
    updateTime = timestamp;
  } else if (typeof timestamp === 'string') {
    updateTime = new Date(timestamp);
  } else if ('toDate' in timestamp) {
    updateTime = timestamp.toDate();
  } else {
    return 'Unknown';
  }
  
  const diffMs = now.getTime() - updateTime.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  return `${diffDays} days ago`;
}
