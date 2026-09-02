// Mock analysis service — simulates AI cognitive scoring. Replace with real API call later.
const MOCK_ANALYSES = [
  {
    focusScore: 78,
    memoryScore: 65,
    sentimentScore: 82,
    wordCount: 47,
    keyThemes: ['Family', 'School', 'Childhood'],
    encouragement: "Wonderful recall! You remembered so many vivid details.",
    flags: [],
    cognitiveMarkers: {
      temporalAwareness: true,
      spatialAwareness: true,
      emotionalEngagement: true,
    },
  },
  {
    focusScore: 85,
    memoryScore: 72,
    sentimentScore: 90,
    wordCount: 53,
    keyThemes: ['Nature', 'Community', 'Celebration'],
    encouragement: "Excellent! Your description was rich and detailed — that's a great sign!",
    flags: [],
    cognitiveMarkers: {
      temporalAwareness: true,
      spatialAwareness: false,
      emotionalEngagement: true,
    },
  },
];

export const mockAnalysisService = {
  analyze: (response) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const result = MOCK_ANALYSES[Math.floor(Math.random() * MOCK_ANALYSES.length)];
        resolve({ ...result, responseLength: response.length });
      }, 1800); // simulate network delay
    });
  },
};
