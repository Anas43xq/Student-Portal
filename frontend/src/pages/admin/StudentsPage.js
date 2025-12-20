import React, { useState, useEffect, useCallback } from 'react';
import { Search, Users } from 'lucide-react';
import { studentsAPI } from '../../services/api';

const MAJORS = [
  'Computer Science',
  'Engineering',
  'Business',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Psychology',
  'Economics',
  'Literature',
  'History',
  'Political Science',
  'Art',
  'Music',
  'Law'
];

const StudentsPage = ({ onViewDetails }) => {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentStudent, setCurrentStudent] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    dateOfBirth: '',
    gender: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    enrollmentDate: '',
    major: '',
    gpa: '',
    totalCredits: '',
    status: 'Active'
  });
  const [formError, setFormError] = useState('');

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      const params = {
        page,
        limit: 10
      };
      
      if (searchTerm) params.search = searchTerm;
      if (filterStatus !== 'All') params.status = filterStatus;

      const data = await studentsAPI.getAll(params);
      setStudents(data.students || []);
      setTotalPages(data.pages || 1);
    } catch (err) {
      console.error('Failed to fetch students:', err);
      setError('Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, filterStatus]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const filteredStudents = students;

  const handleAddStudent = () => {
    setModalMode('add');
    setCurrentStudent(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      dateOfBirth: '',
      gender: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      enrollmentDate: '',
      major: '',
      gpa: '',
      totalCredits: '',
      status: 'Active'
    });
    setFormError('');
    setShowModal(true);
  };

  const handleEditStudent = (student) => {
    setModalMode('edit');
    setCurrentStudent(student);
    setFormData({
      firstName: student.firstName || '',
      lastName: student.lastName || '',
      email: student.email || '',
      dateOfBirth: student.dateOfBirth ? student.dateOfBirth.split('T')[0] : '',
      gender: student.gender || '',
      phone: student.phone || '',
      address: student.address || '',
      city: student.city || '',
      state: student.state || '',
      zipCode: student.zipCode || '',
      enrollmentDate: student.enrollmentDate ? student.enrollmentDate.split('T')[0] : '',
      major: student.major || '',
      gpa: student.gpa || '',
      totalCredits: student.totalCredits || '',
      status: student.status || 'Active'
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

    if (!formData.firstName || !formData.lastName || !formData.email) {
      setFormError('First name, last name, and email are required');
      return;
    }

    try {
      if (modalMode === 'add') {
        await studentsAPI.create(formData);
      } else {
        await studentsAPI.update(currentStudent.id, formData);
      }
      
      setShowModal(false);
      fetchStudents();
    } catch (err) {
      console.error('Failed to save student:', err);
      setFormError(err.message || 'Failed to save student');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormError('');
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Students</h2>
        <button className="btn btn-primary" onClick={handleAddStudent}>
          <Users size={16} className="me-1" />
          Add Student
        </button>
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
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3">
              <select className="form-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
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
            <p className="mt-2">Loading students...</p>
          </div>
        </div>
      ) : error ? (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      ) : (
        <>
          <div className="card">
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Major</th>
                      <th>GPA</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map(student => (
                        <tr key={student.id}>
                          <td>{student.id}</td>
                          <td>{student.firstName} {student.lastName}</td>
                          <td>{student.email}</td>
                          <td>{student.major || 'N/A'}</td>
                          <td><span className="badge bg-info">{student.gpa || 'N/A'}</span></td>
                          <td><span className={`badge bg-${student.status === 'Active' ? 'success' : 'secondary'}`}>{student.status}</span></td>
                          <td>
                            <button className="btn btn-sm btn-outline-primary me-1" onClick={() => onViewDetails(student.id)}>View</button>
                            <button className="btn btn-sm btn-outline-secondary" onClick={() => handleEditStudent(student)}>Edit</button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center text-muted py-4">
                          No students found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-3">
              <nav>
                <ul className="pagination">
                  <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => setPage(page - 1)} disabled={page === 1}>
                      Previous
                    </button>
                  </li>
                  {[...Array(totalPages)].map((_, i) => (
                    <li key={i + 1} className={`page-item ${page === i + 1 ? 'active' : ''}`}>
                      <button className="page-link" onClick={() => setPage(i + 1)}>
                        {i + 1}
                      </button>
                    </li>
                  ))}
                  <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => setPage(page + 1)} disabled={page === totalPages}>
                      Next
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{modalMode === 'add' ? 'Add New Student' : 'Edit Student'}</h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <div className="modal-body">
                {formError && (
                  <div className="alert alert-danger" role="alert">
                    {formError}
                  </div>
                )}
                <form onSubmit={handleSubmit}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">First Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Last Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Email *</label>
                      <input
                        type="email"
                        className="form-control"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Date of Birth</label>
                      <input
                        type="date"
                        className="form-control"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Gender</label>
                      <select
                        className="form-select"
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Phone</label>
                      <input
                        type="tel"
                        className="form-control"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Address</label>
                      <input
                        type="text"
                        className="form-control"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">City</label>
                      <input
                        type="text"
                        className="form-control"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">State</label>
                      <input
                        type="text"
                        className="form-control"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Zip Code</label>
                      <input
                        type="text"
                        className="form-control"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Enrollment Date</label>
                      <input
                        type="date"
                        className="form-control"
                        name="enrollmentDate"
                        value={formData.enrollmentDate}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Major</label>
                      <select
                        className="form-select"
                        name="major"
                        value={formData.major}
                        onChange={handleInputChange}
                      >
                        <option value="">Select Major</option>
                        {MAJORS.map(major => (
                          <option key={major} value={major}>{major}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">GPA</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="4"
                        className="form-control"
                        name="gpa"
                        value={formData.gpa}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Total Credits (Earned)</label>
                      <input
                        type="number"
                        className="form-control"
                        name="totalCredits"
                        value={formData.totalCredits}
                        readOnly
                        disabled
                        title="Total credits are automatically calculated based on completed courses"
                      />
                      <small className="form-text text-muted mt-1">Auto-calculated. Max enrollable: 18 credits/semester</small>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Status</label>
                      <select
                        className="form-select"
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Graduated">Graduated</option>
                        <option value="Suspended">Suspended</option>
                      </select>
                    </div>
                  </div>
                  <div className="modal-footer mt-4">
                    <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {modalMode === 'add' ? 'Add Student' : 'Save Changes'}
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

export default StudentsPage;
