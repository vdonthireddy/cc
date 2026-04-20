-- Pathfinder Raw SQL Schema

SET FOREIGN_KEY_CHECKS = 0;

-- User Table
CREATE TABLE IF NOT EXISTS `User` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `email` VARCHAR(255) UNIQUE NOT NULL,
    `role` VARCHAR(50) NOT NULL, -- STUDENT, PARENT, COUNSELOR, ADMIN
    `name` VARCHAR(255) NOT NULL,
    `passwordHash` VARCHAR(255),
    `isActive` BOOLEAN DEFAULT TRUE,
    `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Session Table (Simplified for JWT context)
CREATE TABLE IF NOT EXISTS `Session` (
    `id` VARCHAR(255) PRIMARY KEY,
    `userId` INT NOT NULL,
    `expiresAt` DATETIME NOT NULL,
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE
);

-- Student Table
CREATE TABLE IF NOT EXISTS `Student` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `userId` INT UNIQUE NOT NULL,
    `grade` INT NOT NULL,
    `zipCode` VARCHAR(20) NOT NULL,
    `majorInterest` VARCHAR(255),
    `counselorId` INT,
    `shareWithParents` BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`counselorId`) REFERENCES `User`(`id`) ON DELETE SET NULL
);

-- StudentParent Junction Table
CREATE TABLE IF NOT EXISTS `StudentParent` (
    `studentId` INT NOT NULL,
    `parentId` INT NOT NULL,
    `permissions` JSON,
    PRIMARY KEY (`studentId`, `parentId`),
    FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`parentId`) REFERENCES `User`(`id`) ON DELETE CASCADE
);

-- AcademicRecord Table
CREATE TABLE IF NOT EXISTS `AcademicRecord` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `studentId` INT NOT NULL,
    `courseName` VARCHAR(255) NOT NULL,
    `grade` VARCHAR(10),
    `credits` FLOAT,
    `semester` VARCHAR(50) NOT NULL,
    `year` INT NOT NULL,
    `isAP` BOOLEAN DEFAULT FALSE,
    `isHonors` BOOLEAN DEFAULT FALSE,
    `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE CASCADE
);

-- Extracurricular Table
CREATE TABLE IF NOT EXISTS `Extracurricular` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `studentId` INT NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `role` VARCHAR(255),
    `impactDescription` TEXT,
    `hoursPerWeek` INT,
    `weeksPerYear` INT,
    `proofUrl` VARCHAR(255),
    `startDate` DATETIME,
    `endDate` DATETIME,
    `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE CASCADE
);

-- College Table
CREATE TABLE IF NOT EXISTS `College` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `location` VARCHAR(255),
    `sat25th` INT,
    `sat75th` INT,
    `act25th` INT,
    `act75th` INT,
    `acceptRate` FLOAT
);

-- StudentCollege
CREATE TABLE IF NOT EXISTS `StudentCollege` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `studentId` INT NOT NULL,
    `collegeId` INT NOT NULL,
    `addedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `demonstratedInterest` INT DEFAULT 0,
    UNIQUE(`studentId`, `collegeId`),
    FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`collegeId`) REFERENCES `College`(`id`) ON DELETE CASCADE
);

-- Application Table
CREATE TABLE IF NOT EXISTS `Application` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `studentId` INT NOT NULL,
    `collegeId` INT NOT NULL,
    `status` VARCHAR(50) NOT NULL,
    `deadline` DATETIME,
    `notes` TEXT,
    FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`collegeId`) REFERENCES `College`(`id`) ON DELETE CASCADE
);

-- Document Table
CREATE TABLE IF NOT EXISTS `Document` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `studentId` INT NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `url` VARCHAR(255) NOT NULL,
    `version` INT DEFAULT 1,
    `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE CASCADE
);

-- RecommendationRequest Table
CREATE TABLE IF NOT EXISTS `RecommendationRequest` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `studentId` INT NOT NULL,
    `teacherName` VARCHAR(255) NOT NULL,
    `teacherEmail` VARCHAR(255) NOT NULL,
    `status` VARCHAR(50) NOT NULL,
    `deadline` DATETIME,
    `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE CASCADE
);

-- Scholarship Table
CREATE TABLE IF NOT EXISTS `Scholarship` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `amount` INT,
    `deadline` DATETIME,
    `description` TEXT,
    `minGpa` FLOAT,
    `requirements` TEXT
);

-- ScholarshipApplication Table
CREATE TABLE IF NOT EXISTS `ScholarshipApplication` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `studentId` INT NOT NULL,
    `scholarshipId` INT NOT NULL,
    `status` VARCHAR(50) NOT NULL,
    `awardedAmount` INT,
    `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE(`studentId`, `scholarshipId`),
    FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`scholarshipId`) REFERENCES `Scholarship`(`id`) ON DELETE CASCADE
);

-- CollegeVisit Table
CREATE TABLE IF NOT EXISTS `CollegeVisit` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `studentId` INT NOT NULL,
    `collegeId` INT NOT NULL,
    `visitDate` DATETIME NOT NULL,
    `notes` TEXT,
    FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`collegeId`) REFERENCES `College`(`id`) ON DELETE CASCADE
);

-- SystemConfig Table
CREATE TABLE IF NOT EXISTS `SystemConfig` (
    `id` INT PRIMARY KEY DEFAULT 1,
    `openaiApiKey` TEXT,
    `serperApiKey` TEXT,
    `encryptionKey` VARCHAR(255) NOT NULL,
    `agentConfig` JSON,
    `featureFlags` JSON,
    `dataRetentionMonths` INT DEFAULT 12,
    `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `updatedBy` INT
);

-- AgentLog Table
CREATE TABLE IF NOT EXISTS `AgentLog` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `agentName` VARCHAR(50) NOT NULL,
    `studentId` INT,
    `status` VARCHAR(50) NOT NULL,
    `input` JSON,
    `output` JSON,
    `error` TEXT,
    `durationMs` INT,
    `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- AuditLog Table
CREATE TABLE IF NOT EXISTS `AuditLog` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `userId` INT NOT NULL,
    `action` VARCHAR(100) NOT NULL,
    `targetType` VARCHAR(100),
    `targetId` VARCHAR(100),
    `metadata` JSON,
    `ip` VARCHAR(50),
    `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE
);

-- Notification Table
CREATE TABLE IF NOT EXISTS `Notification` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `userId` INT NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `read` BOOLEAN DEFAULT FALSE,
    `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE
);

SET FOREIGN_KEY_CHECKS = 1;
