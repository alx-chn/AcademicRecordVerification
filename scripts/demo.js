// This script demonstrates the functionality of the Academic Record Verification system
const hre = require("hardhat");

async function main() {
  console.log("Academic Record Verification - Demonstration");
  console.log("==============================================");

  // Get contract instance using the deployed address
  // Replace this address with the actual deployed address from your deployment
  const contractAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"; // Example address, use your actual deployment address
  const AcademicRecordVerification = await hre.ethers.getContractFactory("AcademicRecordVerification");
  const contract = AcademicRecordVerification.attach(contractAddress);

  // Get signers for different roles
  const [owner, institution1, institution2, student1] = await hre.ethers.getSigners();
  
  // Function to abbreviate addresses for security
  function abbreviateAddress(address) {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }
  
  console.log("Demo Accounts:");
  console.log(`- Owner/System Admin: ${abbreviateAddress(owner.address)}`);
  console.log(`- Institution 1: ${abbreviateAddress(institution1.address)}`);
  console.log(`- Institution 2: ${abbreviateAddress(institution2.address)}`);
  console.log(`- Student: ${abbreviateAddress(student1.address)}`);
  console.log("");

  // Step 1: Demonstrate Owner Access Control
  console.log("Step 1: Demonstrating Owner Access Control");
  console.log("-------------------------------------------");
  
  console.log(`OWNER ACTIONS (allowed for address ${abbreviateAddress(owner.address)}):`);
  // Authorize first institution
  const tx1 = await contract.authorizeInstitution(
    institution1.address,
    "Hong Kong University"
  );
  await tx1.wait();
  console.log(`✓ Owner successfully authorized Institution 1 (HKU)`);
  
  // Authorize second institution
  const tx2 = await contract.authorizeInstitution(
    institution2.address,
    "City University of Hong Kong"
  );
  await tx2.wait();
  console.log(`✓ Owner successfully authorized Institution 2 (CityU)`);

  console.log(`\nNON-OWNER ACTIONS (should fail for address ${abbreviateAddress(institution1.address)}):`);
  try {
    // Try to authorize from non-owner account
    await contract.connect(institution1).authorizeInstitution(
      student1.address,
      "Fake University"
    );
    console.log(`❌ Non-owner (${abbreviateAddress(institution1.address)}) was able to authorize an institution (this shouldn't happen)`);
  } catch (error) {
    console.log(`✓ Non-owner (${abbreviateAddress(institution1.address)}) correctly prevented from authorizing institutions`);
    console.log(`  Error message: "${error.message.split('\n')[0]}"`);
  }

  // Step 2: Demonstrate Institution Access Control
  console.log("\nStep 2: Demonstrating Institution Access Control");
  console.log("----------------------------------------------");
  
  console.log(`AUTHORIZED INSTITUTION ACTIONS (allowed for address ${abbreviateAddress(institution1.address)}):`);
  // Institution 1 issues a certificate
  const tx3 = await contract.connect(institution1).issueCertificate(
    "John Doe",
    "S123456",
    "Bachelor of Science",
    "Computer Science",
    "2023-06-15",
    "2023-06-30",
    385 // GPA 3.85
  );
  const receipt1 = await tx3.wait();
  
  // Extract certificate ID from event
  const event1 = receipt1.logs.find(log => {
    try {
      return contract.interface.parseLog(log).name === "CertificateIssued";
    } catch (e) {
      return false;
    }
  });
  
  if (!event1) throw new Error("CertificateIssued event not found");
  const parsedEvent1 = contract.interface.parseLog(event1);
  const certificateId1 = parsedEvent1.args[0];
  
  console.log(`✓ Authorized Institution HKU (${abbreviateAddress(institution1.address)}) successfully issued certificate to John Doe`);
  console.log(`  Certificate ID: ${certificateId1}`);
  
  console.log(`\nUNAUTHORIZED ACCOUNTS ACTIONS (should fail when attempted by ${abbreviateAddress(student1.address)}):`);
  try {
    // Student tries to issue a certificate
    await contract.connect(student1).issueCertificate(
      "Fake Student",
      "S000000",
      "Fake Degree",
      "Fake Major",
      "2023-01-01",
      "2023-01-02",
      400
    );
    console.log(`❌ Unauthorized account (${abbreviateAddress(student1.address)}) was able to issue a certificate (this shouldn't happen)`);
  } catch (error) {
    console.log(`✓ Unauthorized account (${abbreviateAddress(student1.address)}) correctly prevented from issuing certificates`);
    console.log(`  Error message: "${error.message.split('\n')[0]}"`);
  }

  // Institution 2 issues a certificate
  const tx4 = await contract.connect(institution2).issueCertificate(
    "Jane Smith",
    "S789012",
    "Master of Business Administration",
    "Finance",
    "2023-05-20",
    "2023-06-01",
    390 // GPA 3.90
  );
  const receipt2 = await tx4.wait();
  
  // Extract certificate ID from event
  const event2 = receipt2.logs.find(log => {
    try {
      return contract.interface.parseLog(log).name === "CertificateIssued";
    } catch (e) {
      return false;
    }
  });
  
  if (!event2) throw new Error("CertificateIssued event not found");
  const parsedEvent2 = contract.interface.parseLog(event2);
  const certificateId2 = parsedEvent2.args[0];
  
  console.log(`✓ Authorized Institution CityU (${abbreviateAddress(institution2.address)}) successfully issued certificate to Jane Smith`);
  console.log(`  Certificate ID: ${certificateId2}`);

  // Step 3: Public Access - Verifying Certificates
  console.log("\nStep 3: Demonstrating Public Access - Certificate Verification");
  console.log("------------------------------------------------------------");
  
  console.log("PUBLIC VERIFICATION (allowed for anyone):");
  // Verify certificates as owner
  const verification1 = await contract.verifyCertificate(certificateId1);
  console.log(`Verification by Owner (${abbreviateAddress(owner.address)}):`);
  console.log(`✓ Can verify: Certificate is ${verification1.isValid ? 'valid' : 'invalid'} from ${verification1.institutionName}`);
  
  // Verify certificates as institution
  const verification2 = await contract.connect(institution1).verifyCertificate(certificateId2);
  console.log(`\nVerification by Institution HKU (${abbreviateAddress(institution1.address)}):`);
  console.log(`✓ Can verify: Certificate is ${verification2.isValid ? 'valid' : 'invalid'} from ${verification2.institutionName}`);
  
  // Verify certificates as student
  const verification3 = await contract.connect(student1).verifyCertificate(certificateId1);
  console.log(`\nVerification by Student/Public (${abbreviateAddress(student1.address)}):`);
  console.log(`✓ Can verify: Certificate is ${verification3.isValid ? 'valid' : 'invalid'} from ${verification3.institutionName}`);

  // Step 4: Certificate Issuer Access Control
  console.log("\nStep 4: Demonstrating Certificate Issuer Access Control");
  console.log("----------------------------------------------------");
  
  console.log(`CERTIFICATE ISSUER ACTIONS (allowed for issuing institution ${abbreviateAddress(institution1.address)}):`);
  // Institution 1 revokes its own certificate
  const tx5 = await contract.connect(institution1).revokeCertificate(
    certificateId1,
    "Academic misconduct discovered"
  );
  await tx5.wait();
  console.log(`✓ Institution HKU (${abbreviateAddress(institution1.address)}) successfully revoked its own certificate`);
  
  console.log(`\nNON-ISSUER ACTIONS (should fail when attempted by ${abbreviateAddress(institution2.address)}):`);
  try {
    // Institution 2 tries to revoke Institution 1's certificate
    await contract.connect(institution2).revokeCertificate(
      certificateId1,
      "Attempting unauthorized revocation"
    );
    console.log(`❌ Non-issuer CityU (${abbreviateAddress(institution2.address)}) was able to revoke certificate (this shouldn't happen)`);
  } catch (error) {
    console.log(`✓ Non-issuer CityU (${abbreviateAddress(institution2.address)}) correctly prevented from revoking other institution's certificates`);
    console.log(`  Error message: "${error.message.split('\n')[0]}"`);
  }

  // Step 5: Owner Revoking Institutions
  console.log("\nStep 5: Demonstrating Owner Revoking Institutions");
  console.log("----------------------------------------------");
  
  // Owner revokes Institution 2
  const tx6 = await contract.revokeInstitution(institution2.address);
  await tx6.wait();
  console.log(`✓ Owner (${abbreviateAddress(owner.address)}) successfully revoked Institution CityU (${abbreviateAddress(institution2.address)})`);
  
  // Verify Jane's certificate now that the institution is revoked
  const verification4 = await contract.verifyCertificate(certificateId2);
  console.log("\nVerification of certificate after institution revocation:");
  console.log(`✓ Certificate issued by CityU is now ${verification4.isValid ? 'valid' : 'invalid'} (should be invalid)`);
  
  // Try to authorize a revoked institution
  try {
    // Institution 2 tries to issue a certificate after being revoked
    await contract.connect(institution2).issueCertificate(
      "Another Student",
      "S999999",
      "Doctorate",
      "Physics",
      "2023-07-01",
      "2023-07-30",
      400
    );
    console.log(`❌ Revoked institution CityU (${abbreviateAddress(institution2.address)}) was able to issue a certificate (this shouldn't happen)`);
  } catch (error) {
    console.log(`✓ Revoked institution CityU (${abbreviateAddress(institution2.address)}) correctly prevented from issuing certificates`);
    console.log(`  Error message: "${error.message.split('\n')[0]}"`);
  }
  
  console.log("\nDemonstration completed successfully!");
  console.log("The system has demonstrated proper access control for all roles:");
  console.log(`1. Owner (${abbreviateAddress(owner.address)}): Can authorize and revoke institutions`);
  console.log(`2. Institutions (${abbreviateAddress(institution1.address)}, ${abbreviateAddress(institution2.address)}): Can issue and revoke their own certificates`);
  console.log(`3. Public (${abbreviateAddress(student1.address)}): Can verify any certificate`);
  console.log("4. Proper restrictions: Non-owners can't authorize, non-issuers can't revoke others' certificates");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 