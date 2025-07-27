class Student {
  constructor() {
    this.students = new Map();
    this.nameRegistry = new Set();
  }
  
  create(name) {
    if (this.nameRegistry.has(name.toLowerCase())) {
      return null; // Name already exists
    }
    
    const student = {
      studentId: helpers.generateId(),
      name,
      sessionToken: helpers.generateToken({ name, type: 'student' }),
      joinedAt: new Date().toISOString(),
      isActive: true,
      socketId: null
    };
    
    this.students.set(student.studentId, student);
    this.nameRegistry.add(name.toLowerCase());
    return student;
  }
  
  findById(studentId) {
    return this.students.get(studentId);
  }
  
  findByName(name) {
    for (const student of this.students.values()) {
      if (student.name.toLowerCase() === name.toLowerCase()) {
        return student;
      }
    }
    return null;
  }


}