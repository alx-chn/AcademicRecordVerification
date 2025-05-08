// This script demonstrates the institution actions in the Academic Record Verification system
const hre = require("hardhat");

// Parse command line arguments
const args = process.argv.slice(2);
const ISSUE_FLAG = "-issue";
const REVOKE_FLAG = "-revoke";
const VIEW_FLAG = "-view";
const CERT_FLAG = "-cert";
const STUDENT_FLAG = "-student";
const DEGREE_FLAG = "-degree";
const MAJOR_FLAG = "-major";
const GRADE_FLAG = "-grade";
const INS_FLAG = "-ins";

async function main() {
  console.log("Academic Record Verification - Institution Actions");
  console.log("===================================================");

  // Get contract instance using the deployed address
  const contractAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"; // Example address
  const AcademicRecordVerification = await hre.ethers.getContractFactory("AcademicRecordVerification");
  const contract = AcademicRecordVerification.attach(contractAddress);

  // Get signers
  const [owner, institution1, institution2, institution3] = await hre.ethers.getSigners();
  
  console.log("Account Information:");
  console.log(`- Owner/System Admin: ${owner.address}`);
  console.log(`- Default Institution (HKU): ${institution1.address}`);
  console.log(`- Default Institution (CityU): ${institution2.address}`);
  console.log("");

  // Determine which action to perform based on command line arguments
  const hasIssue = args.includes(ISSUE_FLAG);
  const hasRevoke = args.includes(REVOKE_FLAG);
  const hasView = args.includes(VIEW_FLAG) || (!hasIssue && !hasRevoke);
  
  // Get institution address
  let insIndex = args.indexOf(INS_FLAG);
  let institutionName = "Hong Kong University"; // Default
  let institutionSigner = institution1; // Default
  
  if (insIndex !== -1 && insIndex + 1 < args.length) {
    const insName = args.slice(insIndex + 1).join(" ");
    
    if (insName.toLowerCase().includes("hku") || insName.toLowerCase().includes("hong kong")) {
      institutionName = "Hong Kong University";
      institutionSigner = institution1;
    } else if (insName.toLowerCase().includes("cityu") || insName.toLowerCase().includes("city")) {
      institutionName = "City University of Hong Kong";
      institutionSigner = institution2;
    } else if (insName.toLowerCase().includes("polyu") || insName.toLowerCase().includes("poly")) {
      institutionName = "Hong Kong Polytechnic University";
      institutionSigner = institution3;
    }
  }
  
  console.log(`Using institution: ${institutionName} (${institutionSigner.address})`);
  
  // For demo purposes, ensure institution is authorized
  try {
    await contract.authorizeInstitution(institutionSigner.address, institutionName);
    console.log("✓ Institution authorized (or was already authorized)");
  } catch (error) {
    console.log(`Note: ${error.message.split('\n')[0]}`);
  }
  
  // Get certificate ID if specified
  let certificateId;
  const certIndex = args.indexOf(CERT_FLAG);
  if (certIndex !== -1 && certIndex + 1 < args.length) {
    certificateId = args[certIndex + 1];
  }
  
  // Store certificates created in this session
  let sessionCertificates = [];
  
  // 1. Issue Certificate
  if (hasIssue) {
    console.log("\n1. Issuing Certificate");
    console.log("-------------------------------------------");
    
    // Get student details from command line or use defaults
    const studentName = getArgValue(STUDENT_FLAG, "John Doe");
    const studentId = "S" + Math.floor(Math.random() * 900000 + 100000); // Random student ID
    const degree = getArgValue(DEGREE_FLAG, "Bachelor of Science");
    const major = getArgValue(MAJOR_FLAG, "Computer Science");
    const gradeStr = getArgValue(GRADE_FLAG, "85");
    const grade = Math.floor(parseFloat(gradeStr) * 100); // Convert to contract format (e.g., 3.85 -> 385)
    
    const today = new Date();
    const issueDate = today.toISOString().split('T')[0];
    const graduationDate = new Date(today.getFullYear() + 4, 5, 15).toISOString().split('T')[0];
    
    console.log("\nIssuing certificate with the following details:");
    console.log(`- Student: ${studentName} (${studentId})`);
    console.log(`- Degree: ${degree} in ${major}`);
    console.log(`- Issue Date: ${issueDate}`);
    console.log(`- Graduation Date: ${graduationDate}`);
    console.log(`- Grade: ${gradeStr}`);
    
    try {
      const tx = await contract.connect(institutionSigner).issueCertificate(
        studentName,
        studentId,
        degree,
        major,
        issueDate,
        graduationDate,
        grade
      );
      const receipt = await tx.wait();
      
      // Extract certificate ID from event
      const event = receipt.logs.find(log => {
        try {
          return contract.interface.parseLog(log).name === "CertificateIssued";
        } catch (e) {
          return false;
        }
      });
      
      if (event) {
        const parsedEvent = contract.interface.parseLog(event);
        certificateId = parsedEvent.args[0];
        sessionCertificates.push(certificateId);
        
        console.log(`✓ SUCCESS: Certificate issued with ID: ${certificateId}`);
        console.log(`\nIMPORTANT: Save this certificate ID for future reference or revocation.`);
      } else {
        console.log(`✓ SUCCESS: Certificate issued, but couldn't retrieve the ID`);
      }
    } catch (error) {
      console.log(`❌ ERROR: Failed to issue certificate: ${error.message.split('\n')[0]}`);
    }
  }
  
  // 2. View Certificate
  if (hasView && certificateId) {
    console.log("\n2. Viewing Certificate Details");
    console.log("-------------------------------------------");
    
    console.log(`\nGetting details for certificate ID: ${certificateId}...`);
    try {
      const cert = await contract.connect(institutionSigner).getCertificate(certificateId);
      console.log(`Certificate Details:`);
      console.log(`- Student Name: ${cert[0]}`);
      console.log(`- Student ID: ${cert[1]}`);
      console.log(`- Degree: ${cert[2]}`);
      console.log(`- Major: ${cert[3]}`);
      console.log(`- Issue Date: ${cert[4]}`);
      console.log(`- Graduation Date: ${cert[5]}`);
      console.log(`- Grade: ${Number(cert[6]) / 100}`);
      console.log(`- Issuing Institution: ${cert[9]}`);
      console.log(`- Institution Name: ${cert[10]}`);
      console.log(`- Is Revoked: ${cert[7]}`);
      console.log(`- Revocation Reason: ${cert[8] || "N/A"}`);
    } catch (error) {
      console.log(`❌ ERROR: Failed to get certificate details: ${error.message.split('\n')[0]}`);
      
      // If we can't find the requested certificate but we created one in this session, show it
      if (sessionCertificates.length > 0 && !certificateId) {
        console.log(`\nShowing latest certificate created in this session instead: ${sessionCertificates[0]}`);
        try {
          const cert = await contract.connect(institutionSigner).getCertificate(sessionCertificates[0]);
          console.log(`Certificate Details:`);
          console.log(`- Student Name: ${cert[0]}`);
          console.log(`- Student ID: ${cert[1]}`);
          console.log(`- Degree: ${cert[2]}`);
          console.log(`- Major: ${cert[3]}`);
          console.log(`- Issue Date: ${cert[4]}`);
          console.log(`- Graduation Date: ${cert[5]}`);
          console.log(`- Grade: ${Number(cert[6]) / 100}`);
          console.log(`- Issuing Institution: ${cert[9]}`);
          console.log(`- Institution Name: ${cert[10]}`);
          console.log(`- Is Revoked: ${cert[7]}`);
          console.log(`- Revocation Reason: ${cert[8] || "N/A"}`);
        } catch (error) {
          console.log(`❌ ERROR: Failed to get certificate details: ${error.message.split('\n')[0]}`);
        }
      }
    }
  } else if (hasView && !certificateId && sessionCertificates.length > 0) {
    // If view is requested with no certificate ID but we created one, show it
    console.log("\n2. Viewing Certificate Details");
    console.log("-------------------------------------------");
    
    console.log(`\nShowing latest certificate created in this session: ${sessionCertificates[0]}`);
    try {
      const cert = await contract.connect(institutionSigner).getCertificate(sessionCertificates[0]);
      console.log(`Certificate Details:`);
      console.log(`- Student Name: ${cert[0]}`);
      console.log(`- Student ID: ${cert[1]}`);
      console.log(`- Degree: ${cert[2]}`);
      console.log(`- Major: ${cert[3]}`);
      console.log(`- Issue Date: ${cert[4]}`);
      console.log(`- Graduation Date: ${cert[5]}`);
      console.log(`- Grade: ${Number(cert[6]) / 100}`);
      console.log(`- Issuing Institution: ${cert[9]}`);
      console.log(`- Institution Name: ${cert[10]}`);
      console.log(`- Is Revoked: ${cert[7]}`);
      console.log(`- Revocation Reason: ${cert[8] || "N/A"}`);
    } catch (error) {
      console.log(`❌ ERROR: Failed to get certificate details: ${error.message.split('\n')[0]}`);
    }
  } else if (hasView && !certificateId) {
    console.log("\nNo certificate ID specified for viewing. Use -cert [certificateId] to view details.");
  }
  
  // 3. Revoke Certificate
  if (hasRevoke && certificateId) {
    console.log("\n3. Revoking Certificate");
    console.log("-------------------------------------------");
    
    console.log(`\nRevoking certificate ID: ${certificateId}...`);
    try {
      const tx = await contract.connect(institutionSigner).revokeCertificate(
        certificateId,
        "Academic misconduct discovered"
      );
      await tx.wait();
      
      console.log(`✓ SUCCESS: Certificate revoked - ID: ${certificateId}`);
      console.log(`  Reason: Academic misconduct discovered`);
      
      // Verify certificate is now revoked
      const cert = await contract.getCertificate(certificateId);
      console.log(`\nCertificate status after revocation:`);
      console.log(`- Is Revoked: ${cert[7]}`);
      console.log(`- Revocation Reason: ${cert[8]}`);
    } catch (error) {
      console.log(`❌ ERROR: Failed to revoke certificate: ${error.message.split('\n')[0]}`);
    }
  } else if (hasRevoke && !certificateId) {
    console.log("\nNo certificate ID specified for revocation. Use -cert [certificateId] to revoke a certificate.");
  }
  
  // Show help if no valid action was performed
  if ((!hasIssue && !hasRevoke && !hasView) || (hasView && !certificateId && sessionCertificates.length === 0)) {
    showHelp();
  }
  
  console.log("\nInstitution actions completed!");
}

