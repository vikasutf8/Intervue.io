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