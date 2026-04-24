"use client";

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center py-20 px-4" style={{ background: "var(--bg-primary)" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black mb-2" style={{ color: "var(--text-primary)" }}>Join CodeChrono</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Create an account to save your repositories and boost your rate limits.
          </p>
        </div>
        
        <SignUp
          appearance={{
            elements: {
              rootBox: "w-full mx-auto",
              card: "bg-slate-900 border border-slate-800 shadow-xl w-full",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              socialButtonsBlockButton: "border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white",
              socialButtonsBlockButtonText: "font-semibold text-white",
              dividerLine: "bg-slate-800",
              dividerText: "text-slate-500",
              formFieldLabel: "text-slate-300",
              formFieldInput: "bg-slate-800 border-slate-700 text-white focus:border-blue-500",
              formButtonPrimary: "bg-blue-600 hover:bg-blue-500 text-white",
              footerActionText: "text-slate-400",
              footerActionLink: "text-blue-400 hover:text-blue-300",
            },
          }}
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          fallbackRedirectUrl="/"
        />
      </div>
    </div>
  );
}
