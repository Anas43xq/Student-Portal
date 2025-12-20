import React, { useState, useEffect } from 'react';
import { Users, BookOpen, Calendar, GraduationCap, CheckCircle, XCircle } from 'lucide-react';
import StatCard from '../../components/common/StatCard.js';
import { useAuth } from '../../context/AuthContext';
import { adminAPI, studentsAPI, enrollmentsAPI, instructorAPI, instructorsAPI, coursesAPI, authAPI } from '../../services/api';

const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCourses: 0,
    activeEnrollments: 0,
    avgGPA: 0,
    studentGPA: 0,
    studentEnrolledCourses: 0,
    totalCredits: 0,
    instructorCourses: 0,
    totalStudentsInCourses: 0,
    activeQuizzes: 0,
    passedStudents: 0,
    failedStudents: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError('');
      
      try {
        if (user.role === 'Admin') {
          const data = await adminAPI.getStats();
          setStats({
            totalStudents: data.totalStudents || 0,
            totalCourses: data.totalCourses || 0,
            activeEnrollments: data.activeEnrollments || 0,
            avgGPA: data.averageGpa || 0
          });
        } else if (user.role === 'Instructor') {

          const data = await instructorAPI.getStats();
          setStats({
            instructorCourses: data.instructorCourses || 0,
            totalStudentsInCourses: data.totalStudentsInCourses || 0,
            activeQuizzes: data.activeQuizzes || 0,
            passedStudents: data.passedStudents || 0,
            failedStudents: data.failedStudents || 0
          });
        } else {

          if (!user.studentId) {
            throw new Error('Student ID not found. Please log in again.');
          }
          
          const studentData = await studentsAPI.getById(user.studentId);
          const enrollmentData = await enrollmentsAPI.getAll();
          const currentSemesterCredits = enrollmentData.enrollments
            ?.filter(e => e.status === 'Active')
            .reduce((sum, e) => sum + (e.courseCredits || 0), 0) || 0;
          
          setStats({
            studentGPA: studentData.gpa || 0,
            studentEnrolledCourses: enrollmentData.enrollments?.filter(e => e.status === 'Active').length || 0,
            totalCredits: currentSemesterCredits
          });
        }
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  if (loading) {
    return (
      <main>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading dashboard...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main>
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </main>
    );
  }

  if (user.role === 'Student') {
    return (
      <main>
        <header>
          <h2 className="mb-4">My Dashboard</h2>
        </header>
        <section>
          <div className="row">
            <StatCard title="My GPA" value={stats.studentGPA} icon={GraduationCap} color="primary" />
            <StatCard title="Enrolled Courses" value={stats.studentEnrolledCourses} icon={BookOpen} color="success" />
            <StatCard title="Current Semester Credits" value={stats.totalCredits} icon={Calendar} color="info" />
          </div>
        </section>

        <section className="row mt-4">
          <div className="col-12">
            <article className="card">
              <header className="card-header bg-primary text-white">
                <h3 className="h5 mb-0">Welcome to Student Portal</h3>
              </header>
              <div className="card-body">
                <p className="lead">Hello {user.firstName}! Here you can:</p>
                <ul className="mb-0">
                  <li>View and manage your profile</li>
                  <li>Browse available courses and view course details</li>
                  <li>Enroll in courses (up to 18 credits for Fall/Spring, 10 credits for Summer)</li>
                  <li>Take quizzes and track your academic progress</li>
                  <li>View your current GPA and earned credits</li>
                  <li>Monitor your enrollment status across all courses</li>
                </ul>
              </div>
            </article>
          </div>
        </section>
      </main>
    );
  }

  if (user.role === 'Instructor') {
    const InstructorStudentsView = () => {
      const [students, setStudents] = React.useState([]);
      const [courses, setCourses] = React.useState([]);
      const [selectedCourse, setSelectedCourse] = React.useState('All');
      const [loadingStudents, setLoadingStudents] = React.useState(false);

      React.useEffect(() => {
        const fetchInstructorData = async () => {
          try {
            try {
              const instData = await instructorsAPI.getAll();
              const currentInstructor = instData.instructors?.find(i => i.userId === user.id);

              if (currentInstructor) {
                const coursesData = await coursesAPI.getAll();
                setCourses(coursesData.courses || []);

                setLoadingStudents(true);
                const params = selectedCourse !== 'All' ? { courseId: selectedCourse } : {};
                const studentsData = await instructorAPI.getStudents(currentInstructor.id, params);
                setStudents(studentsData.students || []);
                setLoadingStudents(false);
              }
            } catch (err) {
              console.error('Failed to fetch instructor data:', err);
              setLoadingStudents(false);
            }
          } catch (err) {
            console.error('Failed to fetch instructor data:', err);
            setLoadingStudents(false);
          }
        };

        fetchInstructorData();
      }, [selectedCourse, user]);

      return (
        <section className="row mt-4">
          <div className="col-12">
            <article className="card">
              <header className="card-header bg-info text-white d-flex justify-content-between align-items-center">
                <h3 className="h5 mb-0">My Students</h3>
                <select 
                  className="form-select form-select-sm w-auto"
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                >
                  <option value="All">All Courses</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.code} - {course.name}
                    </option>
                  ))}
                </select>
              </header>
              <div className="card-body">
                {loadingStudents ? (
                  <div className="text-center py-3">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : students.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Student Name</th>
                          <th>Email</th>
                          <th>Course</th>
                          <th>Major</th>
                          <th>GPA</th>
                          <th>Grade</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((student, idx) => (
                          <tr key={`${student.studentId}-${student.courseId}-${idx}`}>
                            <td><strong>{student.firstName} {student.lastName}</strong></td>
                            <td>{student.email}</td>
                            <td>{student.courseCode}</td>
                            <td>{student.major || 'N/A'}</td>
                            <td>{student.gpa || 'N/A'}</td>
                            <td>
                              {student.grade ? (
                                <span className="badge bg-success">{student.grade}</span>
                              ) : (
                                <span className="text-muted">In Progress</span>
                              )}
                            </td>
                            <td>
                              <span className={`badge bg-${student.enrollmentStatus === 'Active' ? 'primary' : 'secondary'}`}>
                                {student.enrollmentStatus}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted text-center mb-0">No students found for the selected course.</p>
                )}
              </div>
            </article>
          </div>
        </section>
      );
    };

    return (
      <main>
        <header>
          <h2 className="mb-4">Instructor Dashboard</h2>
        </header>
        <section>
          <div className="row">
            <StatCard title="My Courses" value={stats.instructorCourses || 0} icon={BookOpen} color="primary" />
            <StatCard title="Total Students" value={stats.totalStudentsInCourses || 0} icon={Users} color="success" />
            <StatCard title="Active Quizzes" value={stats.activeQuizzes || 0} icon={Calendar} color="warning" />
            <StatCard title="Students Passed" value={stats.passedStudents || 0} icon={CheckCircle} color="success" />
            <StatCard title="Students Failed" value={stats.failedStudents || 0} icon={XCircle} color="danger" />
          </div>
        </section>

        <InstructorStudentsView />

        <section className="row mt-4">
          <div className="col-12">
            <article className="card">
              <header className="card-header bg-success text-white">
                <h3 className="h5 mb-0">Welcome to Instructor Portal</h3>
              </header>
              <div className="card-body">
                <p className="lead">Hello {user.firstName}! Here you can:</p>
                <ul className="mb-0">
                  <li>View and manage your assigned courses</li>
                  <li>Monitor student enrollments and performance</li>
                  <li>Create and manage quizzes for your courses</li>
                  <li>View quiz results and see who passed or failed</li>
                  <li>Track student quiz submissions in real-time</li>
                  <li>Analyze pass/fail statistics across all your quizzes</li>
                  <li>View course statistics and student progress reports</li>
                  <li>Update course materials and provide feedback</li>
                </ul>
              </div>
            </article>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main>
      <header>
        <h2 className="mb-4">Admin Dashboard</h2>
      </header>
      <section>
        <div className="row">
          <StatCard title="Total Students" value={stats.totalStudents} icon={Users} color="primary" />
          <StatCard title="Total Courses" value={stats.totalCourses} icon={BookOpen} color="success" />
          <StatCard title="Active Enrollments" value={stats.activeEnrollments} icon={Calendar} color="warning" />
          <StatCard title="Average GPA" value={stats.avgGPA} icon={GraduationCap} color="info" />
        </div>
      </section>

      <section className="row mt-4">
        <div className="col-12">
          <article className="card">
            <header className="card-header bg-danger text-white">
              <h3 className="h5 mb-0">Welcome to Admin Portal</h3>
            </header>
            <div className="card-body">
              <p className="lead">Hello {user.firstName}! Here you can:</p>
              <ul className="mb-0">
                <li>Manage all students, instructors, and their profiles</li>
                <li>Create, edit, and delete courses and programs</li>
                <li>Oversee course enrollments and assign instructors</li>
                <li>Monitor system-wide academic performance and statistics</li>
                <li>Generate reports and analyze institutional data</li>
                <li>Configure system settings and user permissions</li>
                <li>View recent activities and system logs</li>
              </ul>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
};

export default DashboardPage;
