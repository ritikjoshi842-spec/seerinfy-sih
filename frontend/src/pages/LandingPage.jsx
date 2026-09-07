import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Image, Gamepad2, User, TrendingUp, ArrowRight,
  Play, Sparkles
} from 'lucide-react';
import { PageShell } from '../components/common/PageShell';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { SectionHeading } from '../components/common/SectionHeading';

// ─── Feature Tiles Data ──────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: <Image size={32} strokeWidth={1.5} />,
    title: 'Visual-Based Therapy',
    desc: 'High-res, photo-realistic imagery that helps the brain understand better.',
    bg: '#F3F6F4',
    fg: '#4A6B53',
  },
  {
    icon: <Gamepad2 size={32} strokeWidth={1.5} />,
    title: 'Cognitive Game-Play',
    desc: 'Fun games that improve memory, focus, and sequential thinking.',
    bg: '#F5F3EC',
    fg: '#738A7A',
  },
  {
    icon: <User size={32} strokeWidth={1.5} />,
    title: 'Adaptive for You',
    desc: 'Therapy that automatically adapts to your unique pace and needs.',
    bg: '#F0F4F1',
    fg: '#586B5D',
  },
  {
    icon: <TrendingUp size={32} strokeWidth={1.5} />,
    title: 'Intuitive Tracking',
    desc: 'See your improvement over time with clear, simple progress charts.',
    bg: '#FDFBF7',
    fg: '#B3925B',
  },
];

// ─── How It Works Steps ───────────────────────────────────────────────────────
const STEPS = [
  { num: '1', icon: <User size={32} color="#1A1C1B" strokeWidth={1.5} />, label: 'Create Profile', desc: 'Tell us a bit about yourself so we can personalize your experience.', bg: '#E6EBE7' },
  { num: '2', icon: <Image size={32} color="#1A1C1B" strokeWidth={1.5} />, label: 'Start Therapy', desc: 'Explore image-based activities and games, designed specifically for you.', bg: '#F3F6F4' },
  { num: '3', icon: <Gamepad2 size={32} color="#1A1C1B" strokeWidth={1.5} />, label: 'Play & Improve', desc: 'Engage with challenges that build cognitive skills step by step.', bg: '#F0F4F1' },
  { num: '4', icon: <TrendingUp size={32} color="#1A1C1B" strokeWidth={1.5} />, label: 'Track Progress', desc: 'See your improvement visually and celebrate every small win!', bg: '#F5F3EC' },
];

// ─── Game Cards Data ──────────────────────────────────────────────────────────
const GAMES = [
  { title: 'Visual Match', desc: 'Connect words and concepts with images.', img: '/assets/game-word-picture.png', isPlayable: true },
  { title: 'Visual Memory', desc: 'Improve memory with picture sequences.', img: '/assets/game-visual-memory.png', isPlayable: false },
  { title: 'Focus & Attention', desc: 'Train your focus with fun challenges.', img: '/assets/game-focus-attention.png', isPlayable: false },
  { title: 'Pattern Explorer', desc: 'Recognize patterns and build thinking skills.', img: '/assets/game-pattern-explorer.png', isPlayable: false },
  { title: 'Sound to Image', desc: 'Link sounds with visual understanding.', img: '/assets/game-sound-to-image.png', isPlayable: false },
];

// ─── Hero Section ─────────────────────────────────────────────────────────────
function Hero() {
  const navigate = useNavigate();
  return (
    <section 
      className="relative overflow-hidden pt-32 pb-12" 
      style={{ 
        backgroundColor: '#FDFBF7',
        backgroundImage: 'url(/assets/bg-image.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Extremely subtle background gradient, NO massive circles */}
      <div className="absolute top-0 left-0 w-full h-[800px] pointer-events-none"
        style={{ background: 'linear-gradient(180deg, rgba(243,246,244,0.5) 0%, rgba(253,251,247,0) 100%)' }} />

      <div
        className="content-wrap"
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          paddingTop: 'clamp(80px, 8vw, 100px)',
        }}
      >

        <h1
          className="font-bold text-[#1A1C1B] mb-8 animate-fadeInUp delay-100"
          style={{
            fontFamily: 'Poppins',
            fontSize: 'clamp(42px, 6vw, 72px)',
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            maxWidth: '900px'
          }}
        >
          Therapy that
          <br />
          understands <span className="text-[#4A6B53]">you.</span>
        </h1>

        <p className="animate-fadeInUp delay-200" style={{
          fontSize: '1.25rem',
          color: '#767A77',
          lineHeight: 1.8,
          maxWidth: '680px',
          marginBottom: '56px',
        }}>
          Sereenify uses image-based cognitive games to support Alzheimer's through
          engaging, personalized, and visually gentle therapy.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-6 animate-fadeInUp delay-300 mt-12 lg:mt-16">
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/onboarding')}
            iconRight={<ArrowRight size={20} />}
          >
            Start Your Journey
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
            icon={<Play size={18} />}
          >
            Learn More
          </Button>
        </div>
      </div>
    </section>
  );
}

