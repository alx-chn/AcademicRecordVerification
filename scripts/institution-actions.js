// This script demonstrates the institution actions in the Academic Record Verification system
const hre = require("hardhat");

async function main() {
  console.log("Academic Record Verification - Institution Actions");
  console.log("===================================================");

  // Get contract instance using the deployed address
  const contractAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"; // Example address
  const AcademicRecordVerification = await hre.ethers.getContractFactory("AcademicRecordVerification");
  const contract = AcademicRecordVerification.attach(contractAddress);

  // Get signers
  const [owner, institution1, institution2, student1] = await hre.ethers.getSigners();
  
  console.log("Account Information:");
  console.log(`- Owner/System Admin: ${owner.address}`);
  console.log(`- Institution 1 (HKU): ${institution1.address}`);
  console.log(`- Institution 2 (CityU): ${institution2.address}`);
  console.log("");

  // For demo purposes, ensure institutions are authorized
  console.log("Authorizing institutions (if not already authorized)...");
  try {
    await contract.authorizeInstitution(institution1.address, "Hong Kong University");
    await contract.authorizeInstitution(institution2.address, "City University of Hong Kong");
    console.log("✓ Institutions authorized");
  } catch (error) {
    console.log(`Note: ${error.message.split('\n')[0]}`);
  }
  
  // 1. Issue Certificates
  console.log("\n1. Issuing Certificates");
  console.log("-------------------------------------------");
  
  // Variables to store certificate IDs
  let certificateId1, certificateId2;
  
  // Institution 1 issues a certificate
  console.log("\nIssuing certificate from HKU...");
  try {
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
    
    // Extract certificate ID from event
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
      console.log(`✓ SUCCESS: Certificate issued with ID: ${certificateId1}`);
      console.log(`  Student: John Doe (S123456)`);
      console.log(`  Degree: Bachelor of Science in Computer Science`);
      console.log(`  Grade: 3.85`);
    } else {
      console.log(`✓ SUCCESS: Certificate issued, but event details not available`);
    }
  } catch (error) {
    console.log(`❌ ERROR: Failed to issue certificate: ${error.message.split('\n')[0]}`);
  }

  // Institution 2 issues a certificate
  console.log("\nIssuing certificate from CityU...");
  try {
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
    
    // Extract certificate ID from event
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
      console.log(`✓ SUCCESS: Certificate issued with ID: ${certificateId2}`);
      console.log(`  Student: Jane Smith (S789012)`);
      console.log(`  Degree: Master of Business Administration in Finance`);
      console.log(`  Grade: 3.90`);
    } else {
      console.log(`✓ SUCCESS: Certificate issued, but event details not available`);
    }
  } catch (error) {
    console.log(`❌ ERROR: Failed to issue certificate: ${error.message.split('\n')[0]}`);
  }
  
  // 2. Get Certificate Details
  console.log("\n2. Getting Certificate Details");
  console.log("-------------------------------------------");
  
  if (certificateId1) {
    console.log(`\nGetting details for certificate ID: ${certificateId1}...`);
    try {
      const cert1 = await contract.connect(institution1).getCertificate(certificateId1);
      console.log(`Certificate Details:`);
      console.log(`- Student Name: ${cert1.studentName}`);
      console.log(`- Student ID: ${cert1.studentId}`);
      console.log(`- Degree: ${cert1.degree}`);
      console.log(`- Major: ${cert1.major}`);
      console.log(`- Issue Date: ${cert1.issueDate}`);
      console.log(`- Graduation Date: ${cert1.graduationDate}`);
      console.log(`- Grade: ${Number(cert1.grade) / 100}`);
      console.log(`- Issuing Institution: ${cert1.issuingInstitution}`);
      console.log(`- Institution Name: ${cert1.institutionName}`);
      console.log(`- Is Revoked: ${cert1.isRevoked}`);
      console.log(`- Revocation Reason: ${cert1.revocationReason || "N/A"}`);
    } catch (error) {
      console.log(`❌ ERROR: Failed to get certificate details: ${error.message.split('\n')[0]}`);
    }
  }
  
  // 3. Revoke Certificate
  console.log("\n3. Revoking Certificate");
  console.log("-------------------------------------------");
  
  if (certificateId1) {
    console.log(`\nRevoking certificate ID: ${certificateId1}...`);
    try {
      const tx3 = await contract.connect(institution1).revokeCertificate(
        certificateId1,
        "Academic misconduct discovered"
      );
      const receipt3 = await tx3.wait();
      
      // Extract event information
      const event3 = receipt3.logs.find(log => {
        try {
          return contract.interface.parseLog(log).name === "CertificateRevoked";
        } catch (e) {
          return false;
        }
      });
      
      if (event3) {
        const parsedEvent = contract.interface.parseLog(event3);
        console.log(`✓ SUCCESS: Certificate revoked - ID: ${parsedEvent.args[0]}`);
        console.log(`  Reason: ${parsedEvent.args[2]}`);
      } else {
        console.log(`✓ SUCCESS: Certificate revoked, but event details not available`);
      }
      
      // Verify certificate is now revoked
      const cert1After = await contract.getCertificate(certificateId1);
      console.log(`\nCertificate status after revocation:`);
      console.log(`- Is Revoked: ${cert1After.isRevoked}`);
      console.log(`- Revocation Reason: ${cert1After.revocationReason}`);
    } catch (error) {
      console.log(`❌ ERROR: Failed to revoke certificate: ${error.message.split('\n')[0]}`);
    }
  }
  
  // 4. Demonstrate access control for revoking certificates
  console.log("\n4. Testing Access Control for Revoking Certificates");
  console.log("-------------------------------------------");
  
  if (certificateId2) {
    console.log(`\nAttempting to revoke certificate ID: ${certificateId2} from a different institution...`);
    try {
      // Institution 1 tries to revoke Institution 2's certificate
      await contract.connect(institution1).revokeCertificate(
        certificateId2,
        "Attempting unauthorized revocation"
      );
      console.log(`❌ UNEXPECTED RESULT: The certificate was revoked by a non-issuing institution`);
    } catch (error) {
      console.log(`✓ EXPECTED RESULT: Non-issuing institution cannot revoke this certificate`);
      console.log(`  Error: ${error.message.split('\n')[0]}`);
    }
  }
  
  console.log("\nInstitution actions demonstration completed!");
}

// Error handling wrapper
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 