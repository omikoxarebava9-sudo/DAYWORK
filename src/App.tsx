import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './lib/language-context';
import { AuthProvider } from './lib/auth-context';
import { Navbar } from './components/Navbar';
import { LoadingScreen } from './components/LoadingScreen';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { CreateJobPage } from './pages/CreateJobPage';
import { SearchPage } from './pages/SearchPage';
import { JobDetailsPage } from './pages/JobDetailsPage';
import { ProfilePage } from './pages/ProfilePage';
import { MessagesPage } from './pages/MessagesPage';
import { MapPage } from './pages/MapPage';
import { ActivityPage } from './pages/ActivityPage';
import { useState, useEffect } from 'react';

function App() {
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setInitialLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (initialLoading) {
    return <LoadingScreen />;
  }

  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-zinc-950 text-white">
            <Navbar />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/create-job" element={<CreateJobPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/job/:id" element={<JobDetailsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/profile/:id" element={<ProfilePage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/activity" element={<ActivityPage />} />
            </Routes>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
