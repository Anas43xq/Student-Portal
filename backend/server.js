const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require('path');
const envPath = path.join(__dirname, 'Configurations.env');
require('dotenv').config({ path: envPath });

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'https://anas43xq.github.io',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production';

const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || '',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

db.getConnection((err, connection) => {
  if (err) {
    console.error("Database connection failed:", err);
    return;
  }
  connection.release();
});

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('JWT verification failed:', error.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

const requireAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(403).json({ message: "Admin access required" });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role !== 'Admin') {
      return res.status(403).json({ message: "Admin access required" });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error('JWT verification failed:', error.message);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      studentId: user.studentId
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
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

              const userData = {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                firstName: user.firstName,
                lastName: user.lastName,
                studentId: studentResults[0].id
              };

              const token = generateToken(userData);

              res.json({
                message: "Login successful",
                token: token,
                user: userData
              });
            }
          );
        } else {
          const userData = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName
          };

          const token = generateToken(userData);

          res.json({
            message: "Login successful",
            token: token,
            user: userData
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
  res.json({ message: "Logout successful" });
});

app.get("/api/auth/validate", requireAuth, (req, res) => {
  res.json({ valid: true, user: req.user });
});

app.get("/api/auth/session", requireAuth, (req, res) => {
  res.json({
    isAuthenticated: true,
    user: req.user
  });
});

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

  if (req.user.role === 'Student') {
    db.query(
      "SELECT id FROM Students WHERE userId = ?",
      [req.user.id],
      (err, results) => {
        if (err) {
          console.error('Error fetching student for userId:', req.user.id, err);
          return res.status(500).json({ message: "Database error" });
        }

        if (results.length === 0) {
          return res.status(403).json({ message: "Access denied - No student record found" });
        }

        if (results[0].id != id) {
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
              req.user.id,
              req.user.username,
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
            req.user.id,
            req.user.username,
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
        req.user.id,
        req.user.username,
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
        req.user.id,
        req.user.username,
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
          req.user.id,
          req.user.username,
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

  if (req.user.role === 'Student') {
    db.query(
      "SELECT id FROM Students WHERE userId = ?",
      [req.user.id],
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

                  db.query(
                    "UPDATE Courses SET currentEnrollment = currentEnrollment + 1 WHERE id = ?",
                    [courseId],
                    (updateErr) => {
                      if (updateErr) {
                        console.error('Failed to update course enrollment count:', updateErr);
                      }

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
    }
  );
});

app.put("/api/enrollments/:id", requireAuth, (req, res) => {
  const { id } = req.params;
  const { grade, status } = req.body;

  if (req.user.role !== 'Admin') {
    return res.status(403).json({ message: "Only admins can update enrollments" });
  }

  db.query(
    "SELECT status, studentId, courseId FROM Enrollments WHERE id = ?",
    [id],
    (err, currentResult) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error" });
      }

      if (currentResult.length === 0) {
        return res.status(404).json({ message: "Enrollment not found" });
      }

      const currentStatus = currentResult[0].status;
      const studentId = currentResult[0].studentId;
      const courseId = currentResult[0].courseId;

      db.query(
        "UPDATE Enrollments SET grade = ?, status = ? WHERE id = ?",
        [grade, status, id],
        (err) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ message: "Failed to update enrollment" });
          }

          if (status === 'Completed' && currentStatus !== 'Completed') {
            db.query(
              "SELECT credits FROM Courses WHERE id = ?",
              [courseId],
              (err, courseResult) => {
                if (err) {
                  console.error('Failed to get course credits:', err);
                  return res.json({ message: "Enrollment updated successfully" });
                }

                if (courseResult.length > 0) {
                  const credits = courseResult[0].credits;
                  db.query(
                    "UPDATE Students SET totalCredits = totalCredits + ? WHERE id = ?",
                    [credits, studentId],
                    (updateErr) => {
                      if (updateErr) {
                        console.error('Failed to update student credits:', updateErr);
                      }
                      res.json({ message: "Enrollment updated successfully" });
                    }
                  );
                } else {
                  res.json({ message: "Enrollment updated successfully" });
                }
              }
            );
          } else {
            res.json({ message: "Enrollment updated successfully" });
          }
        }
      );
    }
  );
});

