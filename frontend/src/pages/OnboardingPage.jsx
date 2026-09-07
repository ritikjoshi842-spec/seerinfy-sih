import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  User, Calendar, Heart, Globe, Check, ArrowRight,
  Briefcase, Palette, PaintBucket, Music, MapPin, Sparkles
} from 'lucide-react';
import { PageShell } from '../components/common/PageShell';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { useSession } from '../context/PatientSessionContext';

const LANGUAGES = ['English', 'Tamil', 'Hindi', 'Bengali', 'Marathi', 'Telugu', 'Kannada', 'Malayalam'];
const COLORS = ['Blue', 'Green', 'Red', 'Yellow', 'Purple', 'Orange', 'Pink', 'Brown', 'Golden', 'White', 'Other'];
const MUSIC_GENRES = ['Classical & Instrumental', 'Devotional', 'Old Bollywood & Regional Retro', 'Folk & Traditional', 'Ghazals', 'Western Classics', 'Pop & Rock', 'Other'];

function ProfileForm({ onSubmit }) {
  const { register, handleSubmit, formState: { errors } } = useForm();

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1.5px solid #E4E0D3',
    backgroundColor: '#FAF7EF',
    color: '#202622',
    fontSize: '15px',
    fontFamily: 'Inter, sans-serif',
    outline: 'none',
    transition: 'all 0.2s ease',
  };

  const labelStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#202622',
    marginBottom: '8px',
    fontFamily: 'Inter, sans-serif',
  };

  const errorStyle = {
    color: '#C7654A',
    fontSize: '12px',
    marginTop: '6px',
    fontWeight: 500,
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="animate-fadeInUp">
      {/* ─── Header ─── */}
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            borderRadius: '999px',
            backgroundColor: '#DCE8D8',
            color: '#285943',
            fontSize: '12px',
            fontWeight: 600,
            marginBottom: '16px',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          <Sparkles size={14} />
          Personalized Cognitive Care
        </div>

        <h1
          style={{
            fontFamily: 'Poppins, sans-serif',
            fontSize: 'clamp(28px, 4vw, 40px)',
            fontWeight: 700,
            color: '#202622',
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            marginBottom: '12px',
          }}
        >
          Tell Us About Yourself
        </h1>
        <p
          style={{
            color: '#5B6660',
            fontSize: 'clamp(15px, 1.8vw, 17px)',
            lineHeight: 1.6,
            maxWidth: '580px',
            margin: '0 auto',
          }}
        >
          We customize every session's archival photos, memory themes, and game pacing
          around your unique life experiences.
        </p>
      </div>

      {/* ─── Main Unified Form Card ─── */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '28px',
          border: '1px solid #E4E0D3',
          boxShadow: '0 12px 40px rgba(32,38,34,0.05)',
          padding: '40px 32px',
        }}
        className="sm:p-12"
      >
        {/* ── Section 1: Basic Information ── */}
        <div style={{ marginBottom: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                backgroundColor: '#DCE8D8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#285943',
              }}
            >
              <User size={18} />
            </div>
            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '19px', fontWeight: 700, color: '#202622', margin: 0 }}>
              Basic Information
            </h2>
          </div>
          <p style={{ color: '#5B6660', fontSize: '13px', margin: '0 0 24px 42px' }}>
            Essential details to personalize your therapy profile and language preference.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label style={labelStyle} htmlFor="name">
                <User size={15} color="#285943" />
                <span>Full Name <span style={{ color: '#C7654A' }}>*</span></span>
              </label>
              <input
                id="name"
                style={inputStyle}
                placeholder="e.g. Priya Sharma"
                {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'At least 2 characters' } })}
              />
              {errors.name && <p style={errorStyle}>{errors.name.message}</p>}
            </div>

            {/* Age */}
            <div>
              <label style={labelStyle} htmlFor="age">
                <Calendar size={15} color="#285943" />
                <span>Age <span style={{ color: '#C7654A' }}>*</span></span>
              </label>
              <input
                id="age"
                type="number"
                style={inputStyle}
                placeholder="e.g. 68"
                min={5}
                max={105}
                {...register('age', {
                  required: 'Age is required',
                  min: { value: 5, message: 'Age must be at least 5' },
                  max: { value: 105, message: 'Please enter a valid age' },
                })}
              />
              {errors.age && <p style={errorStyle}>{errors.age.message}</p>}
            </div>

            {/* Caregiver Name */}
            <div>
              <label style={labelStyle} htmlFor="caregiverName">
                <Heart size={15} color="#285943" />
                <span>Caregiver's Name <span style={{ color: '#5B6660', fontWeight: 400 }}>(optional)</span></span>
              </label>
              <input
                id="caregiverName"
                style={inputStyle}
                placeholder="e.g. Rahul Sharma"
                {...register('caregiverName')}
              />
            </div>

            {/* Language */}
            <div>
              <label style={labelStyle} htmlFor="language">
                <Globe size={15} color="#285943" />
                <span>Preferred Language <span style={{ color: '#C7654A' }}>*</span></span>
              </label>
              <select
                id="language"
                style={{ ...inputStyle, cursor: 'pointer' }}
                {...register('language', { required: 'Please select a language' })}
                defaultValue="English"
              >
                {LANGUAGES.map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
              {errors.language && <p style={errorStyle}>{errors.language.message}</p>}
            </div>
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={{ height: '1px', backgroundColor: '#E4E0D3', margin: '36px 0' }} />

        {/* ── Section 2: Therapy Personalization ── */}
        <div style={{ marginBottom: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                backgroundColor: '#FFF5DC',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#D6A84F',
              }}
            >
              <Sparkles size={18} />
            </div>
            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '19px', fontWeight: 700, color: '#202622', margin: 0 }}>
              Life Memories & Therapy Customization
            </h2>
          </div>
          <p style={{ color: '#5B6660', fontSize: '13px', margin: '0 0 24px 42px' }}>
            These nostalgic anchors help our AI select historical photos and questions that spark fond recollections.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Past Occupation */}
            <div>
              <label style={labelStyle} htmlFor="occupation">
                <Briefcase size={15} color="#D6A84F" />
                <span>Past Occupation</span>
              </label>
              <input
                id="occupation"
                style={inputStyle}
                placeholder="e.g. School Teacher, Bank Officer, Homemaker"
                {...register('occupation')}
              />
            </div>

            {/* Hometown */}
            <div>
              <label style={labelStyle} htmlFor="hometown">
                <MapPin size={15} color="#D6A84F" />
                <span>Hometown / Childhood Place</span>
              </label>
              <input
                id="hometown"
                style={inputStyle}
                placeholder="e.g. Mysore, Shimla, Kolkata"
                {...register('hometown')}
              />
            </div>

            {/* Hobbies (Full Width) */}
            <div className="md:col-span-2">
              <label style={labelStyle} htmlFor="hobbies">
                <Palette size={15} color="#D6A84F" />
                <span>Favorite Hobbies & Pastimes</span>
              </label>
              <input
                id="hobbies"
                style={inputStyle}
                placeholder="e.g. Gardening, Carnatic music, Cooking traditional sweets, Reading poetry"
                {...register('hobbies')}
              />
            </div>

            {/* Favorite Music */}
            <div>
              <label style={labelStyle} htmlFor="musicGenre">
                <Music size={15} color="#D6A84F" />
                <span>Preferred Music</span>
              </label>
              <select
                id="musicGenre"
                style={{ ...inputStyle, cursor: 'pointer' }}
                {...register('musicGenre')}
                defaultValue=""
              >
                <option value="">Select musical preference</option>
                {MUSIC_GENRES.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            {/* Favorite Color */}
            <div>
              <label style={labelStyle} htmlFor="favoriteColor">
                <PaintBucket size={15} color="#D6A84F" />
                <span>Comforting Color</span>
              </label>
              <select
                id="favoriteColor"
                style={{ ...inputStyle, cursor: 'pointer' }}
                {...register('favoriteColor')}
                defaultValue=""
              >
                <option value="">Select a favorite color</option>
                {COLORS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── Submit Action ── */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            style={{ minWidth: '280px', fontSize: '16px', padding: '16px 36px' }}
            iconRight={<ArrowRight size={18} />}
          >
            Start Reminiscence Session
          </Button>
        </div>
      </div>
    </form>
  );
}

// ─── Onboarding Page ──────────────────────────────────────────────────────────
export function OnboardingPage() {
  const { updateSession } = useSession();
  const navigate = useNavigate();

  const handleProfileSubmit = (data) => {
    updateSession({ profile: data, track: 'alzheimers' });
    navigate('/session');
  };

  return (
    <PageShell>
      <div
        style={{
          minHeight: 'calc(100vh - 64px)',
          padding: '64px 0 96px',
          background: 'linear-gradient(180deg, #FAF7EF 0%, #F5F1E8 100%)',
        }}
      >
        <div style={{ maxWidth: '820px', margin: '0 auto', padding: '0 20px' }}>
          <ProfileForm onSubmit={handleProfileSubmit} />
        </div>
      </div>
    </PageShell>
  );
}
