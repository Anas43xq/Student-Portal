const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const bodyParser = require("body-parser");
const cors = require("cors");
const session = require("express-session");
require('dotenv').config();

const app = express();

app.use(cors({ 
  origin: process.env.CORS_ORIGIN,
  credentials: true 
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'bxrnvYJaquBOgjPEgjmPHDRrCRjsYDYu-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

db.getConnection((err, connection) => {
  if (err) {
    console.error("Database connection failed:", err);
    return;
  }
  console.log("Connected to MySQL database");
  connection.release();
});

const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized - Please login" });
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.session.userId || req.session.role !== 'Admin') {
    return res.status(403).json({ message: "Forbidden - Admin access required" });
  }
  next();
};

app.post("/register", async (req, res) => {
  try {
    const { username, password, email, role, firstName, lastName } = req.body;

    if (!username || !password || !email || !firstName || !lastName) {
      return res.status(400).json({ message: "All fields are required" });
    }

    db.query(
      "SELECT * FROM Users WHERE username = ? OR email = ?",
      [username, email],
      async (err, results) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: "Database error" });
        }

        if (results.length > 0) {
          return res.status(400).json({ message: "Username or email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

     
        db.query(
          "INSERT INTO Users (username, password, email, role, firstName, lastName) VALUES (?, ?, ?, ?, ?, ?)",
          [username, hashedPassword, email, role || 'Student', firstName, lastName],
          (err, result) => {
            if (err) {
              console.error(err);
              return res.status(500).json({ message: "Failed to create user" });
            }

            if (role === 'Student' || !role) {
              db.query(
                "INSERT INTO Students (userId) VALUES (?)",
                [result.insertId],
                (err) => {
                  if (err) console.error("Failed to create student record:", err);
                }
              );
            }

            res.status(201).json({
              message: "User registered successfully",
              userId: result.insertId
            });
          }
        );
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// ============================================
// AUTHENTICATION ROUTES (All Roles)
// ============================================

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password required" });
    }

    db.query(
      "SELECT * FROM Users WHERE username = ?",
      [username],
      async (err, results) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: "Database error" });
        }

        if (results.length === 0) {
          return res.status(401).json({ message: "Invalid credentials" });
        }

        const user = results[0];

        if (user.isBanned) {
          return res.status(403).json({ 
            message: "Account has been banned", 
            reason: user.banReason || "No reason provided",
            bannedAt: user.bannedAt
          });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
          return res.status(401).json({ message: "Invalid credentials" });
        }

        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.role = user.role;

        if (user.role === 'Student') {
          db.query(
            "SELECT * FROM Students WHERE userId = ?",
            [user.id],
            (err, studentResults) => {
              if (err) {
                console.error('Error fetching student record:', err);
                return res.status(500).json({ message: "Error fetching student data" });
              }

              if (!studentResults || studentResults.length === 0) {
                console.error('No student record found for userId:', user.id);
                return res.status(500).json({ message: "Student record not found. Please contact administrator." });
              }

              console.log('Login successful for student. UserId:', user.id, 'StudentId:', studentResults[0].id);

              res.json({
                message: "Login successful",
                user: {
                  id: user.id,
                  username: user.username,
                  email: user.email,
                  role: user.role,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  studentId: studentResults[0].id
                }
              });
            }
          );
        } else {
          res.json({
            message: "Login successful",
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              role: user.role,
              firstName: user.firstName,
              lastName: user.lastName
            }
          });
        }
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Logout failed" });
    }
    res.clearCookie('sessionId');
    res.json({ message: "Logout successful" });
  });
});

app.get("/api/auth/validate", (req, res) => {
  if (req.session && req.session.userId) {
    res.json({ valid: true, userId: req.session.userId });
  } else {
    res.status(401).json({ valid: false, message: "No active session" });
  }
});

app.get("/api/auth/session", (req, res) => {
  if (req.session.userId) {
    res.json({
      isAuthenticated: true,
      user: {
        id: req.session.userId,
        username: req.session.username,
        role: req.session.role
      }
    });
  } else {
    res.json({ isAuthenticated: false });
  }
});

// ============================================
// ADMIN ROUTES - Student Management
// ============================================

app.get("/api/students", requireAdmin, (req, res) => {
  const { search, status, page = 1, limit = 10 } = req.query;
  
  let query = `
    SELECT s.*, u.firstName, u.lastName, u.email 
    FROM Students s
    JOIN Users u ON s.userId = u.id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    query += ` AND (u.firstName LIKE ? OR u.lastName LIKE ? OR u.email LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (status) {
    query += ` AND s.status = ?`;
    params.push(status);
  }

  db.query(query, params, (err, countResults) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Database error" });
    }

    const total = countResults.length;
    const offset = (page - 1) * limit;

    query += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    db.query(query, params, (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error" });
      }

      res.json({
        students: results,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      });
    });
  });
});

app.get("/api/students/:id", requireAuth, (req, res) => {
  const { id } = req.params;

  console.log('GET /api/students/:id - Session:', { userId: req.session.userId, role: req.session.role }, 'Requested ID:', id);

  if (req.session.role === 'Student') {
    db.query(
      "SELECT id FROM Students WHERE userId = ?",
      [req.session.userId],
      (err, results) => {
        if (err) {
          console.error('Error fetching student for userId:', req.session.userId, err);
          return res.status(500).json({ message: "Database error" });
        }
        
        if (results.length === 0) {
          console.error('No student record found for userId:', req.session.userId);
          return res.status(403).json({ message: "Access denied - No student record found" });
        }
        
        console.log('Student record found. StudentId:', results[0].id, 'Requested ID:', id);
        
        if (results[0].id != id) {
          console.error('Student ID mismatch. Student has ID:', results[0].id, 'but requested:', id);
          return res.status(403).json({ message: "Access denied - Cannot view other students" });
        }
        
        getStudentById(id, res);
      }
    );
  } else {
    getStudentById(id, res);
  }
});

