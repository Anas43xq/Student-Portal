-- ============================================
-- Student Portal Database Schema
-- Database: StudentPortalDB
-- ============================================

SET FOREIGN_KEY_CHECKS = 0;

DROP VIEW IF EXISTS EnrollmentDetails;
DROP VIEW IF EXISTS CourseDetails;
DROP VIEW IF EXISTS StudentDetails;

DROP TABLE IF EXISTS ActivityLog;
DROP TABLE IF EXISTS CourseInstructors;
DROP TABLE IF EXISTS Enrollments;
DROP TABLE IF EXISTS Instructors;
DROP TABLE IF EXISTS Courses;
DROP TABLE IF EXISTS Students;
DROP TABLE IF EXISTS Users;

-- ============================================
-- Users Table (Authentication)
-- ============================================
CREATE TABLE Users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  role ENUM('Admin', 'Student', 'Instructor') NOT NULL DEFAULT 'Student',
  firstName VARCHAR(50) NOT NULL,
  lastName VARCHAR(50) NOT NULL,
  isBanned BOOLEAN DEFAULT FALSE,
  bannedAt TIMESTAMP NULL DEFAULT NULL,
  bannedBy INT NULL DEFAULT NULL,
  banReason VARCHAR(500) DEFAULT NULL,
  createdAt DATETIME,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (bannedBy) REFERENCES Users(id) ON DELETE SET NULL,
  INDEX idx_username (username),
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_isBanned (isBanned)
);

-- ============================================
-- Students Table
-- ============================================
CREATE TABLE Students (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  dateOfBirth DATE DEFAULT NULL,
  gender ENUM('Male', 'Female', 'Other', 'Prefer not to say') DEFAULT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  address VARCHAR(255) DEFAULT NULL,
  city VARCHAR(100) DEFAULT NULL,
  state VARCHAR(50) DEFAULT NULL,
  zipCode VARCHAR(10) DEFAULT NULL,
  enrollmentDate DATE DEFAULT NULL,
  major VARCHAR(100) DEFAULT NULL,
  gpa DECIMAL(3,2) DEFAULT NULL,
  totalCredits INT DEFAULT 0,
  status ENUM('Active', 'Inactive', 'Graduated', 'Suspended') DEFAULT 'Active',
  createdAt DATETIME,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
  INDEX idx_userId (userId),
  INDEX idx_status (status),
  INDEX idx_major (major),
  CONSTRAINT chk_gpa CHECK (gpa >= 0.00 AND gpa <= 4.00)
);

-- ============================================
-- Courses Table
-- ============================================
CREATE TABLE Courses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  department VARCHAR(100) NOT NULL,
  credits INT NOT NULL,
  semester ENUM('Fall', 'Spring', 'Summer') NOT NULL,
  year INT NOT NULL,
  description TEXT DEFAULT NULL,
  capacity INT DEFAULT 30,
  currentEnrollment INT DEFAULT 0,
  createdAt DATETIME,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_code (code),
  INDEX idx_department (department),
  INDEX idx_semester (semester, year),
  CONSTRAINT chk_credits CHECK (credits > 0 AND credits <= 6),
  CONSTRAINT chk_capacity CHECK (capacity > 0),
  CONSTRAINT chk_year CHECK (year >= 2000 AND year <= 2100)
);

-- ============================================
-- Enrollments Table
-- ============================================
CREATE TABLE Enrollments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  studentId INT NOT NULL,
  courseId INT NOT NULL,
  semester ENUM('Fall', 'Spring', 'Summer') NOT NULL,
  year INT NOT NULL,
  grade VARCHAR(2) DEFAULT NULL,
  status ENUM('Active', 'Completed', 'Dropped', 'Withdrawn', 'Failed') DEFAULT 'Active',
  enrolledAt DATETIME,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (studentId) REFERENCES Students(id) ON DELETE CASCADE,
  FOREIGN KEY (courseId) REFERENCES Courses(id) ON DELETE CASCADE,
  UNIQUE KEY unique_enrollment (studentId, courseId, semester, year),
  INDEX idx_studentId (studentId),
  INDEX idx_courseId (courseId),
  INDEX idx_status (status),
  INDEX idx_semester (semester, year),
  CONSTRAINT chk_grade CHECK (grade IN ('A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F', 'W', 'I', 'P') OR grade IS NULL)
);

