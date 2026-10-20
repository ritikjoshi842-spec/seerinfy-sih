import React, { useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip
} from 'recharts';
import {
  ChevronDown, ChevronUp, AlertCircle, RefreshCw, ExternalLink,
  BookOpen, Check
} from 'lucide-react';

// Color Palettes for the 4 Donut Charts
const COLORS_LEXICAL = ['#4A6B53', '#EAE8E3'];
const COLORS_FILLER = ['#B3925B', '#2C4233'];
const COLORS_SEMANTIC = ['#2A7B88', '#E6EBE7'];
const COLORS_DEMENTIA = ['#6B5B95', '#EAE8E3'];

// ─── Reusable Donut Chart with Center Number ──────────────────────────────────
function MetricDonut({
  data,
  colors,
  centerValue,
  centerLabel,
  ariaLabel,
}) {
  return (
    <div className="relative flex items-center justify-center w-[140px] h-[140px] shrink-0" role="img" aria-label={ariaLabel}>
      <PieChart width={140} height={140}>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={46}
          outerRadius={62}
          dataKey="value"
          stroke="none"
          startAngle={90}
          endAngle={-270}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => [`${value}%`, name]}
          contentStyle={{
            backgroundColor: '#FFFFFF',
            borderColor: '#EAE8E3',
            borderRadius: '12px',
            fontSize: '12px',
            boxShadow: '0 4px 12px rgba(26,28,27,0.06)'
          }}
        />
      </PieChart>
      {/* Center Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-xl sm:text-2xl font-bold text-[#1A1C1B] leading-none tracking-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
          {centerValue}
        </span>
        {centerLabel && (
          <span className="text-[10px] font-semibold text-[#767A77] uppercase tracking-wider mt-1">
            {centerLabel}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Loading Skeleton Card ───────────────────────────────────────────────────
function CardSkeleton({ _title }) {
  return (
    <div className="bg-white rounded-[20px] p-6 border border-[#EAE8E3] shadow-[0_4px_16px_rgba(26,28,27,0.02)] animate-pulse flex flex-col justify-between">
      <div>
        <div className="h-4 bg-[#F0F2F1] rounded-full w-1/2 mb-3" />
        <div className="h-3 bg-[#F5F7F6] rounded-full w-3/4 mb-6" />
      </div>
      <div className="flex justify-center my-4">
        <div className="w-[130px] h-[130px] rounded-full border-8 border-[#F0F2F1]" />
      </div>
      <div className="h-8 bg-[#F5F7F6] rounded-xl w-full mt-4" />
    </div>
  );
}

// ─── Card Unavailable State ──────────────────────────────────────────────────
function UnavailableCard({ title, onRetry }) {
  return (
    <div className="bg-white rounded-[20px] p-6 border border-[#EAE8E3] shadow-[0_4px_16px_rgba(26,28,27,0.02)] flex flex-col items-center justify-center text-center min-h-[280px]">
      <div className="w-12 h-12 rounded-full bg-[#FFF5F5] text-[#9E564F] flex items-center justify-center mb-3">
        <AlertCircle size={22} />
      </div>
      <h3 className="font-semibold text-base text-[#1A1C1B] mb-1">{title}</h3>
      <p className="text-xs text-[#767A77] max-w-[200px] mb-4">
        This parameter is temporarily unavailable.
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full bg-[#F3F6F4] text-[#4A6B53] hover:bg-[#E6EBE7] transition-colors"
        >
          <RefreshCw size={13} /> Retry Parameter
        </button>
      )}
    </div>
  );
}

// ─── 1. Lexical Diversity Card ───────────────────────────────────────────────
function LexicalCard({ data, onRetry }) {
  const [open, setOpen] = useState(false);

  if (!data || data.status === 'unavailable') {
    return <UnavailableCard title="Lexical Diversity" onRetry={onRetry} />;
  }

  const chartData = [
    { name: 'Keyword Density', value: Number((data.keyword_density_pct || 0).toFixed(1)) },
    { name: 'Other Words', value: Number(Math.max(0, 100 - (data.keyword_density_pct || 0)).toFixed(1)) },
  ];

  return (
    <div className="bg-white rounded-[20px] p-6 border border-[#EAE8E3] shadow-[0_4px_16px_rgba(26,28,27,0.02)] flex flex-col justify-between transition-shadow hover:shadow-[0_8px_24px_rgba(26,28,27,0.04)]">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-base text-[#1A1C1B]" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Lexical Diversity
          </h3>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#F3F6F4] text-[#4A6B53]">
            {data.score_pct}/100
          </span>
        </div>
        <p className="text-xs text-[#767A77] mb-4">
          Higher indicates richer, more varied vocabulary.
        </p>

        {/* Center Donut */}
        <div className="flex justify-center my-3">
          <MetricDonut
            data={chartData}
            colors={COLORS_LEXICAL}
            centerValue={`${data.score_pct}%`}
            centerLabel="Diversity"
            ariaLabel={`Lexical Diversity Score: ${data.score_pct} percent. Keyword density ${data.keyword_density_pct} percent.`}
          />
        </div>

        {/* Quick metrics */}
        <div className="grid grid-cols-2 gap-2 text-center py-2.5 my-2 border-y border-[#F2F0EB]">
          <div>
            <p className="text-[11px] text-[#767A77]">Keyword Density</p>
            <p className="font-semibold text-sm text-[#1A1C1B]">{data.keyword_density_pct}%</p>
          </div>
          <div>
            <p className="text-[11px] text-[#767A77]">Unique Ratio</p>
            <p className="font-semibold text-sm text-[#1A1C1B]">{data.unique_ratio_pct}%</p>
          </div>
        </div>
      </div>

      {/* Details Disclosure */}
      <div className="mt-2">
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between py-2 text-xs font-semibold text-[#4A6B53] hover:text-[#2C4233] transition-colors"
          aria-expanded={open}
        >
          <span>{open ? 'Hide Details' : 'View Details & Terms'}</span>
          {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>

        {open && (
          <div className="mt-3 pt-3 border-t border-[#F2F0EB] text-xs text-[#4A4D4B] space-y-3 animate-fadeInUp">
            {data.rationale && (
              <p className="italic text-[#767A77] leading-relaxed">
                "{data.rationale}"
              </p>
            )}
            {data.terms && data.terms.length > 0 && (
              <div>
                <p className="font-semibold text-[11px] text-[#767A77] uppercase tracking-wider mb-2">
                  Extracted Terms ({data.terms.length})
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                  {data.terms.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-[#FDFBF7] border border-[#EAE8E3] text-[#4A6B53] text-[11px]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <p className="text-[11px] text-[#767A77]">
              Total word count: <strong className="text-[#1A1C1B]">{data.total_word_count}</strong> words
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 2. Filler-Word Frequency Card ───────────────────────────────────────────
function FillerCard({ data, onRetry }) {
  const [open, setOpen] = useState(false);

  if (!data || data.status === 'unavailable') {
    return <UnavailableCard title="Filler-Word Frequency" onRetry={onRetry} />;
  }

  const chartData = [
    { name: 'Filler Rate', value: Number((data.filler_rate_pct || 0).toFixed(1)) },
    { name: 'Fluent Speech', value: Number(Math.max(0, 100 - (data.filler_rate_pct || 0)).toFixed(1)) },
  ];

  return (
    <div className="bg-white rounded-[20px] p-6 border border-[#EAE8E3] shadow-[0_4px_16px_rgba(26,28,27,0.02)] flex flex-col justify-between transition-shadow hover:shadow-[0_8px_24px_rgba(26,28,27,0.04)]">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-base text-[#1A1C1B]" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Filler-Word Frequency
          </h3>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#FDFBF7] text-[#B3925B] border border-[#EAE8E3]">
            {data.filler_rate_pct}% fillers
          </span>
        </div>
        <p className="text-xs text-[#767A77] mb-4">
          Lower filler rate indicates smoother, more fluent speech.
        </p>

        {/* Center Donut */}
        <div className="flex justify-center my-3">
          <MetricDonut
            data={chartData}
            colors={COLORS_FILLER}
            centerValue={`${data.fluency_score_pct}%`}
            centerLabel="Fluency"
            ariaLabel={`Filler Word Frequency Fluency Score: ${data.fluency_score_pct} percent. Filler rate ${data.filler_rate_pct} percent.`}
          />
        </div>

        {/* Quick metrics */}
        <div className="grid grid-cols-2 gap-2 text-center py-2.5 my-2 border-y border-[#F2F0EB]">
          <div>
            <p className="text-[11px] text-[#767A77]">Filler Count</p>
            <p className="font-semibold text-sm text-[#1A1C1B]">
              {data.filler_count} / {data.total_word_count}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-[#767A77]">Fluency Score</p>
            <p className="font-semibold text-sm text-[#4A6B53]">{data.fluency_score_pct}%</p>
          </div>
        </div>
      </div>

      {/* Details Disclosure */}
      <div className="mt-2">
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between py-2 text-xs font-semibold text-[#4A6B53] hover:text-[#2C4233] transition-colors"
          aria-expanded={open}
        >
          <span>{open ? 'Hide Details' : 'View Detected Fillers'}</span>
          {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>

        {open && (
          <div className="mt-3 pt-3 border-t border-[#F2F0EB] text-xs text-[#4A4D4B] space-y-3 animate-fadeInUp">
            {data.rationale && (
              <p className="italic text-[#767A77] leading-relaxed">
                "{data.rationale}"
              </p>
            )}
            {data.instances && data.instances.length > 0 ? (
              <div>
                <p className="font-semibold text-[11px] text-[#767A77] uppercase tracking-wider mb-2">
                  Observed Instances ({data.instances.length})
                </p>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {data.instances.map((inst, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-[#FDFBF7] border border-[#EAE8E3] flex items-start justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <span className="font-bold text-[#1A1C1B] text-xs mr-2">"{inst.text}"</span>
                        <span className="text-[11px] text-[#767A77] italic">in "{inst.context}"</span>
                      </div>
                      <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-[#F3F6F4] text-[#4A6B53] shrink-0">
                        {inst.kind.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-[#F3F6F4] text-[#4A6B53] text-[11px] flex items-center gap-2">
                <Check size={14} className="shrink-0" />
                <span>No hesitation sounds or empty fillers detected in this description.</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 3. Semantic Relevance Card ──────────────────────────────────────────────
function SemanticCard({ data, onRetry }) {
  const [open, setOpen] = useState(false);

  if (!data || data.status === 'unavailable') {
    return <UnavailableCard title="Semantic Relevance" onRetry={onRetry} />;
  }

  const chartData = [
    { name: 'Semantic Relevance', value: Number((data.score_pct || 0).toFixed(1)) },
    { name: 'General Speech', value: Number(Math.max(0, 100 - (data.score_pct || 0)).toFixed(1)) },
  ];

  return (
    <div className="bg-white rounded-[20px] p-6 border border-[#EAE8E3] shadow-[0_4px_16px_rgba(26,28,27,0.02)] flex flex-col justify-between transition-shadow hover:shadow-[0_8px_24px_rgba(26,28,27,0.04)]">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-base text-[#1A1C1B]" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Semantic Relevance
          </h3>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#E6EBE7] text-[#2A7B88]">
            {data.score_pct}/100
          </span>
        </div>
        <p className="text-xs text-[#767A77] mb-4">
          How closely your recollection relates to the theme.
        </p>

        {/* Center Donut */}
        <div className="flex justify-center my-3">
          <MetricDonut
            data={chartData}
            colors={COLORS_SEMANTIC}
            centerValue={`${data.score_pct}%`}
            centerLabel="Relevance"
            ariaLabel={`Semantic Relevance Score: ${data.score_pct} percent.`}
          />
        </div>

        {/* Quick metrics */}
        <div className="text-center py-2.5 my-2 border-y border-[#F2F0EB]">
          <p className="text-[11px] text-[#767A77]">Key Concept Matches</p>
          <p className="font-semibold text-sm text-[#1A1C1B]">
            {data.term_scores?.length || 0} contextual concept terms scored
          </p>
        </div>
      </div>

      {/* Details Disclosure */}
      <div className="mt-2">
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between py-2 text-xs font-semibold text-[#4A6B53] hover:text-[#2C4233] transition-colors"
          aria-expanded={open}
        >
          <span>{open ? 'Hide Details' : 'View Concept Terms'}</span>
          {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>

        {open && (
          <div className="mt-3 pt-3 border-t border-[#F2F0EB] text-xs text-[#4A4D4B] space-y-3 animate-fadeInUp">
            {data.rationale && (
              <p className="italic text-[#767A77] leading-relaxed">
                "{data.rationale}"
              </p>
            )}
            {data.term_scores && data.term_scores.length > 0 && (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {data.term_scores.map((ts, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-[#FDFBF7] border border-[#EAE8E3] flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium text-xs text-[#1A1C1B] truncate">
                        {ts.term}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        ts.weight_class === 'high' ? 'bg-[#F3F6F4] text-[#4A6B53]' : 'bg-[#FDFBF7] text-[#767A77]'
                      }`}>
                        {ts.weight_class}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-[#767A77]">
                      {Math.round(ts.relevance * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 4. Dementia-Contextual Alignment Card ───────────────────────────────────
function DementiaCard({ data, onRetry }) {
  const [open, setOpen] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);

  if (!data || data.status === 'unavailable') {
    return <UnavailableCard title="Dementia-Contextual Alignment" onRetry={onRetry} />;
  }

  const chartData = [
    { name: 'Observed Patterns', value: Number((data.alignment_pct || 0).toFixed(1)) },
    { name: 'Unobserved', value: Number(Math.max(0, 100 - (data.alignment_pct || 0)).toFixed(1)) },
  ];

  const confidenceBadge = {
    low: { bg: '#F3F6F4', text: '#4A6B53', label: 'Low confidence' },
    medium: { bg: '#FDFBF7', text: '#B3925B', label: 'Medium confidence' },
    high: { bg: '#F0F4F1', text: '#2C4233', label: 'High confidence' },
  }[data.confidence || 'low'];

  const sources = data.research?.sources || [];
  const sourceType = data.research?.source_type || 'cache';
  const isFallback = sourceType === 'fallback' || sourceType === 'fallback_unverified';

  return (
    <div className="bg-white rounded-[20px] p-6 border border-[#EAE8E3] shadow-[0_4px_16px_rgba(26,28,27,0.02)] flex flex-col justify-between transition-shadow hover:shadow-[0_8px_24px_rgba(26,28,27,0.04)]">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-base text-[#1A1C1B]" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Contextual Alignment
          </h3>
          <span
            className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
            style={{ backgroundColor: confidenceBadge.bg, color: confidenceBadge.text }}
          >
            {confidenceBadge.label}
          </span>
        </div>
        {/* Required Subtitle */}
        <p className="text-[11px] font-semibold text-[#B3925B] leading-tight mb-4">
          Supplementary context from published research — not a diagnosis
        </p>

        {/* Center Donut */}
        <div className="flex justify-center my-3">
          <MetricDonut
            data={chartData}
            colors={COLORS_DEMENTIA}
            centerValue={`${data.alignment_pct}%`}
            centerLabel="Alignment"
            ariaLabel={`Dementia Contextual Alignment: ${data.alignment_pct} percent. Confidence ${data.confidence}.`}
          />
        </div>

        {/* Quick Summary */}
        <div className="p-2.5 my-2 rounded-xl bg-[#FDFBF7] border border-[#EAE8E3] text-center">
          <p className="text-[11px] text-[#4A4D4B] leading-relaxed line-clamp-2">
            {data.summary || 'Patterns analyzed against published clinical benchmarks.'}
          </p>
        </div>
      </div>

      {/* Details Disclosure */}
      <div className="mt-2">
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between py-2 text-xs font-semibold text-[#4A6B53] hover:text-[#2C4233] transition-colors"
          aria-expanded={open}
        >
          <span>{open ? 'Hide Analysis Details' : 'View Research Indicators'}</span>
          {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>

        {open && (
          <div className="mt-3 pt-3 border-t border-[#F2F0EB] text-xs text-[#4A4D4B] space-y-3 animate-fadeInUp">
            {/* Limitations Notice */}
            {data.limitations && (
              <div className="p-2.5 rounded-lg bg-[#F3F6F4] text-[#2C4233] text-[11px] leading-relaxed">
                <strong>Context:</strong> {data.limitations}
              </div>
            )}

            {/* Indicator assessments */}
            {data.assessments && data.assessments.length > 0 && (
              <div>
                <p className="font-semibold text-[11px] text-[#767A77] uppercase tracking-wider mb-2">
                  Assessed Linguistic Markers ({data.assessments.length})
                </p>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {data.assessments.map((a, idx) => {
                    const statusConfig = {
                      observed: { bg: '#FDFBF7', text: '#B3925B', label: 'Observed' },
                      partially_observed: { bg: '#FDFBF7', text: '#767A77', label: 'Partial' },
                      not_observed: { bg: '#F3F6F4', text: '#4A6B53', label: 'Not Observed' },
                      not_assessable: { bg: '#F8F9F8', text: '#A3A8A5', label: 'Not Assessable' }
                    }[a.status] || { bg: '#F8F9F8', text: '#767A77', label: a.status };

                    return (
                      <div
                        key={idx}
                        className="p-2 rounded-lg bg-[#FFFFFF] border border-[#EAE8E3] flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-xs text-[#1A1C1B] capitalize truncate">
                            {a.indicator_id.replace(/_/g, ' ')}
                          </p>
                          {a.evidence && (
                            <p className="text-[11px] text-[#767A77] italic truncate">
                              "{a.evidence}"
                            </p>
                          )}
                        </div>
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded shrink-0"
                          style={{ backgroundColor: statusConfig.bg, color: statusConfig.text }}
                        >
                          {statusConfig.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Research Sources Collapsible */}
            {sources.length > 0 && (
              <div className="pt-2 border-t border-[#F2F0EB]">
                <button
                  onClick={() => setSourcesOpen(!sourcesOpen)}
                  className="flex items-center justify-between w-full text-[11px] font-semibold text-[#767A77] hover:text-[#1A1C1B]"
                >
                  <span className="flex items-center gap-1.5">
                    <BookOpen size={13} /> Based on {sources.length} sources ({isFallback ? 'built-in baseline' : 'live research cache'})
                  </span>
                  {sourcesOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>

                {sourcesOpen && (
                  <div className="mt-2 space-y-1.5 max-h-28 overflow-y-auto pr-1">
                    {sources.map((src, idx) => (
                      <a
                        key={idx}
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-1.5 rounded bg-[#FDFBF7] text-[11px] text-[#4A6B53] hover:underline"
                      >
                        <span className="truncate pr-2">{src.title}</span>
                        <ExternalLink size={11} className="shrink-0 text-[#767A77]" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Required Clinician Footer */}
            <p className="text-[11px] text-[#767A77] font-medium pt-2 border-t border-[#F2F0EB] text-center">
              Talk to a clinician about any concerns.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Analysis Report Grid ───────────────────────────────────────────────
export function AnalysisReport({ analysis, isLoading, error, onRetry }) {
  // If loading, render 4 skeletons
  if (isLoading) {
    return (
      <div className="space-y-4 animate-fadeInUp w-full">
        <div className="p-4 rounded-[16px] bg-[#F3F6F4] border border-[#E6EBE7] flex items-center gap-3">
          <RefreshCw size={18} className="text-[#4A6B53] animate-spin shrink-0" />
          <p className="text-xs sm:text-sm text-[#2C4233] font-medium">
            Multi-agent scoring in progress — evaluating lexical variety, speech fluency, thematic relevance, and research alignment...
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <CardSkeleton title="Lexical Diversity" />
          <CardSkeleton title="Filler-Word Frequency" />
          <CardSkeleton title="Semantic Relevance" />
          <CardSkeleton title="Contextual Alignment" />
        </div>
      </div>
    );
  }

  // If HTTP 503 or error, show friendly retry banner
  if (error) {
    return (
      <div className="p-6 rounded-[20px] bg-[#FDFBF7] border border-[#B3925B]/40 shadow-sm animate-fadeInUp w-full">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-[#FFF9E6] text-[#B3925B] flex items-center justify-center shrink-0">
            <AlertCircle size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base text-[#1A1C1B] mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Analysis Service Busy
            </h3>
            <p className="text-xs sm:text-sm text-[#767A77] leading-relaxed mb-4">
              {error.status === 503
                ? 'The cognitive analysis service is experiencing high demand. Your description has been preserved — please click below to retry.'
                : error.message || 'Unable to complete the analysis at this moment. Your typed response is safely preserved.'}
            </p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#4A6B53] text-white text-xs font-semibold hover:bg-[#2C4233] transition-colors shadow-sm"
              >
                <RefreshCw size={14} /> Try Analyzing Again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <section className="space-y-6 animate-fadeInUp w-full" aria-label="Cognitive Analysis Report">
      {/* 2x2 Desktop Grid / 1 Column Mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        <LexicalCard data={analysis.lexical_diversity} onRetry={onRetry} />
        <FillerCard data={analysis.filler_word_frequency} onRetry={onRetry} />
        <SemanticCard data={analysis.semantic_relevance} onRetry={onRetry} />
        <DementiaCard data={analysis.dementia_contextual_alignment} onRetry={onRetry} />
      </div>
    </section>
  );
}
