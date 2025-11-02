import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function StudentLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:8000/student/login', formData);
      localStorage.setItem('student', JSON.stringify(response.data));
      navigate('/student-dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex flex-col items-center justify-center min-h-[80vh]">
          <div className="flex items-center gap-3 mb-8">
            <h1 className="text-4xl font-bold">Student Login</h1>
          </div>

          <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
            {error && (
              <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg px-6 py-3 transition disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/student-signup')}
              className="w-full text-gray-400 hover:text-white transition"
            >
              Don't have an account? Sign Up
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default StudentLogin;