-- ============================================
-- Instructors Table
-- ============================================
CREATE TABLE Instructors (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT DEFAULT NULL,
  firstName VARCHAR(50) NOT NULL,
  lastName VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  department VARCHAR(100) NOT NULL,
  title VARCHAR(50) DEFAULT 'Professor',
  phone VARCHAR(20) DEFAULT NULL,
  officeLocation VARCHAR(100) DEFAULT NULL,
  createdAt DATETIME,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE SET NULL,
  INDEX idx_userId (userId),
  INDEX idx_email (email),
  INDEX idx_department (department)
);

-- ============================================
-- CourseInstructors Junction Table
-- ============================================
CREATE TABLE CourseInstructors (
  id INT PRIMARY KEY AUTO_INCREMENT,
  courseId INT NOT NULL,
  instructorId INT NOT NULL,
  role ENUM('Primary', 'Secondary', 'TA') DEFAULT 'Primary',
  createdAt DATETIME,
  FOREIGN KEY (courseId) REFERENCES Courses(id) ON DELETE CASCADE,
  FOREIGN KEY (instructorId) REFERENCES Instructors(id) ON DELETE CASCADE,
  UNIQUE KEY unique_assignment (courseId, instructorId),
  INDEX idx_courseId (courseId),
  INDEX idx_instructorId (instructorId)
);

-- ============================================
-- Activity Log Table (Recent Activity for Admin)
-- ============================================
CREATE TABLE ActivityLog (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT DEFAULT NULL,
  username VARCHAR(50) DEFAULT NULL,
  action ENUM('CREATE', 'UPDATE', 'DELETE') NOT NULL,
  entityType ENUM('User', 'Student', 'Course', 'Enrollment', 'Instructor') NOT NULL,
  entityId INT DEFAULT NULL,
  entityName VARCHAR(255) DEFAULT NULL,
  description TEXT DEFAULT NULL,
  timestamp DATETIME,
  FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE SET NULL,
  INDEX idx_timestamp (timestamp),
  INDEX idx_entityType (entityType),
  INDEX idx_action (action),
  INDEX idx_userId (userId)
);

-- ============================================
-- SEED DATA
-- ============================================

-- Insert Admin User
INSERT INTO Users (username, password, email, role, firstName, lastName) VALUES
('admin', '$2a$10$yMtuM7OsoiyGyQHtrHVvh.2ZK0zfkwFh02bw5mnBPJGGMPIhktAue', 'admin@university.edu', 'Admin', 'System', 'Administrator');
-- Password: admin123

