// Script to update the contract address in all script files
const fs = require('fs');
const path = require('path');

// Get contract address from command line
const newAddress = process.argv[2];
if (!newAddress || !newAddress.startsWith('0x')) {
  console.error('Error: Please provide a valid contract address starting with 0x');
  console.error('Usage: node scripts/update-address.js 0xYourContractAddress');
  process.exit(1);
}

// List of script files to update
const scriptFiles = [
  'demo.js',
  'owner-actions.js',
  'institution-actions.js',
  'public-verification.js'
];

// Update each file
let successCount = 0;
scriptFiles.forEach(scriptFile => {
  const filePath = path.join(__dirname, scriptFile);
  
  try {
    // Skip if file doesn't exist
    if (!fs.existsSync(filePath)) {
      console.log(`File ${scriptFile} does not exist, skipping.`);
      return;
    }
    
    // Read the file
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace the contract address
    const addressRegex = /(const\s+contractAddress\s*=\s*["'])([^"']+)(["'])/;
    const updatedContent = content.replace(addressRegex, `$1${newAddress}$3`);
    
    // Write the updated content back to the file
    fs.writeFileSync(filePath, updatedContent);
    
    console.log(`✓ Updated contract address in ${scriptFile}`);
    successCount++;
  } catch (error) {
    console.error(`Error updating ${scriptFile}:`, error.message);
  }
});

if (successCount > 0) {
  console.log(`\nContract address updated to: ${newAddress} in ${successCount} files.`);
  console.log('\nYou can now run any of these scripts:');
  console.log('- npx hardhat run scripts/demo.js --network localhost           (Complete demonstration)');
  console.log('- npx hardhat run scripts/owner-actions.js --network localhost      (Owner actions)');
  console.log('- npx hardhat run scripts/institution-actions.js --network localhost (Institution actions)');
  console.log('- npx hardhat run scripts/public-verification.js --network localhost (Public verification)');
} else {
  console.error('Failed to update any files.');
  process.exit(1);
} 