app.delete("/api/enrollments/:id", requireAuth, (req, res) => {
  const { id } = req.params;

  if (req.user.role !== 'Admin') {
    return res.status(403).json({ message: "Only admins can delete enrollments" });
  }

  db.query(
    "SELECT courseId FROM Enrollments WHERE id = ?",
    [id],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error" });
      }

      if (result.length === 0) {
        return res.status(404).json({ message: "Enrollment not found" });
      }

      const courseId = result[0].courseId;

      db.query(
        "DELETE FROM Enrollments WHERE id = ?",
        [id],
        (err) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ message: "Failed to delete enrollment" });
          }

          db.query(
            "UPDATE Courses SET currentEnrollment = GREATEST(currentEnrollment - 1, 0) WHERE id = ?",
            [courseId],
            (updateErr) => {
              if (updateErr) {
                console.error('Failed to update course enrollment count:', updateErr);
              }

              res.json({ message: "Enrollment deleted successfully" });
            }
          );
        }
      );
    }
  );
});

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
              req.user.id,
              req.user.username,
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
  const bannedBy = req.user.id;

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
  const adminId = req.user.id;

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
        req.user.id,
        req.user.username,
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

setInterval(cleanupOldActivities, 60 * 60 * 1000);

app.get("/api/admin/activities", requireAdmin, (req, res) => {
  const limit = parseInt(req.query.limit) || 50;

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

app.get("/api/students/:id/instructors", requireAuth, (req, res) => {
  const { id } = req.params;

  if (req.user.role === 'Student') {
    db.query(
      "SELECT id FROM Students WHERE userId = ?",
      [req.user.id],
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

app.get("/api/instructors/:id/students", requireAuth, (req, res) => {
  const { id } = req.params;
  const { courseId } = req.query;

  if (req.user.role === 'Instructor') {
    db.query(
      "SELECT id FROM Instructors WHERE userId = ?",
      [req.user.id],
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

app.get("/api/quizzes", requireAuth, (req, res) => {
  const { courseId } = req.query;
  const userId = req.user.id;
  const userRole = req.user.role;

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

// Quiz endpoints
app.post("/api/quizzes", requireAuth, (req, res) => {
  const { courseId, title, description, dueDate, totalPoints } = req.body;

  if (!courseId || !title || !totalPoints) {
    return res.status(400).json({ message: "Course, title, and totalPoints are required" });
  }

  db.query(
    "INSERT INTO Quizzes (courseId, title, description, dueDate, totalPoints) VALUES (?, ?, ?, ?, ?)",
    [courseId, title, description || null, dueDate || null, totalPoints],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to create quiz", error: err.message });
      }

      res.status(201).json({
        message: "Quiz created successfully",
        quizId: result.insertId
      });
    }
  );
});

app.put("/api/quizzes/:id", requireAuth, (req, res) => {
  const { id } = req.params;
  const { title, description, dueDate, totalPoints } = req.body;

  db.query(
    "UPDATE Quizzes SET title = ?, description = ?, dueDate = ?, totalPoints = ? WHERE id = ?",
    [title, description, dueDate, totalPoints, id],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to update quiz", error: err.message });
      }

      res.json({ message: "Quiz updated successfully" });
    }
  );
});

app.delete("/api/quizzes/:id", requireAuth, (req, res) => {
  const { id } = req.params;

  db.query(
    "DELETE FROM Quizzes WHERE id = ?",
    [id],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to delete quiz" });
      }

      res.json({ message: "Quiz deleted successfully" });
    }
  );
});

// Quiz Questions endpoints
app.get("/api/quizzes/:id/questions", requireAuth, (req, res) => {
  const { id } = req.params;

  db.query(
    "SELECT * FROM QuizQuestions WHERE quizId = ? ORDER BY id",
    [id],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error" });
      }

      res.json({ questions: results || [] });
    }
  );
});

app.post("/api/quizzes/:id/questions", requireAuth, (req, res) => {
  const { id } = req.params;
  const { questionText, correctAnswer, points } = req.body;

  if (!questionText) {
    return res.status(400).json({ message: "Question text is required" });
  }

  db.query(
    "INSERT INTO QuizQuestions (quizId, questionText, correctAnswer, points) VALUES (?, ?, ?, ?)",
    [id, questionText, correctAnswer, points || 1],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to add question", error: err.message });
      }

      res.status(201).json({
        message: "Question added successfully",
        questionId: result.insertId
      });
    }
  );
});

app.put("/api/quizzes/:id/questions/:questionId", requireAuth, (req, res) => {
  const { id, questionId } = req.params;
  const { questionText, correctAnswer, points } = req.body;

  db.query(
    "UPDATE QuizQuestions SET questionText = ?, correctAnswer = ?, points = ? WHERE id = ? AND quizId = ?",
    [questionText, correctAnswer, points, questionId, id],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to update question" });
      }

      res.json({ message: "Question updated successfully" });
    }
  );
});

