import React, { useState } from 'react';

const SettingsTab = () => {
  const [academicYears, setAcademicYears] = useState([
    '2023-2024',
    '2024-2025',
    '2025-2026',
    '2026-2027',
    '2027-2028'
  ]);
  const [showYearModal, setShowYearModal] = useState(false);
  const [newYear, setNewYear] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    alert('Settings saved successfully!');
  };

  const handleAddYear = () => {
    setShowYearModal(true);
    setNewYear('');
  };

  const handleSaveYear = () => {
    if (newYear && !academicYears.includes(newYear)) {
      setAcademicYears([...academicYears, newYear].sort());
      setShowYearModal(false);
    } else {
      alert('Please enter a valid and unique academic year');
    }
  };

  return (
    <section className="card">
      <header className="card-header">
        <h3 className="h5 mb-0">System Settings</h3>
      </header>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <fieldset>
            <legend className="visually-hidden">University Information</legend>
            <div className="mb-3">
              <label html For="university-name" className="form-label">University Name</label>
              <input id="university-name" type="text" className="form-control" defaultValue="University Portal" />
            </div>
            <div className="mb-3">
              <label htmlFor="academic-year" className="form-label">Academic Year</label>
              <div className="input-group">
                <select id="academic-year" className="form-select">
                  {academicYears.map((year) => (
                    <option key={year} value={year} selected={year === '2024-2025'}>
                      {year}
                    </option>
                  ))}
                </select>
                <button 
                  type="button" 
                  className="btn btn-outline-primary" 
                  onClick={handleAddYear}
                >
                  + Add Year
                </button>
              </div>
            </div>
            <div className="mb-3">
              <label htmlFor="current-semester" className="form-label">Current Semester</label>
              <select id="current-semester" className="form-select">
                <option value="Fall 2023">Fall 2023</option>
                <option value="Spring 2024">Spring 2024</option>
                <option value="Summer 2024">Summer 2024</option>
                <option value="Fall 2024">Fall 2024</option>
                <option value="Spring 2025" selected>Spring 2025</option>
                <option value="Summer 2025">Summer 2025</option>
                <option value="Fall 2025">Fall 2025</option>
                <option value="Spring 2026">Spring 2026</option>
                <option value="Summer 2026">Summer 2026</option>
              </select>
            </div>
          </fieldset>
          <fieldset>
            <legend className="h6 mb-3">System Preferences</legend>
            <div className="mb-3">
              <div className="form-check">
                <input className="form-check-input" type="checkbox" id="enableRegistration" defaultChecked />
                <label className="form-check-label" htmlFor="enableRegistration">
                  Enable Student Registration
                </label>
              </div>
            </div>
          </fieldset>
          
          <button type="submit" className="btn btn-primary">Save Settings</button>
        </form>
      </div>

      {/* Add Academic Year Modal */}
      {showYearModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add Academic Year</h5>
                <button type="button" className="btn-close" onClick={() => setShowYearModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Academic Year</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., 2028-2029"
                    value={newYear}
                    onChange={(e) => setNewYear(e.target.value)}
                  />
                  <small className="text-muted">Format: YYYY-YYYY</small>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowYearModal(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handleSaveYear}>
                  Add Year
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default SettingsTab;
