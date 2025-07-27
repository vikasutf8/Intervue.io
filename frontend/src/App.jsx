import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import { Users, MessageCircle, BarChart3, Clock, Send, LogOut, Plus, Trash2 } from 'lucide-react';

// API Service
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

// Socket Service (Mock for demo)
class SocketService {
  constructor() {
    this.listeners = {};
  }

  emit(event, data) {
    console.log('Socket emit:', event, data);
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }
}

const socket = new SocketService();

// Main App Component
const LivePollingApp = () => {
  const [userType, setUserType] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');

  useEffect(() => {
    // Check for existing authentication
    const token = localStorage.getItem('token');
    const sessionToken = localStorage.getItem('sessionToken');
    const studentName = localStorage.getItem('studentName');

    if (token) {
      setUserType('teacher');
      setIsAuthenticated(true);
      setUser({ type: 'teacher', id: 'teacher1' });
    } else if (sessionToken && studentName) {
      setUserType('student');
      setIsAuthenticated(true);
      setUser({ 
        type: 'student', 
        id: localStorage.getItem('studentId'),
        name: studentName 
      });
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setUserType(null);
    setIsAuthenticated(false);
    setUser(null);
    setCurrentView('dashboard');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#373737] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <AuthSelection onUserTypeSelect={setUserType} />
          {userType === 'teacher' && (
            <TeacherLogin 
              onLogin={(userData) => {
                setIsAuthenticated(true);
                setUser(userData);
              }} 
            />
          )}
          {userType === 'student' && (
            <StudentJoin 
              onJoin={(userData) => {
                setIsAuthenticated(true);
                setUser(userData);
              }} 
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#373737]">
      <Header 
        user={user} 
        onLogout={handleLogout}
        currentView={currentView}
        onViewChange={setCurrentView}
      />
      <main className="container mx-auto p-4">
        {user.type === 'teacher' ? (
          <TeacherDashboard currentView={currentView} onViewChange={setCurrentView} />
        ) : (
          <StudentDashboard />
        )}
      </main>
    </div>
  );
};

// Auth Selection Component
const AuthSelection = ({ onUserTypeSelect }) => (
  <Card className="bg-[#F2F2F2] border-0 shadow-lg">
    <CardHeader className="text-center">
      <CardTitle className="text-2xl text-[#373737]">Live Polling System</CardTitle>
      <CardDescription className="text-[#6E6E6E]">Choose your role</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <Button 
        onClick={() => onUserTypeSelect('teacher')}
        className="w-full bg-[#7765DA] hover:bg-[#5767D0] text-white py-6 text-lg"
      >
        I'm a Teacher
      </Button>
      <Button 
        onClick={() => onUserTypeSelect('student')}
        className="w-full bg-[#4F0DCE] hover:bg-[#7765DA] text-white py-6 text-lg"
      >
        I'm a Student
      </Button>
    </CardContent>
  </Card>
);

// Teacher Login Component
const TeacherLogin = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({ teacherId: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.teacherLogin(credentials.teacherId, credentials.password);
      onLogin({ type: 'teacher', id: credentials.teacherId });
    } catch (err) {
      setError(err.message || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <Card className="bg-[#F2F2F2] border-0 shadow-lg mt-4">
      <CardHeader>
        <CardTitle className="text-xl text-[#373737]">Teacher Login</CardTitle>
        <CardDescription className="text-[#6E6E6E]">Enter your credentials</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="teacherId" className="text-[#373737]">Teacher ID</Label>
            <Input
              id="teacherId"
              type="text"
              placeholder="teacher1"
              value={credentials.teacherId}
              onChange={(e) => setCredentials(prev => ({ ...prev, teacherId: e.target.value }))}
              className="bg-white border-gray-300"
              required
            />
          </div>
          <div>
            <Label htmlFor="password" className="text-[#373737]">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="password123"
              value={credentials.password}
              onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
              className="bg-white border-gray-300"
              required
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <Button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#7765DA] hover:bg-[#5767D0] text-white"
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

// Student Join Component
const StudentJoin = ({ onJoin }) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.studentJoin(name);
      onJoin({ 
        type: 'student', 
        id: response.data.studentId, 
        name: response.data.name 
      });
    } catch (err) {
      setError(err.message || 'Failed to join');
    }
    setLoading(false);
  };

  return (
    <Card className="bg-[#F2F2F2] border-0 shadow-lg mt-4">
      <CardHeader>
        <CardTitle className="text-xl text-[#373737]">Join as Student</CardTitle>
        <CardDescription className="text-[#6E6E6E]">Enter your name to participate</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-[#373737]">Your Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white border-gray-300"
              required
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <Button 
            type="submit" 
            disabled={loading || !name.trim()}
            className="w-full bg-[#7765DA] hover:bg-[#5767D0] text-white"
          >
            {loading ? 'Joining...' : 'Join Session'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

// Header Component
const Header = ({ user, onLogout, currentView, onViewChange }) => (
  <header className="bg-[#F2F2F2] border-b border-gray-200 px-4 py-3">
    <div className="container mx-auto flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-bold text-[#373737]">Live Polling System</h1>
        {user.type === 'teacher' && (
          <nav className="flex space-x-2">
            <Button
              variant={currentView === 'dashboard' ? 'default' : 'ghost'}
              onClick={() => onViewChange('dashboard')}
              className="text-sm"
            >
              Dashboard
            </Button>
            <Button
              variant={currentView === 'history' ? 'default' : 'ghost'}
              onClick={() => onViewChange('history')}
              className="text-sm"
            >
              History
            </Button>
            <Button
              variant={currentView === 'students' ? 'default' : 'ghost'}
              onClick={() => onViewChange('students')}
              className="text-sm"
            >
              Students
            </Button>
          </nav>
        )}
      </div>
      <div className="flex items-center space-x-4">
        <span className="text-[#6E6E6E]">
          {user.type === 'teacher' ? `Teacher: ${user.id}` : `Student: ${user.name}`}
        </span>
        <Button 
          onClick={onLogout}
          variant="outline"
          size="sm"
          className="text-[#6E6E6E]"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  </header>
);

// Teacher Dashboard Component
const TeacherDashboard = ({ currentView, onViewChange }) => {
  const [activePoll, setActivePoll] = useState(null);
  const [students, setStudents] = useState([]);
  const [pollHistory, setPollHistory] = useState([]);
  const [showCreatePoll, setShowCreatePoll] = useState(false);

  useEffect(() => {
    loadActivePoll();
    loadStudents();
    if (currentView === 'history') {
      loadPollHistory();
    }
  }, [currentView]);

  const loadActivePoll = async () => {
    try {
      const response = await api.getActivePoll();
      setActivePoll(response.data);
    } catch (err) {
      console.log('No active poll');
    }
  };

  const loadStudents = async () => {
    try {
      const response = await api.getActiveStudents();
      setStudents(response.data.students);
    } catch (err) {
      console.error('Failed to load students');
    }
  };

  const loadPollHistory = async () => {
    try {
      const response = await api.getPollHistory();
      setPollHistory(response.data.polls);
    } catch (err) {
      console.error('Failed to load poll history');
    }
  };

  const handleKickStudent = async (studentId) => {
    try {
      await api.kickStudent(studentId);
      loadStudents();
    } catch (err) {
      console.error('Failed to kick student');
    }
  };

  const handleClosePoll = async () => {
    if (activePoll) {
      try {
        await api.closePoll(activePoll.pollId);
        setActivePoll(null);
      } catch (err) {
        console.error('Failed to close poll');
      }
    }
  };

  if (currentView === 'history') {
    return <PollHistory polls={pollHistory} />;
  }

  if (currentView === 'students') {
    return <StudentManagement students={students} onKickStudent={handleKickStudent} />;
  }

  return (
    <div className="space-y-6">
      {/* Active Poll Section */}
      <Card className="bg-[#F2F2F2] border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-[#373737]">Current Poll</CardTitle>
            <CardDescription className="text-[#6E6E6E]">Manage your active poll</CardDescription>
          </div>
          {!activePoll && (
            <Button 
              onClick={() => setShowCreatePoll(true)}
              className="bg-[#7765DA] hover:bg-[#5767D0] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Poll
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {activePoll ? (
            <ActivePollView 
              poll={activePoll} 
              onClose={handleClosePoll}
              onRefresh={loadActivePoll}
            />
          ) : (
            <p className="text-[#6E6E6E] text-center py-8">
              No active poll. Create one to get started!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Students Overview */}
      <Card className="bg-[#F2F2F2] border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-[#373737] flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Active Students ({students.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {students.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {students.slice(0, 6).map((student) => (
                <div key={student.studentId} className="flex items-center justify-between bg-white p-2 rounded">
                  <span className="text-[#373737]">{student.name}</span>
                  <span className="text-green-600 text-xs">Active</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#6E6E6E] text-center">No students connected</p>
          )}
          {students.length > 6 && (
            <Button 
              variant="ghost" 
              onClick={() => onViewChange('students')}
              className="w-full mt-2 text-[#7765DA]"
            >
              View All Students
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Create Poll Modal */}
      {showCreatePoll && (
        <CreatePollModal 
          onClose={() => setShowCreatePoll(false)}
          onPollCreated={() => {
            setShowCreatePoll(false);
            loadActivePoll();
          }}
        />
      )}
    </div>
  );
};

// Active Poll View Component
const ActivePollView = ({ poll, onClose, onRefresh }) => {
  const [results, setResults] = useState(null);
  const [timeLeft, setTimeLeft] = useState(poll.timeRemaining || poll.timeLimit);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await api.getPollResults(poll.pollId);
        setResults(response.data);
      } catch (err) {
        console.error('Failed to fetch results');
      }
    };

    fetchResults();
    const interval = setInterval(fetchResults, 2000); // Refresh every 2 seconds

    return () => clearInterval(interval);
  }, [poll.pollId]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#373737]">{poll.question}</h3>
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-[#6E6E6E]" />
          <span className="text-[#6E6E6E]">{formatTime(timeLeft)}</span>
        </div>
      </div>
      
      <Progress value={(timeLeft / poll.timeLimit) * 100} className="w-full" />

      {results && (
        <div className="space-y-3">
          <div className="flex justify-between text-sm text-[#6E6E6E]">
            <span>Total Responses: {results.totalResponses}</span>
            <span>Status: {results.status}</span>
          </div>
          
          {Object.entries(results.results).map(([option, data]) => (
            <div key={option} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-[#373737]">{option}</span>
                <span className="text-[#6E6E6E]">{data.count} ({data.percentage}%)</span>
              </div>
              <Progress value={data.percentage} className="w-full" />
            </div>
          ))}
        </div>
      )}

      <div className="flex space-x-2">
        <Button 
          onClick={onRefresh}
          variant="outline"
          className="text-[#7765DA]"
        >
          Refresh
        </Button>
        <Button 
          onClick={onClose}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          Close Poll
        </Button>
      </div>
    </div>
  );
};

// Create Poll Modal Component
const CreatePollModal = ({ onClose, onPollCreated }) => {
  const [formData, setFormData] = useState({
    question: '',
    options: ['', ''],
    timeLimit: 60
  });
  const [loading, setLoading] = useState(false);

  const addOption = () => {
    if (formData.options.length < 4) {
      setFormData(prev => ({
        ...prev,
        options: [...prev.options, '']
      }));
    }
  };

  const removeOption = (index) => {
    if (formData.options.length > 2) {
      setFormData(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index)
      }));
    }
  };

  const updateOption = (index, value) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validOptions = formData.options.filter(opt => opt.trim());
      await api.createPoll(
        formData.question,
        validOptions,
        formData.timeLimit,
        'teacher1'
      );
      onPollCreated();
    } catch (err) {
      console.error('Failed to create poll:', err);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="bg-[#F2F2F2] border-0 shadow-lg w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-[#373737]">Create New Poll</CardTitle>
          <CardDescription className="text-[#6E6E6E]">Ask a question to your students</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="question" className="text-[#373737]">Question</Label>
              <Input
                id="question"
                type="text"
                placeholder="What is your favorite programming language?"
                value={formData.question}
                onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                className="bg-white border-gray-300"
                required
              />
            </div>

            <div>
              <Label className="text-[#373737]">Options</Label>
              {formData.options.map((option, index) => (
                <div key={index} className="flex space-x-2 mt-2">
                  <Input
                    type="text"
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    className="bg-white border-gray-300"
                    required
                  />
                  {formData.options.length > 2 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeOption(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              {formData.options.length < 4 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={addOption}
                  className="mt-2 text-[#7765DA]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Option
                </Button>
              )}
            </div>

            <div>
              <Label htmlFor="timeLimit" className="text-[#373737]">Time Limit (seconds)</Label>
              <Input
                id="timeLimit"
                type="number"
                min="10"
                max="300"
                value={formData.timeLimit}
                onChange={(e) => setFormData(prev => ({ ...prev, timeLimit: parseInt(e.target.value) }))}
                className="bg-white border-gray-300"
                required
              />
            </div>

            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !formData.question.trim()}
                className="flex-1 bg-[#7765DA] hover:bg-[#5767D0] text-white"
              >
                {loading ? 'Creating...' : 'Create Poll'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

// Poll History Component
const PollHistory = ({ polls }) => (
  <Card className="bg-[#F2F2F2] border-0 shadow-lg">
    <CardHeader>
      <CardTitle className="text-[#373737] flex items-center">
        <BarChart3 className="w-5 h-5 mr-2" />
        Poll History
      </CardTitle>
      <CardDescription className="text-[#6E6E6E]">View past poll results</CardDescription>
    </CardHeader>
    <CardContent>
      {polls.length > 0 ? (
        <Accordion type="single" collapsible className="w-full">
          {polls.map((poll, index) => (
            <AccordionItem key={poll.pollId} value={`poll-${index}`}>
              <AccordionTrigger className="text-[#373737]">
                <div className="flex justify-between items-center w-full mr-4">
                  <span>{poll.question}</span>
                  <div className="text-sm text-[#6E6E6E]">
                    {poll.totalResponses} responses • {new Date(poll.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  {Object.entries(poll.results).map(([option, data]) => (
                    <div key={option} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-[#373737]">{option}</span>
                        <span className="text-[#6E6E6E]">{data.count} ({data.percentage}%)</span>
                      </div>
                      <Progress value={data.percentage} className="w-full" />
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <p className="text-[#6E6E6E] text-center py-8">No poll history available</p>
      )}
    </CardContent>
  </Card>
);

// Student Management Component
const StudentManagement = ({ students, onKickStudent }) => (
  <Card className="bg-[#F2F2F2] border-0 shadow-lg">
    <CardHeader>
      <CardTitle className="text-[#373737] flex items-center">
        <Users className="w-5 h-5 mr-2" />
        Student Management ({students.length})
      </CardTitle>
      <CardDescription className="text-[#6E6E6E]">Manage active students</CardDescription>
    </CardHeader>
    <CardContent>
      {students.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[#373737]">Name</TableHead>
              <TableHead className="text-[#373737]">Joined At</TableHead>
              <TableHead className="text-[#373737]">Status</TableHead>
              <TableHead className="text-[#373737]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.studentId}>
                <TableCell className="font-medium text-[#373737]">{student.name}</TableCell>
                <TableCell className="text-[#6E6E6E]">
                  {new Date(student.joinedAt).toLocaleTimeString()}
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                    Active
                  </span>
                </TableCell>
                <TableCell>
                  <Button
                    onClick={() => onKickStudent(student.studentId)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Kick
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-[#6E6E6E] text-center py-8">No students connected</p>
      )}
    </CardContent>
  </Card>
);

// Student Dashboard Component
const StudentDashboard = () => {
  const [activePoll, setActivePoll] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [results, setResults] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadActivePoll();
    const interval = setInterval(loadActivePoll, 3000); // Check for new polls every 3 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activePoll && !hasAnswered) {
      setTimeLeft(activePoll.timeRemaining || activePoll.timeLimit);
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            loadResults();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [activePoll, hasAnswered]);

  const loadActivePoll = async () => {
    try {
      const response = await api.getActivePoll();
      const poll = response.data;
      
      // Check if this is a new poll
      if (!activePoll || activePoll.pollId !== poll.pollId) {
        setActivePoll(poll);
        setHasAnswered(false);
        setSelectedAnswer('');
        setResults(null);
      }
    } catch (err) {
      console.log('No active poll');
      setActivePoll(null);
      setResults(null);
    }
  };

  const loadResults = async () => {
    if (activePoll) {
      try {
        const response = await api.getPollResults(activePoll.pollId);
        setResults(response.data);
      } catch (err) {
        console.error('Failed to load results');
      }
    }
  };

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer || !activePoll) return;

    setLoading(true);
    try {
      await api.submitAnswer(
        activePoll.pollId, 
        selectedAnswer, 
        localStorage.getItem('studentId')
      );
      setHasAnswered(true);
      loadResults();
    } catch (err) {
      console.error('Failed to submit answer:', err);
    }
    setLoading(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {activePoll ? (
        <Card className="bg-[#F2F2F2] border-0 shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-[#373737]">{activePoll.question}</CardTitle>
                <CardDescription className="text-[#6E6E6E]">
                  {hasAnswered || timeLeft === 0 ? 'Poll Results' : 'Choose your answer'}
                </CardDescription>
              </div>
              {!hasAnswered && timeLeft > 0 && (
                <div className="flex items-center space-x-2 bg-white px-3 py-1 rounded-full">
                  <Clock className="w-4 h-4 text-[#6E6E6E]" />
                  <span className="text-[#6E6E6E] font-medium">{formatTime(timeLeft)}</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!hasAnswered && timeLeft > 0 ? (
              // Answer Form
              <div className="space-y-4">
                <Progress 
                  value={(timeLeft / activePoll.timeLimit) * 100} 
                  className="w-full mb-4" 
                />
                <RadioGroup 
                  value={selectedAnswer} 
                  onValueChange={setSelectedAnswer}
                  className="space-y-3"
                >
                  {activePoll.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
                      <RadioGroupItem 
                        value={option} 
                        id={`option-${index}`}
                        className="text-[#7765DA]"
                      />
                      <Label 
                        htmlFor={`option-${index}`} 
                        className="text-[#373737] cursor-pointer flex-1"
                      >
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                <Button
                  onClick={handleSubmitAnswer}
                  disabled={!selectedAnswer || loading}
                  className="w-full bg-[#7765DA] hover:bg-[#5767D0] text-white py-3"
                >
                  {loading ? 'Submitting...' : 'Submit Answer'}
                </Button>
              </div>
            ) : (
              // Results View
              <div className="space-y-4">
                {hasAnswered && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                    <p className="text-green-800 text-sm font-medium">
                      ✓ Your answer: {selectedAnswer}
                    </p>
                  </div>
                )}
                
                {results ? (
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm text-[#6E6E6E] mb-4">
                      <span>Total Responses: {results.totalResponses}</span>
                      <span>Status: {results.status}</span>
                    </div>
                    
                    {Object.entries(results.results).map(([option, data]) => (
                      <div key={option} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[#373737] font-medium">{option}</span>
                          <div className="text-right">
                            <span className="text-[#6E6E6E] text-sm">{data.count} votes</span>
                            <span className="text-[#373737] font-bold ml-2">{data.percentage}%</span>
                          </div>
                        </div>
                        <Progress 
                          value={data.percentage} 
                          className="w-full h-3"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7765DA] mx-auto mb-4"></div>
                    <p className="text-[#6E6E6E]">Loading results...</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        // No Active Poll
        <Card className="bg-[#F2F2F2] border-0 shadow-lg">
          <CardContent className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-[#6E6E6E] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#373737] mb-2">No Active Poll</h3>
            <p className="text-[#6E6E6E]">
              Waiting for your teacher to create a poll...
            </p>
            <div className="mt-4">
              <div className="animate-pulse flex space-x-1 justify-center">
                <div className="w-2 h-2 bg-[#7765DA] rounded-full"></div>
                <div className="w-2 h-2 bg-[#7765DA] rounded-full opacity-75"></div>
                <div className="w-2 h-2 bg-[#7765DA] rounded-full opacity-50"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat Section */}
      <ChatWindow />
    </div>
  );
};

// Chat Window Component
const ChatWindow = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'Teacher',
      message: 'Welcome to the live polling session!',
      timestamp: new Date(),
      type: 'teacher'
    }
  ]);
  const [newMessage, setNewMessage] = useState('');

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const message = {
      id: messages.length + 1,
      sender: localStorage.getItem('studentName') || 'Student',
      message: newMessage,
      timestamp: new Date(),
      type: 'student'
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 rounded-full w-14 h-14 bg-[#7765DA] hover:bg-[#5767D0] text-white shadow-lg z-40"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 w-80 bg-[#F2F2F2] border-0 shadow-xl rounded-lg z-50">
          <div className="p-4 border-b bg-[#7765DA] text-white rounded-t-lg">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold">Chat</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-[#5767D0] p-1"
              >
                ✕
              </Button>
            </div>
          </div>
          
          <div className="h-64 overflow-y-auto p-3 space-y-2">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`p-2 rounded-lg text-sm ${
                  msg.type === 'teacher' 
                    ? 'bg-[#7765DA] text-white ml-4' 
                    : 'bg-white text-[#373737] mr-4'
                }`}
              >
                <div className="font-medium text-xs opacity-75 mb-1">
                  {msg.sender} • {msg.timestamp.toLocaleTimeString()}
                </div>
                <div>{msg.message}</div>
              </div>
            ))}
          </div>
          
          <div className="p-3 border-t">
            <div className="flex space-x-2">
              <Input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="bg-white border-gray-300 text-sm"
              />
              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                size="sm"
                className="bg-[#7765DA] hover:bg-[#5767D0] text-white"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LivePollingApp;