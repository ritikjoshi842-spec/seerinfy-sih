import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic, MicOff, Send, ChevronRight, ChevronDown, ChevronUp,
  Brain, Target, Smile, BarChart3, Loader2, ArrowLeft, Check
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';
import { PageShell } from '../components/common/PageShell';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { ProgressRing } from '../components/common/ProgressRing';
import { useSession } from '../context/PatientSessionContext';
import { imageService } from '../services/imageService';
import { mockAnalysisService } from '../services/mockAnalysisService';

// ─── Image Card ───────────────────────────────────────────────────────────────
function ImageCard({ image }) {
  if (!image) return (
    <div className="rounded-[24px] bg-[#F3F6F4] flex items-center justify-center border border-[#EAE8E3] w-full" style={{ aspectRatio: '4/3' }}>
      <div className="flex flex-col items-center gap-4 text-[#4A6B53] p-6 text-center">
        <Loader2 size={32} className="animate-spin opacity-50" />
        <p className="font-medium text-sm opacity-60">Preparing your image...</p>
      </div>
    </div>
  );

  return (
    <div className="w-full min-w-0 animate-fadeInUp delay-100">
      <div className="relative rounded-[24px] overflow-hidden shadow-[0_8px_24px_rgba(26,28,27,0.04)] border border-[#EAE8E3] w-full" style={{ aspectRatio: '4/3' }}>
        <img
          src={image.url}
          alt={image.caption}
          className="w-full h-full object-cover transition-transform duration-700 ease-out hover:scale-105"
        />
        {/* Overlay caption */}
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6"
          style={{ background: 'linear-gradient(to top, rgba(26,28,27,0.85) 0%, transparent 100%)' }}>
          <p className="text-white font-semibold text-base mb-1 capitalize truncate" style={{ fontFamily: 'Poppins' }}>{image.caption}</p>
          {image.photographer_profile_url ? (
            <p className="text-white/80 text-xs sm:text-sm truncate">
              Photo by <a href={image.photographer_profile_url} target="_blank" rel="noreferrer" className="underline hover:text-white">{image.location}</a> on <a href={image.unsplash_link} target="_blank" rel="noreferrer" className="underline hover:text-white">Unsplash</a>
            </p>
          ) : (
            <p className="text-white/80 text-xs sm:text-sm truncate">{image.location}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Response Input ───────────────────────────────────────────────────────────
function ResponseInput({ onSubmit, disabled }) {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef(null);

  const handleMic = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      // Simulate voice-to-text after 3 seconds
      setTimeout(() => {
        setText(prev => prev + (prev ? ' ' : '') + "I can see a classroom with children sitting at wooden desks. The teacher looks kind and patient. It reminds me of my school days back in the village.");
        setIsRecording(false);
      }, 3000);
    }
  };

  const handleSubmit = () => {
    if (text.trim().length < 5) return;
    onSubmit(text.trim());
  };

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      <div style={{ position: 'relative', width: '100%', marginBottom: '20px' }}>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          disabled={disabled || isRecording}
          placeholder="Describe what you see in the image... Take your time."
          rows={5}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '18px 56px 18px 18px',
            borderRadius: '16px',
            border: '1.5px solid #EAE8E3',
            backgroundColor: '#FDFBF7',
            color: '#1A1C1B',
            fontSize: '15px',
            lineHeight: 1.6,
            fontFamily: 'Inter, sans-serif',
            resize: 'none',
            outline: 'none',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          }}
          onFocus={e => { e.target.style.borderColor = '#4A6B53'; e.target.style.boxShadow = '0 0 0 3px rgba(74, 107, 83, 0.12)'; }}
          onBlur={e => { e.target.style.borderColor = '#EAE8E3'; e.target.style.boxShadow = 'none'; }}
        />
        {/* Mic button */}
        <button
          type="button"
          onClick={handleMic}
          disabled={disabled}
          style={{
            position: 'absolute',
            right: '12px',
            top: '12px',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isRecording ? '#1A1C1B' : '#FFFFFF',
            color: isRecording ? '#FFFFFF' : '#4A6B53',
            border: '1px solid #EAE8E3',
            cursor: disabled ? 'not-allowed' : 'pointer',
            boxShadow: '0 2px 6px rgba(26,28,27,0.06)',
            transition: 'all 0.2s ease',
            outline: 'none',
          }}
          title={isRecording ? 'Stop recording' : 'Start voice input'}
        >
          {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
        </button>
      </div>

      {isRecording && (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
          color: '#1A1C1B',
          fontSize: '13px',
          fontWeight: 500,
          backgroundColor: '#F3F6F4',
          padding: '10px 16px',
          borderRadius: '12px',
          marginBottom: '16px',
        }}>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ width: '5px', height: `${8 + i * 4}px`, borderRadius: '999px', backgroundColor: '#4A6B53' }} />
            ))}
          </div>
          Listening… speak naturally
        </div>
      )}

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        paddingTop: '16px',
        borderTop: '1px solid #F2F0EB',
      }}>
        <span style={{ color: '#767A77', fontSize: '14px', fontWeight: 500 }}>
          {wordCount} {wordCount === 1 ? 'word' : 'words'}
        </span>
        <Button
          variant="primary"
          size="md"
          onClick={handleSubmit}
          disabled={disabled || text.trim().length < 5}
          icon={<Send size={16} />}
        >
          Analyze Response
        </Button>
      </div>
    </div>
  );
}

