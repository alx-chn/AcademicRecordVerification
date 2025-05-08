const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AcademicRecordVerification", function () {
  let academicRecordVerification;
  let owner;
  let institution1;
  let institution2;
  let student1;
  let certificateId;

  const institutionName1 = "Hong Kong University";
  const institutionName2 = "City University of Hong Kong";

  beforeEach(async function () {
    // Get test accounts
    [owner, institution1, institution2, student1] = await ethers.getSigners();

    // Deploy the contract
    const AcademicRecordVerification = await ethers.getContractFactory("AcademicRecordVerification");
    academicRecordVerification = await AcademicRecordVerification.deploy();
  });

  describe("Institution Management", function () {
    it("Should allow owner to authorize institutions", async function () {
      const tx = await academicRecordVerification.authorizeInstitution(institution1.address, institutionName1);
      await tx.wait();
      
      // Check event manually
      const filter = academicRecordVerification.filters.InstitutionAuthorized();
      const events = await academicRecordVerification.queryFilter(filter);
      expect(events.length).to.equal(1);
      expect(events[0].args[0]).to.equal(institution1.address);
      expect(events[0].args[1]).to.equal(institutionName1);

      const institution = await academicRecordVerification.authorizedInstitutions(institution1.address);
      expect(institution.name).to.equal(institutionName1);
      expect(institution.isAuthorized).to.equal(true);
    });

    it("Should allow owner to revoke institutions", async function () {
      await academicRecordVerification.authorizeInstitution(institution1.address, institutionName1);
      
      const tx = await academicRecordVerification.revokeInstitution(institution1.address);
      await tx.wait();
      
      // Check event manually
      const filter = academicRecordVerification.filters.InstitutionRevoked();
      const events = await academicRecordVerification.queryFilter(filter);
      expect(events.length).to.equal(1);
      expect(events[0].args[0]).to.equal(institution1.address);

      const institution = await academicRecordVerification.authorizedInstitutions(institution1.address);
      expect(institution.isAuthorized).to.equal(false);
    });

    it("Should not allow non-owners to authorize institutions", async function () {
      try {
        await academicRecordVerification.connect(institution1).authorizeInstitution(institution2.address, institutionName2);
        expect.fail("Expected transaction to revert");
      } catch (error) {
        expect(error.message).to.include("reverted");
      }
    });
  });

  describe("Certificate Issuance", function () {
    beforeEach(async function () {
      // Authorize institution1
      await academicRecordVerification.authorizeInstitution(institution1.address, institutionName1);
    });

    it("Should allow authorized institutions to issue certificates", async function () {
      const tx = await academicRecordVerification.connect(institution1).issueCertificate(
        "John Doe",
        "S123456",
        "Bachelor of Science",
        "Computer Science",
        "2023-06-15",
        "2023-06-30",
        385 // GPA 3.85
      );

      // Get the certificate ID from the event
      const receipt = await tx.wait();
      const events = await academicRecordVerification.queryFilter(
        academicRecordVerification.filters.CertificateIssued(),
        receipt.blockHash
      );
      
      expect(events.length).to.be.greaterThan(0);
      certificateId = events[0].args[0];

      // Verify certificate details
      const certificate = await academicRecordVerification.getCertificate(certificateId);
      expect(certificate.studentName).to.equal("John Doe");
      expect(certificate.degree).to.equal("Bachelor of Science");
      expect(certificate.major).to.equal("Computer Science");
      expect(Number(certificate.grade)).to.equal(385); // Convert BigInt to Number
      expect(certificate.isRevoked).to.equal(false);
      expect(certificate.issuingInstitution).to.equal(institution1.address);
      expect(certificate.institutionName).to.equal(institutionName1);
    });

    it("Should not allow unauthorized institutions to issue certificates", async function () {
      try {
        await academicRecordVerification.connect(institution2).issueCertificate(
          "Jane Smith",
          "S789012",
          "Master of Business Administration",
          "Finance",
          "2023-06-15",
          "2023-06-30",
          400
        );
        expect.fail("Expected transaction to revert");
      } catch (error) {
        expect(error.message).to.include("Only authorized institutions can issue certificates");
      }
    });
  });

  describe("Certificate Verification and Revocation", function () {
    beforeEach(async function () {
      // Authorize institution1
      await academicRecordVerification.authorizeInstitution(institution1.address, institutionName1);
      
      // Issue a certificate
      const tx = await academicRecordVerification.connect(institution1).issueCertificate(
        "John Doe",
        "S123456",
        "Bachelor of Science",
        "Computer Science",
        "2023-06-15",
        "2023-06-30",
        385
      );
      
      // Get certificate ID
      const receipt = await tx.wait();
      const events = await academicRecordVerification.queryFilter(
        academicRecordVerification.filters.CertificateIssued(),
        receipt.blockHash
      );
      
      expect(events.length).to.be.greaterThan(0);
      certificateId = events[0].args[0];
    });

    it("Should verify valid certificates", async function () {
      const verification = await academicRecordVerification.verifyCertificate(certificateId);
      expect(verification.isValid).to.equal(true);
      expect(verification.institutionAddress).to.equal(institution1.address);
      expect(verification.institutionName).to.equal(institutionName1);
    });

    it("Should allow institutions to revoke their issued certificates", async function () {
      const reason = "Academic misconduct";
      
      const tx = await academicRecordVerification.connect(institution1).revokeCertificate(certificateId, reason);
      await tx.wait();
      
      // Check event manually
      const filter = academicRecordVerification.filters.CertificateRevoked();
      const events = await academicRecordVerification.queryFilter(filter);
      expect(events.length).to.equal(1);
      expect(events[0].args[0]).to.equal(certificateId);
      expect(events[0].args[1]).to.equal(institution1.address);
      expect(events[0].args[2]).to.equal(reason);
      
      // Check certificate is revoked
      const certificate = await academicRecordVerification.getCertificate(certificateId);
      expect(certificate.isRevoked).to.equal(true);
      expect(certificate.revocationReason).to.equal(reason);
      
      // Verify certificate is now invalid
      const verification = await academicRecordVerification.verifyCertificate(certificateId);
      expect(verification.isValid).to.equal(false);
    });

    it("Should not allow non-issuing institutions to revoke certificates", async function () {
      await academicRecordVerification.authorizeInstitution(institution2.address, institutionName2);
      
      try {
        await academicRecordVerification.connect(institution2).revokeCertificate(certificateId, "Attempted fraud");
        expect.fail("Expected transaction to revert");
      } catch (error) {
        expect(error.message).to.include("Only the issuing institution can revoke this certificate");
      }
    });

    it("Should invalidate certificates when institution is revoked", async function () {
      // Revoke the institution
      await academicRecordVerification.revokeInstitution(institution1.address);
      
      // Check that certificate is now invalid due to institution revocation
      const verification = await academicRecordVerification.verifyCertificate(certificateId);
      expect(verification.isValid).to.equal(false);
      
      // But the certificate itself is not marked as revoked
      const certificate = await academicRecordVerification.getCertificate(certificateId);
      expect(certificate.isRevoked).to.equal(false);
    });
  });
}); 