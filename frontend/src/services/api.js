const API_BASE_URL = 'https://student-portal-owa4.onrender.com';

// ============================================
// UTILITY FUNCTIONS
// ============================================

const handleResponse = async (response) => {
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'An error occurred');
  }
  
  return data;
};

const handleError = (error) => {
  console.error('API Error:', error);
  throw error;
};

// ============================================
// SHARED APIs (All Roles)
// ============================================

export const authAPI = {
  register: async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(userData)
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  login: async (username, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  logout: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  checkSession: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/session`, {
        credentials: 'include'
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  }
};

// ============================================
// ADMIN APIs
// ============================================

export const studentsAPI = {
  getAll: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`${API_BASE_URL}/api/students?${queryString}`, {
        credentials: 'include'
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  getById: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/students/${id}`, {
        credentials: 'include'
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  create: async (studentData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(studentData)
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  update: async (id, studentData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(studentData)
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  delete: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/students/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  }
};

// ============================================
// STUDENT APIs
// ============================================

export const coursesAPI = {
  getAll: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`${API_BASE_URL}/api/courses?${queryString}`, {
        credentials: 'include'
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  getById: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/courses/${id}`, {
        credentials: 'include'
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  create: async (courseData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(courseData)
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  update: async (id, courseData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/courses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(courseData)
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  delete: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/courses/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  }
};

export const enrollmentsAPI = {
  getAll: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`${API_BASE_URL}/api/enrollments?${queryString}`, {
        credentials: 'include'
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  create: async (enrollmentData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/enrollments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(enrollmentData)
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  update: async (id, enrollmentData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/enrollments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(enrollmentData)
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  delete: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/enrollments/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  }
};

export const adminAPI = {
  getStats: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
        credentials: 'include'
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  getUsers: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        credentials: 'include'
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  createUser: async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(userData)
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  getActivities: async (limit = 10) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/activities?limit=${limit}`, {
        credentials: 'include'
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  banUser: async (userId, reason) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason })
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  unbanUser: async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/unban`, {
        method: 'POST',
        credentials: 'include'
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  deleteUser: async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  }
};

export const instructorsAPI = {
  getAll: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/instructors`, {
        credentials: 'include'
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  create: async (instructorData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/instructors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(instructorData)
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  update: async (id, instructorData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/instructors/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(instructorData)
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  delete: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/instructors/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  }
};

export const quizzesAPI = {
  getAll: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`${API_BASE_URL}/api/quizzes?${queryString}`, {
        credentials: 'include'
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  create: async (quizData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/quizzes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(quizData)
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  update: async (id, quizData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/quizzes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(quizData)
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  delete: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/quizzes/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  getQuestions: async (quizId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/quizzes/${quizId}/questions`, {
        credentials: 'include'
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  getMyAnswers: async (quizId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/quizzes/${quizId}/my-answers`, {
        credentials: 'include'
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  addQuestion: async (quizId, questionData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/quizzes/${quizId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(questionData)
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  updateQuestion: async (quizId, questionId, questionData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/quizzes/${quizId}/questions/${questionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(questionData)
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  deleteQuestion: async (quizId, questionId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/quizzes/${quizId}/questions/${questionId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  gradeQuiz: async (quizId, studentId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/quizzes/${quizId}/grade/${studentId}`, {
        method: 'POST',
        credentials: 'include'
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  updateSubmissionScore: async (submissionId, score) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/quiz-submissions/${submissionId}/score`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ score })
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  getQuizSubmissions: async (quizId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/instructor/quiz-submissions/${quizId}`, {
        credentials: 'include'
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  getStudentAnswers: async (quizId, studentId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/instructor/student-answers/${quizId}/${studentId}`, {
        credentials: 'include'
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  submitQuiz: async (quizId, answers) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/quizzes/${quizId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ answers })
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  getStudentSubmissions: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/student/quiz-submissions`, {
        credentials: 'include'
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  }
};

// ============================================
// INSTRUCTOR APIs
// ============================================

export const instructorAPI = {
  getStats: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/instructor/stats`, {
        credentials: 'include'
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  getQuizResults: async (quizId = null, courseId = null) => {
    try {
      const params = new URLSearchParams();
      if (quizId) params.append('quizId', quizId);
      if (courseId) params.append('courseId', courseId);
      
      const url = `${API_BASE_URL}/api/instructor/quiz-results${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url, {
        credentials: 'include'
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  }
};

// ============================================
// UNIFIED API EXPORT
// ============================================

const api = {
  auth: authAPI,
  students: studentsAPI,
  courses: coursesAPI,
  enrollments: enrollmentsAPI,
  admin: adminAPI,
  instructors: instructorsAPI,
  quizzes: quizzesAPI,
  instructor: instructorAPI
};

export default api;
