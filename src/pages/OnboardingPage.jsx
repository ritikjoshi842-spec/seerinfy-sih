import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Brain, BookOpen, Puzzle, ArrowRight, ChevronLeft, User, Calendar, Heart, Globe } from 'lucide-react';
import { PageShell } from '../components/common/PageShell';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { useSession } from '../context/PatientSessionContext';

const TRACKS = [
  {
    id: 'alzheimers',
    label: "Alzheimer's",
    icon: <Brain size={36} />,
    desc: "Gentle reminiscence therapy using meaningful images to stimulate memory and emotional connection.",
    color: '#285943',
    bg: '#DCE8D8',
    tag: 'Memory Care',
  },
  {
    id: 'dementia',
    label: 'Dementia',
    icon: <Heart size={36} />,
    desc: "Calm, repetitive visual exercises designed to reduce anxiety and support cognitive function.",
    color: '#C7654A',
    bg: '#FEF0E7',
    tag: 'Cognitive Support',
  },
  {
    id: 'dyslexia',
    label: 'Dyslexia',
    icon: <BookOpen size={36} />,
    desc: "Image-first phonics games and word-picture matching to build reading confidence and fluency.",
    color: '#5B3FA0',
    bg: '#E8E0F0',
    tag: 'Learning Support',
  },
];

const LANGUAGES = ['English', 'Tamil', 'Hindi', 'Bengali', 'Marathi', 'Telugu', 'Kannada', 'Malayalam'];

// ─── Step 1: Track Selector ───────────────────────────────────────────────────
function TrackSelector({ onSelect, selected }) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="font-bold text-[#202622] text-3xl mb-2" style={{ fontFamily: 'Poppins' }}>
          Choose Your Journey
        </h2>
        <p className="text-[#5B6660]">Select the track that best describes your needs. You can always change this later.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8">
        {TRACKS.map(track => (
          <button
            key={track.id}
            onClick={() => onSelect(track.id)}
            className={`
              text-left p-6 rounded-[20px] border-2 transition-all duration-300
              hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(32,38,34,0.14)]
              focus:outline-none focus:ring-2 focus:ring-offset-2
              ${selected === track.id
                ? 'border-[#285943] shadow-[0_8px_32px_rgba(40,89,67,0.2)]'
                : 'border-[#E4E0D3] bg-white'
              }
            `}
            style={selected === track.id ? { background: track.bg } : {}}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: track.bg, color: track.color }}
            >
              {React.cloneElement(track.icon, { color: track.color })}
            </div>

            <span
              className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-3"
              style={{ background: track.bg, color: track.color }}
            >
              {track.tag}
            </span>

            <h3 className="font-bold text-[#202622] text-xl mb-2" style={{ fontFamily: 'Poppins' }}>
              {track.label}
            </h3>
            <p className="text-[#5B6660] text-sm leading-relaxed">{track.desc}</p>

            {selected === track.id && (
              <div className="mt-4 flex items-center gap-2 font-semibold text-sm" style={{ color: track.color }}>
                <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center" style={{ borderColor: track.color }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: track.color }} />
                </div>
                Selected
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Step 2: Profile Form ─────────────────────────────────────────────────────
function ProfileForm({ onSubmit, track }) {
  const { register, handleSubmit, formState: { errors } } = useForm();

  const inputClass = `
    w-full px-4 py-3 rounded-xl border border-[#E4E0D3] bg-white
    text-[#202622] text-base font-body
    focus:outline-none focus:border-[#285943] focus:ring-2 focus:ring-[#285943]/20
    transition-all duration-200
  `;

  const labelClass = "block text-sm font-semibold text-[#202622] mb-2";
  const errorClass = "text-[#C7654A] text-xs mt-1 font-medium";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="font-bold text-[#202622] text-3xl mb-2" style={{ fontFamily: 'Poppins' }}>
          Tell us about yourself
        </h2>
        <p className="text-[#5B6660]">We'll personalize your experience based on your profile.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name */}
        <div>
          <label className={labelClass} htmlFor="name">
            <span className="flex items-center gap-2"><User size={14} /> Full Name</span>
          </label>
          <input
            id="name"
            className={inputClass}
            placeholder="e.g. Priya Sharma"
            {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'At least 2 characters' } })}
          />
          {errors.name && <p className={errorClass}>{errors.name.message}</p>}
        </div>

        {/* Age */}
        <div>
          <label className={labelClass} htmlFor="age">
            <span className="flex items-center gap-2"><Calendar size={14} /> Age</span>
          </label>
          <input
            id="age"
            type="number"
            className={inputClass}
            placeholder="e.g. 68"
            min={5}
            max={100}
            {...register('age', {
              required: 'Age is required',
              min: { value: 5, message: 'Age must be at least 5' },
              max: { value: 100, message: 'Age must be under 100' },
            })}
          />
          {errors.age && <p className={errorClass}>{errors.age.message}</p>}
        </div>

        {/* Caregiver */}
        <div>
          <label className={labelClass} htmlFor="caregiverName">
            <span className="flex items-center gap-2"><Heart size={14} /> Caregiver's Name <span className="text-[#5B6660] font-normal">(optional)</span></span>
          </label>
          <input
            id="caregiverName"
            className={inputClass}
            placeholder="e.g. Rahul Sharma"
            {...register('caregiverName')}
          />
        </div>

        {/* Language */}
        <div>
          <label className={labelClass} htmlFor="language">
            <span className="flex items-center gap-2"><Globe size={14} /> Preferred Language</span>
          </label>
          <select
            id="language"
            className={inputClass}
            {...register('language', { required: 'Please select a language' })}
            defaultValue="English"
          >
            {LANGUAGES.map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          {errors.language && <p className={errorClass}>{errors.language.message}</p>}
        </div>
      </div>

      {/* Accessibility note */}
      <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: '#DCE8D8' }}>
        <div className="w-5 h-5 rounded-full bg-[#285943] flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-white text-[10px]">✓</span>
        </div>
        <p className="text-[#285943] text-sm font-medium">
          Your information stays private and is only used to personalize your therapy sessions.
        </p>
      </div>

      <Button type="submit" variant="accent" size="lg" className="w-full" iconRight={<ArrowRight size={18} />}>
        Start My Journey
      </Button>
    </form>
  );
}

