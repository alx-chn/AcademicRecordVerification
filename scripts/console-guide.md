# Interactive Console Guide

This guide shows how to manually interact with the Academic Record Verification contract through the Hardhat console.

## Starting the Console

In your Docker container:

```bash
cd /usr/app/AcademicRecordVerification
npx hardhat console --network localhost
```

If you experience issues with npx, use this alternative:

```bash
node -e "require('hardhat').run('console', { network: 'localhost' })"
```

## Setup Contract Connection

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

## Common Operations by Role

### As Owner (Contract Admin)

```javascript
// Authorize an institution
await contract.authorizeInstitution(
  institution1.address, 
  "Hong Kong University"
);
console.log("Institution authorized");

// Check if institution is authorized
const inst = await contract.authorizedInstitutions(institution1.address);
console.log("Institution name:", inst.name);
console.log("Is authorized:", inst.isAuthorized);

// Revoke an institution
await contract.revokeInstitution(institution1.address);
console.log("Institution revoked");
```

### As an Institution

```javascript
// Switch to institution account
const instContract = contract.connect(institution1);

// Issue a certificate
const tx = await instContract.issueCertificate(
  "John Doe",
  "S123456",
  "Bachelor of Science",
  "Computer Science",
  "2023-06-15",
  "2023-06-30",
  385 // GPA 3.85
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
const parsedEvent = contract.interface.parseLog(event);
const certificateId = parsedEvent.args[0];
console.log("Certificate ID:", certificateId);

// Revoke a certificate
await instContract.revokeCertificate(
  certificateId,
  "Academic misconduct"
);
console.log("Certificate revoked");
```

### As Anyone (Public Verification)

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