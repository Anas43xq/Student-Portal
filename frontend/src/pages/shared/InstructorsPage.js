import React, { useState, useEffect } from 'react';
import { Users, Search } from 'lucide-react';
import { instructorsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const InstructorsPage = () => {
  const { user } = useAuth();
  const [instructors, setInstructors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentInstructor, setCurrentInstructor] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    officeLocation: ''
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchInstructors();
  }, []);

  const fetchInstructors = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await instructorsAPI.getAll();
      setInstructors(data.instructors || []);
    } catch (err) {
      console.error('Failed to fetch instructors:', err);
      setError('Failed to load instructors');
    } finally {
      setLoading(false);
    }
  };

  const filteredInstructors = instructors.filter(instructor => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${instructor.firstName} ${instructor.lastName}`.toLowerCase();
    return fullName.includes(searchLower) ||
           instructor.email.toLowerCase().includes(searchLower) ||
           (instructor.department && instructor.department.toLowerCase().includes(searchLower));
  });

  const handleAddInstructor = () => {
    setModalMode('add');
    setCurrentInstructor(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      department: '',
      officeLocation: ''
    });
    setFormError('');
    setShowModal(true);
  };

  const handleEditInstructor = (instructor) => {
    setModalMode('edit');
    setCurrentInstructor(instructor);
    setFormData({
      firstName: instructor.firstName || '',
      lastName: instructor.lastName || '',
      email: instructor.email || '',
      phone: instructor.phone || '',
      department: instructor.department || '',
      officeLocation: instructor.officeLocation || ''
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
        await instructorsAPI.create(formData);
      } else {
        await instructorsAPI.update(currentInstructor.id, formData);
      }

      setShowModal(false);
      fetchInstructors();
    } catch (err) {
      console.error('Failed to save instructor:', err);
      setFormError(err.message || 'Failed to save instructor');
    }
  };

  const handleDeleteInstructor = async (instructorId) => {
    if (!window.confirm('Are you sure you want to delete this instructor?')) {
      return;
    }

    try {
      await instructorsAPI.delete(instructorId);
      fetchInstructors();
    } catch (err) {
      alert(err.message || 'Failed to delete instructor');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormError('');
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Instructors</h2>
        {user.role === 'Admin' && (
          <button className="btn btn-primary" onClick={handleAddInstructor}>
            <Users size={16} className="me-1" />
            Add Instructor
          </button>
        )}
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="input-group">
            <span className="input-group-text"><Search size={18} /></span>
            <input
              type="text"
              className="form-control"
              placeholder="Search instructors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card">
          <div className="card-body text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading instructors...</p>
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
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Department</th>
                    <th>Office</th>
                    {user.role === 'Admin' && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredInstructors.length > 0 ? (
                    filteredInstructors.map(instructor => (
                      <tr key={instructor.id}>
                        <td>{instructor.id}</td>
                        <td>{instructor.firstName} {instructor.lastName}</td>
                        <td>{instructor.email}</td>
                        <td>{instructor.phone || 'N/A'}</td>
                        <td>{instructor.department || 'N/A'}</td>
                        <td>{instructor.officeLocation || 'N/A'}</td>
                        {user.role === 'Admin' && (
                          <td>
                            <button
                              className="btn btn-sm btn-outline-secondary me-1"
                              onClick={() => handleEditInstructor(instructor)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDeleteInstructor(instructor.id)}
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
                        No instructors found
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
                <h5 className="modal-title">{modalMode === 'add' ? 'Add New Instructor' : 'Edit Instructor'}</h5>
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
                    <div className="col-12">
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
                      <label className="form-label">Phone</label>
                      <input
                        type="tel"
                        className="form-control"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Department</label>
                      <input
                        type="text"
                        className="form-control"
                        name="department"
                        value={formData.department}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Office Location</label>
                      <input
                        type="text"
                        className="form-control"
                        name="officeLocation"
                        value={formData.officeLocation}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="modal-footer mt-4">
                    <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {modalMode === 'add' ? 'Add Instructor' : 'Save Changes'}
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

export default InstructorsPage;
