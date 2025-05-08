# Academic Record Verification - Usage Instructions

## Project Setup in Docker

Since you already have Docker set up, follow these steps to deploy and test the Academic Record Verification system:

### Step 1: Set up the Project in Docker

```bash
# Start and access the Docker container
docker start -ai fite2010-lab1
docker exec -it fite2010-lab1 bash

# Navigate to the project directory
cd /usr/app/AcademicRecordVerification

# Install dependencies
npm install
```

### Step 2: Compile and Deploy

```bash
# Compile the smart contract
npx hardhat compile

# Start a local blockchain node (in a separate terminal)
docker exec -it fite2010-lab1 bash
cd /usr/app/AcademicRecordVerification
npx hardhat node

# Deploy the contract (in your original terminal)
node scripts/run-deploy.js
```

The deployment will output your contract address:
```
AcademicRecordVerification deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

Take note of this address for the next step.

### Step 3: Update the Contract Address

```bash
# Update the demo script with your contract address
node scripts/update-address.js 0xYourContractAddress
```

### Step 4: Run the Demonstration

```bash
# Run the demonstration
npx hardhat run scripts/demo.js --network localhost
```

This demonstration shows:
1. Access control for different roles (owner, institutions, public)
2. Successful operations for authorized parties
3. Failed operations for unauthorized parties
4. The complete workflow of issuing, verifying, and revoking certificates

## Role-Based Script Usage

Instead of an interactive console, you can use our role-based scripts to perform specific actions:

### Owner Actions

As the system owner, you can authorize and revoke educational institutions:

```bash
# Run owner actions script
npx hardhat run scripts/owner-actions.js --network localhost
```

This script demonstrates:
- Authorizing new educational institutions
- Viewing institution details
- Revoking institution access

### Institution Actions

As an authorized educational institution, you can issue and manage certificates:

```bash
# Run institution actions script
npx hardhat run scripts/institution-actions.js --network localhost
```

This script demonstrates:
- Issuing new academic certificates
- Viewing certificate details
- Revoking certificates for valid reasons
- Access control limitations for non-issuing institutions

### Public Verification

Anyone can verify certificates using the public verification script:

```bash
# Run public verification script
npx hardhat run scripts/public-verification.js --network localhost
```

This script demonstrates:
- Verifying valid certificates
- Checking revoked certificates
- Handling non-existent certificates
- Viewing full certificate details when verified

## Running Tests

To run the automated test suite:

```bash
# Make sure you're in the project directory
cd /usr/app/AcademicRecordVerification

# Run the tests
npx hardhat test
```

The test suite verifies:
- Institution management (authorization/revocation)
- Certificate issuance by authorized institutions
- Certificate validation and verification
- Certificate revocation rules
- Access control for all operations

These tests provide comprehensive validation of the contract's functionality and serve as examples of programmatic contract interaction.

## Troubleshooting

### BigInt Error

If you see `Cannot mix BigInt and other types` error, run:
```bash
node scripts/fix-bigint.js
```

### Docker Issues

If experiencing Docker/npx errors, use these alternatives:
- For deployment: `node scripts/run-deploy.js`
- For demonstration: `node scripts/run-demo.js`
- For console: `node -e "require('hardhat').run('console', { network: 'localhost' })"`

## Key Contract Functions

### As Contract Owner
- Authorize an institution: `authorizeInstitution(address, name)`
- Revoke an institution: `revokeInstitution(address)`

### As Educational Institution
- Issue a certificate: `issueCertificate(studentName, studentId, degree, major, issueDate, graduationDate, grade)`
- Revoke a certificate: `revokeCertificate(certificateId, reason)`

### For Anyone (Employers, Students, etc.)
- Verify a certificate: `verifyCertificate(certificateId)`
- Get certificate details: `getCertificate(certificateId)` 