import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function StudentSignup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    phone: ''
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
      await axios.post('http://localhost:8000/student/signup', formData);
      navigate('/student-login');
    } catch (err) {
      setError(err.response?.data?.detail || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex flex-col items-center justify-center min-h-[80vh]">
          <div className="flex items-center gap-3 mb-8">
            <h1 className="text-4xl font-bold">Student Sign Up</h1>
          </div>

          <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
            {error && (
              <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <input
              type="text"
              name="first_name"
              placeholder="First Name"
              value={formData.first_name}
              onChange={handleChange}
              required
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />

            <input
              type="text"
              name="last_name"
              placeholder="Last Name"
              value={formData.last_name}
              onChange={handleChange}
              required
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />

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

            <input
              type="tel"
              name="phone"
              placeholder="Phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg px-6 py-3 transition disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/student-login')}
              className="w-full text-gray-400 hover:text-white transition"
            >
              Already have an account? Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default StudentSignup;
