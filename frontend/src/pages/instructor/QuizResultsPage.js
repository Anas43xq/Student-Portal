import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Filter, CheckCircle, XCircle, User } from 'lucide-react';
import { instructorAPI, quizzesAPI, coursesAPI, instructorsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const QuizResultsPage = () => {
  const { user } = useAuth();
  const [results, setResults] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [filterQuiz, setFilterQuiz] = useState('All');
  const [filterCourse, setFilterCourse] = useState('All');
  const [filterInstructor, setFilterInstructor] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const resultsData = await instructorAPI.getQuizResults();
      setResults(resultsData.results || []);

      const quizzesData = await quizzesAPI.getAll();
      setQuizzes(quizzesData.quizzes || []);

      const coursesData = await coursesAPI.getAll();
      setCourses(coursesData.courses || []);

      // Fetch instructors for admin users
      if (user.role === 'Admin') {
        try {
          const data = await instructorsAPI.getAll();
          setInstructors(data.instructors || []);
        } catch (err) {
          console.error('Failed to fetch instructors:', err);
        }
      }

    } catch (err) {
      console.error('Failed to fetch quiz results:', err);
      setError('Failed to load quiz results');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilterChange = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterQuiz !== 'All') params.append('quizId', filterQuiz);
      if (filterCourse !== 'All') params.append('courseId', filterCourse);
      if (filterInstructor !== 'All') params.append('instructorId', filterInstructor);
      
      const data = await instructorAPI.getQuizResults(filterQuiz !== 'All' ? filterQuiz : null, filterCourse !== 'All' ? filterCourse : null);
      setResults(data.results || []);
    } catch (err) {
      console.error('Failed to filter results:', err);
      setError('Failed to filter results');
    } finally {
      setLoading(false);
    }
  }, [filterQuiz, filterCourse, filterInstructor]);

  useEffect(() => {
    if (!loading) {
      handleFilterChange();
    }
  }, [handleFilterChange, loading]);


  const filteredResults = results.filter(result => {
    if (filterStatus === 'All') return true;
    return result.status === filterStatus;
  });

  const stats = {
    total: results.length,
    passed: results.filter(r => r.status === 'Pass').length,
    failed: results.filter(r => r.status === 'Fail').length,
    pending: results.filter(r => r.status === 'Pending').length,
    passRate: results.length > 0 ? ((results.filter(r => r.status === 'Pass').length / results.length) * 100).toFixed(1) : 0
  };

  if (user.role !== 'Instructor' && user.role !== 'Admin') {
    return (
      <main>
        <div className="alert alert-warning">
          This page is only accessible to instructors and administrators.
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading quiz results...</p>
        </div>
      </main>
    );
  }

  return (
    <main>
      <header className="d-flex justify-content-between align-items-center mb-4">
        <h2>Quiz Results</h2>
      </header>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      {/* Statistics Cards */}
      <section className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="card text-center">
            <div className="card-body">
              <FileText className="mb-2 text-primary" size={32} />
              <h5 className="card-title">Total Submissions</h5>
              <p className="display-6 mb-0">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card text-center border-success">
            <div className="card-body">
              <CheckCircle className="mb-2 text-success" size={32} />
              <h5 className="card-title">Passed</h5>
              <p className="display-6 mb-0 text-success">{stats.passed}</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card text-center border-danger">
            <div className="card-body">
              <XCircle className="mb-2 text-danger" size={32} />
              <h5 className="card-title">Failed</h5>
              <p className="display-6 mb-0 text-danger">{stats.failed}</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card text-center">
            <div className="card-body">
              <User className="mb-2 text-info" size={32} />
              <h5 className="card-title">Pass Rate</h5>
              <p className="display-6 mb-0">{stats.passRate}%</p>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">
                <Filter size={16} className="me-1" />
                Filter by Course
              </label>
              <select
                className="form-select"
                value={filterCourse}
                onChange={(e) => setFilterCourse(e.target.value)}
              >
                <option value="All">All Courses</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label">
                <Filter size={16} className="me-1" />
                Filter by Quiz
              </label>
              <select
                className="form-select"
                value={filterQuiz}
                onChange={(e) => setFilterQuiz(e.target.value)}
              >
                <option value="All">All Quizzes</option>
                {quizzes.map(quiz => (
                  <option key={quiz.id} value={quiz.id}>
                    {quiz.title}
                  </option>
                ))}
              </select>
            </div>

            {user.role === 'Admin' && (
              <div className="col-md-3">
                <label className="form-label">
                  <Filter size={16} className="me-1" />
                  Filter by Instructor
                </label>
                <select
                  className="form-select"
                  value={filterInstructor}
                  onChange={(e) => setFilterInstructor(e.target.value)}
                >
                  <option value="All">All Instructors</option>
                  {instructors.map(instructor => (
                    <option key={instructor.id} value={instructor.id}>
                      {instructor.firstName} {instructor.lastName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="col-md-3">
              <label className="form-label">
                <Filter size={16} className="me-1" />
                Filter by Status
              </label>
              <select
                className="form-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="Pass">Pass</option>
                <option value="Fail">Fail</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Results Table */}
      <section className="card">
        <div className="card-header">
          <h5 className="mb-0">Quiz Submissions ({filteredResults.length})</h5>
        </div>
        <div className="card-body">
          {filteredResults.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <FileText size={48} className="mb-3 opacity-50" />
              <p>No quiz submissions found</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Email</th>
                    <th>Course</th>
                    <th>Quiz Title</th>
                    <th>Score</th>
                    <th>Total Points</th>
                    <th>Percentage</th>
                    <th>Status</th>
                    <th>Submitted At</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map((result) => {
                    const isPending = result.status === 'Pending';
                    const percentage = !isPending ? ((result.score / result.totalPoints) * 100).toFixed(1) : null;
                    const isPassed = result.status === 'Pass';
                    
                    return (
                      <tr key={result.submissionId}>
                        <td>
                          <strong>{result.firstName} {result.lastName}</strong>
                        </td>
                        <td>{result.email}</td>
                        <td>
                          <span className="badge bg-secondary">
                            {result.courseCode}
                          </span>
                          <br />
                          <small className="text-muted">{result.courseName}</small>
                        </td>
                        <td>{result.quizTitle}</td>
                        <td><strong>{isPending ? '-' : result.score}</strong></td>
                        <td>{result.totalPoints}</td>
                        <td>
                          <strong className={isPending ? 'text-warning' : (isPassed ? 'text-success' : 'text-danger')}>
                            {isPending ? '-' : `${percentage}%`}
                          </strong>
                        </td>
                        <td>
                          {isPending ? (
                            <span className="badge bg-warning">
                              <FileText size={14} className="me-1" />
                              Pending
                            </span>
                          ) : isPassed ? (
                            <span className="badge bg-success">
                              <CheckCircle size={14} className="me-1" />
                              Pass
                            </span>
                          ) : (
                            <span className="badge bg-danger">
                              <XCircle size={14} className="me-1" />
                              Fail
                            </span>
                          )}
                        </td>
                        <td>
                          <small>{new Date(result.submittedAt).toLocaleString()}</small>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Pass/Fail Criteria Note */}
      <section className="alert alert-info mt-4">
        <strong>Note:</strong> Students need to score at least 60% to pass a quiz.
      </section>
    </main>
  );
};

export default QuizResultsPage;
