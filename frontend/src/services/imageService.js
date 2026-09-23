const PROD_API_URL = 'https://sereenify-qorvanta-api.vercel.app';
const PRIMARY_BACKEND_URL = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000' : PROD_API_URL))?.replace(/\/$/, '');

async function apiFetch(path, options = {}) {
  try {
    const res = await fetch(`${PRIMARY_BACKEND_URL}${path}`, options);
    if (!res.ok && res.status >= 500 && PRIMARY_BACKEND_URL !== PROD_API_URL) {
      console.warn(`Local backend returned ${res.status}, failing over to production API: ${PROD_API_URL}`);
      return await fetch(`${PROD_API_URL}${path}`, options);
    }
    return res;
  } catch (err) {
    if (PRIMARY_BACKEND_URL !== PROD_API_URL) {
      console.warn(`Local backend at ${PRIMARY_BACKEND_URL} unreachable (${err.message}), failing over to production API: ${PROD_API_URL}`);
      return await fetch(`${PROD_API_URL}${path}`, options);
    }
    throw err;
  }
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
    
    const response = await apiFetch(`/api/session/start`, {
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
    const response = await apiFetch(`/api/session/${sessionId}/next`, {
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
    const response = await apiFetch(`/api/session/${sessionId}/analyze`, {
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
