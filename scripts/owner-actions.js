// This script demonstrates the owner actions in the Academic Record Verification system
const hre = require("hardhat");

// Parse command line arguments
const args = process.argv.slice(2);
const AUTH_FLAG = "-auth";
const REVOKE_FLAG = "-revoke";
const VIEW_FLAG = "-view";
const INS_FLAG = "-ins";

async function main() {
  console.log("Academic Record Verification - Owner Actions");
  console.log("==============================================");

  // Get contract instance using the deployed address
  const contractAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"; // Example address
  const AcademicRecordVerification = await hre.ethers.getContractFactory("AcademicRecordVerification");
  const contract = AcademicRecordVerification.attach(contractAddress);

  // Get signers
  const [owner, institution1, institution2, institution3, institution4] = await hre.ethers.getSigners();
  
  console.log("Account Information:");
  console.log(`- Owner/System Admin: ${owner.address}`);
  console.log(`- Default Institution 1: ${institution1.address}`);
  console.log(`- Default Institution 2: ${institution2.address}`);
  console.log("");

  // Determine which action to perform based on command line arguments
  const hasAuth = args.includes(AUTH_FLAG);
  const hasRevoke = args.includes(REVOKE_FLAG);
  const hasView = args.includes(VIEW_FLAG) || (!hasAuth && !hasRevoke); // Default to view if no action specified
  
  // Get institution name if provided
  let insIndex = args.indexOf(INS_FLAG);
  let institutionName = "";
  let institutionAddress;
  
  if (insIndex !== -1 && insIndex + 1 < args.length) {
    institutionName = args.slice(insIndex + 1).join(" ");
    
    // Use different addresses based on index for demo purposes
    if (institutionName.toLowerCase().includes("hku") || institutionName.toLowerCase().includes("hong kong")) {
      institutionAddress = institution1.address;
      institutionName = "Hong Kong University";
    } else if (institutionName.toLowerCase().includes("cityu") || institutionName.toLowerCase().includes("city")) {
      institutionAddress = institution2.address;
      institutionName = "City University of Hong Kong";
    } else if (institutionName.toLowerCase().includes("polyu") || institutionName.toLowerCase().includes("poly")) {
      institutionAddress = institution3.address;
      institutionName = "Hong Kong Polytechnic University";
    } else {
      institutionAddress = institution4.address;
      if (!institutionName) institutionName = "Unknown Institution";
    }
  }

  // Authorize institution
  if (hasAuth && institutionName) {
    console.log(`\nAuthorizing Institution: ${institutionName} (${institutionAddress})`);
    console.log("-------------------------------------------");
    
    try {
      const tx = await contract.authorizeInstitution(
        institutionAddress,
        institutionName
      );
      await tx.wait();
      
      console.log(`✓ SUCCESS: Institution authorized - ${institutionAddress} as ${institutionName}`);
    } catch (error) {
      console.log(`❌ ERROR: Failed to authorize institution: ${error.message.split('\n')[0]}`);
    }
  }
  
  // Revoke institution
  if (hasRevoke && institutionName) {
    console.log(`\nRevoking Institution: ${institutionName} (${institutionAddress})`);
    console.log("-------------------------------------------");
    
    try {
      const tx = await contract.revokeInstitution(institutionAddress);
      await tx.wait();
      
      console.log(`✓ SUCCESS: Institution revoked - ${institutionAddress} (${institutionName})`);
      
      // Verify institution is now revoked by attempting to issue a certificate
      try {
        const issueTx = await contract.connect(hre.ethers.provider.getSigner(institutionAddress)).issueCertificate(
          "Test Student",
          "TEST789",
          "Test Degree",
          "Test Major",
          "2023-01-01",
          "2023-01-01",
          400
        );
        await issueTx.wait();
        console.log(`❌ UNEXPECTED: Institution can still issue certificates after revocation`);
      } catch (error) {
        if (error.message.includes("Only authorized institutions can issue certificates")) {
          console.log(`✓ SUCCESS: Institution is properly revoked (cannot issue certificates)`);
        } else {
          console.log(`❓ INCONCLUSIVE: Institution failed for reasons other than authorization: ${error.message.split('\n')[0]}`);
        }
      }
    } catch (error) {
      console.log(`❌ ERROR: Failed to revoke institution: ${error.message.split('\n')[0]}`);
    }
  }
  
  // View/verify institutions
  if (hasView) {
    console.log("\nVerifying Institution Authorization Status");
    console.log("-------------------------------------------");
    
    // Default institutions to check
    const institutionsToCheck = [];
    
    if (institutionAddress) {
      // If institution specified via command line, just check that one
      institutionsToCheck.push({
        signer: hre.ethers.provider.getSigner(institutionAddress),
        address: institutionAddress,
        name: institutionName
      });
    } else {
      // Otherwise check the default institutions
      institutionsToCheck.push({
        signer: institution1,
        address: institution1.address,
        name: "Hong Kong University"
      });
      institutionsToCheck.push({
        signer: institution2,
        address: institution2.address,
        name: "City University of Hong Kong"
      });
    }
    
    for (const inst of institutionsToCheck) {
      console.log(`\nChecking authorization for: ${inst.name} (${inst.address})`);
      try {
        // Issue a temporary certificate to test if institution is authorized
        const issueTx = await contract.connect(inst.signer).issueCertificate(
          "Test Student",
          "TEST" + Math.floor(Math.random() * 10000),
          "Test Degree",
          "Test Major",
          "2023-01-01",
          "2023-01-01",
          400
        );
        await issueTx.wait();
        console.log(`✓ AUTHORIZED: ${inst.name} is authorized (can issue certificates)`);
      } catch (error) {
        if (error.message.includes("Only authorized institutions can issue certificates")) {
          console.log(`❌ NOT AUTHORIZED: ${inst.name} is not authorized`);
        } else {
          console.log(`❓ ERROR: ${error.message.split('\n')[0]}`);
        }
      }
    }
  }
  
  // Show help if no valid action was performed
  if (!hasAuth && !hasRevoke && !hasView) {
    showHelp();
  }
  
  console.log("\nOwner actions completed!");
}

function showHelp() {
  console.log("\nUsage Options:");
  console.log("-------------------------------------------");
  console.log("npx hardhat run scripts/owner-actions.js --network localhost [options]");
  console.log("\nOptions:");
  console.log("  -auth                 Authorize an institution");
  console.log("  -revoke               Revoke an institution's authorization");
  console.log("  -view                 View institution authorization status (default)");
  console.log("  -ins [name]           Specify institution name (required for auth/revoke)");
  console.log("\nExamples:");
  console.log("  npx hardhat run scripts/owner-actions.js --network localhost -auth -ins \"Hong Kong University\"");
  console.log("  npx hardhat run scripts/owner-actions.js --network localhost -revoke -ins CityU");
  console.log("  npx hardhat run scripts/owner-actions.js --network localhost -view");
}

// Error handling wrapper
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 