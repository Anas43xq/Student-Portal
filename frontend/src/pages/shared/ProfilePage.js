import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, Award, BookOpen, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { studentsAPI, enrollmentsAPI } from '../../services/api';

const ProfilePage = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);

        if (user.role === 'Student') {
          if (!user.studentId) {
            setError('Student ID not found');
            setLoading(false);
            return;
          }

          const studentData = await studentsAPI.getById(user.studentId);
          setProfileData(studentData);
          

          const enrollmentData = await enrollmentsAPI.getAll();
          setEnrollments(enrollmentData.enrollments || []);

          // Fetch instructors
          try {
            const data = await studentsAPI.getInstructors(user.studentId);
            setInstructors(data.instructors || []);
          } catch (err) {
            console.error('Failed to fetch instructors:', err);
          }
        } else {
          setProfileData(user);
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfileData();
    }
  }, [user]);

  if (loading) {
    return (
      <main>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading profile...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main>
        <div className="alert alert-danger m-4" role="alert">
          {error}
        </div>
      </main>
    );
  }

  const renderStudentProfile = () => (
    <div className="row">
      <section className="col-lg-4 mb-4">
        <article className="card">
          <header className="card-header bg-primary text-white">
            <h3 className="h5 mb-0">Personal Information</h3>
          </header>
          <div className="card-body">
            <div className="text-center mb-3">
              <div className="profile-avatar mb-3 d-flex justify-content-center">
                <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{width: '80px', height: '80px'}}>
                  <User size={40} />
                </div>
              </div>
              <h4>{profileData.firstName || user.firstName} {profileData.lastName || user.lastName}</h4>
              <span className={`badge bg-${profileData.status === 'Active' ? 'success' : 'secondary'}`}>
                {profileData.status || 'Active'}
              </span>
            </div>
            <hr />
            <dl className="mb-0">
              <div className="info-item mb-3">
                <dt className="text-muted small">Student ID:</dt>
                <dd className="mb-0"><strong>{profileData.id}</strong></dd>
              </div>
              <div className="info-item mb-3">
                <dt className="text-muted small">Username:</dt>
                <dd className="mb-0">{profileData.username || user.username}</dd>
              </div>
              <div className="info-item mb-3">
                <dt className="text-muted small"><Mail size={14} className="me-1" />Email:</dt>
                <dd className="mb-0">{profileData.email || user.email}</dd>
              </div>
              <div className="info-item mb-3">
                <dt className="text-muted small"><Phone size={14} className="me-1" />Phone:</dt>
                <dd className="mb-0">{profileData.phone || 'Not provided'}</dd>
              </div>
              <div className="info-item mb-3">
                <dt className="text-muted small"><BookOpen size={14} className="me-1" />Major:</dt>
                <dd className="mb-0">{profileData.major || 'Not declared'}</dd>
              </div>
              <div className="info-item mb-3">
                <dt className="text-muted small"><Award size={14} className="me-1" />GPA:</dt>
                <dd className="mb-0"><span className="badge bg-info fs-6">{profileData.gpa || '0.00'}</span></dd>
              </div>
              <div className="info-item mb-3">
                <dt className="text-muted small"><Calendar size={14} className="me-1" />Enrollment Date:</dt>
                <dd className="mb-0">{profileData.enrollmentDate ? new Date(profileData.enrollmentDate).toLocaleDateString() : 'N/A'}</dd>
              </div>
              <div className="info-item mb-3">
                <dt className="text-muted small">Total Credits:</dt>
                <dd className="mb-0"><strong className="text-success">{profileData.totalCredits || 0}</strong></dd>
              </div>
              <div className="info-item">
                <dt className="text-muted small">Completed Credits:</dt>
                <dd className="mb-0"><strong className="text-info">{profileData.completedCredits || 0}</strong></dd>
              </div>
            </dl>
          </div>
        </article>
      </section>

      <section className="col-lg-8">
        <article className="card mb-4">
          <header className="card-header bg-success text-white">
            <h3 className="h5 mb-0">Academic Performance</h3>
          </header>
          <div className="card-body">
            <div className="row text-center">
              <div className="col-md-3 mb-3 mb-md-0">
                <h4 className="text-primary mb-1">{profileData.gpa || '0.00'}</h4>
                <p className="text-muted mb-0 small">Current GPA</p>
              </div>
              <div className="col-md-3 mb-3 mb-md-0">
                <h4 className="text-success mb-1">{profileData.totalCredits || 0}</h4>
                <p className="text-muted mb-0 small">Total Credits</p>
              </div>
              <div className="col-md-3 mb-3 mb-md-0">
                <h4 className="text-info mb-1">{profileData.completedCredits || 0}</h4>
                <p className="text-muted mb-0 small">Completed</p>
              </div>
              <div className="col-md-3">
                <h4 className="text-warning mb-1">{enrollments.length}</h4>
                <p className="text-muted mb-0 small">Total Courses</p>
              </div>
            </div>
          </div>
        </article>

        <article className="card">
          <header className="card-header bg-warning text-dark">
            <h3 className="h5 mb-0">My Course Enrollments</h3>
          </header>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th scope="col">Course Code</th>
                    <th scope="col">Course Name</th>
                    <th scope="col">Credits</th>
                    <th scope="col">Grade</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.length > 0 ? enrollments.map(enrollment => (
                    <tr key={enrollment.id}>
                      <td><strong>{enrollment.courseCode}</strong></td>
                      <td>{enrollment.courseName}</td>
                      <td>{enrollment.courseCredits || 'N/A'}</td>
                      <td>
                        {enrollment.grade ? 
                          <span className="badge bg-success">{enrollment.grade}</span> : 
                          <span className="text-muted">In Progress</span>
                        }
                      </td>
                      <td>
                        <span className={`badge bg-${enrollment.status === 'Active' ? 'primary' : enrollment.status === 'Completed' ? 'success' : 'secondary'}`}>
                          {enrollment.status}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" className="text-center text-muted py-4">
                        No enrollments yet. Visit the Courses page to enroll in courses.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </article>

        {instructors.length > 0 && (
          <article className="card mt-4">
            <header className="card-header bg-info text-white">
              <h3 className="h5 mb-0">My Instructors</h3>
            </header>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th scope="col">Instructor</th>
                      <th scope="col">Course</th>
                      <th scope="col">Department</th>
                      <th scope="col">Email</th>
                      <th scope="col">Office</th>
                    </tr>
                  </thead>
                  <tbody>
                    {instructors.map((instructor, index) => (
                      <tr key={`${instructor.id}-${instructor.courseId}-${index}`}>
                        <td><strong>{instructor.firstName} {instructor.lastName}</strong></td>
                        <td>{instructor.courseCode} - {instructor.courseName}</td>
                        <td>{instructor.department || 'N/A'}</td>
                        <td>{instructor.email}</td>
                        <td>{instructor.officeLocation || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </article>
        )}
      </section>
    </div>
  );

  const renderAdminInstructorProfile = () => (
    <div className="row justify-content-center">
      <div className="col-lg-8">
        <article className="card">
          <header className={`card-header ${user.role === 'Admin' ? 'bg-danger' : 'bg-success'} text-white`}>
            <h3 className="h5 mb-0 d-flex align-items-center">
              <Shield size={20} className="me-2" />
              {user.role} Profile
            </h3>
          </header>
          <div className="card-body">
            <div className="text-center mb-4">
              <div className={`profile-avatar mb-3 d-inline-flex ${user.role === 'Admin' ? 'bg-danger' : 'bg-success'} text-white rounded-circle align-items-center justify-content-center`} style={{width: '100px', height: '100px'}}>
                <User size={50} />
              </div>
              <h3>{user.firstName} {user.lastName}</h3>
              <span className={`badge ${user.role === 'Admin' ? 'bg-danger' : 'bg-success'} fs-6`}>
                {user.role}
              </span>
            </div>
            
            <hr />
            
            <div className="row">
              <div className="col-md-6 mb-3">
                <dt className="text-muted small mb-1"><User size={14} className="me-1" />User ID:</dt>
                <dd><strong>{user.id}</strong></dd>
              </div>
              <div className="col-md-6 mb-3">
                <dt className="text-muted small mb-1"><User size={14} className="me-1" />Username:</dt>
                <dd>{user.username}</dd>
              </div>
              <div className="col-md-6 mb-3">
                <dt className="text-muted small mb-1"><Mail size={14} className="me-1" />Email:</dt>
                <dd>{user.email}</dd>
              </div>
              <div className="col-md-6 mb-3">
                <dt className="text-muted small mb-1"><Shield size={14} className="me-1" />Role:</dt>
                <dd><span className={`badge ${user.role === 'Admin' ? 'bg-danger' : 'bg-success'}`}>{user.role}</span></dd>
              </div>
            </div>

            <hr />

            <div className="alert alert-info mb-0">
              <h6 className="alert-heading">Profile Information</h6>
              <p className="mb-0 small">
                {user.role === 'Admin' 
                  ? 'As an administrator, you have full access to manage the student portal system, including students, courses, instructors, and enrollments.'
                  : 'As an instructor, you can manage your courses and monitor student progress in your assigned classes.'}
              </p>
            </div>
          </div>
        </article>
      </div>
    </div>
  );

  return (
    <main>
      <header className="mb-4">
        <h2>My Profile</h2>
      </header>

      {user.role === 'Student' ? renderStudentProfile() : renderAdminInstructorProfile()}
    </main>
  );
};

export default ProfilePage;
