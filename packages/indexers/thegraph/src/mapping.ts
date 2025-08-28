import { BigInt, Bytes, Address } from "@graphprotocol/graph-ts";
import {
  PaymentCreated,
  PaymentCompleted,
  PaymentCancelled,
  PaymentDisputed,
  ProofSubmitted,
  UserRegistered,
  UserUpdated,
  CrossChainPaymentInitiated
} from "../generated/ProofPayEthereum/ProofPay";
import {
  Payment,
  User,
  ProofSubmission,
  DisputeResolution,
  CrossChainPayment,
  DailyStats,
  ProtocolStats,
  TokenStats
} from "../generated/schema";

// Helper function to get or create user
function getOrCreateUser(address: Address): User {
  let user = User.load(address.toHexString());
  if (user == null) {
    user = new User(address.toHexString());
    user.address = address;
    user.username = "";
    user.metadata = new Bytes(0);
    user.totalPaymentsSent = BigInt.fromI32(0);
    user.totalPaymentsReceived = BigInt.fromI32(0);
    user.totalAmountSent = BigInt.fromI32(0);
    user.totalAmountReceived = BigInt.fromI32(0);
    user.createdAt = BigInt.fromI32(0);
    user.updatedAt = BigInt.fromI32(0);
    user.save();
  }
  return user;
}

// Helper function to update protocol stats
function updateProtocolStats(): void {
  let stats = ProtocolStats.load("protocol-stats");
  if (stats == null) {
    stats = new ProtocolStats("protocol-stats");
    stats.totalPayments = BigInt.fromI32(0);
    stats.totalVolume = BigInt.fromI32(0);
    stats.totalUsers = BigInt.fromI32(0);
    stats.totalProofSubmissions = BigInt.fromI32(0);
    stats.totalDisputes = BigInt.fromI32(0);
    stats.totalCrossChainPayments = BigInt.fromI32(0);
  }
  stats.lastUpdated = BigInt.fromI32(Date.now());
  stats.save();
}

