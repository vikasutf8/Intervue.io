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

}