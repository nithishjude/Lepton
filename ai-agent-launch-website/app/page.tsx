"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { Zap, Lock, TrendingUp, Cpu, Settings, Cloud, ArrowRight } from "lucide-react"

export default function Home() {
  const [visibleSections, setVisibleSections] = useState<Record<string, boolean>>({})

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
        { threshold: 0.15 },
      )

      observers[id].observe(element)
    })

    return () => {
      Object.values(observers).forEach((observer) => observer.disconnect())
    }
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 w-full bg-background/80 backdrop-blur-2xl border-b border-accent/20 z-50">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Image src="/omnius-logo.png" alt="Omnius" width={40} height={40} className="w-10 h-10" />
            <div className="font-display font-bold text-2xl tracking-tighter bg-gradient-to-r from-white via-accent to-accent/80 bg-clip-text text-transparent">
              OMNIUS
            </div>
          </div>
          <nav className="hidden md:flex gap-10 text-sm font-medium">
            <Link href="#features" className="text-muted-foreground hover:text-white transition-colors">
              Features
            </Link>
            <Link href="#how" className="text-muted-foreground hover:text-white transition-colors">
              How It Works
            </Link>
            <Link href="#pricing" className="text-muted-foreground hover:text-white transition-colors">
              Pricing
            </Link>
          </nav>
          <div className="flex gap-3">
            <button className="px-5 py-2.5 text-sm font-medium border border-accent/40 rounded-full hover:border-accent/70 hover:bg-accent/10 transition-all">
              Sign In
            </button>
            <button className="px-5 py-2.5 text-sm font-medium bg-gradient-to-r from-accent via-accent to-accent/80 text-black rounded-full hover:shadow-lg hover:shadow-accent/40 transition-all font-semibold">
              Start Free
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero" className="relative pt-32 pb-32 px-6 min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden">
          <img src="/images/black-hole-gif.gif" alt="Black hole animation" className="w-auto h-3/4 object-contain" />
        </div>
        <div className="absolute inset-0 bg-black/70" />

        {/* Content overlay */}
        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div
              className={`transition-all duration-1000 ${visibleSections["hero"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            >
              <div className="mb-8 inline-block">
                <span className="text-xs font-medium tracking-widest text-accent/80 uppercase">
                  Next-gen Infrastructure
                </span>
              </div>
              <h1 className="text-7xl lg:text-8xl font-display font-black leading-tight mb-8 tracking-tighter">
                <span className="bg-gradient-to-br from-white via-white to-accent/40 bg-clip-text text-transparent">
                  One Agent.
                </span>
                <br />
                <span className="text-accent">Infinite Scale.</span>
              </h1>
              <p className="text-xl text-white/80 leading-relaxed mb-10 max-w-xl font-light">
                Omnius orchestrates your entire cloud and on-prem infrastructure through a single intelligent agent.
                Deploy, monitor, optimize—automatically.
              </p>
              <div className="flex gap-4 mb-12 flex-col sm:flex-row">
                <button className="group px-8 py-4 bg-gradient-to-r from-accent to-accent/90 text-black rounded-full hover:shadow-2xl hover:shadow-accent/50 transition-all font-semibold text-lg flex items-center gap-3">
                  Launch Now
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
                </button>
                <button className="px-8 py-4 border border-accent/40 rounded-full hover:border-accent/70 hover:bg-accent/10 transition-all font-medium text-lg text-white">
                  Watch Demo
                </button>
              </div>
              <div className="grid grid-cols-3 gap-8 pt-8 border-t border-white/10">
                <div>
                  <div className="text-2xl font-bold text-accent mb-2">$1B+</div>
                  <p className="text-sm text-white/60">Valuation</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white mb-2">500K+</div>
                  <p className="text-sm text-white/60">Active Deployments</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-accent mb-2">99.99%</div>
                  <p className="text-sm text-white/60">Uptime</p>
                </div>
              </div>
            </div>

            <div
              className={`relative h-96 lg:h-[550px] transition-all duration-1000 flex items-center justify-center ${visibleSections["hero"] ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-accent/30 via-transparent to-transparent rounded-3xl blur-3xl animate-pulse" />
              <Image
                src="/omnius-logo.png"
                alt="Omnius Agent"
                width={400}
                height={400}
                className="w-full max-w-sm lg:max-w-md drop-shadow-2xl animate-float relative z-10"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6 bg-accent/5">
        <div className="max-w-7xl mx-auto">
          <div
            className={`text-center mb-20 transition-all duration-1000 ${visibleSections["features"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <span className="text-xs font-medium tracking-widest text-accent/60 uppercase">Capabilities</span>
            <h2 className="text-6xl lg:text-7xl font-display font-black tracking-tighter mt-4 mb-6">
              <span className="bg-gradient-to-r from-white via-white to-accent/40 bg-clip-text text-transparent">
                Superpowers Built In
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                title: "Deploy at Lightspeed",
                desc: "One-command infrastructure—no friction, maximum efficiency",
              },
              {
                icon: Cpu,
                title: "Predictive Intelligence",
                desc: "AI that learns your patterns and fixes issues before they happen",
              },
              {
                icon: TrendingUp,
                title: "Cost Optimization",
                desc: "Automatically eliminate waste and maximize ROI across clouds",
              },
              {
                icon: Lock,
                title: "Zero-Trust Security",
                desc: "Enterprise-grade encryption and compliance everywhere",
              },
              {
                icon: Settings,
                title: "Automation Everywhere",
                desc: "Jobs, workflows, and intelligent auto-healing at scale",
              },
              {
                icon: Cloud,
                title: "Multi-Cloud Mastery",
                desc: "AWS, Azure, GCP, and on-prem—unified and orchestrated",
              },
            ].map((item, i) => {
              const Icon = item.icon
              const isVisible = visibleSections["features"]
              return (
                <div
                  key={i}
                  className={`group p-8 border border-accent/10 hover:border-accent/40 rounded-2xl bg-card/50 hover:bg-card/80 transition-all duration-500 cursor-pointer backdrop-blur-sm ${
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                  }`}
                  style={{ transitionDelay: `${i * 100}ms` }}
                >
                  <Icon className="w-10 h-10 mb-6 text-accent group-hover:scale-110 transition-transform" />
                  <h3 className="font-display font-bold text-xl mb-3">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div
            className={`text-center mb-20 transition-all duration-1000 ${visibleSections["how"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <span className="text-xs font-medium tracking-widest text-accent/60 uppercase">Process</span>
            <h2 className="text-6xl lg:text-7xl font-display font-black tracking-tighter mt-4">
              <span className="bg-gradient-to-r from-white via-white to-accent/40 bg-clip-text text-transparent">
                From Zero to Hero
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { num: "01", title: "Install", desc: "One command deploys the Omnius agent anywhere" },
              { num: "02", title: "Discover", desc: "Instant full visibility into your entire infrastructure" },
              { num: "03", title: "Automate", desc: "Define policies—Omnius handles the rest intelligently" },
              { num: "04", title: "Evolve", desc: "Continuous optimization powered by machine learning" },
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
                  <div className="group bg-accent/10 hover:bg-accent/20 border border-accent/20 hover:border-accent/40 rounded-2xl p-8 h-full flex flex-col justify-between transition-all backdrop-blur-sm cursor-pointer">
                    <div>
                      <div className="text-5xl font-display font-black text-accent mb-4 group-hover:scale-110 transition-transform">
                        {step.num}
                      </div>
                      <h3 className="font-display font-bold text-xl mb-2">{step.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                  {i < 3 && (
                    <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gradient-to-r from-accent/40 to-transparent" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-32 px-6 bg-accent/5">
        <div className="max-w-5xl mx-auto">
          <div
            className={`text-center mb-20 transition-all duration-1000 ${visibleSections["pricing"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <span className="text-xs font-medium tracking-widest text-accent/60 uppercase">Plans</span>
            <h2 className="text-6xl lg:text-7xl font-display font-black tracking-tighter mt-4">
              <span className="bg-gradient-to-r from-white via-white to-accent/40 bg-clip-text text-transparent">
                Simple Pricing
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                name: "Cloud Agent",
                price: "Pay-as-you-grow",
                features: ["All infrastructure types", "Token-based billing", "Automatic updates", "Community support"],
                highlight: false,
              },
              {
                name: "Enterprise Suite",
                price: "Custom",
                features: ["Private control plane", "99.99% SLA", "Dedicated support", "Custom integrations"],
                highlight: true,
              },
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
                    <div className="absolute -inset-1 bg-gradient-to-r from-accent via-accent to-accent/60 rounded-3xl opacity-20 blur-xl group-hover:opacity-30 transition" />
                  )}
                  <div
                    className={`relative p-10 border rounded-2xl h-full flex flex-col justify-between backdrop-blur-sm transition-all ${
                      plan.highlight ? "border-accent/40 bg-accent/10" : "border-accent/10 bg-card/50 hover:bg-card/80"
                    }`}
                  >
                    <div>
                      <h3 className="font-display font-bold text-2xl mb-2">{plan.name}</h3>
                      <p className="text-4xl font-black text-accent mb-8">{plan.price}</p>
                      <ul className="space-y-4 mb-10">
                        {plan.features.map((f, j) => (
                          <li key={j} className="flex gap-3 text-sm items-start">
                            <ArrowRight className="w-4 h-4 text-accent flex-shrink-0 mt-1" />
                            <span className="text-foreground/80">{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <button
                      className={`w-full px-6 py-4 rounded-xl font-semibold transition-all ${
                        plan.highlight
                          ? "bg-gradient-to-r from-accent to-accent/80 text-black hover:shadow-xl hover:shadow-accent/40"
                          : "border border-accent/20 hover:border-accent/40 hover:bg-accent/5"
                      }`}
                    >
                      {plan.highlight ? "Contact Sales" : "Start Trial"}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="py-32 px-6">
        <div
          className={`max-w-4xl mx-auto text-center transition-all duration-1000 ${visibleSections["cta"] ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <h2 className="text-6xl lg:text-7xl font-display font-black tracking-tighter mb-6">
            <span className="bg-gradient-to-r from-white via-white to-accent/40 bg-clip-text text-transparent">
              Ready to Transform?
            </span>
          </h2>
          <p className="text-xl text-muted-foreground mb-12 font-light max-w-2xl mx-auto">
            Join hundreds of companies automating their infrastructure with Omnius today.
          </p>
          <button className="group px-10 py-5 bg-gradient-to-r from-accent to-accent/90 text-black rounded-full hover:shadow-2xl hover:shadow-accent/40 transition-all font-bold text-lg flex items-center gap-3 mx-auto">
            Get Started Free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-accent/10 py-12 px-6 bg-background/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-muted-foreground">
          <p>© 2025 Omnius — Infrastructure Evolved</p>
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