-- Insert Student Users
INSERT INTO Users (username, password, email, role, firstName, lastName) VALUES
('student', '$2a$10$kcMgivH8It7RMASujWoxS.EC9fAHVBJCUwhSSb12vP10xPS2uCpU6', 'student@university.edu', 'Student', 'John', 'Doe'),
('jsmith', '$2a$10$kcMgivH8It7RMASujWoxS.EC9fAHVBJCUwhSSb12vP10xPS2uCpU6', 'jsmith@university.edu', 'Student', 'Jane', 'Smith'),
('mbrown', '$2a$10$kcMgivH8It7RMASujWoxS.EC9fAHVBJCUwhSSb12vP10xPS2uCpU6', 'mbrown@university.edu', 'Student', 'Michael', 'Brown'),
('ejohnson', '$2a$10$kcMgivH8It7RMASujWoxS.EC9fAHVBJCUwhSSb12vP10xPS2uCpU6', 'ejohnson@university.edu', 'Student', 'Emily', 'Johnson'),
('dwilliams', '$2a$10$kcMgivH8It7RMASujWoxS.EC9fAHVBJCUwhSSb12vP10xPS2uCpU6', 'dwilliams@university.edu', 'Student', 'David', 'Williams'),
('sgarcia', '$2a$10$kcMgivH8It7RMASujWoxS.EC9fAHVBJCUwhSSb12vP10xPS2uCpU6', 'sgarcia@university.edu', 'Student', 'Sofia', 'Garcia'),
('jrodriguez', '$2a$10$kcMgivH8It7RMASujWoxS.EC9fAHVBJCUwhSSb12vP10xPS2uCpU6', 'jrodriguez@university.edu', 'Student', 'James', 'Rodriguez'),
('amartinez', '$2a$10$kcMgivH8It7RMASujWoxS.EC9fAHVBJCUwhSSb12vP10xPS2uCpU6', 'amartinez@university.edu', 'Student', 'Ana', 'Martinez'),
('rthompson', '$2a$10$kcMgivH8It7RMASujWoxS.EC9fAHVBJCUwhSSb12vP10xPS2uCpU6', 'rthompson@university.edu', 'Student', 'Robert', 'Thompson'),
('lhernandez', '$2a$10$kcMgivH8It7RMASujWoxS.EC9fAHVBJCUwhSSb12vP10xPS2uCpU6', 'lhernandez@university.edu', 'Student', 'Lisa', 'Hernandez'),
('klopez', '$2a$10$kcMgivH8It7RMASujWoxS.EC9fAHVBJCUwhSSb12vP10xPS2uCpU6', 'klopez@university.edu', 'Student', 'Kevin', 'Lopez'),
('mwilson', '$2a$10$kcMgivH8It7RMASujWoxS.EC9fAHVBJCUwhSSb12vP10xPS2uCpU6', 'mwilson@university.edu', 'Student', 'Maria', 'Wilson'),
('dmoore', '$2a$10$kcMgivH8It7RMASujWoxS.EC9fAHVBJCUwhSSb12vP10xPS2uCpU6', 'dmoore@university.edu', 'Student', 'Daniel', 'Moore'),
('jlee', '$2a$10$kcMgivH8It7RMASujWoxS.EC9fAHVBJCUwhSSb12vP10xPS2uCpU6', 'jlee@university.edu', 'Student', 'Jessica', 'Lee'),
('pwhite', '$2a$10$kcMgivH8It7RMASujWoxS.EC9fAHVBJCUwhSSb12vP10xPS2uCpU6', 'pwhite@university.edu', 'Student', 'Paul', 'White');
-- All student passwords: student123

-- Insert Instructor Users
INSERT INTO Users (username, password, email, role, firstName, lastName) VALUES
('randerson', '$2a$10$oxo3nQAuu7DV9gQkVTDKNealTInGunb9gHA/y7O7wq/dnL.JaTUdG', 'r.anderson@university.edu', 'Instructor', 'Robert', 'Anderson'),
('smartinez', '$2a$10$oxo3nQAuu7DV9gQkVTDKNealTInGunb9gHA/y7O7wq/dnL.JaTUdG', 's.martinez@university.edu', 'Instructor', 'Sarah', 'Martinez'),
('jwilson', '$2a$10$oxo3nQAuu7DV9gQkVTDKNealTInGunb9gHA/y7O7wq/dnL.JaTUdG', 'j.wilson@university.edu', 'Instructor', 'James', 'Wilson'),
('ltaylor', '$2a$10$oxo3nQAuu7DV9gQkVTDKNealTInGunb9gHA/y7O7wq/dnL.JaTUdG', 'l.taylor@university.edu', 'Instructor', 'Linda', 'Taylor'),
('tmoore', '$2a$10$oxo3nQAuu7DV9gQkVTDKNealTInGunb9gHA/y7O7wq/dnL.JaTUdG', 't.moore@university.edu', 'Instructor', 'Thomas', 'Moore'),
('pgarcia', '$2a$10$oxo3nQAuu7DV9gQkVTDKNealTInGunb9gHA/y7O7wq/dnL.JaTUdG', 'p.garcia@university.edu', 'Instructor', 'Patricia', 'Garcia'),
('clee', '$2a$10$oxo3nQAuu7DV9gQkVTDKNealTInGunb9gHA/y7O7wq/dnL.JaTUdG', 'c.lee@university.edu', 'Instructor', 'Christopher', 'Lee'),
('jwhite', '$2a$10$oxo3nQAuu7DV9gQkVTDKNealTInGunb9gHA/y7O7wq/dnL.JaTUdG', 'j.white@university.edu', 'Instructor', 'Jennifer', 'White');
-- All instructor passwords: instructor123

