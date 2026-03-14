//frontend/src/services/AuthService.js
import config from '../config';
const { API_URL } = config;

export const authService = {
  saveUser(user, token) {
    if (token) localStorage.setItem('token', token);
    if (user)  localStorage.setItem('user', JSON.stringify(user));
  },
  async login(email, password) {
    const r = await fetch(`${API_URL}/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});
    const d = await r.json();
    if (!r.ok) throw new Error(d.message||'Failed to login');
    if (d.token) this.saveUser(d.user, d.token);
    return d;
  },
  async googleAuth(credential, userType = 'jobSeeker') {
    const r = await fetch(`${API_URL}/auth/google`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({credential,userType})});
    const d = await r.json();
    if (!r.ok) throw new Error(d.message||'Google authentication failed');
    if (d.token) this.saveUser(d.user, d.token);
    return d;
  },
  async signup(userData) {
    const r = await fetch(`${API_URL}/auth/signup`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(userData)});
    const d = await r.json();
    if (!r.ok) throw new Error(d.message||'Failed to signup');
    return d;
  },
  async verifyOTP(email, otp) {
    const r = await fetch(`${API_URL}/auth/verify-otp`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,otp})});
    const d = await r.json();
    if (!r.ok) throw new Error(d.message||'Failed to verify OTP');
    if (d.token) this.saveUser(d.user, d.token);
    return d;
  },
  async resendOTP(email) {
    const r = await fetch(`${API_URL}/auth/resend-otp`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email})});
    const d = await r.json();
    if (!r.ok) throw new Error(d.message||'Failed to resend OTP');
    return d;
  },
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  },
  getToken() { return localStorage.getItem('token'); },
  getUser()  { const u=localStorage.getItem('user'); return u?JSON.parse(u):null; },
  isAuthenticated() { return !!this.getToken(); },
};
