# SVPCET AI Attendance System - Mobile App

## Prerequisites

```bash
# Install Node.js 18+
# Install Expo CLI
npm install -g expo-cli
npm install -g eas-cli

# Login to Expo
expo login
eas login
```

## Setup

```bash
cd mobile
npm install

# Create .env file
cp .env.example .env
# Edit .env with your Supabase credentials
```

## Development

```bash
# Start dev server
npm start

# Run on Android (requires Expo Go or dev build)
npm run android

# Run on iOS Simulator
npm run ios
```

## Building APK (Android)

### Option 1: EAS Build (Recommended)
```bash
# Build APK for testing (internal distribution)
eas build --platform android --profile preview

# Build AAB for Play Store
eas build --platform android --profile production
```

### Option 2: Local Build
```bash
npx expo prebuild
cd android
./gradlew assembleRelease
# APK output: android/app/build/outputs/apk/release/app-release.apk
```

## Building IPA (iOS)

```bash
# Build for TestFlight
eas build --platform ios --profile production

# Submit to App Store Connect
eas submit --platform ios
```

## Environment Variables

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Your Supabase anonymous key |

## Project Structure

```
mobile/
├── App.js                          # Entry point
├── app.json                        # Expo config
├── app.config.js                   # Dynamic config with env vars
├── eas.json                        # EAS Build profiles
├── package.json                    # Dependencies
├── babel.config.js                 # Babel + Reanimated
├── assets/                         # App icons, splash
├── src/
│   ├── config/
│   │   └── supabase.js             # Supabase client
│   ├── contexts/
│   │   ├── AuthContext.js           # Auth state (Zustand)
│   │   └── DataContext.js           # Data caching (Zustand)
│   ├── navigation/
│   │   ├── AppNavigator.js          # Root navigator
│   │   ├── AdminNavigator.js        # Admin stack
│   │   ├── TeacherNavigator.js      # Teacher stack
│   │   └── StudentNavigator.js      # Student stack
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.js       # Google OAuth
│   │   │   ├── ProfileSetup.js      # Student profile
│   │   │   └── PendingApproval.js   # Waiting screen
│   │   ├── admin/
│   │   │   ├── AdminDashboard.js    # Dashboard + stats
│   │   │   ├── TimetableBuilder.js  # Grid-based timetable
│   │   │   ├── ManageTeachers.js    # CRUD teachers
│   │   │   ├── NotificationHub.js   # Send notifications
│   │   │   ├── AttendanceViewer.js  # View by date/period
│   │   │   └── ManageStudents.js    # Student list + edit
│   │   ├── teacher/
│   │   │   ├── TeacherDashboard.js  # Teacher home
│   │   │   ├── MarkAttendance.js    # Manual attendance
│   │   │   ├── TeacherTimetable.js  # Weekly schedule
│   │   │   └── TeacherLeave.js      # Leave requests
│   │   └── student/
│   │       ├── StudentDashboard.js  # Student home
│   │       ├── AttendanceHistory.js # Calendar + stats
│   │       └── StudentNotifications.js # Notifications
│   ├── components/
│   │   └── Toast.js                 # Toast notification
│   └── utils/
│       └── helpers.js               # Date, calc, period fix
```

## Features Implemented

- ✅ Google OAuth with Supabase Auth
- ✅ Session persistence (auto-login)
- ✅ Role-based routing (Admin / Teacher / Student)
- ✅ Admin: Dashboard, Timetable Builder, Manage Teachers, Notifications, Attendance Viewer, Manage Students
- ✅ Teacher: Dashboard, Mark Attendance, View Timetable, Leave Requests
- ✅ Student: Dashboard, Attendance History (calendar + subject stats), Notifications
- ✅ Continuous period attendance fix
- ✅ Real-time notifications via Supabase subscriptions
- ✅ Mobile number field for teachers
- ✅ Timetable caching (5-min TTL)
- ✅ Toast error handling (no raw DB errors)
- ✅ Pull-to-refresh on all list screens
- ✅ FlatList for performance
- ✅ Centered modals for all popups