-- Insert Students
INSERT INTO Students (userId, dateOfBirth, gender, phone, address, city, state, zipCode, enrollmentDate, major, gpa, totalCredits, status) VALUES
(2, '2002-05-15', 'Male', '555-0101', '123 Main St', 'Springfield', 'IL', '62701', '2023-09-01', 'Computer Science', 3.85, 45, 'Active'),
(3, '2003-08-22', 'Female', '555-0102', '456 Oak Ave', 'Chicago', 'IL', '60601', '2023-09-01', 'Business Administration', 3.62, 42, 'Active'),
(4, '2001-03-10', 'Male', '555-0103', '789 Elm St', 'Naperville', 'IL', '60540', '2022-09-01', 'Psychology', 3.91, 78, 'Active'),
(5, '2002-11-30', 'Female', '555-0104', '321 Maple Dr', 'Aurora', 'IL', '60505', '2023-09-01', 'Engineering', 3.45, 48, 'Active'),
(6, '2001-07-18', 'Male', '555-0105', '654 Pine Rd', 'Joliet', 'IL', '60431', '2022-09-01', 'Mathematics', 3.78, 72, 'Active'),
(8, '2003-02-14', 'Female', '555-0106', '789 Cherry Ln', 'Peoria', 'IL', '61602', '2024-01-15', 'Computer Science', 3.92, 30, 'Active'),
(9, '2002-09-08', 'Male', '555-0107', '234 Birch St', 'Rockford', 'IL', '61101', '2023-09-01', 'Business Administration', 3.55, 45, 'Active'),
(10, '2001-12-25', 'Female', '555-0108', '567 Willow Dr', 'Champaign', 'IL', '61820', '2023-09-01', 'Computer Science', 3.88, 51, 'Active'),
(11, '2003-06-30', 'Male', '555-0109', '890 Cedar Ave', 'Bloomington', 'IL', '61701', '2024-01-15', 'Psychology', 3.40, 27, 'Active'),
(12, '2002-04-12', 'Female', '555-0110', '123 Spruce Rd', 'Evanston', 'IL', '60201', '2023-09-01', 'Engineering', 3.75, 48, 'Active'),
(13, '2001-11-05', 'Male', '555-0111', '456 Poplar Ct', 'Decatur', 'IL', '62521', '2022-09-01', 'Mathematics', 3.65, 66, 'Active'),
(14, '2003-03-18', 'Female', '555-0112', '789 Ash Blvd', 'Quincy', 'IL', '62301', '2024-01-15', 'Business Administration', 3.50, 24, 'Active'),
(15, '2002-08-22', 'Male', '555-0113', '321 Hickory Way', 'Normal', 'IL', '61761', '2023-09-01', 'Computer Science', 3.70, 42, 'Active'),
(16, '2001-10-10', 'Female', '555-0114', '654 Walnut St', 'Carbondale', 'IL', '62901', '2022-09-01', 'Psychology', 3.85, 69, 'Active'),
(17, '2003-01-28', 'Male', '555-0115', '987 Magnolia Dr', 'Urbana', 'IL', '61801', '2024-01-15', 'Engineering', 3.60, 30, 'Active');

-- Insert Instructors (linking all instructors with user accounts)
INSERT INTO Instructors (userId, firstName, lastName, email, department, title, phone, officeLocation) VALUES
(17, 'Robert', 'Anderson', 'r.anderson@university.edu', 'Computer Science', 'Professor', '555-1001', 'CS Building 301'),
(18, 'Sarah', 'Martinez', 's.martinez@university.edu', 'Computer Science', 'Associate Professor', '555-1002', 'CS Building 305'),
(19, 'James', 'Wilson', 'j.wilson@university.edu', 'Business', 'Professor', '555-1003', 'Business Hall 201'),
(20, 'Linda', 'Taylor', 'l.taylor@university.edu', 'Business', 'Assistant Professor', '555-1004', 'Business Hall 210'),
(21, 'Thomas', 'Moore', 't.moore@university.edu', 'Psychology', 'Professor', '555-1005', 'Psychology Center 401'),
(22, 'Patricia', 'Garcia', 'p.garcia@university.edu', 'Engineering', 'Professor', '555-1006', 'Engineering Lab 101'),
(23, 'Christopher', 'Lee', 'c.lee@university.edu', 'Mathematics', 'Associate Professor', '555-1007', 'Math Building 205'),
(24, 'Jennifer', 'White', 'j.white@university.edu', 'Mathematics', 'Assistant Professor', '555-1008', 'Math Building 208');

