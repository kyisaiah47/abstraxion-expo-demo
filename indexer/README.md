# ProofPay Indexer

A Node.js/TypeScript service that indexes XION blockchain events and manages notifications for the ProofPay application.

## Features

- **Blockchain Event Processing**: Connects to XION WebSocket RPC and processes contract events
- **Database Integration**: Stores and manages task data using Supabase
- **Push Notifications**: Sends real-time notifications via OneSignal
- **Auto-Release Timer**: Handles hybrid proof type auto-release functionality
- **Health Monitoring**: Built-in health check and status endpoints
- **Graceful Reconnection**: Automatic reconnection with exponential backoff

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   XION Chain    │    │  ProofPay        │    │   Supabase      │
│   WebSocket     │───▶│  Indexer         │───▶│   Database      │
│                 │    │                  │    │                 │
└─────────────────┘    │  ┌─────────────┐ │    └─────────────────┘
                       │  │ Event       │ │
┌─────────────────┐    │  │ Processor   │ │    ┌─────────────────┐
│   OneSignal     │◀───┤  └─────────────┘ │    │  Users' Devices │
│   Push API      │    │                  │    │  (Mobile App)   │
│                 │    │  ┌─────────────┐ │    │                 │
└─────────────────┘    │  │ Timer       │ │    └─────────────────┘
                       │  │ Worker      │ │
                       │  └─────────────┘ │
                       └──────────────────┘
```

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Build the project:**
   ```bash
   npm run build
   ```

4. **Start the service:**
   ```bash
   npm start
   ```

## Configuration

Required environment variables in `.env`:

```bash
# XION Blockchain
XION_RPC_WS=wss://rpc.xion-testnet.terra.money/websocket
XION_RPC_HTTP=https://rpc.xion-testnet.terra.money
CONTRACT_ADDRESS=xion1...your_contract_address

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OneSignal
ONESIGNAL_APP_ID=your_app_id
ONESIGNAL_API_KEY=your_api_key

# Service Configuration
NODE_ENV=development
LOG_LEVEL=info
HEALTH_CHECK_PORT=3001
```

## Development

```bash
# Development mode with hot reload
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Testing
npm run test
```

## API Endpoints

- **GET `/health`** - Health check endpoint
- **GET `/status`** - Detailed service status
- **POST `/manual/timer-check`** - Trigger manual timer check
- **POST `/manual/test-notification`** - Send test notification

## Event Processing

The indexer processes these contract events:

1. **TaskCreated** - New task created
2. **ProofSubmitted** - Worker submitted proof
3. **TaskPendingRelease** - Auto-release timer started
4. **TaskReleased** - Payment released to worker
5. **TaskDisputed** - Task disputed by payer
6. **TaskRefunded** - Payment refunded to payer

Each event triggers:
- Database updates
- Push notifications
- Activity feed entries

## Auto-Release Timer

For hybrid proof types, the timer worker:
- Runs every minute checking for expired pending release tasks
- Automatically releases payments after the review window
- Sends notifications to both payer and worker

## Monitoring

The service provides comprehensive logging and monitoring:

- Structured JSON logging with Winston
- Health check endpoint for load balancers
- Detailed status endpoint for debugging
- Automatic error handling and recovery

## Production Deployment

1. Set `NODE_ENV=production`
2. Configure proper logging levels
3. Set up process manager (PM2, systemd)
4. Monitor health check endpoints
5. Set up log rotation

## Troubleshooting

Check service status:
```bash
curl http://localhost:3001/status
```

Common issues:
- WebSocket connection failures → Check XION RPC endpoint
- Database connection issues → Verify Supabase credentials
- Notification failures → Check OneSignal configuration