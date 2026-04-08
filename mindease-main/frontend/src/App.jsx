import React, { useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';

import Landing     from './pages/Landing';
import Login       from './pages/Login';
import Register    from './pages/Register';
import Dashboard   from './pages/Dashboard';
import MoodTracker from './pages/MoodTracker';
import Chatbot     from './pages/Chatbot';
import Screening   from './pages/Screening';
import PHQ9        from './pages/PHQ9';
import GAD7        from './pages/GAD7';
import Appointments from './pages/Appointments';
import Journal     from './pages/Journal';
import Forum       from './pages/Forum';
import Admin       from './pages/Admin';
import Sidebar     from './components/Sidebar';
import ResourceHub from './pages/ResourceHub';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      Loading...
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const RoleProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      Loading...
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

const AppRoutes = () => {
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.body.setAttribute('data-theme', 'dark');
    }
  }, []);

  return (
    <Router>
      <div className={user ? 'app-layout' : ''}>
        {user && <Sidebar />}
        <div className={user ? 'main-content' : ''}>
          <Routes>
            <Route path="/"              element={<Landing />} />
            <Route path="/login"         element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
            <Route path="/register"      element={user ? <Navigate to="/dashboard" replace /> : <Register />} />
            <Route path="/dashboard"     element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/mood"          element={<ProtectedRoute><MoodTracker /></ProtectedRoute>} />
            <Route path="/chat"          element={<ProtectedRoute><Chatbot /></ProtectedRoute>} />
            <Route path="/screening"     element={<ProtectedRoute><Screening /></ProtectedRoute>} />
            <Route path="/screening/phq9" element={<ProtectedRoute><PHQ9 /></ProtectedRoute>} />
            <Route path="/screening/gad7" element={<ProtectedRoute><GAD7 /></ProtectedRoute>} />
            <Route path="/appointments"  element={<ProtectedRoute><Appointments /></ProtectedRoute>} />
            <Route path="/resource-hub"  element={<ProtectedRoute><ResourceHub /></ProtectedRoute>} />
            <Route path="/journal"       element={<ProtectedRoute><Journal /></ProtectedRoute>} />
            <Route path="/forum"         element={<ProtectedRoute><Forum /></ProtectedRoute>} />
            <Route
              path="/admin"
              element={
                <RoleProtectedRoute allowedRoles={['admin', 'counsellor']}>
                  <Admin />
                </RoleProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to={user ? '/dashboard' : '/'} replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