function getStudentById(id, res) {
  db.query(
    `SELECT s.*, u.firstName, u.lastName, u.email, u.username
     FROM Students s
     JOIN Users u ON s.userId = u.id
     WHERE s.id = ?`,
    [id],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error" });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "Student not found" });
      }

      db.query(
        `SELECT e.*, c.name as courseName, c.code as courseCode, c.credits
         FROM Enrollments e
         JOIN Courses c ON e.courseId = c.id
         WHERE e.studentId = ?`,
        [id],
        (err, enrollments) => {
          if (err) console.error(err);

          // Calculate GPA from grades
          const gradePoints = {
            'A': 4.0, 'A-': 3.7,
            'B+': 3.3, 'B': 3.0, 'B-': 2.7,
            'C+': 2.3, 'C': 2.0, 'C-': 1.7,
            'D+': 1.3, 'D': 1.0,
            'F': 0.0
          };

          let totalPoints = 0;
          let totalCredits = 0;
          let earnedCredits = 0;

          enrollments.forEach(enrollment => {
            if (enrollment.grade && gradePoints[enrollment.grade] !== undefined) {
              const credits = parseInt(enrollment.credits) || 0;
              totalPoints += gradePoints[enrollment.grade] * credits;
              totalCredits += credits;
            }
            if (enrollment.status === 'Completed') {
              earnedCredits += parseInt(enrollment.credits) || 0;
            }
          });

          const calculatedGPA = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : null;

          // Update student record with calculated values
          db.query(
            'UPDATE Students SET gpa = ?, totalCredits = ? WHERE id = ?',
            [calculatedGPA, earnedCredits, id],
            (updateErr) => {
              if (updateErr) console.error('Failed to update GPA/credits:', updateErr);

              res.json({
                ...results[0],
                gpa: calculatedGPA,
                totalCredits: earnedCredits,
                enrollments: enrollments || []
              });
            }
          );
        }
      );
    }
  );
}

app.post("/api/students", requireAdmin, async (req, res) => {
  try {
    const { 
      firstName, lastName, email, dateOfBirth, gender, phone, 
      address, city, state, zipCode, enrollmentDate, major, 
      gpa, totalCredits, status 
    } = req.body;

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ message: "First name, last name, and email are required" });
    }

    const username = email.split('@')[0] + Math.floor(Math.random() * 1000);
    const defaultPassword = 'student123';
    
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    db.query(
      "INSERT INTO Users (username, password, email, role, firstName, lastName) VALUES (?, ?, ?, 'Student', ?, ?)",
      [username, hashedPassword, email, firstName, lastName],
      (err, userResult) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: "Failed to create user", error: err.message });
        }

        db.query(
          `INSERT INTO Students 
            (userId, dateOfBirth, gender, phone, address, city, state, zipCode, enrollmentDate, major, gpa, totalCredits, status) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userResult.insertId, 
            dateOfBirth || null, 
            gender || null, 
            phone || null, 
            address || null,
            city || null, 
            state || null, 
            zipCode || null, 
            enrollmentDate || new Date(), 
            major || null, 
            gpa || null, 
            totalCredits || 0, 
            status || 'Active'
          ],
          (err, studentResult) => {
            if (err) {
              console.error(err);
              return res.status(500).json({ message: "Failed to create student", error: err.message });
            }

            logActivity(
              req.session.userId,
              req.session.username,
              'CREATE',
              'Student',
              studentResult.insertId,
              `${firstName} ${lastName}`,
              `Created student: ${email}`
            );

            res.status(201).json({
              message: "Student created successfully",
              studentId: studentResult.insertId,
              username: username,
              defaultPassword: defaultPassword
            });
          }
        );
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

app.put("/api/students/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const { 
    firstName, lastName, email, dateOfBirth, gender, phone, 
    address, city, state, zipCode, enrollmentDate, major, 
    gpa, totalCredits, status 
  } = req.body;

  db.query(
    "SELECT userId FROM Students WHERE id = ?",
    [id],
    (err, results) => {
      if (err || results.length === 0) {
        return res.status(404).json({ message: "Student not found" });
      }

      const userId = results[0].userId;

      db.query(
        "UPDATE Users SET firstName = ?, lastName = ?, email = ? WHERE id = ?",
        [firstName, lastName, email, userId],
        (err) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ message: "Failed to update user" });
          }

          db.query(
            `UPDATE Students SET 
              dateOfBirth = ?, gender = ?, phone = ?, address = ?, 
              city = ?, state = ?, zipCode = ?, enrollmentDate = ?, 
              major = ?, gpa = ?, totalCredits = ?, status = ? 
            WHERE id = ?`,
            [
              dateOfBirth || null, gender || null, phone || null, address || null,
              city || null, state || null, zipCode || null, enrollmentDate || null,
              major || null, gpa || null, totalCredits || null, status || 'Active',
              id
            ],
            (err) => {
              if (err) {
                console.error(err);
                return res.status(500).json({ message: "Failed to update student" });
              }

              res.json({ message: "Student updated successfully" });
            }
          );
        }
      );
    }
  );
});

app.delete("/api/students/:id", requireAdmin, (req, res) => {
  const { id } = req.params;

  db.query(
    "SELECT s.userId, u.firstName, u.lastName, u.email FROM Students s JOIN Users u ON s.userId = u.id WHERE s.id = ?",
    [id],
    (err, results) => {
      if (err || results.length === 0) {
        return res.status(404).json({ message: "Student not found" });
      }

      const userId = results[0].userId;
      const fullName = `${results[0].firstName} ${results[0].lastName}`;

      db.query(
        "DELETE FROM Users WHERE id = ?",
        [userId],
        (err) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ message: "Failed to delete student" });
          }

          logActivity(
            req.session.userId,
            req.session.username,
            'DELETE',
            'Student',
            id,
            fullName,
            `Deleted student: ${results[0].email}`
          );

          res.json({ message: "Student deleted successfully" });
        }
      );
    }
  );
});

// ============================================
// STUDENT ROUTES - Course & Enrollment Management
// ============================================

app.get("/api/courses", requireAuth, (req, res) => {
  const { search, department, semester } = req.query;

  let query = "SELECT c.* FROM Courses c WHERE 1=1";
  const params = [];

  if (search) {
    query += ` AND (c.name LIKE ? OR c.code LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  if (department) {
    query += ` AND c.department = ?`;
    params.push(department);
  }

  if (semester) {
    query += ` AND c.semester = ?`;
    params.push(semester);
  }

  db.query(query, params, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Database error" });
    }

    const courseIds = results.map(c => c.id);
    
    if (courseIds.length === 0) {
      return res.json({ courses: [] });
    }

    db.query(
      `SELECT ci.courseId, i.* 
       FROM CourseInstructors ci
       JOIN Instructors i ON ci.instructorId = i.id
       WHERE ci.courseId IN (?)`,
      [courseIds],
      (err, instructors) => {
        if (err) console.error(err);

        const coursesWithInstructors = results.map(course => ({
          ...course,
          instructors: instructors.filter(i => i.courseId === course.id)
        }));

        res.json({ courses: coursesWithInstructors });
      }
    );
  });
});

