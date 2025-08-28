#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Network configurations for deployment
const NETWORKS = {
  // EVM Networks
  ethereum: { type: 'evm', name: 'ethereum' },
  polygon: { type: 'evm', name: 'polygon' },
  bsc: { type: 'evm', name: 'bsc' },
  arbitrum: { type: 'evm', name: 'arbitrum' },
  avalanche: { type: 'evm', name: 'avalanche' },
  
  // Cosmos Networks
  'xion-testnet': { type: 'cosmos', name: 'xion-testnet' },
  osmosis: { type: 'cosmos', name: 'osmosis' },
  neutron: { type: 'cosmos', name: 'neutron' },
  juno: { type: 'cosmos', name: 'juno' }
};

async function deployEVMContract(network) {
  console.log(`\n🔄 Deploying EVM contract to ${network}...`);
  
  try {
    const result = execSync(
      `cd packages/contracts-evm && npx hardhat run scripts/deploy.js --network ${network}`,
      { encoding: 'utf8', stdio: 'pipe' }
    );
    
    console.log(`✅ EVM deployment to ${network} successful`);
    console.log(result);
    return true;
  } catch (error) {
    console.error(`❌ EVM deployment to ${network} failed:`);
    console.error(error.stdout || error.message);
    return false;
  }
}

async function deployCosmosContract(network) {
  console.log(`\n🔄 Deploying Cosmos contract to ${network}...`);
  
  try {
    const result = execSync(
      `cd packages/contracts-cosmos && node scripts/deploy.js ${network}`,
      { encoding: 'utf8', stdio: 'pipe' }
    );
    
    console.log(`✅ Cosmos deployment to ${network} successful`);
    console.log(result);
    return true;
  } catch (error) {
    console.error(`❌ Cosmos deployment to ${network} failed:`);
    console.error(error.stdout || error.message);
    return false;
  }
}

