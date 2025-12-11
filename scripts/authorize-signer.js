
const hre = require("hardhat");

async function main() {
  const contractAddress = "0x7CbabF95CBFde222721369C95A4f91Af1A09E25c";
  const signerAddress = "0x901d489058fBa9A5e4adDCabb471312B36a4B076";

  console.log(`🔐 Authorizing Face Verification Signer: ${signerAddress}`);
  console.log(`📍 Contract: ${contractAddress}`);

  // Get signer (admin)
  const [admin] = await hre.ethers.getSigners();
  console.log(`👤 Admin: ${admin.address}`);

  // Attach to contract
  const Voting = await hre.ethers.getContractFactory("Voting");
  const voting = await Voting.attach(contractAddress);

  // Call setVerificationSigner
  console.log("⏳ Sending transaction...");
  const tx = await voting.setVerificationSigner(signerAddress);
  console.log(`✅ Transaction sent: ${tx.hash}`);
  
  await tx.wait();
  console.log("🎉 Signer authorized successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
