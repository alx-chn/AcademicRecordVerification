# Academic Record Verification System

A blockchain-based smart contract system for issuing, verifying, and managing academic credentials.

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

The `demo.js` script demonstrates the complete workflow:

1. **Account Setup**: `ethers.getSigners()` creates test accounts with private keys for different roles (owner, institutions, public users)
2. **Contract Deployment**: Contract is deployed with the first account as owner
3. **Institution Authorization**: Owner authorizes specific institution addresses
4. **Certificate Issuance**: Authorized institutions issue certificates to students
5. **Certificate Verification**: Public users verify certificates
6. **Certificate Revocation**: Institutions or owner can revoke certificates when needed

Each step simulates a real transaction on the blockchain with proper access control and event emission.

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

## Troubleshooting

For troubleshooting help, see the [Troubleshooting section](./USAGE.md#troubleshooting) in USAGE.md.