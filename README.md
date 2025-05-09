# Academic Record Verification System

A blockchain-based smart contract system for issuing, verifying, and managing academic credentials.

## Table of Contents
- [Academic Record Verification System](#academic-record-verification-system)
  - [Table of Contents](#table-of-contents)
  - [Project Overview](#project-overview)
    - [Background](#background)
  - [Smart Contract Features](#smart-contract-features)
    - [For Contract Owner](#for-contract-owner)
    - [For Educational Institutions](#for-educational-institutions)
    - [For Employers/Third Parties](#for-employersthird-parties)
  - [Docker Setup](#docker-setup)
    - [Prerequisites](#prerequisites)
    - [Setup Steps](#setup-steps)
  - [Complete Workflow](#complete-workflow)
    - [Development Workflow](#development-workflow)
    - [Demo Workflow](#demo-workflow)
    - [Real-World Implementation](#real-world-implementation)
  - [Automated Testing](#automated-testing)
    - [Test Coverage](#test-coverage)
      - [1. Institution Management Tests](#1-institution-management-tests)
      - [2. Certificate Issuance Tests](#2-certificate-issuance-tests)
      - [3. Certificate Verification and Revocation Tests](#3-certificate-verification-and-revocation-tests)
    - [Testing Methodology](#testing-methodology)
    - [Example Test Flow](#example-test-flow)
  - [Security Measures](#security-measures)
  - [Getting Started](#getting-started)
  - [Project Structure](#project-structure)
  - [Usage Examples](#usage-examples)
  - [Troubleshooting](#troubleshooting)

## Project Overview

This decentralized application allows educational institutions to issue, verify, and manage academic records (transcripts and certificates) using smart contracts, reducing fraud and streamlining verification.

### Background

Traditional academic credential verification is centralized, slow, and vulnerable to fraud. This system addresses these issues by providing:
- **Immutability**: Records cannot be tampered with once on the blockchain
- **Instant Verification**: Employers can verify credentials immediately
- **Access Control**: Only authorized institutions can issue credentials

## Smart Contract Features

### For Contract Owner
- Authorize/revoke educational institutions

### For Educational Institutions
- Issue verifiable academic credentials
- Revoke certificates when necessary

### For Employers/Third Parties
- Verify certificate authenticity
- Access certificate details

## Docker Setup

To ensure a consistent development environment, this project uses Docker. Follow these steps to set up the same Docker configuration mentioned in the usage instructions:

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed on your machine

### Setup Steps

1. **Create a Dockerfile**

   Create a file named `Dockerfile` with the following content:

   ```dockerfile
   FROM node:16

   WORKDIR /usr/app

   # Install dependencies
   RUN npm install -g npm@latest
   RUN npm install -g hardhat

   # Set up shell
   RUN apt-get update && apt-get install -y vim

   # Keep container running
   CMD ["/bin/bash"]
   ```

2. **Build the Docker Image**

   ```bash
   # Build with the exact same name and tag as in the usage instructions
   docker build -t fite2010:lab1 .
   ```

3. **Create and Start the Container**

   ```bash
   # Create a container with the same name used in the usage instructions
   docker create -it --name fite2010-lab1 -v ${PWD}:/usr/app fite2010:lab1
   
   # Start the container
   docker start fite2010-lab1
   ```

4. **Enter the Container**

   ```bash
   # Access the container shell
   docker exec -it fite2010-lab1 bash
   ```

5. **Set Up the Project Inside Docker**

   Inside the container:
   ```bash
   cd /usr/app/AcademicRecordVerification
   npm install
   ```

With this setup, you'll have a Docker environment that matches the one referenced in the usage instructions, allowing you to use all the commands exactly as written in the documentation.

## Complete Workflow

### Development Workflow

1. **Compile Smart Contract**
   ```bash
   npx hardhat compile
   ```
   This compiles the Solidity contract to bytecode that can be deployed to the blockchain.

2. **Start Local Blockchain**
   ```bash
   npx hardhat node
   ```
   This starts a local Ethereum blockchain for testing with pre-funded accounts.

3. **Deploy Contract**
   ```bash
   npx hardhat run scripts/deploy.js --network localhost
   ```
   This deploys the contract to your local blockchain and outputs the contract address.
   
   The contract inherits from OpenZeppelin's `Ownable` contract:
   ```solidity
   contract AcademicRecordVerification is Ownable {
     // Contract code...
     constructor() Ownable() {}
   }
   ```
   
   By inheriting `Ownable`, the account that deploys the contract (the first account returned by `getSigners()`) automatically becomes the contract owner with special privileges.

4. **Update Contract Address**
   ```bash
   node scripts/update-contract-address.js 0xYourContractAddress
   ```
   This updates all script files with the deployed contract address so they know where to find the contract on the blockchain.

5. **Interact with Contract**
   - Authorize institutions (as owner)
   - Issue certificates (as institution)
   - Verify certificates (as public user)

### Demo Workflow

The `demo.js` script runs a comprehensive demonstration of the system, including positive and negative test cases:

1. **Account Setup**: 
   ```javascript
   const [owner, institution1, institution2, student1] = await hre.ethers.getSigners();
   ```
   `ethers.getSigners()` creates test accounts with private keys for different roles:
   - The first account (`owner`) automatically becomes the contract owner
   - Other accounts are used as institutions and students

2. **Contract Attachment**: 
   ```javascript
   const contract = AcademicRecordVerification.attach(contractAddress);
   ```
   The script connects to the previously deployed contract using its address.

3. **Owner Access Testing**:
   - ✅ Successfully authorizes Institution 1 (Hong Kong University)
   - ✅ Successfully authorizes Institution 2 (City University)
   - ❌ Tests that Institution 1 CANNOT authorize other institutions (access control test)

4. **Institution Access Testing**:
   - ✅ Institution 1 successfully issues a certificate to John Doe
   - ❌ Tests that a student account CANNOT issue certificates (access control test)
   - ✅ Institution 2 successfully issues a certificate to Jane Smith

5. **Public Verification Testing**:
   - ✅ Owner can verify certificates
   - ✅ Institutions can verify certificates
   - ✅ Students/public can verify certificates

6. **Certificate Revocation Testing**:
   - ✅ Institution 1 successfully revokes its own certificate
   - ❌ Tests that Institution 2 CANNOT revoke Institution 1's certificate (access control test)

7. **Institution Revocation Testing**:
   - ✅ Owner successfully revokes Institution 2
   - ✅ Verifies that certificates from revoked Institution 2 are now invalid
   - ❌ Tests that revoked Institution 2 CANNOT issue new certificates (access control test)

The demo specifically includes error cases to demonstrate that the access control system works properly, preventing unauthorized actions.

### Real-World Implementation

In a real-world deployment:

1. **Account Creation**: 
   - System administrator creates an Ethereum account (becomes the contract owner)
   - Each educational institution creates their own Ethereum account
   - Students and employers don't need blockchain accounts to view certificates

2. **Contract Deployment**:
   - System administrator deploys the contract to a production blockchain network (e.g., Ethereum mainnet or a dedicated educational blockchain)
   - Contract address is recorded and shared with institutions

3. **Institution Onboarding**:
   - Institutions submit their Ethereum address to the system administrator
   - Administrator verifies institution identity through real-world verification
   - Administrator calls `authorizeInstitution()` with the verified institution address

4. **Certificate Issuance**:
   - Institutions use their private key to sign transactions that issue certificates
   - Each certificate is tied to a specific student's identifier
   - Blockchain transaction fees (gas) are paid by the institutions

5. **Certificate Verification**:
   - Students receive a certificate ID and verification link
   - Employers use the verification link to check certificate validity without needing a blockchain account
   - The system reads from the blockchain to verify the certificate and institution status

6. **Security Model**:
   - Private keys control access: Only the key holder can perform authorized actions
   - Public addresses enable verification: Anyone can verify a certificate's authenticity
   - Role separation: Institutions cannot impersonate each other or the system administrator

This system ensures that credentials cannot be forged or tampered with, while making verification accessible to anyone with the certificate ID.

## Automated Testing

The system includes a comprehensive test suite to verify all functionality. Run the tests with:

```bash
npx hardhat test
```

### Test Coverage

The tests are organized into three main categories:

#### 1. Institution Management Tests
- **Authorization**: Tests the owner's ability to authorize institutions ✓
- **Revocation**: Tests the owner's ability to revoke institutions ✓
- **Access Control**: Tests that non-owners cannot authorize institutions ✓

#### 2. Certificate Issuance Tests
- **Authorized Issuance**: Tests that authorized institutions can issue certificates ✓
- **Unauthorized Issuance**: Tests that unauthorized institutions cannot issue certificates ✓

#### 3. Certificate Verification and Revocation Tests
- **Verification**: Tests that certificates from authorized institutions verify correctly ✓
- **Self-Revocation**: Tests that institutions can revoke their own certificates ✓
- **Unauthorized Revocation**: Tests that non-issuing institutions cannot revoke others' certificates ✓
- **Institution Revocation Effect**: Tests that revoking an institution invalidates all its certificates ✓

### Testing Methodology

Each test follows a structured approach:

1. **Setup**: Deploy a fresh contract instance and prepare test accounts for each test
2. **Action**: Perform the action being tested (authorize, issue, revoke, etc.)
3. **Event Validation**: Verify that appropriate events are emitted with correct parameters
4. **State Validation**: Check that the contract state has changed correctly
5. **Negative Testing**: Attempt unauthorized actions to verify they're properly rejected

### Example Test Flow

For certificate issuance, the test:
1. Authorizes an institution from the owner account
2. Issues a certificate from the institution account
3. Extracts the certificate ID from the emitted event
4. Verifies all certificate details are correctly stored
5. Checks that unauthorized institutions cannot issue certificates

This comprehensive test suite ensures all contract features work correctly and securely under different conditions.

## Security Measures

- **Access Control**: Role-based permissions
- **Input Validation**: Extensive validation on all inputs
- **Event Logging**: Transparent activity tracking
- **Secure Ownership**: OpenZeppelin's Ownable pattern

## Getting Started

For detailed setup and usage instructions, please refer to [USAGE.md](./USAGE.md).

## Project Structure

- `contracts/`: Smart contract code
- `scripts/`: Deployment and interaction scripts
  - `deploy.js`: Deploys the contract
  - `update-contract-address.js`: Updates contract address in script files
  - `demo.js`: Complete system demonstration
  - `owner-actions.js`: Owner-specific actions (authorize/revoke institutions)
  - `institution-actions.js`: Institution-specific actions (issue/revoke certificates)
  - `public-verification.js`: Public certificate verification
- `test/`: Comprehensive test suite

## Usage Examples

The project includes three main ways to interact with the contract:

1. **Demonstration**: Run `npx hardhat run scripts/demo.js --network localhost` for a complete demonstration
2. **Role-Based Scripts**: Use environment variables with dedicated scripts for each role:
   - Owner: `AUTH=true INSTITUTION="HKU" npx hardhat run scripts/owner-actions.js --network localhost`
   - Institution: `ISSUE=true STUDENT="Jane Smith" npx hardhat run scripts/institution-actions.js --network localhost`
   - Public: `VERIFY=true CERT_ID=0x123... npx hardhat run scripts/public-verification.js --network localhost`
3. **Test Suite**: Comprehensive tests showing all functionality with `npx hardhat test`

## Troubleshooting

For troubleshooting help, see the [Troubleshooting section](./USAGE.md#troubleshooting) in USAGE.md.