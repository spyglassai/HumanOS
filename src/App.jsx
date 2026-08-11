import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
// Add page imports here
import Home from '@/pages/Home';
import CareerDiscovery from '@/pages/CareerDiscovery';
import MyCareer from '@/pages/MyCareer';
import Insights from '@/pages/Insights';
import Archetypes from '@/pages/Archetypes';
import MasterResume from '@/pages/MasterResume';
import ResumeStudio from '@/pages/ResumeStudio';
import Opportunities from '@/pages/Opportunities';
import InterviewStudio from '@/pages/InterviewStudio';
import Portfolio from '@/pages/Portfolio';
import PublicProfile from '@/pages/PublicProfile';
import Documents from '@/pages/Documents';
import SettingsPage from '@/pages/Settings';
import Admin from '@/pages/Admin';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/discovery" element={<CareerDiscovery />} />
          <Route path="/career" element={<MyCareer />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/archetypes" element={<Archetypes />} />
          <Route path="/master-resume" element={<MasterResume />} />
          <Route path="/resume-studio" element={<ResumeStudio />} />
          <Route path="/opportunities" element={<Opportunities />} />
          <Route path="/interview-studio" element={<InterviewStudio />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/public-profile" element={<PublicProfile />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/admin" element={<Admin />} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App