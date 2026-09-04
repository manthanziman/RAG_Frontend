import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ErrorPopup from '../components/ErrorPopup';
import LoadingSpinner from '../components/LoadingSpinner';
import { LogIn } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon">
            <LogIn size={32} />
          </div>
          <h1>Welcome Back</h1>
          <p>Log in to access your operations dashboard</p>
        </div>

        <ErrorPopup isOpen={Boolean(error)} message={error} onClose={() => setError('')} title="Login failed" />

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
              autoComplete="email"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="button button-primary auth-submit" disabled={loading}>
            {loading ? <LoadingSpinner label="Logging in..." size="small" /> : 'Log In'}
          </button>
        </form>

        <div className="test-credentials">
          <div>
            <strong>Test credentials</strong>
            <span>email: john@example.com</span>
            <span>password: 123456</span>
          </div>
          <button
            type="button"
            className="button test-credentials-button"
            onClick={() => {
              setEmail('john@example.com');
              setPassword('123456');
            }}
          >
            Use credentials
          </button>
        </div>

        <div className="auth-footer">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </div>
      </div>
    </div>
  );
}
