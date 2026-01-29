# Technical Decisions

This document outlines the key technical decisions made during the development of FieldPulse, including rationale and trade-offs considered.

## Architecture Decisions

### 1. State Management: Zustand over Redux

**Decision:** Use Zustand for global state management.

**Rationale:**
- Minimal boilerplate compared to Redux (no actions, reducers, action creators)
- Built-in TypeScript support with excellent type inference
- Simpler learning curve for team members
- Smaller bundle size (~1KB vs ~10KB for Redux + RTK)
- Easy integration with React Native's persistence needs
- Supports middleware for logging and persistence

**Trade-offs:**
- Less ecosystem/tooling than Redux (no Redux DevTools browser extension)
- Less opinionated structure (requires team discipline)

### 2. Offline Storage: op-sqlite over WatermelonDB

**Decision:** Use `@op-engineering/op-sqlite` for local SQLite database.

**Rationale:**
- Synchronous API allows simpler code patterns
- Better performance for read-heavy operations (job list scrolling)
- Lower memory footprint than WatermelonDB
- Direct SQL access for complex queries
- No need for WatermelonDB's reactive features (using Zustand instead)

**Trade-offs:**
- Manual sync logic required (WatermelonDB has built-in sync)
- No automatic lazy loading of relations
- More verbose code for simple CRUD operations

### 3. Form Validation: Formik + Yup

**Decision:** Use Formik for form state management with Yup for schema-based validation.

**Rationale:**
- Formik provides declarative form state handling with minimal boilerplate
- Yup enables schema-based validation with clear, readable rules
- Excellent TypeScript support with type inference from schemas
- Built-in support for field-level and form-level validation
- Easy integration with custom field components

**Implementation:**
- Dynamic Yup schema generation from checklist template field definitions
- Field-level validation on blur for immediate feedback
- Form-level validation on submit for required field enforcement
- Auto-save drafts with debounced Formik value changes

**Trade-offs:**
- Bundle size impact (~15KB for Formik + Yup)
- Learning curve for Yup schema syntax
- Must ensure proper memoization to avoid re-renders (useMemo for selected values in MultiSelectField)

### 4. Navigation: React Navigation 7

**Decision:** Use React Navigation 7 with native stack.

**Rationale:**
- Industry standard for React Native navigation
- Excellent TypeScript support
- Native stack provides 60fps transitions
- Deep linking support out of the box
- Active maintenance and community

**Trade-offs:**
- Complex type definitions for nested navigators
- Bundle size impact (~150KB)

### 5. List Rendering: AnimatedFlashList with Performance Optimizations

**Decision:** Use `@shopify/flash-list` with `AnimatedFlashList` and comprehensive memoization strategy.

**Rationale:**
- 5-10x better performance than FlatList for large lists
- Maintains 60fps scrolling with 500+ items
- Drop-in replacement API
- Automatic cell recycling
- Better memory management

**Performance Optimizations Applied:**
- **AnimatedFlashList:** Used instead of regular FlashList for smoother animations
- **drawDistance={250}:** Pre-renders items 250px beyond viewport to prevent blank areas during fast scrolling
- **React.memo with custom comparison:** JobCard wrapped in memo with explicit prop comparison to prevent unnecessary re-renders
- **useMemo for formatting:** Date and distance formatting memoized to avoid recalculation on every render
- **Memoized renderItem:** useCallback for renderItem function to maintain referential stability

**Implementation Example (JobCard):**
```typescript
export default memo(JobCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.job.id === nextProps.job.id &&
    prevProps.job.status === nextProps.job.status &&
    prevProps.job.title === nextProps.job.title &&
    prevProps.job.scheduledStart === nextProps.job.scheduledStart &&
    prevProps.job.priority === nextProps.job.priority &&
    prevProps.isOverdue === nextProps.isOverdue &&
    prevProps.distance === nextProps.distance
  );
});
```

**Trade-offs:**
- Requires `estimatedItemSize` configuration
- Slightly different layout behavior in edge cases
- Custom memo comparison must be maintained when props change

## UI/UX Decisions

