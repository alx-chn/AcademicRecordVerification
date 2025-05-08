// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title AcademicRecordVerification
 * @dev Smart contract for issuing, verifying, and revoking academic records/certificates
 */
contract AcademicRecordVerification is Ownable {
    using Strings for uint256;
    
    // Events
    event CertificateIssued(bytes32 indexed certificateId, address indexed institution, string studentName);
    event CertificateRevoked(bytes32 indexed certificateId, address indexed institution, string reason);
    event InstitutionAuthorized(address indexed institution, string name);
    event InstitutionRevoked(address indexed institution);

    // Struct to store certificate details
    struct Certificate {
        string studentName;
        string studentId;
        string degree;
        string major;
        string issueDate;
        string graduationDate;
        uint256 grade;
        bool isRevoked;
        string revocationReason;
        address issuingInstitution;
    }

    // Struct to store institution details
    struct Institution {
        string name;
        bool isAuthorized;
    }

    // Mapping from certificate ID to Certificate struct
    mapping(bytes32 => Certificate) public certificates;
    
    // Mapping from institution address to Institution struct
    mapping(address => Institution) public authorizedInstitutions;

    constructor() Ownable() {}

    /**
     * @dev Authorize an educational institution to issue certificates
     * @param institutionAddress Address of the institution
     * @param institutionName Name of the institution
     */
    function authorizeInstitution(address institutionAddress, string calldata institutionName) external onlyOwner {
        require(institutionAddress != address(0), "Invalid institution address");
        require(bytes(institutionName).length > 0, "Institution name cannot be empty");
        
        authorizedInstitutions[institutionAddress] = Institution({
            name: institutionName,
            isAuthorized: true
        });
        
        emit InstitutionAuthorized(institutionAddress, institutionName);
    }

    /**
     * @dev Revoke authorization from an institution
     * @param institutionAddress Address of the institution to revoke
     */
    function revokeInstitution(address institutionAddress) external onlyOwner {
        require(authorizedInstitutions[institutionAddress].isAuthorized, "Institution not authorized");
        
        authorizedInstitutions[institutionAddress].isAuthorized = false;
        
        emit InstitutionRevoked(institutionAddress);
    }

    /**
     * @dev Issue a new academic certificate
     * @param studentName Name of the student
     * @param studentId ID of the student
     * @param degree Degree earned
     * @param major Major or field of study
     * @param issueDate Date of certificate issue
     * @param graduationDate Date of graduation
     * @param grade Grade or GPA (multiplied by 100 to handle decimals, e.g. 3.85 = 385)
     * @return certificateId The unique ID of the issued certificate
     */
    function issueCertificate(
        string calldata studentName,
        string calldata studentId,
        string calldata degree,
        string calldata major,
        string calldata issueDate,
        string calldata graduationDate,
        uint256 grade
    ) external returns (bytes32 certificateId) {
        require(authorizedInstitutions[msg.sender].isAuthorized, "Only authorized institutions can issue certificates");
        require(bytes(studentName).length > 0, "Student name cannot be empty");
        require(bytes(studentId).length > 0, "Student ID cannot be empty");
        require(bytes(degree).length > 0, "Degree cannot be empty");

        // Generate unique certificate ID using keccak256 hash
        certificateId = keccak256(
            abi.encodePacked(
                studentName,
                studentId,
                degree,
                major,
                issueDate,
                block.timestamp,
                msg.sender
            )
        );
        
        // Ensure certificate ID is unique
        require(certificates[certificateId].issuingInstitution == address(0), "Certificate already exists");
        
        // Store certificate details
        certificates[certificateId] = Certificate({
            studentName: studentName,
            studentId: studentId,
            degree: degree,
            major: major,
            issueDate: issueDate,
            graduationDate: graduationDate,
            grade: grade,
            isRevoked: false,
            revocationReason: "",
            issuingInstitution: msg.sender
        });
        
        emit CertificateIssued(certificateId, msg.sender, studentName);
        
        return certificateId;
    }

    /**
     * @dev Revoke a previously issued certificate
     * @param certificateId ID of the certificate to revoke
     * @param reason Reason for revocation
     */
    function revokeCertificate(bytes32 certificateId, string calldata reason) external {
        Certificate storage certificate = certificates[certificateId];
        
        require(certificate.issuingInstitution != address(0), "Certificate does not exist");
        require(certificate.issuingInstitution == msg.sender, "Only the issuing institution can revoke this certificate");
        require(!certificate.isRevoked, "Certificate is already revoked");
        
        certificate.isRevoked = true;
        certificate.revocationReason = reason;
        
        emit CertificateRevoked(certificateId, msg.sender, reason);
    }

    /**
     * @dev Get certificate details
     * @param certificateId ID of the certificate to retrieve
     * @return studentName The name of the student
     * @return studentId The ID of the student
     * @return degree The degree earned
     * @return major The major or field of study
     * @return issueDate The date the certificate was issued
     * @return graduationDate The date of graduation
     * @return grade The grade or GPA
     * @return isRevoked Whether the certificate is revoked
     * @return revocationReason Reason for revocation if applicable
     * @return issuingInstitution Address of the institution that issued the certificate
     * @return institutionName Name of the institution that issued the certificate
     */
    function getCertificate(bytes32 certificateId) external view returns (
        string memory studentName,
        string memory studentId,
        string memory degree,
        string memory major,
        string memory issueDate,
        string memory graduationDate,
        uint256 grade,
        bool isRevoked,
        string memory revocationReason,
        address issuingInstitution,
        string memory institutionName
    ) {
        Certificate memory cert = certificates[certificateId];
        require(cert.issuingInstitution != address(0), "Certificate does not exist");
        
        return (
            cert.studentName,
            cert.studentId,
            cert.degree,
            cert.major,
            cert.issueDate,
            cert.graduationDate,
            cert.grade,
            cert.isRevoked,
            cert.revocationReason,
            cert.issuingInstitution,
            authorizedInstitutions[cert.issuingInstitution].name
        );
    }

    /**
     * @dev Verify the authenticity of a certificate
     * @param certificateId ID of the certificate to verify
     * @return isValid Whether the certificate is valid (exists and not revoked)
     * @return institutionAddress Address of the issuing institution
     * @return institutionName Name of the issuing institution
     */
    function verifyCertificate(bytes32 certificateId) external view returns (
        bool isValid,
        address institutionAddress,
        string memory institutionName
    ) {
        Certificate memory cert = certificates[certificateId];
        
        if (cert.issuingInstitution == address(0)) {
            return (false, address(0), "");
        }
        
        bool valid = !cert.isRevoked && authorizedInstitutions[cert.issuingInstitution].isAuthorized;
        
        return (
            valid,
            cert.issuingInstitution,
            authorizedInstitutions[cert.issuingInstitution].name
        );
    }

    /**
     * @dev Get certificates issued to a specific student by ID
     * @param studentId ID of the student
     * @return certificateIds Array of certificate IDs belonging to the student
     */
    function getStudentCertificates(string calldata studentId) external view returns (bytes32[] memory) {
        // Count certificates for the student
        uint256 count = 0;
        for (uint256 i = 0; i < 1000; i++) { // Limiting the search to avoid out-of-gas errors
            bytes32 certId = keccak256(abi.encodePacked(i, studentId));
            if (certificates[certId].issuingInstitution != address(0) && 
                keccak256(abi.encodePacked(certificates[certId].studentId)) == keccak256(abi.encodePacked(studentId))) {
                count++;
            }
        }
        
        // Create array of certificate IDs
        bytes32[] memory result = new bytes32[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < 1000; i++) {
            bytes32 certId = keccak256(abi.encodePacked(i, studentId));
            if (certificates[certId].issuingInstitution != address(0) && 
                keccak256(abi.encodePacked(certificates[certId].studentId)) == keccak256(abi.encodePacked(studentId))) {
                result[index] = certId;
                index++;
            }
        }
        
        return result;
    }
} 