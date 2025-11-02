import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function StudentDashboard() {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const studentData = localStorage.getItem('student');
    if (!studentData) {
      navigate('/student-login');
      return;
    }

    const parsedStudent = JSON.parse(studentData);
    setStudent(parsedStudent);
    
    // Check if student_id exists before fetching
    if (parsedStudent.user_id) {
      fetchData(parsedStudent.user_id); // Use user_id as per your login response
    } else {
      setError("User ID not found in session data. Please log in again.");
      setLoading(false);
      localStorage.removeItem('student');
    }

  }, [navigate]);

  const fetchData = async (studentId) => {
    // Reset error on new fetch
    setError('');
    
    try {
      const eventsRes = await axios.get(`http://localhost:8000/student/${studentId}/events`);
      // The API returns an object { student_id: ..., events: [...] }
      setEvents(eventsRes.data.events || []); 
    } catch (err) {
      console.error("Failed to load events:", err);
      setError('Failed to load events. Backend may be down.');
    }
    
    try {
      //this endpoint does not exist yet in your backend code. It will cause a 404 error.
      const registrationsRes = await axios.get(`http://localhost:8000/student/${studentId}/registrations`);
      setRegistrations(registrationsRes.data || []);
    } catch (err) {
      console.warn("Failed to load registrations (endpoint might be missing):", err);
      //don't set a fatal error, just warn
      setRegistrations([]); //default to empty array
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (eventId) => {
    // This endpoint also does not exist yet in your backend.
    try {
      await axios.post(`http://localhost:8000/student/${student.user_id}/register/${eventId}`);
      fetchData(student.user_id);
    } catch (err) {
      // Use a custom modal/toast in a real app, not alert()
      console.error("Registration failed:", err.response?.data?.detail || 'Registration failed');
      setError(err.response?.data?.detail || 'Registration failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('student');
    navigate('/');
  };

  const isRegistered = (eventId) => {
    return registrations.some(reg => reg.event_id === eventId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              {/* Your login endpoint returns `first_name`, not `student.first_name` */}
              Welcome, {student?.first_name || 'Student'}
            </h1>
            {/* Email is not returned from your /login endpoint */}
            {/* <p className="text-gray-400">{student?.email}</p> */}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-lg px-6 py-3 transition"
          >
            {/* <LogOut className="w-5 h-5" /> REMOVED */}
            Logout
          </button>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            {/* <Calendar className="w-6 h-6 text-red-500" /> REMOVED */}
            Your Registered Events
          </h2>
          {registrations.length === 0 ? (
            <p className="text-gray-400">No registered events yet (or endpoint is missing)</p>
          ) : (
            <div className="grid gap-4">
              {registrations.map((event) => (
                <div key={event.event_id} className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-xl font-bold mb-2">{event.name}</h3>
                  <p className="text-gray-400 mb-2">{event.description}</p>
                  <div className="flex gap-4 text-sm text-gray-500">
                    <span>{new Date(event.date).toLocaleDateString()}</span>
                    <span>{event.location}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            {/* <Users className="w-6 h-6 text-red-500" /> REMOVED */}
            Available Events
          </h2>
          {events.length === 0 ? (
            <p className="text-gray-400">No events available</p>
          ) : (
            <div className="grid gap-4">
              {events.map((event) => (
                <div key={event.event_id} className="bg-gray-800 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold mb-2">{event.event_name}</h3>
                      <p className="text-gray-400 mb-2">{event.description}</p>
                      <div className="flex flex-col gap-2 text-sm text-gray-400">
                        <span>
                          <strong>Club:</strong> {event.club_name}
                        </span>
                        <span>
                          <strong>Venue:</strong> {event.venue_name || 'TBD'} ({event.venue_location || 'N/A'})
                        </span>
                        <span>
                          <strong>Starts:</strong> {new Date(event.start_time).toLocaleString()}
                        </span>
                        <span>
                          <strong>Ends:</strong> {new Date(event.end_time).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    {isRegistered(event.event_id) ? (
                      <span className="bg-green-900/50 text-green-300 px-4 py-2 rounded-lg font-bold">
                        Registered
                      </span>
                    ) : (
                      <button
                        onClick={() => handleRegister(event.event_id)}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg px-6 py-2 transition"
                      >
                        Register
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
