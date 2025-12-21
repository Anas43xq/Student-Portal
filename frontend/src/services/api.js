const API_BASE_URL = 'https://student-portal-owa4.onrender.com';

const apiFetch = (url, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token && !url.includes('/login') && !url.includes('/register')) {
    headers.Authorization = `Bearer ${token}`;
  }

  const opts = { ...options, headers };
  return fetch(url, opts);
};

const handleResponse = async (response) => {
  if (!response.ok) {
    let errorMessage = 'An error occurred';
    try {
      const data = await response.json();
      errorMessage = data.message || errorMessage;
    } catch (e) {
      try {
        errorMessage = await response.text();
      } catch (textError) {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
    }
    throw new Error(errorMessage);
  }

  try {
    return await response.json();
  } catch (e) {
    try {
      return await response.text();
    } catch (textError) {
      return null;
    }
  }
};

const handleError = (error) => {
  throw error;
};

export const authAPI = {
  register: async (userData) => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  login: async (username, password) => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  logout: async () => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/logout`, { method: 'POST' });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  checkSession: async () => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/api/auth/session`);
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  }
};

export const studentsAPI = {
  getAll: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await apiFetch(`${API_BASE_URL}/api/students?${queryString}`);
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  getById: async (id) => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/api/students/${id}`);
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  getInstructors: async (studentId) => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/api/students/${studentId}/instructors`);
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  create: async (studentData) => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/api/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData)
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  update: async (id, studentData) => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/api/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData)
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  delete: async (id) => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/api/students/${id}`, { method: 'DELETE' });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  }
};

export const coursesAPI = {
  getAll: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await apiFetch(`${API_BASE_URL}/api/courses?${queryString}`);
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  getById: async (id) => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/api/courses/${id}`);
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  create: async (courseData) => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/api/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseData)
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  update: async (id, courseData) => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/api/courses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseData)
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  delete: async (id) => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/api/courses/${id}`, { method: 'DELETE' });
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
      const response = await apiFetch(`${API_BASE_URL}/api/enrollments?${queryString}`);
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  create: async (enrollmentData) => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/api/enrollments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enrollmentData)
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  update: async (id, enrollmentData) => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/api/enrollments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enrollmentData)
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  delete: async (id) => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/api/enrollments/${id}`, { method: 'DELETE' });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  }
};

export const adminAPI = {
  getStats: async () => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/api/admin/stats`);
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  getUsers: async () => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/api/admin/users`);
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  createUser: async (userData) => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/api/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  getActivities: async (limit = 10) => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/api/admin/activities?limit=${limit}`);
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  banUser: async (userId, reason) => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/api/admin/users/${userId}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  unbanUser: async (userId) => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/api/admin/users/${userId}/unban`, {
        method: 'POST'
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  deleteUser: async (userId) => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
        method: 'DELETE'
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
      const response = await apiFetch(`${API_BASE_URL}/api/instructors`);
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  getStudents: async (instructorId, params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `${API_BASE_URL}/api/instructors/${instructorId}/students${queryString ? `?${queryString}` : ''}`;
      const response = await apiFetch(url);
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  create: async (instructorData) => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/api/instructors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(instructorData)
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  update: async (id, instructorData) => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/api/instructors/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(instructorData)
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  delete: async (id) => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/api/instructors/${id}`, {
        method: 'DELETE'
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  }
};


export const instructorAPI = {
  getStats: async () => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/api/instructor/stats`);
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  }
};

const api = {
  auth: authAPI,
  students: studentsAPI,
  courses: coursesAPI,
  enrollments: enrollmentsAPI,
  admin: adminAPI,
  instructors: instructorsAPI,
  instructor: instructorAPI
};

export { apiFetch };
export default api;
