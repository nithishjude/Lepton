"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAccount, useConnect, useDisconnect } from "wagmi"
import {
  Zap,
  Lock,
  Cpu,
  ArrowRight,
  Music,
  Coins,
  ShieldCheck,
  Layers,
  Sparkles,
  Play,
  Volume2
} from "lucide-react"

// Premium inline SVG logo depicting interconnected nodes (provenance graph)
const LogoIcon = () => (
  <svg className="w-10 h-10 filter drop-shadow-[0_0_8px_rgba(0,194,255,0.6)]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="42" stroke="url(#logo-grad)" strokeWidth="6" strokeDasharray="4 4" />
    <circle cx="50" cy="25" r="10" fill="#9945FF" />
    <circle cx="25" cy="65" r="10" fill="#00C2FF" />
    <circle cx="75" cy="65" r="10" fill="#34D399" />
    <path d="M50 35L32 58" stroke="rgba(255,255,255,0.4)" strokeWidth="3" />
    <path d="M50 35L68 58" stroke="rgba(255,255,255,0.4)" strokeWidth="3" />
    <path d="M35 65H65" stroke="rgba(255,255,255,0.4)" strokeWidth="3" />
    <circle cx="50" cy="50" r="6" fill="#FFFFFF" className="animate-pulse" />
    <defs>
      <linearGradient id="logo-grad" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
        <stop stopColor="#9945FF" />
        <stop offset="0.5" stopColor="#00C2FF" />
        <stop offset="1" stopColor="#34D399" />
      </linearGradient>
    </defs>
  </svg>
)

export default function LandingPage() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const [connecting, setConnecting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [visibleSections, setVisibleSections] = useState<Record<string, boolean>>({})

  // Track playback preview state for the visual widget
  const [isPlaying, setIsPlaying] = useState(true)
  const [accumulatedReward, setAccumulatedReward] = useState(1.4285)

  // Intersection observer to fade sections in on scroll
  useEffect(() => {
    const observers: Record<string, IntersectionObserver> = {}
    const sectionIds = ["hero", "features", "how", "pricing", "cta"]

    sectionIds.forEach((id) => {
      const element = document.getElementById(id)
      if (!element) return

      observers[id] = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => ({ ...prev, [id]: true }))
            observers[id].unobserve(element)
          }
        },
        { threshold: 0.15 }
      )

      observers[id].observe(element)
    })

    return () => {
      Object.values(observers).forEach((observer) => observer.disconnect())
    }
  }, [])

  // Auto-redirect to dashboard when connected
  useEffect(() => {
    if (isConnected && address) {
      router.push("/dashboard")
    }
  }, [isConnected, address, router])

  // Reward ticker animation for the hero preview widget
  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(() => {
      setAccumulatedReward((prev) => prev + 0.0017)
    }, 200)
    return () => clearInterval(interval)
  }, [isPlaying])

  const handleConnect = async () => {
    setConnecting(true)
    setErrorMsg(null)
    try {
      const injectedConnector = connectors.find(
        (c) => c.id === "injected" || c.id === "metaMask"
      )
      if (injectedConnector) {
        connect({ connector: injectedConnector })
      } else {
        connect({ connector: connectors[0] })
      }
    } catch (err: any) {
      console.error("Connection error:", err)
      setErrorMsg(err.message || "Failed to connect wallet")
      setConnecting(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#9945FF]/30 selection:text-white font-sans overflow-x-hidden">
      {/* Toast Alert for Connection Errors */}
      {errorMsg && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-red-500/10 border border-red-500/50 backdrop-blur-md text-red-200 px-6 py-3 rounded-full z-50 text-[13px] shadow-xl">
          {errorMsg}
        </div>
      )}

      {/* Header / Navbar */}
      <header className="fixed top-0 w-full bg-black/60 backdrop-blur-2xl border-b border-white/5 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer">
            <LogoIcon />
            <div className="font-display font-black text-xl tracking-wider bg-gradient-to-r from-white via-[#00C2FF] to-[#34D399] bg-clip-text text-transparent">
              PROVENANCE
            </div>
          </div>
          
          <nav className="hidden md:flex gap-10 text-sm font-medium">
            <Link href="#features" className="text-white/60 hover:text-white transition-colors">
              Features
            </Link>
            <Link href="#how" className="text-white/60 hover:text-white transition-colors">
              How It Works
            </Link>
            <Link href="#pricing" className="text-white/60 hover:text-white transition-colors">
              Ecosystem
            </Link>
          </nav>

          <div className="flex gap-3">
            {isConnected && address ? (
              <button
                onClick={() => disconnect()}
                className="px-5 py-2 text-sm font-medium border border-white/10 rounded-full bg-white/5 hover:bg-white/10 transition-all"
              >
                Disconnect
              </button>
            ) : (
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-[#9945FF] via-[#00C2FF] to-[#34D399] text-black rounded-full hover:shadow-[0_0_20px_rgba(0,194,255,0.4)] transition-all"
              >
                {connecting ? "Connecting..." : "Connect Wallet"}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero" className="relative pt-32 pb-24 px-6 min-h-screen flex items-center overflow-hidden">
        {/* Black Hole Background GIF */}
        <div className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden pointer-events-none">
          <img
            src="/images/black-hole-gif.gif"
            alt="Space portal warp background"
            className="w-auto h-full min-w-full object-cover opacity-60 scale-105"
          />
        </div>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />

        {/* Content Overlay */}
        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-12 gap-16 items-center">
            {/* Left Column Text details */}
            <div
              className={`lg:col-span-7 transition-all duration-1000 ${
                visibleSections["hero"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
            >
              <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-[#00C2FF] animate-pulse" />
                <span className="text-[11px] font-medium tracking-widest text-[#00C2FF] uppercase">
                  Circle Agent Stack Powered
                </span>
              </div>
              <h1 className="text-6xl sm:text-7xl lg:text-8xl font-display font-black leading-[1.05] mb-8 tracking-tighter">
                <span className="bg-gradient-to-br from-white via-white to-white/40 bg-clip-text text-transparent">
                  Every Second.
                </span>
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9945FF] via-[#00C2FF] to-[#34D399]">
                  Every Contributor Paid.
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-white/70 leading-relaxed mb-10 max-w-2xl font-light">
                Provenance Pay constructs recursive credit graphs of track contributors, settling gas-free USDC nanopayments on Arc Testnet in real time.
              </p>
              
              <div className="flex gap-4 mb-12 flex-col sm:flex-row">
                {isConnected ? (
                  <Link
                    href="/dashboard"
                    className="group px-8 py-4 bg-gradient-to-r from-[#00C2FF] to-[#34D399] text-black rounded-full hover:shadow-2xl hover:shadow-[#00C2FF]/40 transition-all font-bold text-lg flex items-center justify-center gap-3"
                  >
                    Launch Dashboard
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                ) : (
                  <button
                    onClick={handleConnect}
                    className="group px-8 py-4 bg-gradient-to-r from-[#9945FF] via-[#00C2FF] to-[#34D399] text-black rounded-full hover:shadow-2xl hover:shadow-[#00C2FF]/40 transition-all font-bold text-lg flex items-center justify-center gap-3"
                  >
                    Connect & Start
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                )}
                <a
                  href="#how"
                  className="px-8 py-4 text-center border border-white/10 rounded-full bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all font-medium text-lg text-white"
                >
                  Watch Demo
                </a>
              </div>
              
              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-8 pt-8 border-t border-white/10">
                <div>
                  <div className="text-3xl font-black bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent mb-1">
                    2s
                  </div>
                  <p className="text-[12px] uppercase tracking-wider text-white/50">Avg Settlement</p>
                </div>
                <div>
                  <div className="text-3xl font-black text-[#00C2FF] mb-1">500K+</div>
                  <p className="text-[12px] uppercase tracking-wider text-white/50">Streams Settled</p>
                </div>
                <div>
                  <div className="text-3xl font-black text-[#34D399] mb-1">98%</div>
                  <p className="text-[12px] uppercase tracking-wider text-white/50">Direct To Artists</p>
                </div>
              </div>
            </div>

            {/* Right Column: Live Payment Visualizer Widget */}
            <div
              className={`lg:col-span-5 relative transition-all duration-1000 flex items-center justify-center ${
                visibleSections["hero"] ? "opacity-100 scale-100" : "opacity-0 scale-95"
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#00C2FF]/10 via-transparent to-transparent rounded-3xl blur-3xl animate-pulse" />
              
              {/* Interactive Player Mock Card */}
              <div className="relative w-full max-w-sm bg-black/40 border border-white/10 rounded-3xl p-6 backdrop-blur-xl animate-float">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-[10px] tracking-wider text-[#00C2FF] uppercase font-bold">Now Playing</span>
                    <h4 className="text-lg font-bold mt-1 text-white truncate">Infinite Split Resonance</h4>
                    <p className="text-[12px] text-white/50 truncate">Various Contributors (MusicBrainz Sync)</p>
                  </div>
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-3 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition"
                  >
                    {isPlaying ? (
                      <Volume2 className="w-5 h-5 text-[#34D399] animate-bounce" />
                    ) : (
                      <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                    )}
                  </button>
                </div>

                {/* Simulated playback tracking */}
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-6 relative">
                  <div
                    className="h-full bg-gradient-to-r from-[#9945FF] to-[#00C2FF] rounded-full transition-all duration-300"
                    style={{ width: isPlaying ? "65%" : "30%" }}
                  />
                </div>

                {/* Real-time split distribution graphic */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2">
                    <span className="text-white/60">Contributed Wallet Split</span>
                    <span className="text-white/60">Flowing (USDC)</span>
                  </div>
                  
                  {/* Lead Vocalist */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#9945FF]" />
                      <span className="text-xs text-white">Lead Vocalist (50%)</span>
                    </div>
                    <span className="text-xs font-mono text-[#9945FF] font-semibold">
                      +{(accumulatedReward * 0.5).toFixed(4)}
                    </span>
                  </div>

                  {/* Composer */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#00C2FF]" />
                      <span className="text-xs text-white">Composer (30%)</span>
                    </div>
                    <span className="text-xs font-mono text-[#00C2FF] font-semibold">
                      +{(accumulatedReward * 0.3).toFixed(4)}
                    </span>
                  </div>

                  {/* Session Guitarist (Escrowed) */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#34D399]" />
                      <span className="text-xs text-white flex items-center gap-1">
                        Session Guitarist (20%)
                        <span className="text-[9px] px-1 py-0.2 bg-[#34D399]/20 text-[#34D399] rounded">Escrow</span>
                      </span>
                    </div>
                    <span className="text-xs font-mono text-[#34D399] font-semibold">
                      +{(accumulatedReward * 0.2).toFixed(4)}
                    </span>
                  </div>
                </div>

                {/* Live total accumulator */}
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex justify-between items-center">
                  <span className="text-xs text-white/50">Total Stream Paid</span>
                  <div className="flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-[#00C2FF]" />
                    <span className="text-base font-mono font-bold text-white">
                      {accumulatedReward.toFixed(4)} USDC
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6 bg-gradient-to-b from-black to-neutral-950/40 relative">
        <div className="max-w-7xl mx-auto">
          <div
            className={`text-center mb-20 transition-all duration-1000 ${
              visibleSections["features"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <span className="text-xs font-semibold tracking-widest text-[#00C2FF] uppercase">Core Capabilities</span>
            <h2 className="text-5xl lg:text-6xl font-display font-black tracking-tighter mt-4 mb-6">
              <span className="bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent">
                Attribution & Payments Restructured
              </span>
            </h2>
            <p className="text-white/60 max-w-xl mx-auto font-light">
              Built on the Circle Agent Stack to enforce transparent split graphs and deploy gas-free micro-payouts.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Music,
                title: "MusicBrainz Metadata Sync",
                desc: "Queries real-time MBID records to extract full recursive credit graphs automatically.",
                color: "group-hover:text-[#9945FF]",
                borderColor: "hover:border-[#9945FF]/40"
              },
              {
                icon: Zap,
                title: "Gas-Free USDC Settlements",
                desc: "Micropayments batched off-chain and committed to Arc Testnet using Circle Gateway.",
                color: "group-hover:text-[#00C2FF]",
                borderColor: "hover:border-[#00C2FF]/40"
              },
              {
                icon: ShieldCheck,
                title: "Automated Escrow Accounts",
                desc: "Unregistered artists safely accumulate royalties in escrow wallets managed by agent instances.",
                color: "group-hover:text-[#34D399]",
                borderColor: "hover:border-[#34D399]/40"
              },
              {
                icon: Layers,
                title: "EVM Provenance Registry",
                desc: "Enforces trustless split routing via Solidity contracts deployed on the Arc network.",
                color: "group-hover:text-[#9945FF]",
                borderColor: "hover:border-[#9945FF]/40"
              },
              {
                icon: Cpu,
                title: "Circle Agent Wallets",
                desc: "Uses Developer-Controlled MPC Wallets and CLI instances to enforce transaction safety caps.",
                color: "group-hover:text-[#00C2FF]",
                borderColor: "hover:border-[#00C2FF]/40"
              },
              {
                icon: Lock,
                title: "Secure Spending Policies",
                desc: "Rigid spending rules protect system treasury files and ensure compliance across endpoints.",
                color: "group-hover:text-[#34D399]",
                borderColor: "hover:border-[#34D399]/40"
              }
            ].map((item, i) => {
              const Icon = item.icon
              const isVisible = visibleSections["features"]
              return (
                <div
                  key={i}
                  className={`group p-8 border border-white/5 rounded-2xl bg-neutral-900/30 hover:bg-neutral-900/60 transition-all duration-500 cursor-pointer backdrop-blur-sm ${
                    item.borderColor
                  } ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                  style={{ transitionDelay: `${i * 100}ms` }}
                >
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 transition-all duration-300">
                    <Icon className={`w-6 h-6 text-white transition-colors duration-300 ${item.color}`} />
                  </div>
                  <h3 className="font-display font-bold text-xl mb-3 text-white">{item.title}</h3>
                  <p className="text-white/50 leading-relaxed font-light text-sm">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how" className="py-32 px-6 relative bg-black">
        <div className="max-w-7xl mx-auto">
          <div
            className={`text-center mb-20 transition-all duration-1000 ${
              visibleSections["how"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <span className="text-xs font-semibold tracking-widest text-[#34D399] uppercase">The Pipeline</span>
            <h2 className="text-5xl lg:text-6xl font-display font-black tracking-tighter mt-4">
              <span className="bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent">
                Unified Payment Flow
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { num: "01", title: "Media Event", desc: "A listener streams a music track from media servers connected to our agent network." },
              { num: "02", title: "Graph Lookup", desc: "The Sidecar extracts metadata tags, requesting splits from the EVM Registry." },
              { num: "03", title: "Escrow Provision", desc: "For unregistered contributors, the agent initializes a secure wallet account." },
              { num: "04", title: "Real-time Payouts", desc: "Micropayments dispatch instantly, displaying rolling tickers to users." }
            ].map((step, i) => {
              const isVisible = visibleSections["how"]
              return (
                <div
                  key={i}
                  className={`relative transition-all duration-700 ${
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                  }`}
                  style={{ transitionDelay: `${i * 150}ms` }}
                >
                  <div className="group bg-neutral-900/20 hover:bg-neutral-900/40 border border-white/5 hover:border-white/20 rounded-2xl p-8 h-full flex flex-col justify-between transition-all backdrop-blur-sm cursor-pointer">
                    <div>
                      <div className="text-5xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-[#9945FF] to-[#00C2FF] mb-4 group-hover:scale-105 transition-transform duration-300">
                        {step.num}
                      </div>
                      <h3 className="font-display font-bold text-lg mb-2 text-white">{step.title}</h3>
                      <p className="text-white/50 text-sm leading-relaxed font-light">{step.desc}</p>
                    </div>
                  </div>
                  {i < 3 && (
                    <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gradient-to-r from-[#00C2FF]/30 to-transparent" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Pricing / Ecosystem Section */}
      <section id="pricing" className="py-32 px-6 bg-gradient-to-b from-neutral-950/20 to-black relative">
        <div className="max-w-5xl mx-auto">
          <div
            className={`text-center mb-20 transition-all duration-1000 ${
              visibleSections["pricing"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <span className="text-xs font-semibold tracking-widest text-[#9945FF] uppercase">Ecosystem Plans</span>
            <h2 className="text-5xl lg:text-6xl font-display font-black tracking-tighter mt-4">
              <span className="bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent">
                Integrations Structured For All
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                name: "Creator Portal",
                price: "Pay-as-you-stream",
                features: [
                  "10 recursive split layers max",
                  "Standard metadata indexing",
                  "Agent-managed escrow wallets",
                  "Community Discord support"
                ],
                highlight: false
              },
              {
                name: "Protocol Suite",
                price: "Custom",
                features: [
                  "Arbitrary depth split graphs",
                  "Dedicated provenance registry node",
                  "Enterprise spending policy limiters",
                  "99.99% system SLA & Support"
                ],
                highlight: true
              }
            ].map((plan, i) => {
              const isVisible = visibleSections["pricing"]
              return (
                <div
                  key={i}
                  className={`group relative transition-all duration-700 ${
                    isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
                  } ${plan.highlight ? "md:scale-105" : ""}`}
                  style={{ transitionDelay: `${i * 200}ms` }}
                >
                  {plan.highlight && (
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#00C2FF] via-[#9945FF] to-[#34D399] rounded-3xl opacity-20 blur-xl group-hover:opacity-30 transition-all" />
                  )}
                  <div
                    className={`relative p-10 border rounded-2xl h-full flex flex-col justify-between backdrop-blur-sm transition-all ${
                      plan.highlight
                        ? "border-[#00C2FF]/30 bg-neutral-900/40"
                        : "border-white/5 bg-neutral-950/40 hover:bg-neutral-900/20"
                    }`}
                  >
                    <div>
                      <h3 className="font-display font-bold text-2xl mb-2 text-white">{plan.name}</h3>
                      <p className="text-3xl font-black text-[#00C2FF] mb-8">{plan.price}</p>
                      <ul className="space-y-4 mb-10">
                        {plan.features.map((f, j) => (
                          <li key={j} className="flex gap-3 text-sm items-start">
                            <ArrowRight className="w-4 h-4 text-[#34D399] flex-shrink-0 mt-1" />
                            <span className="text-white/70">{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    {isConnected ? (
                      <Link
                        href="/dashboard"
                        className={`w-full py-4 rounded-xl font-bold text-center transition-all ${
                          plan.highlight
                            ? "bg-gradient-to-r from-[#00C2FF] to-[#34D399] text-black hover:shadow-xl hover:shadow-[#00C2FF]/40"
                            : "border border-white/10 hover:border-white/20 hover:bg-white/5 text-white"
                        }`}
                      >
                        {plan.highlight ? "Contact Integration Team" : "Launch Dashboard"}
                      </Link>
                    ) : (
                      <button
                        onClick={handleConnect}
                        className={`w-full py-4 rounded-xl font-bold transition-all ${
                          plan.highlight
                            ? "bg-gradient-to-r from-[#9945FF] via-[#00C2FF] to-[#34D399] text-black hover:shadow-xl hover:shadow-[#00C2FF]/40"
                            : "border border-white/10 hover:border-white/20 hover:bg-white/5 text-white"
                        }`}
                      >
                        {plan.highlight ? "Connect Wallet" : "Get Started"}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta" className="py-32 px-6">
        <div
          className={`max-w-4xl mx-auto text-center transition-all duration-1000 ${
            visibleSections["cta"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="text-5xl lg:text-6xl font-display font-black tracking-tighter mb-6">
            <span className="bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent">
              Ready to Claim Your Splits?
            </span>
          </h2>
          <p className="text-lg text-white/60 mb-12 font-light max-w-2xl mx-auto">
            Connect your wallet to index your MusicBrainz track credits, deploy instant streaming registries, and claim escrowed USDC rewards.
          </p>
          {isConnected ? (
            <Link
              href="/dashboard"
              className="group px-10 py-5 bg-gradient-to-r from-[#00C2FF] to-[#34D399] text-black rounded-full hover:shadow-2xl hover:shadow-[#00C2FF]/40 transition-all font-bold text-lg flex items-center gap-3 mx-auto justify-center w-max"
            >
              Go to App Dashboard
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          ) : (
            <button
              onClick={handleConnect}
              className="group px-10 py-5 bg-gradient-to-r from-[#9945FF] via-[#00C2FF] to-[#34D399] text-black rounded-full hover:shadow-2xl hover:shadow-[#00C2FF]/40 transition-all font-bold text-lg flex items-center gap-3 mx-auto justify-center w-max"
            >
              Connect Wallet
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6 bg-black/60">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-white/40">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-gradient-to-tr from-[#9945FF] to-[#00C2FF] flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
            </div>
            <span>Provenance Pay — Credit where credit is due. On-chain.</span>
          </div>
          <div className="flex gap-8">
            <Link href="#" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              Terms
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              Docs
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