### 6. Custom Signature Pad (No UI Libraries)

**Decision:** Build custom signature capture using react-native-gesture-handler + react-native-svg + react-native-reanimated.

**Rationale:**
- Assessment requirement to avoid UI libraries for core interactions
- Full control over performance optimization
- 60fps drawing using Reanimated worklets
- Customizable stroke smoothing (quadratic bezier curves)
- No external dependencies for critical feature

**Implementation Details:**
- Uses `useSharedValue` for path data (runs on UI thread)
- Gesture handlers run as worklets
- Path optimization using quadratic bezier curves
- Export via react-native-view-shot

**Trade-offs:**
- More code to maintain
- Required deep understanding of gesture system
- Testing complexity

### 7. Custom Form Fields (No Form Libraries)

**Decision:** Build all 10 checklist field types as custom components.

**Rationale:**
- Assessment requirement
- Full control over validation timing and error display
- Optimized for field service use cases
- Consistent styling without library overrides

**Field Types Implemented:**
1. Text input
2. Textarea (multiline)
3. Number input
4. Select (dropdown)
5. Multi-select
6. Date picker
7. Time picker
8. Photo capture
9. Signature capture
10. Checkbox

**Trade-offs:**
- Significant development time
- Must handle all edge cases manually

### 8. Landscape-Only Signature Capture

**Decision:** Force landscape orientation for signature capture screen.

**Rationale:**
- Provides more horizontal space for natural signing motion
- Matches real-world signature pad behavior
- Better signature quality and readability
- Industry standard practice

**Implementation:**
- Uses `react-native-orientation-locker`
- Locks to landscape on mount, restores portrait on unmount
- Side-panel layout for controls

## Backend Infrastructure Decisions

### 9. Docker Compose for Local Development

**Decision:** Use Docker Compose to orchestrate backend services (PostgreSQL, MinIO for S3-compatible storage).

**Rationale:**
- Single command (`docker-compose up -d`) starts all dependencies
- Consistent environment across developer machines
- No need to install PostgreSQL or MinIO locally
- Easy database reset via `docker-compose down -v`
- Mirrors production-like setup

**Services:**
- **PostgreSQL 15:** Primary database with persistent volume
- **MinIO:** S3-compatible object storage for photo uploads (optional)

