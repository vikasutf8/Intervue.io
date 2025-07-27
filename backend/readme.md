
# Live Polling System – Backend API Documentation

## REST API Endpoints

### Authentication Routes (`/api/auth`)

#### `POST /api/auth/teacher/login`
- **Description**: Authenticate teacher
- **Body**:
  ```json
  {
    "teacherId": "string",
    "password": "string"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "teacherId": "string",
      "token": "jwt_token"
    }
  }
  ```

#### `POST /api/auth/student/join`
- **Description**: Student joins with name (unique per session)
- **Body**:
  ```json
  {
    "name": "string",
    "sessionId": "string"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "studentId": "string",
      "name": "string",
      "sessionToken": "string"
    }
  }
  ```

---

### Poll Routes (`/api/polls`)

#### `POST /api/polls`
- **Description**: Teacher creates a new poll
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "question": "string",
    "options": ["option1", "option2", "option3", "option4"],
    "timeLimit": 60,
    "teacherId": "string"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "pollId": "string",
      "question": "string",
      "options": ["string"],
      "timeLimit": 60,
      "status": "active",
      "createdAt": "timestamp"
    }
  }
  ```

#### `GET /api/polls/active`
- **Description**: Get current active poll
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "pollId": "string",
      "question": "string",
      "options": ["string"],
      "timeLimit": 60,
      "timeRemaining": 45,
      "status": "active"
    }
  }
  ```

#### `GET /api/polls/:pollId/results`
- **Description**: Get poll results
- **Headers**: `Authorization: Bearer <token>` (for teacher)
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "pollId": "string",
      "question": "string",
      "totalResponses": 10,
      "results": {
        "option1": { "count": 3, "percentage": 30 },
        "option2": { "count": 7, "percentage": 70 }
      },
      "respondedStudents": ["student1", "student2"],
      "status": "completed"
    }
  }
  ```

#### `POST /api/polls/:pollId/answer`
- **Description**: Student submits answer
- **Headers**: `Authorization: Bearer <sessionToken>`
- **Body**:
  ```json
  {
    "answer": "option1",
    "studentId": "string"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "answered": true,
      "answer": "option1"
    }
  }
  ```

#### `GET /api/polls/history`
- **Description**: Get past poll results (teacher only)
- **Headers**: `Authorization: Bearer <token>`
- **Query**: `?page=1&limit=10`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "polls": [
        {
          "pollId": "string",
          "question": "string",
          "totalResponses": 10,
          "createdAt": "timestamp",
          "results": {}
        }
      ],
      "pagination": {
        "currentPage": 1,
        "totalPages": 5,
        "totalPolls": 50
      }
    }
  }
  ```

#### `PUT /api/polls/:pollId/close`
- **Description**: Teacher closes poll manually
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "pollId": "string",
      "status": "closed"
    }
  }
  ```

---

### Student Routes (`/api/students`)

#### `DELETE /api/students/:studentId/kick`
- **Description**: Teacher kicks out a student
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
  ```json
  {
    "success": true,
    "message": "Student kicked successfully"
  }
  ```

#### `GET /api/students/active`
- **Description**: Get list of active students
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "students": [
        {
          "studentId": "string",
          "name": "string",
          "joinedAt": "timestamp",
          "isActive": true
        }
      ]
    }
  }
  ```

---

## Error Response Format

All API errors follow this format:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": "Additional error details (optional)"
  }
}
```

### Common Error Codes

- `INVALID_CREDENTIALS`: Authentication failed
- `POLL_NOT_FOUND`: Poll doesn't exist
- `POLL_ALREADY_ANSWERED`: Student already answered this poll
- `POLL_EXPIRED`: Poll time limit exceeded
- `STUDENT_NOT_FOUND`: Student doesn't exist
- `UNAUTHORIZED`: Access denied
- `VALIDATION_ERROR`: Request validation failed
- `DUPLICATE_NAME`: Student name already exists in session
- `NO_ACTIVE_POLL`: No poll is currently active
- `POLL_CREATION_BLOCKED`: Cannot create poll while another is active

---

## Database Schema (In-Memory Storage)

### Poll Object
```javascript
{
  pollId: "string",
  question: "string",
  options: ["string"],
  teacherId: "string",
  createdAt: "timestamp",
  timeLimit: 60, // seconds
  status: "active" | "closed" | "expired",
  answers: {
    "studentId": "selectedOption"
  },
  results: {
    "option1": { count: 0, percentage: 0 }
  }
}
```

### Student Object
```javascript
{
  studentId: "string",
  name: "string",
  sessionToken: "string",
  joinedAt: "timestamp",
  isActive: true,
  socketId: "string"
}
```

### Teacher Object
```javascript
{
  teacherId: "string",
  password: "string", // hashed
  token: "jwt_token",
  socketId: "string"
}
```

### Authentication

#### Teacher Login
```bash
POST /api/auth/teacher/login
Content-Type: application/json

