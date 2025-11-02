import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function ClubLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add club login logic here
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex flex-col items-center justify-center min-h-[80vh]">
          <div className="flex items-center gap-3 mb-8">
            <h1 className="text-4xl font-bold">Club Member Login</h1>
          </div>

          <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
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
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg px-6 py-3 transition"
            >
              Login
            </button>

            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full text-gray-400 hover:text-white transition"
            >
              Back to Home
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ClubLogin;
