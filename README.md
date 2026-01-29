# FieldPulse

A field service management mobile application built with React Native. Enables technicians to view assigned jobs, complete checklists, capture photos/signatures, and sync data offline.

## Features

- **Job Management:** View, filter, and search assigned jobs with 60fps scrolling (500+ items)
- **Dynamic Checklists:** 10 field types including photos, signatures, dates
- **Offline-First:** Full functionality without network connectivity
- **Photo Capture:** GPS-tagged photos with burned-in timestamps
- **Signature Capture:** 60fps signature pad with landscape mode
- **Push Notifications:** Real-time job assignments and updates via FCM
- **Biometric Auth:** Face ID / Fingerprint unlock
- **Form Validation:** Formik + Yup schema-based validation

## Tech Stack

- **React Native** 0.83.1 (bare workflow)
- **TypeScript** (strict mode)
- **Zustand** - State management
- **Formik + Yup** - Form state and validation
- **op-sqlite** - Local SQLite database
- **React Navigation 7** - Navigation
- **FlashList** - 60fps list rendering
- **Reanimated 3** - Gesture animations
- **Firebase + Notifee** - Push notifications

## Prerequisites

- Node.js >= 20
- Docker & Docker Compose
- Xcode 15+ (iOS)
- Android Studio (Android)
- CocoaPods
- Java 17+ (Android)

## Getting Started

### 1. Clone and Install

```bash
git clone <repository-url>
cd FieldPulse

# Install dependencies
npm install

# iOS: Install CocoaPods
cd ios && pod install && cd ..
```

### 2. Environment Setup

The mobile app configuration is centralized in `src/constants/index.ts`. For **simulator/emulator** testing, the default `localhost` configuration works out of the box.

Create `backend/.env` file:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://fieldpulse:fieldpulse@localhost:5432/fieldpulse

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# S3/MinIO (for photo uploads)
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=fieldpulse
S3_REGION=us-east-1

# Redis
REDIS_URL=redis://localhost:6379

# Push Notifications (optional)
PUSH_ENABLED=false
# FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
```

### 3. Start Backend Services (Docker)

```bash
cd backend

# Start PostgreSQL with Docker
docker-compose up -d

# Install backend dependencies
npm install

# Run migrations
npm run migrate

# Seed test data (creates 500 jobs, 50 customers, 4 users)
npm run seed

# Start server
npm run dev
```

The backend will be available at `http://localhost:3000`.

### 4. Run the App

```bash
# iOS Simulator
npm run ios

# Android Emulator
npm run android
```

#### Physical Device Testing

For testing on a physical device, you need to update the API URL to your machine's local IP address:

1. **Find your local IP:**
   ```bash
   # macOS
   ipconfig getifaddr en0

   # Windows
   ipconfig

   # Linux
   hostname -I
   ```

2. **Update `src/constants/index.ts`:**
   ```typescript
   export const API_CONFIG = {
     BASE_URL: __DEV__ ? 'http://192.168.x.x:3000/api' : 'https://api.fieldpulse.app/api',
     // ... rest of config
   };
   ```

   The `UPLOADS_BASE_URL` is automatically derived from `BASE_URL`, so photo loading will also work.

3. **Update `backend/.env`** (for MinIO/S3 photo uploads):
   ```env
   S3_ENDPOINT=http://192.168.x.x:9000
   ```

4. **Restart Metro bundler and backend server** after making changes.

## Project Structure

```
FieldPulse/
├── src/
│   ├── api/              # API client and endpoints
│   ├── components/       # Reusable UI components
│   │   ├── checklist/    # Form fields (10 types)
│   │   ├── common/       # Shared components (StatusBadge, Banner, etc.)
│   │   ├── jobs/         # Job list components
│   │   └── ui/           # Reusable UI (Button, Input, Card, Modal)
│   ├── constants/        # App constants
│   ├── db/               # SQLite setup & repositories
│   ├── navigation/       # React Navigation config
│   ├── screens/          # Screen components (folder structure)
│   │   ├── auth/         # LoginScreen/
│   │   ├── jobs/         # JobListScreen/, JobDetailsScreen/
│   │   ├── checklist/    # ChecklistScreen/, PhotoCaptureScreen/, etc.
│   │   └── settings/     # SettingsScreen/
│   ├── services/         # Notifications, deep linking
│   ├── store/            # Zustand stores
│   ├── types/            # TypeScript types
│   └── utils/            # Utilities and helpers
├── backend/              # Express.js backend
│   ├── src/
│   │   ├── api/          # Routes, middleware, validators
│   │   ├── db/           # Kysely + migrations + seeds
│   │   ├── services/     # Business logic
│   │   └── types/        # TypeScript types
│   ├── docker-compose.yml
│   └── tests/            # API tests
└── e2e/                  # Detox E2E tests
```

