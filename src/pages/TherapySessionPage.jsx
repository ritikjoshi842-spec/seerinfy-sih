import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic, MicOff, Send, ChevronRight, ChevronDown, ChevronUp,
  Brain, Target, Smile, BarChart3, Loader2, ArrowLeft, Leaf
} from 'lucide-react';
import { PageShell } from '../components/common/PageShell';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { ProgressRing } from '../components/common/ProgressRing';
import { useSession } from '../context/PatientSessionContext';
import { mockImageService } from '../services/mockImageService';
import { mockAnalysisService } from '../services/mockAnalysisService';

// ─── Image Card ───────────────────────────────────────────────────────────────
function ImageCard({ image }) {
  if (!image) return (
    <div className="rounded-[20px] bg-[#DCE8D8] flex items-center justify-center" style={{ aspectRatio: '4/3' }}>
      <div className="flex flex-col items-center gap-3 text-[#285943]">
        <Leaf size={48} opacity={0.4} />
        <p className="font-medium text-sm opacity-60">Loading your image...</p>
      </div>
    </div>
  );

  return (
    <div className="relative group">
      <div className="rounded-[20px] overflow-hidden shadow-card" style={{ aspectRatio: '4/3' }}>
        <img
          src={image.url}
          alt={image.caption}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Overlay caption */}
        <div className="absolute bottom-0 left-0 right-0 p-4"
          style={{ background: 'linear-gradient(to top, rgba(32,38,34,0.8) 0%, transparent 100%)' }}>
          <p className="text-white font-semibold text-sm" style={{ fontFamily: 'Poppins' }}>{image.caption}</p>
          <p className="text-white/70 text-xs">{image.location}, {image.year}</p>
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
    <div className="space-y-3">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          disabled={disabled || isRecording}
          placeholder="Describe what you see in the image... What memories does it bring back?"
          rows={5}
          className="w-full px-4 py-4 pr-14 rounded-2xl border-2 border-[#E4E0D3] bg-white
            text-[#202622] leading-relaxed resize-none
            focus:outline-none focus:border-[#285943] focus:ring-2 focus:ring-[#285943]/20
            transition-all duration-200 disabled:opacity-60"
          style={{ fontSize: '1rem', fontFamily: 'Inter' }}
        />
        {/* Mic button */}
        <button
          onClick={handleMic}
          disabled={disabled}
          className={`
            absolute right-3 top-3 w-10 h-10 rounded-full flex items-center justify-center
            transition-all duration-200 focus:outline-none
            ${isRecording
              ? 'bg-[#C7654A] text-white animate-pulse-ring'
              : 'bg-[#DCE8D8] text-[#285943] hover:bg-[#285943] hover:text-white'
            }
          `}
          title={isRecording ? 'Stop recording' : 'Start voice input'}
        >
          {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
        </button>
      </div>

      {isRecording && (
        <div className="flex items-center gap-2 text-[#C7654A] text-sm font-medium">
          <div className="flex gap-1">
            {[1,2,3].map(i => (
              <div key={i} className="w-1 rounded-full bg-[#C7654A]"
                style={{ height: `${8 + i * 4}px`, animation: `pulse-ring 0.8s ease-in-out ${i * 0.15}s infinite` }} />
            ))}
          </div>
          Listening… speak naturally
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-[#5B6660] text-xs">
          {wordCount} {wordCount === 1 ? 'word' : 'words'} — aim for 20+ for best analysis
        </span>
        <Button
          variant="accent"
          size="md"
          onClick={handleSubmit}
          disabled={disabled || text.trim().length < 5}
          icon={<Send size={16} />}
        >
          Analyze My Answer
        </Button>
      </div>
    </div>
  );
}

// ─── Analysis Panel ───────────────────────────────────────────────────────────
function AnalysisPanel({ analysis }) {
  const [open, setOpen] = useState(true);

  if (!analysis) return null;

  const metrics = [
    { label: 'Focus', value: analysis.focusScore, icon: <Target size={16} />, color: '#285943' },
    { label: 'Memory', value: analysis.memoryScore, icon: <Brain size={16} />, color: '#5B3FA0' },
    { label: 'Sentiment', value: analysis.sentimentScore, icon: <Smile size={16} />, color: '#D6A84F' },
  ];

  return (
    <Card className="border-l-4 border-l-[#4C8B5D] animate-fadeInUp">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left"
      >
        <div className="flex items-center gap-2">
          <BarChart3 size={18} color="#285943" />
          <span className="font-bold text-[#202622]" style={{ fontFamily: 'Poppins' }}>Cognitive Analysis</span>
        </div>
        {open ? <ChevronUp size={18} color="#5B6660" /> : <ChevronDown size={18} color="#5B6660" />}
      </button>

      {open && (
        <div className="mt-5 space-y-5 animate-fadeInUp">
          {/* Encouragement */}
          <div className="p-4 rounded-xl" style={{ background: '#DCE8D8' }}>
            <p className="text-[#285943] font-semibold text-sm">🌿 {analysis.encouragement}</p>
          </div>

          {/* Score rings */}
          <div className="flex flex-wrap justify-around gap-4">
            {metrics.map(m => (
              <ProgressRing key={m.label} percent={m.value} size={90} strokeWidth={8} color={m.color} label={m.label} />
            ))}
          </div>

          {/* Key themes */}
          <div>
            <p className="text-xs font-semibold text-[#5B6660] uppercase tracking-wide mb-2">Key Themes Detected</p>
            <div className="flex flex-wrap gap-2">
              {analysis.keyThemes.map(theme => (
                <span key={theme} className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ background: '#DCE8D8', color: '#285943' }}>
                  {theme}
                </span>
              ))}
            </div>
          </div>

          {/* Cognitive markers */}
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(analysis.cognitiveMarkers).map(([key, val]) => (
              <div key={key} className="flex flex-col items-center gap-1 p-3 rounded-xl"
                style={{ background: val ? '#DCE8D8' : '#FEF0E7' }}>
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold`}
                  style={{ background: val ? '#285943' : '#C7654A', color: 'white' }}>
                  {val ? '✓' : '○'}
                </div>
                <span className="text-[#202622] text-[10px] font-semibold text-center capitalize leading-tight">
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

// ─── Therapy Session Page ─────────────────────────────────────────────────────
export function TherapySessionPage() {
  const { session, updateSession } = useSession();
  const navigate = useNavigate();
  const [image, setImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [sessionCount, setSessionCount] = useState(1);

  useEffect(() => {
    mockImageService.getImage(session.imageIndex || 0).then(img => {
      setImage(img);
      updateSession({ currentImage: img });
    });
  }, [session.imageIndex]);

  const handleAnalyze = async (response) => {
    setAnalyzing(true);
    setAnalysis(null);
    updateSession({ response });
    const result = await mockAnalysisService.analyze(response);
    setAnalysis(result);
    updateSession({ analysis: result });
    setAnalyzing(false);
  };

  const handleNext = () => {
    setAnalysis(null);
    setSessionCount(c => c + 1);
    updateSession({ imageIndex: (session.imageIndex || 0) + 1, analysis: null });
  };

  return (
    <PageShell noFooter>
      <div className="min-h-[calc(100vh-64px)] py-8" style={{ background: '#FAF7EF' }}>
        <div className="content-wrap">

          {/* Header row */}
          <div className="flex items-center justify-between mb-8">
            <button onClick={() => navigate('/')}
              className="flex items-center gap-2 text-[#5B6660] hover:text-[#285943] font-medium text-sm transition-colors">
              <ArrowLeft size={16} /> Back to Home
            </button>
            <div className="text-center">
              <span className="text-[#5B6660] text-sm">Session</span>
              <span className="text-[#285943] font-bold ml-2" style={{ fontFamily: 'Poppins' }}>#{sessionCount}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[#5B6660]">Track:</span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold capitalize"
                style={{ background: '#DCE8D8', color: '#285943' }}>
                {session.track || 'Alzheimer\'s'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Left: sidebar */}
            <aside className="lg:col-span-2 space-y-5">
              {/* Patient info */}
              <Card className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#DCE8D8] flex items-center justify-center">
                    <span className="font-bold text-[#285943]" style={{ fontFamily: 'Poppins' }}>
                      {session.profile?.name?.[0] || 'P'}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-[#202622]" style={{ fontFamily: 'Poppins' }}>
                      {session.profile?.name || 'Patient'}
                    </p>
                    <p className="text-[#5B6660] text-xs">
                      {session.profile?.age ? `Age ${session.profile.age}` : ''}
                      {session.profile?.caregiverName ? ` · Caregiver: ${session.profile.caregiverName}` : ''}
                    </p>
                  </div>
                </div>
                <div className="h-px bg-[#E4E0D3] mb-4" />
                <div className="flex justify-between items-center">
                  <span className="text-[#5B6660] text-sm">Images seen</span>
                  <span className="font-bold text-[#285943]" style={{ fontFamily: 'Poppins' }}>{sessionCount}</span>
                </div>
              </Card>

              {/* Image card */}
              <ImageCard image={image} />

              {/* Prompt */}
              {image && (
                <Card className="p-5" style={{ background: '#FAF7EF' }}>
                  <p className="text-xs font-semibold text-[#5B6660] uppercase tracking-wide mb-2">Your Prompt</p>
                  <p className="text-[#202622] leading-relaxed" style={{ fontSize: '1rem' }}>{image.prompt}</p>
                </Card>
              )}
            </aside>

            {/* Right: main area */}
            <main className="lg:col-span-3 space-y-5">
              {/* Response input */}
              <Card className="p-6">
                <h2 className="font-bold text-[#202622] text-xl mb-1" style={{ fontFamily: 'Poppins' }}>
                  Share what you see
                </h2>
                <p className="text-[#5B6660] text-sm mb-5">Type or use the microphone — take your time, there's no rush.</p>
                <ResponseInput onSubmit={handleAnalyze} disabled={analyzing} />
              </Card>

              {/* Analyzing state */}
              {analyzing && (
                <Card className="p-6 flex items-center gap-4 animate-fadeInUp">
                  <div className="w-10 h-10 rounded-full bg-[#DCE8D8] flex items-center justify-center shrink-0 animate-pulse-ring">
                    <Loader2 size={20} color="#285943" className="animate-spin" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#202622]" style={{ fontFamily: 'Poppins' }}>Analyzing your response…</p>
                    <p className="text-[#5B6660] text-sm">Our AI is gently reviewing your words. Just a moment.</p>
                  </div>
                </Card>
              )}

              {/* Analysis panel */}
              {analysis && <AnalysisPanel analysis={analysis} />}

              {/* Next image button */}
              {analysis && !analyzing && (
                <div className="flex justify-end animate-fadeInUp">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleNext}
                    iconRight={<ChevronRight size={18} />}
                  >
                    Next Image
                  </Button>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>

      {/* Floating mascot help */}
      <div
        className="fixed bottom-6 right-6 w-16 h-16 rounded-full overflow-hidden shadow-[0_4px_20px_rgba(32,38,34,0.2)] cursor-pointer hover:scale-105 transition-transform duration-200"
        title="Need help?"
      >
        <img src="/assets/mascot.png" alt="Help" className="w-full h-full object-cover object-top" />
      </div>
    </PageShell>
  );
}