// Helper function to get date string
function getDateString(timestamp: BigInt): string {
  let date = new Date(timestamp.toI64() * 1000);
  let year = date.getUTCFullYear().toString();
  let month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  let day = date.getUTCDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper function to update daily stats
function updateDailyStats(date: string, isNewPayment: boolean, amount: BigInt): void {
  let stats = DailyStats.load(date);
  if (stats == null) {
    stats = new DailyStats(date);
    stats.date = date;
    stats.totalPayments = BigInt.fromI32(0);
    stats.totalVolume = BigInt.fromI32(0);
    stats.totalUsers = BigInt.fromI32(0);
    stats.averagePaymentSize = BigInt.fromI32(0);
    stats.completedPayments = BigInt.fromI32(0);
    stats.disputedPayments = BigInt.fromI32(0);
    stats.crossChainPayments = BigInt.fromI32(0);
  }
  
  if (isNewPayment) {
    stats.totalPayments = stats.totalPayments.plus(BigInt.fromI32(1));
    stats.totalVolume = stats.totalVolume.plus(amount);
    if (stats.totalPayments.gt(BigInt.fromI32(0))) {
      stats.averagePaymentSize = stats.totalVolume.div(stats.totalPayments);
    }
  }
  
  stats.save();
}

export function handlePaymentCreated(event: PaymentCreated): void {
  // Create or get sender and recipient users
  let sender = getOrCreateUser(event.params.sender);
  let recipient = getOrCreateUser(event.params.recipient);
  
  // Create payment entity
  let payment = new Payment(event.params.paymentId.toHexString());
  payment.paymentId = event.params.paymentId;
  payment.sender = sender.id;
  payment.recipient = recipient.id;
  payment.amount = event.params.amount;
  payment.token = event.params.token;
  payment.status = "PENDING";
  
  // Map proof type enum
  if (event.params.proofType == 0) {
    payment.proofType = "DELIVERY_RECEIPT";
  } else if (event.params.proofType == 1) {
    payment.proofType = "SERVICE_COMPLETION";
  } else if (event.params.proofType == 2) {
    payment.proofType = "DIGITAL_SIGNATURE";
  } else if (event.params.proofType == 3) {
    payment.proofType = "ZKTLS_PROOF";
  } else {
    payment.proofType = "CUSTOM";
  }
  
  payment.proofData = new Bytes(0);
  payment.createdAt = event.block.timestamp;
  payment.transactionHash = event.transaction.hash;
  payment.blockNumber = event.block.number;
  payment.save();

  // Update user stats
  sender.totalPaymentsSent = sender.totalPaymentsSent.plus(BigInt.fromI32(1));
  sender.totalAmountSent = sender.totalAmountSent.plus(event.params.amount);
  sender.updatedAt = event.block.timestamp;
  sender.save();

  recipient.totalPaymentsReceived = recipient.totalPaymentsReceived.plus(BigInt.fromI32(1));
  recipient.totalAmountReceived = recipient.totalAmountReceived.plus(event.params.amount);
  recipient.updatedAt = event.block.timestamp;
  recipient.save();

  // Update daily stats
  let dateString = getDateString(event.block.timestamp);
  updateDailyStats(dateString, true, event.params.amount);

  // Update protocol stats
  let protocolStats = ProtocolStats.load("protocol-stats");
  if (protocolStats == null) {
    protocolStats = new ProtocolStats("protocol-stats");
    protocolStats.totalPayments = BigInt.fromI32(0);
    protocolStats.totalVolume = BigInt.fromI32(0);
    protocolStats.totalUsers = BigInt.fromI32(0);
    protocolStats.totalProofSubmissions = BigInt.fromI32(0);
    protocolStats.totalDisputes = BigInt.fromI32(0);
    protocolStats.totalCrossChainPayments = BigInt.fromI32(0);
  }
  protocolStats.totalPayments = protocolStats.totalPayments.plus(BigInt.fromI32(1));
  protocolStats.totalVolume = protocolStats.totalVolume.plus(event.params.amount);
  protocolStats.lastUpdated = event.block.timestamp;
  protocolStats.save();

  // Update token stats
  let tokenStats = TokenStats.load(event.params.token.toHexString());
  if (tokenStats == null) {
    tokenStats = new TokenStats(event.params.token.toHexString());
    tokenStats.token = event.params.token;
    tokenStats.totalVolume = BigInt.fromI32(0);
    tokenStats.totalPayments = BigInt.fromI32(0);
  }
  tokenStats.totalVolume = tokenStats.totalVolume.plus(event.params.amount);
  tokenStats.totalPayments = tokenStats.totalPayments.plus(BigInt.fromI32(1));
  tokenStats.lastUpdated = event.block.timestamp;
  tokenStats.save();
}

export function handlePaymentCompleted(event: PaymentCompleted): void {
  let payment = Payment.load(event.params.paymentId.toHexString());
  if (payment != null) {
    payment.status = "COMPLETED";
    payment.completedAt = event.block.timestamp;
    payment.save();

    // Update daily stats
    let dateString = getDateString(event.block.timestamp);
    let dailyStats = DailyStats.load(dateString);
    if (dailyStats != null) {
      dailyStats.completedPayments = dailyStats.completedPayments.plus(BigInt.fromI32(1));
      dailyStats.save();
    }
  }
}

export function handlePaymentCancelled(event: PaymentCancelled): void {
  let payment = Payment.load(event.params.paymentId.toHexString());
  if (payment != null) {
    payment.status = "CANCELLED";
    payment.cancelledAt = event.block.timestamp;
    payment.save();
  }
}

export function handlePaymentDisputed(event: PaymentDisputed): void {
  let payment = Payment.load(event.params.paymentId.toHexString());
  if (payment != null) {
    payment.status = "DISPUTED";
    payment.disputedAt = event.block.timestamp;
    payment.save();

    // Create dispute resolution entity
    let disputeId = event.params.paymentId.toHexString() + "-" + event.transaction.hash.toHexString();
    let dispute = new DisputeResolution(disputeId);
    dispute.payment = payment.id;
    dispute.disputant = event.params.disputant.toHexString();
    dispute.reason = event.params.reason;
    dispute.resolved = false;
    dispute.createdAt = event.block.timestamp;
    dispute.transactionHash = event.transaction.hash;
    dispute.save();

    // Update daily stats
    let dateString = getDateString(event.block.timestamp);
    let dailyStats = DailyStats.load(dateString);
    if (dailyStats != null) {
      dailyStats.disputedPayments = dailyStats.disputedPayments.plus(BigInt.fromI32(1));
      dailyStats.save();
    }

    // Update protocol stats
    let protocolStats = ProtocolStats.load("protocol-stats");
    if (protocolStats != null) {
      protocolStats.totalDisputes = protocolStats.totalDisputes.plus(BigInt.fromI32(1));
      protocolStats.lastUpdated = event.block.timestamp;
      protocolStats.save();
    }
  }
}

export function handleProofSubmitted(event: ProofSubmitted): void {
  // Create proof submission entity
  let proofId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  let proof = new ProofSubmission(proofId);
  proof.payment = event.params.paymentId.toHexString();
  proof.submitter = event.params.submitter.toHexString();
  
  // Map proof type
  if (event.params.proofType == 0) {
    proof.proofType = "DELIVERY_RECEIPT";
  } else if (event.params.proofType == 1) {
    proof.proofType = "SERVICE_COMPLETION";
  } else if (event.params.proofType == 2) {
    proof.proofType = "DIGITAL_SIGNATURE";
  } else if (event.params.proofType == 3) {
    proof.proofType = "ZKTLS_PROOF";
  } else {
    proof.proofType = "CUSTOM";
  }
  
  proof.proofData = event.params.proofData;
  proof.submittedAt = event.block.timestamp;
  proof.transactionHash = event.transaction.hash;
  proof.blockNumber = event.block.number;
  proof.save();

  // Update protocol stats
  let protocolStats = ProtocolStats.load("protocol-stats");
  if (protocolStats != null) {
    protocolStats.totalProofSubmissions = protocolStats.totalProofSubmissions.plus(BigInt.fromI32(1));
    protocolStats.lastUpdated = event.block.timestamp;
    protocolStats.save();
  }
}

export function handleUserRegistered(event: UserRegistered): void {
  let user = getOrCreateUser(event.params.user);
  user.username = event.params.username;
  user.metadata = event.params.metadata;
  user.createdAt = event.block.timestamp;
  user.updatedAt = event.block.timestamp;
  user.save();

  // Update protocol stats
  let protocolStats = ProtocolStats.load("protocol-stats");
  if (protocolStats != null) {
    protocolStats.totalUsers = protocolStats.totalUsers.plus(BigInt.fromI32(1));
    protocolStats.lastUpdated = event.block.timestamp;
    protocolStats.save();
  }
}

export function handleUserUpdated(event: UserUpdated): void {
  let user = getOrCreateUser(event.params.user);
  user.username = event.params.username;
  user.metadata = event.params.metadata;
  user.updatedAt = event.block.timestamp;
  user.save();
}

export function handleCrossChainPaymentInitiated(event: CrossChainPaymentInitiated): void {
  let payment = Payment.load(event.params.paymentId.toHexString());
  if (payment != null) {
    // Create cross-chain payment entity
    let crossChainPayment = new CrossChainPayment(event.params.paymentId.toHexString());
    crossChainPayment.payment = payment.id;
    crossChainPayment.destinationChainSelector = event.params.destinationChainSelector;
    crossChainPayment.destinationRecipient = event.params.recipient;
    crossChainPayment.status = "initiated";
    crossChainPayment.initiatedAt = event.block.timestamp;
    crossChainPayment.transactionHash = event.transaction.hash;
    crossChainPayment.save();

    // Update payment entity
    payment.crossChainDestination = event.params.destinationChainSelector;
    payment.crossChainRecipient = event.params.recipient;
    payment.save();

    // Update daily stats
    let dateString = getDateString(event.block.timestamp);
    let dailyStats = DailyStats.load(dateString);
    if (dailyStats != null) {
      dailyStats.crossChainPayments = dailyStats.crossChainPayments.plus(BigInt.fromI32(1));
      dailyStats.save();
    }

    // Update protocol stats
    let protocolStats = ProtocolStats.load("protocol-stats");
    if (protocolStats != null) {
      protocolStats.totalCrossChainPayments = protocolStats.totalCrossChainPayments.plus(BigInt.fromI32(1));
      protocolStats.lastUpdated = event.block.timestamp;
      protocolStats.save();
    }
  }
}