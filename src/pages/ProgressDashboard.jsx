import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Star, Zap, Flame, Calendar, Clock, TrendingUp, ArrowRight, Award } from 'lucide-react';
import { PageShell } from '../components/common/PageShell';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { SectionHeading } from '../components/common/SectionHeading';
import { ProgressRing } from '../components/common/ProgressRing';
import { mockScoringService } from '../services/mockScoringService';

const BADGES = [
  { icon: <Star size={20} fill="#D6A84F" color="#D6A84F" />, label: '5-Day Streak', desc: 'Played 5 days in a row!', earned: true },
  { icon: <Zap size={20} fill="#5B3FA0" color="#5B3FA0" />, label: 'Quick Thinker', desc: 'Responded in under 30 seconds.', earned: true },
  { icon: <Flame size={20} fill="#C7654A" color="#C7654A" />, label: 'On Fire!', desc: 'Scored 80%+ three sessions in a row.', earned: false },
  { icon: <Award size={20} fill="#285943" color="#285943" />, label: 'Memory Champ', desc: '10 sessions completed.', earned: false },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-[#E4E0D3] rounded-xl p-3 shadow-card text-sm">
        <p className="font-semibold text-[#202622] mb-1" style={{ fontFamily: 'Poppins' }}>{label}</p>
        {payload.map(p => (
          <p key={p.dataKey} style={{ color: p.color }}>
            {p.name}: <strong>{p.value}%</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function ProgressDashboard() {
  const navigate = useNavigate();
  const [weeklyData, setWeeklyData] = useState([]);
  const [history, setHistory] = useState([]);
  const [monthly, setMonthly] = useState(null);

  useEffect(() => {
    mockScoringService.getWeeklyScores().then(setWeeklyData);
    mockScoringService.getSessionHistory().then(setHistory);
    mockScoringService.getMonthlyProgress().then(setMonthly);
  }, []);

  return (
    <PageShell>
      <div className="min-h-[calc(100vh-64px)] py-12" style={{ background: '#FAF7EF' }}>
        <div className="content-wrap space-y-10">

          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <SectionHeading
                label="PROGRESS"
                title="Your Growth Journey"
                subtitle="Every session brings you closer. Here's how you're doing."
                align="left"
              />
            </div>
            <Button variant="accent" size="md" onClick={() => navigate('/session')} iconRight={<ArrowRight size={16} />}>
              Start New Session
            </Button>
          </div>

          {/* Stats cards */}
          {monthly && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Sessions', value: monthly.sessionsCompleted, icon: <Calendar size={20} />, color: '#285943', bg: '#DCE8D8', unit: '' },
                { label: 'Streak', value: monthly.streak, icon: <Flame size={20} />, color: '#C7654A', bg: '#FEF0E7', unit: ' days' },
                { label: 'Focus ↑', value: `+${monthly.focusChange}`, icon: <TrendingUp size={20} />, color: '#4C8B5D', bg: '#DCE8D8', unit: '%' },
                { label: 'Memory ↑', value: `+${monthly.memoryChange}`, icon: <Star size={20} />, color: '#D6A84F', bg: '#FFF5DC', unit: '%' },
              ].map(stat => (
                <Card key={stat.label} className="p-5 flex items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: stat.bg, color: stat.color }}>
                    {React.cloneElement(stat.icon, { color: stat.color })}
                  </div>
                  <div>
                    <p className="font-bold text-[#202622] text-2xl leading-none" style={{ fontFamily: 'Poppins' }}>
                      {stat.value}{stat.unit}
                    </p>
                    <p className="text-[#5B6660] text-xs mt-1">{stat.label}</p>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Chart + rings row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Area chart */}
            <Card className="lg:col-span-2 p-6">
              <h3 className="font-bold text-[#202622] mb-6" style={{ fontFamily: 'Poppins', fontSize: '1.1rem' }}>
                Weekly Performance
              </h3>
              {weeklyData.length > 0 && (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={weeklyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="focusGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#285943" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#285943" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="memoryGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#5B3FA0" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#5B3FA0" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E4E0D3" />
                    <XAxis dataKey="day" tick={{ fill: '#5B6660', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[40, 100]} tick={{ fill: '#5B6660', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12, color: '#5B6660' }} />
                    <Area type="monotone" dataKey="focus" name="Focus" stroke="#285943" strokeWidth={2.5} fill="url(#focusGrad)" dot={{ fill: '#285943', r: 4 }} />
                    <Area type="monotone" dataKey="memory" name="Memory" stroke="#5B3FA0" strokeWidth={2.5} fill="url(#memoryGrad)" dot={{ fill: '#5B3FA0', r: 4 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </Card>

            {/* Progress rings */}
            <Card className="p-6 flex flex-col items-center justify-center gap-6">
              <h3 className="font-bold text-[#202622] self-start" style={{ fontFamily: 'Poppins', fontSize: '1.1rem' }}>
                This Month
              </h3>
              <ProgressRing percent={78} size={120} strokeWidth={11} color="#285943" label="Focus" sublabel="+18% vs last month" />
              <ProgressRing percent={65} size={100} strokeWidth={10} color="#5B3FA0" label="Memory" sublabel="+12% vs last month" />
            </Card>
          </div>

          {/* Badges */}
          <div>
            <h3 className="font-bold text-[#202622] mb-5" style={{ fontFamily: 'Poppins', fontSize: '1.1rem' }}>
              Achievements
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {BADGES.map(badge => (
                <Card
                  key={badge.label}
                  className={`p-5 flex flex-col items-center text-center gap-3 ${!badge.earned ? 'opacity-50 grayscale' : ''}`}
                >
                  <div className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ background: badge.earned ? '#FFF5DC' : '#F5F5F5' }}>
                    {badge.icon}
                  </div>
                  <div>
                    <p className="font-bold text-[#202622] text-sm" style={{ fontFamily: 'Poppins' }}>{badge.label}</p>
                    <p className="text-[#5B6660] text-xs mt-1 leading-snug">{badge.desc}</p>
                  </div>
                  {!badge.earned && (
                    <span className="text-[10px] font-semibold text-[#5B6660] bg-[#E4E0D3] px-2 py-0.5 rounded-full">Locked</span>
                  )}
                </Card>
              ))}
            </div>
          </div>

          {/* Session history */}
          <div>
            <h3 className="font-bold text-[#202622] mb-5" style={{ fontFamily: 'Poppins', fontSize: '1.1rem' }}>
              Session History
            </h3>
            <Card padding={false} className="overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr style={{ background: '#FAF7EF' }}>
                    {['Date', 'Duration', 'Images', 'Focus Score', 'Track'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-[#5B6660] uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((row, i) => (
                    <tr key={row.id} className={`border-t border-[#E4E0D3] hover:bg-[#FAF7EF] transition-colors`}>
                      <td className="px-5 py-4 text-[#202622] text-sm font-medium">{row.date}</td>
                      <td className="px-5 py-4 text-[#5B6660] text-sm flex items-center gap-1">
                        <Clock size={12} /> {row.duration}
                      </td>
                      <td className="px-5 py-4 text-[#5B6660] text-sm">{row.imageCount} images</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 rounded-full bg-[#E4E0D3]">
                            <div className="h-1.5 rounded-full" style={{ width: `${row.focusScore}%`, background: '#4C8B5D' }} />
                          </div>
                          <span className="text-[#202622] text-sm font-semibold">{row.focusScore}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{ background: '#DCE8D8', color: '#285943' }}>
                          {row.track}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>

        </div>
      </div>
    </PageShell>
  );
}
