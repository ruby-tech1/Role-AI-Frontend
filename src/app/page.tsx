import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import {
  FiMessageSquare,
  FiLayout,
  FiCheckCircle,
  FiArrowRight,
  FiUsers,
  FiZap
} from "react-icons/fi";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background selection:bg-blue-500/30">
      {/* Live Texture Background */}
      <div className="live-texture" />

      {/* Animated Blobs for "live" feel */}
      <div className="absolute top-0 -left-64 h-96 w-96 animate-blob rounded-full bg-blue-500/10 mix-blend-multiply blur-3xl filter dark:bg-blue-500/20 dark:mix-blend-screen" />
      <div className="animation-delay-2000 absolute top-0 -right-64 h-96 w-96 animate-blob rounded-full bg-sky-500/10 mix-blend-multiply blur-3xl filter dark:bg-sky-500/20 dark:mix-blend-screen" />
      <div className="animation-delay-4000 absolute -bottom-64 left-64 h-96 w-96 animate-blob rounded-full bg-indigo-500/10 mix-blend-multiply blur-3xl filter dark:bg-indigo-500/20 dark:mix-blend-screen" />

      {/* Header */}
      <header className="opacity-0 animate-fade-in sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-white/5 bg-background/60 px-6 backdrop-blur-md md:px-12">
        <Link href="/" className="group flex items-center gap-2">
          <Logo />
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hidden sm:block"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="flex h-9 items-center justify-center rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Get Started
          </Link>
        </nav>
      </header>

      <main className="relative z-10 flex flex-col items-center justify-center pt-24 pb-16 md:pt-36">

        {/* Hero Section */}
        <section className="container flex max-w-[64rem] flex-col items-center gap-6 px-4 text-center">
          <div className="inline-flex flex-col items-center gap-2 opacity-0 animate-fade-in-up">
            <span className="animate-float rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-400">
              Introducing MVP
            </span>
          </div>
          <h1 className="opacity-0 animate-fade-in-up animation-delay-100 font-sans text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Your AI Assistant, <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              Tailored to Your Role.
            </span>
          </h1>
          <p className="opacity-0 animate-fade-in-up animation-delay-200 max-w-[42rem] leading-normal text-muted-foreground sm:text-lg sm:leading-8">
            Experience the next evolution in team collaboration. Role Ai adapts its personality, context, and capabilities entirely based on your project role whether you are a Product Manager, Designer, or Security Engineer.
          </p>
          <div className="flex gap-4 mt-4 flex-col sm:flex-row opacity-0 animate-fade-in-up animation-delay-300">
            <Link
              href="/register"
              className="group flex h-12 items-center justify-center gap-2 rounded-full bg-blue-600 px-8 text-sm font-medium text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all hover:bg-blue-500 hover:shadow-[0_0_30px_rgba(37,99,235,0.6)]"
            >
              Start Collaborating
              <FiArrowRight className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </section>

        {/* Features Grid */}
        <section className="container mx-auto mt-32 max-w-6xl px-6">
          <div className="mb-12 text-center opacity-0 animate-fade-in-up animation-delay-200">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Platform Capabilities</h2>
            <p className="mt-4 text-muted-foreground">The tools you need to build faster, smarter, and with complete consensus.</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <div
                key={i}
                className={`glass-card flex flex-col justify-between rounded-xl p-6 shadow-sm opacity-0 animate-fade-in-up`}
                style={{ animationDelay: `${(i % 3 + 3) * 100}ms` }}
              >
                <div>
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                    {feature.icon}
                  </div>
                  <h3 className="mb-2 font-semibold text-xl">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="container mx-auto mt-32 max-w-5xl px-6 py-12">
          <div className="glass-panel overflow-hidden rounded-3xl border border-white/5 bg-card/40 p-10 md:p-16 opacity-0 animate-fade-in-up animation-delay-200">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold">How Role Ai Works</h2>
              <p className="mt-4 text-muted-foreground">Three steps to seamless, context-aware collaboration.</p>
            </div>

            <div className="grid gap-12 md:grid-cols-3 relative">
              {/* Connection Line (hidden on mobile) */}
              <div className="hidden md:block absolute top-[28px] left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-blue-500/0 via-blue-500/20 to-blue-500/0 opacity-0 animate-fade-in animation-delay-500" />

              {steps.map((step, i) => (
                <div
                  key={i}
                  className="relative z-10 flex flex-col items-center text-center opacity-0 animate-fade-in-up"
                  style={{ animationDelay: `${(i + 3) * 100}ms` }}
                >
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-blue-500/20 bg-background text-lg font-bold text-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.2)]">
                    {i + 1}
                  </div>
                  <h3 className="mb-2 font-semibold text-lg">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto mt-24 mb-16 max-w-4xl px-4 text-center opacity-0 animate-fade-in-up animation-delay-300">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">Ready to upgrade your workflow?</h2>
          <Link
            href="/register"
            className="inline-flex h-12 items-center justify-center rounded-full bg-white px-8 text-sm font-medium text-black transition-colors hover:bg-zinc-200"
          >
            Create Your Workspace
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-background/50 py-8 px-6 text-center text-sm text-muted-foreground">
        <div className="container mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between">
          <div className="flex items-center gap-2 mb-4 sm:mb-0 grayscale opacity-70">
            <Logo showText={false} className="scale-75 origin-left" />
            <span className="font-semibold text-foreground">Role Ai</span>
          </div>
          <p>© {new Date().getFullYear()} Role Ai MVP. All rights reserved.</p>
          <div className="flex gap-4 mt-4 sm:mt-0">
            <Link href="#" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: <FiMessageSquare className="h-5 w-5" />,
    title: "Role-Aware Chat",
    description: "Your AI companion adapts its system prompts dynamically. It acts as a PM, Developer, QA, or Security Engineer based on your active role in the project.",
  },
  {
    icon: <FiLayout className="h-5 w-5" />,
    title: "Instant Artifacts",
    description: "Generate Sequence, Class, or Architecture diagrams instantly in-chat. Role Ai outputs valid Mermaid syntax rendered flawlessly on the client.",
  },
  {
    icon: <FiCheckCircle className="h-5 w-5" />,
    title: "Decision Logs",
    description: "Turn casual chat agreements into formal architecture decisions. Log proposed specs, require team approvals, and keep a historical record of all tech choices.",
  }
];

const steps = [
  {
    title: "Join a Project",
    description: "Create a new workspace or join an existing one with your team."
  },
  {
    title: "Select Your Persona",
    description: "Define your role in the project (e.g., Designer, Developer, Security)."
  },
  {
    title: "Collaborate Smartly",
    description: "Engage with the AI. It will provide context-specific answers tailored entirely to your chosen role."
  }
];
