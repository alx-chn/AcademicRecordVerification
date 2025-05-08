// Script to update the contract address in demo.js
const fs = require('fs');
const path = require('path');

// Get contract address from command line
const newAddress = process.argv[2];
if (!newAddress || !newAddress.startsWith('0x')) {
  console.error('Error: Please provide a valid contract address starting with 0x');
  console.error('Usage: node update-address.js 0xYourContractAddress');
  process.exit(1);
}

// Path to demo.js
const demoFilePath = path.join(__dirname, 'demo.js');

try {
  // Read the demo.js file
  let demoContent = fs.readFileSync(demoFilePath, 'utf8');
  
  // Replace the contract address
  const addressRegex = /(const\s+contractAddress\s*=\s*["'])([^"']+)(["'])/;
  const updatedContent = demoContent.replace(addressRegex, `$1${newAddress}$3`);
  
  // Write the updated content back to demo.js
  fs.writeFileSync(demoFilePath, updatedContent);
  
  console.log(`Contract address updated to: ${newAddress}`);
  console.log('You can now run: node scripts/run-demo.js');
} catch (error) {
  console.error('Error updating contract address:', error.message);
  process.exit(1);
} 