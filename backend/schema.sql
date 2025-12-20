-- ============================================
-- Student Portal Database Schema
-- Database: StudentPortalDB
-- ============================================

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS ActivityLog;
DROP TABLE IF EXISTS QuizSubmissions;
DROP TABLE IF EXISTS Quizzes;
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
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
  enrolledAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (courseId) REFERENCES Courses(id) ON DELETE CASCADE,
  FOREIGN KEY (instructorId) REFERENCES Instructors(id) ON DELETE CASCADE,
  UNIQUE KEY unique_assignment (courseId, instructorId),
  INDEX idx_courseId (courseId),
  INDEX idx_instructorId (instructorId)
);

CREATE TABLE Quizzes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  courseId INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT DEFAULT NULL,
  dueDate DATETIME DEFAULT NULL,
  totalPoints INT NOT NULL DEFAULT 100,
  passingScore INT DEFAULT 60,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (courseId) REFERENCES Courses(id) ON DELETE CASCADE,
  INDEX idx_courseId (courseId),
  INDEX idx_dueDate (dueDate),
  CONSTRAINT chk_total_points CHECK (totalPoints > 0),
  CONSTRAINT chk_passing_score CHECK (passingScore >= 0 AND passingScore <= totalPoints)
);

CREATE TABLE QuizQuestions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  quizId INT NOT NULL,
  questionText TEXT NOT NULL,
  correctAnswer VARCHAR(500) DEFAULT NULL,
  points INT NOT NULL DEFAULT 1,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (quizId) REFERENCES Quizzes(id) ON DELETE CASCADE,
  INDEX idx_quizId (quizId)
);

CREATE TABLE QuizAnswers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  quizId INT NOT NULL,
  studentId INT NOT NULL,
  questionId INT NOT NULL,
  answer VARCHAR(500) DEFAULT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (quizId) REFERENCES Quizzes(id) ON DELETE CASCADE,
  FOREIGN KEY (studentId) REFERENCES Students(id) ON DELETE CASCADE,
  FOREIGN KEY (questionId) REFERENCES QuizQuestions(id) ON DELETE CASCADE,
  INDEX idx_quizId (quizId),
  INDEX idx_studentId (studentId),
  INDEX idx_questionId (questionId)
);

CREATE TABLE QuizSubmissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  quizId INT NOT NULL,
  studentId INT NOT NULL,
  score INT NOT NULL DEFAULT 0,
  submittedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (quizId) REFERENCES Quizzes(id) ON DELETE CASCADE,
  FOREIGN KEY (studentId) REFERENCES Students(id) ON DELETE CASCADE,
  UNIQUE KEY unique_submission (quizId, studentId),
  INDEX idx_quizId (quizId),
  INDEX idx_studentId (studentId),
  INDEX idx_submittedAt (submittedAt)
);

