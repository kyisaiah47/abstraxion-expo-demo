# ProofPay Demo Guide

A complete walkthrough for demonstrating all ProofPay features in 3-5 minutes.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Expo CLI
- Supabase project configured
- Test device or simulator

### One-Command Setup

```bash
# Run this from the project root
npm run demo:setup
```

This command will:
1. Start the indexer service
2. Start the mock zkTLS verifier  
3. Seed the database with test data
4. Launch the React Native app

## 📋 Demo Checklist

### Setup Phase (30 seconds)

- [ ] **Verify Services Running**
  - Indexer: http://localhost:3001/health ✅
  - Mock Verifier: http://localhost:3002/health ✅
  - App: Running in Expo Go or simulator ✅

- [ ] **Connect Wallet**
  - Open ProofPay app
  - Tap "Connect Wallet" 
  - Use test wallet: `xion1payer123456789abcdef123456789abcdef1234`
  - Verify connection shows "Alice (Payer)" profile

### Demo Flow 1: Soft Proof (1 minute)

**Scenario**: Manual review task with proof submission

- [ ] **View Soft Task**
  - Navigate to Tasks tab
  - Find "Create a social media post about ProofPay" (50 UXION)
  - Status should show "Proof Submitted"
  - Tap to view details

- [ ] **Review Proof** 
  - See submitted evidence/proof
  - Show "Review" and "Dispute" buttons
  - Explain: "Payer manually reviews and approves/disputes"

- [ ] **Approve Task** (Optional)
  - Tap "Approve" button
  - Watch status change to "Released"
  - Worker receives payment notification

**Key Points**: 
- Manual review process
- Human judgment required
- Dispute mechanism available

### Demo Flow 2: zkTLS Proof (45 seconds)

**Scenario**: Instant verification with zero manual review

- [ ] **View zkTLS Task**
  - Find "Complete GitHub commit" task (100 UXION)  
  - Status should show "Released" (already completed)
  - Tap to view details

- [ ] **Show Verification**
  - Point out zkTLS proof hash
  - Explain: "Cryptographically verified GitHub API response"
  - Show instant release (no waiting period)

- [ ] **Demonstrate Live Verification** (Optional)
  - Tap "Create zkTLS Task" 
  - Enter GitHub API endpoint: `https://api.github.com/repos/user/repo/commits`
  - Submit task
  - Watch automatic verification in <5 seconds

**Key Points**:
- Zero human involvement
- Cryptographic proof
- Instant settlement

### Demo Flow 3: Hybrid Proof (2 minutes)

**Scenario**: zkTLS verification + manual review window

- [ ] **View Hybrid Task**
  - Find "Submit verified API response" task (200 UXION)
  - Status should show "Pending Release"
  - Tap to view details

- [ ] **Show Countdown Timer**
  - Point to countdown timer (should show ~25-30 minutes remaining)
  - Explain: "zkTLS verified, but payer has review window"
  - Show "Dispute" button still available

- [ ] **Explain Auto-Release**
  - "If timer expires without dispute → automatic release"
  - "Combines cryptographic proof with human oversight"

- [ ] **Demonstrate Dispute Flow**
  - Tap "Dispute" button
  - Show dispute form (reason + optional file upload)
  - Explain: "Stops auto-release, requires manual resolution"

**Key Points**:
- Best of both worlds
- zkTLS + human review
- Time-bound dispute window

### Demo Flow 4: Real-Time Features (30 seconds)

**Scenario**: Show live updates and notifications

- [ ] **Switch User Context**
  - Disconnect wallet
  - Connect as worker: `xion1worker123456789abcdef123456789abcdef1234`
  - Profile shows "Bob (Worker)"

- [ ] **Show Live Updates**
  - Navigate to Tasks tab
  - Tasks update in real-time
  - Notifications badge shows new items

- [ ] **Notifications Panel**
  - Tap notifications icon
  - Show task status updates
  - Payment received notifications
  - Real-time activity feed

**Key Points**:
- Real-time sync via Supabase
- Push notifications via OneSignal  
- Multi-user coordination

### Demo Flow 5: Admin/Monitoring (Optional - 30 seconds)

**Scenario**: Behind-the-scenes monitoring

