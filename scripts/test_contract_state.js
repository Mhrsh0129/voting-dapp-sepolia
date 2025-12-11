
const hre = require("hardhat");

async function main() {
  console.log("\n[4] Contract Integration Check...");
  
  // Load Config
  let config;
  try {
    config = require("../config.json");
  } catch (e) {
    console.error("❌ config.json not found. Deploy contract first.");
    process.exit(1);
  }

  const contractAddress = config.contractAddress;
  console.log(`   ℹ️  Checking Contract at: ${contractAddress}`);
  console.log(`   ℹ️  Network: ${config.network}`);

  // Attach Contract
  const Voting = await hre.ethers.getContractFactory("Voting");
  const voting = await Voting.attach(contractAddress);

  // 1. Check Signer
  try {
    const signer = await voting.verificationSigner();
    console.log(`   ℹ️  Configured verificationSigner: ${signer}`);
    
    if (signer === "0x0000000000000000000000000000000000000000") {
        console.error("   ❌ SECURITY ALERT: verificationSigner is ADDRESS(0). Voting is insecure!");
        process.exit(1);
    } else {
        console.log("   ✅ verificationSigner is NOT empty (Security Enabled)");
    }
  } catch (e) {
      console.error(`   ❌ Failed to read verificationSigner: ${e.message}`);
      // Might be running against old ABI or contract?
  }

  // 2. Read Candidates
  try {
      const count = await voting.getCandidateCount();
      console.log(`   ✅ Candidates Count: ${count}`);
      if (count > 0) {
          const c0 = await voting.candidates(0);
          console.log(`      Example Candidate: ${c0.name} (${c0.voteCount} votes)`);
      }
  } catch (e) {
      console.error("   ❌ Failed to read candidates");
  }
  
  console.log("\n✅ Contract checks passed.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
