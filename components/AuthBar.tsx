"use client";

import { SignInButton, SignOutButton } from "@clerk/nextjs";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { TokenManager } from "./TokenManager";
import { hasToken } from "@/lib/token";
import { Zap, Key, LogOut, ChevronDown } from "lucide-react";

export function AuthBar() {
  const { isSignedIn, clerkUser, effectiveRateLimit, isLoaded } = useAuth();

  const [showTokenPanel, setShowTokenPanel] = useState(false);
  const [tokenPresent, setTokenPresent] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Read PAT presence on mount (avoid SSR mismatch)
  useEffect(() => {
    setTokenPresent(hasToken());
  }, []);

  // Close panel on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowTokenPanel(false);
      }
    }
    if (showTokenPanel) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showTokenPanel]);

  if (!isLoaded) {
    return (
      <div
        className="w-32 h-8 rounded-full animate-pulse"
        style={{ background: "var(--bg-elevated)" }}
      />
    );
  }

  const rateColor = effectiveRateLimit === 5000 ? "#10b981" : "#f59e0b";
  const rateBackground =
    effectiveRateLimit === 5000
      ? "rgba(16,185,129,0.1)"
      : "rgba(245,158,11,0.1)";
  const rateBorder =
    effectiveRateLimit === 5000
      ? "rgba(16,185,129,0.25)"
      : "rgba(245,158,11,0.25)";

  return (
    <div className="flex items-center gap-3 relative" ref={panelRef}>
      {/* Rate limit badge */}
      <button
        id="rate-limit-badge"
        onClick={() => setShowTokenPanel((v) => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all"
        style={{ background: rateBackground, color: rateColor, border: `1px solid ${rateBorder}` }}
      >
        <Zap size={11} fill={rateColor} />
        {effectiveRateLimit.toLocaleString()} req/hr
      </button>

      {/* Signed-in state */}
      {isSignedIn && clerkUser ? (
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={clerkUser.avatarUrl}
            alt={clerkUser.name}
            className="w-7 h-7 rounded-full"
          />
          <span
            className="text-sm hidden sm:block"
            style={{ color: "var(--text-secondary)" }}
          >
            {clerkUser.username || clerkUser.name}
          </span>

          {/* PAT addon toggle */}
          <button
            id="pat-toggle-btn"
            onClick={() => setShowTokenPanel((v) => !v)}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-all"
            style={{
              borderColor: tokenPresent ? "rgba(16,185,129,0.35)" : "var(--border)",
              color: tokenPresent ? "#10b981" : "var(--text-muted)",
              background: tokenPresent ? "rgba(16,185,129,0.08)" : "transparent",
            }}
          >
            <Key size={11} />
            {tokenPresent ? "PAT" : "+ PAT"}
            <ChevronDown size={11} />
          </button>

          <SignOutButton>
            <button
              className="flex items-center gap-1 text-xs transition-colors"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
            >
              <LogOut size={12} /> Sign out
            </button>
          </SignOutButton>
        </div>
      ) : (
        /* Anonymous state */
        <div className="flex items-center gap-2">
          <button
            id="anon-token-btn"
            onClick={() => setShowTokenPanel((v) => !v)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all"
            style={{
              borderColor: tokenPresent ? "rgba(16,185,129,0.35)" : "var(--border)",
              color: tokenPresent ? "#10b981" : "var(--text-secondary)",
              background: tokenPresent ? "rgba(16,185,129,0.08)" : "var(--bg-elevated)",
            }}
          >
            <Key size={11} />
            {tokenPresent ? "Token connected" : "Add GitHub token"}
          </button>

          <Link
            href="/sign-in"
            id="signin-btn"
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all"
            style={{
              background: "var(--bg-elevated)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg-card)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--bg-elevated)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            Sign in
          </Link>
        </div>
      )}

      {/* Token panel dropdown */}
      {showTokenPanel && (
        <div
          className="absolute top-10 right-0 z-50 w-80 p-4 rounded-2xl shadow-2xl"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            backdropFilter: "blur(16px)",
          }}
        >
          {isSignedIn && (
            <p
              className="text-xs pb-3 mb-3"
              style={{
                color: "var(--text-muted)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              You&apos;re signed in via GitHub OAuth (5,000 req/hr). Add a
              fine-grained PAT for private repo access with minimal permissions —
              PAT always takes priority.
            </p>
          )}
          <TokenManager
            onTokenChange={(token) => {
              setTokenPresent(!!token);
              setShowTokenPanel(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
