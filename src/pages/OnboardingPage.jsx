import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { User, Calendar, Heart, Globe, Check, ArrowRight, Briefcase, Palette, PaintBucket, Music, MapPin, Brain } from 'lucide-react';
import { PageShell } from '../components/common/PageShell';
import { Button } from '../components/common/Button';
import { useSession } from '../context/PatientSessionContext';

const LANGUAGES = ['English', 'Tamil', 'Hindi', 'Bengali', 'Marathi', 'Telugu', 'Kannada', 'Malayalam'];
const COLORS = ['Blue', 'Green', 'Red', 'Yellow', 'Purple', 'Orange', 'Pink', 'Brown', 'Black', 'White', 'Other'];
const MUSIC_GENRES = ['Classical', 'Jazz', 'Devotional', 'Old Bollywood', 'Folk', 'Ghazal', 'Pop', 'Rock', 'Other'];

function ProfileForm({ onSubmit }) {
  const { register, handleSubmit, formState: { errors } } = useForm();

  const inputClass = `
    w-full px-6 py-4 rounded-2xl border border-[#EAE8E3] bg-[#FDFBF7]
    text-[#1A1C1B] text-base font-medium font-body
    focus:outline-none focus:border-[#2D4739] focus:ring-4 focus:ring-[#2D4739]/10
    focus:bg-white
    transition-all duration-300
  `;

  const labelClass = "block text-sm font-semibold text-[#1A1C1B] mb-3";
  const errorClass = "text-[#9E564F] text-sm mt-2 font-medium";
  const sectionHeaderClass = "text-xl font-bold text-[#1A1C1B] mb-8 pb-3 border-b border-[#EAE8E3] font-['Poppins'] flex items-center gap-3";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-16 animate-fadeInUp">
      <div className="text-center max-w-2xl mx-auto mb-4">
        <h2 className="font-bold text-[#1A1C1B] text-4xl mb-4" style={{ fontFamily: 'Poppins', letterSpacing: '-0.02em' }}>
          Tell us about yourself
        </h2>
        <p className="text-[#767A77] text-lg" style={{ lineHeight: 1.7 }}>
          We'll personalize your experience, visuals, and game difficulty based on this profile.
        </p>
      </div>

      {/* ─── SECTION 1: Basic Information ─── */}
      <div className="bg-white p-8 lg:p-12 rounded-[24px] border border-[#EAE8E3] shadow-[0_8px_32px_rgba(26,28,27,0.02)]">
        <h3 className={sectionHeaderClass}>
          <User size={24} className="text-[#2D4739]" />
          Basic Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
          {/* Name */}
          <div>
            <label className={labelClass} htmlFor="name">
              <span className="flex items-center gap-2 text-[#535A52]"><User size={16} /> <span className="text-[#1A1C1B]">Full Name</span></span>
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
              <span className="flex items-center gap-2 text-[#535A52]"><Calendar size={16} /> <span className="text-[#1A1C1B]">Age</span></span>
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
              <span className="flex items-center gap-2 text-[#535A52]"><Heart size={16} /> <span className="text-[#1A1C1B]">Caregiver's Name <span className="text-[#767A77] font-normal">(optional)</span></span></span>
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
              <span className="flex items-center gap-2 text-[#535A52]"><Globe size={16} /> <span className="text-[#1A1C1B]">Preferred Language</span></span>
            </label>
            <select
              id="language"
              className={inputClass}
              {...register('language', { required: 'Please select a language' })}
              defaultValue="English"
            >
              <option value="" disabled>Select a language</option>
              {LANGUAGES.map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            {errors.language && <p className={errorClass}>{errors.language.message}</p>}
          </div>
        </div>
      </div>

      {/* ─── SECTION 2: Therapy Personalization ─── */}
      <div className="bg-white p-8 lg:p-12 rounded-[24px] border border-[#EAE8E3] shadow-[0_8px_32px_rgba(26,28,27,0.02)]">
        <h3 className={sectionHeaderClass}>
          <Brain size={24} className="text-[#2D4739]" />
          Therapy Personalization
        </h3>
        <p className="text-sm text-[#767A77] mb-8 leading-relaxed">
          These details help our AI curate images, memories, and cognitive exercises that resonate deeply with your past experiences.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
          {/* Past Occupation */}
          <div>
            <label className={labelClass} htmlFor="occupation">
              <span className="flex items-center gap-2 text-[#535A52]"><Briefcase size={16} /> <span className="text-[#1A1C1B]">Past Occupation</span></span>
            </label>
            <input
              id="occupation"
              className={inputClass}
              placeholder="e.g. Teacher, Engineer, Homemaker"
              {...register('occupation')}
            />
          </div>

          {/* Hometown */}
          <div>
            <label className={labelClass} htmlFor="hometown">
              <span className="flex items-center gap-2 text-[#535A52]"><MapPin size={16} /> <span className="text-[#1A1C1B]">Hometown / Important City</span></span>
            </label>
            <input
              id="hometown"
              className={inputClass}
              placeholder="e.g. Mumbai, Kerala, London"
              {...register('hometown')}
            />
          </div>

          {/* Hobbies */}
          <div className="md:col-span-2">
            <label className={labelClass} htmlFor="hobbies">
              <span className="flex items-center gap-2 text-[#535A52]"><Palette size={16} /> <span className="text-[#1A1C1B]">Hobbies & Interests</span></span>
            </label>
            <input
              id="hobbies"
              className={inputClass}
              placeholder="e.g. Gardening, Cooking, Reading, Cricket"
              {...register('hobbies')}
            />
          </div>

          {/* Favorite Color */}
          <div>
            <label className={labelClass} htmlFor="favoriteColor">
              <span className="flex items-center gap-2 text-[#535A52]"><PaintBucket size={16} /> <span className="text-[#1A1C1B]">Favorite Color</span></span>
            </label>
            <select
              id="favoriteColor"
              className={inputClass}
              {...register('favoriteColor')}
              defaultValue=""
            >
              <option value="" disabled>Select a color</option>
              {COLORS.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Favorite Music Genre */}
          <div>
            <label className={labelClass} htmlFor="musicGenre">
              <span className="flex items-center gap-2 text-[#535A52]"><Music size={16} /> <span className="text-[#1A1C1B]">Favorite Music Genre</span></span>
            </label>
            <select
              id="musicGenre"
              className={inputClass}
              {...register('musicGenre')}
              defaultValue=""
            >
              <option value="" disabled>Select a genre</option>
              {MUSIC_GENRES.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Accessibility note */}
      <div className="flex items-start gap-4 p-8 rounded-[20px] bg-[rgba(247,243,235,0.85)] border border-[rgba(229,222,209,0.6)]">
        <div className="w-8 h-8 rounded-full bg-[#2D4739] flex items-center justify-center shrink-0 mt-0.5">
          <Check size={16} color="white" strokeWidth={3} />
        </div>
        <p className="text-[#2D4739] text-base font-medium leading-relaxed">
          Your information stays completely private and is used exclusively to generate comforting, personalized cognitive exercises.
        </p>
      </div>

      <div className="pt-4 flex justify-center">
        <Button type="submit" variant="primary" size="lg" className="w-full md:w-auto min-w-[300px] text-lg py-5" iconRight={<ArrowRight size={20} />}>
          Complete Setup & Start Journey
        </Button>
      </div>
    </form>
  );
}


// ─── Onboarding Page ──────────────────────────────────────────────────────────
export function OnboardingPage() {
  const { updateSession } = useSession();
  const navigate = useNavigate();

  const handleProfileSubmit = (data) => {
    // We hardcode track as 'alzheimers' since the selection step was removed
    updateSession({ profile: data, track: 'alzheimers' });
    navigate('/session');
  };

  return (
    <PageShell>
      <div className="min-h-[calc(100vh-80px)] py-24" style={{ background: '#FDFBF7' }}>
        <div className="onboarding-wrap max-w-5xl mx-auto px-6">
          <ProfileForm onSubmit={handleProfileSubmit} />
        </div>
      </div>
    </PageShell>
  );
}
