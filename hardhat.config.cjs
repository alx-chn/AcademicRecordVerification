/** @type import('hardhat/config').HardhatUserConfig */
require("@nomicfoundation/hardhat-ethers");

// Add the task function
task = require("hardhat/config").task;

// Task to update contract addresses in script files
task("update-address", "Updates contract address in all script files")
  .addPositionalParam("address", "The new contract address")
  .setAction(async (taskArgs) => {
    const fs = require('fs');
    const path = require('path');
    
    const newAddress = taskArgs.address;
    
    if (!newAddress || !newAddress.startsWith('0x')) {
      console.error('Error: Please provide a valid contract address starting with 0x');
      return;
    }
    
    const scriptDir = path.join(__dirname, "scripts");
    
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
      const filePath = path.join(scriptDir, scriptFile);
      
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
      console.log('- npx hardhat run scripts/demo.js --network localhost');
      console.log('- npx hardhat run scripts/owner-actions.js --network localhost');
      console.log('- npx hardhat run scripts/institution-actions.js --network localhost');
      console.log('- npx hardhat run scripts/public-verification.js --network localhost');
    } else {
      console.error('Failed to update any files.');
    }
  });

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true
    }
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545"
    }
  }
}; 