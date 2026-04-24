"use client";

import { useUser, useSession } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { getToken, getBestToken, hasToken } from "./token";

export type ClerkUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  username: string;
};

export type AuthState = {
  /** True when signed in via Clerk */
  isSignedIn: boolean;
  /** Clerk user profile, null if not signed in */
  clerkUser: ClerkUser | null;
  /** GitHub OAuth token obtained from the Clerk session (if signed in) */
  clerkOAuthToken: string | null;
  /** True when a PAT is stored in localStorage */
  hasPAT: boolean;
  /** PAT value from localStorage */
  patToken: string | null;
  /** Best available token: PAT > Clerk OAuth > null */
  bestToken: string | null;
  /** 5000 if any token present, 60 otherwise */
  effectiveRateLimit: number;
  /** True when PAT or Clerk OAuth is available */
  canAccessPrivateRepos: boolean;
  /** True if signed in OR has PAT */
  hasAnyAuth: boolean;
  /** False while Clerk is still hydrating */
  isLoaded: boolean;
};

export function useAuth(): AuthState {
  const { isSignedIn, user, isLoaded: clerkLoaded } = useUser();
  const { session } = useSession();

  const [clerkOAuthToken, setClerkOAuthToken] = useState<string | null>(null);
  const [patToken, setPatToken] = useState<string | null>(null);
  const [isLocalLoaded, setIsLocalLoaded] = useState(false);

  // Read PAT from localStorage on mount
  useEffect(() => {
    setPatToken(getToken());
    setIsLocalLoaded(true);
  }, []);

  // Obtain GitHub OAuth token from Clerk session
  useEffect(() => {
    if (!isSignedIn || !session) {
      setClerkOAuthToken(null);
      return;
    }
    session
      .getToken({ template: "github-oauth" })
      .then((t) => setClerkOAuthToken(t))
      .catch(() => setClerkOAuthToken(null));
  }, [isSignedIn, session]);

  const bestToken = getBestToken(clerkOAuthToken);
  const hasAnyAuth = !!(isSignedIn || patToken);
  const canAccessPrivateRepos = hasAnyAuth;
  const effectiveRateLimit = bestToken ? 5000 : 60;

  return {
    isSignedIn: isSignedIn ?? false,
    clerkUser:
      isSignedIn && user
        ? {
            id: user.id,
            name: user.fullName ?? user.username ?? "",
            email: user.primaryEmailAddress?.emailAddress ?? "",
            avatarUrl: user.imageUrl,
            username: user.username ?? "",
          }
        : null,
    clerkOAuthToken,
    hasPAT: hasToken(),
    patToken,
    bestToken,
    effectiveRateLimit,
    canAccessPrivateRepos,
    hasAnyAuth,
    isLoaded: isLocalLoaded && clerkLoaded,
  };
}
