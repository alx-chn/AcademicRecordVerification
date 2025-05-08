// Direct runner for deploy.js that doesn't rely on npx
// This can help avoid issues with npx in some Docker environments

// Set up hardhat runtime environment manually
process.env.HARDHAT_NETWORK = 'localhost';
require('hardhat/register');

// Run the deployment script
require('./deploy.js'); 