// ─── Onboarding Page ──────────────────────────────────────────────────────────
export function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const { updateSession } = useSession();
  const navigate = useNavigate();

  const handleTrackSelect = (trackId) => setSelectedTrack(trackId);

  const handleTrackNext = () => {
    if (!selectedTrack) return;
    updateSession({ track: selectedTrack });
    setStep(2);
  };

  const handleProfileSubmit = (data) => {
    updateSession({ profile: data });
    navigate('/session');
  };

  return (
    <PageShell>
      <div className="min-h-[calc(100vh-64px)] py-12" style={{ background: 'linear-gradient(160deg, #FAF7EF 0%, #f0ece0 100%)' }}>
        <div className="onboarding-wrap">

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-3 mb-10">
            {[1, 2].map(s => (
              <React.Fragment key={s}>
                <div
                  className="flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold transition-all duration-300"
                  style={{
                    background: step >= s ? '#285943' : '#E4E0D3',
                    color: step >= s ? 'white' : '#5B6660',
                    fontFamily: 'Poppins',
                  }}
                >
                  {s}
                </div>
                {s < 2 && (
                  <div className="w-16 h-1 rounded-full transition-all duration-500"
                    style={{ background: step > s ? '#285943' : '#E4E0D3' }} />
                )}
              </React.Fragment>
            ))}
          </div>

          <Card className="p-8 md:p-12">
            {step === 1 && (
              <>
                <TrackSelector onSelect={handleTrackSelect} selected={selectedTrack} />
                <div className="mt-8 flex justify-end">
                  <Button
                    variant="primary"
                    size="lg"
                    disabled={!selectedTrack}
                    onClick={handleTrackNext}
                    iconRight={<ArrowRight size={18} />}
                  >
                    Continue
                  </Button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 text-[#5B6660] hover:text-[#285943] text-sm font-medium mb-6 transition-colors"
                >
                  <ChevronLeft size={16} /> Back
                </button>
                <ProfileForm onSubmit={handleProfileSubmit} track={selectedTrack} />
              </>
            )}
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
