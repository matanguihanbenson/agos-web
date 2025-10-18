'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  VideoOff,
  Maximize,
  Minimize,
  Circle,
  Download,
  Wifi,
  Battery,
  MapPin,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useBots, Bot } from '@/hooks/useBots';

// Add OvenPlayer type declaration
declare global {
  interface Window {
    OvenPlayer?: {
      create: (elementId: string, config: OvenPlayerConfig) => OvenPlayerInstance;
    };
  }
}

interface OvenPlayerConfig {
  sources: Array<{
    type: string;
    file: string;
  }>;
  autoStart?: boolean;
  mute?: boolean;
  controls?: boolean;
}

interface OvenPlayerInstance {
  play: () => void;
  pause: () => void;
  remove: () => void;
  mute: () => void;
  unmute: () => void;
  on: (event: string, callback: () => void) => void;
}

// OvenPlayer Video Component
function OvenPlayerVideo({ streamUrl }: {
  streamUrl: string;
}) {
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerInstanceRef = useRef<OvenPlayerInstance | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [ovenPlayerLoaded, setOvenPlayerLoaded] = useState(false);

  // Load OvenPlayer from CDN
  useEffect(() => {
    if ('OvenPlayer' in window) {
      setOvenPlayerLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/ovenplayer/dist/ovenplayer.min.js';
    script.onload = () => {
      console.log('OvenPlayer loaded from CDN');
      setOvenPlayerLoaded(true);
    };
    script.onerror = () => {
      console.error('Failed to load OvenPlayer from CDN');
      setError('Failed to load OvenPlayer library');
      setIsLoading(false);
    };
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Initialize OvenPlayer when ready
  useEffect(() => {
    if (!ovenPlayerLoaded || !streamUrl || !playerContainerRef.current) return;

    // Cleanup previous player instance
    if (playerInstanceRef.current) {
      try {
        playerInstanceRef.current.remove();
      } catch (err) {
        console.error('Error removing previous player:', err);
      }
      playerInstanceRef.current = null;
    }

    // Clear container
    if (playerContainerRef.current) {
      playerContainerRef.current.innerHTML = '';
    }

    setError(null);
    setIsLoading(true);

    try {
      // Create unique player ID
      const playerId = `oven-player-${Date.now()}`;

      // Create player div
      const playerDiv = document.createElement('div');
      playerDiv.id = playerId;
      playerDiv.style.width = '100%';
      playerDiv.style.height = '100%';
      playerContainerRef.current?.appendChild(playerDiv);

      // Determine source type and format URL
      const sourceType = 'webrtc';
      let sourceFile = streamUrl;

      // Convert HTTP URLs to WebSocket for WebRTC
      if (streamUrl.startsWith('http://') || streamUrl.startsWith('https://')) {
        // Use WSS for HTTPS sites (production), WS for HTTP sites (local development)
        const isSecure = window.location.protocol === 'https:';
        const wsProtocol = isSecure ? 'wss://' : 'ws://';

        sourceFile = streamUrl.replace(/^https?:\/\//, wsProtocol);
        if (!sourceFile.includes(':')) {
          sourceFile = sourceFile.replace(wsProtocol, wsProtocol) + ':3333';
        }

        console.log(`Converting ${streamUrl} to ${sourceFile} (secure: ${isSecure})`);
      }

      // Create OvenPlayer instance
      const player = window.OvenPlayer?.create(playerId, {
        sources: [{
          type: sourceType,
          file: sourceFile
        }],
        autoStart: true,
        mute: true,
        controls: false
      });

      if (player) {
        playerInstanceRef.current = player;

        // Set up event listeners
        player.on('ready', () => {
          console.log('OvenPlayer ready');
          setIsLoading(false);
          setError(null);
        });

        player.on('error', () => {
          console.error('OvenPlayer error');
          setError('Failed to load stream with OvenPlayer');
          setIsLoading(false);
        });

        player.on('stateChanged', () => {
          console.log('OvenPlayer state changed');
        });
      } else {
        throw new Error('Failed to create OvenPlayer instance');
      }

    } catch (err) {
      console.error('Error initializing OvenPlayer:', err);
      setError('Error initializing player: ' + (err instanceof Error ? err.message : 'Unknown error'));
      setIsLoading(false);
    }

    return () => {
      if (playerInstanceRef.current) {
        try {
          playerInstanceRef.current.remove();
        } catch (err) {
          console.error('Error cleaning up player:', err);
        }
        playerInstanceRef.current = null;
      }
    };
  }, [streamUrl, ovenPlayerLoaded]);

  // Retry functionality
  const retryStream = () => {
    console.log('Retrying stream...');
    setError(null);
    setIsLoading(true);

    if (playerInstanceRef.current) {
      try {
        playerInstanceRef.current.remove();
      } catch (err) {
        console.error('Error removing player during retry:', err);
      }
      playerInstanceRef.current = null;
    }

    // Trigger re-initialization
    setTimeout(() => {
      setOvenPlayerLoaded(prev => !prev);
      setTimeout(() => setOvenPlayerLoaded(true), 100);
    }, 1000);
  };

  return (
    <div className="relative w-full bg-black aspect-video">
      <div ref={playerContainerRef} className="w-full h-full" />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center text-white bg-black/70">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-white bg-black/70">
          <div className="text-center">
            <VideoOff className="h-12 w-12 mx-auto mb-2" />
            <p className="text-sm mb-3">{error}</p>
            <button
              onClick={retryStream}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
            >
              Retry Stream
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LiveVideoViewer() {
  const [selectedBot, setSelectedBot] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [mounted, setMounted] = useState(false);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  const { user, loading: authLoading } = useAuth();
  const { bots, loading: botsLoading, error } = useBots(user?.uid || null);

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);

    // Only start time updates after mounting to avoid hydration mismatch
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString());
    };

    // Set initial time
    updateTime();

    // Update time every second
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  // Set first bot as selected when bots are loaded
  useEffect(() => {
    if (bots.length > 0 && !selectedBot) {
      setSelectedBot(bots[0].id);
    }
  }, [bots, selectedBot]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement ||
        (document as unknown as { msFullscreenElement?: Element }).msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const currentBot = bots.find(bot => bot.id === selectedBot);

  const getStatusColor = (status: string) => {
    if (!status) return 'text-gray-600';
    switch (status.toLowerCase()) {
      case 'active':
      case 'idle': return 'text-green-600';
      case 'offline':
      case 'returning': return 'text-red-600';
      case 'maintenance': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusDot = (status: string) => {
    if (!status) return 'bg-gray-500';
    switch (status.toLowerCase()) {
      case 'active':
      case 'idle': return 'bg-green-500';
      case 'offline':
      case 'returning': return 'bg-red-500';
      case 'maintenance': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const isOnline = (bot: Bot | undefined) => {
    return bot?.stream_url && bot?.stream_url.trim() !== '';
  };

  // Handle fullscreen toggle
  const toggleFullscreen = async () => {
    if (!videoContainerRef.current) return;

    try {
      if (!isFullscreen) {
        // Enter fullscreen
        const element = videoContainerRef.current;
        if (element.requestFullscreen) {
          await element.requestFullscreen();
        } else if ((element as unknown as { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen) {
          await (element as unknown as { webkitRequestFullscreen: () => Promise<void> }).webkitRequestFullscreen();
        } else if ((element as unknown as { msRequestFullscreen?: () => Promise<void> }).msRequestFullscreen) {
          await (element as unknown as { msRequestFullscreen: () => Promise<void> }).msRequestFullscreen();
        }
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as unknown as { webkitExitFullscreen?: () => Promise<void> }).webkitExitFullscreen) {
          await (document as unknown as { webkitExitFullscreen: () => Promise<void> }).webkitExitFullscreen();
        } else if ((document as unknown as { msExitFullscreen?: () => Promise<void> }).msExitFullscreen) {
          await (document as unknown as { msExitFullscreen: () => Promise<void> }).msExitFullscreen();
        }
      }
    } catch (error) {
      console.error('Fullscreen toggle failed:', error);
    }
  };


  // Don't render anything until mounted to avoid hydration issues
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (authLoading || botsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading your bots...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">Error loading bots</p>
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (bots.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <VideoOff className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">No bots available</p>
          <p className="text-gray-500 text-sm">Contact support to get your bots assigned</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Live Video Viewer</h1>
              <p className="text-gray-600 text-sm">Monitor onboard cameras from AGOS bots in real-time</p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsRecording(!isRecording)}
                className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isRecording
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-gray-600 text-white hover:bg-gray-700'
                  }`}
              >
                <Circle className="h-3 w-3 mr-1" />
                {isRecording ? 'Stop Recording' : 'Start Recording'}
              </button>
              <button className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">
                <Download className="h-3 w-3 mr-1" />
                Export Stream
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Main Video Player */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="p-3 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusDot(currentBot?.realtimeData?.status || currentBot?.status || 'offline')} animate-pulse`}></div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">{currentBot?.name}</h3>
                      <div className="flex items-center space-x-3 text-xs text-gray-600">
                        <span>{currentBot?.id}</span>
                        <span>•</span>
                        <span>{currentBot?.location}</span>
                        <span>•</span>
                        <span className={getStatusColor(currentBot?.realtimeData?.status || currentBot?.status || 'offline')}>
                          {currentBot?.realtimeData?.status || currentBot?.status || 'offline'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {isRecording && (
                      <div className="flex items-center space-x-1 text-red-600">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-medium">REC</span>
                      </div>
                    )}
                    <span className="text-xs text-gray-600">{currentBot?.streamQuality}</span>
                  </div>
                </div>
              </div>

              {/* Video Player */}
              <div ref={videoContainerRef} className="relative bg-black aspect-video">
                {isOnline(currentBot) && currentBot && currentBot.stream_url ? (
                  <div className="absolute inset-0">
                    {/* OvenPlayer Video Component */}
                    <OvenPlayerVideo
                      streamUrl={currentBot.stream_url}
                    />

                    {/* Timestamp overlay */}
                    <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded z-10">
                      LIVE{currentTime && ` • ${currentTime}`}
                    </div>

                    {/* Bot info overlay */}
                    <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded z-10">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          <Battery className="h-3 w-3" />
                          <span>{currentBot.battery}%</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Wifi className="h-3 w-3" />
                          <span>{currentBot.signal}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>GPS Active</span>
                        </div>
                      </div>
                    </div>

                    {/* Stream URL display for debugging */}
                    <div className="absolute bottom-10 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded max-w-md z-10">
                      <div>Stream: {currentBot.stream_url}</div>
                      <div>Player: OvenPlayer</div>
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <VideoOff className="h-12 w-12 mx-auto mb-2" />
                      <p className="text-sm font-medium">Camera Offline</p>
                      <p className="text-xs">
                        {currentBot?.stream_url
                          ? 'Stream URL available but video not loading'
                          : 'No stream URL available'
                        }
                      </p>
                    </div>
                  </div>
                )}

                {/* Video Controls Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {/* Pause button removed */}
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={toggleFullscreen}
                        className="p-1.5 bg-white/20 hover:bg-white/30 rounded text-white transition-colors"
                        title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                      >
                        {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stream Info */}
              <div className="p-3 bg-gray-50">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-gray-600">Command:</span>
                    <span className="ml-1 font-medium text-gray-900">{currentBot?.command || 'No command'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Quality:</span>
                    <span className="ml-1 font-medium text-gray-900">{currentBot?.streamQuality}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Last Update:</span>
                    <span className="ml-1 font-medium text-gray-900">{currentBot?.lastUpdate}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Organization:</span>
                    <span className="ml-1 font-medium text-gray-900">
                      {currentBot?.organization || 'No organization assigned'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Detection Statistics */}
              <div className="p-3">
                <h3 className="text-base font-semibold text-gray-900 mb-3">Real-time Detection Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg shadow-sm border p-4">
                    <div className="text-xl font-bold text-blue-600">24</div>
                    <div className="text-xs text-gray-600">Items Detected</div>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm border p-4">
                    <div className="text-xl font-bold text-green-600">18</div>
                    <div className="text-xs text-gray-600">Successfully Collected</div>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm border p-4">
                    <div className="text-xl font-bold text-yellow-600">6</div>
                    <div className="text-xs text-gray-600">In Progress</div>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm border p-4">
                    <div className="text-xl font-bold text-purple-600">75%</div>
                    <div className="text-xs text-gray-600">Success Rate</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-base font-semibold text-gray-900">Available Cameras ({bots.length})</h3>
              </div>
              <div className="p-4">
                <div className="space-y-2">
                  {bots.map((bot) => (
                    <button
                      key={bot.id}
                      onClick={() => setSelectedBot(bot.id)}
                      className={`w-full text-left p-2 rounded border transition-colors ${selectedBot === bot.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${getStatusDot(bot.realtimeData?.status || bot.status)}`}></div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{bot.id}</p>
                            <p className="text-xs text-gray-600">{bot.name}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className={`text-xs font-medium ${getStatusColor(bot.realtimeData?.status || bot.status)}`}>
                            {bot.realtimeData?.status || bot.status}
                          </p>
                          <div className="flex items-center space-x-1 mt-0.5">
                            <Battery className="h-2.5 w-2.5 text-gray-400" />
                            <span className="text-xs text-gray-600">{bot.battery}%</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}