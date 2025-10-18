# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**AGOS (Autonomous Garbage-cleaning Operation System)** is a comprehensive Next.js web platform for managing autonomous river cleanup boats and environmental monitoring. The system combines real-time bot control, AI-powered trash detection, water quality monitoring, and data analytics to support environmental conservation efforts.

## Architecture & Key Components

### Application Structure
- **Next.js 15.3.5** with App Router (`src/app/`)
- **TypeScript** with strict mode enabled
- **Firebase** integration for authentication, Firestore database, and real-time updates
- **shadcn/ui** component library with Radix UI primitives
- **Tailwind CSS 4.0** for styling with custom theming

### Core Directories
```
src/
├── app/                     # Next.js App Router pages
│   ├── admin/              # Protected admin dashboard pages
│   ├── layout.tsx          # Root layout with AuthProvider
│   └── page.tsx            # Public landing page
├── components/             
│   ├── ui/                 # Base UI components (shadcn/ui)
│   └── weather/            # Weather dashboard components
├── contexts/               # React Context providers
│   └── AuthContext.tsx    # Firebase authentication context
├── hooks/                  # Custom React hooks
├── lib/                    # Utility libraries
│   ├── firebase.ts        # Firebase configuration
│   └── utils.ts           # Utility functions
├── services/               # API service layers
│   └── weatherService.ts  # Weather data integration
├── types/                  # TypeScript type definitions
│   ├── index.ts           # Core app types (User, Bot, TrashDeposit, etc.)
│   └── weather.ts         # Weather-specific types
└── utils/                  # Additional utilities
```

### Authentication & Authorization
- **Firebase Authentication** with email/password
- **Role-based access control**: Admin, Field Operator, Supervisor
- **Protected routes** using AuthContext with route guards
- **User data synchronization** between Firebase Auth and Firestore

### Data Architecture
- **Firebase Firestore** for structured data (users, bots, trash deposits)
- **Firebase Realtime Database** for live telemetry data
- **Firebase Storage** for images and file uploads
- **TypeScript interfaces** defining data contracts in `src/types/`

### Key Data Models
```typescript
// Core entities with comprehensive type definitions
interface Bot {
  id: string;
  name: string;
  status: 'active' | 'charging' | 'maintenance' | 'offline';
  location: { latitude: number; longitude: number; address: string };
  battery: number;
  sensors: { camera: boolean; waterQuality: boolean; gps: boolean };
  // ... full definitions in src/types/index.ts
}

interface TrashDeposit {
  area: string;
  coordinates: [number, number];
  breakdown: { plasticBottles: number; foodContainers: number; /* ... */ };
  density: 'low' | 'medium' | 'high' | 'very_high';
}
```

## Development Commands

### Core Development
```bash
# Start development server
npm run dev
# Access at http://localhost:3000

# Production build
npm run build

# Start production server
npm run start

# Run ESLint
npm run lint
```

### Firebase Setup
```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in project (if needed)
firebase init

# Deploy Firebase functions/hosting (if configured)
firebase deploy
```

## Environment Configuration

### Required Environment Variables (.env.local)
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_DATABASE_URL=your_database_url
NEXT_PUBLIC_WEATHER_API_KEY=your_weather_api_key
```

## Component Architecture Patterns

### UI Component Structure
- **Base UI components** in `src/components/ui/` using shadcn/ui conventions
- **Feature-specific components** organized by domain (e.g., weather components)
- **Consistent prop patterns** with TypeScript interfaces
- **Responsive design** using Tailwind CSS utilities

### State Management Patterns
- **React Context** for authentication and global state
- **Custom hooks** for data fetching and business logic
- **Service layer pattern** for external API integrations
- **Firebase real-time listeners** for live data updates

### Authentication Flow
```typescript
// AuthContext provides centralized auth state
const { user, userData, loading, login, logout } = useAuth();

