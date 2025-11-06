import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function ClubDashboard() {
  const navigate = useNavigate();
  const [club, setClub] = useState(null);
  const [clubEvents, setClubEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  // NEW: State for dropdowns
  const [venues, setVenues] = useState([]);
  const [unbookedEvents, setUnbookedEvents] = useState([]);

  // State for the "Create Event" form
  const [eventForm, setEventForm] = useState({
    event_name: "",
    description: "",
    start_time: "",
    end_time: "",
  });

  // State for the "Book Venue" form
  const [bookingForm, setBookingForm] = useState({
    event_id: "",
    venue_id: "",
  });

  // 1. Auth and Initial Data Load
  useEffect(() => {
    const clubData = localStorage.getItem("club");
    if (!clubData) {
      navigate("/club-login");
      return;
    }
    const parsedClub = JSON.parse(clubData);
    setClub(parsedClub);

    if (parsedClub.club_id) {
      fetchData(parsedClub.club_id);
    } else {
      setError("Club ID not found. Please log in again.");
      setLoading(false);
      localStorage.removeItem("club");
    }
  }, [navigate]);

  // 2. Data Fetching Function (UPDATED)
  const fetchData = async (clubId) => {
    setLoading(true);
    setError("");
    try {
      // UPDATED: Fetch all data in parallel
      const [eventsRes, venuesRes, unbookedEventsRes] = await Promise.all([
        axios.get(`http://localhost:8000/club/${clubId}/events`),
        axios.get(`http://localhost:8000/club/venues`),
        axios.get(`http://localhost:8000/club/${clubId}/events/unbooked`),
      ]);

      setClubEvents(eventsRes.data || []);
      setVenues(venuesRes.data || []);
      setUnbookedEvents(unbookedEventsRes.data || []);
    } catch (err) {
      console.error("Failed to load club data:", err);
      setError("Failed to load club data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Form Input Handlers
  const handleEventFormChange = (e) => {
    setEventForm({ ...eventForm, [e.target.name]: e.target.value });
  };

  const handleBookingFormChange = (e) => {
    setBookingForm({ ...bookingForm, [e.target.name]: e.target.value });
  };

  // 4. Action: Create a new Event
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setFormError("");
    try {
      await axios.post(
        `http://localhost:8000/club/${club.club_id}/events`,
        eventForm,
      );
      // Refresh event list and clear form
      fetchData(club.club_id);
      setEventForm({
        event_name: "",
        description: "",
        start_time: "",
        end_time: "",
      });
    } catch (err) {
      setFormError(err.response?.data?.detail || "Failed to create event.");
    }
  };

  // 5. Action: Request a Venue Booking
  const handleRequestBooking = async (e) => {
    e.preventDefault();
    setFormError("");
    try {
      // We must pass the user_id as a query parameter
      const params = { requested_by: club.user_id };
      await axios.post(`http://localhost:8000/club/bookings`, bookingForm, {
        params,
      });
      // Refresh event list to show 'Pending' status
      fetchData(club.club_id);
      setBookingForm({ event_id: "", venue_id: "" });
    } catch (err) {
      setFormError(err.response?.data?.detail || "Failed to request booking.");
    }
  };

  // 6. Action: Logout
  const handleLogout = () => {
    localStorage.removeItem("club");
    navigate("/");
  };

  // 7. Render
  if (loading && !club) {
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
              Welcome, {club?.club_name || "Club Member"}
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-lg px-6 py-3 transition"
          >
            Logout
          </button>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Form Error Display */}
        {formError && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-6">
            {formError}
          </div>
        )}

        {/* Club Actions Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Create Event Form */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-6">Create New Event</h2>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <input
                type="text"
                name="event_name"
                placeholder="Event Name"
                value={eventForm.event_name}
                onChange={handleEventFormChange}
                required
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <textarea
                name="description"
                placeholder="Description"
                value={eventForm.description}
                onChange={handleEventFormChange}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <input
                type="datetime-local"
                name="start_time"
                placeholder="Start Time"
                value={eventForm.start_time}
                onChange={handleEventFormChange}
                required
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <input
                type="datetime-local"
                name="end_time"
                placeholder="End Time"
                value={eventForm.end_time}
                onChange={handleEventFormChange}
                required
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg px-6 py-3 transition"
              >
                Create Event
              </button>
            </form>
          </div>

          {/* Request Booking Form (UPDATED with dropdowns) */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-6">Request Venue Booking</h2>
            <form onSubmit={handleRequestBooking} className="space-y-4">
              <p className="text-sm text-gray-400">
                Select one of your unbooked events and a venue.
              </p>

              {/* UPDATED: Event ID Dropdown */}
              <select
                name="event_id"
                value={bookingForm.event_id}
                onChange={handleBookingFormChange}
                required
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Select an Event</option>
                {unbookedEvents.map((event) => (
                  <option key={event.event_id} value={event.event_id}>
                    {event.event_name} (ID: {event.event_id})
                  </option>
                ))}
              </select>

              {/* UPDATED: Venue ID Dropdown */}
              <select
                name="venue_id"
                value={bookingForm.venue_id}
                onChange={handleBookingFormChange}
                required
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Select a Venue</option>
                {venues.map((venue) => (
                  <option key={venue.venue_id} value={venue.venue_id}>
                    {venue.venue_name} (Cap: {venue.capacity})
                  </option>
                ))}
              </select>

              <button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg px-6 py-3 transition"
              >
                Request Booking
              </button>
            </form>
          </div>
        </div>

        {/* List of Club's Events */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Your Club's Events</h2>
          {loading && <p className="text-gray-400">Loading events...</p>}
          {!loading && clubEvents.length === 0 ? (
            <p className="text-gray-400">
              Your club has not created any events yet.
            </p>
          ) : (
            <div className="grid gap-4">
              {clubEvents.map((event) => (
                <div
                  key={event.event_id}
                  className="bg-gray-800 rounded-lg p-6"
                >
                  <h3 className="text-xl font-bold mb-2">
                    {event.event_name} (ID: {event.event_id})
                  </h3>
                  <p className="text-gray-400 mb-4">{event.description}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                    <span>
                      <strong>Starts:</strong>{" "}
                      {new Date(event.start_time).toLocaleString()}
                    </span>
                    <span>
                      <strong>Ends:</strong>{" "}
                      {new Date(event.end_time).toLocaleString()}
                    </span>
                    <span>
                      <strong>Venue:</strong> {event.venue_name || "None"}
                    </span>
                    <span>
                      <strong>Booking:</strong>{" "}
                      {event.booking_status || "Not Requested"}
                    </span>
                    <span>
                      <strong>Attendees:</strong> {event.attendee_count}
                    </span>
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

export default ClubDashboard;
