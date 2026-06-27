'use client';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAccount, useDisconnect } from 'wagmi';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Technology', href: '#technology' },
  { label: 'FAQ', href: '#faq' },
];

export function Navbar({ onConnect }: { onConnect: () => void }) {
  const { scrollY } = useScroll();
  const borderOpacity = useTransform(scrollY, [0, 80], [0, 1]);
  const bgOpacity = useTransform(scrollY, [0, 80], [0, 0.85]);
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();
  const router = useRouter();

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 h-16"
      style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
    >
      <motion.div
        className="absolute inset-0"
        style={{ backgroundColor: `rgba(8,8,16,${bgOpacity.get()})`, borderBottom: `1px solid rgba(255,255,255,${borderOpacity.get() * 0.06})` }}
      />
      <div className="relative h-full max-w-6xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2.5 cursor-pointer select-none"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00C2FF, #A89EFF)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
            </svg>
          </div>
          <span className="text-[15px] font-bold tracking-tight text-white">Provenance Pay</span>
        </motion.div>

        {/* Nav links */}
        <motion.nav
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="hidden md:flex items-center gap-7"
        >
          {NAV_LINKS.map(link => (
            <a
              key={link.label}
              href={link.href}
              className="text-[13px] font-medium transition-colors duration-200"
              style={{ color: 'rgba(255,255,255,0.5)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'white')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
            >
              {link.label}
            </a>
          ))}
        </motion.nav>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center gap-3"
        >
          {isConnected && address ? (
            <>
              <button
                onClick={() => router.push('/dashboard')}
                className="text-[13px] font-semibold px-4 py-2 rounded-full transition-all duration-200"
                style={{ background: 'linear-gradient(135deg, #00C2FF, #A89EFF)', color: 'white' }}
              >
                Dashboard
              </button>
              <button
                onClick={() => disconnect()}
                className="text-[12px] font-mono transition-colors"
                style={{ color: 'rgba(255,255,255,0.3)' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#F87171')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
              >
                Disconnect
              </button>
            </>
          ) : (
            <button
              onClick={onConnect}
              className="text-[13px] font-semibold px-5 py-2 rounded-full transition-all duration-200"
              style={{ background: 'linear-gradient(135deg, #00C2FF22, #A89EFF22)', border: '1px solid rgba(168,158,255,0.3)', color: '#A89EFF' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, #00C2FF33, #A89EFF33)'; e.currentTarget.style.borderColor = 'rgba(168,158,255,0.5)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, #00C2FF22, #A89EFF22)'; e.currentTarget.style.borderColor = 'rgba(168,158,255,0.3)'; }}
            >
              Connect Wallet
            </button>
          )}
        </motion.div>
      </div>
    </motion.header>
  );
}