// Route protection pattern in admin layout
useEffect(() => {
  if (!loading && !user && !isLoginPage) {
    router.push('/admin/login');
  }
}, [user, loading, isLoginPage, router]);
```

## Admin Dashboard Features

### Navigation Structure
- **Dashboard**: System overview, river monitoring, weather integration
- **User & Bot Management**: Operator management, bot assignment, status tracking
- **Trash Deposits**: Interactive mapping, pollution analysis
- **Reports**: Analytics, export capabilities
- **Live Video**: Real-time streaming from bots
- **System Logs**: Activity monitoring, debugging

### Dashboard Layout Patterns
- **Responsive sidebar** with collapse functionality
- **Role-based navigation** showing appropriate menu items
- **Real-time status indicators** throughout the interface
- **Modal dialogs** for forms and detailed views

## Key Integrations

### Maps & Geolocation
- **Leaflet** with OpenStreetMap tiles
- **Trash deposit visualization** with density markers
- **Bot location tracking** and route planning
- **Area-based filtering** and analytics

### Weather Integration
- **Weather service abstraction** in `src/services/weatherService.ts`
- **Mock data implementation** for development
- **Real-time weather displays** in dashboard
- **Storm warning system** for bot safety

### Real-time Features
- **Firebase Realtime Database** for live bot telemetry
- **WebSocket-like updates** for status changes
- **Live video streaming** integration points
- **Notification system** for alerts and updates

## Development Patterns & Best Practices

### Type Safety
- **Comprehensive TypeScript types** for all data models
- **Strict mode enabled** in tsconfig.json
- **Interface segregation** for different feature areas
- **Generic types** for API responses and forms

### Performance Considerations
- **Next.js optimizations**: Image optimization, code splitting
- **Firebase query optimization**: Indexed queries, pagination
- **Tailwind CSS**: JIT compilation, purging unused styles
- **Component lazy loading** for admin dashboard routes

### Error Handling
- **Service layer error boundaries** with proper error types
- **Firebase error handling** with user-friendly messages
- **Loading states** and error UI throughout the application
- **Graceful degradation** for offline scenarios

## Testing & Quality Assurance

### Code Quality Tools
- **ESLint** with Next.js and TypeScript rules
- **TypeScript strict mode** for compile-time safety
- **shadcn/ui components** for consistent UI patterns
- **Tailwind CSS classes** for responsive design testing

### Live Demo & Testing
- **Deployed application**: https://p2a-agos-web.vercel.app/
- **Test credentials**: admin@gmail.com / 12345678
- **Feature testing**: All admin dashboard functionality accessible

## Deployment

### Vercel Deployment (Current)
```bash
# Deploy to production
vercel --prod

# Environment variables must be configured in Vercel dashboard
# Firebase configuration, API keys, etc.
```

### Environment Requirements
- **Node.js 18+** for development and build
- **Firebase project** with Firestore, Auth, and Realtime DB enabled
- **Vercel account** for deployment (or alternative Next.js host)

## Troubleshooting

### Common Issues

#### Firebase Connection Problems
```bash
# Check Firebase project configuration
firebase projects:list

# Verify environment variables are loaded
console.log(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
```

#### Build Errors
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### Map Loading Issues
- Ensure Leaflet CSS is properly imported in globals.css
- Check network connectivity for tile server access
- Verify geolocation data format matches expected coordinates

## Key Files for Understanding the System

1. **`src/app/layout.tsx`**: Root layout with authentication provider
2. **`src/app/admin/layout.tsx`**: Admin dashboard shell with navigation
3. **`src/contexts/AuthContext.tsx`**: Firebase authentication integration
4. **`src/types/index.ts`**: Complete data model definitions
5. **`src/lib/firebase.ts`**: Firebase service configuration
6. **`components.json`**: shadcn/ui configuration and aliases

## Rules Compliance

When working on this codebase, ensure:

1. **Centralized role/permission logic**: Use RoleGuard patterns instead of scattered role checks
2. **Reuse existing logic**: Check `src/services/` and `src/utils/` before writing new functions
3. **Service layer pattern**: Never fetch data directly in components; use service files
4. **Component decomposition**: Break large admin pages into smaller, single-purpose components