app.delete("/api/quizzes/:id/questions/:questionId", requireAuth, (req, res) => {
  const { id, questionId } = req.params;

  db.query(
    "DELETE FROM QuizQuestions WHERE id = ? AND quizId = ?",
    [questionId, id],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to delete question" });
      }

      res.json({ message: "Question deleted successfully" });
    }
  );
});

// Quiz Submissions endpoints
app.get("/api/instructor/quiz-submissions/:id", requireAuth, (req, res) => {
  const { id } = req.params;

  db.query(
    `SELECT qs.*, s.id as studentId, u.firstName, u.lastName, u.email, q.totalPoints
     FROM QuizSubmissions qs
     JOIN Students s ON qs.studentId = s.id
     JOIN Users u ON s.userId = u.id
     JOIN Quizzes q ON qs.quizId = q.id
     WHERE qs.quizId = ?
     ORDER BY qs.submittedAt DESC`,
    [id],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error" });
      }

      const submissions = results.map(sub => ({
        submissionId: sub.id,
        quizId: sub.quizId,
        studentId: sub.studentId,
        firstName: sub.firstName,
        lastName: sub.lastName,
        email: sub.email,
        score: sub.score,
        totalPoints: sub.totalPoints,
        status: sub.score !== null ? (sub.score >= sub.totalPoints * 0.6 ? 'Pass' : 'Fail') : 'Pending',
        submittedAt: sub.submittedAt,
        answersCount: 0,
        correctCount: 0
      }));

      res.json({ submissions });
    }
  );
});

app.get("/api/instructor/student-answers/:quizId/:studentId", requireAuth, (req, res) => {
  const { quizId, studentId } = req.params;

  db.query(
    `SELECT qa.*, qq.questionText, qq.correctAnswer, qq.points
     FROM QuizAnswers qa
     JOIN QuizQuestions qq ON qa.questionId = qq.id
     WHERE qa.quizId = ? AND qa.studentId = ?
     ORDER BY qq.id`,
    [quizId, studentId],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error" });
      }

      const answers = results.map(ans => ({
        answerId: ans.id,
        questionId: ans.questionId,
        questionText: ans.questionText,
        studentAnswer: ans.answer,
        correctAnswer: ans.correctAnswer,
        points: ans.points,
        isCorrect: ans.answer === ans.correctAnswer ? 1 : 0
      }));

      res.json({ answers });
    }
  );
});

