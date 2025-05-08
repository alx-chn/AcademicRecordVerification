// This script demonstrates the owner actions in the Academic Record Verification system
const hre = require("hardhat");

async function main() {
  console.log("Academic Record Verification - Owner Actions");
  console.log("==============================================");

  // Get contract instance using the deployed address
  const contractAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"; // Example address
  const AcademicRecordVerification = await hre.ethers.getContractFactory("AcademicRecordVerification");
  const contract = AcademicRecordVerification.attach(contractAddress);

  // Get signers
  const [owner, institution1, institution2] = await hre.ethers.getSigners();
  
  console.log("Account Information:");
  console.log(`- Owner/System Admin: ${owner.address}`);
  console.log(`- Institution 1: ${institution1.address}`);
  console.log(`- Institution 2: ${institution2.address}`);
  console.log("");

  // Demonstrate Owner Actions
  console.log("1. Owner Actions");
  console.log("-------------------------------------------");
  
  // Authorize first institution
  console.log("Authorizing Institution 1 (HKU)...");
  try {
    const tx1 = await contract.authorizeInstitution(
      institution1.address,
      "Hong Kong University"
    );
    const receipt1 = await tx1.wait();
    
    // Extract event information
    const event1 = receipt1.logs.find(log => {
      try {
        return contract.interface.parseLog(log).name === "InstitutionAuthorized";
      } catch (e) {
        return false;
      }
    });
    
    if (event1) {
      const parsedEvent = contract.interface.parseLog(event1);
      console.log(`✓ SUCCESS: Institution authorized - Address: ${parsedEvent.args[0]}, Name: ${parsedEvent.args[1]}`);
    } else {
      console.log(`✓ SUCCESS: Institution authorized, but event details not available`);
    }
  } catch (error) {
    console.log(`❌ ERROR: Failed to authorize institution: ${error.message.split('\n')[0]}`);
  }
  
  // Authorize second institution
  console.log("\nAuthorizing Institution 2 (CityU)...");
  try {
    const tx2 = await contract.authorizeInstitution(
      institution2.address,
      "City University of Hong Kong"
    );
    const receipt2 = await tx2.wait();
    
    // Extract event information
    const event2 = receipt2.logs.find(log => {
      try {
        return contract.interface.parseLog(log).name === "InstitutionAuthorized";
      } catch (e) {
        return false;
      }
    });
    
    if (event2) {
      const parsedEvent = contract.interface.parseLog(event2);
      console.log(`✓ SUCCESS: Institution authorized - Address: ${parsedEvent.args[0]}, Name: ${parsedEvent.args[1]}`);
    } else {
      console.log(`✓ SUCCESS: Institution authorized, but event details not available`);
    }
  } catch (error) {
    console.log(`❌ ERROR: Failed to authorize institution: ${error.message.split('\n')[0]}`);
  }
  
  // Get institution details
  console.log("\nGetting institution details...");
  try {
    const institution1Details = await contract.authorizedInstitutions(institution1.address);
    console.log(`Institution 1 (${institution1.address}):`);
    console.log(`- Name: ${institution1Details.name}`);
    console.log(`- Authorized: ${institution1Details.isAuthorized}`);
    
    const institution2Details = await contract.authorizedInstitutions(institution2.address);
    console.log(`\nInstitution 2 (${institution2.address}):`);
    console.log(`- Name: ${institution2Details.name}`);
    console.log(`- Authorized: ${institution2Details.isAuthorized}`);
  } catch (error) {
    console.log(`❌ ERROR: Failed to get institution details: ${error.message.split('\n')[0]}`);
  }
  
  // Revoke institution
  console.log("\n2. Revoking Institution");
  console.log("-------------------------------------------");
  
  console.log("Revoking Institution 2 (CityU)...");
  try {
    const tx3 = await contract.revokeInstitution(institution2.address);
    const receipt3 = await tx3.wait();
    
    // Extract event information
    const event3 = receipt3.logs.find(log => {
      try {
        return contract.interface.parseLog(log).name === "InstitutionRevoked";
      } catch (e) {
        return false;
      }
    });
    
    if (event3) {
      const parsedEvent = contract.interface.parseLog(event3);
      console.log(`✓ SUCCESS: Institution revoked - Address: ${parsedEvent.args[0]}`);
    } else {
      console.log(`✓ SUCCESS: Institution revoked, but event details not available`);
    }
    
    // Verify institution is now revoked
    const institution2DetailsAfter = await contract.authorizedInstitutions(institution2.address);
    console.log(`\nInstitution 2 status after revocation:`);
    console.log(`- Name: ${institution2DetailsAfter.name}`);
    console.log(`- Authorized: ${institution2DetailsAfter.isAuthorized}`);
  } catch (error) {
    console.log(`❌ ERROR: Failed to revoke institution: ${error.message.split('\n')[0]}`);
  }
  
  console.log("\nOwner actions demonstration completed!");
}

// Error handling wrapper
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 