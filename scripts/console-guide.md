# Academic Record Verification - Console Guide

This guide shows how to:
1. Manually interact with the Academic Record Verification contract through the Hardhat console
2. Use the role-based scripts with environment variables

## Role-Based Scripts (Recommended)

The system features dedicated scripts for each role, controlled via environment variables:

### Owner Actions

```bash
# Authorize an institution
AUTH=true INSTITUTION="Hong Kong University" npx hardhat run scripts/owner-actions.js --network localhost

# Revoke an institution
REVOKE=true INSTITUTION=CityU npx hardhat run scripts/owner-actions.js --network localhost

# View institutions (default action)
VIEW=true npx hardhat run scripts/owner-actions.js --network localhost
```

### Institution Actions

```bash
# Issue a certificate
ISSUE=true STUDENT="Jane Smith" DEGREE="Master of Science" MAJOR="Data Science" GRADE=3.95 INSTITUTION=HKU npx hardhat run scripts/institution-actions.js --network localhost

# View a certificate
VIEW=true CERT_ID=0x123abc... npx hardhat run scripts/institution-actions.js --network localhost

# Revoke a certificate
REVOKE=true CERT_ID=0x123abc... INSTITUTION=HKU npx hardhat run scripts/institution-actions.js --network localhost
```

### Public Verification

```bash
# Verify a certificate
VERIFY=true CERT_ID=0x123abc... npx hardhat run scripts/public-verification.js --network localhost

# Set up demo certificates
SETUP=true npx hardhat run scripts/public-verification.js --network localhost
```

## Interactive Console Use

For advanced users, direct console interaction is available:

### Starting the Console

In your terminal:

```bash
cd /usr/app/AcademicRecordVerification
npx hardhat console --network localhost
```

If you experience issues with npx, use this alternative:

```bash
node -e "require('hardhat').run('console', { network: 'localhost' })"
```

### Setup Contract Connection

Once in the console, connect to your deployed contract:

```javascript
// Get the contract factory and attach to the deployed address
const AcademicRecordVerification = await ethers.getContractFactory("AcademicRecordVerification");
// Replace with your actual deployed contract address
const contractAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
const contract = AcademicRecordVerification.attach(contractAddress);

// Get account addresses for different roles
const [owner, institution1, institution2, student1] = await ethers.getSigners();
console.log("Owner address:", owner.address);
console.log("Institution 1:", institution1.address);
console.log("Institution 2:", institution2.address);
console.log("Student:", student1.address);
```

### Common Operations by Role

#### As Owner (Contract Admin)

```javascript
// Authorize an institution
const authTx = await contract.authorizeInstitution(
  institution1.address, 
  "Hong Kong University"
);
await authTx.wait();
console.log("Institution authorized successfully");

// Check if institution is authorized
const inst = await contract.authorizedInstitutions(institution1.address);
console.log("Institution name:", inst.name);
console.log("Is authorized:", inst.isAuthorized);

// Revoke an institution
await contract.revokeInstitution(institution1.address);
console.log("Institution revoked");
```

#### As an Institution

```javascript
// Switch to institution account
const instContract = contract.connect(institution1);

// Issue a certificate
const issueTx = await instContract.issueCertificate(
  "John Doe",
  "S123456",
  "Bachelor of Science",
  "Computer Science",
  "2023-06-15",
  "2023-06-30",
  385 // GPA 3.85
);
const issueReceipt = await issueTx.wait();
console.log("Certificate issued, receipt:", issueReceipt.hash);

// Find the certificate ID from events
// Using a different approach to extract the certificate ID from logs
const certEvents = issueReceipt.logs.map(log => {
  try {
    return contract.interface.parseLog(log);
  } catch (e) {
    return null;
  }
}).filter(parsed => parsed !== null && parsed.name === "CertificateIssued");

if (certEvents.length > 0) {
  const certificateId = certEvents[0].args[0];
  console.log("Certificate ID:", certificateId);
  
  // Verify the certificate
  const verification = await contract.verifyCertificate(certificateId);
  console.log("Certificate valid:", verification.isValid);
  console.log("Issuing institution:", verification.institutionName);
  
  // Revoke certificate
  const revokeTx = await instContract.revokeCertificate(certificateId, "Academic misconduct");
  await revokeTx.wait();
  console.log("Certificate revoked successfully");
  
  // Verify again to confirm revocation
  const verificationAfter = await contract.verifyCertificate(certificateId);
  console.log("Certificate still valid:", verificationAfter.isValid); // Should be false
} else {
  console.log("Certificate event not found in logs");
}
```

#### As Anyone (Public Verification)

```javascript
// Verify a certificate (replace with actual certificate ID)
const certificateId = "0x83bcf3a2040cd379b4bfba0476488e70545c100114c9f83ec8aedf3d586613a8";
const verification = await contract.verifyCertificate(certificateId);
console.log("Is valid:", verification.isValid);
console.log("Institution:", verification.institutionAddress);
console.log("Institution name:", verification.institutionName);

// Get certificate details
const cert = await contract.getCertificate(certificateId);
console.log("Student:", cert.studentName);
console.log("Degree:", cert.degree);
console.log("Major:", cert.major);
console.log("Issue date:", cert.issueDate);
console.log("Is revoked:", cert.isRevoked);
console.log("Grade:", Number(cert.grade) / 100); // Convert BigInt to Number
```

## Tips for Interactive Use

1. Save certificate IDs when they're created for later use
2. Use `try/catch` for operations that might fail:

```javascript
try {
  // Try an operation that might not be allowed
  await contract.connect(student1).issueCertificate(...);
} catch (error) {
  console.log("Operation failed:", error.message);
}
```

3. Exit the console by typing `.exit` or pressing Ctrl+D 