app.post("/api/quizzes/:id/submit", requireAuth, (req, res) => {
  const { id } = req.params;
  const { answers } = req.body;

  db.query(
    "SELECT id FROM Students WHERE userId = ?",
    [req.user.id],
    (err, studentResults) => {
      if (err || studentResults.length === 0) {
        return res.status(404).json({ message: "Student not found" });
      }

      const studentId = studentResults[0].id;

      // Check if already submitted
      db.query(
        "SELECT id FROM QuizSubmissions WHERE quizId = ? AND studentId = ?",
        [id, studentId],
        (err, existingSubmissions) => {
          const isResubmission = existingSubmissions && existingSubmissions.length > 0;
          const submissionId = isResubmission ? existingSubmissions[0].id : null;

          // Calculate score
          let correctCount = 0;
          const answerPromises = answers.map(answer => {
            return new Promise((resolve) => {
              db.query(
                "SELECT correctAnswer FROM QuizQuestions WHERE id = ?",
                [answer.questionId],
                (err, results) => {
                  if (results && results.length > 0 && answer.answer === results[0].correctAnswer) {
                    correctCount++;
                  }
                  resolve();
                }
              );
            });
          });

          Promise.all(answerPromises).then(() => {
            const score = Math.round((correctCount / answers.length) * 100);

            if (isResubmission) {
              // Update existing submission
              db.query(
                "UPDATE QuizSubmissions SET score = ?, submittedAt = NOW() WHERE id = ?",
                [score, submissionId],
                (err) => {
                  if (err) {
                    console.error(err);
                    return res.status(500).json({ message: "Failed to update submission" });
                  }

                  // Delete old answers
                  db.query(
                    "DELETE FROM QuizAnswers WHERE quizId = ? AND studentId = ?",
                    [id, studentId],
                    (deleteErr) => {
                      if (deleteErr) console.error(deleteErr);

                      // Insert new answers
                      const insertPromises = answers.map(answer => {
                        return new Promise((resolve) => {
                          db.query(
                            "INSERT INTO QuizAnswers (quizId, studentId, questionId, answer) VALUES (?, ?, ?, ?)",
                            [id, studentId, answer.questionId, answer.answer],
                            (insertErr) => {
                              if (insertErr) console.error(insertErr);
                              resolve();
                            }
                          );
                        });
                      });

                      Promise.all(insertPromises).then(() => {
                        res.json({
                          message: "Quiz submitted successfully",
                          score,
                          correctAnswers: correctCount,
                          totalQuestions: answers.length
                        });
                      });
                    }
                  );
                }
              );
            } else {
              // Create new submission
              db.query(
                "INSERT INTO QuizSubmissions (quizId, studentId, score, submittedAt) VALUES (?, ?, ?, NOW())",
                [id, studentId, score],
                (err, result) => {
                  if (err) {
                    console.error(err);
                    return res.status(500).json({ message: "Failed to submit quiz" });
                  }

                  // Insert answers
                  const insertPromises = answers.map(answer => {
                    return new Promise((resolve) => {
                      db.query(
                        "INSERT INTO QuizAnswers (quizId, studentId, questionId, answer) VALUES (?, ?, ?, ?)",
                        [id, studentId, answer.questionId, answer.answer],
                        (insertErr) => {
                          if (insertErr) console.error(insertErr);
                          resolve();
                        }
                      );
                    });
                  });

                  Promise.all(insertPromises).then(() => {
                    res.status(201).json({
                      message: "Quiz submitted successfully",
                      submissionId: result.insertId,
                      score,
                      correctAnswers: correctCount,
                      totalQuestions: answers.length
                    });
                  });
                }
              );
            }
          });
        }
      );
    }
  );
});

app.get("/api/quizzes/:id/my-answers", requireAuth, (req, res) => {
  const { id } = req.params;

  db.query(
    "SELECT id FROM Students WHERE userId = ?",
    [req.user.id],
    (err, studentResults) => {
      if (err || studentResults.length === 0) {
        return res.status(404).json({ message: "Student not found" });
      }

      const studentId = studentResults[0].id;

      db.query(
        `SELECT qa.* FROM QuizAnswers qa
         WHERE qa.quizId = ? AND qa.studentId = ?
         ORDER BY qa.questionId`,
        [id, studentId],
        (err, results) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ message: "Database error" });
          }

          res.json({ answers: results || [] });
        }
      );
    }
  );
});