## Running Tests

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run with coverage
npm run test:coverage
```

### Mobile Unit Tests

```bash
# Run Jest tests
npm test

# Watch mode
npm run test:watch
```

### E2E Tests (Detox)

```bash
# Build for iOS
npm run e2e:build:ios

# Run E2E tests
npm run e2e:test:ios
```

### TypeScript Check

```bash
# Check types
npx tsc --noEmit

# Backend types
cd backend && npx tsc --noEmit --skipLibCheck
```

### Lint

```bash
npm run lint
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh tokens
- `POST /api/auth/logout` - Logout

### Jobs
- `GET /api/jobs` - List jobs (cursor-paginated, filtered by assigned user)
- `GET /api/jobs/:id` - Job details with customer and checklist
- `PATCH /api/jobs/:id` - Update job status/priority
- `POST /api/jobs/:id/start` - Start job
- `POST /api/jobs/:id/complete` - Complete job

### Checklist
- `GET /api/jobs/:id/checklist` - Get checklist responses
- `PUT /api/jobs/:id/checklist/:fieldId` - Save single response
- `POST /api/jobs/:id/checklist/batch` - Batch save responses
- `POST /api/jobs/:id/checklist/submit` - Submit completed checklist

### Upload
- `POST /api/upload/request` - Get presigned URL for upload
- `POST /api/upload/confirm` - Confirm upload complete

### Push Notifications
- `POST /api/notifications/push/subscribe` - Register FCM token
- `POST /api/notifications/push/unsubscribe` - Unregister FCM token
- `GET /api/notifications/push/settings` - Get push settings
- `PUT /api/notifications/push/settings` - Update push settings
- `GET /api/notifications/push/status` - Get FCM service status
- `POST /api/notifications/push/test` - Send test notification
- `POST /api/notifications/push/test-job` - Send test job notification with deep link

### Sync
- `POST /api/sync/pull` - Pull changes since timestamp
- `POST /api/sync/push` - Push local changes

## Firebase Setup (Push Notifications)

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Add iOS and Android apps to the project
3. Download `GoogleService-Info.plist` (iOS) and `google-services.json` (Android)
4. Place them in `ios/` and `android/app/` respectively
5. Go to Project Settings > Service Accounts
6. Click "Generate new private key"
7. Save the JSON file as `backend/firebase-service-account.json`
8. Update `backend/.env`:
   ```env
   FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
   PUSH_ENABLED=true
   ```

### Testing Push Notifications

```bash
# Send a test notification to yourself
curl -X POST http://localhost:3000/api/notifications/push/test \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Send a test job notification (for deep link testing)
curl -X POST http://localhost:3000/api/notifications/push/test-job \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type": "job_assigned"}'
```

## Test Credentials

After running `npm run seed` in the backend:

| Role       | Email                      | Password    |
|------------|----------------------------|-------------|
| Admin      | admin@fieldpulse.com       | password123 |
| Dispatcher | dispatcher@fieldpulse.com  | password123 |
| Technician | tech@fieldpulse.com        | password123 |
| Technician | tech2@fieldpulse.com       | password123 |

Jobs are split between the two technician accounts (~250 each).

## Performance

### List Scrolling (500+ jobs)
- Uses `AnimatedFlashList` with `drawDistance` optimization
- `JobCard` component memoized with custom comparison
- Date formatting memoized with `useMemo`
- Maintains 60fps on mid-range devices

### Offline Sync
- Exponential backoff for failed syncs
- Rate limit handling (429 responses)
- Automatic retry on network restore

## Known Limitations

1. **Status Filter Tabs:** Touch responsiveness can be inconsistent on some devices after completing a job. Workaround: Pull to refresh.

2. **Push Notifications:** Require Firebase setup. Disabled by default.

3. **Photo Upload:** Large photos may fail on slow connections. Photos are compressed to max 1200x1200.

4. **Offline Duration:** Extended offline periods (>7 days) may cause refresh token expiry.

5. **Android Emulator:** Push notifications require Google Play Services.

## Troubleshooting

### iOS Build Issues

```bash
cd ios
rm -rf Pods Podfile.lock build
pod install --repo-update
cd ..
npm run ios
```

### Android Build Issues

```bash
cd android
./gradlew clean
cd ..
npm run android
```

### Metro Bundler

```bash
npm start -- --reset-cache
```

### Database Reset (Backend)

```bash
cd backend
docker-compose down -v
docker-compose up -d
npm run migrate
npm run seed
```

## Architecture Decisions

See [DECISIONS.md](./DECISIONS.md) for detailed technical decisions and rationale.

## License

Private - All rights reserved