**Configuration:**
```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: fieldpulse
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

**Trade-offs:**
- Requires Docker installation
- Additional disk space for images
- Slight startup time overhead

## Sync Architecture Decisions

### 10. Offline-First with Optimistic Updates

**Decision:** Implement offline-first architecture with optimistic UI updates.

**Rationale:**
- Field technicians often work in areas with poor connectivity
- Instant UI feedback improves user experience
- Data integrity maintained through version-based conflict detection

**Implementation:**
- All changes written to local SQLite first
- Changes queued in sync queue
- Background sync when online
- Version numbers prevent lost updates

**Trade-offs:**
- Complexity in conflict resolution
- Potential for stale data display

### 11. Version-Based Conflict Detection

**Decision:** Use integer version numbers for optimistic locking.

**Rationale:**
- Simple to implement and understand
- Works well with offline-first model
- Clear conflict detection (version mismatch = conflict)
- Aligns with backend implementation

**Trade-offs:**
- Requires user intervention for conflicts
- No automatic merging capability

### 12. Cursor-Based Pagination

**Decision:** Use cursor-based pagination over offset-based.

**Rationale:**
- Consistent results when data changes
- Better performance for large datasets
- No "page drift" issues
- Simpler infinite scroll implementation

**Trade-offs:**
- Cannot jump to specific page
- Slightly more complex API

## Security Decisions

### 13. Token Storage with Keychain

**Decision:** Store JWT tokens in platform keychain via `react-native-keychain`.

**Rationale:**
- Hardware-backed encryption on both platforms
- Biometric protection available
- Survives app reinstalls (if configured)
- Industry best practice for sensitive data

**Token Lifecycle:**
- Access token: 15 minutes
- Refresh token: 7 days
- Automatic refresh with rotation

### 14. Biometric Authentication

**Decision:** Optional biometric unlock using platform APIs.

**Rationale:**
- Faster app access for returning users
- Strong security with convenience
- User choice (opt-in)

**Implementation:**
- Uses Keychain's biometric access control
- Stores flag for biometric preference
- Falls back to token-based auth

## Photo Handling Decisions

### 15. Photo Compression Pipeline

**Decision:** Compress photos to max 1200x1200 at 80% JPEG quality.

**Rationale:**
- Balance between quality and file size
- Typical photo size: 200-400KB (vs 3-5MB raw)
- Faster uploads on slow connections
- Sufficient quality for documentation purposes

### 16. Timestamp Burned into Photos

**Decision:** Burn timestamp and GPS coordinates directly into photo pixels.

**Rationale:**
- Tamper-proof evidence of when/where photo was taken
- Visible in any image viewer
- Cannot be stripped by metadata removal
- Common requirement in field service

**Implementation:**
- Uses `react-native-image-marker` library
- Timestamp format: YYYY-MM-DD HH:mm:ss
- GPS format: lat°N/S, lon°E/W
- Semi-transparent background for readability

### 17. Multiple Photos per Field

**Decision:** Support up to 5 photos per photo field (configurable).

**Rationale:**
- Single photo often insufficient for complex issues
- Before/after documentation
- Multiple angles for clarity
- Horizontal scroll gallery for space efficiency

## Push Notification Decisions

### 18. Firebase Cloud Messaging + Notifee

**Decision:** Use FCM for delivery, Notifee for display and handling.

**Rationale:**
- FCM: Reliable, free, cross-platform delivery
- Notifee: Rich local notification control
- Handles both foreground and background states
- Deep linking support

**Notification Types:**
- Job assigned
- Job updated
- Job reminder
- Job cancelled

### 19. Simplified Push-Only Notification Architecture

**Decision:** Remove notification storage/listing from backend; use push-only delivery.

**Rationale:**
- Field technicians receive notifications in real-time via push
- No need for notification inbox/history in mobile app
- Reduces backend complexity and database storage
- Push notifications are ephemeral by design
- Simplifies API surface (no GET/DELETE notification endpoints)

**Implementation:**
- Backend sends push notifications directly via FCM
- No `notifications` table or storage
- Device tokens stored for push delivery
- Settings stored for notification preferences per type

**API Endpoints (Push Only):**
- `POST /api/notifications/push/subscribe` - Register FCM token
- `POST /api/notifications/push/unsubscribe` - Unregister token
- `GET /api/notifications/push/settings` - Get push preferences
- `PUT /api/notifications/push/settings` - Update preferences
- `POST /api/notifications/push/test` - Send test notification
- `POST /api/notifications/push/test-job` - Test job notification with deep link

**Trade-offs:**
- No notification history in app
- Users who miss a push cannot retrieve it later
- Acceptable for field service where jobs are always visible in job list

## Testing Decisions

### 20. Testing Strategy

**Decision:** Multi-layer testing approach.

**Layers:**
1. **Unit tests (Jest):** Validation logic, utilities
2. **Integration tests (Supertest):** API endpoints
3. **E2E tests (Detox):** Critical user flows

**Rationale:**
- Unit tests for fast feedback on logic
- Integration tests for API contract verification
- E2E tests for user journey validation

**Coverage Focus:**
- Validation rules (100% coverage goal)
- Sync queue operations
- Authentication flows
- Complete job submission flow

## Future Considerations

### Not Implemented (Out of Scope)

1. **Real-time sync via WebSockets:** Would improve sync latency but adds complexity
2. **Automatic conflict merging:** Requires deep domain knowledge to merge safely
3. **Image caching with CDN:** Would improve photo load times
4. **Background location tracking:** Privacy concerns, battery impact
5. **Offline maps:** Significant storage requirements

### Recommended for Production

1. Add Sentry/Crashlytics for error tracking
2. Implement analytics (Firebase Analytics)
3. Add app update prompts (CodePush or app store)
4. Implement certificate pinning
5. Add request signing for API security
