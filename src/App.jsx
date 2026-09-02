import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PatientSessionProvider } from './context/PatientSessionContext';
import { LandingPage } from './pages/LandingPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { TherapySessionPage } from './pages/TherapySessionPage';
import { ProgressDashboard } from './pages/ProgressDashboard';

function App() {
  return (
    <PatientSessionProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/session" element={<TherapySessionPage />} />
          <Route path="/progress" element={<ProgressDashboard />} />
          {/* Fallback to landing */}
          <Route path="*" element={<LandingPage />} />
        </Routes>
      </BrowserRouter>
    </PatientSessionProvider>
  );
}

export default App;
