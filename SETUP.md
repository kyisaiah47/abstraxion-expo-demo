# ProofPay Setup Guide

Complete instructions for setting up the ProofPay development environment and production deployment.

## 🎯 What We Built

ProofPay is now a **full-stack application** with:

- **React Native Mobile App** - Task creation, proof submission, real-time updates
- **Blockchain Indexer** - Processes XION events, sends notifications
- **Mock zkTLS Verifier** - Simulates cryptographic verification
- **Supabase Database** - Real-time data, file storage, authentication
- **Push Notifications** - OneSignal integration
- **Demo System** - One-command setup with test data

---

## 🚀 Quick Start (Development)

**TL;DR: Get everything running in 2 minutes:**

```bash
# 1. Clone and install
git clone <your-repo>
cd proofpay
npm install

# 2. Set up environment (see detailed steps below)
cp .env.example .env
cp indexer/.env.example indexer/.env
# Edit both .env files with your credentials

# 3. Set up database
# Copy supabase-setup.sql into Supabase SQL editor and run

# 4. Start everything
npm run demo:setup
```

**That's it!** The app, indexer, mock verifier, and test data are all running.

---

## 📋 Detailed Development Setup

### Prerequisites

```bash
# Required
node -v    # 18+ required
npm -v     # 9+ required

# Install global dependencies
npm install -g @expo/cli tsx
```

### 1. Project Setup

```bash
# Clone repository
git clone <your-repo-url>
cd proofpay

# Install all dependencies (main app + services)
npm install
cd indexer && npm install && cd ..
cd mock-verifier && npm install && cd ..
```

### 2. Supabase Setup

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Note your URL and keys

2. **Run Database Migration**
   - Open Supabase dashboard → SQL Editor
   - Copy entire contents of `supabase-setup.sql`
   - Execute the script
   - Creates: tables, RLS policies, functions, triggers, storage buckets

3. **Configure Storage**
   - Supabase Dashboard → Storage
   - Verify these buckets exist (created by SQL migration):
     - `avatars` (public) - User profile pictures
     - `proofs` (private) - Task evidence files
     - `disputes` (private) - Dispute attachment files

### 3. OneSignal Setup (Optional)

