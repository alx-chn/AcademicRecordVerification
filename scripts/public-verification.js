// This script demonstrates public verification of academic certificates
const hre = require("hardhat");

// Parse environment variables instead of command-line arguments
const VERIFY = process.env.VERIFY === 'true' || (!process.env.SETUP); // Default to verify
const SETUP = process.env.SETUP === 'true';
const CERT_ID = process.env.CERT_ID || ''; // Certificate ID

async function main() {
  console.log("Academic Record Verification - Public Certificate Verification");
  console.log("===========================================================");

  // Get contract instance using the deployed address
  const contractAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"; // Example address
  const AcademicRecordVerification = await hre.ethers.getContractFactory("AcademicRecordVerification");
  const contract = AcademicRecordVerification.attach(contractAddress);

  // Get signers
  const [owner, institution1, institution2, public1, public2] = await hre.ethers.getSigners();
  
  // Function to abbreviate addresses for security
  function abbreviateAddress(address) {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }
  
  console.log("Account Information:");
  console.log(`- Public User: ${abbreviateAddress(public1.address)}`);
  console.log("");

  // Determine which action to perform
  const hasVerify = VERIFY;
  const hasSetup = SETUP;
  
  // Get certificate ID if specified
  let certificateId = CERT_ID;
  
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
        console.log(`  To verify: VERIFY=true CERT_ID=${demoIds[0]} npx hardhat run scripts/public-verification.js --network localhost`);
      }
      if (demoIds.length > 1) {
        console.log(`  Certificate 2 ID: ${demoIds[1]} (valid)`);
        console.log(`  To verify: VERIFY=true CERT_ID=${demoIds[1]} npx hardhat run scripts/public-verification.js --network localhost`);
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
      console.log("Use: VERIFY=true CERT_ID=0x123abc... npx hardhat run scripts/public-verification.js --network localhost");
      
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
    // First try to verify certificate validity
    let isValid = false;
    let validationMessage = "";
    let institutionStatus = "";
    let institutionName = "";
    let certificateExists = true;
    
    try {
      // Verify certificate
      const verification = await contract.connect(verifier).verifyCertificate(certificateId);
      isValid = verification.isValid;
      institutionName = verification.institutionName;
      
      // Get institution status
      const institutionAddr = verification.institutionAddress;
      const instDetails = await contract.authorizedInstitutions(institutionAddr);
      institutionStatus = instDetails.isAuthorized ? "Active" : "Revoked/Unauthorized";
      
      if (!isValid) {
        if (!instDetails.isAuthorized) {
          validationMessage = "The issuing institution has been revoked or is no longer authorized";
        } else {
          validationMessage = "Certificate has been revoked by the issuing institution";
        }
      }
    } catch (verifyError) {
      if (verifyError.message.includes("Certificate does not exist")) {
        certificateExists = false;
        validationMessage = "This certificate ID does not exist on the blockchain";
      } else {
        validationMessage = "Could not verify validity: " + verifyError.message.split('\n')[0];
      }
    }
    
    // Try to get certificate details regardless of validity
    try {
      // Get certificate details
      const cert = await contract.connect(verifier).getCertificate(certificateId);
      
      // Display verification result prominently
      console.log(`\n${isValid ? "✅ VALID CERTIFICATE" : "❌ INVALID CERTIFICATE"}`);
      if (validationMessage) {
        console.log(`Note: ${validationMessage}`);
      }
      
      // Display certificate details
      console.log(`\nCertificate Details:`);
      console.log(`- Student Name: ${cert[0]}`);
      console.log(`- Student ID: ${cert[1]}`);
      console.log(`- Degree: ${cert[2]}`);
      console.log(`- Major: ${cert[3]}`);
      console.log(`- Issue Date: ${cert[4]}`);
      console.log(`- Graduation Date: ${cert[5]}`);
      console.log(`- Grade: ${Number(cert[6]) / 100}`);
      console.log(`- Issuing Institution: ${cert[10]}`);
      console.log(`- Institution Status: ${institutionStatus}`);
      console.log(`- Certificate Status: ${cert[7] ? "Revoked" : "Not Revoked"}`);
      
      if (cert[7]) { // If certificate is revoked (separate from institution revocation)
        console.log(`- Revocation Reason: ${cert[8]}`);
      }
      
      // Only show technical details in verbose mode
      const VERBOSE = false;
      if (VERBOSE) {
        console.log(`\nTechnical Details (for administrators):`);
        console.log(`- Institution Address: ${cert[9]}`);
        console.log(`- Certificate ID: ${certificateId}`);
      }
    } catch (error) {
      // If we couldn't get certificate details but got validation info earlier
      if (validationMessage) {
        if (!certificateExists) {
          console.log(`\n❌ CERTIFICATE NOT FOUND`);
          console.log(`Note: ${validationMessage}`);
          console.log(`Please check that the certificate ID is correct.`);
        } else {
          console.log(`\n❌ INVALID CERTIFICATE`);
          console.log(`Note: ${validationMessage}`);
          
          if (institutionName) {
            console.log(`\nPartial Details:`);
            console.log(`- Issuing Institution: ${institutionName}`);
            console.log(`- Institution Status: ${institutionStatus}`);
          }
        }
      } else {
        // Complete failure
        if (error.message.includes("Certificate does not exist")) {
          console.log(`\n❌ CERTIFICATE NOT FOUND`);
          console.log(`Note: This certificate ID does not exist on the blockchain`);
          console.log(`Please check that the certificate ID is correct.`);
        } else {
          console.log(`\n❌ ERROR: ${error.message.split('\n')[0]}`);
          console.log("  This could be due to network issues or an invalid certificate ID format.");
        }
      }
    }
  } catch (error) {
    console.log(`\n❌ ERROR: ${error.message.split('\n')[0]}`);
  }
  
  console.log("\nImportant notes:");
  console.log("1. Always verify that the institution name matches the expected issuer");
  console.log("2. Check that the student name and ID match the person presenting the certificate");
  console.log("3. Invalid certificates should never be trusted");
}

function showHelp() {
  console.log("\nUsage with environment variables:");
  console.log("-------------------------------------------");
  console.log("Examples:");
  console.log("VERIFY=true CERT_ID=0x123abc... npx hardhat run scripts/public-verification.js --network localhost");
  console.log("SETUP=true npx hardhat run scripts/public-verification.js --network localhost");
}

// Error handling wrapper
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 