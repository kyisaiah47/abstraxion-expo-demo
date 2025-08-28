const { CosmWasmClient, SigningCosmWasmClient } = require('@cosmjs/cosmwasm-stargate');
const { DirectSecp256k1HdWallet } = require('@cosmjs/proto-signing');
const { GasPrice } = require('@cosmjs/stargate');
const fs = require('fs');
const path = require('path');

// Chain configurations
const CHAIN_CONFIGS = {
  'xion-testnet': {
    rpcEndpoint: process.env.EXPO_PUBLIC_XION_RPC_URL || 'https://rpc.xion-testnet-2.burnt.com:443',
    prefix: 'xion',
    gasPrice: GasPrice.fromString('0.001uxion'),
    denom: 'uxion'
  },
  osmosis: {
    rpcEndpoint: process.env.EXPO_PUBLIC_OSMOSIS_RPC_URL || 'https://rpc.osmosis.zone:443',
    prefix: 'osmo',
    gasPrice: GasPrice.fromString('0.0025uosmo'),
    denom: 'uosmo'
  },
  neutron: {
    rpcEndpoint: process.env.EXPO_PUBLIC_NEUTRON_RPC_URL || 'https://rpc.neutron.org:443',
    prefix: 'neutron',
    gasPrice: GasPrice.fromString('0.0025untrn'),
    denom: 'untrn'
  },
  juno: {
    rpcEndpoint: process.env.EXPO_PUBLIC_JUNO_RPC_URL || 'https://rpc.juno.omniflix.co:443',
    prefix: 'juno',
    gasPrice: GasPrice.fromString('0.0025ujuno'),
    denom: 'ujuno'
  }
};

async function deployContract(network, mnemonic, wasmPath) {
  console.log(`\n=== Deploying to ${network} ===`);
  
  const config = CHAIN_CONFIGS[network];
  if (!config) {
    throw new Error(`Unknown network: ${network}`);
  }

  // Create wallet from mnemonic
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
    prefix: config.prefix,
  });

  // Get first account
  const [account] = await wallet.getAccounts();
  console.log(`Deploying from account: ${account.address}`);

  // Create signing client
  const client = await SigningCosmWasmClient.connectWithSigner(
    config.rpcEndpoint,
    wallet,
    {
      gasPrice: config.gasPrice,
    }
  );

  // Check balance
  const balance = await client.getBalance(account.address, config.denom);
  console.log(`Account balance: ${balance.amount}${balance.denom}`);

  // Read wasm file
  const wasmCode = fs.readFileSync(wasmPath);
  
  console.log("Uploading contract code...");
  
  // Upload code
  const uploadResult = await client.upload(
    account.address,
    wasmCode,
    "auto",
    "ProofPay CosmWasm Contract"
  );
  
  console.log(`Code uploaded successfully. Code ID: ${uploadResult.codeId}`);
  console.log(`Transaction hash: ${uploadResult.transactionHash}`);

  // Instantiate contract
  console.log("Instantiating contract...");
  
  const instantiateMsg = {
    max_payments_per_day: 100,
    base_fee_bps: 100, // 1%
    admin: account.address
  };

  const instantiateResult = await client.instantiate(
    account.address,
    uploadResult.codeId,
    instantiateMsg,
    "ProofPay Contract",
    "auto",
    {
      admin: account.address,
    }
  );

  console.log(`Contract instantiated successfully!`);
  console.log(`Contract address: ${instantiateResult.contractAddress}`);
  console.log(`Transaction hash: ${instantiateResult.transactionHash}`);

  // Save deployment info
  const deploymentInfo = {
    network: network,
    contractAddress: instantiateResult.contractAddress,
    codeId: uploadResult.codeId,
    deployerAddress: account.address,
    uploadTxHash: uploadResult.transactionHash,
    instantiateTxHash: instantiateResult.transactionHash,
    instantiateMsg: instantiateMsg,
    timestamp: new Date().toISOString(),
    rpcEndpoint: config.rpcEndpoint,
    gasPrice: config.gasPrice.toString(),
    denom: config.denom
  };

  // Create deployments directory
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save deployment info
  const deploymentFile = path.join(deploymentsDir, `${network}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  
  console.log(`Deployment info saved to: ${deploymentFile}`);

  return deploymentInfo;
}

async function main() {
  const network = process.argv[2];
  const mnemonic = process.env.MNEMONIC;
  
  if (!network) {
    console.error("Please specify a network: xion-testnet, osmosis, neutron, or juno");
    process.exit(1);
  }
  
  if (!mnemonic) {
    console.error("Please set MNEMONIC environment variable");
    process.exit(1);
  }

  // Path to compiled wasm file
  const wasmPath = path.join(__dirname, "..", "artifacts", "proofpay.wasm");
  
  if (!fs.existsSync(wasmPath)) {
    console.error(`WASM file not found at: ${wasmPath}`);
    console.error("Please compile the contract first using: cargo wasm");
    process.exit(1);
  }

  try {
    const deploymentInfo = await deployContract(network, mnemonic, wasmPath);
    
    console.log("\n=== Deployment Summary ===");
    console.log(`Network: ${deploymentInfo.network}`);
    console.log(`Contract Address: ${deploymentInfo.contractAddress}`);
    console.log(`Code ID: ${deploymentInfo.codeId}`);
    console.log(`Deployer: ${deploymentInfo.deployerAddress}`);
    console.log("=============================");
    
  } catch (error) {
    console.error("Deployment failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { deployContract };