{
  "teacherId": "teacher1",
  "password": "password123"
}
```

#### Student Join
```bash
POST /api/auth/student/join
Content-Type: application/json

{
  "name": "John Doe"
}
```

### Polls

#### Create Poll (Teacher)
```bash
POST /api/polls
Authorization: Bearer <teacher_token>
Content-Type: application/json

{
  "question": "What is your favorite programming language?",
  "options": ["JavaScript", "Python", "Java", "C++"],
  "timeLimit": 60,
  "teacherId": "teacher1"
}
```

#### Get Active Poll
```bash
GET /api/polls/active
```

#### Submit Answer (Student)
```bash
POST /api/polls/:pollId/answer
Authorization: Bearer <student_token>
Content-Type: application/json

{
  "answer": "JavaScript",
  "studentId": "student_id"
}
```

#### Get Poll Results
```bash
GET /api/polls/:pollId/results
```

#### Close Poll (Teacher)
```bash
PUT /api/polls/:pollId/close
Authorization: Bearer <teacher_token>
```

#### Get Poll History (Teacher)
```bash
GET /api/polls/history?page=1&limit=10
Authorization: Bearer <teacher_token>
```

### Students

#### Get Active Students (Teacher)
```bash
GET /api/students/active
Authorization: Bearer <teacher_token>
```

#### Kick Student (Teacher)
```bash
DELETE /api/students/:studentId/kick
Authorization: Bearer <teacher_token>
```

## Socket.IO Events

### Connection
```javascript
// Client connects and identifies
socket.emit('identify', {
  userType: 'teacher', // or 'student'
  userId: 'user_id',
  token: 'jwt_token'
});
```

### Poll Events
```javascript
// Server broadcasts new poll
socket.on('poll:created', (pollData) => {
  // Handle new poll
});

// Student submits answer
socket.emit('poll:answer', {
  pollId: 'poll_id',
  answer: 'selected_option'
});

// Server broadcasts updated results
socket.on('poll:results:updated', (results) => {
  // Update UI with results
});

// Server notifies poll closed
socket.on('poll:closed', (data) => {
  // Handle poll closure
});
```

### Chat Events
```javascript
// Send chat message
socket.emit('chat:message', {
  message: 'Hello everyone!',
  senderId: 'user_id',
  senderName: 'John Doe',
  senderType: 'student'
});

// Receive chat message
socket.on('chat:message:broadcast', (message) => {
  // Display message
});
```

### Student Management Events
```javascript
// Teacher receives student join notification
socket.on('student:joined', (studentData) => {
  // Update student list
});

// Student receives kick notification
socket.on('student:kicked', (data) => {
  // Handle being kicked
});
```

## Default Teacher Credentials

- **Teacher ID**: `teacher1`
- **Password**: `password123`

## Error Handling

All API errors follow this format:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message"
  }
}
```

## Production Deployment

1. Set environment variables
2. Install dependencies: `npm install --production`
3. Start server: `npm start`
4. Configure reverse proxy (nginx) for WebSocket support

## Technology Stack

- **Express.js**: Web framework
- **Socket.IO**: Real-time communication
- **JWT**: Authentication
- **Joi**: Input validation
- **bcryptjs**: Password hashing
- **UUID**: Unique ID generation

## Architecture

- **In-memory storage**: No database required for demo
- **RESTful APIs**: Standard HTTP endpoints
- **WebSocket communication**: Real-time updates
- **JWT authentication**: Secure token-based auth
- **Modular structure**: Organized codebase

## License

MIT License
        