- [ ] **Indexer Dashboard**
  - Open http://localhost:3001/status
  - Show blockchain connection status
  - Event processing metrics
  - Timer worker status

- [ ] **Mock Verifier Logs**
  - Show terminal output from mock verifier
  - Point out verification requests/responses
  - Mock blockchain event generation

## 🎯 Demo Script

### Opening (15 seconds)
> "ProofPay enables trustless task payments with three types of proof systems. Let me show you each one working end-to-end."

### Soft Proof Demo (1 minute)
> "First, soft proofs for tasks requiring human judgment. Here's a social media task where the worker submitted proof. The payer can review the evidence and either approve or dispute. This handles subjective work like content creation."

### zkTLS Demo (45 seconds) 
> "Next, zkTLS proofs for objective, verifiable tasks. This GitHub task was instantly verified using cryptographic proofs of the API response. No human review needed - the blockchain confirmed the commit exists. Payment released immediately."

### Hybrid Demo (2 minutes)
> "Finally, hybrid proofs combine both approaches. This API task was cryptographically verified by zkTLS, but the payer still has a 30-minute window to dispute if something seems wrong. See this countdown timer? When it hits zero, payment auto-releases unless disputed. It's the best of both worlds - cryptographic certainty with human oversight."

### Real-Time Demo (30 seconds)
> "Everything updates in real-time across devices. When I switch to the worker's view, they see live task updates and notifications. The indexer service processes blockchain events and pushes updates instantly."

### Closing (15 seconds)
> "ProofPay solves the trust problem in digital work by giving both parties the exact level of verification they need - from fully automated to fully manual, with hybrid options in between."

## 🔧 Troubleshooting

### Services Not Starting
```bash
# Check ports
lsof -i :3001  # Indexer
lsof -i :3002  # Mock verifier
lsof -i :8081  # Expo Metro

# Restart services
npm run demo:restart
```

### Database Issues  
```bash
# Re-run seeds
npm run seed -- --clear

# Check Supabase connection
curl https://mchiibkcxzejravsckzc.supabase.co/rest/v1/tasks \
  -H "apikey: YOUR_ANON_KEY"
```

### App Connection Issues
- Verify wallet addresses match test data
- Check network connection (use same WiFi)
- Restart Expo and clear cache

### Timer Not Showing
- Hybrid task should have `pending_release_expires_at` set
- Check indexer processed the events: `curl localhost:3001/status`
- Re-run seeds if timer expired

## 📊 Demo Metrics

**Expected Performance**:
- Soft task review: ~5 seconds
- zkTLS verification: <3 seconds
- Hybrid dispute: <2 seconds
- Real-time updates: <1 second
- Database queries: <500ms

**Demo Duration**:
- Full demo: 4-5 minutes
- Quick version: 2-3 minutes
- Setup time: 30-60 seconds

## 🎥 Recording Tips

1. **Use simulator** for consistent screen recording
2. **Pre-load tasks** by running seeds before recording  
3. **Practice timing** - know exactly which buttons to tap
4. **Show multiple screens** - split screen with indexer logs
5. **Prepare backups** - have curl commands ready for API demos

## 🔍 Advanced Demo Options

### API Testing
```bash
# Test zkTLS verification directly
curl -X POST http://localhost:3002/verify \
  -H "Content-Type: application/json" \
  -d '{"endpoint":"https://api.github.com/repos/user/repo/commits","task_id":"demo_001","worker":"xion1abc..."}'

# Trigger mock blockchain events
curl -X POST http://localhost:3001/dev/mock-event \
  -H "Content-Type: application/json" \
  -d '{"type":"TaskReleased","data":{"task_id":"demo_001","worker":"xion1abc...","amount":"100"},"txHash":"mock_tx_123","eventIndex":0,"blockHeight":500000,"timestamp":"2024-01-01T00:00:00.000Z"}'
```

### Custom Demo Data
```bash
# Create your own test tasks
npm run seed:custom -- --payer="xion1your..." --worker="xion1their..." --amount=500
```

### Production-Like Demo
```bash
# Use real XION testnet (requires actual contract deployment)
XION_RPC_WS="wss://rpc.xion-testnet-1.burnt.com/websocket" npm run demo:prod
```