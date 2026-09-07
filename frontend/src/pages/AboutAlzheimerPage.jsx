import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brain, Heart, Sparkles, Clock, ShieldCheck, Eye,
  Smile, ArrowRight, BookOpen, Users, Compass, Award
} from 'lucide-react';
import { PageShell } from '../components/common/PageShell';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { SectionHeading } from '../components/common/SectionHeading';

const PILLARS = [
  {
    icon: <Eye size={28} color="#285943" />,
    title: 'Visual Reminiscence',
    desc: 'Visual memory and emotional pathways often remain receptive longer than direct recall. Archival and familiar images gently unlock cherished memories.',
    bg: '#DCE8D8',
  },
  {
    icon: <Heart size={28} color="#C7654A" />,
    title: 'Stress-Free Engagement',
    desc: 'Never a quiz or test. We replace frustrating interrogation with open-ended storytelling, eliminating the anxiety of "getting it right".',
    bg: '#FEF0E7',
  },
  {
    icon: <Brain size={28} color="#5B3FA0" />,
    title: 'Adaptive Cognitive AI',
    desc: 'Our gentle agentic AI listens to linguistic richness, spatial orientation, and emotional tone to offer uplifting reinforcement.',
    bg: '#E8E0F0',
  },
  {
    icon: <Users size={28} color="#D6A84F" />,
    title: 'Caregiver Partnership',
    desc: 'Designed hand-in-hand with family caregivers, providing meaningful session summaries and emotional connection opportunities.',
    bg: '#FFF5DC',
  },
];

const STAGES_INFO = [
  {
    stage: 'Early Stage',
    title: 'Mild Cognitive Changes',
    symptoms: 'Subtle lapses in recent memory, trouble finding specific words, or difficulty planning routine tasks.',
    approach: 'Familiar cultural imagery, daily routine recall, and word-association play to bolster confidence.',
  },
  {
    stage: 'Mid Stage',
    title: 'Moderate Progression',
    symptoms: 'Increased disorientation with time or place, challenges recognizing familiar settings, mood variations.',
    approach: 'Deep childhood and youth reminiscence photos, calm repetitive scenes, and warm sensory audio prompts.',
  },
  {
    stage: 'Late Stage',
    title: 'Advanced Support',
    symptoms: 'Extensive memory loss, reduced verbal communication, heightened vulnerability to sensory overwhelm.',
    approach: 'Serene nature landscapes, gentle soothing music, familiar colors, and tranquil contemplative presence.',
  },
];

const CAREGIVER_TIPS = [
  {
    title: 'Patience over Precision',
    text: 'If a detail is misremembered, there is no need to correct it. Validate the emotion and keep the conversation flowing smoothly.',
  },
  {
    title: 'Follow Their Pace',
    text: 'Silence is often thinking time. Allow pauses of 10–15 seconds before gently offering another perspective or prompt.',
  },
  {
    title: 'Celebrate Every Response',
    text: 'Even a few words or a warm smile signifies positive neural and emotional stimulation. Small steps are true progress.',
  },
];

