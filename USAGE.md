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
node scripts/run-demo.js
```

This demonstration shows:
1. Access control for different roles (owner, institutions, public)
2. Successful operations for authorized parties
3. Failed operations for unauthorized parties
4. The complete workflow of issuing, verifying, and revoking certificates

## Interactive Console Usage

For manual interaction with the contract, use the Hardhat console:

```bash
# Start the console
npx hardhat console --network localhost
```

See the [Interactive Console Guide](./scripts/console-guide.md) for detailed examples of:
- Connecting to your contract
- Performing operations as different users (owner, institution, student)
- Testing access control
- Executing all contract functions

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