app.post("/api/quizzes/:id/grade/:studentId", requireAuth, (req, res) => {
  const { id, studentId } = req.params;

  db.query(
    `SELECT qa.*, qq.correctAnswer FROM QuizAnswers qa
     JOIN QuizQuestions qq ON qa.questionId = qq.id
     WHERE qa.quizId = ? AND qa.studentId = ?`,
    [id, studentId],
    (err, answers) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error" });
      }

      const totalQuestions = answers.length;
      let correctAnswers = 0;

      answers.forEach(answer => {
        if (answer.answer === answer.correctAnswer) {
          correctAnswers++;
        }
      });

      const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

      db.query(
        "UPDATE QuizSubmissions SET score = ? WHERE quizId = ? AND studentId = ?",
        [score, id, studentId],
        (updateErr) => {
          if (updateErr) {
            console.error(updateErr);
            return res.status(500).json({ message: "Failed to save grade" });
          }

          res.json({
            message: "Quiz graded successfully",
            score,
            correctAnswers,
            totalQuestions
          });
        }
      );
    }
  );
});

app.put("/api/quiz-submissions/:id/score", requireAuth, (req, res) => {
  const { id } = req.params;
  const { score } = req.body;

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

app.get("/api/student/quiz-submissions", requireAuth, (req, res) => {
  db.query(
    "SELECT id FROM Students WHERE userId = ?",
    [req.user.id],
    (err, studentResults) => {
      if (err || studentResults.length === 0) {
        return res.status(404).json({ message: "Student not found" });
      }

      const studentId = studentResults[0].id;

      db.query(
        `SELECT qs.*, q.title, q.courseId, c.name as courseName
         FROM QuizSubmissions qs
         JOIN Quizzes q ON qs.quizId = q.id
         JOIN Courses c ON q.courseId = c.id
         WHERE qs.studentId = ?
         ORDER BY qs.submittedAt DESC`,
        [studentId],
        (err, results) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ message: "Database error" });
          }

          const submissions = results.map(sub => ({
            quizId: sub.quizId,
            studentId: sub.studentId,
            score: sub.score,
            status: sub.score !== null ? (sub.score >= 60 ? 'Pass' : 'Fail') : 'Pending',
            submittedAt: sub.submittedAt,
            title: sub.title,
            courseName: sub.courseName
          }));

          res.json({ submissions });
        }
      );
    }
  );
});

app.get("/api/instructor/quiz-results", requireAuth, (req, res) => {
  const userId = req.user.id;
  const { quizId, courseId } = req.query;

  db.query(
    "SELECT id FROM Instructors WHERE userId = ?",
    [userId],
    (err, instructorResults) => {
      if (err || instructorResults.length === 0) {
        return res.status(400).json({ message: "Instructor record not found" });
      }

      const instructorId = instructorResults[0].id;

      let query = `
        SELECT qs.*, q.title, q.courseId, c.name as courseName, s.id as studentId, u.firstName, u.lastName
        FROM QuizSubmissions qs
        JOIN Quizzes q ON qs.quizId = q.id
        JOIN Courses c ON q.courseId = c.id
        JOIN Students s ON qs.studentId = s.id
        JOIN Users u ON s.userId = u.id
        JOIN CourseInstructors ci ON c.id = ci.courseId
        WHERE ci.instructorId = ?
      `;
      const params = [instructorId];

      if (quizId) {
        query += ` AND q.id = ?`;
        params.push(quizId);
      }

      if (courseId) {
        query += ` AND c.id = ?`;
        params.push(courseId);
      }

      query += ` ORDER BY qs.submittedAt DESC`;

      db.query(query, params, (err, results) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: "Database error" });
        }

        res.json({ results: results || [] });
      });
    }
  );
});

app.get("/api/instructor/stats", requireAuth, (req, res) => {
  const userId = req.user.id;

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