// ─── Analysis Panel ───────────────────────────────────────────────────────────
function AnalysisPanel({ analysis }) {
  const [open, setOpen] = useState(true);

  if (!analysis) return null;

  // Chart 1: Lexical Density
  const lexicalData = [
    { name: 'Keywords', value: analysis.lexical_density_pct },
    { name: 'Other Words', value: Number((100 - analysis.lexical_density_pct).toFixed(1)) }
  ];

  // Chart 2: Filler Word Ratio
  const fillerData = [
    { name: 'Filler Words', value: analysis.filler_word_pct },
    { name: 'Clean Speech', value: Number((100 - analysis.filler_word_pct).toFixed(1)) }
  ];

  // Chart 3: Final Score Composition
  const COMPLETENESS_WEIGHT = 0.4;
  const SEMANTIC_WEIGHT = 0.6;
  
  const compContrib = Number((COMPLETENESS_WEIGHT * analysis.lexical_density_pct).toFixed(1));
  const semContrib = Number((SEMANTIC_WEIGHT * analysis.weighted_relevance_pct).toFixed(1));
  const finalScore = analysis.final_score_pct;
  const remainder = Number((100 - finalScore).toFixed(1));

  const compositionData = [
    { name: 'Completeness', value: compContrib },
    { name: 'Semantic Relevance', value: semContrib },
    { name: 'Remainder', value: remainder }
  ];

  const COLORS_LEXICAL = ['#4A6B53', '#EAE8E3'];
  const COLORS_FILLER = ['#B3925B', '#4A6B53'];
  const COLORS_COMPOSITION = ['#4A6B53', '#738A7A', '#EAE8E3'];

  return (
    <Card padding={false} className="border-l-[6px] border-l-[#4A6B53] p-6 sm:p-8 lg:p-10 animate-fadeInUp w-full min-w-0 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left outline-none"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#F3F6F4] flex items-center justify-center shrink-0">
            <BarChart3 size={18} color="#4A6B53" />
          </div>
          <span className="font-bold text-[#1A1C1B] text-lg sm:text-xl" style={{ fontFamily: 'Poppins' }}>Cognitive Analysis</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-[#FDFBF7] border border-[#EAE8E3] flex items-center justify-center shrink-0">
          {open ? <ChevronUp size={16} color="#767A77" /> : <ChevronDown size={16} color="#767A77" />}
        </div>
      </button>

      {open && (
        <div className="mt-8 space-y-8 animate-fadeInUp w-full min-w-0">
          {/* Encouragement */}
          <div className="p-5 rounded-[16px] bg-[#F3F6F4] border border-[#E6EBE7]">
            <p className="text-[#2C4233] font-medium text-sm sm:text-base leading-relaxed">
              <SparklesIcon className="inline mr-2 -mt-1 text-[#4A6B53]" size={16} />
              {analysis.encouragement}
            </p>
          </div>

          {/* Real Pie Charts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 justify-items-center w-full">
            {/* Chart 1 */}
            <div className="flex flex-col items-center w-full">
              <h4 className="text-xs font-bold text-[#767A77] uppercase tracking-wider mb-2 text-center">Lexical Density</h4>
              <PieChart width={140} height={140}>
                <Pie data={lexicalData} cx="50%" cy="50%" innerRadius={42} outerRadius={58} dataKey="value" stroke="none">
                  {lexicalData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS_LEXICAL[index % COLORS_LEXICAL.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
              <div className="text-center mt-1">
                <span className="text-xl font-bold text-[#1A1C1B]">{analysis.lexical_density_pct}%</span>
              </div>
            </div>

            {/* Chart 2 */}
            <div className="flex flex-col items-center w-full">
              <h4 className="text-xs font-bold text-[#767A77] uppercase tracking-wider mb-2 text-center">Filler Ratio</h4>
              <PieChart width={140} height={140}>
                <Pie data={fillerData} cx="50%" cy="50%" innerRadius={42} outerRadius={58} dataKey="value" stroke="none">
                  {fillerData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS_FILLER[index % COLORS_FILLER.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
              <div className="text-center mt-1">
                <span className="text-xl font-bold text-[#1A1C1B]">{analysis.filler_word_pct}%</span>
              </div>
            </div>

            {/* Chart 3 */}
            <div className="flex flex-col items-center w-full">
              <h4 className="text-xs font-bold text-[#767A77] uppercase tracking-wider mb-2 text-center">Final Score</h4>
              <PieChart width={140} height={140}>
                <Pie data={compositionData} cx="50%" cy="50%" innerRadius={42} outerRadius={58} dataKey="value" stroke="none">
                  {compositionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS_COMPOSITION[index % COLORS_COMPOSITION.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
              <div className="text-center mt-1">
                <span className="text-xl font-bold text-[#1A1C1B]">{analysis.final_score_pct}%</span>
              </div>
            </div>
          </div>

          {/* Key themes */}
          <div>
            <p className="text-xs font-bold text-[#767A77] uppercase tracking-wider mb-3">Key Themes Detected</p>
            <div className="flex flex-wrap gap-2">
              {analysis.keyThemes.map((theme, i) => (
                <span key={i} className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-[#FDFBF7] text-[#4A6B53] border border-[#EAE8E3]">
                  {theme}
                </span>
              ))}
            </div>
          </div>

          {/* Cognitive markers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-[#F2F0EB]">
            {Object.entries(analysis.cognitiveMarkers).map(([key, val]) => (
              <div key={key} className="flex items-center gap-2.5 p-3 rounded-[14px] min-w-0"
                style={{ background: val ? '#F3F6F4' : '#FDFBF7', border: '1px solid #EAE8E3' }}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0`}
                  style={{ background: val ? '#4A6B53' : '#EAE8E3', color: val ? 'white' : '#A3A8A5' }}>
                  {val ? <Check size={10} strokeWidth={4} /> : <div className="w-1 h-1 rounded-full bg-current" />}
                </div>
                <span className="text-[#1A1C1B] text-xs font-semibold capitalize truncate">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function SparklesIcon(props) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>;
}

// ─── Therapy Session Page ─────────────────────────────────────────────────────
export function TherapySessionPage() {
  const { session, updateSession } = useSession();
  const navigate = useNavigate();
  const [image, setImage] = useState(session.currentImage || null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(session.analysis || null);
  const [sessionCount, setSessionCount] = useState((session.imageIndex || 0) + 1);

  const mapBackendImage = (data) => ({
    url: data.image_url,
    caption: data.category.replace('_', ' ') + ' memory',
    location: data.photographer_name,
    year: '',
    prompt: data.caption,
    photographer_profile_url: data.photographer_profile_url,
    unsplash_link: data.unsplash_link
  });

  useEffect(() => {
    let isMounted = true;
    const isMockFallback = session.currentImage?.url === '/assets/game-visual-match.jpg';
    if (((session.imageIndex || 0) === 0 && !session.backendSessionId) || isMockFallback) {
      imageService.startSession(session.profile || {}).then(data => {
        if (!isMounted) return;
        updateSession({ backendSessionId: data.session_id });
        const imgData = mapBackendImage(data);
        setImage(imgData);
        updateSession({ currentImage: imgData });
      }).catch(err => {
        console.error("Backend session start failed, falling back to mock:", err);
        if (!isMounted) return;
        const fallbackImg = {
          url: '/assets/game-visual-match.jpg',
          caption: 'Village Classroom memory',
          location: 'Serenify Memory Archive',
          year: '1985',
          prompt: 'Look at the classroom setting. Do you recall your favorite subject or teacher in school?',
          photographer_profile_url: '',
          unsplash_link: ''
        };
        setImage(fallbackImg);
        updateSession({ currentImage: fallbackImg });
      });
    }
    return () => { isMounted = false; };
  }, [session.imageIndex, updateSession, session.profile, session.backendSessionId, session.currentImage?.url]);

  const handleAnalyze = async (response) => {
    setAnalyzing(true);
    setAnalysis(null);
    updateSession({ response });
    try {
      const result = await imageService.analyzeDescription(session.backendSessionId, response);
      setAnalysis(result);
      updateSession({ analysis: result });
    } catch (e) {
      console.error("Backend analyze failed, falling back to mockAnalysisService:", e);
      try {
        const mockResult = await mockAnalysisService.analyze(response);
        const mappedResult = {
          encouragement: mockResult.encouragement,
          lexical_density_pct: 68,
          filler_word_pct: 12,
          weighted_relevance_pct: 85,
          final_score_pct: Math.round(0.4 * 68 + 0.6 * 85),
          keyThemes: mockResult.keyThemes,
          cognitiveMarkers: mockResult.cognitiveMarkers
        };
        setAnalysis(mappedResult);
        updateSession({ analysis: mappedResult });
      } catch (err) {
        console.error(err);
      }
    }
    setAnalyzing(false);
  };

  const handleNext = async () => {
    setAnalysis(null);
    setSessionCount(c => c + 1);
    try {
      const data = await imageService.nextImage(session.backendSessionId, session.response || "");
      const imgData = mapBackendImage(data);
      setImage(imgData);
      updateSession({ imageIndex: (session.imageIndex || 0) + 1, analysis: null, currentImage: imgData });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <PageShell noFooter>
      <div style={{ minHeight: 'calc(100vh - 80px)', padding: '40px 0 80px', background: '#FDFBF7' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 24px', boxSizing: 'border-box' }}>

          {/* Header row */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            marginBottom: '32px',
          }}>
            <button
              type="button"
              onClick={() => navigate('/')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: '#767A77',
                fontWeight: 500,
                fontSize: '14px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#1A1C1B'}
              onMouseLeave={e => e.currentTarget.style.color = '#767A77'}
            >
              <ArrowLeft size={18} /> Exit Session
            </button>
            <div style={{
              padding: '6px 20px',
              borderRadius: '999px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #EAE8E3',
              boxShadow: '0 2px 6px rgba(26,28,27,0.04)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <span style={{ color: '#767A77', fontSize: '13px', fontWeight: 500 }}>Session Progress</span>
              <span style={{ color: '#1A1C1B', fontWeight: 700, fontSize: '14px', fontFamily: 'Poppins, sans-serif' }}>{sessionCount} / 5</span>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <span style={{ color: '#767A77', fontWeight: 500 }}>Track</span>
              <span style={{
                padding: '4px 14px',
                borderRadius: '999px',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                backgroundColor: '#F3F6F4',
                color: '#4A6B53',
                border: '1px solid #E6EBE7',
              }}>
                {session.track || 'Alzheimer\'s'}
              </span>
            </div>
          </div>

          <div className="session-grid">
            {/* Left: sidebar */}
            <aside style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', minWidth: 0 }}>
              {/* Patient info */}
              <Card style={{ padding: '20px 24px', boxSizing: 'border-box' }} className="w-full min-w-0">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    backgroundColor: '#F3F6F4',
                    border: '1px solid #EAE8E3',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <span style={{ fontSize: '17px', fontWeight: 700, color: '#4A6B53', fontFamily: 'Poppins, sans-serif' }}>
                      {session.profile?.name?.[0] || 'P'}
                    </span>
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontWeight: 700, color: '#1A1C1B', fontSize: '15px', fontFamily: 'Poppins, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                      {session.profile?.name || 'Patient Profile'}
                    </p>
                    <p style={{ color: '#767A77', fontSize: '13px', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                      {session.profile?.age ? `Age ${session.profile.age}` : ''}
                      {session.profile?.caregiverName ? ` · Caregiver: ${session.profile.caregiverName}` : ''}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Image card */}
              <ImageCard image={image} />

              {/* Prompt */}
              {image && (
                <Card
                  style={{
                    padding: '24px',
                    backgroundColor: '#FDFBF7',
                    border: '1px solid #EAE8E3',
                    boxShadow: 'none',
                    boxSizing: 'border-box',
                  }}
                  className="w-full min-w-0"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#E6EBE7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <SparklesIcon size={14} className="text-[#4A6B53]" />
                    </div>
                    <p style={{ fontSize: '11px', fontWeight: 700, color: '#767A77', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Focus Prompt</p>
                  </div>
                  <p style={{ color: '#1A1C1B', fontSize: '15px', lineHeight: 1.6, fontFamily: 'Poppins, sans-serif', wordBreak: 'break-word', margin: 0 }}>{image.prompt}</p>
                </Card>
              )}
            </aside>

            {/* Right: main area */}
            <main style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', minWidth: 0 }}>
              {/* Response input */}
              <Card
                style={{ padding: '36px 32px', boxSizing: 'border-box' }}
                className="w-full min-w-0"
              >
                <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '26px', fontWeight: 700, color: '#1A1C1B', letterSpacing: '-0.02em', lineHeight: 1.25, marginBottom: '10px', wordBreak: 'break-word' }}>
                  Share what you see
                </h2>
                <p style={{ color: '#767A77', fontSize: '15px', lineHeight: 1.6, marginBottom: '24px', wordBreak: 'break-word' }}>
                  Take a moment to observe the image. Describe the details, the setting, or any memories it brings to mind.
                </p>
                <ResponseInput onSubmit={handleAnalyze} disabled={analyzing} />
              </Card>

              {/* Analyzing state */}
              {analyzing && (
                <Card
                  style={{ padding: '24px 32px', display: 'flex', alignItems: 'center', gap: '16px', boxSizing: 'border-box' }}
                  className="w-full min-w-0 animate-fadeInUp"
                >
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#F3F6F4', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #EAE8E3', flexShrink: 0 }}>
                    <Loader2 size={22} className="text-[#4A6B53] animate-spin" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontWeight: 700, color: '#1A1C1B', fontSize: '15px', marginBottom: '2px', fontFamily: 'Poppins, sans-serif', margin: 0 }}>Analyzing your response…</p>
                    <p style={{ color: '#767A77', fontSize: '13px', margin: 0 }}>Our AI is gently reviewing your words. Just a moment.</p>
                  </div>
                </Card>
              )}

              {/* Analysis panel */}
              {analysis && <AnalysisPanel analysis={analysis} />}

              {/* Next image button */}
              {analysis && !analyzing && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }} className="animate-fadeInUp">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleNext}
                    iconRight={<ChevronRight size={20} />}
                  >
                    Continue to Next Image
                  </Button>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
