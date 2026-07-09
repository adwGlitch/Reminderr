import Link from "next/link";
import { CheckCircle, Clock, Calendar, Users, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-neutral-950 text-neutral-100 selection:bg-primary/30">
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none" />

      {/* Hero Section */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 flex flex-col items-center text-center z-10 relative">
        
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-neutral-900/50 backdrop-blur-md mb-8">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-medium text-neutral-300">Welcome to Remindeq</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-transparent">
          Master Your Time, <br className="hidden md:block" />
          <span className="text-primary">Effortlessly.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mb-10 leading-relaxed">
          Remindeq is a premium, real-time task management ecosystem. Whether you're organizing your personal life or coordinating with a team, stay on top of everything without the friction.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <Link 
            href="/register" 
            className="group relative px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-2xl hover:bg-primary/90 transition-all flex items-center gap-2 overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              Get Started <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
          <Link 
            href="/login" 
            className="px-8 py-4 bg-transparent border border-border hover:bg-neutral-900 text-neutral-200 font-semibold rounded-2xl transition-all"
          >
            Sign In
          </Link>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-32 w-full">
          {[
            {
              icon: Clock,
              title: "Real-time Sync",
              desc: "Powered by Firebase, your tasks update instantly across all devices without reloading."
            },
            {
              icon: Users,
              title: "Team Collaboration",
              desc: "Create groups, invite members, and assign tasks with fine-grained visibility controls."
            },
            {
              icon: Calendar,
              title: "Smart Scheduling",
              desc: "Set due dates, times, and recurrence rules. Our backend checks for due tasks every 15 minutes."
            },
            {
              icon: CheckCircle,
              title: "Premium Design",
              desc: "A beautiful, distraction-free glassmorphic interface designed to keep you focused."
            }
          ].map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div key={i} className="glass p-6 rounded-3xl border border-border flex flex-col items-start text-left hover:border-primary/50 transition-colors">
                <div className="p-3 bg-neutral-900 rounded-2xl border border-border mb-4">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">{feature.desc}</p>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-8 text-neutral-500 text-sm z-10 border-t border-border/50 mt-auto">
        <p>© {new Date().getFullYear()} Remindeq. Designed for peak productivity.</p>
      </footer>
    </div>
  );
}
