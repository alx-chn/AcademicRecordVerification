// This script demonstrates public verification of academic certificates
const hre = require("hardhat");

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
  console.log(`- Owner/System Admin: ${owner.address}`);
  console.log(`- Institution 1 (HKU): ${institution1.address}`);
  console.log(`- Institution 2 (CityU): ${institution2.address}`);
  console.log(`- Public User 1: ${public1.address}`);
  console.log(`- Public User 2: ${public2.address}`);
  console.log("");

  // For demo purposes, set up some certificates to verify
  // This section would not be part of normal use - certificates should already exist
  console.log("Setting up demo environment (this would normally be done separately)...");
  let certificateId1, certificateId2;
  
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
      certificateId1 = parsedEvent.args[0];
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
      certificateId2 = parsedEvent.args[0];
    }
    
    // Revoke one certificate
    await contract.connect(institution1).revokeCertificate(
      certificateId1,
      "Academic misconduct discovered"
    );
    
    console.log(`✓ Demo environment set up successfully`);
    console.log(`  Certificate 1 ID: ${certificateId1} (revoked)`);
    console.log(`  Certificate 2 ID: ${certificateId2} (valid)`);
  } catch (error) {
    console.log(`❌ Error setting up demo environment: ${error.message.split('\n')[0]}`);
    // Continue regardless of setup errors
  }
  
  console.log("\nIn a real scenario, you would have received a certificate ID to verify...");
  
  // 1. Verify Certificate
  console.log("\n1. Certificate Verification");
  console.log("-------------------------------------------");
  
  // Function to verify and display certificate information
  async function verifyAndDisplayCertificate(certificateId, verifierName, verifierAddress) {
    console.log(`\nVerifying certificate ID: ${certificateId} as ${verifierName} (${verifierAddress})...`);
    
    try {
      // Verify certificate
      const verification = await contract.connect(public1).verifyCertificate(certificateId);
      
      console.log(`Verification Result:`);
      console.log(`- Is Valid: ${verification.isValid ? "✓ VALID" : "❌ INVALID"}`);
      console.log(`- Issuing Institution Address: ${verification.institutionAddress}`);
      console.log(`- Institution Name: ${verification.institutionName}`);
      
      // If verification passes, get more details
      if (verification.isValid) {
        console.log(`\nRetrieving certificate details...`);
        
        // Get certificate details
        const cert = await contract.connect(public1).getCertificate(certificateId);
        
        console.log(`Certificate Details:`);
        console.log(`- Student Name: ${cert.studentName}`);
        console.log(`- Student ID: ${cert.studentId}`);
        console.log(`- Degree: ${cert.degree}`);
        console.log(`- Major: ${cert.major}`);
        console.log(`- Issue Date: ${cert.issueDate}`);
        console.log(`- Graduation Date: ${cert.graduationDate}`);
        console.log(`- Grade: ${Number(cert.grade) / 100}`);
      } else {
        console.log(`\nThis certificate is invalid and cannot be trusted.`);
        
        // Get certificate details to see why it might be invalid
        try {
          const cert = await contract.connect(public1).getCertificate(certificateId);
          
          if (cert.isRevoked) {
            console.log(`Reason for invalidity: Certificate was REVOKED`);
            console.log(`Revocation reason: ${cert.revocationReason}`);
          } else {
            console.log(`Reason for invalidity: The issuing institution may have been revoked`);
          }
        } catch (error) {
          console.log(`Unable to get additional details: ${error.message.split('\n')[0]}`);
        }
      }
    } catch (error) {
      console.log(`❌ ERROR: ${error.message.split('\n')[0]}`);
    }
  }
  
  // Verify certificates we created earlier
  if (certificateId1) {
    await verifyAndDisplayCertificate(certificateId1, "Public User 1", public1.address);
  }
  
  if (certificateId2) {
    await verifyAndDisplayCertificate(certificateId2, "Public User 2", public2.address);
  }
  
  // 2. Verify a non-existent certificate
  console.log("\n2. Verifying Non-Existent Certificate");
  console.log("-------------------------------------------");
  
  await verifyAndDisplayCertificate(
    "0x0000000000000000000000000000000000000000000000000000000000000123", // fake ID
    "Public User 1", 
    public1.address
  );
  
  console.log("\nPublic verification demonstration completed!");
  console.log("\nImportant notes for public users:");
  console.log("1. Always verify that the institution name matches the expected issuer");
  console.log("2. Check that the student name and ID match the person presenting the certificate");
  console.log("3. Invalid certificates should never be trusted");
  console.log("4. The blockchain provides tamper-proof verification of academic credentials");
}

// Error handling wrapper
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 