const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Function to log contract address to history file
function logContractAddress(address, candidates, duration) {
  const logPath = path.join(__dirname, '..', 'contract-addresses.txt');
  const timestamp = new Date().toISOString();
  const localTime = new Date().toLocaleString();
  
  const logEntry = `
${'='.repeat(80)}
Deployment Date: ${localTime}
Timestamp: ${timestamp}
Contract Address: ${address}
Network: Sepolia
Candidates: ${candidates.join(', ')}
Voting Duration: ${duration} minutes
Etherscan: https://sepolia.etherscan.io/address/${address}
${'='.repeat(80)}
`;
  
  // Append to file (create if doesn't exist)
  fs.appendFileSync(logPath, logEntry);
  console.log("✅ Contract address logged to contract-addresses.txt");
}

async function main() {
  console.log("🚀 Starting deployment process...\n");
  
  // Get duration from environment variable or command line args with validation
  const args = process.argv.slice(2);
  const durationArg = args.find(arg => arg.startsWith('--duration='));
  const envDuration = process.env.ELECTION_DURATION;
  let duration = 2; // Default value
  
  // Priority: command-line arg > environment variable > default
  if (durationArg) {
    const parsedDuration = parseInt(durationArg.split('=')[1], 10);
    
    if (Number.isInteger(parsedDuration) && parsedDuration > 0) {
      duration = parsedDuration;
    } else {
      console.error(`❌ Error: Invalid duration value "${durationArg.split('=')[1]}"`);
      console.error("   Duration must be a positive integer (> 0)");
      console.error("   Example: --duration=5");
      process.exit(1);
    }
  } else if (envDuration) {
    const parsedDuration = parseInt(envDuration, 10);
    
    if (Number.isInteger(parsedDuration) && parsedDuration > 0) {
      duration = parsedDuration;
    } else {
      console.error(`❌ Error: Invalid ELECTION_DURATION environment variable "${envDuration}"`);
      console.error("   Duration must be a positive integer (> 0)");
      process.exit(1);
    }
  }
  
  console.log(`📅 Election duration: ${duration} minutes\n`);
  
  // Deploy the contract
  const Voting = await ethers.getContractFactory("Voting");
  console.log("📝 Deploying Voting contract...");
  
  const candidates = ["BJP", "NDA", "AAP", "BSPA", "INC"];
  
  const Voting_ = await Voting.deploy(candidates, duration);
  await Voting_.deployed();
  
  const contractAddress = Voting_.address;
  console.log("✅ Contract deployed to:", contractAddress);
  
  // Log contract address to history file
  logContractAddress(contractAddress, candidates, duration);
  
  // Update .env file
  const envPath = path.join(__dirname, '..', '.env');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    
    // Update or add CONTRACT_ADDRESS
    if (envContent.includes('CONTRACT_ADDRESS=')) {
      envContent = envContent.replace(/CONTRACT_ADDRESS=.*/g, `CONTRACT_ADDRESS=${contractAddress}`);
    } else {
      envContent += `\nCONTRACT_ADDRESS=${contractAddress}\n`;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log("✅ Updated .env file with new contract address");
  } else {
    console.log("⚠️  Warning: .env file not found");
  }
  
  // Update main.js file
  const mainJsPath = path.join(__dirname, '..', 'main.js');
  
  if (fs.existsSync(mainJsPath)) {
    let mainJsContent = fs.readFileSync(mainJsPath, 'utf8');
    
    // Update contractAddress variable
    mainJsContent = mainJsContent.replace(
      /let contractAddress = "0x[a-fA-F0-9]{40}";/,
      `let contractAddress = "${contractAddress}";`
    );
    
    fs.writeFileSync(mainJsPath, mainJsContent);
    console.log("✅ Updated main.js with new contract address");
  } else {
    console.log("⚠️  Warning: main.js file not found");
  }
  
  // Update config.json file
  const configPath = path.join(__dirname, '..', 'config.json');
  const configData = {
    contractAddress: contractAddress,
    network: "sepolia",
    networkId: 11155111,
    lastUpdated: new Date().toISOString()
  };
  
  fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
  console.log("✅ Updated config.json with new contract address");
  
  console.log("\n🎉 Deployment and update complete!");
  console.log("📍 Contract Address:", contractAddress);
  
  // Auto-assign roles to admin addresses
  console.log("\n👥 Auto-assigning roles...");
  try {
    const [deployer] = await hre.ethers.getSigners();
    const votingArtifact = require('../artifacts/contracts/Voting.sol/Voting.json');
    const contract = new hre.ethers.Contract(contractAddress, votingArtifact.abi, deployer);
    
    // Get role identifiers
    const ADMIN_ROLE = await contract.ADMIN_ROLE();
    const ELECTION_MANAGER_ROLE = await contract.ELECTION_MANAGER_ROLE();
    
    // Admin addresses to grant roles
    const adminAddresses = [
      "0x8DCe2D8519e84481060A2955A8D2d9217C493363" // Add your admin addresses here
    ];
    
    const managerAddresses = [
      // Add election manager addresses here if needed
    ];
    
    // Assign ADMIN_ROLE
    for (const adminAddr of adminAddresses) {
      if (!hre.ethers.utils.isAddress(adminAddr)) {
        console.log(`⚠️  Invalid admin address: ${adminAddr}`);
        continue;
      }
      
      const hasRole = await contract.hasRole(ADMIN_ROLE, adminAddr);
      if (!hasRole) {
        console.log(`   Assigning ADMIN_ROLE to ${adminAddr.substring(0, 6)}...${adminAddr.substring(38)}`);
        const tx = await contract.grantRole(ADMIN_ROLE, adminAddr);
        await tx.wait();
        console.log(`   ✅ ADMIN_ROLE assigned (TX: ${tx.hash.substring(0, 10)}...)`);
      } else {
        console.log(`   ✓ Already has ADMIN_ROLE: ${adminAddr.substring(0, 6)}...${adminAddr.substring(38)}`);
      }
    }
    
    // Assign ELECTION_MANAGER_ROLE
    for (const managerAddr of managerAddresses) {
      if (!hre.ethers.utils.isAddress(managerAddr)) {
        console.log(`⚠️  Invalid manager address: ${managerAddr}`);
        continue;
      }
      
      const hasRole = await contract.hasRole(ELECTION_MANAGER_ROLE, managerAddr);
      if (!hasRole) {
        console.log(`   Assigning ELECTION_MANAGER_ROLE to ${managerAddr.substring(0, 6)}...${managerAddr.substring(38)}`);
        const tx = await contract.grantRole(ELECTION_MANAGER_ROLE, managerAddr);
        await tx.wait();
        console.log(`   ✅ ELECTION_MANAGER_ROLE assigned (TX: ${tx.hash.substring(0, 10)}...)`);
      } else {
        console.log(`   ✓ Already has ELECTION_MANAGER_ROLE: ${managerAddr.substring(0, 6)}...${managerAddr.substring(38)}`);
      }
    }
    
    console.log("✅ Role assignment complete!");
  } catch (roleError) {
    console.log("⚠️  Role assignment encountered an issue (non-blocking):");
    console.log("   " + roleError.message);
    console.log("   You can manually assign roles later using:");
    console.log("   npx hardhat run scripts/assign-roles.js --network sepolia");
  }
  
  // Auto-commit and push to GitHub for Vercel deployment
  console.log("\n🔄 Pushing changes to GitHub...");
  try {
    execSync('git add .', { stdio: 'inherit' });
    execSync(`git commit -m "🗳️ Auto-deploy: New election (${contractAddress.substring(0, 8)}...)"`, { stdio: 'inherit' });
    execSync('git push origin main', { stdio: 'inherit' });
    console.log("✅ Changes pushed to GitHub - Vercel will auto-deploy!");
  } catch (error) {
    console.log("⚠️  Auto-push failed. You may need to manually push:");
    console.log("   git add .");
    console.log(`   git commit -m "New election deployment"`);
    console.log("   git push origin main");
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