async function generateEnvTemplate() {
  console.log('\n🔄 Generating .env template with deployed addresses...');
  
  const deploymentResults = {
    evm: {},
    cosmos: {}
  };

  // Read EVM deployment results
  const evmDeploymentsDir = path.join(__dirname, '..', 'packages', 'contracts-evm', 'deployments');
  if (fs.existsSync(evmDeploymentsDir)) {
    const evmFiles = fs.readdirSync(evmDeploymentsDir).filter(f => f.endsWith('.json'));
    for (const file of evmFiles) {
      const network = file.replace('.json', '');
      const deployment = JSON.parse(fs.readFileSync(path.join(evmDeploymentsDir, file)));
      deploymentResults.evm[network] = deployment.contractAddress;
    }
  }

  // Read Cosmos deployment results
  const cosmosDeploymentsDir = path.join(__dirname, '..', 'packages', 'contracts-cosmos', 'deployments');
  if (fs.existsSync(cosmosDeploymentsDir)) {
    const cosmosFiles = fs.readdirSync(cosmosDeploymentsDir).filter(f => f.endsWith('.json'));
    for (const file of cosmosFiles) {
      const network = file.replace('.json', '');
      const deployment = JSON.parse(fs.readFileSync(path.join(cosmosDeploymentsDir, file)));
      deploymentResults.cosmos[network] = deployment.contractAddress;
    }
  }

  // Update .env.example with deployed addresses
  let envContent = fs.readFileSync(path.join(__dirname, '..', '.env.example'), 'utf8');

  // Update EVM addresses
  if (deploymentResults.evm.ethereum) {
    envContent = envContent.replace(
      'EXPO_PUBLIC_ETHEREUM_PROOFPAY_ADDRESS=0x0000000000000000000000000000000000000000',
      `EXPO_PUBLIC_ETHEREUM_PROOFPAY_ADDRESS=${deploymentResults.evm.ethereum}`
    );
  }
  if (deploymentResults.evm.polygon) {
    envContent = envContent.replace(
      'EXPO_PUBLIC_POLYGON_PROOFPAY_ADDRESS=0x0000000000000000000000000000000000000000',
      `EXPO_PUBLIC_POLYGON_PROOFPAY_ADDRESS=${deploymentResults.evm.polygon}`
    );
  }
  if (deploymentResults.evm.bsc) {
    envContent = envContent.replace(
      'EXPO_PUBLIC_BSC_PROOFPAY_ADDRESS=0x0000000000000000000000000000000000000000',
      `EXPO_PUBLIC_BSC_PROOFPAY_ADDRESS=${deploymentResults.evm.bsc}`
    );
  }
  if (deploymentResults.evm.arbitrum) {
    envContent = envContent.replace(
      'EXPO_PUBLIC_ARBITRUM_PROOFPAY_ADDRESS=0x0000000000000000000000000000000000000000',
      `EXPO_PUBLIC_ARBITRUM_PROOFPAY_ADDRESS=${deploymentResults.evm.arbitrum}`
    );
  }
  if (deploymentResults.evm.avalanche) {
    envContent = envContent.replace(
      'EXPO_PUBLIC_AVALANCHE_PROOFPAY_ADDRESS=0x0000000000000000000000000000000000000000',
      `EXPO_PUBLIC_AVALANCHE_PROOFPAY_ADDRESS=${deploymentResults.evm.avalanche}`
    );
  }

  // Update Cosmos addresses
  if (deploymentResults.cosmos['xion-testnet']) {
    envContent = envContent.replace(
      'EXPO_PUBLIC_XION_PROOFPAY_ADDRESS=xion1...',
      `EXPO_PUBLIC_XION_PROOFPAY_ADDRESS=${deploymentResults.cosmos['xion-testnet']}`
    );
  }
  if (deploymentResults.cosmos.osmosis) {
    envContent = envContent.replace(
      'EXPO_PUBLIC_OSMOSIS_PROOFPAY_ADDRESS=osmo1...',
      `EXPO_PUBLIC_OSMOSIS_PROOFPAY_ADDRESS=${deploymentResults.cosmos.osmosis}`
    );
  }
  if (deploymentResults.cosmos.neutron) {
    envContent = envContent.replace(
      'EXPO_PUBLIC_NEUTRON_PROOFPAY_ADDRESS=neutron1...',
      `EXPO_PUBLIC_NEUTRON_PROOFPAY_ADDRESS=${deploymentResults.cosmos.neutron}`
    );
  }
  if (deploymentResults.cosmos.juno) {
    envContent = envContent.replace(
      'EXPO_PUBLIC_JUNO_PROOFPAY_ADDRESS=juno1...',
      `EXPO_PUBLIC_JUNO_PROOFPAY_ADDRESS=${deploymentResults.cosmos.juno}`
    );
  }

  fs.writeFileSync(path.join(__dirname, '..', '.env.deployed'), envContent);
  console.log('✅ Generated .env.deployed with contract addresses');
}

async function main() {
  const targetNetworks = process.argv.slice(2);
  
  if (targetNetworks.length === 0) {
    console.log('Usage: node scripts/deploy-all.js [network1] [network2] ...');
    console.log('Available networks:', Object.keys(NETWORKS).join(', '));
    console.log('Example: node scripts/deploy-all.js polygon xion-testnet');
    return;
  }

  console.log('🚀 Starting ProofPay multi-chain deployment...');
  console.log(`📋 Target networks: ${targetNetworks.join(', ')}`);

  const results = {
    successful: [],
    failed: []
  };

  for (const network of targetNetworks) {
    if (!NETWORKS[network]) {
      console.error(`❌ Unknown network: ${network}`);
      results.failed.push(network);
      continue;
    }

    const networkConfig = NETWORKS[network];
    let success = false;

    if (networkConfig.type === 'evm') {
      success = await deployEVMContract(network);
    } else if (networkConfig.type === 'cosmos') {
      success = await deployCosmosContract(network);
    }

    if (success) {
      results.successful.push(network);
    } else {
      results.failed.push(network);
    }
  }

  // Generate updated env template
  await generateEnvTemplate();

  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 DEPLOYMENT SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Successful deployments (${results.successful.length}):`, results.successful.join(', '));
  console.log(`❌ Failed deployments (${results.failed.length}):`, results.failed.join(', '));
  console.log('\n💡 Next steps:');
  console.log('1. Copy .env.deployed to .env and fill in your RPC URLs and API keys');
  console.log('2. Update your frontend to use the deployed contract addresses');
  console.log('3. Run tests against the deployed contracts');
  console.log('4. Set up monitoring and indexing for the deployed contracts');

  if (results.failed.length > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}