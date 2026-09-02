import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Image, Gamepad2, User, TrendingUp, ArrowRight,
  Play, ChevronRight, Star, Shield
} from 'lucide-react';
import { PageShell } from '../components/common/PageShell';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { SectionHeading } from '../components/common/SectionHeading';
import { ProgressRing } from '../components/common/ProgressRing';

// ─── Feature Tiles Data ──────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: <Image size={28} strokeWidth={2} />,
    title: 'Image-based Therapy',
    desc: 'Visuals that help the brain understand better.',
    bg: '#DCE8D8',
    fg: '#285943',
  },
  {
    icon: <Gamepad2 size={28} strokeWidth={2} />,
    title: 'Cognitive Games',
    desc: 'Fun games that improve focus, memory & thinking.',
    bg: '#E8E0F0',
    fg: '#5B3FA0',
  },
  {
    icon: <User size={28} strokeWidth={2} />,
    title: 'Personalized for You',
    desc: 'Therapy that adapts to your pace and needs.',
    bg: '#FEF0E7',
    fg: '#C7654A',
  },
  {
    icon: <TrendingUp size={28} strokeWidth={2} />,
    title: 'Track Progress',
    desc: 'See your improvement over time.',
    bg: '#FFF5DC',
    fg: '#D6A84F',
  },
];

// ─── How It Works Steps ───────────────────────────────────────────────────────
const STEPS = [
  { num: '1', icon: <User size={28} color="white" />, label: 'Create Profile', desc: 'Tell us a bit about yourself so we can personalize your experience.', bg: '#285943' },
  { num: '2', icon: <Image size={28} color="white" />, label: 'Start Therapy', desc: 'Explore image-based activities and games, designed for you.', bg: '#4C8B5D' },
  { num: '3', icon: <Gamepad2 size={28} color="white" />, label: 'Play & Improve', desc: 'Play engaging games that build cognitive skills step by step.', bg: '#C7654A' },
  { num: '4', icon: <TrendingUp size={28} color="white" />, label: 'Track Progress', desc: 'See your improvement and celebrate every small win!', bg: '#D6A84F' },
];

// ─── Game Cards Data ──────────────────────────────────────────────────────────
const GAMES = [
  { title: 'Word Picture Match', desc: 'Connect words with images.', img: '/assets/game-word-picture.png' },
  { title: 'Visual Memory', desc: 'Improve memory with picture sequences.', img: '/assets/game-visual-memory.png' },
  { title: 'Focus & Attention', desc: 'Train your focus with fun challenges.', img: '/assets/game-focus-attention.png' },
  { title: 'Pattern Explorer', desc: 'Recognize patterns and build thinking skills.', img: '/assets/game-pattern-explorer.png' },
  { title: 'Sound to Image', desc: 'Link sounds with visual understanding.', img: '/assets/game-sound-to-image.png' },
];

