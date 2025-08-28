const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting ProofPay EVM deployment...");
  
  // Get deployment network
  const network = hre.network.name;
  console.log(`Deploying to network: ${network}`);
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);
  console.log(`Account balance: ${ethers.utils.formatEther(await deployer.getBalance())} ETH`);

  // Deploy ProofPay contract
  console.log("\nDeploying ProofPay contract...");
  const ProofPay = await ethers.getContractFactory("ProofPay");
  
  // Constructor parameters
  const maxPaymentsPerDay = 100;
  const baseFeeBps = 100; // 1%
  
  const proofPay = await ProofPay.deploy(maxPaymentsPerDay, baseFeeBps);
  await proofPay.deployed();
  
  console.log(`ProofPay deployed to: ${proofPay.address}`);
  console.log(`Transaction hash: ${proofPay.deployTransaction.hash}`);

  // Wait for a few confirmations
  console.log("Waiting for confirmations...");
  await proofPay.deployTransaction.wait(3);

  // Save deployment info
  const deploymentInfo = {
    network: network,
    contractAddress: proofPay.address,
    deployerAddress: deployer.address,
    transactionHash: proofPay.deployTransaction.hash,
    blockNumber: proofPay.deployTransaction.blockNumber,
    maxPaymentsPerDay: maxPaymentsPerDay,
    baseFeeBps: baseFeeBps,
    timestamp: new Date().toISOString(),
    abi: JSON.parse(proofPay.interface.format('json'))
  };

  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save deployment info to file
  const deploymentFile = path.join(deploymentsDir, `${network}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  
  console.log(`Deployment info saved to: ${deploymentFile}`);

  // Verify contract if on a public network
  if (network !== "hardhat" && network !== "localhost") {
    console.log("\nVerifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: proofPay.address,
        constructorArguments: [maxPaymentsPerDay, baseFeeBps],
      });
      console.log("Contract verified successfully!");
    } catch (error) {
      console.log("Verification failed:", error.message);
    }
  }

  console.log("\n=== Deployment Summary ===");
  console.log(`Network: ${network}`);
  console.log(`Contract Address: ${proofPay.address}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Gas Used: ${proofPay.deployTransaction.gasLimit}`);
  console.log("=============================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });