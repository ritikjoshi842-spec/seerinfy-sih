import React, { createContext, useContext, useState } from 'react';

const PatientSessionContext = createContext(null);

export function PatientSessionProvider({ children }) {
  const [session, setSession] = useState({
    track: null,         // 'alzheimers' | 'dementia'
    profile: null,       // { name, age, caregiverName, language }
    currentImage: null,  // { url, caption, year, location }
    response: '',        // patient's latest text/voice response
    analysis: null,      // mock analysis result
    imageIndex: 0,
  });

  const updateSession = (patch) => setSession(prev => ({ ...prev, ...patch }));

  return (
    <PatientSessionContext.Provider value={{ session, updateSession }}>
      {children}
    </PatientSessionContext.Provider>
  );
}

export function useSession() {
  return useContext(PatientSessionContext);
}
