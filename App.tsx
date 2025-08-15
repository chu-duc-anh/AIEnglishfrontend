
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ChatPage from './pages/ChatPage';
import AdminPage from './pages/AdminPage';
import SetupPage from './pages/SetupPage';
import HomePage from './pages/HomePage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ConversationListPage from './pages/ConversationListPage';
import ProfilePage from './pages/ProfilePage';
import SpeakingPracticePage from './pages/ReadingPracticePage';
import { logout, getProfile, authEvents } from './services/authService';
import type { User } from './types';
import Header from './components/Header';
import Spinner from './components/Spinner';
import { ThemeProvider } from './components/ThemeProvider';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    const handleAuthStateChange = (event: Event) => {
        const { user } = (event as CustomEvent).detail;
        setCurrentUser(user);
    };
    authEvents.addEventListener('authStateChange', handleAuthStateChange);

    const checkInitialSession = async () => {
      setLoadingSession(true);
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          // getProfile now verifies the token with the backend
          const profile = await getProfile();
          setCurrentUser(profile);
        } catch (error) {
          console.error("Session validation failed:", error);
          // If token is invalid, ensure user is logged out
          await logout();
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setLoadingSession(false);
    };

    checkInitialSession();

    return () => {
      authEvents.removeEventListener('authStateChange', handleAuthStateChange);
    };
  }, []);


  const handleLogout = async () => {
    await logout();
    // The authStateChange event listener will handle setting currentUser to null
  };

  const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
    if (loadingSession) {
      return null; // or a loading spinner for the route
    }
    if (!currentUser) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  if (loadingSession) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-900">
        <Spinner />
      </div>
    );
  }

  return (
    <ThemeProvider>
      <HashRouter>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-sans">
          <Header currentUser={currentUser} onLogout={handleLogout} />
          <main>
            <Routes>
              {/* Auth Routes */}
              <Route path="/login" element={currentUser ? <Navigate to="/" replace /> : <LoginPage />} />
              <Route path="/signup" element={currentUser ? <Navigate to="/" replace /> : <SignupPage />} />
              <Route path="/forgot-password" element={currentUser ? <Navigate to="/" replace /> : <ForgotPasswordPage />} />
              <Route path="/reset-password/:token" element={currentUser ? <Navigate to="/" replace /> : <ResetPasswordPage />} />
              
              {/* Protected Routes */}
              <Route path="/profile" element={<ProtectedRoute><ProfilePage currentUser={currentUser!} /></ProtectedRoute>} />
              <Route path="/conversations" element={<ProtectedRoute><ConversationListPage currentUser={currentUser!} /></ProtectedRoute>} />
              <Route path="/setup" element={<ProtectedRoute><SetupPage currentUser={currentUser!} /></ProtectedRoute>} />
              <Route path="/chat/:conversationId" element={<ProtectedRoute><ChatPage currentUser={currentUser!} /></ProtectedRoute>} />
              <Route path="/reading-practice" element={<ProtectedRoute><SpeakingPracticePage /></ProtectedRoute>} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    {currentUser?.isAdmin ? <AdminPage /> : <Navigate to="/" replace />}
                  </ProtectedRoute>
                }
              />

              {/* App Route (Home) */}
              <Route path="/" element={<HomePage currentUser={currentUser} />} />
              
              {/* Fallback Route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </HashRouter>
    </ThemeProvider>
  );
};

export default App;