app.get("/api/courses/:id", requireAuth, (req, res) => {
  const { id } = req.params;

  db.query(
    "SELECT * FROM Courses WHERE id = ?",
    [id],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error" });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "Course not found" });
      }

      res.json(results[0]);
    }
  );
});

app.post("/api/courses", requireAdmin, (req, res) => {
  const { name, code, department, credits, semester, year, description, capacity } = req.body;

  if (!name || !code || !department || !credits || !semester || !year) {
    return res.status(400).json({ message: "Required fields missing" });
  }

  db.query(
    "INSERT INTO Courses (name, code, department, credits, semester, year, description, capacity) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [name, code, department, credits, semester, year, description, capacity || 30],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to create course" });
      }

      logActivity(
        req.session.userId,
        req.session.username,
        'CREATE',
        'Course',
        result.insertId,
        `${code} - ${name}`,
        `Created course: ${code} (${department})`
      );

      res.status(201).json({
        message: "Course created successfully",
        courseId: result.insertId
      });
    }
  );
});

app.put("/api/courses/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const { name, code, department, credits, semester, year, description, capacity } = req.body;

  db.query(
    "UPDATE Courses SET name = ?, code = ?, department = ?, credits = ?, semester = ?, year = ?, description = ?, capacity = ? WHERE id = ?",
    [name, code, department, credits, semester, year, description, capacity, id],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to update course" });
      }

      logActivity(
        req.session.userId,
        req.session.username,
        'UPDATE',
        'Course',
        id,
        `${code} - ${name}`,
        `Updated course: ${code}`
      );

      res.json({ message: "Course updated successfully" });
    }
  );
});

app.delete("/api/courses/:id", requireAdmin, (req, res) => {
  const { id } = req.params;

  db.query("SELECT code, name FROM Courses WHERE id = ?", [id], (err, results) => {
    if (err || results.length === 0) {
      console.error(err);
      return res.status(500).json({ message: "Course not found" });
    }

    const course = results[0];

    db.query(
      "DELETE FROM Courses WHERE id = ?",
      [id],
      (err) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: "Failed to delete course" });
        }

        logActivity(
          req.session.userId,
          req.session.username,
          'DELETE',
          'Course',
          id,
          `${course.code} - ${course.name}`,
          `Deleted course: ${course.code}`
        );

        res.json({ message: "Course deleted successfully" });
      }
    );
  });
});

app.get("/api/enrollments", requireAuth, (req, res) => {
  const { studentId, courseId, status } = req.query;

  let query = `
    SELECT e.*, 
           s.id as studentId, u.firstName, u.lastName,
           c.name as courseName, c.code as courseCode, c.credits as courseCredits
    FROM Enrollments e
    JOIN Students s ON e.studentId = s.id
    JOIN Users u ON s.userId = u.id
    JOIN Courses c ON e.courseId = c.id
    WHERE 1=1
  `;
  const params = [];

  if (req.session.role === 'Student') {
    db.query(
      "SELECT id FROM Students WHERE userId = ?",
      [req.session.userId],
      (err, results) => {
        if (err || results.length === 0) {
          return res.status(403).json({ message: "Access denied" });
        }

        query += ` AND e.studentId = ?`;
        params.push(results[0].id);

        executeEnrollmentQuery(query, params, status, res);
      }
    );
  } else {
    if (studentId) {
      query += ` AND e.studentId = ?`;
      params.push(studentId);
    }

    if (courseId) {
      query += ` AND e.courseId = ?`;
      params.push(courseId);
    }

    executeEnrollmentQuery(query, params, status, res);
  }
});

function executeEnrollmentQuery(query, params, status, res) {
  if (status && status !== 'All') {
    query += ` AND e.status = ?`;
    params.push(status);
  }

  db.query(query, params, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Database error" });
    }

    res.json({ enrollments: results });
  });
}

