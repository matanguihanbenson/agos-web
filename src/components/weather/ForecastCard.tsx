'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WeatherForecast, DailyForecast, HourlyForecast } from '@/types/weather';
import { Calendar, Cloud, Droplets, Sun, CloudRain, ChevronDown, ChevronUp, CloudSnow, Zap, CloudDrizzle, Eye, Wind } from 'lucide-react';

interface ForecastCardProps {
  forecast: WeatherForecast;
}

export default function ForecastCard({ forecast }: ForecastCardProps) {
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getWeatherIcon = (condition: string, size: string = 'h-5 w-5') => {
    const normalizedCondition = condition.toLowerCase();
    
    // Storm/Thunderstorm
    if (normalizedCondition.includes('storm') || normalizedCondition.includes('thunder')) {
      return <Zap className={`${size} text-yellow-500`} />;
    }
    
    // Heavy Rain
    if (normalizedCondition.includes('heavy rain') || normalizedCondition.includes('downpour')) {
      return <CloudRain className={`${size} text-blue-600`} />;
    }
    
    // Light Rain/Drizzle
    if (normalizedCondition.includes('light rain') || normalizedCondition.includes('drizzle') || normalizedCondition.includes('sprinkle')) {
      return <CloudDrizzle className={`${size} text-blue-400`} />;
    }
    
    // General Rain
    if (normalizedCondition.includes('rain') || normalizedCondition.includes('shower')) {
      return <CloudRain className={`${size} text-blue-500`} />;
    }
    
    // Snow
    if (normalizedCondition.includes('snow') || normalizedCondition.includes('blizzard') || normalizedCondition.includes('flurr')) {
      return <CloudSnow className={`${size} text-blue-300`} />;
    }
    
    // Windy
    if (normalizedCondition.includes('wind') || normalizedCondition.includes('breezy') || normalizedCondition.includes('gusty')) {
      return <Wind className={`${size} text-slate-500`} />;
    }
    
    // Fog/Mist
    if (normalizedCondition.includes('fog') || normalizedCondition.includes('mist') || normalizedCondition.includes('haze')) {
      return <Eye className={`${size} text-slate-400`} />;
    }
    
    // Cloudy variations
    if (normalizedCondition.includes('overcast') || normalizedCondition.includes('cloudy')) {
      return <Cloud className={`${size} text-slate-500`} />;
    }
    
    // Partly Cloudy
    if (normalizedCondition.includes('partly') || normalizedCondition.includes('partial')) {
      return <Cloud className={`${size} text-slate-400`} />;
    }
    
    // Clear/Sunny (default)
    return <Sun className={`${size} text-yellow-500`} />;
  };

  const getWeatherIconBackground = (condition: string) => {
    const normalizedCondition = condition.toLowerCase();
    
    if (normalizedCondition.includes('storm') || normalizedCondition.includes('thunder')) {
      return 'bg-yellow-100';
    }
    if (normalizedCondition.includes('rain') || normalizedCondition.includes('shower') || normalizedCondition.includes('drizzle')) {
      return 'bg-blue-100';
    }
    if (normalizedCondition.includes('snow')) {
      return 'bg-blue-50';
    }
    if (normalizedCondition.includes('wind')) {
      return 'bg-slate-100';
    }
    if (normalizedCondition.includes('fog') || normalizedCondition.includes('mist')) {
      return 'bg-slate-50';
    }
    if (normalizedCondition.includes('cloud')) {
      return 'bg-slate-100';
    }
    
    return 'bg-yellow-100'; // sunny default
  };

  const getPrecipitationColor = (chance: number) => {
    if (chance >= 70) return 'text-blue-600 bg-blue-50';
    if (chance >= 40) return 'text-blue-500 bg-blue-50';
    return 'text-slate-500 bg-slate-50';
  };

  const toggleDayExpansion = (index: number) => {
    setExpandedDay(expandedDay === index ? null : index);
  };

  return (
    <Card className="shadow-lg bg-white/95 backdrop-blur-sm border-0">
      <CardHeader className="border-b border-slate-100/50 pb-2">
        <div className="flex items-center space-x-2">
          <div className="p-1 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-md">
            <Calendar className="h-3 w-3 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-sm text-slate-800">3-Day Forecast</CardTitle>
            <p className="text-xs text-slate-600">Tap for hourly details</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-2">
        <div className="space-y-1">
          {forecast.dailyForecasts.map((day: DailyForecast, index: number) => (
            <div key={day.date} className="group">
              {/* Daily Summary - More Compact */}
              <div 
                className="p-2 rounded-md border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all duration-200 cursor-pointer"
                onClick={() => toggleDayExpansion(index)}
              >
                <div className="flex items-center justify-between">
                  {/* Left: Date & Weather */}
                  <div className="flex items-center space-x-2 flex-1">
                    <div className="text-center min-w-[50px]">
                      <div className="font-semibold text-slate-800 text-xs">{formatDate(day.date)}</div>
                      <div className="text-xs text-slate-500">
                        {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1.5">
                      <div className={`p-1.5 ${getWeatherIconBackground(day.condition)} rounded-md group-hover:scale-105 transition-all duration-200`}>
                        {getWeatherIcon(day.condition, 'h-3 w-3')}
                      </div>
                      <div>
                        <div className="font-medium text-slate-800 text-xs">{day.condition}</div>
                        <div className="text-xs text-slate-500">Hourly</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right: Temperature & Precipitation */}
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <div className="flex items-baseline space-x-0.5">
                        <span className="text-sm font-bold text-slate-800">{Math.round(day.maxTemp)}°</span>
                        <span className="text-xs text-slate-500">/{Math.round(day.minTemp)}°</span>
                      </div>
                    </div>
                    
                    <div className={`px-1.5 py-0.5 rounded-full ${getPrecipitationColor(day.precipitationChance)} min-w-[40px] text-center`}>
                      <div className="flex items-center justify-center space-x-0.5">
                        <Droplets className="h-2 w-2" />
                        <span className="text-xs font-medium">{day.precipitationChance}%</span>
                      </div>
                    </div>
                    
                    <div className="p-0.5">
                      {expandedDay === index ? (
                        <ChevronUp className="h-3 w-3 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-3 w-3 text-slate-400" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Hourly Breakdown - More Compact */}
              {expandedDay === index && (
                <div className="mt-1 p-2 bg-gradient-to-br from-slate-50 to-blue-50 rounded-md border border-blue-100">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold text-slate-800">
                      {formatDate(day.date)} - 24h
                    </h4>
                    <div className="text-xs text-slate-600">
                      Temp & rain
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-1 max-h-32 overflow-y-auto">
                    {day.hourlyForecasts.map((hour: HourlyForecast, hourIndex: number) => (
                      <div key={hourIndex} className="bg-white rounded-md p-1.5 shadow-sm border border-white/50 hover:shadow-sm transition-all">
                        <div className="text-center space-y-0.5">
                          <div className="text-xs font-medium text-slate-700">
                            {hour.time.replace(':00', '')}
                          </div>
                          
                          <div className={`flex justify-center p-0.5 rounded ${getWeatherIconBackground(hour.condition)}`}>
                            {getWeatherIcon(hour.condition, 'h-2.5 w-2.5')}
                          </div>
                          
                          <div className="text-xs font-bold text-slate-800">
                            {Math.round(hour.temperature)}°
                          </div>
                          
                          <div className={`text-xs px-1 py-0.5 rounded-full ${getPrecipitationColor(hour.precipitationChance)}`}>
                            {hour.precipitationChance}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* More Compact Quick Summary */}
        <div className="mt-2 p-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-md border border-blue-100">
          <div className="text-center">
            <div className="text-xs font-medium text-slate-700 mb-1">3-Day Overview</div>
            <div className="flex justify-center space-x-4 text-xs text-slate-600">
              <div className="text-center">
                <div className="font-semibold text-slate-800 text-xs">
                  {Math.round(Math.max(...forecast.dailyForecasts.map(d => d.maxTemp)))}°C
                </div>
                <div>High</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-slate-800 text-xs">
                  {Math.round(Math.min(...forecast.dailyForecasts.map(d => d.minTemp)))}°C
                </div>
                <div>Low</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-slate-800 text-xs">
                  {Math.round(forecast.dailyForecasts.reduce((sum, d) => sum + d.precipitationChance, 0) / forecast.dailyForecasts.length)}%
                </div>
                <div>Rain</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}