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
  { icon: <Star size={24} fill="#B3925B" color="#B3925B" />, label: '5-Day Streak', desc: 'Played 5 days in a row!', earned: true },
  { icon: <Zap size={24} fill="#738A7A" color="#738A7A" />, label: 'Quick Thinker', desc: 'Responded in under 30 seconds.', earned: true },
  { icon: <Flame size={24} fill="#4A6B53" color="#4A6B53" />, label: 'On Fire!', desc: 'Scored 80%+ three sessions in a row.', earned: false },
  { icon: <Award size={24} fill="#2C4233" color="#2C4233" />, label: 'Memory Champ', desc: '10 sessions completed.', earned: false },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#FDFBF7] border border-[#EAE8E3] rounded-xl p-5 shadow-[0_8px_24px_rgba(26,28,27,0.06)] text-sm">
        <p className="font-semibold text-[#1A1C1B] mb-2" style={{ fontFamily: 'Poppins' }}>{label}</p>
        {payload.map(p => (
          <p key={p.dataKey} style={{ color: p.color }} className="mb-1">
            {p.name}: <strong className="font-bold">{p.value}%</strong>
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
      <div className="min-h-[calc(100vh-80px)] py-16 lg:py-24" style={{ background: '#FDFBF7' }}>
        <div className="content-wrap max-w-7xl space-y-20">

          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 animate-fadeInUp">
            <div>
              <SectionHeading
                label="PROGRESS DASHBOARD"
                title="Your Growth Journey"
                subtitle="Every session brings you closer. Here's how you're doing over time."
                align="left"
              />
            </div>
            <Button variant="primary" size="lg" onClick={() => navigate('/session')} iconRight={<ArrowRight size={20} />}>
              Start New Session
            </Button>
          </div>

          {/* Stats cards */}
          {monthly && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 animate-fadeInUp delay-100">
              {[
                { label: 'Sessions', value: monthly.sessionsCompleted, icon: <Calendar size={24} />, color: '#4A6B53', bg: '#F3F6F4', unit: '' },
                { label: 'Streak', value: monthly.streak, icon: <Flame size={24} />, color: '#738A7A', bg: '#F0F4F1', unit: ' days' },
                { label: 'Focus', value: `+${monthly.focusChange}`, icon: <TrendingUp size={24} />, color: '#2C4233', bg: '#E6EBE7', unit: '%' },
                { label: 'Memory', value: `+${monthly.memoryChange}`, icon: <Star size={24} />, color: '#B3925B', bg: '#FDFBF7', unit: '%' },
              ].map((stat, i) => (
                <Card key={stat.label} className="p-8 flex items-center gap-6 border-none shadow-[0_8px_32px_rgba(26,28,27,0.03)] bg-white"
                  style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border border-[#EAE8E3]" style={{ background: stat.bg, color: stat.color }}>
                    {stat.icon}
                  </div>
                  <div>
                    <p className="font-bold text-[#1A1C1B] text-3xl leading-none tracking-tight" style={{ fontFamily: 'Poppins' }}>
                      {stat.value}<span className="text-xl font-medium">{stat.unit}</span>
                    </p>
                    <p className="text-[#767A77] text-sm mt-2 font-medium">{stat.label}</p>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Chart + rings row */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-12 animate-fadeInUp delay-200">
            {/* Area chart */}
            <Card className="xl:col-span-2 p-10 lg:p-12 border-none shadow-[0_16px_40px_rgba(26,28,27,0.03)] bg-white">
              <h3 className="font-bold text-[#1A1C1B] text-2xl mb-10" style={{ fontFamily: 'Poppins' }}>
                Weekly Performance
              </h3>
              {weeklyData.length > 0 && (
                <div style={{ width: '100%', height: 320 }}>
                  <ResponsiveContainer>
                    <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="focusGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4A6B53" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#4A6B53" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="memoryGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#738A7A" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#738A7A" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" stroke="#EAE8E3" vertical={false} />
                      <XAxis dataKey="day" tick={{ fill: '#767A77', fontSize: 13, fontWeight: 500 }} axisLine={false} tickLine={false} dy={16} />
                      <YAxis domain={[40, 100]} tick={{ fill: '#767A77', fontSize: 13, fontWeight: 500 }} axisLine={false} tickLine={false} dx={-16} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 14, color: '#767A77', fontWeight: 500, paddingTop: '24px' }} iconType="circle" />
                      <Area type="monotone" dataKey="focus" name="Focus" stroke="#4A6B53" strokeWidth={3} fill="url(#focusGrad)" dot={{ fill: '#FDFBF7', stroke: '#4A6B53', strokeWidth: 2, r: 5 }} activeDot={{ r: 7, fill: '#4A6B53', stroke: '#FDFBF7' }} />
                      <Area type="monotone" dataKey="memory" name="Memory" stroke="#738A7A" strokeWidth={3} fill="url(#memoryGrad)" dot={{ fill: '#FDFBF7', stroke: '#738A7A', strokeWidth: 2, r: 5 }} activeDot={{ r: 7, fill: '#738A7A', stroke: '#FDFBF7' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            {/* Progress rings */}
            <Card className="p-10 lg:p-12 flex flex-col items-center justify-center gap-12 border border-[#EAE8E3] bg-[#FDFBF7] shadow-none">
              <h3 className="font-bold text-[#1A1C1B] text-2xl self-start w-full" style={{ fontFamily: 'Poppins' }}>
                This Month
              </h3>
              <div className="flex flex-col gap-10 items-center w-full">
                <ProgressRing percent={78} size={160} strokeWidth={12} color="#4A6B53" label="Focus" sublabel="+18% vs last month" />
                <div className="w-full h-px bg-[#EAE8E3]" />
                <ProgressRing percent={65} size={160} strokeWidth={12} color="#738A7A" label="Memory" sublabel="+12% vs last month" />
              </div>
            </Card>
          </div>

          {/* Badges */}
          <div className="animate-fadeInUp delay-300">
            <h3 className="font-bold text-[#1A1C1B] text-2xl mb-8" style={{ fontFamily: 'Poppins' }}>
              Achievements
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {BADGES.map((badge, i) => (
                <Card
                  key={badge.label}
                  className={`p-8 flex flex-col items-center text-center gap-5 border-none shadow-[0_8px_24px_rgba(26,28,27,0.03)] bg-white
                    ${!badge.earned ? 'opacity-60 grayscale' : ''}`}
                >
                  <div className="w-16 h-16 rounded-full flex items-center justify-center border border-[#EAE8E3]"
                    style={{ background: badge.earned ? '#FDFBF7' : '#F5F3EC' }}>
                    {badge.icon}
                  </div>
                  <div>
                    <p className="font-bold text-[#1A1C1B] text-lg" style={{ fontFamily: 'Poppins' }}>{badge.label}</p>
                    <p className="text-[#767A77] text-sm mt-2 leading-relaxed">{badge.desc}</p>
                  </div>
                  {!badge.earned && (
                    <span className="text-[11px] font-bold tracking-wider text-[#A3A8A5] uppercase mt-2">Locked</span>
                  )}
                </Card>
              ))}
            </div>
          </div>

          {/* Session history */}
          <div className="animate-fadeInUp delay-400">
            <h3 className="font-bold text-[#1A1C1B] text-2xl mb-8" style={{ fontFamily: 'Poppins' }}>
              Session History
            </h3>
            <Card padding={false} className="overflow-hidden border border-[#EAE8E3] shadow-none bg-white">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr style={{ background: '#FDFBF7' }} className="border-b border-[#EAE8E3]">
                      {['Date', 'Duration', 'Images', 'Focus Score', 'Track'].map(h => (
                        <th key={h} className="text-left px-8 py-5 text-sm font-bold text-[#767A77] uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((row, i) => (
                      <tr key={row.id} className={`border-b border-[#EAE8E3] last:border-0 hover:bg-[#FDFBF7] transition-colors`}>
                        <td className="px-8 py-6 text-[#1A1C1B] text-base font-semibold">{row.date}</td>
                        <td className="px-8 py-6 text-[#767A77] text-base font-medium flex items-center gap-2">
                          <Clock size={16} className="text-[#A3A8A5]" /> {row.duration}
                        </td>
                        <td className="px-8 py-6 text-[#767A77] text-base font-medium">{row.imageCount} images</td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-32 h-2 rounded-full bg-[#EAE8E3]">
                              <div className="h-2 rounded-full" style={{ width: `${row.focusScore}%`, background: '#4A6B53' }} />
                            </div>
                            <span className="text-[#1A1C1B] text-base font-bold">{row.focusScore}%</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
                            style={{ background: '#F3F6F4', color: '#4A6B53', border: '1px solid #EAE8E3' }}>
                            {row.track}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

        </div>
      </div>
    </PageShell>
  );
}