app.post("/api/enrollments", requireAuth, (req, res) => {
  const { studentId, courseId, semester, year } = req.body;

  console.log('POST /api/enrollments - Request:', { studentId, courseId, semester, year, userId: req.session.userId });

  if (!studentId || !courseId || !semester || !year) {
    return res.status(400).json({ message: "Required fields missing" });
  }

  db.query(
    "SELECT * FROM Enrollments WHERE studentId = ? AND courseId = ? AND semester = ? AND year = ?",
    [studentId, courseId, semester, year],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error" });
      }

      if (results.length > 0) {
        return res.status(400).json({ message: "Already enrolled in this course" });
      }

      db.query(
        `SELECT SUM(c.credits) as totalCredits
         FROM Enrollments e
         JOIN Courses c ON e.courseId = c.id
         WHERE e.studentId = ? AND e.semester = ? AND e.year = ? AND e.status = 'Active'`,
        [studentId, semester, year],
        (err, creditResults) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ message: "Database error" });
          }

          const currentCredits = creditResults[0].totalCredits || 0;

          db.query(
            "SELECT credits FROM Courses WHERE id = ?",
            [courseId],
            (err, courseResults) => {
              if (err || courseResults.length === 0) {
                return res.status(404).json({ message: "Course not found" });
              }

              const courseCredits = courseResults[0].credits;

              if (currentCredits + courseCredits > 18) {
                return res.status(400).json({ 
                  message: "Credit limit exceeded. Maximum 18 credits per semester.",
                  currentCredits,
                  maxCredits: 18
                });
              }

 
              db.query(
                "INSERT INTO Enrollments (studentId, courseId, semester, year) VALUES (?, ?, ?, ?)",
                [studentId, courseId, semester, year],
                (err, result) => {
                  if (err) {
                    console.error('Enrollment creation error:', err);
                    return res.status(500).json({ message: "Failed to create enrollment" });
                  }

                  console.log('Enrollment created successfully. ID:', result.insertId);

                  res.status(201).json({
                    message: "Enrollment created successfully",
                    enrollmentId: result.insertId
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});

app.put("/api/enrollments/:id", requireAuth, (req, res) => {
  const { id } = req.params;
  const { grade, status } = req.body;

  if (req.session.role !== 'Admin') {
    return res.status(403).json({ message: "Only admins can update enrollments" });
  }

  db.query(
    "UPDATE Enrollments SET grade = ?, status = ? WHERE id = ?",
    [grade, status, id],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to update enrollment" });
      }

      res.json({ message: "Enrollment updated successfully" });
    }
  );
});

app.delete("/api/enrollments/:id", requireAuth, (req, res) => {
  const { id } = req.params;

  if (req.session.role !== 'Admin') {
    return res.status(403).json({ message: "Only admins can delete enrollments" });
  }

  db.query(
    "DELETE FROM Enrollments WHERE id = ?",
    [id],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to delete enrollment" });
      }

      res.json({ message: "Enrollment deleted successfully" });
    }
  );
});

// ============================================
// ADMIN ROUTES - Dashboard & User Management
// ============================================

app.get("/api/admin/stats", requireAdmin, (req, res) => {
  const stats = {};

  db.query("SELECT COUNT(*) as total FROM Students WHERE status = 'Active'", (err, results) => {
    if (err) console.error(err);
    stats.totalStudents = results[0].total;

    db.query("SELECT COUNT(*) as total FROM Courses", (err, results) => {
      if (err) console.error(err);
      stats.totalCourses = results[0].total;

      db.query("SELECT COUNT(*) as total FROM Enrollments WHERE status = 'Active'", (err, results) => {
        if (err) console.error(err);
        stats.activeEnrollments = results[0].total;

        db.query("SELECT AVG(gpa) as avgGpa FROM Students WHERE gpa IS NOT NULL", (err, results) => {
          if (err) console.error(err);
          stats.averageGpa = results[0].avgGpa ? parseFloat(results[0].avgGpa).toFixed(2) : 0;

          res.json(stats);
        });
      });
    });
  });
});

app.get("/api/admin/users", requireAdmin, (req, res) => {
  db.query(
    `SELECT u.id, u.username, u.email, u.role, u.firstName, u.lastName, u.createdAt, 
     u.isBanned, u.bannedAt, u.banReason, 
     CONCAT(b.firstName, ' ', b.lastName) as bannedByName
     FROM Users u
     LEFT JOIN Users b ON u.bannedBy = b.id`,
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error" });
      }

      res.json({ users: results });
    }
  );
});

app.post("/api/admin/users", requireAdmin, async (req, res) => {
  try {
    const { username, password, email, role, firstName, lastName } = req.body;

    if (!username || !password || !email || !role) {
      return res.status(400).json({ message: "Username, password, email, and role are required" });
    }

    db.query(
      "SELECT id FROM Users WHERE username = ? OR email = ?",
      [username, email],
      async (err, results) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: "Database error" });
        }

        if (results.length > 0) {
          return res.status(400).json({ message: "Username or email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        db.query(
          "INSERT INTO Users (username, password, email, role, firstName, lastName) VALUES (?, ?, ?, ?, ?, ?)",
          [username, hashedPassword, email, role, firstName || null, lastName || null],
          (err, result) => {
            if (err) {
              console.error(err);
              return res.status(500).json({ message: "Failed to create user" });
            }

            const fullName = `${firstName || ''} ${lastName || ''}`.trim() || username;
            logActivity(
              req.session.userId,
              req.session.username,
              'CREATE',
              'User',
              result.insertId,
              fullName,
              `Created new ${role} user: ${username}`
            );

            res.status(201).json({
              message: "User created successfully",
              userId: result.insertId
            });
          }
        );
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/admin/users/:id/ban", requireAdmin, (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const bannedBy = req.session.userId;

  if (id == bannedBy) {
    return res.status(400).json({ message: "Cannot ban yourself" });
  }

  db.query(
    "SELECT role FROM Users WHERE id = ?",
    [id],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error" });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      if (results[0].role === 'Admin') {
        return res.status(403).json({ message: "Cannot ban admin users" });
      }

      db.query(
        "UPDATE Users SET isBanned = TRUE, bannedAt = CURRENT_TIMESTAMP, bannedBy = ?, banReason = ? WHERE id = ?",
        [bannedBy, reason || 'No reason provided', id],
        (err) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ message: "Failed to ban user" });
          }

          res.json({ message: "User banned successfully" });
        }
      );
    }
  );
});

app.post("/api/admin/users/:id/unban", requireAdmin, (req, res) => {
  const { id } = req.params;

  db.query(
    "UPDATE Users SET isBanned = FALSE, bannedAt = NULL, bannedBy = NULL, banReason = NULL WHERE id = ?",
    [id],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to unban user" });
      }

      res.json({ message: "User unbanned successfully" });
    }
  );
});

app.delete("/api/admin/users/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const adminId = req.session.userId;

  if (parseInt(id) === adminId) {
    return res.status(400).json({ message: "Cannot delete your own account" });
  }

  db.query("SELECT username, firstName, lastName, role FROM Users WHERE id = ?", [id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Database error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    if (results[0].role === 'Admin') {
      return res.status(403).json({ message: "Cannot delete admin users" });
    }

    const user = results[0];
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username;

    db.query("DELETE FROM Users WHERE id = ?", [id], (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to delete user" });
      }

      logActivity(
        req.session.userId,
        req.session.username,
        'DELETE',
        'User',
        id,
        fullName,
        `Deleted ${user.role} user: ${user.username}`
      );

      res.json({ message: "User deleted successfully" });
    });
  });
});

