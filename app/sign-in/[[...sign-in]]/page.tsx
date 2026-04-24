"use client";

import { SignIn } from "@clerk/nextjs";
import { motion } from "framer-motion";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center py-20 px-4 relative overflow-hidden" style={{ background: "#050810" }}>
      {/* Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle, #0ea5e9, #00ffaa)" }} />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[150px] opacity-10 pointer-events-none" style={{ background: "radial-gradient(circle, #00ffaa, #0ea5e9)" }} />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black mb-3 text-white drop-shadow-lg tracking-tight">Welcome Back</h1>
          <p className="text-slate-400 font-medium">
            Sign in to access your analysis history and boost limits.
          </p>
        </div>
        
        <div className="p-1 rounded-2xl bg-gradient-to-b from-white/10 to-transparent shadow-2xl shadow-cyan-500/10">
          <SignIn
            appearance={{
              elements: {
                rootBox: "w-full mx-auto",
                card: "bg-slate-900/90 backdrop-blur-xl border-none shadow-none w-full",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton: "border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-white py-3",
                socialButtonsBlockButtonText: "font-bold text-white",
                dividerLine: "bg-white/10",
                dividerText: "text-slate-500",
                formFieldLabel: "text-slate-300 font-medium",
                formFieldInput: "bg-slate-800/50 border-white/10 text-white focus:border-cyan-500 py-2.5",
                formButtonPrimary: "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold py-2.5 transition-all shadow-lg shadow-cyan-500/20 border-none",
                footerActionText: "text-slate-400",
                footerActionLink: "text-cyan-400 hover:text-cyan-300 font-semibold",
              },
            }}
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            fallbackRedirectUrl="/"
          />
        </div>
      </motion.div>
    </div>
  );
}
