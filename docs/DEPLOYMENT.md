# Deployment Guide

This guide covers deploying Virtual Pet Co-Parent to production using EAS (Expo Application Services).

## Prerequisites

1. **Expo Account**
   - Sign up at [expo.dev](https://expo.dev)
   - Create a new project or use an existing one

2. **Supabase Project**
   - Create a project at [supabase.com](https://supabase.com)
   - Run the SQL migration in `supabase/migration.sql`
   - Copy your project URL and anon key

3. **Apple Developer Account** (iOS)
   - Enroll at [developer.apple.com](https://developer.apple.com)
   - Create an App ID and provisioning profile

4. **Google Play Console Account** (Android)
   - Create a developer account at [play.google.com/console](https://play.google.com/console)
   - Pay the $25 registration fee

## Environment Setup

### 1. Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Add your credentials:

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Sentry (optional, for error tracking)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

### 2. Configure EAS

Install EAS CLI:

```bash
npm install -g eas-cli
```

Login to Expo:

```bash
eas login
```

Configure the project:

```bash
eas build:configure
```

## Building for Development

### iOS Simulator

```bash
eas build --platform ios --profile development --local
```

### Android Emulator

```bash
eas build --platform android --profile development --local
```

## Building for Production

### iOS TestFlight Build

```bash
eas build --platform ios --profile production
```

This will:
1. Build the iOS app
2. Upload to TestFlight for beta testing
3. Send you an email when complete

### Android Play Store Build

```bash
eas build --platform android --profile production
```

This will:
1. Build an Android App Bundle (AAB)
2. Upload to Google Play Console
3. Send you an email when complete

## Submitting to App Stores

### iOS App Store

After TestFlight testing:

```bash
eas submit --platform ios --profile production
```

Requirements:
- Apple Developer account
- App Store Connect app configured
- Screenshots uploaded (required sizes in app.config.js)
- App privacy details completed

### Android Play Store

```bash
eas submit --platform android --profile production
```

Requirements:
- Google Play Console account
- App listing completed
- Privacy policy URL
- Content rating questionnaire completed

## CI/CD Pipeline

The project includes a GitHub Actions workflow (`.github/workflows/ci.yml`) that:

1. **Runs on every PR**
   - Lints code with ESLint
   - Type checks with TypeScript
   - Runs tests with coverage

2. **Builds on merge to main**
   - Creates production builds
   - Submits to app stores

3. **Manual workflow trigger**
   - Go to Actions tab in GitHub
   - Select "CI" workflow
   - Click "Run workflow"

## Supabase Migration

Before deploying, set up your database:

```bash
# Go to Supabase project > SQL Editor
# Copy contents of supabase/migration.sql
# Run the migration
```

Required tables:
- `profiles` - User profiles
- `couples` - Partner relationships
- `pets` - Pet data
- `care_actions` - Care history
- `milestones` - Achievement tracking
- `inventory` - User items

Enable Realtime for:
- `pets` table
- `care_actions` table
- `couples` table

## Environment-Specific Configuration

### Development
- Uses Expo Go app for testing
- Points to development Supabase project (optional)
- Error tracking in development mode (dry run)

### Production
- Points to production Supabase project
- Full Sentry error tracking enabled
- Optimized bundle size
- Proguard enabled (Android)

## Troubleshooting

### Build Fails

1. Check EAS build logs:
   ```bash
   eas build:view --platform ios
   ```

2. Common issues:
   - **Missing credentials**: Verify EXPO_TOKEN in GitHub Secrets
   - **Bundle ID mismatch**: Ensure bundle identifier is unique
   - **Provisioning profile expired**: Regenerate in Apple Developer Portal

### Runtime Crashes

Check Sentry dashboard for error reports:
- Go to [sentry.io](https://sentry.io)
- Filter by your project
- Review stack traces and user context

### Database Issues

1. Check Supabase logs in project dashboard
2. Verify Row Level Security (RLS) policies
3. Ensure Realtime is enabled for required tables

## Post-Deployment Checklist

- [ ] Test authentication flow
- [ ] Test partner pairing
- [ ] Test pet care actions sync
- [ ] Test push notifications
- [ ] Verify deep linking works
- [ ] Check analytics integration
- [ ] Monitor Sentry error rates
- [ ] Respond to App Store reviews

## Rollback Procedure

If a critical issue is found:

1. **iOS**: Use TestFlight to push previous version
2. **Android**: Upload previous AAB to Play Console
3. **Hotfix**: Create patch branch, fix, deploy as version x.x.1

## Maintenance

### Regular Updates

- Update dependencies monthly: `npm update`
- Test on new iOS/Android versions
- Review and address Sentry errors weekly
- Renew provisioning profiles annually

### Monitoring

- Set up Sentry alerts for:
  - Crash rate > 1%
  - Error rate increase > 50%
  - New error types

- Monitor key metrics:
  - Daily Active Users (DAU)
  - Partner pairing rate
  - Care action frequency
  - Push notification deliverability