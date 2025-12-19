import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'lucide-react';
import { studentsAPI, enrollmentsAPI } from '../../services/api';

const StudentDetailsPage = ({ studentId, onBack }) => {
  const [student, setStudent] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStudentDetails = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {

      const studentData = await studentsAPI.getById(studentId);
      setStudent(studentData);
      

      const enrollmentsData = await enrollmentsAPI.getAll({ studentId });

      setEnrollments(enrollmentsData.enrollments || []);
    } catch (err) {
      console.error('Failed to fetch student details:', err);
      setError('Failed to load student details');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchStudentDetails();
  }, [fetchStudentDetails]);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading student details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <button className="btn btn-outline-secondary mb-3" onClick={onBack}>
          ← Back to Students
        </button>
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  if (!student) return <div>Student not found</div>;

  return (
    <div>
      <button className="btn btn-outline-secondary mb-3" onClick={onBack}>
        ← Back to Students
      </button>

      <div className="row">
        <div className="col-lg-4 mb-4">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Student Information</h5>
            </div>
            <div className="card-body">
              <div className="text-center mb-3">
                <div className="student-avatar mb-3">
                  <User size={64} />
                </div>
                <h4>{student.firstName} {student.lastName}</h4>
                <span className={`badge bg-${student.status === 'Active' ? 'success' : 'secondary'}`}>{student.status}</span>
              </div>
              <hr />
              <div className="info-item">
                <strong>Student ID:</strong>
                <span>{student.id}</span>
              </div>
              <div className="info-item">
                <strong>Email:</strong>
                <span>{student.email}</span>
              </div>
              <div className="info-item">
                <strong>Phone:</strong>
                <span>{student.phone || 'N/A'}</span>
              </div>
              <div className="info-item">
                <strong>Date of Birth:</strong>
                <span>{student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="info-item">
                <strong>Gender:</strong>
                <span>{student.gender || 'N/A'}</span>
              </div>
              <div className="info-item">
                <strong>Major:</strong>
                <span>{student.major || 'N/A'}</span>
              </div>
              <div className="info-item">
                <strong>GPA:</strong>
                <span className="badge bg-info">{student.gpa || '0.00'}</span>
              </div>
              <div className="info-item">
                <strong>Total Credits:</strong>
                <span>{student.totalCredits || '0'}</span>
              </div>
              <div className="info-item">
                <strong>Enrollment Date:</strong>
                <span>{student.enrollmentDate ? new Date(student.enrollmentDate).toLocaleDateString() : 'N/A'}</span>
              </div>
              {student.address && (
                <div className="info-item">
                  <strong>Address:</strong>
                  <span>{student.address}, {student.city}, {student.state} {student.zipCode}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="card mb-4">
            <div className="card-header bg-success text-white">
              <h5 className="mb-0">Academic Performance</h5>
            </div>
            <div className="card-body">
              <div className="row text-center">
                <div className="col-3">
                  <h3 className="text-primary">{student.gpa || '0.00'}</h3>
                  <p className="text-muted mb-0">Current GPA</p>
                </div>
                <div className="col-3">
                  <h3 className="text-success">{student.totalCredits || '0'}</h3>
                  <p className="text-muted mb-0">Total Credits</p>
                </div>
                <div className="col-3">
                  <h3 className="text-info">{enrollments.length}</h3>
                  <p className="text-muted mb-0">Total Courses</p>
                </div>
                <div className="col-3">
                  <h3 className="text-warning">{enrollments.filter(e => e.status === 'Completed').length}</h3>
                  <p className="text-muted mb-0">Completed</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header bg-warning text-dark">
              <h5 className="mb-0">Course Enrollments</h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Course Code</th>
                      <th>Course Name</th>
                      <th>Instructor</th>
                      <th>Grade</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.length > 0 ? (
                      enrollments.map(enrollment => (
                        <tr key={enrollment.id}>
                          <td><strong>{enrollment.courseCode || 'N/A'}</strong></td>
                          <td>{enrollment.courseName || 'N/A'}</td>
                          <td>{enrollment.instructorName || 'N/A'}</td>
                          <td>
                            {enrollment.grade ? 
                              <span className="badge bg-success">{enrollment.grade}</span> : 
                              <span className="text-muted">In Progress</span>
                            }
                          </td>
                          <td><span className={`badge bg-${enrollment.status === 'Active' ? 'primary' : enrollment.status === 'Completed' ? 'success' : 'secondary'}`}>{enrollment.status}</span></td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center text-muted py-4">
                          No enrollments found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDetailsPage;
