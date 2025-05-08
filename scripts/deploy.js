// We require the Hardhat Runtime Environment explicitly here
const hre = require("hardhat");

async function main() {
  console.log("Deploying AcademicRecordVerification contract...");

  // Deploy the contract
  const AcademicRecordVerification = await hre.ethers.getContractFactory("AcademicRecordVerification");
  const academicRecordVerification = await AcademicRecordVerification.deploy();

  await academicRecordVerification.waitForDeployment();

  const address = await academicRecordVerification.getAddress();
  console.log(`AcademicRecordVerification deployed to: ${address}`);
  
  // Get deployer address
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Contract deployed by: ${deployer.address}`);
  console.log(`The deployer is the contract owner and can authorize institutions`);
  
  // Setup a demo institution
  console.log("\nSetting up a demo institution...");
  const institutionName = "Hong Kong University";
  const tx = await academicRecordVerification.authorizeInstitution(deployer.address, institutionName);
  await tx.wait();
  console.log(`Institution "${institutionName}" authorized with address: ${deployer.address}`);
  
  console.log("\nContract is ready for interaction!");
  console.log("You can now:");
  console.log("1. Authorize more institutions");
  console.log("2. Issue certificates");
  console.log("3. Verify certificates");
  console.log("4. Revoke certificates if needed");
}

// We recommend this pattern to be able to use async/await everywhere
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 