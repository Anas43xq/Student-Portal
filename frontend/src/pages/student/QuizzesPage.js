import React, { useState, useEffect } from 'react';
import { FileText, Search } from 'lucide-react';
import { quizzesAPI, coursesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const QuizzesPage = () => {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourse, setFilterCourse] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [formData, setFormData] = useState({
    courseId: '',
    title: '',
    description: '',
    dueDate: '',
    totalPoints: 100
  });
  const [formError, setFormError] = useState('');

  const [showTakeQuiz, setShowTakeQuiz] = useState(false);
  const [takeQuizData, setTakeQuizData] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [submissions, setSubmissions] = useState([]);

  const [showManageQuestions, setShowManageQuestions] = useState(false);
  const [manageQuizData, setManageQuizData] = useState(null);
  const [questionFormData, setQuestionFormData] = useState({
    questionText: '',
    correctAnswer: true,
    points: 10
  });
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [gradeQuizData, setGradeQuizData] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [studentAnswers, setStudentAnswers] = useState([]);

  useEffect(() => {
    fetchQuizzes();
    fetchCourses();
    if (user?.role === 'Student') {
      fetchSubmissions();
    }
  }, [user]);

  const fetchQuizzes = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await quizzesAPI.getAll();
      setQuizzes(data.quizzes || []);
    } catch (err) {
      console.error('Failed to fetch quizzes:', err);
      setError('Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const data = await coursesAPI.getAll();
      setCourses(data.courses || []);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const data = await quizzesAPI.getStudentSubmissions();
      setSubmissions(data.submissions || []);
    } catch (err) {
      console.error('Failed to fetch submissions:', err);
    }
  };

  const handleTakeQuiz = async (quiz) => {
    setFormError('');
    console.log('Taking quiz:', quiz);
    try {
      console.log('Fetching questions for quiz ID:', quiz.id);
      const questionsData = await quizzesAPI.getQuestions(quiz.id);
      console.log('Questions received:', questionsData);
      setQuizQuestions(questionsData.questions || []);
      
      const existingAnswers = await quizzesAPI.getMyAnswers(quiz.id);
      console.log('Existing answers:', existingAnswers);
      const answersMap = {};
      (existingAnswers.answers || []).forEach(a => {
        answersMap[a.questionId] = a.answer;
      });
      setQuizAnswers(answersMap);
      
      setTakeQuizData(quiz);
      setShowTakeQuiz(true);
    } catch (err) {
      console.error('Failed to load quiz:', err);
      alert('Failed to load quiz questions: ' + err.message);
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setQuizAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmitQuiz = async (e) => {
    e.preventDefault();
    setFormError('');

    const answers = quizQuestions.map(q => ({
      questionId: q.id,
      answer: quizAnswers[q.id] !== undefined ? quizAnswers[q.id] : null
    }));

    const unanswered = answers.filter(a => a.answer === null);
    if (unanswered.length > 0) {
      setFormError(`Please answer all questions. ${unanswered.length} question(s) remaining.`);
      return;
    }

    try {
      const result = await quizzesAPI.submitQuiz(takeQuizData.id, answers);
      setShowTakeQuiz(false);
      fetchSubmissions();
      alert(result.message || 'Quiz submitted successfully!');
    } catch (err) {
      console.error('Failed to submit quiz:', err);
      setFormError(err.message || 'Failed to submit quiz');
    }
  };

  const getSubmissionForQuiz = (quizId) => {
    return submissions.find(s => s.quizId === quizId);
  };

  const handleManageQuestions = async (quiz) => {
    try {
      const questionsData = await quizzesAPI.getQuestions(quiz.id);
      setQuizQuestions(questionsData.questions || []);
      setManageQuizData(quiz);
      setQuestionFormData({ questionText: '', correctAnswer: true, points: 10 });
      setEditingQuestion(null);
      setFormError('');
      setShowManageQuestions(true);
    } catch (err) {
      console.error('Failed to load questions:', err);
      alert('Failed to load quiz questions');
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!questionFormData.questionText.trim()) {
      setFormError('Question text is required');
      return;
    }

    try {
      if (editingQuestion) {
        await quizzesAPI.updateQuestion(manageQuizData.id, editingQuestion.id, questionFormData);
        alert('Question updated successfully');
      } else {
        await quizzesAPI.addQuestion(manageQuizData.id, questionFormData);
        alert('Question added successfully');
      }
      
      const questionsData = await quizzesAPI.getQuestions(manageQuizData.id);
      setQuizQuestions(questionsData.questions || []);
      setQuestionFormData({ questionText: '', correctAnswer: true, points: 10 });
      setEditingQuestion(null);
    } catch (err) {
      console.error('Failed to save question:', err);
      setFormError(err.message || 'Failed to save question');
    }
  };

  const handleEditQuestion = (question) => {
    setEditingQuestion(question);
    setQuestionFormData({
      questionText: question.questionText,
      correctAnswer: question.correctAnswer,
      points: question.points
    });
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;

    try {
      await quizzesAPI.deleteQuestion(manageQuizData.id, questionId);
      const questionsData = await quizzesAPI.getQuestions(manageQuizData.id);
      setQuizQuestions(questionsData.questions || []);
      alert('Question deleted successfully');
    } catch (err) {
      console.error('Failed to delete question:', err);
      alert('Failed to delete question');
    }
  };

  const handleViewGrades = async (quiz) => {
    try {
      const result = await quizzesAPI.getQuizSubmissions(quiz.id);
      setGradeQuizData(quiz);
      setSubmissions(result.submissions || []);
      setShowGradeModal(true);
      setSelectedSubmission(null);
      setStudentAnswers([]);
    } catch (err) {
      alert(err.message || 'Failed to load submissions');
    }
  };

  const handleAutoGrade = async (submissionId, quizId, studentId) => {
    if (!window.confirm('Auto-grade this submission based on correct answers?')) return;
    
    try {
      const result = await quizzesAPI.gradeQuiz(quizId, studentId);
      alert(`Graded! Score: ${result.score} (${result.correctAnswers}/${result.totalQuestions} correct)`);
      handleViewGrades(gradeQuizData);
    } catch (err) {
      alert(err.message || 'Failed to grade quiz');
    }
  };

  const handleManualScoreUpdate = async (submissionId) => {
    const newScore = prompt('Enter new score:');
    if (newScore === null) return;
    
    const score = parseInt(newScore);
    if (isNaN(score) || score < 0) {
      alert('Please enter a valid score');
      return;
    }

    try {
      await quizzesAPI.updateSubmissionScore(submissionId, score);
      alert('Score updated successfully!');
      handleViewGrades(gradeQuizData);
    } catch (err) {
      alert(err.message || 'Failed to update score');
    }
  };

  const handleViewAnswers = async (submission) => {
    try {
      const result = await quizzesAPI.getStudentAnswers(gradeQuizData.id, submission.studentId);
      setSelectedSubmission(submission);
      setStudentAnswers(result.answers || []);
    } catch (err) {
      alert(err.message || 'Failed to load answers');
    }
  };

  const filteredQuizzes = quizzes.filter(quiz => {
    const matchesSearch = searchTerm ? quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) : true;
    const matchesCourse = filterCourse === 'All' || quiz.courseId === parseInt(filterCourse);
    return matchesSearch && matchesCourse;
  });

  const handleAddQuiz = () => {
    setModalMode('add');
    setCurrentQuiz(null);
    setFormData({
      courseId: '',
      title: '',
      description: '',
      dueDate: '',
      totalPoints: 100
    });
    setFormError('');
    setShowModal(true);
  };

  const handleEditQuiz = (quiz) => {
    setModalMode('edit');
    setCurrentQuiz(quiz);
    setFormData({
      courseId: quiz.courseId || '',
      title: quiz.title || '',
      description: quiz.description || '',
      dueDate: quiz.dueDate ? quiz.dueDate.split('T')[0] : '',
      totalPoints: quiz.totalPoints || 100
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

    if (!formData.courseId || !formData.title) {
      setFormError('Course and title are required');
      return;
    }

    try {
      if (modalMode === 'add') {
        await quizzesAPI.create(formData);
      } else {
        await quizzesAPI.update(currentQuiz.id, formData);
      }

      setShowModal(false);
      fetchQuizzes();
    } catch (err) {
      console.error('Failed to save quiz:', err);
      setFormError(err.message || 'Failed to save quiz');
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm('Are you sure you want to delete this quiz?')) {
      return;
    }

    try {
      await quizzesAPI.delete(quizId);
      fetchQuizzes();
    } catch (err) {
      alert(err.message || 'Failed to delete quiz');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormError('');
  };

  const getCourseName = (courseId) => {
    const course = courses.find(c => c.id === courseId);
    return course ? `${course.code} - ${course.name}` : 'N/A';
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Quizzes</h2>
        {user.role === 'Admin' && (
          <button className="btn btn-primary" onClick={handleAddQuiz}>
            <FileText size={16} className="me-1" />
            Add Quiz
          </button>
        )}
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-8">
              <div className="input-group">
                <span className="input-group-text"><Search size={18} /></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search quizzes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-4">
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
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card">
          <div className="card-body text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading quizzes...</p>
          </div>
        </div>
      ) : error ? (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      ) : (
        <div className="row">
          {filteredQuizzes.length > 0 ? (
            filteredQuizzes.map(quiz => (
              <div key={quiz.id} className="col-md-6 col-lg-4 mb-4">
                <div className="card h-100">
                  <div className="card-body">
                    <h5 className="card-title">{quiz.title}</h5>
                    <p className="text-muted small mb-2">{getCourseName(quiz.courseId)}</p>
                    {quiz.description && (
                      <p className="card-text">{quiz.description}</p>
                    )}
                    <div className="d-flex justify-content-between align-items-center mt-3">
                      <span className="badge bg-info">{quiz.totalPoints} points</span>
                      {quiz.dueDate && (
                        <small className="text-muted">
                          Due: {new Date(quiz.dueDate).toLocaleDateString()}
                        </small>
                      )}
                    </div>
                  </div>
                  <div className="card-footer bg-transparent">
                    {user.role === 'Admin' || user.role === 'Instructor' ? (
                      <>
                        <button
                          className="btn btn-sm btn-primary me-2"
                          onClick={() => handleManageQuestions(quiz)}
                        >
                          Manage Questions
                        </button>
                        <button
                          className="btn btn-sm btn-success me-2"
                          onClick={() => handleViewGrades(quiz)}
                        >
                          Grade Quiz
                        </button>
                        {user.role === 'Admin' && (
                          <>
                            <button
                              className="btn btn-sm btn-outline-secondary me-2"
                              onClick={() => handleEditQuiz(quiz)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDeleteQuiz(quiz.id)}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </>
                    ) : user.role === 'Student' ? (
                      <>
                        {getSubmissionForQuiz(quiz.id) ? (
                          <div>
                            <span className={`badge ${
                              getSubmissionForQuiz(quiz.id).status === 'Pending' ? 'bg-warning' :
                              getSubmissionForQuiz(quiz.id).status === 'Pass' ? 'bg-success' : 'bg-danger'
                            } me-2`}>
                              {getSubmissionForQuiz(quiz.id).status === 'Pending' 
                                ? 'Pending Grading' 
                                : `${getSubmissionForQuiz(quiz.id).status}: ${getSubmissionForQuiz(quiz.id).score}/${quiz.totalPoints}`
                              }
                            </span>
                            {getSubmissionForQuiz(quiz.id).status !== 'Pending' && (
                              <button 
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleTakeQuiz(quiz)}
                              >
                                Retake
                              </button>
                            )}
                          </div>
                        ) : (
                          <button 
                            className="btn btn-sm btn-primary"
                            onClick={() => handleTakeQuiz(quiz)}
                          >
                            Take Quiz
                          </button>
                        )}
                      </>
                    ) : (
                      <span className="text-muted">
                        <FileText size={16} className="me-1" />
                        View only
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-12">
              <div className="alert alert-info text-center" role="alert">
                No quizzes found
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{modalMode === 'add' ? 'Add New Quiz' : 'Edit Quiz'}</h5>
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
                    <label className="form-label">Course *</label>
                    <select
                      className="form-select"
                      name="courseId"
                      value={formData.courseId}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Course</option>
                      {courses.map(course => (
                        <option key={course.id} value={course.id}>
                          {course.code} - {course.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Quiz Title *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="3"
                    />
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Due Date</label>
                      <input
                        type="date"
                        className="form-control"
                        name="dueDate"
                        value={formData.dueDate}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Total Points</label>
                      <input
                        type="number"
                        className="form-control"
                        name="totalPoints"
                        value={formData.totalPoints}
                        onChange={handleInputChange}
                        min="1"
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {modalMode === 'add' ? 'Add Quiz' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {showTakeQuiz && takeQuizData && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Take Quiz: {takeQuizData.title}</h5>
                <button type="button" className="btn-close" onClick={() => setShowTakeQuiz(false)}></button>
              </div>
              <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <div className="alert alert-info">
                  <strong>Course:</strong> {getCourseName(takeQuizData.courseId)}<br/>
                  <strong>Total Questions:</strong> {quizQuestions.length}<br/>
                  <strong>Total Points:</strong> {takeQuizData.totalPoints}<br/>
                  {takeQuizData.passingScore && (
                    <><strong>Passing Score:</strong> {takeQuizData.passingScore}<br/></>
                  )}
                  {takeQuizData.description && (
                    <><strong>Description:</strong> {takeQuizData.description}</>
                  )}
                </div>
                {formError && (
                  <div className="alert alert-danger" role="alert">
                    {formError}
                  </div>
                )}
                <form onSubmit={handleSubmitQuiz}>
                  {quizQuestions.length === 0 ? (
                    <div className="alert alert-warning">
                      <strong>No questions available for this quiz.</strong>
                      <p>Please contact your instructor to add questions.</p>
                    </div>
                  ) : (
                    quizQuestions.map((question, index) => (
                    <div key={question.id} className="card mb-3">
                      <div className="card-body">
                        <h6 className="card-subtitle mb-3 text-muted">
                          Question {index + 1} ({question.points} points)
                        </h6>
                        <p className="card-text mb-3">{question.questionText}</p>
                        <div className="btn-group w-100" role="group">
                          <input
                            type="radio"
                            className="btn-check"
                            name={`question-${question.id}`}
                            id={`question-${question.id}-true`}
                            checked={quizAnswers[question.id] === true}
                            onChange={() => handleAnswerChange(question.id, true)}
                          />
                          <label 
                            className={`btn ${quizAnswers[question.id] === true ? 'btn-success' : 'btn-outline-success'}`}
                            htmlFor={`question-${question.id}-true`}
                          >
                            True
                          </label>

                          <input
                            type="radio"
                            className="btn-check"
                            name={`question-${question.id}`}
                            id={`question-${question.id}-false`}
                            checked={quizAnswers[question.id] === false}
                            onChange={() => handleAnswerChange(question.id, false)}
                          />
                          <label 
                            className={`btn ${quizAnswers[question.id] === false ? 'btn-danger' : 'btn-outline-danger'}`}
                            htmlFor={`question-${question.id}-false`}
                          >
                            False
                          </label>
                        </div>
                      </div>
                    </div>
                    ))
                  )}
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowTakeQuiz(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={quizQuestions.length === 0}>
                      Submit Quiz
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {showManageQuestions && manageQuizData && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Manage Questions: {manageQuizData.title}</h5>
                <button type="button" className="btn-close" onClick={() => setShowManageQuestions(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-5">
                    <div className="card">
                      <div className="card-header">
                        <h6 className="mb-0">{editingQuestion ? 'Edit Question' : 'Add New Question'}</h6>
                      </div>
                      <div className="card-body">
                        {formError && (
                          <div className="alert alert-danger" role="alert">
                            {formError}
                          </div>
                        )}
                        <form onSubmit={handleAddQuestion}>
                          <div className="mb-3">
                            <label className="form-label">Question Text *</label>
                            <textarea
                              className="form-control"
                              value={questionFormData.questionText}
                              onChange={(e) => setQuestionFormData({...questionFormData, questionText: e.target.value})}
                              rows="3"
                              required
                            />
                          </div>
                          <div className="mb-3">
                            <label className="form-label">Correct Answer *</label>
                            <div className="btn-group w-100" role="group">
                              <input
                                type="radio"
                                className="btn-check"
                                name="correctAnswer"
                                id="answer-true"
                                checked={questionFormData.correctAnswer === true}
                                onChange={() => setQuestionFormData({...questionFormData, correctAnswer: true})}
                              />
                              <label className={`btn ${questionFormData.correctAnswer === true ? 'btn-success' : 'btn-outline-success'}`} htmlFor="answer-true">
                                True
                              </label>
                              <input
                                type="radio"
                                className="btn-check"
                                name="correctAnswer"
                                id="answer-false"
                                checked={questionFormData.correctAnswer === false}
                                onChange={() => setQuestionFormData({...questionFormData, correctAnswer: false})}
                              />
                              <label className={`btn ${questionFormData.correctAnswer === false ? 'btn-danger' : 'btn-outline-danger'}`} htmlFor="answer-false">
                                False
                              </label>
                            </div>
                          </div>
                          <div className="mb-3">
                            <label className="form-label">Points</label>
                            <input
                              type="number"
                              className="form-control"
                              value={questionFormData.points}
                              onChange={(e) => setQuestionFormData({...questionFormData, points: parseInt(e.target.value)})}
                              min="1"
                              required
                            />
                          </div>
                          <div className="d-flex gap-2">
                            <button type="submit" className="btn btn-primary flex-fill">
                              {editingQuestion ? 'Update Question' : 'Add Question'}
                            </button>
                            {editingQuestion && (
                              <button 
                                type="button" 
                                className="btn btn-secondary"
                                onClick={() => {
                                  setEditingQuestion(null);
                                  setQuestionFormData({ questionText: '', correctAnswer: true, points: 10 });
                                }}
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-7">
                    <div className="card">
                      <div className="card-header">
                        <h6 className="mb-0">Questions ({quizQuestions.length})</h6>
                      </div>
                      <div className="card-body" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                        {quizQuestions.length === 0 ? (
                          <div className="alert alert-info">No questions yet. Add your first question!</div>
                        ) : (
                          quizQuestions.map((question, index) => (
                            <div key={question.id} className="card mb-2">
                              <div className="card-body">
                                <div className="d-flex justify-content-between align-items-start">
                                  <div className="flex-grow-1">
                                    <h6 className="text-muted">Question {index + 1} ({question.points} points)</h6>
                                    <p className="mb-2">{question.questionText}</p>
                                    <span className={`badge ${question.correctAnswer ? 'bg-success' : 'bg-danger'}`}>
                                      Answer: {question.correctAnswer ? 'True' : 'False'}
                                    </span>
                                  </div>
                                  <div className="d-flex gap-1">
                                    <button
                                      className="btn btn-sm btn-outline-primary"
                                      onClick={() => handleEditQuestion(question)}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={() => handleDeleteQuestion(question.id)}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowManageQuestions(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grade Quiz Modal */}
      {showGradeModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Grade Quiz: {gradeQuizData?.title}</h5>
                <button type="button" className="btn-close" onClick={() => setShowGradeModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className={selectedSubmission ? "col-md-5" : "col-12"}>
                    <h6 className="mb-3">Submissions ({submissions.length})</h6>
                    {submissions.length === 0 ? (
                      <p className="text-muted">No submissions yet</p>
                    ) : (
                      <div className="list-group">
                        {submissions.map(sub => (
                          <div key={sub.submissionId} className="list-group-item">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <div>
                                <strong>{sub.firstName} {sub.lastName}</strong>
                                <br />
                                <small className="text-muted">{sub.email}</small>
                              </div>
                              <span className={`badge ${
                                sub.status === 'Pending' ? 'bg-warning' : 
                                sub.status === 'Pass' ? 'bg-success' : 'bg-danger'
                              }`}>
                                {sub.score !== null ? `${sub.score}/${sub.totalPoints}` : 'Pending'}
                              </span>
                            </div>
                            <div className="small text-muted mb-2">
                              Submitted: {new Date(sub.submittedAt).toLocaleString()}
                              <br />
                              Correct: {sub.correctCount}/{sub.answersCount}
                            </div>
                            <div className="btn-group btn-group-sm w-100" role="group">
                              <button
                                className="btn btn-outline-primary"
                                onClick={() => handleViewAnswers(sub)}
                              >
                                View Answers
                              </button>
                              <button
                                className="btn btn-outline-success"
                                onClick={() => handleAutoGrade(sub.submissionId, gradeQuizData.id, sub.studentId)}
                              >
                                Auto-Grade
                              </button>
                              <button
                                className="btn btn-outline-warning"
                                onClick={() => handleManualScoreUpdate(sub.submissionId)}
                              >
                                Edit Score
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {selectedSubmission && (
                    <div className="col-md-7 border-start">
                      <h6 className="mb-3">
                        {selectedSubmission.firstName} {selectedSubmission.lastName}'s Answers
                      </h6>
                      {studentAnswers.map((answer, idx) => (
                        <div key={answer.id} className="card mb-2">
                          <div className="card-body">
                            <div className="d-flex justify-content-between align-items-start">
                              <div className="flex-grow-1">
                                <strong>Q{idx + 1}.</strong> {answer.questionText}
                                <div className="mt-2">
                                  <span className="badge bg-secondary me-2">
                                    Student: {answer.studentAnswer ? 'True' : 'False'}
                                  </span>
                                  <span className={`badge ${answer.isCorrect ? 'bg-success' : 'bg-danger'} me-2`}>
                                    Correct: {answer.correctAnswer ? 'True' : 'False'}
                                  </span>
                                  <span className="badge bg-info">
                                    {answer.points} pts
                                  </span>
                                </div>
                              </div>
                              <div className="ms-2">
                                {answer.isCorrect ? (
                                  <span className="text-success">✓</span>
                                ) : (
                                  <span className="text-danger">✗</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowGradeModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizzesPage;
