const helpers = require("../utils/helpers");

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

  updateSocketId(studentId, socketId) {
    const student = this.students.get(studentId);
    if (student) {
      student.socketId = socketId;
      student.isActive = true;
    }
  }
  
  remove(studentId) {
    const student = this.students.get(studentId);
    if (student) {
      this.nameRegistry.delete(student.name.toLowerCase());
      this.students.delete(studentId);
      return true;
    }
    return false;
  }
  
  setInactive(studentId) {
    const student = this.students.get(studentId);
    if (student) {
      student.isActive = false;
      student.socketId = null;
    }
  }
  
  getAll() {
    return Array.from(this.students.values());
  }
  
  getActive() {
    return Array.from(this.students.values()).filter(s => s.isActive);
  }
  
  getBySocketId(socketId) {
    for (const student of this.students.values()) {
      if (student.socketId === socketId) {
        return student;
      }
    }
    return null;
  }


}


module.exports = new Student();