'use client';
import { useRef } from 'react';
import { useInView } from 'framer-motion';
import { IconCloudUpload, IconDatabaseSearch, IconBrandAbstract, IconCoin } from '@tabler/icons-react';

const STEPS = [
  {
    icon: <IconCloudUpload size={20} />,
    title: 'Upload Track',
    desc: 'Upload your music file directly to the IPFS or Navidrome decentralized server.',
    side: 'left'
  },
  {
    icon: <IconDatabaseSearch size={20} />,
    title: 'Metadata Parsing',
    desc: 'The protocol automatically fetches contributors from MusicBrainz tags.',
    side: 'right'
  },
  {
    icon: <IconBrandAbstract size={20} />,
    title: 'Graph Generation',
    desc: 'A provenance graph is created mapping out every artist, producer, and session musician.',
    side: 'left'
  },
  {
    icon: <IconCoin size={20} />,
    title: 'Stream & Earn',
    desc: 'As users stream, smart contracts execute nanopayments instantly based on the graph splits.',
    side: 'right'
  }
];

export function Web3HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null);
  // Fire once when section enters viewport — no per-frame JS
  const isInView = useInView(containerRef, { once: true, margin: '-80px' });

  return (
    <section id="how-it-works" className="py-32 bg-[#080810] relative">
      <style>{`
        /* Reveal animations — GPU compositor only (opacity + transform) */
        @keyframes hiw-fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes hiw-fade-left {
          from { opacity: 0; transform: translateX(-24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes hiw-fade-right {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes hiw-pop {
          from { opacity: 0; transform: scale(0.6); }
          to   { opacity: 1; transform: scale(1); }
        }

        .hiw-visible .hiw-title { animation: hiw-fade-up 0.5s ease-out both; }
        .hiw-visible .hiw-step-left  { animation: hiw-fade-left  0.5s ease-out both; }
        .hiw-visible .hiw-step-right { animation: hiw-fade-right 0.5s ease-out both; }
        .hiw-visible .hiw-icon  { animation: hiw-pop 0.45s cubic-bezier(0.34,1.56,0.64,1) both; }

        /* Stagger delays */
        .hiw-visible .hiw-d0 { animation-delay: 0.1s; }
        .hiw-visible .hiw-d1 { animation-delay: 0.25s; }
        .hiw-visible .hiw-d2 { animation-delay: 0.4s; }
        .hiw-visible .hiw-d3 { animation-delay: 0.55s; }

        /* Icon hover — pure CSS, zero JS */
        .hiw-icon {
          transition: transform 0.2s ease, border-color 0.2s ease, color 0.2s ease;
          will-change: transform;
        }
        .hiw-icon:hover {
          transform: scale(1.12);
          border-color: #00C2FF !important;
          color: #00C2FF;
        }
      `}</style>

      <div
        ref={containerRef}
        className={`w-full max-w-4xl mx-auto px-6 relative z-10 ${isInView ? 'hiw-visible' : ''}`}
      >
        {/* Heading */}
        <div className="text-center mb-24">
          <h2 className="hiw-title hiw-d0 text-[2.5rem] md:text-[3.5rem] font-bold text-white tracking-tight opacity-0">
            How it works
          </h2>
        </div>

        <div className="relative">
          {/* Track line background */}
          <div className="absolute left-8 top-0 bottom-0 w-[2px] bg-white/5 md:left-1/2 md:-ml-[1px]" />

          {/* Glowing progress line — CSS height transition, GPU only */}
          <div
            className="absolute left-8 top-0 w-[2px] md:left-1/2 md:-ml-[1px] origin-top"
            style={{
              height: isInView ? '100%' : '0%',
              transition: isInView ? 'height 1.8s ease-out 0.2s' : 'none',
              background: 'linear-gradient(to bottom, #9945FF, #00C2FF)',
              boxShadow: '0 0 8px rgba(0,194,255,0.35)'
            }}
          />

          <div className="flex flex-col gap-12 md:gap-24">
            {STEPS.map((step, idx) => (
              <div
                key={idx}
                className={`relative flex flex-col md:flex-row items-center gap-8 md:gap-16 ${
                  idx % 2 !== 0 ? 'md:flex-row-reverse' : ''
                }`}
              >
                {/* Text — desktop left column */}
                <div className="flex-1 w-full hidden md:block">
                  <div
                    className={`hiw-d${idx} ${step.side === 'left' ? 'hiw-step-left text-left' : 'hiw-step-right text-right'} opacity-0`}
                  >
                    <h3 className="text-[22px] font-bold text-white mb-2">{step.title}</h3>
                    <p className="text-white/60 font-light text-[15px]">{step.desc}</p>
                  </div>
                </div>

                {/* Icon circle */}
                <div className="absolute left-8 md:static md:left-auto -ml-3 md:ml-0 z-10 flex-shrink-0">
                  <div
                    className={`hiw-icon hiw-d${idx} w-12 h-12 rounded-full bg-[#0d0d16] border border-white/20 flex items-center justify-center text-white/80 cursor-default opacity-0`}
                  >
                    {step.icon}
                  </div>
                </div>

                {/* Text — desktop right column + mobile */}
                <div className="flex-1 w-full pl-20 md:pl-0 text-left">
                  <div
                    className={`hiw-d${idx} ${step.side === 'right' ? 'hiw-step-right' : 'md:hidden hiw-step-left'} opacity-0`}
                  >
                    <h3 className="text-[22px] font-bold text-white mb-2">{step.title}</h3>
                    <p className="text-white/60 font-light text-[15px]">{step.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