// ─── Feature Tiles ────────────────────────────────────────────────────────────
function FeatureTiles() {
  return (
    <section className="py-24" style={{ background: '#FFFFFF', borderTop: '1px solid #F2F0EB' }}>
      <div className="content-wrap">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              style={{
                animationDelay: `${i * 0.1}s`,
                background: '#FFFFFF',
                padding: '40px 32px',
                borderRadius: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                border: '1px solid #EAE8E3',
                boxShadow: '0 4px 12px rgba(26,28,27,0.02)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              className="hover:shadow-md hover:-translate-y-1"
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: f.bg,
                  flexShrink: 0,
                }}
              >
                {React.cloneElement(f.icon, { color: f.fg })}
              </div>
              <div>
                <h3 style={{ fontFamily: 'Poppins', fontWeight: 600, color: '#1A1C1B', fontSize: '18px', lineHeight: 1.4, marginBottom: '12px' }}>
                  {f.title}
                </h3>
                <p style={{ color: '#767A77', fontSize: '15px', lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────
function HowItWorks() {
  return (
    <section id="how-it-works" style={{ background: '#FDFBF7', padding: '128px 0' }}>
      <div className="content-wrap">
        <SectionHeading
          label="HOW IT WORKS"
          title="Simple steps for meaningful progress"
          align="center"
          className="mb-24"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 relative">
          {/* Connector line */}
          <div className="hidden lg:block absolute top-[44px] left-[15%] right-[15%] h-[1px] bg-[#EAE8E3] pointer-events-none" />

          {STEPS.map((step, _i) => (
            <div
              key={step.label}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                position: 'relative',
              }}
            >
              {/* Massive Circle icon */}
              <div style={{
                width: 88,
                height: 88,
                borderRadius: '50%',
                background: step.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                zIndex: 1,
                border: '4px solid #FDFBF7',
                marginBottom: '32px',
              }}>
                {step.icon}
                {/* Refined Number badge */}
                <span style={{
                  position: 'absolute',
                  top: 0,
                  right: -8,
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: '#FFFFFF',
                  color: '#4A6B53',
                  border: '1px solid #EAE8E3',
                  fontSize: '14px',
                  fontWeight: 600,
                  fontFamily: 'Inter',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(26,28,27,0.04)',
                }}>
                  {step.num}
                </span>
              </div>

              <h3 style={{ fontFamily: 'Poppins', fontWeight: 600, color: '#1A1C1B', fontSize: '20px', marginBottom: '16px', lineHeight: 1.3 }}>
                {step.label}
              </h3>
              <p style={{ color: '#767A77', fontSize: '15px', lineHeight: 1.7, maxWidth: '240px' }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Therapy Through Visuals ──────────────────────────────────────────────────
function TherapyThroughVisuals() {
  const navigate = useNavigate();
  return (
    <section
      id="games"
      style={{
        background: '#FFFFFF',
        padding: '128px 0',
        borderTop: '1px solid #F2F0EB',
        scrollMarginTop: '80px',
      }}
    >
      <div className="content-wrap">
        <SectionHeading
          label="THERAPY THROUGH VISUALS & PLAY"
          title="Fun games that heal and grow"
          subtitle="Each game is designed around cognitive science — built to gently strengthen memory, attention, and language."
          align="center"
          className="mb-24"
        />

        <div className="flex gap-8 overflow-x-auto pb-12 snap-x snap-mandatory scrollbar-hide">
          {GAMES.map((game, _i) => {
            const isPlayable = Boolean(game.isPlayable);
            return (
              <div
                key={game.title}
                className={`flex-shrink-0 w-[280px] group ${isPlayable ? 'cursor-pointer' : 'cursor-default'}`}
                onClick={isPlayable ? () => navigate('/session') : undefined}
              >
                <div className="rounded-[24px] overflow-hidden mb-6 relative border border-[#EAE8E3]" style={{ aspectRatio: '1/1' }}>
                  <img
                    src={game.img}
                    alt={game.title}
                    className={`w-full h-full object-cover ${isPlayable ? 'group-hover:scale-[1.03] transition-transform duration-500 ease-out' : ''}`}
                  />
                  {isPlayable && (
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-end p-5">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md text-[#1A1C1B]">
                        <ArrowRight size={20} />
                      </div>
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-[#1A1C1B] text-lg mb-2" style={{ fontFamily: 'Poppins' }}>{game.title}</h3>
                <p className="text-[#767A77] text-sm leading-relaxed">{game.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Progress Strip ───────────────────────────────────────────────────────────
function ProgressStrip() {
  const navigate = useNavigate();
  return (
    <section style={{ background: '#FDFBF7', padding: '64px 0 80px' }}>
      <div className="content-wrap">
        <Card
          padding={false}
          className="flex flex-col lg:flex-row items-center justify-between gap-10 border border-[#EAE8E3] shadow-[0_12px_44px_rgba(26,28,27,0.05)] bg-white rounded-[32px] w-full"
          style={{ padding: '72px 56px', minHeight: '220px' }}
        >
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6">
            <div className="w-14 h-14 rounded-2xl bg-[#F3F6F4] flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles size={24} color="#4A6B53" />
            </div>
            <div className="max-w-xl">
              <h3 className="font-bold text-[#1A1C1B] text-2xl mb-2" style={{ fontFamily: 'Poppins', lineHeight: 1.3 }}>
                Track your cognitive journey visually.
              </h3>
              <p className="text-[#767A77] text-base leading-relaxed">
                Small steps lead to big changes. Watch your focus and memory improve through our intuitive progress dashboard.
              </p>
            </div>
          </div>

          <div className="shrink-0 w-full sm:w-auto flex justify-center">
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/progress')}
              iconRight={<ArrowRight size={18} />}
            >
              View Dashboard
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
}

// ─── CTA Section ─────────────────────────────────────────────────────────────
function CTASection() {
  const navigate = useNavigate();
  return (
    <section style={{ background: '#FDFBF7', padding: '0 0 160px' }}>
      <div className="content-wrap">
        <div
          className="rounded-[32px] overflow-hidden relative flex flex-col md:flex-row items-center justify-between gap-16 text-center md:text-left"
          style={{ background: '#2C4233', padding: '80px 64px' }}
        >
          {/* Extremely subtle background accent, NO loud colors */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-[0.03] pointer-events-none"
            style={{ background: '#FFFFFF', transform: 'translate(20%, -30%)' }} />

          <div className="relative z-10 max-w-xl">
            <h2 className="font-bold text-white mb-6" style={{ fontFamily: 'Poppins', fontSize: 'clamp(32px, 4vw, 48px)', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
              Begin your learning journey with Sereenify.
            </h2>
            <p className="text-white/80 text-lg" style={{ lineHeight: 1.8 }}>
              Gentle, image-based cognitive care designed to make learning easier and more engaging.
            </p>
          </div>

          <div className="relative z-10 shrink-0">
            <Button
              variant="secondary"
              size="lg"
              iconRight={<ArrowRight size={20} />}
              onClick={() => navigate('/onboarding')}
            >
              Get Started Now
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Landing Page ─────────────────────────────────────────────────────────────
export function LandingPage() {
  React.useEffect(() => {
    if (window.location.hash) {
      const target = document.getElementById(window.location.hash.slice(1));
      if (target) {
        setTimeout(() => target.scrollIntoView({ behavior: 'smooth' }), 120);
      }
    }
  }, []);

  return (
    <PageShell>
      <Hero />
      <FeatureTiles />
      <HowItWorks />
      <TherapyThroughVisuals />
      <ProgressStrip />
      <CTASection />
    </PageShell>
  );
}
