# Firebase Data Structure for Reports Page

## Overview
This document outlines the Firebase Firestore collections and document structures needed to support the enhanced Reports Page functionality with dynamic data filtering and historical analytics.

## Collections Structure

### 1. `trash_collections` Collection
**Purpose**: Store individual trash collection events from bots with detailed classification data.

```typescript
interface TrashCollection {
  id: string;                    // Auto-generated document ID
  botId: string;                 // Reference to the collecting bot
  timestamp: Timestamp;          // When the collection occurred
  location: {
    area: string;                // e.g., "Calapan River", "Bucayao River"
    coordinates: {
      latitude: number;
      longitude: number;
    };
    zone?: string;               // Optional zone identifier
  };
  trashBreakdown: {
    cardboard: number;           // Weight in kg
    glass: number;
    metal: number;
    paper: number;
    plastic: number;
    biodegradable: number;
  };
  totalWeight: number;           // Total weight in kg
  totalItems: number;            // Total item count
  classification: {
    confidence: number;          // AI classification confidence (0-1)
    method: 'ai' | 'manual';     // How items were classified
  };
  weatherConditions?: {
    temperature: number;
    humidity: number;
    precipitation: boolean;
  };
  waterQuality?: {
    ph: number;
    dissolvedOxygen: number;
    turbidity: number;
    temperature: number;
  };
  images?: string[];             // URLs to collection images
  processed: boolean;            // Whether the collection has been processed
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 2. `bots` Collection
**Purpose**: Store bot information and operational data.

```typescript
interface Bot {
  id: string;                    // Bot identifier (e.g., "AGOS-001")
  name: string;                  // Human-readable name
  model: string;                 // Bot model/version
  status: 'active' | 'maintenance' | 'offline' | 'charging';
  location: {
    currentArea: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    assignedZones: string[];     // Areas this bot is assigned to
  };
  specifications: {
    capacity: number;            // Max weight capacity in kg
    batteryLife: number;         // Hours
    sensors: string[];           // Types of sensors equipped
  };
  operationalData: {
    totalCollections: number;
    totalWeight: number;         // Lifetime weight collected
    averageEfficiency: number;   // Percentage
    lastMaintenance: Timestamp;
    nextMaintenance: Timestamp;
  };
  deploymentDate: Timestamp;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 3. `daily_summaries` Collection
**Purpose**: Pre-aggregated daily data for faster querying and reporting.

```typescript
interface DailySummary {
  id: string;                    // Format: "YYYY-MM-DD"
  date: Timestamp;
  totalCollections: number;
  totalWeight: number;
  totalItems: number;
  areaBreakdown: {
    [areaName: string]: {
      collections: number;
      weight: number;
      items: number;
      trashBreakdown: {
        cardboard: number;
        glass: number;
        metal: number;
        paper: number;
        plastic: number;
        biodegradable: number;
      };
    };
  };
  botPerformance: {
    [botId: string]: {
      collections: number;
      weight: number;
      operationalHours: number;
      efficiency: number;
    };
  };
  averageWaterQuality: {
    ph: number;
    dissolvedOxygen: number;
    turbidity: number;
    temperature: number;
  };
  weatherSummary: {
    averageTemperature: number;
    averageHumidity: number;
    precipitationHours: number;
  };
  hotspots: Array<{
    area: string;
    coordinates: { latitude: number; longitude: number };
    density: 'low' | 'medium' | 'high' | 'very-high';
    itemCount: number;
  }>;
  processed: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 4. `water_quality_readings` Collection
**Purpose**: Detailed water quality monitoring data.

```typescript
interface WaterQualityReading {
  id: string;
  location: {
    area: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    monitoringStation?: string;
  };
  readings: {
    ph: number;
    dissolvedOxygen: number;      // mg/L
    turbidity: number;            // NTU
    temperature: number;          // Celsius
    conductivity?: number;        // μS/cm
    totalDissolvedSolids?: number; // ppm
  };
  qualityIndex: {
    overall: 'excellent' | 'good' | 'moderate' | 'poor' | 'critical';
    score: number;                // 0-100
  };
  alerts: Array<{
    parameter: string;
    level: 'warning' | 'critical';
    message: string;
  }>;
  sensorId?: string;
  timestamp: Timestamp;
  createdAt: Timestamp;
}
```

### 5. `pollution_hotspots` Collection
**Purpose**: AI-detected pollution concentration areas.

```typescript
interface PollutionHotspot {
  id: string;
  area: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  boundingBox?: {
    northEast: { latitude: number; longitude: number };
    southWest: { latitude: number; longitude: number };
  };
  density: 'low' | 'medium' | 'high' | 'very-high';
  detectionData: {
    totalItems: number;
    averageItemsPerCollection: number;
    dominantTrashType: string;
    confidenceScore: number;      // AI detection confidence
  };
  trend: {
    direction: 'increasing' | 'decreasing' | 'stable';
    percentage: number;           // Change over time period
    period: string;               // Time period for trend calculation
  };
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  lastDetected: Timestamp;
  firstDetected: Timestamp;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 6. `system_metrics` Collection
**Purpose**: Overall system performance and operational metrics.

```typescript
interface SystemMetrics {
  id: string;                    // Format: "YYYY-MM-DD-HH"
  timestamp: Timestamp;
  fleet: {
    totalBots: number;
    activeBots: number;
    botsInMaintenance: number;
    fleetEfficiency: number;      // Percentage
  };
  collections: {
    hourlyRate: number;           // Collections per hour
    totalWeight: number;
    totalItems: number;
  };
  areas: {
    totalMonitored: number;
    activeAreas: number;
    alertAreas: number;
  };
  alerts: {
    critical: number;
    warnings: number;
    resolved: number;
  };
  systemHealth: {
    overall: 'excellent' | 'good' | 'moderate' | 'poor' | 'critical';
    score: number;                // 0-100
    uptime: number;               // Percentage
  };
  createdAt: Timestamp;
}
```

## Query Patterns for Reports

### 1. Total Trash Collection Volume
```typescript
// Get collections for a time period
const getCollectionVolume = async (startDate: Date, endDate: Date) => {
  return await db.collection('trash_collections')
    .where('timestamp', '>=', startDate)
    .where('timestamp', '<=', endDate)
    .get();
};

// Get aggregated daily summaries for faster queries
const getDailySummaries = async (startDate: Date, endDate: Date) => {
  return await db.collection('daily_summaries')
    .where('date', '>=', startDate)
    .where('date', '<=', endDate)
    .orderBy('date', 'asc')
    .get();
};
```

### 2. Trash Classification Analysis
```typescript
// Get trash type breakdown by area and time
const getTrashClassification = async (area: string, startDate: Date, endDate: Date) => {
  return await db.collection('trash_collections')
    .where('location.area', '==', area)
    .where('timestamp', '>=', startDate)
    .where('timestamp', '<=', endDate)
    .get();
};
```

### 3. Bot Performance Analytics
```typescript
// Get bot performance data
const getBotPerformance = async (botId: string, startDate: Date, endDate: Date) => {
  return await db.collection('trash_collections')
    .where('botId', '==', botId)
    .where('timestamp', '>=', startDate)
    .where('timestamp', '<=', endDate)
    .get();
};
```

### 4. Historical Trend Analysis
```typescript
// Get historical data for trends
const getHistoricalData = async (period: 'day' | 'week' | 'month' | 'year') => {
  const endDate = new Date();
  const startDate = new Date();
  
  switch (period) {
    case 'day':
      startDate.setDate(endDate.getDate() - 30); // Last 30 days
      break;
    case 'week':
      startDate.setDate(endDate.getDate() - 84); // Last 12 weeks
      break;
    case 'month':
      startDate.setMonth(endDate.getMonth() - 12); // Last 12 months
      break;
    case 'year':
      startDate.setFullYear(endDate.getFullYear() - 5); // Last 5 years
      break;
  }
  
  return await db.collection('daily_summaries')
    .where('date', '>=', startDate)
    .where('date', '<=', endDate)
    .orderBy('date', 'asc')
    .get();
};
```

## Data Migration Strategy

### 1. Initial Data Population
```typescript
// Example: Populate historical data
const populateHistoricalData = async () => {
  const startDate = new Date('2024-01-01');
  const endDate = new Date();
  
  // Generate daily summaries for historical period
  for (let date = startDate; date <= endDate; date.setDate(date.getDate() + 1)) {
    const dailySummary: DailySummary = {
      id: date.toISOString().split('T')[0],
      date: Timestamp.fromDate(new Date(date)),
      // ... populate with historical data
    };
    
    await db.collection('daily_summaries').doc(dailySummary.id).set(dailySummary);
  }
};
```

### 2. Real-time Data Sync
```typescript
// Set up real-time listeners for live data updates
const setupRealtimeSync = () => {
  // Listen for new collections
  db.collection('trash_collections')
    .where('processed', '==', false)
    .onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          // Update daily summaries
          // Trigger report recalculations
        }
      });
    });
};
```

## Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Reports data - read access for authenticated users
    match /trash_collections/{document} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    
    match /daily_summaries/{document} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    
    match /bots/{document} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    
    match /water_quality_readings/{document} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    match /pollution_hotspots/{document} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    
    match /system_metrics/{document} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
  }
}
```

## Implementation Notes

1. **Indexes Required**: Create composite indexes for efficient querying:
   - `trash_collections`: `(timestamp, location.area)`
   - `trash_collections`: `(botId, timestamp)`
   - `daily_summaries`: `(date)`
   - `water_quality_readings`: `(timestamp, location.area)`

2. **Data Aggregation**: Use Cloud Functions to automatically generate daily summaries:
   ```typescript
   // Cloud Function to run daily at midnight
   exports.generateDailySummary = functions.pubsub
     .schedule('0 0 * * *')
     .timeZone('Asia/Manila')
     .onRun(async (context) => {
       // Aggregate previous day's data
     });
   ```

3. **Caching Strategy**: Implement caching for frequently accessed reports using Redis or Firestore subcollections.

4. **Data Retention**: Implement data lifecycle policies:
   - Keep detailed `trash_collections` for 1 year
   - Keep `daily_summaries` for 5 years
   - Archive older data to Cloud Storage

This structure provides a robust foundation for the enhanced Reports Page with historical data, dynamic filtering, and comprehensive analytics capabilities.