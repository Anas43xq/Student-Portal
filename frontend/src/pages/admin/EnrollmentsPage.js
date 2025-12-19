import React, { useState, useEffect, useCallback } from 'react';
import { Search, Calendar } from 'lucide-react';
import { enrollmentsAPI, studentsAPI, coursesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const EnrollmentsPage = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentEnrollment, setCurrentEnrollment] = useState(null);
  const [formData, setFormData] = useState({
    studentId: '',
    courseId: '',
    semester: 'Fall',
    year: new Date().getFullYear(),
    grade: '',
    status: 'Active'
  });
  const [formError, setFormError] = useState('');
  
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);

  const fetchStudentsAndCourses = useCallback(async () => {
    try {
      const [studentsData, coursesData] = await Promise.all([
        studentsAPI.getAll({ limit: 1000 }),
        coursesAPI.getAll()
      ]);
      setStudents(studentsData.students || []);
      setCourses(coursesData.courses || []);
    } catch (err) {
      console.error('Failed to fetch students/courses:', err);
    }
  }, []);

  const fetchEnrollments = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      const params = {};
      if (filterStatus !== 'All') params.status = filterStatus;
      

      if (user.role === 'Student') {
        params.studentId = user.studentId || user.id;
      }

      const data = await enrollmentsAPI.getAll(params);
      setEnrollments(data.enrollments || []);
    } catch (err) {
      console.error('Failed to fetch enrollments:', err);
      setError('Failed to load enrollments');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, user]);

  useEffect(() => {
    fetchEnrollments();
    if (user.role === 'Admin') {
      fetchStudentsAndCourses();
    }
  }, [fetchEnrollments, fetchStudentsAndCourses, user, filterStatus]);

  const filteredEnrollments = enrollments.filter(enrollment => {
    if (!searchTerm) return true;
    
    const searchTermLower = searchTerm.toLowerCase();
    const studentName = `${enrollment.firstName} ${enrollment.lastName}`.toLowerCase();
    const courseName = enrollment.courseName?.toLowerCase() || '';
    const courseCode = enrollment.courseCode?.toLowerCase() || '';

    return studentName.includes(searchTermLower) ||
           courseName.includes(searchTermLower) ||
           courseCode.includes(searchTermLower);
  });

  const handleAddEnrollment = () => {
    setModalMode('add');
    setCurrentEnrollment(null);
    setFormData({
      studentId: '',
      courseId: '',
      semester: 'Fall',
      year: new Date().getFullYear(),
      grade: '',
      status: 'Active'
    });
    setFormError('');
    setShowModal(true);
  };

  const handleEditEnrollment = (enrollment) => {
    setModalMode('edit');
    setCurrentEnrollment(enrollment);
    setFormData({
      studentId: enrollment.studentId || '',
      courseId: enrollment.courseId || '',
      semester: enrollment.semester || 'Fall',
      year: enrollment.year || new Date().getFullYear(),
      grade: enrollment.grade || '',
      status: enrollment.status || 'Active'
    });
    setFormError('');
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.studentId || !formData.courseId) {
      setFormError('Student and course are required');
      return;
    }

    try {
      if (modalMode === 'add') {
        await enrollmentsAPI.create(formData);
      } else {
        await enrollmentsAPI.update(currentEnrollment.id, formData);
      }
      
      setShowModal(false);
      fetchEnrollments();
    } catch (err) {
      console.error('Failed to save enrollment:', err);
      setFormError(err.message || 'Failed to save enrollment');
    }
  };

  const handleDeleteEnrollment = async (enrollmentId) => {
    if (!window.confirm('Are you sure you want to delete this enrollment?')) {
      return;
    }

    try {
      await enrollmentsAPI.delete(enrollmentId);
      fetchEnrollments();
    } catch (err) {
      alert(err.message || 'Failed to delete enrollment');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormError('');
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Enrollments</h2>
        {user.role === 'Admin' && (
          <button className="btn btn-primary" onClick={handleAddEnrollment}>
            <Calendar size={16} className="me-1" />
            New Enrollment
          </button>
        )}
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text"><Search size={18} /></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search enrollments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3">
              <select className="form-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card">
          <div className="card-body text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading enrollments...</p>
          </div>
        </div>
      ) : error ? (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      ) : (
        <div className="card">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Student</th>
                    <th>Course</th>
                    <th>Semester</th>
                    <th>Grade</th>
                    <th>Status</th>
                    {user.role === 'Admin' && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredEnrollments.length > 0 ? (
                    filteredEnrollments.map(enrollment => (
                      <tr key={enrollment.id}>
                        <td>{enrollment.id}</td>
                        <td>{enrollment.firstName} {enrollment.lastName}</td>
                        <td><strong>{enrollment.courseCode}</strong> - {enrollment.courseName}</td>
                        <td>{enrollment.semester} {enrollment.year}</td>
                        <td>
                          {enrollment.grade ? 
                            <span className="badge bg-success">{enrollment.grade}</span> : 
                            <span className="text-muted">Pending</span>
                          }
                        </td>
                        <td>
                          <span className={`badge bg-${enrollment.status === 'Active' ? 'primary' : 'secondary'}`}>
                            {enrollment.status}
                          </span>
                        </td>
                        {user.role === 'Admin' && (
                          <td>
                            <button 
                              className="btn btn-sm btn-outline-secondary me-1" 
                              onClick={() => handleEditEnrollment(enrollment)}
                            >
                              Edit
                            </button>
                            <button 
                              className="btn btn-sm btn-outline-danger" 
                              onClick={() => handleDeleteEnrollment(enrollment.id)}
                            >
                              Delete
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={user.role === 'Admin' ? '7' : '6'} className="text-center text-muted py-4">
                        No enrollments found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{modalMode === 'add' ? 'New Enrollment' : 'Edit Enrollment'}</h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <div className="modal-body">
                {formError && (
                  <div className="alert alert-danger" role="alert">
                    {formError}
                  </div>
                )}
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Student *</label>
                    <select
                      className="form-select"
                      name="studentId"
                      value={formData.studentId}
                      onChange={handleInputChange}
                      required
                      disabled={modalMode === 'edit'}
                    >
                      <option value="">Select Student</option>
                      {students.map(student => (
                        <option key={student.id} value={student.id}>
                          {student.firstName} {student.lastName} ({student.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Course *</label>
                    <select
                      className="form-select"
                      name="courseId"
                      value={formData.courseId}
                      onChange={handleInputChange}
                      required
                      disabled={modalMode === 'edit'}
                    >
                      <option value="">Select Course</option>
                      {courses.map(course => (
                        <option key={course.id} value={course.id}>
                          {course.code} - {course.name} ({course.credits} credits)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Semester</label>
                      <select
                        className="form-select"
                        name="semester"
                        value={formData.semester}
                        onChange={handleInputChange}
                      >
                        <option value="Fall">Fall</option>
                        <option value="Spring">Spring</option>
                        <option value="Summer">Summer</option>
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Year</label>
                      <input
                        type="number"
                        className="form-control"
                        name="year"
                        value={formData.year}
                        onChange={handleInputChange}
                        min="2020"
                        max="2030"
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Grade</label>
                    <select
                      className="form-select"
                      name="grade"
                      value={formData.grade}
                      onChange={handleInputChange}
                    >
                      <option value="">Not Graded</option>
                      <option value="A">A</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B">B</option>
                      <option value="B-">B-</option>
                      <option value="C+">C+</option>
                      <option value="C">C</option>
                      <option value="C-">C-</option>
                      <option value="D">D</option>
                      <option value="F">F</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      <option value="Active">Active</option>
                      <option value="Completed">Completed</option>
                      <option value="Dropped">Dropped</option>
                      <option value="Withdrawn">Withdrawn</option>
                    </select>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {modalMode === 'add' ? 'Create Enrollment' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnrollmentsPage;
