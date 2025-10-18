# Firebase Notifications Setup

## Firebase Collection Structure

Create a `notifications` collection in your Firestore database with the following structure:

### Document Schema

```typescript
interface FirebaseNotification {
  id: string; // Auto-generated document ID
  title: string; // Notification title
  message: string; // Notification message/body
  notification_type: 'general' | 'emergency_alert' | 'emergency_alert_weather' | 'emergency_alert_storm' | 'system' | 'bot_status' | 'maintenance';
  recipient_id: string; // User ID who should receive this notification
  sender_id?: string; // Optional: ID of who sent the notification
  read: boolean; // Whether the notification has been read
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: Timestamp; // When the notification was created
  read_at?: Timestamp; // When the notification was read (optional)
  metadata?: {
    bot_ids?: string[]; // Array of bot IDs related to this notification
    location?: string; // Location information
    action_required?: boolean; // Whether this notification requires action
    weather_type?: 'storm' | 'flood' | 'extreme_heat' | 'severe_wind';
    alert_level?: 1 | 2 | 3 | 4 | 5; // Alert severity level
    [key: string]: any; // Additional metadata
  };
}
```

## Sample Notification Documents

### 1. Emergency Weather Alert
```json
{
  "title": "Storm Warning - Return Bots Immediately",
  "message": "Typhoon approaching Manila Bay. Expected landfall in 4 hours. All active bots should return to base immediately for safety.",
  "notification_type": "emergency_alert_weather",
  "recipient_id": "user_admin_123",
  "sender_id": "system",
  "read": false,
  "priority": "urgent",
  "created_at": "2025-09-15T10:30:00Z",
  "metadata": {
    "weather_type": "storm",
    "alert_level": 4,
    "action_required": true,
    "bot_ids": ["bot-001", "bot-002", "bot-003"],
    "location": "Manila Bay Area"
  }
}
```

### 2. Bot Status Alert
```json
{
  "title": "Low Battery Alert - AGOS Collector Alpha",
  "message": "Bot AGOS Collector Alpha battery level is at 15%. Consider returning to base for charging.",
  "notification_type": "bot_status",
  "recipient_id": "user_admin_123",
  "sender_id": "bot-001",
  "read": false,
  "priority": "medium",
  "created_at": "2025-09-15T09:15:00Z",
  "metadata": {
    "bot_ids": ["bot-001"],
    "battery_level": 15,
    "location": "Zone A - Manila Bay"
  }
}
```

### 3. System Maintenance Alert
```json
{
  "title": "Scheduled Maintenance Complete",
  "message": "System maintenance has been completed successfully. All services are now fully operational.",
  "notification_type": "system",
  "recipient_id": "user_admin_123",
  "sender_id": "system",
  "read": false,
  "priority": "low",
  "created_at": "2025-09-15T08:00:00Z",
  "metadata": {
    "maintenance_type": "scheduled",
    "duration": "2 hours",
    "affected_services": ["api", "dashboard", "reports"]
  }
}
```

## Firestore Security Rules

Add these security rules to your Firestore to ensure proper access control:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Notifications collection
    match /notifications/{notificationId} {
      // Users can only read notifications meant for them
      allow read: if request.auth != null && resource.data.recipient_id == request.auth.uid;
      
      // Users can only update the 'read' and 'read_at' fields of their own notifications
      allow update: if request.auth != null 
        && resource.data.recipient_id == request.auth.uid
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['read', 'read_at']);
      
      // Only admin/system can create notifications
      allow create: if request.auth != null && hasRole('admin');
    }
    
    // Helper function to check user roles
    function hasRole(role) {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == role;
    }
  }
}
```

## How to Create Notifications

### Using Firebase Admin SDK (Server-side)
```javascript
const admin = require('firebase-admin');
const db = admin.firestore();

async function createNotification(notificationData) {
  try {
    const notification = {
      ...notificationData,
      created_at: admin.firestore.Timestamp.now(),
      read: false
    };
    
    const docRef = await db.collection('notifications').add(notification);
    console.log('Notification created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

// Example usage
createNotification({
  title: "Storm Warning",
  message: "Typhoon approaching. Return all bots immediately.",
  notification_type: "emergency_alert_weather",
  recipient_id: "user_admin_123",
  sender_id: "system",
  priority: "urgent",
  metadata: {
    weather_type: "storm",
    alert_level: 4,
    action_required: true
  }
});
```

### Using Firestore Console
1. Go to your Firebase Console
2. Navigate to Firestore Database
3. Create a new collection called `notifications`
4. Add documents with the schema above

## Integration with Bot Management

When creating notifications related to bot emergency returns:

1. Set `notification_type` to `emergency_alert_weather` or `emergency_alert_storm`
2. Include relevant `bot_ids` in the metadata
3. Set `action_required: true` in metadata
4. Use priority `urgent` for immediate action required

The notification system will automatically:
- Show these notifications with high priority styling
- Route users to the emergency return page when clicked
- Filter bots by `owner_admin_id` matching the current user
- Allow bulk or individual bot return commands

## Real-time Updates

The notification system uses Firestore's real-time listeners to:
- Automatically update the notification bell badge count
- Show new notifications without page refresh
- Update read status immediately
- Sort notifications by creation date (newest first)

## Testing

To test the notification system:

1. Create a test notification document in Firestore
2. Set the `recipient_id` to your current user's UID
3. The notification should appear immediately in the notification bell
4. Click the notification to test routing functionality
5. Mark as read to test the read status updates