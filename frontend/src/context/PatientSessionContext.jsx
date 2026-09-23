import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const PatientSessionContext = createContext(null);

const DEFAULT_SESSION = {
  track: null,         // 'alzheimers' | 'dementia'
  profile: null,       // { name, age, caregiverName, language, hobbies, occupation, hometown }
  currentImage: null,  // { url, caption, year, location, prompt }
  response: '',        // patient's latest text/voice response
  analysis: null,      // analysis result
  imageIndex: 0,
  backendSessionId: null
};

export function PatientSessionProvider({ children }) {
  const [session, setSession] = useState(() => {
    try {
      const saved = sessionStorage.getItem('serenify_session');
      return saved ? JSON.parse(saved) : DEFAULT_SESSION;
    } catch {
      return DEFAULT_SESSION;
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem('serenify_session', JSON.stringify(session));
    } catch {
      // ignore storage quota errors
    }
  }, [session]);

  const updateSession = useCallback((patch) => {
    setSession(prev => ({ ...prev, ...patch }));
  }, []);

  const resetSession = useCallback(() => {
    try {
      sessionStorage.removeItem('serenify_session');
    } catch {
      // ignore
    }
    setSession(DEFAULT_SESSION);
  }, []);

  return (
    <PatientSessionContext.Provider value={{ session, updateSession, resetSession }}>
      {children}
    </PatientSessionContext.Provider>
  );
}

/* eslint-disable-next-line react-refresh/only-export-components */
export function useSession() {
  return useContext(PatientSessionContext);
}
