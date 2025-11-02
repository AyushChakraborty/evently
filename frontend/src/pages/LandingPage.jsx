import { useNavigate } from 'react-router-dom';

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex flex-col items-center justify-center min-h-[80vh]">
          <div className="flex items-center gap-3 mb-6">
            <h1 className="text-5xl font-bold">University Events</h1>
          </div>

          <p className="text-xl text-gray-400 mb-12 text-center max-w-2xl">
            Discover, register, and manage campus events seamlessly
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => navigate('/student-signup')}
              className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg px-6 py-3 transition"
            >
              Student Sign Up
            </button>
            <button
              onClick={() => navigate('/student-login')}
              className="bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-lg px-6 py-3 transition"
            >
              Student Login
            </button>
            <button
              onClick={() => navigate('/club-login')}
              className="bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-lg px-6 py-3 transition"
            >
              Club Login
            </button>
            <button
              onClick={() => navigate('/admin-login')}
              className="bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-lg px-6 py-3 transition"
            >
              Admin Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
