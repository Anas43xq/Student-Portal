import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';

const UsersTab = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    role: 'Student',
    firstName: '',
    lastName: ''
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    
    try {
      const data = await adminAPI.getUsers();
      setUsers(data.users || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId, username) => {
    const reason = prompt(`Enter reason for banning ${username}:`);
    if (reason === null) return;

    try {
      await adminAPI.banUser(userId, reason);
      fetchUsers();
    } catch (err) {
      console.error('Failed to ban user:', err);
      alert('Failed to ban user: ' + err.message);
    }
  };

  const handleUnbanUser = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to unban ${username}?`)) return;

    try {
      await adminAPI.unbanUser(userId);
      fetchUsers();
    } catch (err) {
      console.error('Failed to unban user:', err);
      alert('Failed to unban user: ' + err.message);
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to delete ${username}? This action cannot be undone.`)) return;

    try {
      await adminAPI.deleteUser(userId);
      fetchUsers();
    } catch (err) {
      console.error('Failed to delete user:', err);
      alert('Failed to delete user: ' + err.message);
    }
  };

  const handleAddUser = () => {
    setFormData({
      username: '',
      password: '',
      email: '',
      role: 'Student',
      firstName: '',
      lastName: ''
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

    if (!formData.username || !formData.password || !formData.email || !formData.role) {
      setFormError('Username, password, email, and role are required');
      return;
    }

    try {
      await adminAPI.createUser(formData);
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      console.error('Failed to create user:', err);
      setFormError(err.message || 'Failed to create user');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormError('');
  };

  return (
    <section className="card">
      <header className="card-header">
        <h3 className="h5 mb-0">User Management</h3>
      </header>
      <div className="card-body">
        <button className="btn btn-primary mb-3" onClick={handleAddUser}>Add New User</button>
        
        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : error ? (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover">
              <caption className="visually-hidden">List of system users</caption>
              <thead>
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Username</th>
                  <th scope="col">Name</th>
                  <th scope="col">Role</th>
                  <th scope="col">Email</th>
                  <th scope="col">Status</th>
                  <th scope="col">Created</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? (
                  users.map(user => (
                    <tr key={user.id} className={user.isBanned ? 'table-danger' : ''}>
                      <td>{user.id}</td>
                      <td>{user.username}</td>
                      <td>{user.firstName} {user.lastName}</td>
                      <td>
                        <span className={`badge bg-${user.role === 'Admin' ? 'danger' : 'primary'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        {user.isBanned ? (
                          <div>
                            <span className="badge bg-danger">Banned</span>
                            <small className="d-block text-muted mt-1" title={user.banReason}>
                              {user.bannedAt && new Date(user.bannedAt).toLocaleDateString()}
                            </small>
                          </div>
                        ) : (
                          <span className="badge bg-success">Active</span>
                        )}
                      </td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td>
                        {user.role !== 'Admin' && (
                          <>
                            {user.isBanned ? (
                              <button 
                                className="btn btn-sm btn-success me-1" 
                                onClick={() => handleUnbanUser(user.id, user.username)}
                              >
                                Unban
                              </button>
                            ) : (
                              <button 
                                className="btn btn-sm btn-warning me-1" 
                                onClick={() => handleBanUser(user.id, user.username)}
                              >
                                Ban
                              </button>
                            )}
                            <button 
                              className="btn btn-sm btn-danger" 
                              onClick={() => handleDeleteUser(user.id, user.username)}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center text-muted py-4">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add New User</h5>
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
                    <label className="form-label">Username *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Password *</label>
                    <input
                      type="password"
                      className="form-control"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      minLength="6"
                    />
                  </div>
                  <div className="mb-3">
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
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">First Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Last Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Role *</label>
                    <select
                      className="form-select"
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="Student">Student</option>
                      <option value="Instructor">Instructor</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Create User
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default UsersTab;
