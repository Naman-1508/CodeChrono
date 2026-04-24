"use client";

import { SignOutButton } from "@clerk/nextjs";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { TokenManager } from "./TokenManager";
import { hasToken } from "@/lib/token";
import { Zap, Key, ChevronDown, User } from "lucide-react";

export function AuthBar() {
  const { isSignedIn, clerkUser, effectiveRateLimit } = useAuth();
  const [isTokenPanelOpen, setIsTokenPanelOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const tokenPresent = hasToken();

  const rateLimitColor = effectiveRateLimit === 5000 ? "green" : "yellow";

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsTokenPanelOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex items-center gap-4">
      {/* Rate limit badge */}
      <div
        className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md shadow-sm border transition-colors"
        style={{
          background: rateLimitColor === "green" ? "rgba(16, 185, 129, 0.1)" : "rgba(234, 179, 8, 0.1)",
          borderColor: rateLimitColor === "green" ? "rgba(16, 185, 129, 0.2)" : "rgba(234, 179, 8, 0.2)",
          color: rateLimitColor === "green" ? "#34d399" : "#fbbf24",
        }}
      >
        <Zap size={14} className={rateLimitColor === "green" ? "text-emerald-400" : "text-amber-400"} />
        {effectiveRateLimit.toLocaleString()} req/hr
      </div>

      {isSignedIn && clerkUser ? (
        <div className="flex items-center gap-3 relative" ref={dropdownRef}>
          <button
            onClick={() => setIsTokenPanelOpen(!isTokenPanelOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 hover:border-slate-600 transition-all text-sm font-medium text-white shadow-sm"
          >
            <div className="relative">
              <img
                src={clerkUser.avatarUrl}
                alt="Avatar"
                className="w-6 h-6 rounded-full border border-slate-600 shadow-sm"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
            </div>
            <span className="hidden sm:inline-block max-w-[100px] truncate">{clerkUser.name}</span>
            <ChevronDown size={14} className={`text-slate-400 transition-transform ${isTokenPanelOpen ? "rotate-180" : ""}`} />
          </button>

          {isTokenPanelOpen && (
            <div className="absolute top-full right-0 mt-3 w-80 z-50">
              <div className="p-1 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 shadow-2xl shadow-black/50">
                <TokenManager onSuccess={() => setIsTokenPanelOpen(false)} />
                <div className="p-2 border-t border-slate-800/50 mt-1">
                  <SignOutButton>
                    <button className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center gap-2">
                      Sign out
                    </button>
                  </SignOutButton>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3 relative" ref={dropdownRef}>
          <button
            onClick={() => setIsTokenPanelOpen(!isTokenPanelOpen)}
            className="text-xs font-medium px-4 py-2 rounded-full transition-all border shadow-sm flex items-center gap-2"
            style={{
              background: tokenPresent ? "rgba(16, 185, 129, 0.1)" : "rgba(255, 255, 255, 0.05)",
              color: tokenPresent ? "#34d399" : "#94a3b8",
              borderColor: tokenPresent ? "rgba(16, 185, 129, 0.2)" : "rgba(255, 255, 255, 0.1)",
            }}
            onMouseEnter={(e) => {
              if (!tokenPresent) e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
            }}
            onMouseLeave={(e) => {
              if (!tokenPresent) e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
            }}
          >
            {tokenPresent ? <Key size={14} /> : null}
            {tokenPresent ? "Token connected" : "Add PAT"}
          </button>

          <Link
            href="/sign-in"
            className="text-xs font-bold px-5 py-2 rounded-full transition-all shadow-md hover:shadow-cyan-500/20 flex items-center gap-2"
            style={{
              background: "linear-gradient(135deg, #0ea5e9, #3b82f6)",
              color: "white",
            }}
          >
            <User size={14} />
            Sign In
          </Link>

          {isTokenPanelOpen && (
            <div className="absolute top-full right-0 mt-3 w-80 z-50">
              <div className="p-1 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 shadow-2xl shadow-black/50">
                <TokenManager onSuccess={() => setIsTokenPanelOpen(false)} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