-- ============================================
-- Activity Log Table (Recent Activity for Admin)
-- ============================================
CREATE TABLE ActivityLog (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT DEFAULT NULL,
  username VARCHAR(50) DEFAULT NULL,
  action ENUM('CREATE', 'UPDATE', 'DELETE') NOT NULL,
  entityType ENUM('User', 'Student', 'Course', 'Enrollment', 'Instructor', 'Quiz') NOT NULL,
  entityId INT DEFAULT NULL,
  entityName VARCHAR(255) DEFAULT NULL,
  description TEXT DEFAULT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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

INSERT INTO Quizzes (courseId, title, description, dueDate, totalPoints, passingScore) VALUES
(1, 'Python Basics Quiz', 'Test your understanding of Python fundamentals', '2025-10-15 23:59:59', 100, 60),
(1, 'Functions and Loops', 'Quiz on functions, loops, and control structures', '2025-11-01 23:59:59', 100, 60),
(1, 'OOP Concepts', 'Object-oriented programming in Python', '2025-11-15 23:59:59', 100, 60),
(2, 'Data Structures Midterm', 'Comprehensive test on arrays, linked lists, and trees', '2025-10-20 23:59:59', 150, 90),
(2, 'Algorithms Quiz', 'Sorting and searching algorithms', '2025-11-12 23:59:59', 100, 60),
(4, 'HTML & CSS Quiz', 'Web development fundamentals', '2025-10-25 23:59:59', 100, 60),
(4, 'JavaScript Basics', 'Introduction to JavaScript programming', '2025-11-08 23:59:59', 100, 60),
(5, 'Business Principles Test', 'Core business management concepts', '2025-11-05 23:59:59', 100, 60),
(5, 'Leadership Quiz', 'Management and leadership styles', '2025-11-18 23:59:59', 100, 60),
(7, 'Psychology Basics', 'Introduction to psychological theories', '2025-10-30 23:59:59', 100, 60),
(7, 'Behavioral Psychology', 'Understanding human behavior', '2025-11-20 23:59:59', 100, 60),
(9, 'Statics Quiz', 'Forces and equilibrium', '2025-10-28 23:59:59', 100, 60),
(9, 'Dynamics Test', 'Motion and acceleration', '2025-11-14 23:59:59', 100, 60),
(10, 'Calculus Quiz 1', 'Derivatives and limits', '2025-10-18 23:59:59', 100, 60),
(10, 'Integration Test', 'Definite and indefinite integrals', '2025-11-11 23:59:59', 100, 60),
(12, 'Statistics Midterm', 'Probability distributions and hypothesis testing', '2025-11-10 23:59:59', 150, 90),
(12, 'Probability Quiz', 'Basic probability concepts', '2025-10-22 23:59:59', 100, 60);

INSERT INTO QuizSubmissions (quizId, studentId, score) VALUES
-- CS101 quizzes (quizId 1,2,3)
(1, 1, 85), (2, 1, 78), (3, 1, 92),
(1, 2, 72), (2, 2, 68),
(1, 4, 88), (2, 4, 91), (3, 4, 85),
(1, 6, 95), (2, 6, 89), (3, 6, 93),
(1, 8, 82), (2, 8, 86), (3, 8, 90),
(1, 9, 75), (2, 9, 79),
(1, 11, 65), (2, 11, 58),
(1, 13, 78), (2, 13, 74), (3, 13, 80),
-- CS201 quizzes (quizId 4,5)
(4, 1, 120), (5, 1, 82),
(4, 5, 95), (5, 5, 78),
(4, 6, 128), (5, 6, 88),
(4, 8, 110), (5, 8, 85),
(4, 10, 135), (5, 10, 92),
(4, 13, 105), (5, 13, 75),
-- Web Dev quizzes (quizId 6,7)
(6, 6, 92), (7, 6, 88),
(6, 8, 95), (7, 8, 91),
(6, 13, 78), (7, 13, 82),
-- Business quizzes (quizId 8,9)
(8, 2, 88), (9, 2, 85),
(8, 3, 82), (9, 3, 79),
(8, 7, 75), (9, 7, 78),
(8, 9, 90), (9, 9, 87),
(8, 12, 94), (9, 12, 92),
(8, 14, 86), (9, 14, 83),
-- Psychology quizzes (quizId 10,11)
(10, 2, 80), (11, 2, 85),
(10, 3, 95), (11, 3, 92),
(10, 7, 82), (11, 7, 88),
(10, 9, 78), (11, 9, 81),
(10, 12, 91), (11, 12, 89),
(10, 14, 93), (11, 14, 96),
-- Engineering quizzes (quizId 12,13)
(12, 4, 85), (13, 4, 88),
(12, 10, 92), (13, 10, 95),
(12, 12, 80), (13, 12, 84),
(12, 15, 78), (13, 15, 82),
-- Calculus quizzes (quizId 14,15)
(14, 1, 82), (15, 1, 88),
(14, 4, 95), (15, 4, 92),
(14, 5, 85), (15, 5, 89),
(14, 8, 78), (15, 8, 82),
(14, 10, 90), (15, 10, 87),
(14, 11, 72), (15, 11, 68),
(14, 14, 88), (15, 14, 85),
(14, 15, 75), (15, 15, 79),
-- Statistics quizzes (quizId 16,17)
(16, 3, 125), (17, 3, 85),
(16, 5, 135), (17, 5, 92),
(16, 7, 95), (17, 7, 72),
(16, 11, 88), (17, 11, 65),
(16, 15, 118), (17, 15, 80);

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

-- Insert Sample Quiz Questions
INSERT INTO QuizQuestions (quizId, questionText, correctAnswer, points) VALUES
-- Quiz 1 (Python Basics)
(1, 'What is the output of print(2 + 2 * 2)?', '6', 1),
(1, 'Which of the following is a valid variable name?', 'my_var', 1),
(1, 'What does the input() function do?', 'Reads user input', 1),
-- Quiz 2 (Functions and Loops)
(2, 'How do you define a function in Python?', 'def function_name():', 1),
(2, 'What keyword is used to repeat a block of code?', 'while or for', 1),
(2, 'What is the output of range(5)?', '0, 1, 2, 3, 4', 1),
-- Quiz 4 (Data Structures Midterm)
(4, 'What is the time complexity of binary search?', 'O(log n)', 1),
(4, 'Which data structure uses LIFO?', 'Stack', 1),
(4, 'What is a linked list node?', 'Object containing data and pointer', 1),
-- Quiz 5 (Algorithms)
(5, 'What is the worst-case time complexity of quicksort?', 'O(n^2)', 1),
(5, 'Which sorting algorithm is stable?', 'Merge Sort', 1),
-- Quiz 6 (HTML & CSS)
(6, 'What does HTML stand for?', 'HyperText Markup Language', 1),
(6, 'How do you select an element by class in CSS?', '.classname', 1),
-- Quiz 7 (JavaScript)
(7, 'What is the difference between let and var?', 'Scope and hoisting', 1),
(7, 'How do you create a function in JavaScript?', 'function name() {}', 1),
-- Quiz 8 (Business Principles)
(8, 'What are the four Ps of marketing?', 'Product, Price, Place, Promotion', 1),
(8, 'What does SWOT stand for?', 'Strengths, Weaknesses, Opportunities, Threats', 1),
-- Quiz 9 (Leadership)
(9, 'What is transformational leadership?', 'Leadership that inspires change', 1),
(9, 'What is emotional intelligence?', 'Ability to recognize and manage emotions', 1),
-- Quiz 10 (Psychology Basics)
(10, 'Who developed the theory of classical conditioning?', 'Ivan Pavlov', 1),
(10, 'What is the psychological disorder characterized by excessive fear?', 'Anxiety Disorder', 1),
-- Quiz 11 (Behavioral Psychology)
(11, 'What is positive reinforcement?', 'Adding a desirable consequence after behavior', 1),
(11, 'Who is known for behaviorism?', 'B.F. Skinner', 1),
-- Quiz 12 (Statics)
(12, 'In statics, what does equilibrium mean?', 'Net force is zero', 1),
(12, 'What is the SI unit of force?', 'Newton', 1),
-- Quiz 13 (Dynamics)
(13, 'What is Newtons second law?', 'F = ma', 1),
(13, 'What is acceleration?', 'Change in velocity over time', 1),
-- Quiz 14 (Calculus)
(14, 'What is the derivative of x^2?', '2x', 1),
(14, 'What is the limit as x approaches 2 of (x^2 + 2)?', '6', 1),
-- Quiz 15 (Integration)
(15, 'What is the integral of 2x?', 'x^2 + C', 1),
(15, 'What does the constant C represent in integration?', 'Constant of integration', 1),
-- Quiz 16 (Statistics)
(16, 'What is standard deviation?', 'Measure of spread from mean', 1),
(16, 'In a normal distribution, what percentage falls within 1 standard deviation?', '68%', 1),
-- Quiz 17 (Probability)
(17, 'What is the probability of rolling a 6 on a fair die?', '1/6', 1),
(17, 'What is the sum of all probabilities in a probability distribution?', '1', 1);

-- Insert Sample Quiz Answers (student submissions)
INSERT INTO QuizAnswers (quizId, studentId, questionId, answer) VALUES
-- Student 1 answers to Quiz 1 (Python Basics)
(1, 1, 1, '6'),
(1, 1, 2, 'my_var'),
(1, 1, 3, 'Reads user input'),
-- Student 1 answers to Quiz 2 (Functions and Loops)
(2, 1, 4, 'def function_name():'),
(2, 1, 5, 'while or for'),
(2, 1, 6, '0, 1, 2, 3, 4'),
-- Student 2 answers to Quiz 1
(1, 2, 1, '8'),
(1, 2, 2, 'my-var'),
(1, 2, 3, 'Reads user input');



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

CREATE VIEW QuizResults AS
SELECT 
  qs.id as submissionId,
  qs.quizId,
  q.title as quizTitle,
  q.totalPoints,
  q.passingScore,
  qs.studentId,
  CONCAT(u.firstName, ' ', u.lastName) as studentName,
  u.email as studentEmail,
  qs.score,
  qs.submittedAt,
  q.courseId,
  c.name as courseName,
  c.code as courseCode,
  CASE 
    WHEN qs.score >= q.passingScore THEN 'Pass'
    ELSE 'Fail'
  END as status
FROM QuizSubmissions qs
JOIN Quizzes q ON qs.quizId = q.id
JOIN Students s ON qs.studentId = s.id
JOIN Users u ON s.userId = u.id
JOIN Courses c ON q.courseId = c.id;



CREATE INDEX idx_enrollment_student_semester ON Enrollments(studentId, semester, year);
CREATE INDEX idx_enrollment_course_semester ON Enrollments(courseId, semester, year);
CREATE INDEX idx_quiz_course ON Quizzes(courseId, dueDate);
CREATE INDEX idx_submission_student ON QuizSubmissions(studentId, submittedAt);

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
SELECT 'Quizzes', COUNT(*) FROM Quizzes
UNION ALL
SELECT 'QuizSubmissions', COUNT(*) FROM QuizSubmissions;

SET FOREIGN_KEY_CHECKS = 1;