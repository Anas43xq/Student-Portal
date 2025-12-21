import React, { useState, useEffect, useCallback } from 'react';
import { Search, BookOpen, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { coursesAPI, enrollmentsAPI, instructorsAPI } from '../../services/api';

const CREDIT_LIMITS = { Fall: 18, Spring: 18, Summer: 10 };

const CoursesPage = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('All');
  const [filterSemester, setFilterSemester] = useState('All');
  const [currentSemester] = useState('Fall');
  const [studentEnrollments, setStudentEnrollments] = useState([]);
  const [currentCredits, setCurrentCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrolling, setEnrolling] = useState(false);

  const [departments, setDepartments] = useState(['All']);
  const [instructors, setInstructors] = useState([]);
  const semesters = ['All', 'Fall', 'Spring', 'Summer'];

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentCourse, setCurrentCourse] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    credits: '',
    department: '',
    semester: 'Fall',
    year: new Date().getFullYear(),
    capacity: '',
    instructorId: ''
  });
  const [formError, setFormError] = useState('');

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (filterDept !== 'All') params.department = filterDept;
      if (filterSemester !== 'All') params.semester = filterSemester;

      const data = await coursesAPI.getAll(params);
      setCourses(data.courses || []);
      

      const depts = ['All', ...new Set(data.courses?.map(c => c.department) || [])];
      setDepartments(depts);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
      setError('Failed to load courses');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterDept, filterSemester]);

  const fetchInstructors = useCallback(async () => {
    try {
      const data = await instructorsAPI.getAll();
      setInstructors(data.instructors || []);
    } catch (err) {
      console.error('Failed to fetch instructors:', err);
    }
  }, []);

  const fetchStudentEnrollments = useCallback(async () => {
    if (!user.studentId) {
      console.error('No student ID found');
      return;
    }
    
    try {
      const data = await enrollmentsAPI.getAll();
      const activeEnrollments = data.enrollments?.filter(e => e.status === 'Active') || [];
      setStudentEnrollments(activeEnrollments);
      
      const credits = activeEnrollments.reduce((sum, e) => {
        if (e.semester === currentSemester) {
          return sum + (parseInt(e.courseCredits) || 0);
        }
        return sum;
      }, 0);
      setCurrentCredits(credits);
    } catch (err) {
      console.error('Failed to fetch enrollments:', err);
    }
  }, [user.studentId, currentSemester]);

  useEffect(() => {
    fetchCourses();
    fetchInstructors();
    if (user.role === 'Student') {
      fetchStudentEnrollments();
    }
  }, [fetchCourses, fetchInstructors, fetchStudentEnrollments, user]);

  useEffect(() => {
    fetchCourses();
  }, [searchTerm, filterDept, filterSemester]);

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = filterDept === 'All' || course.department === filterDept;
    const matchesSemester = filterSemester === 'All' || course.semester === filterSemester;
    return matchesSearch && matchesDept && matchesSemester;
  });

  const handleRegister = async (course) => {
    if (!user.studentId) {
      alert('Student ID not found. Please log in again.');
      return;
    }

    const creditLimit = CREDIT_LIMITS[currentSemester];
    const newTotalCredits = currentCredits + course.credits;
    
    if (newTotalCredits > creditLimit) {
      alert(`Cannot register! You can only register up to ${creditLimit} credits in ${currentSemester} semester. Current: ${currentCredits}, Course: ${course.credits}`);
      return;
    }

    if (course.currentEnrollment >= course.capacity) {
      alert('This course is full!');
      return;
    }

    const alreadyEnrolled = studentEnrollments.some(e => e.courseId === course.id);
    if (alreadyEnrolled) {
      alert('You are already enrolled in this course!');
      return;
    }

    setEnrolling(true);
    try {
      const enrollmentData = {
        studentId: user.studentId,
        courseId: course.id,
        semester: currentSemester,
        year: course.year || new Date().getFullYear()
      };
      console.log('Enrollment request:', enrollmentData);
      console.log('Current credits:', currentCredits, 'Course credits:', course.credits);
      
      await enrollmentsAPI.create(enrollmentData);
      
      alert(`Successfully registered for ${course.code} - ${course.name}!`);
      await fetchStudentEnrollments();
      await fetchCourses();
    } catch (err) {
      console.error('Enrollment error:', err);
      console.error('Error details:', err.message);
      alert(err.message || 'Failed to enroll in course');
    } finally {
      setEnrolling(false);
    }
  };

  const isEnrolled = (courseId) => {
    return studentEnrollments.some(e => e.courseId === courseId);
  };

  const handleAddCourse = () => {
    setModalMode('add');
    setCurrentCourse(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      credits: '',
      department: '',
      semester: 'Fall',
      capacity: '',
      instructorId: ''
    });
    setFormError('');
    setShowModal(true);
  };

  const handleEditCourse = (course) => {
    setModalMode('edit');
    setCurrentCourse(course);
    

    const firstInstructorId = course.instructors && course.instructors.length > 0 
      ? course.instructors[0].id 
      : '';
    
    setFormData({
      code: course.code || '',
      name: course.name || '',
      description: course.description || '',
      credits: course.credits || '',
      department: course.department || '',
      semester: course.semester || 'Fall',
      year: course.year || new Date().getFullYear(),
      capacity: course.capacity || '',
      instructorId: firstInstructorId
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

    if (!formData.code || !formData.name || !formData.credits || !formData.department || !formData.semester || !formData.year) {
      setFormError('Code, name, credits, department, semester, and year are required');
      return;
    }

    try {
      if (modalMode === 'add') {
        await coursesAPI.create(formData);
      } else {
        await coursesAPI.update(currentCourse.id, formData);
      }
      
      setShowModal(false);
      fetchCourses();
    } catch (err) {
      console.error('Failed to save course:', err);
      setFormError(err.message || 'Failed to save course');
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return;
    }

    try {
      await coursesAPI.delete(courseId);
      alert('Course deleted successfully');
      fetchCourses();
    } catch (err) {
      console.error('Failed to delete course:', err);
      alert(err.message || 'Failed to delete course');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormError('');
  };

  if (loading && courses.length === 0) {
    return (
      <main>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading courses...</p>
        </div>
      </main>
    );
  }

  return (
    <main>
      <header className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Courses</h2>
        {user.role === 'Admin' && (
          <button className="btn btn-primary" onClick={handleAddCourse}>
            <BookOpen size={16} className="me-1" />
            Add Course
          </button>
        )}
      </header>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {user.role === 'Student' && (
        <section className="alert alert-info mb-4">
          <AlertCircle size={20} className="me-2" />
          <strong>Current Semester: {currentSemester}</strong> | 
          Credits: {currentCredits} / {CREDIT_LIMITS[currentSemester]} | 
          Available: {CREDIT_LIMITS[currentSemester] - currentCredits} credits
        </section>
      )}

      <section className="card mb-4">
        <div className="card-body">
          <form className="row g-3">
            <div className="col-md-4">
              <label htmlFor="search-courses" className="visually-hidden">Search courses</label>
              <div className="input-group">
                <span className="input-group-text"><Search size={18} /></span>
                <input
                  id="search-courses"
                  type="text"
                  className="form-control"
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3">
              <label htmlFor="filter-department" className="visually-hidden">Filter by department</label>
              <select 
                id="filter-department"
                className="form-select" 
                value={filterDept} 
                onChange={(e) => setFilterDept(e.target.value)}
              >
                {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
              </select>
            </div>
            <div className="col-md-3">
              <label htmlFor="filter-semester" className="visually-hidden">Filter by semester</label>
              <select 
                id="filter-semester"
                className="form-select" 
                value={filterSemester} 
                onChange={(e) => setFilterSemester(e.target.value)}
              >
                {semesters.map(sem => <option key={sem} value={sem}>{sem}</option>)}
              </select>
            </div>
          </form>
        </div>
      </section>

      <section className="row">
        {filteredCourses.map(course => (
          <article key={course.id} className="col-md-6 col-lg-4 mb-4">
            <div className="card h-100 course-card">
              <div className="card-body">
                <header className="d-flex justify-content-between align-items-start mb-2">
                  <h3 className="card-title h5 mb-0">{course.code}</h3>
                  <span className="badge bg-primary">{course.credits} Credits</span>
                </header>
                <h4 className="card-subtitle mb-3 text-muted h6">{course.name}</h4>
                <dl className="mb-0">
                  <div className="info-item">
                    <dt>Instructors:</dt>
                    <dd>
                      {course.instructors.map(i => `${i.firstName} ${i.lastName}`).join(', ')}
                    </dd>
                  </div>
                  <div className="info-item">
                    <dt>Department:</dt>
                    <dd>{course.department}</dd>
                  </div>
                  <div className="info-item">
                    <dt>Semester:</dt>
                    <dd><span className="badge bg-secondary">{course.semester}</span></dd>
                  </div>
                  <div className="info-item">
                    <dt>Enrollment:</dt>
                    <dd>{course.enrolled}/{course.capacity}</dd>
                  </div>
                </dl>
                <div className="progress mt-2" style={{ height: '6px' }}>
                  <div 
                    className="progress-bar bg-success" 
                    role="progressbar"
                    style={{ width: `${(course.enrolled / course.capacity) * 100}%` }}
                    aria-valuenow={course.enrolled}
                    aria-valuemin="0"
                    aria-valuemax={course.capacity}
                  ></div>
                </div>
              </div>
              <footer className="card-footer bg-transparent">
                {user.role === 'Student' ? (
                  isEnrolled(course.id) ? (
                    <button className="btn btn-sm btn-success" disabled>
                      Enrolled
                    </button>
                  ) : (
                    <button 
                      className="btn btn-sm btn-primary"
                      onClick={() => handleRegister(course)}
                      disabled={enrolling || course.enrolled >= course.capacity}
                    >
                      {course.enrolled >= course.capacity ? 'Full' : 'Register'}
                    </button>
                  )
                ) : user.role === 'Admin' ? (
                  <div className="d-flex gap-2">
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => handleEditCourse(course)}>Edit</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteCourse(course.id)}>Delete</button>
                  </div>
                ) : (
                  <span className="text-muted small">Instructor View</span>
                )}
              </footer>
            </div>
          </article>
        ))}
      </section>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{modalMode === 'add' ? 'Add New Course' : 'Edit Course'}</h5>
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
                      <label className="form-label">Course Code *</label>
                      <input
                        type="text"
                        className="form-control"
                        name="code"
                        value={formData.code}
                        onChange={handleInputChange}
                        required
                        placeholder="e.g., CS101"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Course Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        placeholder="e.g., Introduction to Programming"
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows="3"
                        placeholder="Course description..."
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Credits *</label>
                      <input
                        type="number"
                        className="form-control"
                        name="credits"
                        value={formData.credits}
                        onChange={handleInputChange}
                        required
                        min="1"
                        max="6"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Department *</label>
                      <input
                        type="text"
                        className="form-control"
                        name="department"
                        value={formData.department}
                        onChange={handleInputChange}
                        required
                        placeholder="e.g., Computer Science"
                      />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label">Semester *</label>
                      <select
                        className="form-select"
                        name="semester"
                        value={formData.semester}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="Fall">Fall</option>
                        <option value="Spring">Spring</option>
                        <option value="Summer">Summer</option>
                      </select>
                    </div>
                    <div className="col-md-2">
                      <label className="form-label">Year *</label>
                      <input
                        type="number"
                        className="form-control"
                        name="year"
                        value={formData.year}
                        onChange={handleInputChange}
                        required
                        min="2020"
                        max="2030"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Capacity</label>
                      <input
                        type="number"
                        className="form-control"
                        name="capacity"
                        value={formData.capacity}
                        onChange={handleInputChange}
                        min="1"
                        placeholder="Maximum students"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Instructor</label>
                      <select
                        className="form-select"
                        name="instructorId"
                        value={formData.instructorId}
                        onChange={handleInputChange}
                      >
                        <option value="">Select Instructor</option>
                        {instructors.map(instructor => (
                          <option key={instructor.id} value={instructor.id}>
                            {instructor.firstName} {instructor.lastName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="modal-footer mt-4">
                    <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {modalMode === 'add' ? 'Add Course' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default CoursesPage;
