// Script to fix BigInt conversion error in interact.js
const fs = require('fs');
const path = require('path');

// Path to interact.js
const interactFilePath = path.join(__dirname, 'interact.js');

try {
  // Read the interact.js file
  let interactContent = fs.readFileSync(interactFilePath, 'utf8');
  
  // Find and replace the GPA calculation
  const originalLine = /console\.log\(`- GPA: \${cert1\.grade \/ 100}\`\);/g;
  const fixedLine = 'console.log(`- GPA: ${Number(cert1.grade) / 100}`);';
  
  // Also fix the same issue for the revoked certificate if it exists
  const originalLine2 = /console\.log\(`- GPA: \${cert1Revoked\.grade \/ 100}\`\);/g;
  const fixedLine2 = 'console.log(`- GPA: ${Number(cert1Revoked.grade) / 100}`);';
  
  // Apply the replacements
  let updatedContent = interactContent.replace(originalLine, fixedLine);
  updatedContent = updatedContent.replace(originalLine2, fixedLine2);
  
  // Write the updated content back to interact.js
  fs.writeFileSync(interactFilePath, updatedContent);
  
  console.log('BigInt conversion issue fixed in interact.js');
  console.log('You can now run: node scripts/run-interact.js');
} catch (error) {
  console.error('Error fixing BigInt conversion:', error.message);
  process.exit(1);
} 