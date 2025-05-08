// This script demonstrates the owner actions in the Academic Record Verification system
const hre = require("hardhat");

// Parse environment variables instead of command-line arguments
const AUTH = process.env.AUTH === 'true';
const REVOKE = process.env.REVOKE === 'true';
const VIEW = process.env.VIEW === 'true' || (!AUTH && !REVOKE); // Default to view
const INSTITUTION = process.env.INSTITUTION || ''; // Institution name

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

  // Get institution address based on name
  let institutionName = INSTITUTION;
  let institutionAddress;
  
  if (institutionName) {
    // Use different addresses based on name for demo purposes
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
  if (AUTH && institutionName) {
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
  if (REVOKE && institutionName) {
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
  if (VIEW) {
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
  
  // Show usage information
  console.log("\nOwner actions completed!");
  console.log("\nUsage with environment variables:");
  console.log("AUTH=true INSTITUTION=\"Hong Kong University\" npx hardhat run scripts/owner-actions.js --network localhost");
  console.log("REVOKE=true INSTITUTION=CityU npx hardhat run scripts/owner-actions.js --network localhost");
  console.log("VIEW=true npx hardhat run scripts/owner-actions.js --network localhost");
}

// Error handling wrapper
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 