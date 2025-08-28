#!/usr/bin/env node

/**
 * ProofPay Mock zkTLS Verifier Service
 * 
 * Provides HTTP endpoints for simulating zkTLS verification during development.
 * Can trigger mock blockchain events or integrate with the indexer for testing.
 */

import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import fetch from 'node-fetch';
import { createHash } from 'crypto';

const app = express();
const PORT = process.env.MOCK_VERIFIER_PORT || 3002;
const INDEXER_URL = process.env.INDEXER_URL || 'http://localhost:3001';
const DEV_MODE = process.env.NODE_ENV === 'development';

// Middleware
app.use(cors());
app.use(express.json());

// Types
interface VerificationRequest {
  endpoint: string;
  task_id: string;
  worker: string;
  expected_data?: any;
  proof_type?: 'zktls' | 'hybrid';
}

interface VerificationResponse {
  verified: boolean;
  zk_proof_hash?: string;
  error?: string;
  metadata?: {
    endpoint: string;
    timestamp: string;
    verification_method: string;
    confidence_score: number;
  };
}

interface MockEvent {
  type: 'ProofSubmitted' | 'TaskPendingRelease' | 'TaskReleased';
  data: any;
  txHash: string;
  eventIndex: number;
  blockHeight: number;
  timestamp: Date;
}

// Mock verification rules
const VERIFICATION_RULES = {
  'twitter.com': {
    pattern: /twitter\.com\/\w+\/status\/\d+/,
    verification: 'tweet_content_check',
    confidence: 0.95
  },
  'github.com': {
    pattern: /github\.com\/[\w-]+\/[\w-]+/,
    verification: 'commit_verification', 
    confidence: 0.98
  },
  'api.github.com': {
    pattern: /api\.github\.com\/repos\/[\w-]+\/[\w-]+\/commits/,
    verification: 'api_response_verification',
    confidence: 0.99
  },
  'api.example.com': {
    pattern: /api\.example\.com/,
    verification: 'generic_api_verification',
    confidence: 0.90
  }
};

// Mock blockchain event queue (for dev mode)
const mockEventQueue: MockEvent[] = [];

// ===== CORE VERIFICATION LOGIC =====

function generateZkProofHash(endpoint: string, taskId: string, timestamp: string): string {
  const data = `${endpoint}:${taskId}:${timestamp}:zktls_proof`;
  return 'zk_' + createHash('sha256').update(data).digest('hex').substring(0, 32);
}

function shouldVerificationSucceed(endpoint: string): boolean {
  // 95% success rate for demo purposes
  if (Math.random() < 0.05) {
    return false;
  }

  // Check against known failure patterns
  if (endpoint.includes('fail') || endpoint.includes('error')) {
    return false;
  }

  return true;
}

function getVerificationRule(endpoint: string) {
  for (const [domain, rule] of Object.entries(VERIFICATION_RULES)) {
    if (endpoint.includes(domain)) {
      return rule;
    }
  }
  
  return {
    pattern: /.*/,
    verification: 'generic_verification',
    confidence: 0.85
  };
}

async function mockHttpVerification(endpoint: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    // Mock different verification scenarios
    if (endpoint.includes('github.com')) {
      return {
        success: true,
        data: {
          commit_sha: 'abc123def456',
          message: 'feat: implement ProofPay integration',
          author: 'test-user',
          verified: true
        }
      };
    }

    if (endpoint.includes('twitter.com')) {
      return {
        success: true,
        data: {
          tweet_id: '1234567890',
          text: 'Check out ProofPay! #ProofPay #zkTLS',
          author: '@testuser',
          timestamp: new Date().toISOString(),
          verified: true
        }
      };
    }

    if (endpoint.includes('api.')) {
      return {
        success: true,
        data: {
          status: 'success',
          result: {
            value: Math.random() * 1000,
            timestamp: new Date().toISOString(),
            signature: 'verified_api_response'
          }
        }
      };
    }

    // Generic success response
    return {
      success: true,
      data: {
        status: 'verified',
        endpoint,
        timestamp: new Date().toISOString()
      }
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Verification failed'
    };
  }
}

// ===== API ENDPOINTS =====

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ProofPay Mock zkTLS Verifier',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    dev_mode: DEV_MODE
  });
});

