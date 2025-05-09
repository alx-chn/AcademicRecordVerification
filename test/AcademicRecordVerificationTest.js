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

    it("Should not allow unauthorized accounts to perform owner operations", async function () {
      // Try to authorize an institution as non-owner
      try {
        await academicRecordVerification.connect(institution1).authorizeInstitution(institution2.address, institutionName2);
        expect.fail("Expected transaction to revert");
      } catch (error) {
        expect(error.message).to.include("Ownable: caller is not the owner");
      }
      
      // Try to revoke an institution as non-owner
      await academicRecordVerification.authorizeInstitution(institution1.address, institutionName1);
      try {
        await academicRecordVerification.connect(institution2).revokeInstitution(institution1.address);
        expect.fail("Expected transaction to revert");
      } catch (error) {
        expect(error.message).to.include("Ownable: caller is not the owner");
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
      
      // Extract the CertificateIssued event from logs
      const event = receipt.logs.find(log => {
        try {
          const parsed = academicRecordVerification.interface.parseLog(log);
          return parsed.name === "CertificateIssued";
        } catch (e) {
          return false;
        }
      });
      
      expect(event).to.not.be.undefined;
      const parsedEvent = academicRecordVerification.interface.parseLog(event);
      certificateId = parsedEvent.args[0];

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
      
      // Extract the CertificateIssued event from logs
      const event = receipt.logs.find(log => {
        try {
          const parsed = academicRecordVerification.interface.parseLog(log);
          return parsed.name === "CertificateIssued";
        } catch (e) {
          return false;
        }
      });
      
      expect(event).to.not.be.undefined;
      const parsedEvent = academicRecordVerification.interface.parseLog(event);
      certificateId = parsedEvent.args[0];
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

    it("Should not allow revoked institutions to revoke certificates", async function () {
      // Issue a certificate first
      const tx = await academicRecordVerification.connect(institution1).issueCertificate(
        "Alice Johnson",
        "S567890",
        "Master of Engineering",
        "Electrical Engineering",
        "2023-07-10",
        "2023-07-25",
        390
      );
      
      // Get certificate ID
      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          const parsed = academicRecordVerification.interface.parseLog(log);
          return parsed.name === "CertificateIssued";
        } catch (e) {
          return false;
        }
      });
      
      expect(event).to.not.be.undefined;
      const parsedEvent = academicRecordVerification.interface.parseLog(event);
      const newCertificateId = parsedEvent.args[0];
      
      // Verify certificate is valid
      let verification = await academicRecordVerification.verifyCertificate(newCertificateId);
      expect(verification.isValid).to.equal(true);
      
      // Now revoke the institution
      await academicRecordVerification.revokeInstitution(institution1.address);
      
      // The certificate should now be invalid due to institution revocation
      verification = await academicRecordVerification.verifyCertificate(newCertificateId);
      expect(verification.isValid).to.equal(false);
      
      // Try to revoke the certificate from the revoked institution
      try {
        await academicRecordVerification.connect(institution1).revokeCertificate(
          newCertificateId,
          "Attempted certificate revocation from revoked institution"
        );
        expect.fail("Expected transaction to revert");
      } catch (error) {
        expect(error.message).to.include("Institution must be authorized to revoke certificates");
      }
    });

    it("Should enforce proper access control during reauthorization cycles", async function () {
      // Step 1: Issue a certificate as an authorized institution
      const tx1 = await academicRecordVerification.connect(institution1).issueCertificate(
        "Robert Brown",
        "S111222",
        "PhD",
        "Computer Science",
        "2023-08-01",
        "2023-08-15",
        400
      );
      
      const receipt1 = await tx1.wait();
      const event1 = receipt1.logs.find(log => {
        try {
          return academicRecordVerification.interface.parseLog(log).name === "CertificateIssued";
        } catch (e) {
          return false;
        }
      });
      const testCertId = academicRecordVerification.interface.parseLog(event1).args[0];
      
      // Step 2: Revoke the institution
      await academicRecordVerification.revokeInstitution(institution1.address);
      
      // Step 3: Try to revoke the certificate (should fail)
      try {
        await academicRecordVerification.connect(institution1).revokeCertificate(
          testCertId,
          "Trying to revoke while unauthorized"
        );
        expect.fail("Expected transaction to revert");
      } catch (error) {
        expect(error.message).to.include("Institution must be authorized to revoke certificates");
      }
      
      // Step 4: Reauthorize the institution
      await academicRecordVerification.authorizeInstitution(institution1.address, institutionName1);
      
      // Step 5: Now they should be able to revoke the certificate
      const tx2 = await academicRecordVerification.connect(institution1).revokeCertificate(
        testCertId,
        "Valid revocation after reauthorization"
      );
      await tx2.wait();
      
      // Verify the certificate is now revoked
      const certificate = await academicRecordVerification.getCertificate(testCertId);
      expect(certificate.isRevoked).to.equal(true);
      expect(certificate.revocationReason).to.equal("Valid revocation after reauthorization");
    });

    it("Should prevent revoked institutions from issuing new certificates after revocation", async function () {
      // First authorize the institution
      await academicRecordVerification.authorizeInstitution(institution2.address, institutionName2);
      
      // Issue a certificate successfully
      const tx = await academicRecordVerification.connect(institution2).issueCertificate(
        "Emily Davis",
        "S999888",
        "Bachelor of Arts",
        "English Literature",
        "2023-05-01",
        "2023-05-30",
        375
      );
      await tx.wait();
      
      // Now revoke the institution
      await academicRecordVerification.revokeInstitution(institution2.address);
      
      // Try to issue a new certificate after revocation
      try {
        await academicRecordVerification.connect(institution2).issueCertificate(
          "James Wilson",
          "S777666",
          "Bachelor of Arts",
          "History",
          "2023-05-02",
          "2023-05-31",
          380
        );
        expect.fail("Expected transaction to revert");
      } catch (error) {
        expect(error.message).to.include("Only authorized institutions can issue certificates");
      }
      
      // Verify authorization status directly
      const institutionStatus = await academicRecordVerification.authorizedInstitutions(institution2.address);
      expect(institutionStatus.isAuthorized).to.equal(false);
    });
  });
}); 