// ─── Hero Section ─────────────────────────────────────────────────────────────
function Hero() {
  const navigate = useNavigate();
  return (
    <section
      className="relative overflow-hidden pt-12 pb-0"
      style={{ background: 'linear-gradient(160deg, #FAF7EF 0%, #f0ece0 100%)' }}
    >
      {/* Decorative bg circles */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #285943 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-5 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #C7654A 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }} />

      <div className="content-wrap grid grid-cols-1 lg:grid-cols-2 gap-8 items-end">
        {/* Left: copy */}
        <div className="py-12 lg:py-20 animate-fadeInUp">
          <div className="inline-flex items-center gap-2 bg-[#DCE8D8] text-[#285943] text-xs font-semibold px-4 py-2 rounded-full mb-6">
            <Shield size={12} />
            Designed for people with dyslexia of all ages
          </div>

          <h1
            className="font-bold text-[#202622] mb-4"
            style={{
              fontFamily: 'Poppins',
              fontSize: 'clamp(36px, 5vw, 56px)',
              lineHeight: 1.1,
            }}
          >
            Therapy that
            <br />
            understands
            <br />
            <span style={{ color: '#285943', textDecoration: 'underline', textDecorationColor: '#D6A84F', textDecorationThickness: '4px', textUnderlineOffset: '6px' }}>
              you.
            </span>
          </h1>

          <p style={{ fontSize: '1.05rem', color: '#5B6660', lineHeight: 1.7, maxWidth: '440px', marginTop: '28px', marginBottom: '36px' }}>
            Sereenify uses image-based cognitive games to support dyslexia through
            engaging and personalized therapy.
          </p>

          <div className="flex flex-wrap gap-4">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/onboarding')}
              iconRight={<ArrowRight size={18} />}
            >
              Start Your Journey
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              icon={<Play size={16} fill="#285943" />}
            >
              Learn More
            </Button>
          </div>
        </div>

        {/* Right: mascot */}
        <div className="relative flex items-end justify-center lg:justify-end animate-fadeInUp delay-200">
          {/* Speech bubble */}
          <div
            className="absolute top-8 right-4 lg:right-16 bg-white text-[#202622] text-sm font-semibold px-4 py-3 shadow-card z-10"
            style={{ borderRadius: '16px 16px 4px 16px', maxWidth: 160, fontFamily: 'Poppins' }}
          >
            Let's make learning easier together! 🌿
          </div>

          <img
            src="/assets/mascot.png"
            alt="Sereenify mascot — friendly red panda"
            className="animate-float"
            style={{
              height: 'clamp(300px, 40vw, 500px)',
              objectFit: 'contain',
              objectPosition: 'bottom',
              filter: 'drop-shadow(0 20px 40px rgba(40,89,67,0.2))',
            }}
          />
        </div>
      </div>
    </section>
  );
}

// ─── Feature Tiles ────────────────────────────────────────────────────────────
function FeatureTiles() {
  return (
    <section className="py-10" style={{ background: '#FFFFFF' }}>
      <div className="content-wrap">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              style={{
                animationDelay: `${i * 0.1}s`,
                background: '#FAF7EF',
                padding: '28px 20px',
                borderRadius: '20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '12px',
              }}
              className="animate-fadeInUp"
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: f.bg,
                  flexShrink: 0,
                }}
              >
                {React.cloneElement(f.icon, { color: f.fg })}
              </div>
              <h3 style={{ fontFamily: 'Poppins', fontWeight: 700, color: '#202622', fontSize: '15px', lineHeight: 1.3, margin: 0 }}>
                {f.title}
              </h3>
              <p style={{ color: '#5B6660', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
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
    <section id="how-it-works" style={{ background: '#FAF7EF', padding: '80px 0' }}>
      <div className="content-wrap">
        <SectionHeading
          label="HOW IT WORKS"
          title="Simple steps for meaningful progress"
          align="center"
          className="mb-16"
        />

        {/* Responsive grid: 1 col → 2 col → 4 col */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '32px',
          position: 'relative',
          marginTop: '48px',
        }}>
          {/* Connector line — only visible when all 4 are in a row */}
          <div style={{
            position: 'absolute',
            top: '32px',
            left: 'calc(12.5% + 8px)',
            right: 'calc(12.5% + 8px)',
            height: '2px',
            background: 'repeating-linear-gradient(90deg, #285943 0px, #285943 8px, transparent 8px, transparent 16px)',
            pointerEvents: 'none',
          }} className="hidden lg:block" />

          {STEPS.map((step, i) => (
            <div
              key={step.label}
              className="animate-fadeInUp"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '16px',
                position: 'relative',
                animationDelay: `${i * 0.15}s`,
              }}
            >
              {/* Circle icon */}
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: step.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                zIndex: 1,
                boxShadow: '0 4px 20px rgba(32,38,34,0.12)',
                flexShrink: 0,
              }}>
                {step.icon}
                {/* Number badge */}
                <span style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: '#D6A84F',
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: 700,
                  fontFamily: 'Poppins',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {step.num}
                </span>
              </div>

              <h3 style={{ fontFamily: 'Poppins', fontWeight: 700, color: '#202622', fontSize: '15px', margin: 0, lineHeight: 1.3 }}>
                {step.label}
              </h3>
              <p style={{ color: '#5B6660', fontSize: '13px', lineHeight: 1.6, margin: 0 }}>
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
    <section className="py-24" style={{ background: '#FFFFFF' }}>
      <div className="content-wrap">
        <SectionHeading
          label="THERAPY THROUGH VISUALS & PLAY"
          title="Fun games that heal and grow"
          subtitle="Each game is designed around cognitive science — built to gently strengthen memory, attention, and language."
          align="center"
          className="mb-12"
        />

        <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: 'none' }}>
          {GAMES.map((game, i) => (
            <div
              key={game.title}
              className="flex-shrink-0 w-52 group cursor-pointer animate-fadeInUp"
              style={{ animationDelay: `${i * 0.1}s` }}
              onClick={() => navigate('/session')}
            >
              <div className="rounded-[16px] overflow-hidden mb-3 relative" style={{ aspectRatio: '1/1' }}>
                <img
                  src={game.img}
                  alt={game.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-end p-3">
                  <div className="w-8 h-8 bg-[#C7654A] rounded-full flex items-center justify-center">
                    <ChevronRight size={16} color="white" />
                  </div>
                </div>
              </div>
              <h3 className="font-bold text-[#202622] text-sm mb-1" style={{ fontFamily: 'Poppins' }}>{game.title}</h3>
              <p className="text-[#5B6660] text-xs leading-relaxed">{game.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Progress Strip ───────────────────────────────────────────────────────────
function ProgressStrip() {
  return (
    <section className="py-12" style={{ background: '#FAF7EF' }}>
      <div className="content-wrap">
        <Card className="flex flex-col md:flex-row items-center justify-between gap-8 p-8">
          {/* Left: logo + tagline */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#DCE8D8' }}>
              <TrendingUp size={24} color="#285943" />
            </div>
            <div>
              <h3 className="font-bold text-[#202622] text-lg" style={{ fontFamily: 'Poppins' }}>Your Progress</h3>
              <p className="text-[#5B6660] text-sm">Small steps, big changes!</p>
            </div>
          </div>

          {/* Center: ring */}
          <div className="flex flex-col items-center gap-2">
            <ProgressRing percent={78} size={100} strokeWidth={9} />
            <div>
              <p className="font-bold text-[#202622] text-sm text-center" style={{ fontFamily: 'Poppins' }}>Focus & Attention</p>
              <p className="text-[#4C8B5D] text-xs text-center font-semibold">▲ 18% this month</p>
            </div>
            {/* Progress bar */}
            <div className="w-40 h-2 rounded-full bg-[#E4E0D3] mt-1">
              <div className="h-2 rounded-full" style={{ width: '78%', background: 'linear-gradient(90deg, #4C8B5D, #285943)' }} />
            </div>
          </div>

          {/* Right: badge */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: '#FFF5DC' }}>
              <Star size={32} fill="#D6A84F" color="#D6A84F" />
            </div>
            <div>
              <p className="font-bold text-[#202622] text-base" style={{ fontFamily: 'Poppins' }}>You're Doing Great!</p>
              <p className="text-[#5B6660] text-sm">Keep playing and growing.</p>
            </div>
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
    <section className="py-24" style={{ background: '#FAF7EF' }}>
      <div className="content-wrap">
        <div
          className="rounded-[24px] overflow-hidden relative flex flex-col md:flex-row items-center justify-between gap-8 p-12"
          style={{ background: 'linear-gradient(135deg, #285943 0%, #1B3D2E 100%)' }}
        >
          {/* Decorative leaf circles */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #DCE8D8 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #D6A84F 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }} />

          <div className="relative z-10">
            <p className="text-[#D6A84F] text-sm font-semibold uppercase tracking-wider mb-2">Sereenify</p>
            <h2 className="font-bold text-white mb-2" style={{ fontFamily: 'Poppins', fontSize: 'clamp(24px, 3vw, 36px)' }}>
              Together for a better learning journey.
            </h2>
            <p className="text-white/70">Understanding Starts with a Picture.</p>
          </div>

          <div className="relative z-10 shrink-0">
            <Button
              variant="accent"
              size="lg"
              iconRight={<ArrowRight size={18} />}
              onClick={() => navigate('/onboarding')}
            >
              Join Sereenify
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Landing Page ─────────────────────────────────────────────────────────────
export function LandingPage() {
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