1. **Create OneSignal App**
   - Go to [onesignal.com](https://onesignal.com)
   - Create new app
   - Choose your platforms:
     - **Apple iOS (APNs)** for iOS devices
     - **Google Android (FCM)** for Android devices
   - Note your App ID from Settings → Keys & IDs

2. **Get API Key**
   - Go to Settings → Keys & IDs
   - Copy the "REST API Key" (this is your ONESIGNAL_API_KEY)
   - Copy the "OneSignal App ID" (this is your ONESIGNAL_APP_ID)

3. **Configure Push Notifications**
   - Add OneSignal SDK to your app (already included)
   - For production: Set up Apple Developer certificates (iOS) and Firebase project (Android)

### 4. Environment Configuration

**Main App** (`.env`):
```bash
# Copy from .env.example
cp .env.example .env

# Edit with your values
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EXPO_PUBLIC_CONTRACT_ADDRESS=xion1lxcdce37k8n4zyanq3ne5uw958cj0r6mnrr4kdpzrylvsanfcvpq0gzrxy
EXPO_PUBLIC_RPC_ENDPOINT=https://rpc.xion-testnet-2.burnt.com
EXPO_PUBLIC_REST_ENDPOINT=https://api.xion-testnet-2.burnt.com
EXPO_PUBLIC_TREASURY_CONTRACT_ADDRESS=xion1...
```

**Indexer Service** (`indexer/.env`):
```bash
# Copy from example
cp indexer/.env.example indexer/.env

# Edit with your values
XION_RPC_WS=wss://rpc.xion-testnet-2.burnt.com/websocket
XION_RPC_HTTP=https://rpc.xion-testnet-2.burnt.com
CONTRACT_ADDRESS=xion1lxcdce37k8n4zyanq3ne5uw958cj0r6mnrr4kdpzrylvsanfcvpq0gzrxy

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

ONESIGNAL_APP_ID=12345678-1234-1234-1234-123456789abc
ONESIGNAL_API_KEY=YourOneSignalRestAPIKey...

NODE_ENV=development
LOG_LEVEL=info
HEALTH_CHECK_PORT=3001
```

### 5. Test Everything

```bash
# Start full development stack
npm run demo:setup

# Verify services are running
npm run demo:status

# Should show all green checkmarks:
# ✅ Indexer Service      http://localhost:3001
# ✅ Mock Verifier        http://localhost:3002  
# ✅ Expo Dev Server      http://localhost:8081
```

---

## 🎮 Development Commands

### Full Stack Management
```bash
npm run demo:setup          # Start everything + seed data
npm run demo:stop           # Stop all services
npm run demo:restart        # Restart everything
npm run demo:status         # Check service health
npm run demo:logs           # View all logs
```

### Individual Services
```bash
# React Native App
npm start                   # Expo only
npm run ios                 # iOS simulator
npm run android            # Android emulator

# Indexer Service
cd indexer
npm run dev                 # Development with hot reload
npm run build && npm start # Production build

# Mock Verifier
cd mock-verifier  
npm run dev                 # Development server
```

### Database Operations
```bash
npm run seed               # Seed with test data
npm run seed:clear         # Clear existing + re-seed

# Manual SQL operations in Supabase dashboard
```

### Testing
```bash
# Test zkTLS verification
./scripts/cli-verifier.sh https://api.github.com/repos/user/repo

# Test API endpoints
curl http://localhost:3001/health
curl http://localhost:3002/health

# Test notifications
curl -X POST http://localhost:3001/manual/test-notification \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"xion1payer123456789abcdef123456789abcdef1234"}'
```

---

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Native  │    │  ProofPay        │    │   Supabase      │
│   Mobile App    │◀──▶│  Indexer         │───▶│   Database      │
│   (Port 8081)   │    │  (Port 3001)     │    │   + Storage     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                       │
         │              ┌──────────────────┐              │
         │              │  Mock zkTLS      │              │
         └──────────────│  Verifier        │              │
                        │  (Port 3002)     │              │
                        └──────────────────┘              │
                                 │                        │
                    ┌─────────────────┐    ┌─────────────────┐
                    │   XION Chain    │    │   OneSignal     │
                    │   WebSocket     │    │   Push API      │
                    └─────────────────┘    └─────────────────┘
```

### Service Responsibilities

**React Native App:**
- User interface and wallet integration
- Task creation and proof submission  
- Real-time updates via Supabase
- File uploads with signed URLs

**Indexer Service:**
- Listens to XION blockchain events
- Processes task state changes
- Sends push notifications
- Manages auto-release timers

**Mock zkTLS Verifier:**
- Simulates cryptographic verification
- Returns realistic proof responses
- Triggers mock blockchain events
- Development testing only

**Supabase:**
- PostgreSQL database with realtime
- File storage with signed URLs
- Row-level security policies
- Custom functions and triggers

---

## 🔧 Development Workflow

### Typical Development Session

```bash
# 1. Start everything
npm run demo:setup

# 2. Make changes to mobile app
# Files auto-reload via Expo

# 3. Make changes to indexer
cd indexer
# Files auto-reload via tsx watch

# 4. Test changes
./scripts/cli-verifier.sh https://api.example.com/test

# 5. View logs
npm run demo:logs indexer    # Just indexer
npm run demo:logs           # All services

# 6. Re-seed if needed
npm run seed:clear
```

### Common Development Tasks

**Add New Proof Type:**
1. Update `types.ts` enum
2. Add verification logic in `mock-verifier/src/index.ts`
3. Update UI in React Native components
4. Test with CLI verifier

**Modify Database Schema:**
1. Edit `supabase-setup.sql`
2. Run new migration in Supabase
3. Update TypeScript types
4. Re-run seeds if needed

**Add New Notification:**
1. Add to `NotificationType` enum
2. Create handler in `notifications.ts`
3. Add trigger in `eventProcessor.ts`
4. Test with mock events

---

## 🌐 Production Deployment

### 1. React Native App

**Expo Application Services (EAS):**
```bash
# Install EAS CLI
npm install -g eas-cli

# Configure project
eas init
eas build:configure

# Build for app stores
eas build --platform ios
eas build --platform android

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

**Environment Variables:**
- Set production Supabase URLs
- Configure production contract addresses
- Add real OneSignal keys

### 2. Indexer Service

**Railway Deployment:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy
railway login
railway init
railway up

# Set environment variables in Railway dashboard
railway variables:set SUPABASE_URL=https://...
```

**Alternative: Docker**
```bash
# Create Dockerfile in indexer/
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
CMD ["node", "dist/index.js"]

# Build and deploy
docker build -t proofpay-indexer ./indexer
docker run -p 3001:3001 proofpay-indexer
```

**Environment Variables:**
```bash
NODE_ENV=production
XION_RPC_WS=wss://rpc.xion-mainnet.burnt.com/websocket
SUPABASE_URL=https://your-prod-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_prod_service_key
ONESIGNAL_APP_ID=your_prod_app_id
ONESIGNAL_API_KEY=your_prod_api_key
```

### 3. Replace Mock Verifier

**Real zkTLS Implementation Options:**

1. **TLSNotary Integration:**
```bash
npm install tlsnotary-js
# Implement real TLS proof generation
```

2. **Reclaim Protocol:**
```bash
npm install @reclaimprotocol/js-sdk
# Use Reclaim's zkTLS infrastructure
```

3. **Custom Implementation:**
- Set up zkTLS circuits
- Implement proof generation
- Deploy verification infrastructure

### 4. Database (Supabase)

**Production Setup:**
1. Create production Supabase project
2. Run `supabase-setup.sql` migration
3. Configure production RLS policies
4. Set up database backups
5. Monitor query performance

**Storage Configuration:**
- Configure CDN for file uploads
- Set up automated backups
- Implement file retention policies

### 5. Monitoring & Analytics

**Indexer Monitoring:**
```bash
# Health check endpoint
curl https://your-indexer.railway.app/health

# Status dashboard
curl https://your-indexer.railway.app/status
```

**Database Monitoring:**
- Supabase dashboard metrics
- Query performance analysis
- Real-time connection monitoring

**App Analytics:**
- Expo Analytics
- Custom event tracking
- User behavior analysis

---

## 🧪 Testing Strategy

### Unit Tests
```bash
# Run tests
npm test

# Test specific service
cd indexer && npm test
cd mock-verifier && npm test
```

### Integration Tests
```bash
# Test full flow end-to-end
npm run seed:clear
./scripts/cli-verifier.sh https://api.github.com/repos/test/repo
# Verify task status in app
```

### Load Testing
```bash
# Test verifier under load
for i in {1..100}; do
  curl -X POST http://localhost:3002/verify \
    -H "Content-Type: application/json" \
    -d '{"endpoint":"https://api.example.com","task_id":"test_'$i'","worker":"test"}' &
done
```

---

## 🔍 Troubleshooting

### Common Issues

**"Services won't start"**
```bash
# Check ports
lsof -i :3001 :3002 :8081

# Kill conflicting processes
npm run demo:stop
```

**"Database connection failed"**
```bash
# Verify Supabase URL and key
curl https://your-project.supabase.co/rest/v1/tasks \
  -H "apikey: your_anon_key"
```

**"zkTLS verification fails"**
```bash
# Check mock verifier logs
npm run demo:logs verifier

# Test directly
curl http://localhost:3002/health
```

**"App won't connect to services"**
- Verify same WiFi network
- Check environment variables
- Clear Expo cache: `expo start -c`

### Getting Help

1. **Check logs:** `npm run demo:logs`
2. **Verify status:** `npm run demo:status`  
3. **Restart services:** `npm run demo:restart`
4. **Re-seed data:** `npm run seed:clear`

---

## 📚 Additional Resources

- **[DEMO.md](DEMO.md)** - Complete demo walkthrough
- **[Supabase Docs](https://supabase.com/docs)** - Database and auth
- **[Expo Docs](https://docs.expo.dev/)** - React Native development
- **[XION Docs](https://docs.xion.terra.money/)** - Blockchain integration
- **[OneSignal Docs](https://documentation.onesignal.com/)** - Push notifications

---

**🎉 You're all set!** Run `npm run demo:setup` and start building with ProofPay!