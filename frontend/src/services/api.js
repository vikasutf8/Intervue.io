const API_BASE_URL = 'http://localhost:3001/api';

class ApiService {
    constructor() {
      this.token = localStorage.getItem('token') || localStorage.getItem('sessionToken');
    }
  
    async request(endpoint, options = {}) {
      const url = `${API_BASE_URL}${endpoint}`;
      const config = {
        headers: {
          'Content-Type': 'application/json',
          ...(this.token && { Authorization: `Bearer ${this.token}` }),
          ...options.headers,
        },
        ...options,
      };
  
      try {
        const response = await fetch(url, config);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error?.message || 'Request failed');
        }
        
        return data;
      } catch (error) {
        console.error('API Request failed:', error);
        throw error;
      }
    }
  
    // Auth endpoints
    async teacherLogin(teacherId, password) {
      const data = await this.request('/auth/teacher/login', {
        method: 'POST',
        body: JSON.stringify({ teacherId, password }),
      });
      this.token = data.data.token;
      localStorage.setItem('token', this.token);
      return data;
    }
  
    async studentJoin(name, sessionId = 'default') {
      const data = await this.request('/auth/student/join', {
        method: 'POST',
        body: JSON.stringify({ name, sessionId }),
      });
      this.token = data.data.sessionToken;
      localStorage.setItem('sessionToken', this.token);
      localStorage.setItem('studentId', data.data.studentId);
      localStorage.setItem('studentName', data.data.name);
      return data;
    }
  
    // Poll endpoints
    async createPoll(question, options, timeLimit, teacherId) {
      return this.request('/polls', {
        method: 'POST',
        body: JSON.stringify({ question, options, timeLimit, teacherId }),
      });
    }
  
    async getActivePoll() {
      return this.request('/polls/active');
    }
  
    async submitAnswer(pollId, answer, studentId) {
      return this.request(`/polls/${pollId}/answer`, {
        method: 'POST',
        body: JSON.stringify({ answer, studentId }),
      });
    }
  
    async getPollResults(pollId) {
      return this.request(`/polls/${pollId}/results`);
    }
  
    async closePoll(pollId) {
      return this.request(`/polls/${pollId}/close`, {
        method: 'PUT',
      });
    }
  
    async getPollHistory(page = 1, limit = 10) {
      return this.request(`/polls/history?page=${page}&limit=${limit}`);
    }
  
    // Student endpoints
    async getActiveStudents() {
      return this.request('/students/active');
    }
  
    async kickStudent(studentId) {
      return this.request(`/students/${studentId}/kick`, {
        method: 'DELETE',
      });
    }
  }
  
  const api = new ApiService();