import {
  CosmosEvent,
  CosmosMessage,
} from "@subql/types-cosmos";
import {
  User,
  Payment,
  ProofSubmission,
  DisputeResolution,
  IBCTransfer,
  DailyStats,
  ChainStats,
  DenomStats,
  ContractEvent,
  IBCChannel,
} from "../types";

// Helper function to get or create user
async function getOrCreateUser(address: string, chain: string): Promise<User> {
  const userId = `${chain}-${address}`;
  let user = await User.get(userId);
  
  if (!user) {
    user = User.create({
      id: userId,
      address: address,
      chain: chain,
      totalPaymentsSent: BigInt(0),
      totalPaymentsReceived: BigInt(0),
      totalAmountSent: BigInt(0),
      totalAmountReceived: BigInt(0),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await user.save();
  }
  
  return user;
}

// Helper function to update chain stats
async function updateChainStats(chain: string, contractAddress: string): Promise<void> {
  let stats = await ChainStats.get(chain);
  if (!stats) {
    stats = ChainStats.create({
      id: chain,
      chain: chain,
      contractAddress: contractAddress,
      totalPayments: BigInt(0),
      totalVolume: BigInt(0),
      totalUsers: BigInt(0),
      totalProofSubmissions: BigInt(0),
      totalDisputes: BigInt(0),
      totalIBCTransfers: BigInt(0),
      lastUpdated: new Date(),
    });
  } else {
    stats.lastUpdated = new Date();
  }
  await stats.save();
}

// Helper function to update daily stats
async function updateDailyStats(
  chain: string,
  date: string,
  isNewPayment: boolean,
  amount?: bigint
): Promise<void> {
  const statsId = `${chain}-${date}`;
  let stats = await DailyStats.get(statsId);
  
  if (!stats) {
    stats = DailyStats.create({
      id: statsId,
      chain: chain,
      date: date,
      totalPayments: BigInt(0),
      totalVolume: BigInt(0),
      totalUsers: BigInt(0),
      averagePaymentSize: BigInt(0),
      completedPayments: BigInt(0),
      disputedPayments: BigInt(0),
      ibcTransfers: BigInt(0),
      uniqueActiveUsers: BigInt(0),
    });
  }
  
  if (isNewPayment && amount) {
    stats.totalPayments = stats.totalPayments + BigInt(1);
    stats.totalVolume = stats.totalVolume + amount;
    if (stats.totalPayments > BigInt(0)) {
      stats.averagePaymentSize = stats.totalVolume / stats.totalPayments;
    }
  }
  
  await stats.save();
}

// Helper function to get date string
function getDateString(timestamp: Date): string {
  return timestamp.toISOString().split('T')[0];
}

// Helper function to extract attributes from event
function extractEventAttributes(event: CosmosEvent): Record<string, string> {
  const attributes: Record<string, string> = {};
  
  for (const attr of event.event.attributes) {
    const key = Buffer.from(attr.key, 'base64').toString();
    const value = Buffer.from(attr.value, 'base64').toString();
    attributes[key] = value;
  }
  
  return attributes;
}

export async function handleContractInstantiation(msg: CosmosMessage): Promise<void> {
  logger.info(`Processing contract instantiation: ${msg.tx.hash}`);
  
  // Update chain stats with contract address
  const chain = "xion-testnet"; // This should be dynamic based on the chain
  const contractAddress = msg.msg.contract || "unknown";
  await updateChainStats(chain, contractAddress);
}

export async function handlePaymentCreated(event: CosmosEvent): Promise<void> {
  logger.info(`Processing payment created event: ${event.tx.hash}`);
  
  const attributes = extractEventAttributes(event);
  const chain = "xion-testnet"; // This should be dynamic
  
  // Extract payment details from attributes
  const paymentId = attributes.payment_id;
  const sender = attributes.sender;
  const recipient = attributes.recipient;
  const amount = attributes.amount;
  const denom = attributes.denom || "uxion";
  const proofType = attributes.proof_type || "CUSTOM";
  
  if (!paymentId || !sender || !recipient || !amount) {
    logger.warn(`Missing required attributes in payment created event: ${event.tx.hash}`);
    return;
  }
  
  // Get or create users
  const senderUser = await getOrCreateUser(sender, chain);
  const recipientUser = await getOrCreateUser(recipient, chain);
  
  // Create payment entity
  const payment = Payment.create({
    id: `${chain}-${paymentId}`,
    paymentId: paymentId,
    senderId: senderUser.id,
    recipientId: recipientUser.id,
    amount: BigInt(amount),
    denom: denom,
    status: "PENDING",
    proofType: proofType as any,
    chain: chain,
    contractAddress: event.event.attributes.find(a => 
      Buffer.from(a.key, 'base64').toString() === 'contract_address'
    )?.value ? Buffer.from(event.event.attributes.find(a => 
      Buffer.from(a.key, 'base64').toString() === 'contract_address'
    )!.value, 'base64').toString() : "",
    createdAt: new Date(event.block.header.time.toISOString()),
    transactionHash: event.tx.hash,
    blockHeight: BigInt(event.block.header.height),
  });
  
  await payment.save();
  
  // Update user stats
  senderUser.totalPaymentsSent = senderUser.totalPaymentsSent + BigInt(1);
  senderUser.totalAmountSent = senderUser.totalAmountSent + BigInt(amount);
  senderUser.updatedAt = new Date();
  await senderUser.save();
  
  recipientUser.totalPaymentsReceived = recipientUser.totalPaymentsReceived + BigInt(1);
  recipientUser.totalAmountReceived = recipientUser.totalAmountReceived + BigInt(amount);
  recipientUser.updatedAt = new Date();
  await recipientUser.save();
  
  // Update statistics
  const dateString = getDateString(new Date(event.block.header.time.toISOString()));
  await updateDailyStats(chain, dateString, true, BigInt(amount));
  
  // Update chain stats
  let chainStats = await ChainStats.get(chain);
  if (chainStats) {
    chainStats.totalPayments = chainStats.totalPayments + BigInt(1);
    chainStats.totalVolume = chainStats.totalVolume + BigInt(amount);
    chainStats.lastUpdated = new Date();
    await chainStats.save();
  }
  
  // Update denomination stats
  const denomStatsId = `${chain}-${denom}`;
  let denomStats = await DenomStats.get(denomStatsId);
  if (!denomStats) {
    denomStats = DenomStats.create({
      id: denomStatsId,
      chain: chain,
      denom: denom,
      totalVolume: BigInt(0),
      totalPayments: BigInt(0),
      lastUpdated: new Date(),
    });
  }
  denomStats.totalVolume = denomStats.totalVolume + BigInt(amount);
  denomStats.totalPayments = denomStats.totalPayments + BigInt(1);
  denomStats.lastUpdated = new Date();
  await denomStats.save();
  
  // Create contract event record
  const contractEvent = ContractEvent.create({
    id: `${event.tx.hash}-${event.idx}`,
    chain: chain,
    contractAddress: payment.contractAddress,
    eventType: "create_payment",
    attributes: JSON.stringify(attributes),
    transactionHash: event.tx.hash,
    blockHeight: BigInt(event.block.header.height),
    timestamp: new Date(event.block.header.time.toISOString()),
  });
  
  await contractEvent.save();
}

export async function handlePaymentCompleted(event: CosmosEvent): Promise<void> {
  logger.info(`Processing payment completed event: ${event.tx.hash}`);
  
  const attributes = extractEventAttributes(event);
  const chain = "xion-testnet";
  const paymentId = attributes.payment_id;
  
  if (!paymentId) {
    logger.warn(`Missing payment_id in payment completed event: ${event.tx.hash}`);
    return;
  }
  
  const payment = await Payment.get(`${chain}-${paymentId}`);
  if (payment) {
    payment.status = "COMPLETED";
    payment.completedAt = new Date(event.block.header.time.toISOString());
    await payment.save();
    
    // Update daily stats
    const dateString = getDateString(new Date(event.block.header.time.toISOString()));
    const dailyStats = await DailyStats.get(`${chain}-${dateString}`);
    if (dailyStats) {
      dailyStats.completedPayments = dailyStats.completedPayments + BigInt(1);
      await dailyStats.save();
    }
  }
}

export async function handlePaymentCancelled(event: CosmosEvent): Promise<void> {
  logger.info(`Processing payment cancelled event: ${event.tx.hash}`);
  
  const attributes = extractEventAttributes(event);
  const chain = "xion-testnet";
  const paymentId = attributes.payment_id;
  
  if (!paymentId) {
    logger.warn(`Missing payment_id in payment cancelled event: ${event.tx.hash}`);
    return;
  }
  
  const payment = await Payment.get(`${chain}-${paymentId}`);
  if (payment) {
    payment.status = "CANCELLED";
    payment.cancelledAt = new Date(event.block.header.time.toISOString());
    await payment.save();
  }
}

export async function handlePaymentDisputed(event: CosmosEvent): Promise<void> {
  logger.info(`Processing payment disputed event: ${event.tx.hash}`);
  
  const attributes = extractEventAttributes(event);
  const chain = "xion-testnet";
  const paymentId = attributes.payment_id;
  const disputant = attributes.disputant;
  const reason = attributes.reason || "";
  
  if (!paymentId || !disputant) {
    logger.warn(`Missing required attributes in payment disputed event: ${event.tx.hash}`);
    return;
  }
  
  const payment = await Payment.get(`${chain}-${paymentId}`);
  if (payment) {
    payment.status = "DISPUTED";
    payment.disputedAt = new Date(event.block.header.time.toISOString());
    await payment.save();
    
    // Create dispute resolution entity
    const dispute = DisputeResolution.create({
      id: `${chain}-${paymentId}-${event.tx.hash}`,
      paymentId: payment.id,
      disputantId: await getOrCreateUser(disputant, chain).then(u => u.id),
      reason: reason,
      resolved: false,
      chain: chain,
      createdAt: new Date(event.block.header.time.toISOString()),
      transactionHash: event.tx.hash,
    });
    
    await dispute.save();
    
    // Update daily stats
    const dateString = getDateString(new Date(event.block.header.time.toISOString()));
    const dailyStats = await DailyStats.get(`${chain}-${dateString}`);
    if (dailyStats) {
      dailyStats.disputedPayments = dailyStats.disputedPayments + BigInt(1);
      await dailyStats.save();
    }
    
    // Update chain stats
    const chainStats = await ChainStats.get(chain);
    if (chainStats) {
      chainStats.totalDisputes = chainStats.totalDisputes + BigInt(1);
      chainStats.lastUpdated = new Date();
      await chainStats.save();
    }
  }
}

export async function handleProofSubmitted(event: CosmosEvent): Promise<void> {
  logger.info(`Processing proof submitted event: ${event.tx.hash}`);
  
  const attributes = extractEventAttributes(event);
  const chain = "xion-testnet";
  const paymentId = attributes.payment_id;
  const submitter = attributes.submitter;
  const proofType = attributes.proof_type || "CUSTOM";
  const proofData = attributes.proof_data || "";
  
  if (!paymentId || !submitter) {
    logger.warn(`Missing required attributes in proof submitted event: ${event.tx.hash}`);
    return;
  }
  
  const submitterUser = await getOrCreateUser(submitter, chain);
  
  const proof = ProofSubmission.create({
    id: `${event.tx.hash}-${event.idx}`,
    paymentId: `${chain}-${paymentId}`,
    submitterId: submitterUser.id,
    proofType: proofType as any,
    proofData: proofData,
    chain: chain,
    submittedAt: new Date(event.block.header.time.toISOString()),
    transactionHash: event.tx.hash,
    blockHeight: BigInt(event.block.header.height),
  });
  
  await proof.save();
  
  // Update chain stats
  const chainStats = await ChainStats.get(chain);
  if (chainStats) {
    chainStats.totalProofSubmissions = chainStats.totalProofSubmissions + BigInt(1);
    chainStats.lastUpdated = new Date();
    await chainStats.save();
  }
}

export async function handleUserRegistered(event: CosmosEvent): Promise<void> {
  logger.info(`Processing user registered event: ${event.tx.hash}`);
  
  const attributes = extractEventAttributes(event);
  const chain = "xion-testnet";
  const userAddress = attributes.user;
  const username = attributes.username || "";
  const metadata = attributes.metadata || "";
  
  if (!userAddress) {
    logger.warn(`Missing user address in user registered event: ${event.tx.hash}`);
    return;
  }
  
  const user = await getOrCreateUser(userAddress, chain);
  user.username = username;
  user.metadata = metadata;
  user.createdAt = new Date(event.block.header.time.toISOString());
  user.updatedAt = new Date(event.block.header.time.toISOString());
  await user.save();
  
  // Update chain stats
  const chainStats = await ChainStats.get(chain);
  if (chainStats) {
    chainStats.totalUsers = chainStats.totalUsers + BigInt(1);
    chainStats.lastUpdated = new Date();
    await chainStats.save();
  }
}

export async function handleIBCTransferInitiated(event: CosmosEvent): Promise<void> {
  logger.info(`Processing IBC transfer initiated event: ${event.tx.hash}`);
  
  const attributes = extractEventAttributes(event);
  const sourceChain = "xion-testnet";
  
  const packetSequence = attributes.packet_sequence;
  const sourceChannel = attributes.packet_src_channel;
  const destinationChannel = attributes.packet_dst_channel;
  const sender = attributes.sender;
  const receiver = attributes.receiver;
  const amount = attributes.amount;
  const denom = attributes.denom;
  
  if (!packetSequence || !sourceChannel || !destinationChannel) {
    logger.warn(`Missing required attributes in IBC transfer event: ${event.tx.hash}`);
    return;
  }
  
  const ibcTransfer = IBCTransfer.create({
    id: `${packetSequence}-${sourceChannel}`,
    sourceChain: sourceChain,
    destinationChain: "unknown", // This would need to be mapped from channel
    sourceChannel: sourceChannel,
    destinationChannel: destinationChannel,
    sender: sender || "",
    receiver: receiver || "",
    amount: amount ? BigInt(amount) : BigInt(0),
    denom: denom || "",
    packetSequence: BigInt(packetSequence),
    status: "sent",
    createdAt: new Date(event.block.header.time.toISOString()),
    transactionHash: event.tx.hash,
  });
  
  await ibcTransfer.save();
  
  // Update chain stats
  const chainStats = await ChainStats.get(sourceChain);
  if (chainStats) {
    chainStats.totalIBCTransfers = chainStats.totalIBCTransfers + BigInt(1);
    chainStats.lastUpdated = new Date();
    await chainStats.save();
  }
  
  // Update daily stats
  const dateString = getDateString(new Date(event.block.header.time.toISOString()));
  const dailyStats = await DailyStats.get(`${sourceChain}-${dateString}`);
  if (dailyStats) {
    dailyStats.ibcTransfers = dailyStats.ibcTransfers + BigInt(1);
    await dailyStats.save();
  }
}

export async function handleIBCPacketAck(event: CosmosEvent): Promise<void> {
  logger.info(`Processing IBC packet acknowledgment event: ${event.tx.hash}`);
  
  const attributes = extractEventAttributes(event);
  const packetSequence = attributes.packet_sequence;
  const sourceChannel = attributes.packet_src_channel;
  
  if (!packetSequence || !sourceChannel) {
    logger.warn(`Missing required attributes in IBC packet ack event: ${event.tx.hash}`);
    return;
  }
  
  const ibcTransfer = await IBCTransfer.get(`${packetSequence}-${sourceChannel}`);
  if (ibcTransfer) {
    ibcTransfer.status = "acknowledged";
    ibcTransfer.acknowledgedAt = new Date(event.block.header.time.toISOString());
    ibcTransfer.acknowledgmentTxHash = event.tx.hash;
    await ibcTransfer.save();
  }
}