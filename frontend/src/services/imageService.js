const BACKEND_URL = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000' : ''))?.replace(/\/$/, '');

function getBackendUrl() {
  if (!BACKEND_URL) {
    throw new Error('VITE_API_URL is not configured. Set VITE_API_URL in your environment (e.g. https://sereenify-qorvanta-api.vercel.app in production or http://localhost:8000 in development).');
  }
  return BACKEND_URL;
}

export const imageService = {
  startSession: async (profile = {}) => {
    // Normalize hobbies (string or array)
    let hobbiesArray = [];
    if (Array.isArray(profile.hobbies)) {
      hobbiesArray = profile.hobbies;
    } else if (typeof profile.hobbies === 'string' && profile.hobbies.trim()) {
      hobbiesArray = profile.hobbies.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (hobbiesArray.length === 0) {
      hobbiesArray = ["gardening"];
    }

    // Map frontend profile to backend PatientProfile schema
    const payload = {
      full_name: profile.name || "Patient",
      age: parseInt(profile.age, 10) || 60,
      hobbies: hobbiesArray,
      past_activities: profile.occupation || "family and work",
      favorite_places: profile.hometown ? [profile.hometown] : ["peaceful nature"],
      life_milestones: profile.life_milestones || ""
    };
    
    const response = await fetch(`${getBackendUrl()}/api/session/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Failed to start session (${response.status}): ${errorText}`);
    }
    
    return await response.json();
  },
  
  nextImage: async (sessionId, description = "") => {
    const response = await fetch(`${getBackendUrl()}/api/session/${sessionId}/next`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description })
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Failed to get next image (${response.status}): ${errorText}`);
    }
    
    return await response.json();
  },
  
  analyzeDescription: async (sessionId, description = "") => {
    const response = await fetch(`${getBackendUrl()}/api/session/${sessionId}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description })
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Failed to analyze description (${response.status}): ${errorText}`);
    }
    
    return await response.json();
  }
};
