// This script demonstrates public verification of academic certificates
const hre = require("hardhat");

// Parse command line arguments
const args = process.argv.slice(2);
const VERIFY_FLAG = "-verify";
const CERT_FLAG = "-cert";
const SETUP_FLAG = "-setup"; // Just for testing/demo

async function main() {
  console.log("Academic Record Verification - Public Certificate Verification");
  console.log("===========================================================");

  // Get contract instance using the deployed address
  const contractAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"; // Example address
  const AcademicRecordVerification = await hre.ethers.getContractFactory("AcademicRecordVerification");
  const contract = AcademicRecordVerification.attach(contractAddress);

  // Get signers
  const [owner, institution1, institution2, public1, public2] = await hre.ethers.getSigners();
  
  console.log("Account Information:");
  console.log(`- Public User: ${public1.address}`);
  console.log("");

  // Determine which action to perform
  const hasVerify = args.includes(VERIFY_FLAG) || !args.includes(SETUP_FLAG); // Verify is default unless setup is specified
  const hasSetup = args.includes(SETUP_FLAG);
  
  // Get certificate ID if specified
  let certificateId;
  const certIndex = args.indexOf(CERT_FLAG);
  if (certIndex !== -1 && certIndex + 1 < args.length) {
    certificateId = args[certIndex + 1];
  }
  
  // For demo purposes, set up test certificates if requested
  let demoIds = [];
  if (hasSetup) {
    console.log("\nSetting up demo environment (this would normally be done separately)...");
    
    try {
      // Authorize institutions
      await contract.authorizeInstitution(institution1.address, "Hong Kong University");
      await contract.authorizeInstitution(institution2.address, "City University of Hong Kong");
      
      // Issue certificates
      const tx1 = await contract.connect(institution1).issueCertificate(
        "John Doe",
        "S123456",
        "Bachelor of Science",
        "Computer Science",
        "2023-06-15",
        "2023-06-30",
        385 // GPA 3.85
      );
      const receipt1 = await tx1.wait();
      const event1 = receipt1.logs.find(log => {
        try {
          return contract.interface.parseLog(log).name === "CertificateIssued";
        } catch (e) {
          return false;
        }
      });
      if (event1) {
        const parsedEvent = contract.interface.parseLog(event1);
        const id1 = parsedEvent.args[0];
        demoIds.push(id1);
      }
      
      const tx2 = await contract.connect(institution2).issueCertificate(
        "Jane Smith",
        "S789012",
        "Master of Business Administration",
        "Finance",
        "2023-05-20",
        "2023-06-01",
        390 // GPA 3.90
      );
      const receipt2 = await tx2.wait();
      const event2 = receipt2.logs.find(log => {
        try {
          return contract.interface.parseLog(log).name === "CertificateIssued";
        } catch (e) {
          return false;
        }
      });
      if (event2) {
        const parsedEvent = contract.interface.parseLog(event2);
        const id2 = parsedEvent.args[0];
        demoIds.push(id2);
      }
      
      // Revoke one certificate
      if (demoIds.length > 0) {
        await contract.connect(institution1).revokeCertificate(
          demoIds[0],
          "Academic misconduct discovered"
        );
      }
      
      console.log(`✓ Demo environment set up successfully`);
      if (demoIds.length > 0) {
        console.log(`  Certificate 1 ID: ${demoIds[0]} (revoked)`);
        console.log(`  To verify: npx hardhat run scripts/public-verification.js --network localhost -verify -cert ${demoIds[0]}`);
      }
      if (demoIds.length > 1) {
        console.log(`  Certificate 2 ID: ${demoIds[1]} (valid)`);
        console.log(`  To verify: npx hardhat run scripts/public-verification.js --network localhost -verify -cert ${demoIds[1]}`);
      }
    } catch (error) {
      console.log(`❌ Error setting up demo environment: ${error.message.split('\n')[0]}`);
    }
  }

  // Verify certificate if a certificate ID is provided or we have demo certificates
  if (hasVerify) {
    if (certificateId || demoIds.length > 0) {
      const idToVerify = certificateId || demoIds[demoIds.length > 1 ? 1 : 0]; // Use the second demo certificate if available (should be valid)
      
      console.log("\nVerifying Certificate");
      console.log("-------------------------------------------");
      await verifyAndDisplayCertificate(contract, public1, idToVerify);
    } else {
      console.log("\nNo certificate ID specified for verification.");
      console.log("Use: npx hardhat run scripts/public-verification.js --network localhost -verify -cert 0x123abc...");
      
      // For demo purposes, generate a fake ID to show invalid certificate handling
      if (!hasSetup) {
        console.log("\nDemonstrating verification of a non-existent certificate:");
        const fakeId = "0x0000000000000000000000000000000000000000000000000000000000000123";
        await verifyAndDisplayCertificate(contract, public1, fakeId);
      }
    }
  }
  
  if (!hasVerify && !hasSetup) {
    showHelp();
  }
  
  console.log("\nVerification process completed!");
}