-- Insert Courses
INSERT INTO Courses (name, code, department, credits, semester, year, description, capacity, currentEnrollment) VALUES
('Introduction to Programming', 'CS101', 'Computer Science', 3, 'Fall', 2025, 'Fundamentals of programming using Python', 30, 3),
('Data Structures', 'CS201', 'Computer Science', 3, 'Fall', 2025, 'Study of fundamental data structures and algorithms', 25, 2),
('Database Systems', 'CS301', 'Computer Science', 3, 'Spring', 2025, 'Design and implementation of database systems', 30, 0),
('Web Development', 'CS250', 'Computer Science', 3, 'Fall', 2025, 'Full-stack web development with modern frameworks', 28, 1),
('Business Management', 'BUS101', 'Business', 3, 'Fall', 2025, 'Principles of business management', 35, 2),
('Marketing Fundamentals', 'BUS201', 'Business', 3, 'Spring', 2025, 'Core concepts in marketing strategy', 30, 0),
('Introduction to Psychology', 'PSY101', 'Psychology', 3, 'Fall', 2025, 'Overview of psychological principles', 40, 1),
('Cognitive Psychology', 'PSY301', 'Psychology', 3, 'Spring', 2025, 'Study of mental processes', 25, 0),
('Engineering Mechanics', 'ENG101', 'Engineering', 4, 'Fall', 2025, 'Statics and dynamics', 30, 1),
('Calculus I', 'MATH101', 'Mathematics', 4, 'Fall', 2025, 'Differential and integral calculus', 35, 1),
('Linear Algebra', 'MATH201', 'Mathematics', 3, 'Spring', 2025, 'Vector spaces and linear transformations', 30, 0),
('Statistics', 'MATH210', 'Mathematics', 3, 'Fall', 2025, 'Probability and statistical inference', 32, 1);

INSERT INTO CourseInstructors (courseId, instructorId, role) VALUES
(1, 1, 'Primary'),
(1, 2, 'TA'),
(2, 1, 'Primary'),
(3, 2, 'Primary'),
(4, 2, 'Primary'),
(4, 1, 'Secondary'),
(5, 3, 'Primary'),
(5, 4, 'Secondary'),
(6, 4, 'Primary'),
(7, 5, 'Primary'),
(8, 5, 'Primary'),
(9, 6, 'Primary'),
(10, 7, 'Primary'),
(10, 8, 'TA'),
(11, 7, 'Primary'),
(12, 8, 'Primary');

INSERT INTO Enrollments (studentId, courseId, semester, year, grade, status) VALUES
-- Student 1 (John Doe - CS)
(1, 1, 'Fall', 2025, 'A', 'Active'),
(1, 2, 'Fall', 2025, 'B+', 'Active'),
(1, 10, 'Fall', 2025, 'A-', 'Active'),
-- Student 2 (Jane Smith - Business)
(2, 5, 'Fall', 2025, 'A-', 'Active'),
(2, 7, 'Fall', 2025, 'B', 'Active'),
(2, 1, 'Fall', 2025, 'B+', 'Active'),
-- Student 3 (Michael Brown - Psychology)
(3, 7, 'Fall', 2025, 'A', 'Active'),
(3, 5, 'Fall', 2025, 'B', 'Active'),
(3, 12, 'Fall', 2025, 'B+', 'Active'),
-- Student 4 (Emily Johnson - Engineering)
(4, 9, 'Fall', 2025, 'B+', 'Active'),
(4, 10, 'Fall', 2025, 'A', 'Active'),
(4, 1, 'Fall', 2025, 'A-', 'Active'),
-- Student 5 (David Williams - Math)
(5, 10, 'Fall', 2025, 'A-', 'Active'),
(5, 12, 'Fall', 2025, 'B+', 'Active'),
(5, 2, 'Fall', 2025, 'B', 'Active'),
-- Student 6 (Sofia Garcia - CS)
(6, 1, 'Fall', 2025, 'A', 'Active'),
(6, 2, 'Fall', 2025, 'A-', 'Active'),
(6, 4, 'Fall', 2025, 'B+', 'Active'),
-- Student 7 (James Rodriguez - Business)
(7, 5, 'Fall', 2025, 'B', 'Active'),
(7, 7, 'Fall', 2025, 'B+', 'Active'),
(7, 12, 'Fall', 2025, 'C+', 'Active'),
-- Student 8 (Ana Martinez - CS)
(8, 1, 'Fall', 2025, 'A-', 'Active'),
(8, 4, 'Fall', 2025, 'A', 'Active'),
(8, 10, 'Fall', 2025, 'B+', 'Active'),
-- Student 9 (Robert Thompson - Psychology)
(9, 7, 'Fall', 2025, 'B+', 'Active'),
(9, 5, 'Fall', 2025, 'A-', 'Active'),
(9, 1, 'Fall', 2025, 'B', 'Active'),
-- Student 10 (Lisa Hernandez - Engineering)
(10, 9, 'Fall', 2025, 'A', 'Active'),
(10, 10, 'Fall', 2025, 'A-', 'Active'),
(10, 2, 'Fall', 2025, 'B+', 'Active'),
-- Student 11 (Kevin Lopez - Math)
(11, 10, 'Fall', 2025, 'B', 'Active'),
(11, 12, 'Fall', 2025, 'B-', 'Active'),
(11, 1, 'Fall', 2025, 'C+', 'Active'),
-- Student 12 (Maria Wilson - Business)
(12, 5, 'Fall', 2025, 'A', 'Active'),
(12, 7, 'Fall', 2025, 'A-', 'Active'),
(12, 9, 'Fall', 2025, 'B+', 'Active'),
-- Student 13 (Daniel Moore - CS)
(13, 1, 'Fall', 2025, 'B+', 'Active'),
(13, 2, 'Fall', 2025, 'B', 'Active'),
(13, 4, 'Fall', 2025, 'A-', 'Active'),
-- Student 14 (Jessica Lee - Psychology)
(14, 7, 'Fall', 2025, 'A', 'Active'),
(14, 5, 'Fall', 2025, 'B+', 'Active'),
(14, 10, 'Fall', 2025, 'A-', 'Active'),
-- Student 15 (Paul White - Engineering)
(15, 9, 'Fall', 2025, 'B+', 'Active'),
(15, 10, 'Fall', 2025, 'B', 'Active'),
(15, 12, 'Fall', 2025, 'A-', 'Active');

