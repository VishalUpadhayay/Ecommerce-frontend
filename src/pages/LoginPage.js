import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../api';
import { setCredentials } from '../redux/store';

const s = {
  container: { maxWidth: '420px', margin: '60px auto', padding: '40px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
  title: { textAlign: 'center', marginBottom: '28px', color: '#1a1a2e', fontSize: '26px' },
  label: { display: 'block', marginBottom: '6px', color: '#555', fontSize: '14px', fontWeight: '500' },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box', marginBottom: '16px' },
  btn: { width: '100%', padding: '12px', background: '#e94560', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', fontWeight: '600' },
  link: { display: 'block', textAlign: 'center', marginTop: '16px', color: '#e94560' },
  error: { color: 'red', fontSize: '13px', marginBottom: '12px' },
};

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await authAPI.login(form);
      dispatch(setCredentials({
        token: data.token,
        user: { name: data.name, email: data.email, role: data.role },
      }));
      toast.success(`Welcome back, ${data.name}!`);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.container}>
      <h2 style={s.title}>🔐 Sign In</h2>
      {error && <p style={s.error}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <label style={s.label}>Email</label>
        <input style={s.input} type="email" name="email" value={form.email}
          onChange={handleChange} placeholder="you@example.com" required />
        <label style={s.label}>Password</label>
        <input style={s.input} type="password" name="password" value={form.password}
          onChange={handleChange} placeholder="••••••" required />
        <button style={s.btn} type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
      <Link to="/register" style={s.link}>Don't have an account? Register</Link>
    </div>
  );
}
