# Academic Record Verification - Usage Instructions

## Project Setup in Docker

> **Note:** If you haven't set up Docker yet, please follow the [Docker Setup Instructions](./README.md#docker-setup) in the README first to create the required Docker image and container.

Once you have the Docker environment set up, follow these steps to deploy and test the Academic Record Verification system:

### Step 1: Set up the Project in Docker

```bash
# Start and access the Docker container
docker start fite2010-lab1
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
npx hardhat run scripts/deploy.js --network localhost
```

The deployment will output your contract address:
```
AcademicRecordVerification deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

Take note of this address for the next step.

### Step 3: Update the Contract Address

Use the update-contract-address.js script to update all script files with your deployed contract address:

```bash
# Update the scripts with your contract address
node scripts/update-contract-address.js 0xYourContractAddress
```

This will automatically update the contract address in all relevant script files.

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

The system uses environment variables to control script behavior. This method provides a more reliable way to pass parameters than command-line arguments.

### Owner Actions

As the system owner, you can authorize and revoke educational institutions:

```bash
# Run owner actions with environment variables
# Format: ENV_VAR=value npx hardhat run scripts/owner-actions.js --network localhost

# Environment Variables:
#  AUTH=true             Authorize an institution
#  REVOKE=true           Revoke an institution's authorization
#  VIEW=true             View institution authorization status (default)
#  INSTITUTION=[name]    Specify institution name (required for auth/revoke)

# Examples:
AUTH=true INSTITUTION="Hong Kong University" npx hardhat run scripts/owner-actions.js --network localhost
REVOKE=true INSTITUTION=CityU npx hardhat run scripts/owner-actions.js --network localhost
VIEW=true npx hardhat run scripts/owner-actions.js --network localhost
```

### Institution Actions

As an authorized educational institution, you can issue and manage certificates:

```bash
# Run institution actions with environment variables
# Format: ENV_VAR=value npx hardhat run scripts/institution-actions.js --network localhost

# Environment Variables:
#  ISSUE=true            Issue a new certificate
#  REVOKE=true           Revoke an existing certificate
#  VIEW=true             View certificate details (default)
#  CERT_ID=[id]          Specify certificate ID (required for revoke/view)
#  INSTITUTION=[name]    Specify institution name (e.g., HKU, CityU)
#  STUDENT=[name]        Student name for certificate issuance
#  DEGREE=[name]         Degree name for certificate issuance
#  MAJOR=[name]          Major for certificate issuance
#  GRADE=[value]         Grade/GPA for certificate issuance (e.g., 3.85)

# Examples:
ISSUE=true STUDENT="Jane Smith" DEGREE="Master of Science" MAJOR="Data Science" GRADE=3.95 INSTITUTION=HKU npx hardhat run scripts/institution-actions.js --network localhost
VIEW=true CERT_ID=0x123abc... npx hardhat run scripts/institution-actions.js --network localhost
REVOKE=true CERT_ID=0x123abc... INSTITUTION=HKU npx hardhat run scripts/institution-actions.js --network localhost
```

### Public Verification

Anyone can verify certificates using the public verification script:

```bash
# Run public verification with environment variables
# Format: ENV_VAR=value npx hardhat run scripts/public-verification.js --network localhost

# Environment Variables:
#  VERIFY=true           Verify a certificate (default)
#  CERT_ID=[id]          Specify certificate ID to verify
#  SETUP=true            Set up demo certificates (for testing only)

# Examples:
VERIFY=true CERT_ID=0x123abc... npx hardhat run scripts/public-verification.js --network localhost
SETUP=true npx hardhat run scripts/public-verification.js --network localhost
```

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

### Docker Issues

If experiencing Docker/npx errors, use these alternatives:
- For deployment: `npx hardhat run scripts/deploy.js --network localhost`
- For demonstration: `npx hardhat run scripts/demo.js --network localhost`
- For console: `npx hardhat console --network localhost`

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