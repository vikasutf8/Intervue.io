class Teacher {
  constructor() {
    this.teachers = new Map();
    this.initDefaultTeacher();
  }
  
  async initDefaultTeacher() {
    const defaultTeacher = {
      teacherId: 'teacher1',
      password: await helpers.hashPassword('password123'),
      socketId: null,
      isOnline: false
    };
    this.teachers.set('teacher1', defaultTeacher);
  }
  
  async findByCredentials(teacherId, password) {
    const teacher = this.teachers.get(teacherId);
    if (!teacher) return null;
    
    const isValidPassword = await helpers.comparePassword(password, teacher.password);
    return isValidPassword ? teacher : null;
  }

   updateSocketId(teacherId, socketId) {
    const teacher = this.teachers.get(teacherId);
    if (teacher) {
      teacher.socketId = socketId;
      teacher.isOnline = true;
    }
  }
  
  setOffline(teacherId) {
    const teacher = this.teachers.get(teacherId);
    if (teacher) {
      teacher.socketId = null;
      teacher.isOnline = false;
    }
  }
  
  getBySocketId(socketId) {
    for (const [teacherId, teacher] of this.teachers) {
      if (teacher.socketId === socketId) {
        return { teacherId, ...teacher };
      }
    }
    return null;
  }

}

module.exports = new Teacher();