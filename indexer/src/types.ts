// Event types that we listen for from the contract
export type ContractEventType = 
  | 'TaskCreated'
  | 'ProofSubmitted' 
  | 'TaskPendingRelease'
  | 'TaskReleased'
  | 'TaskDisputed'
  | 'TaskRefunded';

// Task status enum matching Supabase schema
export enum TaskStatus {
  PENDING = 'pending',
  PROOF_SUBMITTED = 'proof_submitted', 
  PENDING_RELEASE = 'pending_release',
  RELEASED = 'released',
  DISPUTED = 'disputed',
  REFUNDED = 'refunded'
}

// Proof type enum
export enum ProofType {
  SOFT = 'soft',
  ZKTLS = 'zktls', 
  HYBRID = 'hybrid'
}

// Notification types
export enum NotificationType {
  TASK_CREATED = 'task_created',
  PROOF_SUBMITTED = 'proof_submitted',
  PENDING_RELEASE_STARTED = 'pending_release_started',
  TASK_RELEASED = 'task_released',
  TASK_DISPUTED = 'task_disputed',
  TASK_REFUNDED = 'task_refunded'
}

// Activity feed verb types
export enum ActivityVerb {
  CREATED_TASK = 'created_task',
  ACCEPTED_TASK = 'accepted_task', 
  SUBMITTED_PROOF = 'submitted_proof',
  RELEASED_PAYMENT = 'released_payment',
  DISPUTED_TASK = 'disputed_task',
  RESOLVED_DISPUTE = 'resolved_dispute'
}

// Contract event data structures
export interface TaskCreatedEvent {
  task_id: string;
  payer: string;
  worker?: string;
  amount: string;
  denom: string;
  proof_type: ProofType;
  description?: string;
  endpoint?: string;
  review_window_secs?: number;
  deadline_ts?: string;
}

export interface ProofSubmittedEvent {
  task_id: string;
  worker: string;
  proof_hash?: string;
  proof_url?: string;
  zk_proof_hash?: string;
}

export interface TaskPendingReleaseEvent {
  task_id: string;
  verified_at: string;
  expires_at: string;
}

export interface TaskReleasedEvent {
  task_id: string;
  worker: string;
  amount: string;
}

export interface TaskDisputedEvent {
  task_id: string;
  disputer: string;
  reason?: string;
}

export interface TaskRefundedEvent {
  task_id: string;
  payer: string;
  amount: string;
}

// Parsed blockchain event
export interface ParsedEvent {
  type: ContractEventType;
  data: TaskCreatedEvent | ProofSubmittedEvent | TaskPendingReleaseEvent | TaskReleasedEvent | TaskDisputedEvent | TaskRefundedEvent;
  txHash: string;
  eventIndex: number;
  blockHeight: number;
  timestamp: Date;
}

// Supabase task record
export interface TaskRecord {
  id: string; // task_id
  payer: string;
  worker?: string;
  amount: number;
  denom: string;
  proof_type: ProofType;
  status: TaskStatus;
  description?: string;
  endpoint?: string;
  evidence_hash?: string;
  zk_proof_hash?: string;
  deadline_ts?: string;
  review_window_secs?: number;
  verified_at?: string;
  pending_release_expires_at?: string;
  created_at: string;
  updated_at: string;
}

// Supabase notification record
export interface NotificationRecord {
  id?: string;
  user_id?: string;
  type: NotificationType;
  task_id: string;
  title: string;
  message: string;
  payload: Record<string, any>;
  created_at?: string;
  read_at?: string;
}

// Activity feed record
export interface ActivityFeedRecord {
  id?: string;
  actor: string; // wallet address
  verb: ActivityVerb;
  task_id: string;
  meta: Record<string, any>;
  created_at?: string;
}

// User record for notifications
export interface UserRecord {
  id: string;
  wallet_address: string;
  username?: string;
  display_name?: string;
  profile_picture?: string;
  created_at: string;
}

// OneSignal notification payload
export interface PushNotificationPayload {
  app_id: string;
  include_external_user_ids: string[];
  headings: { en: string };
  contents: { en: string };
  data: {
    type: string;
    task_id: string;
    [key: string]: any;
  };
}

// Idempotency tracking
export interface ProcessedEvent {
  tx_hash: string;
  event_index: number;
  processed_at: string;
}

// Cron job result
export interface CronJobResult {
  processed: number;
  errors: number;
  details: Array<{
    task_id: string;
    success: boolean;
    error?: string;
  }>;
}