// Function to verify and display certificate information
async function verifyAndDisplayCertificate(contract, verifier, certificateId) {
  console.log(`\nVerifying certificate ID: ${certificateId}`);
  
  try {
    // Verify certificate
    const verification = await contract.connect(verifier).verifyCertificate(certificateId);
    
    console.log(`\nVerification Result:`);
    console.log(`- Is Valid: ${verification.isValid ? "✓ VALID" : "❌ INVALID"}`);
    console.log(`- Issuing Institution Address: ${verification.institutionAddress}`);
    console.log(`- Institution Name: ${verification.institutionName}`);
    
    // If verification passes, get more details
    if (verification.isValid) {
      console.log(`\nRetrieving certificate details...`);
      
      // Get certificate details
      const cert = await contract.connect(verifier).getCertificate(certificateId);
      
      console.log(`Certificate Details:`);
      console.log(`- Student Name: ${cert[0]}`);
      console.log(`- Student ID: ${cert[1]}`);
      console.log(`- Degree: ${cert[2]}`);
      console.log(`- Major: ${cert[3]}`);
      console.log(`- Issue Date: ${cert[4]}`);
      console.log(`- Graduation Date: ${cert[5]}`);
      console.log(`- Grade: ${Number(cert[6]) / 100}`);
    } else {
      console.log(`\nThis certificate is invalid and cannot be trusted.`);
      
      // Get certificate details to see why it might be invalid
      try {
        const cert = await contract.connect(verifier).getCertificate(certificateId);
        
        if (cert[7]) { // isRevoked
          console.log(`Reason for invalidity: Certificate was REVOKED`);
          console.log(`Revocation reason: ${cert[8]}`);
        } else {
          console.log(`Reason for invalidity: The issuing institution may have been revoked`);
        }
      } catch (error) {
        if (error.message.includes("Certificate does not exist")) {
          console.log(`Reason for invalidity: This certificate does not exist on the blockchain`);
        } else {
          console.log(`Unable to get additional details: ${error.message.split('\n')[0]}`);
        }
      }
    }
  } catch (error) {
    if (error.message.includes("Certificate does not exist")) {
      console.log(`❌ ERROR: This certificate does not exist on the blockchain`);
    } else {
      console.log(`❌ ERROR: ${error.message.split('\n')[0]}`);
    }
  }
  
  console.log("\nImportant notes:");
  console.log("1. Always verify that the institution name matches the expected issuer");
  console.log("2. Check that the student name and ID match the person presenting the certificate");
  console.log("3. Invalid certificates should never be trusted");
}

function showHelp() {
  console.log("\nUsage Options:");
  console.log("-------------------------------------------");
  console.log("npx hardhat run scripts/public-verification.js --network localhost [options]");
  console.log("\nOptions:");
  console.log("  -verify               Verify a certificate (default)");
  console.log("  -cert [id]            Specify certificate ID to verify");
  console.log("  -setup                Set up demo certificates (for testing only)");
  console.log("\nExamples:");
  console.log("  npx hardhat run scripts/public-verification.js --network localhost -verify -cert 0x123abc...");
  console.log("  npx hardhat run scripts/public-verification.js --network localhost -setup");
}

// Error handling wrapper
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 