// Main verification endpoint
app.post('/verify', async (req, res) => {
  const { endpoint, task_id, worker, expected_data, proof_type = 'zktls' } = req.body as VerificationRequest;


  if (!endpoint || !task_id || !worker) {
    return res.status(400).json({
      verified: false,
      error: 'Missing required fields: endpoint, task_id, worker'
    });
  }

  try {
    const timestamp = new Date().toISOString();
    const rule = getVerificationRule(endpoint);

    // Check if verification should succeed
    const shouldSucceed = shouldVerificationSucceed(endpoint);
    
    if (!shouldSucceed) {
      return res.json({
        verified: false,
        error: 'Verification failed: endpoint did not meet criteria',
        metadata: {
          endpoint,
          timestamp,
          verification_method: rule.verification,
          confidence_score: 0
        }
      } as VerificationResponse);
    }

    // Perform mock HTTP verification
    const httpResult = await mockHttpVerification(endpoint);
    
    if (!httpResult.success) {
      return res.json({
        verified: false,
        error: httpResult.error,
        metadata: {
          endpoint,
          timestamp,
          verification_method: rule.verification,
          confidence_score: 0.1
        }
      } as VerificationResponse);
    }

    // Generate zkTLS proof hash
    const zkProofHash = generateZkProofHash(endpoint, task_id, timestamp);


    const response: VerificationResponse = {
      verified: true,
      zk_proof_hash: zkProofHash,
      metadata: {
        endpoint,
        timestamp,
        verification_method: rule.verification,
        confidence_score: rule.confidence
      }
    };

    // Trigger mock blockchain events if in dev mode
    if (DEV_MODE) {
      await triggerMockEvents(task_id, worker, zkProofHash, proof_type);
    }

    res.json(response);

  } catch (error) {
    console.error(`❌ Verification exception for ${task_id}:`, error);
    res.status(500).json({
      verified: false,
      error: error instanceof Error ? error.message : 'Internal verification error'
    } as VerificationResponse);
  }
});

// Batch verification endpoint
app.post('/verify/batch', async (req, res) => {
  const requests = req.body.requests as VerificationRequest[];

  if (!Array.isArray(requests)) {
    return res.status(400).json({
      error: 'Body must contain an array of verification requests'
    });
  }


  const results = [];

  for (const request of requests) {
    try {
      const singleResult = await fetch(`http://localhost:${PORT}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      const result = await singleResult.json();
      results.push({
        task_id: request.task_id,
        ...(typeof result === 'object' && result !== null ? result : {})
      });
    } catch (error) {
      results.push({
        task_id: request.task_id,
        verified: false,
        error: 'Batch verification failed for this request'
      });
    }
  }

  res.json({
    total: requests.length,
    verified: results.filter(r => r.verified).length,
    failed: results.filter(r => !r.verified).length,
    results
  });
});

// CLI-style verification endpoint
app.post('/cli/verify', async (req, res) => {
  const { endpoint } = req.body;

  if (!endpoint) {
    return res.status(400).json({ error: 'endpoint is required' });
  }

  const mockRequest: VerificationRequest = {
    endpoint,
    task_id: `cli_task_${Date.now()}`,
    worker: 'cli_user',
    proof_type: 'zktls'
  };

  try {
    const result = await fetch(`http://localhost:${PORT}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockRequest)
    });

    const response = await result.json();
    res.json(response);
  } catch (error) {
    res.status(500).json({
      error: 'CLI verification failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get mock events queue (for testing)
app.get('/dev/events', (req, res) => {
  res.json({
    total: mockEventQueue.length,
    events: mockEventQueue.slice(-10) // Last 10 events
  });
});

// Clear mock events queue
app.delete('/dev/events', (req, res) => {
  mockEventQueue.length = 0;
  res.json({ message: 'Mock events queue cleared' });
});

// ===== MOCK BLOCKCHAIN EVENT SYSTEM =====

async function triggerMockEvents(taskId: string, worker: string, zkProofHash: string, proofType: 'zktls' | 'hybrid') {
  try {
    const baseEvent = {
      txHash: `mock_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      eventIndex: 0,
      blockHeight: Math.floor(Math.random() * 1000000) + 500000,
      timestamp: new Date()
    };

    // 1. ProofSubmitted event
    const proofSubmittedEvent: MockEvent = {
      ...baseEvent,
      type: 'ProofSubmitted',
      data: {
        task_id: taskId,
        worker,
        zk_proof_hash: zkProofHash
      }
    };

    mockEventQueue.push(proofSubmittedEvent);

    // 2. Trigger different flows based on proof type
    if (proofType === 'zktls') {
      // Instant release for zkTLS
      setTimeout(() => {
        const releasedEvent: MockEvent = {
          ...baseEvent,
          txHash: `mock_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'TaskReleased',
          data: {
            task_id: taskId,
            worker,
            amount: '100' // Mock amount
          }
        };

        mockEventQueue.push(releasedEvent);
        
        // Send to indexer if available
        notifyIndexer(releasedEvent);
      }, 2000); // 2 second delay

    } else if (proofType === 'hybrid') {
      // Pending release for hybrid
      setTimeout(() => {
        const pendingEvent: MockEvent = {
          ...baseEvent,
          txHash: `mock_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'TaskPendingRelease',
          data: {
            task_id: taskId,
            verified_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
          }
        };

        mockEventQueue.push(pendingEvent);
        
        // Send to indexer if available
        notifyIndexer(pendingEvent);
      }, 1500); // 1.5 second delay
    }

    // Send initial proof submitted event to indexer
    await notifyIndexer(proofSubmittedEvent);

  } catch (error) {
    console.error('❌ Failed to trigger mock events:', error);
  }
}

async function notifyIndexer(event: MockEvent) {
  try {
    const response = await fetch(`${INDEXER_URL}/dev/mock-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });

    if (response.ok) {
    } else {
    }
  } catch (error) {
  }
}

// ===== SERVER STARTUP =====

app.listen(PORT, () => {
});