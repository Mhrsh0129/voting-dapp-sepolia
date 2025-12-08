/**
 * Assign Roles Script
 * Grants ADMIN_ROLE and ELECTION_MANAGER_ROLE to specified addresses
 * Usage: npx hardhat run scripts/assign-roles.js --network sepolia
 */

const hre = require("hardhat");
const ethers = require("ethers");

// Configuration - Update these addresses
const ROLES_CONFIG = {
  admins: [
    // Add admin addresses here
    "0x8DCe2D8519e84481060A2955A8D2d9217C493363",
  ],
  managers: [
    // Add election manager addresses here
    // "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
  ]
};

async function assignRoles() {
  try {
    // Get signer using hardhat ethers
    const [deployer] = await hre.ethers.getSigners();
    console.log("🔑 Using account:", deployer.address);

    // Get contract address from config or env
    let contractAddress = process.env.CONTRACT_ADDRESS;
    if (!contractAddress) {
      try {
        const config = require('../config.json');
        contractAddress = config.contractAddress;
      } catch (e) {
        console.error("❌ Contract address not found in config.json or .env");
        process.exit(1);
      }
    }

    console.log("📋 Contract Address:", contractAddress);

    // Load contract ABI and connect
    const votingArtifact = require('../artifacts/contracts/Voting.sol/Voting.json');
    const contract = new hre.ethers.Contract(contractAddress, votingArtifact.abi, deployer);

    // Get role identifiers
    const ADMIN_ROLE = await contract.ADMIN_ROLE();
    const ELECTION_MANAGER_ROLE = await contract.ELECTION_MANAGER_ROLE();

    console.log("\n📊 Role Identifiers:");
    console.log("  ADMIN_ROLE:", ADMIN_ROLE);
    console.log("  ELECTION_MANAGER_ROLE:", ELECTION_MANAGER_ROLE);

    // Grant ADMIN_ROLE to specified addresses
    if (ROLES_CONFIG.admins.length > 0) {
      console.log("\n👤 Granting ADMIN_ROLE to:");
      for (const adminAddr of ROLES_CONFIG.admins) {
        try {
          // Validate address format
          if (!hre.ethers.utils.isAddress(adminAddr)) {
            console.warn(`  ⚠️  Invalid address: ${adminAddr}`);
            continue;
          }

          // Check if already has role
          const hasAdminRole = await contract.hasRole(ADMIN_ROLE, adminAddr);
          if (hasAdminRole) {
            console.log(`  ✅ ${adminAddr} already has ADMIN_ROLE`);
            continue;
          }

          console.log(`  ⏳ Granting ADMIN_ROLE to ${adminAddr}...`);
          const tx = await contract.grantRole(ADMIN_ROLE, adminAddr);
          const receipt = await tx.wait();
          console.log(`  ✅ Granted! TX: ${receipt.transactionHash}`);
        } catch (err) {
          console.error(`  ❌ Error granting to ${adminAddr}:`, err.message);
        }
      }
    } else {
      console.log("\n⚠️  No admin addresses configured in ROLES_CONFIG.admins");
    }

    // Grant ELECTION_MANAGER_ROLE to specified addresses
    if (ROLES_CONFIG.managers.length > 0) {
      console.log("\n👥 Granting ELECTION_MANAGER_ROLE to:");
      for (const managerAddr of ROLES_CONFIG.managers) {
        try {
          // Validate address format
          if (!hre.ethers.utils.isAddress(managerAddr)) {
            console.warn(`  ⚠️  Invalid address: ${managerAddr}`);
            continue;
          }

          // Check if already has role
          const hasManagerRole = await contract.hasRole(ELECTION_MANAGER_ROLE, managerAddr);
          if (hasManagerRole) {
            console.log(`  ✅ ${managerAddr} already has ELECTION_MANAGER_ROLE`);
            continue;
          }

          console.log(`  ⏳ Granting ELECTION_MANAGER_ROLE to ${managerAddr}...`);
          const tx = await contract.grantRole(ELECTION_MANAGER_ROLE, managerAddr);
          const receipt = await tx.wait();
          console.log(`  ✅ Granted! TX: ${receipt.transactionHash}`);
        } catch (err) {
          console.error(`  ❌ Error granting to ${managerAddr}:`, err.message);
        }
      }
    } else {
      console.log("\n⚠️  No manager addresses configured in ROLES_CONFIG.managers");
    }

    console.log("\n✅ Role assignment complete!");

  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

// Run the script
assignRoles();
