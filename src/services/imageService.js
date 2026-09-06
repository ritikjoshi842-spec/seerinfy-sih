const BACKEND_URL = 'http://localhost:8000';

export const imageService = {
  startSession: async (profile) => {
    // Map frontend profile to backend PatientProfile schema
    const payload = {
      full_name: profile.name || "Patient",
      age: parseInt(profile.age, 10) || 60,
      hobbies: profile.hobbies ? profile.hobbies.split(',').map(s => s.trim()) : [],
      past_activities: profile.occupation || "",
      favorite_places: profile.hometown ? [profile.hometown] : [],
      life_milestones: ""
    };
    
    const response = await fetch(`${BACKEND_URL}/api/session/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) throw new Error("Failed to start session");
    
    return await response.json();
  },
  
  nextImage: async (sessionId, description = "") => {
    const response = await fetch(`${BACKEND_URL}/api/session/${sessionId}/next`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description })
    });
    
    if (!response.ok) throw new Error("Failed to get next image");
    
    return await response.json();
  },
  
  analyzeDescription: async (sessionId, description = "") => {
    const response = await fetch(`${BACKEND_URL}/api/session/${sessionId}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description })
    });
    
    if (!response.ok) throw new Error("Failed to analyze description");
    
    return await response.json();
  }
};
