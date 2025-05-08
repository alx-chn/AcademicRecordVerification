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

## Troubleshooting

For troubleshooting help, see the [Troubleshooting section](./USAGE.md#troubleshooting) in USAGE.md.