// Helper function to log activity
function logActivity(userId, username, action, entityType, entityId, entityName, description = null) {
  const query = `
    INSERT INTO ActivityLog (userId, username, action, entityType, entityId, entityName, description)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.query(query, [userId, username, action, entityType, entityId, entityName, description], (err) => {
    if (err) {
      console.error('Error logging activity:', err);
    }
  });
}

// Clean up activities older than 12 hours
function cleanupOldActivities() {
  const query = 'DELETE FROM ActivityLog WHERE timestamp < DATE_SUB(NOW(), INTERVAL 12 HOUR)';
  db.query(query, (err, result) => {
    if (err) {
      console.error('Error cleaning up old activities:', err);
    } else if (result.affectedRows > 0) {
      console.log(`Cleaned up ${result.affectedRows} old activities`);
    }
  });
}

// Run cleanup every hour
setInterval(cleanupOldActivities, 60 * 60 * 1000);

app.get("/api/admin/activities", requireAdmin, (req, res) => {
  const limit = parseInt(req.query.limit) || 50;

  // Clean up old activities first
  cleanupOldActivities();

  const query = `
    SELECT 
      id,
      userId,
      username,
      action,
      entityType,
      entityId,
      entityName,
      description,
      timestamp
    FROM ActivityLog
    WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 12 HOUR)
    ORDER BY timestamp DESC
    LIMIT ?
  `;

  db.query(query, [limit], (err, activities) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Database error" });
    }

    res.json({ activities });
  });
});

// ============================================
// SHARED ROUTES - Instructor Management
// ============================================

app.get("/api/instructors", requireAuth, (req, res) => {
  db.query("SELECT * FROM Instructors", (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json({ instructors: results });
  });
});

app.post("/api/instructors", requireAdmin, (req, res) => {
  const { firstName, lastName, email, phone, department, officeLocation } = req.body;

  if (!firstName || !lastName || !email) {
    return res.status(400).json({ message: "First name, last name, and email are required" });
  }

  db.query(
    "INSERT INTO Instructors (firstName, lastName, email, phone, department, officeLocation) VALUES (?, ?, ?, ?, ?, ?)",
    [firstName, lastName, email, phone || null, department || null, officeLocation || null],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to create instructor" });
      }
      res.status(201).json({ message: "Instructor created successfully", instructorId: result.insertId });
    }
  );
});

app.put("/api/instructors/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, email, phone, department, officeLocation } = req.body;

  db.query(
    "UPDATE Instructors SET firstName = ?, lastName = ?, email = ?, phone = ?, department = ?, officeLocation = ? WHERE id = ?",
    [firstName, lastName, email, phone, department, officeLocation, id],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to update instructor" });
      }
      res.json({ message: "Instructor updated successfully" });
    }
  );
});

// Get instructors for a student's enrolled courses
app.get("/api/students/:id/instructors", requireAuth, (req, res) => {
  const { id } = req.params;

  // Students can only view their own instructors
  if (req.session.role === 'Student') {
    db.query(
      "SELECT id FROM Students WHERE userId = ?",
      [req.session.userId],
      (err, results) => {
        if (err || results.length === 0 || results[0].id != id) {
          return res.status(403).json({ message: "Access denied" });
        }
        fetchStudentInstructors(id, res);
      }
    );
  } else {
    fetchStudentInstructors(id, res);
  }
});

function fetchStudentInstructors(studentId, res) {
  const query = `
    SELECT DISTINCT 
      i.id,
      i.firstName,
      i.lastName,
      i.email,
      i.department,
      i.phone,
      i.officeLocation,
      c.id as courseId,
      c.code as courseCode,
      c.name as courseName
    FROM Enrollments e
    JOIN Courses c ON e.courseId = c.id
    JOIN CourseInstructors ci ON c.id = ci.courseId
    JOIN Instructors i ON ci.instructorId = i.id
    WHERE e.studentId = ? AND e.status = 'Active'
    ORDER BY c.code
  `;

  db.query(query, [studentId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json({ instructors: results });
  });
}

// Get students enrolled in an instructor's courses
app.get("/api/instructors/:id/students", requireAuth, (req, res) => {
  const { id } = req.params;
  const { courseId } = req.query;

  // Instructors can only view their own students
  if (req.session.role === 'Instructor') {
    db.query(
      "SELECT id FROM Instructors WHERE userId = ?",
      [req.session.userId],
      (err, results) => {
        if (err || results.length === 0 || results[0].id != id) {
          return res.status(403).json({ message: "Access denied" });
        }
        fetchInstructorStudents(id, courseId, res);
      }
    );
  } else {
    fetchInstructorStudents(id, courseId, res);
  }
});

function fetchInstructorStudents(instructorId, courseId, res) {
  let query = `
    SELECT DISTINCT 
      s.id as studentId,
      u.firstName,
      u.lastName,
      u.email,
      s.major,
      s.gpa,
      c.id as courseId,
      c.code as courseCode,
      c.name as courseName,
      e.grade,
      e.status as enrollmentStatus
    FROM CourseInstructors ci
    JOIN Courses c ON ci.courseId = c.id
    JOIN Enrollments e ON c.id = e.courseId
    JOIN Students s ON e.studentId = s.id
    JOIN Users u ON s.userId = u.id
    WHERE ci.instructorId = ?
  `;

  const params = [instructorId];

  if (courseId) {
    query += " AND c.id = ?";
    params.push(courseId);
  }

  query += " ORDER BY c.code, u.lastName, u.firstName";

  db.query(query, params, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json({ students: results });
  });
}

app.delete("/api/instructors/:id", requireAdmin, (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM Instructors WHERE id = ?", [id], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to delete instructor" });
    }
    res.json({ message: "Instructor deleted successfully" });
  });
});

// ============================================
// QUIZ ROUTES (Student & Instructor)
// ============================================

app.get("/api/quizzes", requireAuth, (req, res) => {
  const { courseId } = req.query;
  const userId = req.session.userId;
  const userRole = req.session.role;

  if (userRole === 'Admin') {
    let query = "SELECT * FROM Quizzes WHERE 1=1";
    const params = [];

    if (courseId) {
      query += " AND courseId = ?";
      params.push(courseId);
    }

    db.query(query, params, (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error" });
      }
      res.json({ quizzes: results });
    });
  } else if (userRole === 'Instructor') {
    let query = `
      SELECT DISTINCT q.* 
      FROM Quizzes q
      JOIN Courses c ON q.courseId = c.id
      JOIN CourseInstructors ci ON c.id = ci.courseId
      JOIN Instructors i ON ci.instructorId = i.id
      WHERE i.userId = ?
    `;
    const params = [userId];

    if (courseId) {
      query += " AND q.courseId = ?";
      params.push(courseId);
    }

    db.query(query, params, (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error" });
      }
      res.json({ quizzes: results });
    });
  } else if (userRole === 'Student') {
    db.query("SELECT id FROM Students WHERE userId = ?", [userId], (err, studentResult) => {
      if (err || studentResult.length === 0) {
        return res.status(404).json({ message: "Student not found" });
      }

      const studentId = studentResult[0].id;

      let query = `
        SELECT DISTINCT q.* 
        FROM Quizzes q
        JOIN Courses c ON q.courseId = c.id
        JOIN Enrollments e ON c.id = e.courseId
        WHERE e.studentId = ?
      `;
      const params = [studentId];

      if (courseId) {
        query += " AND q.courseId = ?";
        params.push(courseId);
      }

      db.query(query, params, (err2, results) => {
        if (err2) {
          console.error(err2);
          return res.status(500).json({ message: "Database error" });
        }
        res.json({ quizzes: results });
      });
    });
  } else {
    res.json({ quizzes: [] });
  }
});

app.post("/api/quizzes", requireAdmin, (req, res) => {
  const { courseId, title, description, dueDate, totalPoints } = req.body;

  if (!courseId || !title) {
    return res.status(400).json({ message: "Course ID and title are required" });
  }

  db.query(
    "INSERT INTO Quizzes (courseId, title, description, dueDate, totalPoints) VALUES (?, ?, ?, ?, ?)",
    [courseId, title, description || null, dueDate || null, totalPoints || 100],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to create quiz" });
      }
      res.status(201).json({ message: "Quiz created successfully", quizId: result.insertId });
    }
  );
});

app.put("/api/quizzes/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const { title, description, dueDate, totalPoints } = req.body;

  db.query(
    "UPDATE Quizzes SET title = ?, description = ?, dueDate = ?, totalPoints = ? WHERE id = ?",
    [title, description, dueDate, totalPoints, id],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to update quiz" });
      }
      res.json({ message: "Quiz updated successfully" });
    }
  );
});

app.delete("/api/quizzes/:id", requireAdmin, (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM Quizzes WHERE id = ?", [id], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to delete quiz" });
    }
    res.json({ message: "Quiz deleted successfully" });
  });
});

app.get("/api/quizzes/:id/questions", requireAuth, (req, res) => {
  const { id } = req.params;
  const userRole = req.session.role;

  let selectFields = "id, questionText, points";
  if (userRole === 'Admin' || userRole === 'Instructor') {
    selectFields = "id, questionText, correctAnswer, points";
  }

  db.query(
    `SELECT ${selectFields} FROM QuizQuestions WHERE quizId = ? ORDER BY id`,
    [id],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to fetch questions" });
      }
      res.json({ questions: results });
    }
  );
});

app.post("/api/quizzes/:id/questions", requireAuth, (req, res) => {
  const { id } = req.params;
  const { questionText, correctAnswer, points } = req.body;

  if (!questionText || correctAnswer === undefined) {
    return res.status(400).json({ message: "Question text and correct answer are required" });
  }

  db.query(
    "INSERT INTO QuizQuestions (quizId, questionText, correctAnswer, points) VALUES (?, ?, ?, ?)",
    [id, questionText, correctAnswer, points || 10],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to add question" });
      }
      res.json({ message: "Question added successfully", questionId: result.insertId });
    }
  );
});

app.put("/api/quizzes/:quizId/questions/:questionId", requireAuth, (req, res) => {
  const { questionId } = req.params;
  const { questionText, correctAnswer, points } = req.body;

  db.query(
    "UPDATE QuizQuestions SET questionText = ?, correctAnswer = ?, points = ? WHERE id = ?",
    [questionText, correctAnswer, points, questionId],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to update question" });
      }
      res.json({ message: "Question updated successfully" });
    }
  );
});

app.delete("/api/quizzes/:quizId/questions/:questionId", requireAuth, (req, res) => {
  const { questionId } = req.params;

  db.query(
    "DELETE FROM QuizQuestions WHERE id = ?",
    [questionId],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to delete question" });
      }
      res.json({ message: "Question deleted successfully" });
    }
  );
});

app.post("/api/quizzes/:id/grade/:studentId", requireAuth, (req, res) => {
  const { id, studentId } = req.params;

  const gradeQuery = `
    SELECT 
      qa.questionId,
      qa.answer as studentAnswer,
      qq.correctAnswer,
      qq.points,
      CASE WHEN qa.answer = qq.correctAnswer THEN qq.points ELSE 0 END as earnedPoints
    FROM QuizAnswers qa
    JOIN QuizQuestions qq ON qa.questionId = qq.id
    WHERE qa.quizId = ? AND qa.studentId = ?
  `;

  db.query(gradeQuery, [id, studentId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to grade quiz" });
    }

    const totalScore = results.reduce((sum, r) => sum + r.earnedPoints, 0);

    db.query(
      "UPDATE QuizAnswers qa JOIN QuizQuestions qq ON qa.questionId = qq.id SET qa.isCorrect = (qa.answer = qq.correctAnswer) WHERE qa.quizId = ? AND qa.studentId = ?",
      [id, studentId],
      (err2) => {
        if (err2) {
          console.error(err2);
          return res.status(500).json({ message: "Failed to update answers" });
        }

        db.query(
          "UPDATE QuizSubmissions SET score = ? WHERE quizId = ? AND studentId = ?",
          [totalScore, id, studentId],
          (err3) => {
            if (err3) {
              console.error(err3);
              return res.status(500).json({ message: "Failed to update score" });
            }
            res.json({ 
              message: "Quiz graded successfully", 
              score: totalScore,
              totalQuestions: results.length,
              correctAnswers: results.filter(r => r.earnedPoints > 0).length
            });
          }
        );
      }
    );
  });
});

app.put("/api/quiz-submissions/:id/score", requireAuth, (req, res) => {
  const { id } = req.params;
  const { score } = req.body;

  if (score === undefined || score < 0) {
    return res.status(400).json({ message: "Valid score is required" });
  }

  db.query(
    "UPDATE QuizSubmissions SET score = ? WHERE id = ?",
    [score, id],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to update score" });
      }
      res.json({ message: "Score updated successfully" });
    }
  );
});

app.get("/api/instructor/quiz-submissions/:quizId", requireAuth, (req, res) => {
  const { quizId } = req.params;

  const query = `
    SELECT 
      qs.id as submissionId,
      qs.studentId,
      qs.score,
      qs.submittedAt,
      u.firstName,
      u.lastName,
      u.email,
      q.totalPoints,
      q.passingScore,
      (SELECT COUNT(*) FROM QuizAnswers WHERE quizId = qs.quizId AND studentId = qs.studentId) as answersCount,
      (SELECT COUNT(*) FROM QuizAnswers qa JOIN QuizQuestions qq ON qa.questionId = qq.id WHERE qa.quizId = qs.quizId AND qa.studentId = qs.studentId AND qa.answer = qq.correctAnswer) as correctCount,
      CASE 
        WHEN qs.score IS NULL THEN 'Pending'
        WHEN qs.score >= q.passingScore THEN 'Pass'
        ELSE 'Fail'
      END as status
    FROM QuizSubmissions qs
    JOIN Students s ON qs.studentId = s.id
    JOIN Users u ON s.userId = u.id
    JOIN Quizzes q ON qs.quizId = q.id
    WHERE qs.quizId = ?
    ORDER BY qs.submittedAt DESC
  `;

  db.query(query, [quizId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to fetch submissions" });
    }
    res.json({ submissions: results });
  });
});

app.get("/api/instructor/student-answers/:quizId/:studentId", requireAuth, (req, res) => {
  const { quizId, studentId } = req.params;

  const query = `
    SELECT 
      qa.id,
      qa.questionId,
      qa.answer as studentAnswer,
      qa.isCorrect,
      qq.questionText,
      qq.correctAnswer,
      qq.points
    FROM QuizAnswers qa
    JOIN QuizQuestions qq ON qa.questionId = qq.id
    WHERE qa.quizId = ? AND qa.studentId = ?
    ORDER BY qq.id
  `;

  db.query(query, [quizId, studentId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to fetch answers" });
    }
    res.json({ answers: results });
  });
});

app.post("/api/quizzes/:id/submit", requireAuth, (req, res) => {
  const { id } = req.params;
  const { answers } = req.body;
  const userId = req.session.userId;

  db.query("SELECT id FROM Students WHERE userId = ?", [userId], (err, studentResult) => {
    if (err || studentResult.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    const studentId = studentResult[0].id;

    db.query(
      "DELETE FROM QuizAnswers WHERE quizId = ? AND studentId = ?",
      [id, studentId],
      (err2) => {
        if (err2) {
          console.error(err2);
          return res.status(500).json({ message: "Database error" });
        }

        if (!answers || answers.length === 0) {
          return res.status(400).json({ message: "No answers provided" });
        }

        const answerValues = answers.map(a => [id, studentId, a.questionId, a.answer]);

        db.query(
          "INSERT INTO QuizAnswers (quizId, studentId, questionId, answer) VALUES ?",
          [answerValues],
          (err3) => {
            if (err3) {
              console.error(err3);
              return res.status(500).json({ message: "Failed to submit answers" });
            }

            db.query(
              "SELECT * FROM QuizSubmissions WHERE quizId = ? AND studentId = ?",
              [id, studentId],
              (err4, existing) => {
                if (err4) {
                  console.error(err4);
                  return res.status(500).json({ message: "Database error" });
                }

                if (existing.length === 0) {
                  db.query(
                    "INSERT INTO QuizSubmissions (quizId, studentId, score, submittedAt) VALUES (?, ?, NULL, NOW())",
                    [id, studentId],
                    (err5) => {
                      if (err5) {
                        console.error(err5);
                        return res.status(500).json({ message: "Failed to create submission record" });
                      }
                      res.json({ message: "Quiz submitted successfully. Waiting for instructor grading." });
                    }
                  );
                } else {
                  db.query(
                    "UPDATE QuizSubmissions SET submittedAt = NOW(), score = NULL WHERE quizId = ? AND studentId = ?",
                    [id, studentId],
                    (err5) => {
                      if (err5) {
                        console.error(err5);
                      }
                      res.json({ message: "Quiz resubmitted successfully. Waiting for instructor grading." });
                    }
                  );
                }
              }
            );
          }
        );
      }
    );
  });
});

app.get("/api/student/quiz-submissions", requireAuth, (req, res) => {
  const userId = req.session.userId;

  db.query("SELECT id FROM Students WHERE userId = ?", [userId], (err, studentResult) => {
    if (err || studentResult.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    const studentId = studentResult[0].id;

    const query = `
      SELECT 
        qs.id,
        qs.quizId,
        qs.score,
        qs.submittedAt,
        q.title as quizTitle,
        q.totalPoints,
        q.passingScore,
        c.name as courseName,
        c.code as courseCode,
        CASE 
          WHEN qs.score IS NULL THEN 'Pending'
          WHEN qs.score >= q.passingScore THEN 'Pass'
          ELSE 'Fail'
        END as status,
        (SELECT COUNT(*) FROM QuizAnswers WHERE quizId = qs.quizId AND studentId = qs.studentId) as hasAnswers
      FROM QuizSubmissions qs
      JOIN Quizzes q ON qs.quizId = q.id
      JOIN Courses c ON q.courseId = c.id
      WHERE qs.studentId = ?
      ORDER BY qs.submittedAt DESC
    `;

    db.query(query, [studentId], (err2, results) => {
      if (err2) {
        console.error(err2);
        return res.status(500).json({ message: "Failed to fetch submissions" });
      }
      res.json({ submissions: results });
    });
  });
});

app.get("/api/quizzes/:id/my-answers", requireAuth, (req, res) => {
  const { id } = req.params;
  const userId = req.session.userId;

  db.query("SELECT id FROM Students WHERE userId = ?", [userId], (err, studentResult) => {
    if (err || studentResult.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    const studentId = studentResult[0].id;

    db.query(
      "SELECT questionId, answer FROM QuizAnswers WHERE quizId = ? AND studentId = ?",
      [id, studentId],
      (err2, results) => {
        if (err2) {
          console.error(err2);
          return res.status(500).json({ message: "Failed to fetch answers" });
        }
        res.json({ answers: results });
      }
    );
  });
});

app.get("/api/instructor/quiz-results", requireAuth, (req, res) => {
  const { quizId, courseId, instructorId } = req.query;
  const userRole = req.session.role;
  const userId = req.session.userId;
  
  let query = `
    SELECT 
      qs.id as submissionId,
      qs.quizId,
      qs.studentId,
      qs.score,
      qs.submittedAt,
      q.title as quizTitle,
      q.totalPoints,
      q.courseId,
      c.name as courseName,
      c.code as courseCode,
      u.firstName,
      u.lastName,
      u.email,
      CASE 
        WHEN qs.score >= (q.totalPoints * 0.6) THEN 'Pass'
        ELSE 'Fail'
      END as status
    FROM QuizSubmissions qs
    JOIN Quizzes q ON qs.quizId = q.id
    JOIN Students s ON qs.studentId = s.id
    JOIN Users u ON s.userId = u.id
    JOIN Courses c ON q.courseId = c.id
  `;
  
  const params = [];
  
  // Instructors can only see their own courses
  if (userRole === 'Instructor') {
    query += `
      JOIN CourseInstructors ci ON c.id = ci.courseId
      JOIN Instructors i ON ci.instructorId = i.id
      WHERE i.userId = ?
    `;
    params.push(userId);
  } else {
    query += " WHERE 1=1";
  }
  
  // Admin can filter by instructor
  if (userRole === 'Admin' && instructorId) {
    query += ` AND EXISTS (
      SELECT 1 FROM CourseInstructors ci2
      WHERE ci2.courseId = c.id AND ci2.instructorId = ?
    )`;
    params.push(instructorId);
  }
  
  if (quizId) {
    query += " AND qs.quizId = ?";
    params.push(quizId);
  }
  
  if (courseId) {
    query += " AND q.courseId = ?";
    params.push(courseId);
  }
  
  query += " ORDER BY qs.submittedAt DESC";
  
  db.query(query, params, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to fetch quiz results" });
    }
    res.json({ results });
  });
});

// ============================================
// INSTRUCTOR ROUTES - Dashboard & Quiz Results
// ============================================

app.get("/api/instructor/stats", requireAuth, (req, res) => {
  const userId = req.session.userId;
  

  db.query("SELECT id FROM instructors WHERE userId = ?", [userId], (err, instructorResult) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Database error" });
    }
    
    if (instructorResult.length === 0) {
      return res.json({ 
        instructorCourses: 0,
        totalStudentsInCourses: 0,
        activeQuizzes: 0,
        passedStudents: 0,
        failedStudents: 0
      });
    }
    
    const instructorId = instructorResult[0].id;
    

    const coursesQuery = `
      SELECT COUNT(DISTINCT ci.courseId) as count 
      FROM courseinstructors ci
      WHERE ci.instructorId = ?
    `;
    
    db.query(coursesQuery, [instructorId], (err, coursesResult) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error" });
      }
      
      const instructorCourses = coursesResult[0].count;
      

      const studentsQuery = `
        SELECT COUNT(DISTINCT e.studentId) as count 
        FROM enrollments e
        JOIN courseinstructors ci ON e.courseId = ci.courseId
        WHERE ci.instructorId = ? AND e.status = 'Active'
      `;
      
      db.query(studentsQuery, [instructorId], (err, studentsResult) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: "Database error" });
        }
        
        const totalStudentsInCourses = studentsResult[0].count;
        

        const quizzesQuery = `
          SELECT COUNT(*) as count 
          FROM quizzes q
          JOIN courseinstructors ci ON q.courseId = ci.courseId
          WHERE ci.instructorId = ?
        `;
        
        db.query(quizzesQuery, [instructorId], (err, quizzesResult) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ message: "Database error" });
          }
          
          const activeQuizzes = quizzesResult[0].count;
          

          const statsQuery = `
            SELECT 
              SUM(CASE WHEN qs.score IS NOT NULL AND qs.score >= (q.totalPoints * 0.6) THEN 1 ELSE 0 END) as passed,
              SUM(CASE WHEN qs.score IS NOT NULL AND qs.score < (q.totalPoints * 0.6) THEN 1 ELSE 0 END) as failed
            FROM quizsubmissions qs
            JOIN quizzes q ON qs.quizId = q.id
            JOIN courseinstructors ci ON q.courseId = ci.courseId
            WHERE ci.instructorId = ? AND qs.score IS NOT NULL
          `;
          
          db.query(statsQuery, [instructorId], (err, statsResult) => {
            if (err) {
              console.error(err);
              return res.status(500).json({ message: "Database error" });
            }
            
            res.json({
              instructorCourses,
              totalStudentsInCourses,
              activeQuizzes,
              passedStudents: statsResult[0].passed || 0,
              failedStudents: statsResult[0].failed || 0
            });
          });
        });
      });
    });
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
