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
    <div className="rounded-[24px] bg-[#F3F6F4] flex items-center justify-center border border-[#EAE8E3]" style={{ aspectRatio: '4/3' }}>
      <div className="flex flex-col items-center gap-4 text-[#4A6B53]">
        <Loader2 size={32} className="animate-spin opacity-50" />
        <p className="font-medium text-sm opacity-60">Preparing your image...</p>
      </div>
    </div>
  );

  return (
    <div className="relative group animate-fadeInUp delay-100">
      <div className="rounded-[24px] overflow-hidden shadow-[0_8px_24px_rgba(26,28,27,0.04)] border border-[#EAE8E3]" style={{ aspectRatio: '4/3' }}>
        <img
          src={image.url}
          alt={image.caption}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        {/* Overlay caption */}
        <div className="absolute bottom-0 left-0 right-0 p-6"
          style={{ background: 'linear-gradient(to top, rgba(26,28,27,0.8) 0%, transparent 100%)' }}>
          <p className="text-white font-semibold text-base mb-1 capitalize" style={{ fontFamily: 'Poppins' }}>{image.caption}</p>
          {image.photographer_profile_url ? (
            <p className="text-white/80 text-sm">
              Photo by <a href={image.photographer_profile_url} target="_blank" rel="noreferrer" className="underline hover:text-white">{image.location}</a> on <a href={image.unsplash_link} target="_blank" rel="noreferrer" className="underline hover:text-white">Unsplash</a>
            </p>
          ) : (
            <p className="text-white/80 text-sm">{image.location}</p>
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
    <div className="space-y-6">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          disabled={disabled || isRecording}
          placeholder="Describe what you see in the image... Take your time."
          rows={6}
          className="w-full px-6 py-6 pr-16 rounded-[20px] border border-[#EAE8E3] bg-[#FDFBF7]
            text-[#1A1C1B] leading-relaxed resize-none
            focus:outline-none focus:border-[#4A6B53] focus:ring-4 focus:ring-[#4A6B53]/10
            transition-all duration-300 disabled:opacity-50"
          style={{ fontSize: '1.1rem', fontFamily: 'Inter' }}
        />
        {/* Mic button */}
        <button
          onClick={handleMic}
          disabled={disabled}
          className={`
            absolute right-4 top-4 w-12 h-12 rounded-full flex items-center justify-center
            transition-all duration-300 focus:outline-none shadow-sm
            ${isRecording
              ? 'bg-[#1A1C1B] text-white' // Replaced red recording with deep charcoal
              : 'bg-white text-[#4A6B53] border border-[#EAE8E3] hover:bg-[#F3F6F4]'
            }
          `}
          title={isRecording ? 'Stop recording' : 'Start voice input'}
        >
          {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
        </button>
      </div>

      {isRecording && (
        <div className="flex items-center gap-3 text-[#1A1C1B] text-sm font-medium bg-[#F3F6F4] p-4 rounded-xl w-fit">
          <div className="flex gap-1.5 items-center">
            {[1,2,3].map(i => (
              <div key={i} className="w-1.5 rounded-full bg-[#4A6B53]"
                style={{ height: `${8 + i * 4}px`, animation: `pulse-ring 0.8s ease-in-out ${i * 0.15}s infinite` }} />
            ))}
          </div>
          Listening… speak naturally
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-[#F2F0EB]">
        <span className="text-[#767A77] text-sm font-medium">
          {wordCount} {wordCount === 1 ? 'word' : 'words'}
        </span>
        <Button
          variant="primary"
          size="lg"
          onClick={handleSubmit}
          disabled={disabled || text.trim().length < 5}
          icon={<Send size={18} />}
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
    <Card className="border-l-[6px] border-l-[#4A6B53] p-8 lg:p-12 animate-fadeInUp">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left outline-none"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#F3F6F4] flex items-center justify-center">
            <BarChart3 size={20} color="#4A6B53" />
          </div>
          <span className="font-bold text-[#1A1C1B] text-xl" style={{ fontFamily: 'Poppins' }}>Cognitive Analysis</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-[#FDFBF7] border border-[#EAE8E3] flex items-center justify-center">
          {open ? <ChevronUp size={16} color="#767A77" /> : <ChevronDown size={16} color="#767A77" />}
        </div>
      </button>

      {open && (
        <div className="mt-10 space-y-10 animate-fadeInUp">
          {/* Encouragement */}
          <div className="p-6 rounded-[16px] bg-[#F3F6F4] border border-[#E6EBE7]">
            <p className="text-[#2C4233] font-medium text-base leading-relaxed">
              <SparklesIcon className="inline mr-2 -mt-1 text-[#4A6B53]" size={18} />
              {analysis.encouragement}
            </p>
          </div>

          {/* Real Pie Charts */}
          <div className="flex flex-col md:flex-row justify-around gap-8">
            {/* Chart 1 */}
            <div className="flex flex-col items-center">
              <h4 className="text-sm font-bold text-[#767A77] uppercase tracking-wider mb-2">Lexical Density</h4>
              <PieChart width={200} height={200}>
                <Pie data={lexicalData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value" stroke="none">
                  {lexicalData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS_LEXICAL[index % COLORS_LEXICAL.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
              <div className="text-center mt-2">
                <span className="text-2xl font-bold text-[#1A1C1B]">{analysis.lexical_density_pct}%</span>
              </div>
            </div>

            {/* Chart 2 */}
            <div className="flex flex-col items-center">
              <h4 className="text-sm font-bold text-[#767A77] uppercase tracking-wider mb-2">Filler Ratio</h4>
              <PieChart width={200} height={200}>
                <Pie data={fillerData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value" stroke="none">
                  {fillerData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS_FILLER[index % COLORS_FILLER.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
              <div className="text-center mt-2">
                <span className="text-2xl font-bold text-[#1A1C1B]">{analysis.filler_word_pct}%</span>
              </div>
            </div>

            {/* Chart 3 */}
            <div className="flex flex-col items-center">
              <h4 className="text-sm font-bold text-[#767A77] uppercase tracking-wider mb-2">Final Score</h4>
              <PieChart width={200} height={200}>
                <Pie data={compositionData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value" stroke="none">
                  {compositionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS_COMPOSITION[index % COLORS_COMPOSITION.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
              <div className="text-center mt-2">
                <span className="text-2xl font-bold text-[#1A1C1B]">{analysis.final_score_pct}%</span>
              </div>
            </div>
          </div>

          {/* Key themes */}
          <div>
            <p className="text-sm font-bold text-[#767A77] uppercase tracking-wider mb-4">Key Themes Detected</p>
            <div className="flex flex-wrap gap-3">
              {analysis.keyThemes.map((theme, i) => (
                <span key={i} className="px-4 py-2 rounded-full text-sm font-medium bg-[#FDFBF7] text-[#4A6B53] border border-[#EAE8E3]">
                  {theme}
                </span>
              ))}
            </div>
          </div>

          {/* Cognitive markers */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-[#F2F0EB]">
            {Object.entries(analysis.cognitiveMarkers).map(([key, val]) => (
              <div key={key} className="flex items-center gap-3 p-4 rounded-[16px]"
                style={{ background: val ? '#F3F6F4' : '#FDFBF7', border: '1px solid #EAE8E3' }}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0`}
                  style={{ background: val ? '#4A6B53' : '#EAE8E3', color: val ? 'white' : '#A3A8A5' }}>
                  {val ? <Check size={12} strokeWidth={4} /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                </div>
                <span className="text-[#1A1C1B] text-xs font-semibold capitalize leading-tight">
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
    if ((session.imageIndex || 0) === 0 && !session.backendSessionId) {
      imageService.startSession(session.profile || {}).then(data => {
        if (!isMounted) return;
        updateSession({ backendSessionId: data.session_id });
        const imgData = mapBackendImage(data);
        setImage(imgData);
        updateSession({ currentImage: imgData });
      }).catch(console.error);
    }
    return () => { isMounted = false; };
  }, [session.imageIndex, updateSession, session.profile, session.backendSessionId]); // Run on mount

  const handleAnalyze = async (response) => {
    setAnalyzing(true);
    setAnalysis(null);
    updateSession({ response });
    try {
      const result = await imageService.analyzeDescription(session.backendSessionId, response);
      setAnalysis(result);
      updateSession({ analysis: result });
    } catch (e) {
      console.error(e);
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
      <div className="min-h-[calc(100vh-80px)] py-16 lg:py-24" style={{ background: '#FDFBF7' }}>
        <div className="content-wrap max-w-7xl">

          {/* Header row */}
          <div className="flex flex-wrap items-center justify-between mb-16 gap-6">
            <button onClick={() => navigate('/')}
              className="flex items-center gap-2 text-[#767A77] hover:text-[#1A1C1B] font-medium text-base transition-colors duration-300">
              <ArrowLeft size={20} /> Exit Session
            </button>
            <div className="text-center px-6 py-2 rounded-full bg-white border border-[#EAE8E3] shadow-sm">
              <span className="text-[#767A77] text-sm font-medium">Session Progress</span>
              <span className="text-[#1A1C1B] font-bold ml-3" style={{ fontFamily: 'Poppins' }}>{sessionCount} / 5</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-[#767A77] font-medium">Track</span>
              <span className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
                style={{ background: '#F3F6F4', color: '#4A6B53', border: '1px solid #E6EBE7' }}>
                {session.track || 'Alzheimer\'s'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 lg:gap-16">
            {/* Left: sidebar */}
            <aside className="xl:col-span-5 space-y-8">
              {/* Patient info */}
              <Card className="p-8 border-none shadow-[0_4px_16px_rgba(26,28,27,0.03)] bg-white">
                <div className="flex items-center gap-5 mb-6">
                  <div className="w-14 h-14 rounded-full bg-[#F3F6F4] flex items-center justify-center border border-[#EAE8E3]">
                    <span className="text-xl font-bold text-[#4A6B53]" style={{ fontFamily: 'Poppins' }}>
                      {session.profile?.name?.[0] || 'P'}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-[#1A1C1B] text-lg" style={{ fontFamily: 'Poppins' }}>
                      {session.profile?.name || 'Patient Profile'}
                    </p>
                    <p className="text-[#767A77] text-sm mt-1">
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
                <Card className="p-8 border-[#EAE8E3] bg-[#FDFBF7] shadow-none">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-[#E6EBE7] flex items-center justify-center">
                      <SparklesIcon size={14} className="text-[#4A6B53]" />
                    </div>
                    <p className="text-xs font-bold text-[#767A77] uppercase tracking-widest">Focus Prompt</p>
                  </div>
                  <p className="text-[#1A1C1B] leading-relaxed text-lg" style={{ fontFamily: 'Poppins' }}>{image.prompt}</p>
                </Card>
              )}
            </aside>

            {/* Right: main area */}
            <main className="xl:col-span-7 space-y-12">
              {/* Response input */}
              <Card className="p-10 lg:p-12 shadow-[0_16px_40px_rgba(26,28,27,0.04)] border-none">
                <h2 className="font-bold text-[#1A1C1B] text-3xl mb-3" style={{ fontFamily: 'Poppins', letterSpacing: '-0.02em' }}>
                  Share what you see
                </h2>
                <p className="text-[#767A77] text-base mb-10 leading-relaxed">
                  Take a moment to observe the image. Describe the details, the setting, or any memories it brings to mind.
                </p>
                <ResponseInput onSubmit={handleAnalyze} disabled={analyzing} />
              </Card>

              {/* Analyzing state */}
              {analyzing && (
                <Card className="p-10 flex items-center gap-6 animate-fadeInUp border-none shadow-[0_8px_24px_rgba(26,28,27,0.03)]">
                  <div className="w-14 h-14 rounded-full bg-[#F3F6F4] flex items-center justify-center shrink-0 border border-[#EAE8E3]">
                    <Loader2 size={24} className="text-[#4A6B53] animate-spin" />
                  </div>
                  <div>
                    <p className="font-bold text-[#1A1C1B] text-lg mb-1" style={{ fontFamily: 'Poppins' }}>Analyzing your response…</p>
                    <p className="text-[#767A77] text-base">Our AI is gently reviewing your words. Just a moment.</p>
                  </div>
                </Card>
              )}

              {/* Analysis panel */}
              {analysis && <AnalysisPanel analysis={analysis} />}

              {/* Next image button */}
              {analysis && !analyzing && (
                <div className="flex justify-end animate-fadeInUp pt-6">
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
