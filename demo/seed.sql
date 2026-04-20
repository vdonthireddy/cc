-- Pathfinder Demo Seed Script
-- Password for all users is 'abc123'
-- Hash generated for 'abc123' using Argon2id

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE `Session`;
TRUNCATE TABLE `User`;
TRUNCATE TABLE `Student`;
TRUNCATE TABLE `StudentParent`;
TRUNCATE TABLE `AcademicRecord`;
TRUNCATE TABLE `Extracurricular`;
TRUNCATE TABLE `College`;
TRUNCATE TABLE `StudentCollege`;
TRUNCATE TABLE `Application`;
TRUNCATE TABLE `Document`;
TRUNCATE TABLE `RecommendationRequest`;
TRUNCATE TABLE `Scholarship`;
TRUNCATE TABLE `ScholarshipApplication`;
TRUNCATE TABLE `CollegeVisit`;
TRUNCATE TABLE `SystemConfig`;
TRUNCATE TABLE `Notification`;
TRUNCATE TABLE `AuditLog`;
SET FOREIGN_KEY_CHECKS = 1;

-- Seed Users
-- Password hash for 'abc123'
INSERT INTO `User` (`id`, `email`, `role`, `name`, `passwordHash`, `createdAt`, `updatedAt`) VALUES
(1, 'admin@pathfinder.com', 'ADMIN', 'Demo Admin', 'abc123', NOW(), NOW()),
(2, 'counselor@pathfinder.com', 'COUNSELOR', 'Dr. Smith', 'abc123', NOW(), NOW()),
(3, 'student@pathfinder.com', 'STUDENT', 'Alice Johnson', 'abc123', NOW(), NOW()),
(4, 'parent@pathfinder.com', 'PARENT', 'Mrs. Johnson', 'abc123', NOW(), NOW());

-- Seed Students
INSERT INTO `Student` (`id`, `userId`, `grade`, `zipCode`, `majorInterest`, `counselorId`, `shareWithParents`) VALUES
(1, 3, 10, '90210', 'CS', 2, 1);

-- Seed Student-Parent Links
INSERT INTO `StudentParent` (`studentId`, `parentId`, `permissions`) VALUES
(1, 4, '{"viewGrades":true,"viewRoadmap":true,"comment":true}');

-- Seed Academic Records (Alice is in 10th grade, interested in CS)
INSERT INTO `AcademicRecord` (`studentId`, `courseName`, `grade`, `credits`, `semester`, `year`, `isAP`, `isHonors`, `createdAt`, `updatedAt`) VALUES
(1, 'Introduction to Programming', 'A', 1.0, 'Fall', 2023, 0, 0, NOW(), NOW()),
(1, 'Geometry Honors', 'B+', 1.0, 'Fall', 2023, 0, 1, NOW(), NOW()),
(1, 'World History', 'A-', 1.0, 'Fall', 2023, 0, 0, NOW(), NOW());

-- Seed Extracurriculars
INSERT INTO `Extracurricular` (`studentId`, `name`, `role`, `impactDescription`, `hoursPerWeek`, `weeksPerYear`, `createdAt`, `updatedAt`) VALUES
(1, 'Coding Club', 'Member', 'Learning Python and participating in local hackathons.', 3, 20, NOW(), NOW());

-- Seed Colleges
INSERT INTO `College` (`id`, `name`, `location`, `sat25th`, `sat75th`, `act25th`, `act75th`, `acceptRate`) VALUES
(1, 'Stanford University', 'Stanford, CA', 1440, 1570, 32, 35, 0.04),
(2, 'UC Berkeley', 'Berkeley, CA', 1300, 1530, 28, 34, 0.17);

-- Seed Student Colleges
INSERT INTO `StudentCollege` (`studentId`, `collegeId`, `demonstratedInterest`) VALUES
(1, 1, 5),
(1, 2, 8);

-- Seed System Config
INSERT INTO `SystemConfig` (`id`, `encryptionKey`, `agentConfig`, `featureFlags`, `updatedAt`) VALUES
(1, 'demo-encryption-key-32-chars-long!', '{"scout":{"enabled":true,"concurrency":2},"report":{"enabled":true,"concurrency":1}}', '{"scholarships":true,"interviewPrep":true}', NOW());

-- Seed Notifications
INSERT INTO `Notification` (`userId`, `title`, `message`, `type`, `createdAt`) VALUES
(3, 'Welcome Alice!', 'Your 10th grade CS roadmap is ready for review.', 'info', NOW());
