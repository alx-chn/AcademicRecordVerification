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
- `test/`: Comprehensive test suite

## Usage Examples

The project includes three main ways to interact with the contract:

1. **Automated Demonstration**: Run `node scripts/run-demo.js` for a complete demonstration
2. **Interactive Console**: Use Hardhat console for manual interaction ([guide](./scripts/console-guide.md))
3. **Test Suite**: Comprehensive tests showing all functionality

## Troubleshooting

For troubleshooting help, see the [Troubleshooting section](./USAGE.md#troubleshooting) in USAGE.md.