export function AboutAlzheimerPage() {
  const navigate = useNavigate();

  return (
    <PageShell>
      {/* ─── Hero Section ─────────────────────────────────────────── */}
      <section
        style={{
          background: 'linear-gradient(180deg, #FAF7EF 0%, #F5F1E8 100%)',
          padding: '80px 0 64px',
        }}
      >
        <div className="content-wrap">
          <div style={{ maxWidth: 840, margin: '0 auto', textAlign: 'center' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 20px',
                borderRadius: '999px',
                background: '#DCE8D8',
                color: '#285943',
                fontSize: '13px',
                fontWeight: 600,
                marginBottom: 24,
              }}
            >
              <Brain size={16} />
              Memory Care & Reminiscence Therapy
            </div>

            <h1
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: 'clamp(32px, 4.5vw, 52px)',
                fontWeight: 700,
                color: '#202622',
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
                marginBottom: 24,
              }}
            >
              Understanding Alzheimer's with Compassion and Science
            </h1>

            <p
              style={{
                fontSize: 'clamp(16px, 1.8vw, 19px)',
                color: '#5B6660',
                lineHeight: 1.8,
                marginBottom: 36,
              }}
            >
              Alzheimer's affects millions of families worldwide. Rather than cold diagnostic drills,
              Sereenify provides gentle, image-guided reminiscence therapy that honors each individual's
              life story and keeps emotional connections alive.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/onboarding')}
                iconRight={<ArrowRight size={18} />}
              >
                Begin a Therapy Session
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => document.getElementById('how-it-helps')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Learn How It Works
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── What is Alzheimer's & The Paradox of Recall ──────────── */}
      <section style={{ background: '#FFFFFF', padding: '96px 0', borderTop: '1px solid #EAE8E3' }}>
        <div className="content-wrap">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 48, alignItems: 'center' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#C7654A', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
                <Sparkles size={16} /> The Paradox of Recall
              </div>
              <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(26px, 3vw, 36px)', fontWeight: 700, color: '#202622', lineHeight: 1.25, marginBottom: 20 }}>
                Why Direct Memory Quizzes Often Cause Anxiety
              </h2>
              <p style={{ color: '#5B6660', fontSize: '16px', lineHeight: 1.8, marginBottom: 16 }}>
                When someone living with memory loss is directly asked, <em>"What did you have for breakfast?"</em> or <em>"Do you remember my name?"</em>, the brain encounters a cognitive roadblock. This triggers acute stress and feelings of inadequacy.
              </p>
              <p style={{ color: '#5B6660', fontSize: '16px', lineHeight: 1.8 }}>
                <strong>Reminiscence therapy</strong> flips this dynamic. By presenting a rich visual stimulus—a traditional Indian classroom in 1988, a festive harvest dance, or morning tea by the river—the patient is invited into an open-ended experience. There are no right or wrong answers, only joyful associations.
              </p>
            </div>

            <Card
              padding={false}
              style={{
                background: '#FAF7EF',
                border: '1px solid #E4E0D3',
                borderRadius: '28px',
                padding: '40px',
                boxShadow: '0 8px 30px rgba(32,38,34,0.05)',
              }}
            >
              <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '20px', fontWeight: 700, color: '#285943', marginBottom: 16 }}>
                Did You Know?
              </h3>
              <p style={{ color: '#202622', fontSize: '15px', lineHeight: 1.8, marginBottom: 20 }}>
                Studies in geriatric neuropsychology show that visual and autobiographical memories from early adulthood remain structurally protected far longer than short-term verbal retention.
              </p>
              <div style={{ borderTop: '1px solid #E4E0D3', paddingTop: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#DCE8D8', display: 'flex', alignItems: 'center', justifyContent: 'center', shrink: 0 }}>
                  <Award size={22} color="#285943" />
                </div>
                <span style={{ fontSize: '13px', color: '#5B6660', fontWeight: 500, lineHeight: 1.5 }}>
                  Evidence-based non-pharmacological care recognized by global memory care institutions.
                </span>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ─── How Sereenify Helps (Pillars) ────────────────────────── */}
      <section id="how-it-helps" style={{ background: '#FAF7EF', padding: '96px 0' }}>
        <div className="content-wrap">
          <SectionHeading
            label="THE SEREENIFY APPROACH"
            title="Four Pillars of Gentle Cognitive Support"
            subtitle="Engineered specifically to support cognitive vitality without intimidation."
            align="center"
            className="mb-16"
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 24 }}>
            {PILLARS.map((pillar) => (
              <Card
                key={pillar.title}
                hover
                style={{
                  background: '#FFFFFF',
                  borderRadius: '24px',
                  padding: '36px 28px',
                  border: '1px solid #EAE8E3',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '16px',
                    background: pillar.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {pillar.icon}
                </div>
                <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '19px', fontWeight: 700, color: '#202622', margin: 0 }}>
                  {pillar.title}
                </h3>
                <p style={{ color: '#5B6660', fontSize: '14px', lineHeight: 1.7, margin: 0 }}>
                  {pillar.desc}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Progression Stages & Tailored Approach ───────────────── */}
      <section style={{ background: '#FFFFFF', padding: '96px 0', borderTop: '1px solid #EAE8E3' }}>
        <div className="content-wrap">
          <SectionHeading
            label="STAGE-AWARE THERAPY"
            title="Care Tailored to Each Phase of the Journey"
            subtitle="Cognitive requirements shift over time. Sereenify adapts pacing and sensory complexity accordingly."
            align="center"
            className="mb-16"
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 28 }}>
            {STAGES_INFO.map((item, idx) => (
              <Card
                key={item.stage}
                style={{
                  background: '#FAF7EF',
                  border: '1px solid #E4E0D3',
                  borderRadius: '24px',
                  padding: '36px 28px',
                  position: 'relative',
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    padding: '6px 14px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: 700,
                    background: idx === 0 ? '#DCE8D8' : idx === 1 ? '#FFF5DC' : '#FEF0E7',
                    color: idx === 0 ? '#285943' : idx === 1 ? '#D6A84F' : '#C7654A',
                    marginBottom: 16,
                  }}
                >
                  {item.stage}
                </span>
                <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '20px', fontWeight: 700, color: '#202622', marginBottom: 12 }}>
                  {item.title}
                </h3>
                <p style={{ color: '#5B6660', fontSize: '14px', lineHeight: 1.7, marginBottom: 18 }}>
                  <strong>Characteristics:</strong> {item.symptoms}
                </p>
                <div style={{ borderTop: '1px solid #E4E0D3', paddingTop: 16 }}>
                  <p style={{ color: '#285943', fontSize: '13px', lineHeight: 1.6, fontWeight: 500, margin: 0 }}>
                    <strong>Sereenify Strategy:</strong> {item.approach}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Caregiver Support & Guidance ─────────────────────────── */}
      <section style={{ background: '#FAF7EF', padding: '96px 0' }}>
        <div className="content-wrap">
          <div style={{ maxWidth: 840, margin: '0 auto' }}>
            <SectionHeading
              label="FOR CAREGIVERS"
              title="Practical Tips for Meaningful Sessions"
              subtitle="Tips from speech-language pathologists and cognitive therapists to create a calm, rewarding environment."
              align="center"
              className="mb-14"
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {CAREGIVER_TIPS.map((tip, i) => (
                <Card
                  key={tip.title}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #EAE8E3',
                    borderRadius: '20px',
                    padding: '28px 32px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 20,
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: '#DCE8D8',
                      color: '#285943',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '16px',
                      fontFamily: 'Poppins, sans-serif',
                      shrink: 0,
                    }}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <h4 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '18px', fontWeight: 700, color: '#202622', marginBottom: 6 }}>
                      {tip.title}
                    </h4>
                    <p style={{ color: '#5B6660', fontSize: '14px', lineHeight: 1.7, margin: 0 }}>
                      {tip.text}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Call to Action Banner ────────────────────────────────── */}
      <section style={{ background: '#FAF7EF', padding: '0 0 96px' }}>
        <div className="content-wrap">
          <div
            style={{
              background: 'linear-gradient(135deg, #285943 0%, #1B3D2E 100%)',
              borderRadius: '32px',
              padding: '64px 48px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              color: 'white',
              boxShadow: '0 12px 36px rgba(40,89,67,0.25)',
            }}
          >
            <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 700, marginBottom: 16 }}>
              Experience the Power of Image-Guided Reminiscence
            </h2>
            <p style={{ maxWidth: 620, color: 'rgba(255,255,255,0.85)', fontSize: '16px', lineHeight: 1.8, marginBottom: 32 }}>
              Try a guided reminiscence session with our curated image archive, or customize the journey for your loved one.
            </p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Button
                variant="accent"
                size="lg"
                onClick={() => navigate('/onboarding')}
                iconRight={<ArrowRight size={18} />}
              >
                Start Alzheimer's Track
              </Button>
              <Button
                variant="outline"
                size="lg"
                style={{ color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.6)' }}
                onClick={() => navigate('/progress')}
              >
                View Sample Progress
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
