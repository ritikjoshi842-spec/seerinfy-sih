// Mock scoring service — returns weekly progress data for recharts.
export const mockScoringService = {
  getWeeklyScores: () => Promise.resolve([
    { day: 'Mon', focus: 62, memory: 58 },
    { day: 'Tue', focus: 68, memory: 63 },
    { day: 'Wed', focus: 71, memory: 66 },
    { day: 'Thu', focus: 74, memory: 70 },
    { day: 'Fri', focus: 70, memory: 68 },
    { day: 'Sat', focus: 78, memory: 72 },
    { day: 'Sun', focus: 82, memory: 75 },
  ]),

  getSessionHistory: () => Promise.resolve([
    { id: 1, date: '28 Aug 2026', duration: '18 min', focusScore: 72, imageCount: 3, track: 'Alzheimer\'s' },
    { id: 2, date: '27 Aug 2026', duration: '22 min', focusScore: 68, imageCount: 4, track: 'Alzheimer\'s' },
    { id: 3, date: '25 Aug 2026', duration: '15 min', focusScore: 78, imageCount: 3, track: 'Alzheimer\'s' },
    { id: 4, date: '23 Aug 2026', duration: '20 min', focusScore: 65, imageCount: 3, track: 'Alzheimer\'s' },
  ]),

  getMonthlyProgress: () => Promise.resolve({
    focusChange: +18,
    memoryChange: +12,
    sessionsCompleted: 14,
    streak: 5,
  }),
};