-- ============================================
-- VIEWS
-- ============================================

CREATE VIEW StudentDetails AS
SELECT 
  s.id as studentId,
  u.id as userId,
  u.username,
  u.email,
  u.firstName,
  u.lastName,
  s.dateOfBirth,
  s.gender,
  s.phone,
  s.address,
  s.city,
  s.state,
  s.zipCode,
  s.enrollmentDate,
  s.major,
  s.gpa,
  s.totalCredits,
  s.status
FROM Students s
JOIN Users u ON s.userId = u.id;

CREATE VIEW CourseDetails AS
SELECT 
  c.*,
  GROUP_CONCAT(CONCAT(i.firstName, ' ', i.lastName) SEPARATOR ', ') as instructors
FROM Courses c
LEFT JOIN CourseInstructors ci ON c.id = ci.courseId
LEFT JOIN Instructors i ON ci.instructorId = i.id
GROUP BY c.id;

CREATE VIEW EnrollmentDetails AS
SELECT 
  e.id as enrollmentId,
  e.studentId,
  CONCAT(u.firstName, ' ', u.lastName) as studentName,
  u.email as studentEmail,
  e.courseId,
  c.code as courseCode,
  c.name as courseName,
  c.credits,
  e.semester,
  e.year,
  e.grade,
  e.status,
  e.enrolledAt
FROM Enrollments e
JOIN Students s ON e.studentId = s.id
JOIN Users u ON s.userId = u.id
JOIN Courses c ON e.courseId = c.id;

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_enrollment_student_semester ON Enrollments(studentId, semester, year);
CREATE INDEX idx_enrollment_course_semester ON Enrollments(courseId, semester, year);

-- ============================================
-- DATA VERIFICATION
-- ============================================

SHOW TABLES;

SELECT 'Users' as TableName, COUNT(*) as RowCount FROM Users
UNION ALL
SELECT 'Students', COUNT(*) FROM Students
UNION ALL
SELECT 'Courses', COUNT(*) FROM Courses
UNION ALL
SELECT 'Instructors', COUNT(*) FROM Instructors
UNION ALL
SELECT 'Enrollments', COUNT(*) FROM Enrollments
UNION ALL
SELECT 'CourseInstructors', COUNT(*) FROM CourseInstructors
UNION ALL
SELECT 'ActivityLog', COUNT(*) FROM ActivityLog;

SET FOREIGN_KEY_CHECKS = 1;