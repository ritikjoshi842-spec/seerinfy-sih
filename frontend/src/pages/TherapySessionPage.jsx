import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic, MicOff, Send, ChevronRight,
  Loader2, ArrowLeft, Sparkles
} from 'lucide-react';
import { PageShell } from '../components/common/PageShell';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { useSession } from '../context/PatientSessionContext';
import { imageService } from '../services/imageService';
import { AnalysisReport } from '../components/session/AnalysisReport';

// ─── Image Card ───────────────────────────────────────────────────────────────
function ImageCard({ image, onFallback }) {
  const [imgFailed, setImgFailed] = useState(false);
  const [isAttemptingFallback, setIsAttemptingFallback] = useState(false);

  useEffect(() => {
    setImgFailed(false);
    setIsAttemptingFallback(false);
  }, [image?.url]);

  if (!image) {
    return (
      <div
        className="rounded-[24px] bg-[#F3F6F4] flex items-center justify-center border border-[#EAE8E3] w-full"
        style={{ aspectRatio: '4/3' }}
      >
        <div className="flex flex-col items-center gap-4 text-[#4A6B53] p-6 text-center">
          <Loader2 size={32} className="animate-spin opacity-50" />
          <p className="font-medium text-sm opacity-60">Preparing your image...</p>
        </div>
      </div>
    );
  }

  const handleImageError = () => {
    if (imgFailed || isAttemptingFallback) return;
    setIsAttemptingFallback(true);
    if (onFallback) {
      onFallback(image);
    } else {
      setImgFailed(true);
    }
  };

  if (imgFailed) {
    return (
      <div
        className="rounded-[24px] bg-[#FDFBF7] flex flex-col items-center justify-center border border-[#EAE8E3] p-8 text-center w-full animate-fadeInUp"
        style={{ aspectRatio: '4/3' }}
      >
        <div className="w-12 h-12 rounded-full bg-[#F3F6F4] flex items-center justify-center text-[#4A6B53] mb-3">
          <Sparkles size={24} />
        </div>
        <h4 className="font-semibold text-base text-[#1A1C1B] mb-1 capitalize">
          {image.caption}
        </h4>
        <p className="text-xs text-[#767A77] max-w-xs mb-3">
          Visual memory representation safely loaded from Serenify Archive.
        </p>
        <span className="text-[11px] font-semibold text-[#4A6B53] bg-[#E6EBE7] px-3 py-1 rounded-full">
          Archive Reflection Mode
        </span>
      </div>
    );
  }

  const isUnsplash = image.unsplash_link && image.unsplash_link.includes('unsplash.com');
  const sourceLabel = isUnsplash ? 'Unsplash' : (image.provider === 'tinyfish' ? 'Web Archive' : 'Memory Archive');

  return (
    <div className="w-full min-w-0 animate-fadeInUp delay-100">
      <div
        className="relative rounded-[24px] overflow-hidden shadow-[0_8px_24px_rgba(26,28,27,0.04)] border border-[#EAE8E3] w-full"
        style={{ aspectRatio: '4/3' }}
      >
        <img
          src={image.url}
          alt={image.caption}
          onError={handleImageError}
          className="w-full h-full object-cover transition-transform duration-700 ease-out hover:scale-105"
        />
        {/* Overlay caption */}
        <div
          className="absolute bottom-0 left-0 right-0 p-5 sm:p-6"
          style={{ background: 'linear-gradient(to top, rgba(26,28,27,0.85) 0%, transparent 100%)' }}
        >
          <p
            className="text-white font-semibold text-base mb-1 capitalize truncate"
            style={{ fontFamily: 'Poppins' }}
          >
            {image.caption}
          </p>
          {image.photographer_profile_url ? (
            <p className="text-white/80 text-xs sm:text-sm truncate">
              Photo by{' '}
              <a
                href={image.photographer_profile_url}
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-white"
              >
                {image.location}
              </a>{' '}
              on{' '}
              <a
                href={image.unsplash_link || image.photographer_profile_url}
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-white"
              >
                {sourceLabel}
              </a>
            </p>
          ) : (
            <p className="text-white/80 text-xs sm:text-sm truncate">{image.location}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Response Input (Preserves typed text) ───────────────────────────────────
function ResponseInput({ text, setText, onSubmit, disabled }) {
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
          onFocus={e => {
            e.target.style.borderColor = '#4A6B53';
            e.target.style.boxShadow = '0 0 0 3px rgba(74, 107, 83, 0.12)';
          }}
          onBlur={e => {
            e.target.style.borderColor = '#EAE8E3';
            e.target.style.boxShadow = 'none';
          }}
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
            {[1, 2, 3].map(i => (
              <div
                key={i}
                style={{
                  width: '5px',
                  height: `${8 + i * 4}px`,
                  borderRadius: '999px',
                  backgroundColor: '#4A6B53'
                }}
              />
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

// ─── Therapy Session Page ─────────────────────────────────────────────────────
export function TherapySessionPage() {
  const { session, updateSession, resetSession } = useSession();
  const navigate = useNavigate();

  const [image, setImage] = useState(() => {
    if (session.currentImage?.url === '/assets/game-visual-match.jpg') {
      return null;
    }
    return session.currentImage || null;
  });

  const [inputText, setInputText] = useState(session.response || '');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(session.analysis || null);
  const [analysisError, setAnalysisError] = useState(null);
  const [sessionCount, setSessionCount] = useState((session.imageIndex || 0) + 1);

  const mapBackendImage = (data) => ({
    url: data.image_url,
    caption: (data.category || '').replace('_', ' ') + ' memory',
    location: data.photographer_name,
    year: '',
    prompt: data.caption,
    photographer_profile_url: data.photographer_profile_url,
    unsplash_link: data.unsplash_link,
    provider: data.provider || 'tinyfish',
    fallback_image_url: data.fallback_image_url,
    fallback_photographer_name: data.fallback_photographer_name,
    fallback_photographer_url: data.fallback_photographer_url,
    fallback_unsplash_link: data.fallback_unsplash_link,
  });

  const handleImageFallback = async (failedImg) => {
    // 1. If pre-fetched Unsplash fallback is available on the image object
    if (failedImg.fallback_image_url && failedImg.url !== failedImg.fallback_image_url) {
      console.warn("Primary image failed in browser, applying pre-fetched Unsplash fallback:", failedImg.fallback_image_url);
      const fallbackImg = {
        url: failedImg.fallback_image_url,
        caption: failedImg.caption,
        location: failedImg.fallback_photographer_name || 'Unsplash Contributor',
        year: '',
        prompt: failedImg.prompt,
        photographer_profile_url: failedImg.fallback_photographer_url || '',
        unsplash_link: failedImg.fallback_unsplash_link || 'https://unsplash.com',
        provider: 'unsplash',
        isFallback: true,
      };
      setImage(fallbackImg);
      updateSession({ currentImage: fallbackImg });
      return;
    }

    // 2. Otherwise request fallback from backend
    if (session.backendSessionId && !failedImg.isFallback) {
      try {
        console.warn("Requesting fallback image from backend for session:", session.backendSessionId);
        const data = await imageService.fallbackImage(session.backendSessionId);
        const fbData = { ...mapBackendImage(data), isFallback: true };
        setImage(fbData);
        updateSession({ currentImage: fbData });
        return;
      } catch (err) {
        console.error("Backend image fallback failed, switching to archive placeholder:", err);
      }
    }

    // 3. Last resort: local archive placeholder
    const archiveImg = {
      url: '/assets/game-visual-match.jpg',
      caption: failedImg.caption || 'Village Classroom memory',
      location: 'Serenify Memory Archive',
      year: '1985',
      prompt: failedImg.prompt || 'Look at this scene. What do you recall about it?',
      photographer_profile_url: '',
      unsplash_link: '',
      provider: 'archive',
      isFallback: true,
    };
    setImage(archiveImg);
    updateSession({ currentImage: archiveImg });
  };

  useEffect(() => {
    let isMounted = true;
    const isMockFallback = session.currentImage?.url === '/assets/game-visual-match.jpg';
    if (((session.imageIndex || 0) === 0 && !session.backendSessionId) || isMockFallback) {
      imageService.startSession(session.profile || {}).then(data => {
        if (!isMounted) return;
        const imgData = mapBackendImage(data);
        setImage(imgData);
        updateSession({
          backendSessionId: data.session_id,
          currentImage: imgData
        });
      }).catch(err => {
        console.error("Backend session start failed, falling back to offline placeholder:", err);
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
    setAnalysisError(null);
    updateSession({ response });

    try {
      const result = await imageService.analyzeDescription(session.backendSessionId, response);
      setAnalysis(result);
      updateSession({ analysis: result });
    } catch (e) {
      console.error("Analysis service error:", e);
      setAnalysisError(e);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleNext = async () => {
    // Per spec: clear analysis, clear errors, clear text, increment cycle
    setAnalysis(null);
    setAnalysisError(null);
    setInputText('');
    setSessionCount(c => c + 1);

    try {
      const data = await imageService.nextImage(session.backendSessionId, session.response || "");
      const imgData = mapBackendImage(data);
      setImage(imgData);
      updateSession({
        imageIndex: (session.imageIndex || 0) + 1,
        analysis: null,
        currentImage: imgData,
        response: ''
      });
    } catch (e) {
      console.error("Failed to load next image:", e);
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
              onClick={() => {
                resetSession();
                navigate('/onboarding');
              }}
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
              <span style={{ color: '#1A1C1B', fontWeight: 700, fontSize: '14px', fontFamily: 'Poppins, sans-serif' }}>
                {sessionCount} / 5
              </span>
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
                    <p style={{
                      fontWeight: 700,
                      color: '#1A1C1B',
                      fontSize: '15px',
                      fontFamily: 'Poppins, sans-serif',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      margin: 0
                    }}>
                      {session.profile?.name || 'Patient Profile'}
                    </p>
                    <p style={{
                      color: '#767A77',
                      fontSize: '13px',
                      marginTop: '2px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      margin: 0
                    }}>
                      {session.profile?.age ? `Age ${session.profile.age}` : ''}
                      {session.profile?.caregiverName ? ` · Caregiver: ${session.profile.caregiverName}` : ''}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Image card */}
              <ImageCard image={image} onFallback={handleImageFallback} />

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
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: '#E6EBE7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Sparkles size={14} className="text-[#4A6B53]" />
                    </div>
                    <p style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#767A77',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      margin: 0
                    }}>
                      Focus Prompt
                    </p>
                  </div>
                  <p style={{
                    color: '#1A1C1B',
                    fontSize: '15px',
                    lineHeight: 1.6,
                    fontFamily: 'Poppins, sans-serif',
                    wordBreak: 'break-word',
                    margin: 0
                  }}>
                    {image.prompt}
                  </p>
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
                <h2 style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '26px',
                  fontWeight: 700,
                  color: '#1A1C1B',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.25,
                  marginBottom: '10px',
                  wordBreak: 'break-word'
                }}>
                  Share what you see
                </h2>
                <p style={{
                  color: '#767A77',
                  fontSize: '15px',
                  lineHeight: 1.6,
                  marginBottom: '24px',
                  wordBreak: 'break-word'
                }}>
                  Take a moment to observe the image. Describe the details, the setting, or any memories it brings to mind.
                </p>
                <ResponseInput
                  text={inputText}
                  setText={setInputText}
                  onSubmit={handleAnalyze}
                  disabled={analyzing}
                />
              </Card>

              {/* 4 Donut Charts / Skeletons / Retry Banner */}
              <AnalysisReport
                analysis={analysis}
                isLoading={analyzing}
                error={analysisError}
                onRetry={() => handleAnalyze(inputText)}
              />

              {/* Next image button (Appears after analysis completes) */}
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
