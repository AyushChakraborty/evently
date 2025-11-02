import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import StudentSignup from './pages/StudentSignup';
import StudentLogin from './pages/StudentLogin';
import StudentDashboard from './pages/StudentDashboard';
import ClubLogin from './pages/ClubLogin';
import AdminLogin from './pages/AdminLogin';
import NotFound from './pages/NotFound';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/student-signup" element={<StudentSignup />} />
        <Route path="/student-login" element={<StudentLogin />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/club-login" element={<ClubLogin />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
