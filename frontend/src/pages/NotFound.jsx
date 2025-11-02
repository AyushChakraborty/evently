import { useNavigate } from 'react-router-dom';

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex flex-col items-center justify-center min-h-[80vh]">
          <div className="w-20 h-20 mb-6 rounded-full bg-red-500 flex items-center justify-center">
            <span className="text-5xl font-bold text-white">!</span>
          </div>
          <h1 className="text-6xl font-bold mb-4">404</h1>
          <p className="text-xl text-gray-400 mb-8">Page not found</p>
          <button
            onClick={() => navigate('/')}
            className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg px-6 py-3 transition"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