// Helper function to get argument value
function getArgValue(flag, defaultValue) {
  const index = args.indexOf(flag);
  if (index !== -1 && index + 1 < args.length) {
    return args.slice(index + 1).join(" ");
  }
  return defaultValue;
}

function showHelp() {
  console.log("\nUsage Options:");
  console.log("-------------------------------------------");
  console.log("npx hardhat run scripts/institution-actions.js --network localhost [options]");
  console.log("\nOptions:");
  console.log("  -issue                Issue a new certificate");
  console.log("  -revoke               Revoke an existing certificate");
  console.log("  -view                 View certificate details (default)");
  console.log("  -cert [id]            Specify certificate ID (required for revoke/view)");
  console.log("  -ins [name]           Specify institution name (e.g., HKU, CityU)");
  console.log("  -student [name]       Student name for certificate issuance");
  console.log("  -degree [name]        Degree name for certificate issuance");
  console.log("  -major [name]         Major for certificate issuance");
  console.log("  -grade [value]        Grade/GPA for certificate issuance (e.g., 3.85)");
  console.log("\nExamples:");
  console.log("  npx hardhat run scripts/institution-actions.js --network localhost -issue -student \"Jane Smith\" -degree \"Master of Science\" -major \"Data Science\" -grade 3.95 -ins HKU");
  console.log("  npx hardhat run scripts/institution-actions.js --network localhost -view -cert 0x123abc...");
  console.log("  npx hardhat run scripts/institution-actions.js --network localhost -revoke -cert 0x123abc...");
}

// Error handling wrapper
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 