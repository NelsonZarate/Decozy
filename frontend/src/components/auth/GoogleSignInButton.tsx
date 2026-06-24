"use client";

import { useEffect, useRef, useState } from "react";

const GIS_SRC = "https://accounts.google.com/gsi/client";
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

// Minimal shape of the Google Identity Services API we use.
interface GoogleCredentialResponse {
  credential: string; // the id_token (a JWT)
}

interface GoogleAccountsId {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select?: boolean;
  }) => void;
  renderButton: (
    parent: HTMLElement,
    options: Record<string, unknown>,
  ) => void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

let gisPromise: Promise<void> | null = null;

/** Load the Google Identity Services script once and reuse the promise. */
function loadGis(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.accounts?.id) return Promise.resolve();
  if (gisPromise) return gisPromise;

  gisPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${GIS_SRC}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("GIS load failed")));
      return;
    }
    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("GIS load failed"));
    document.head.appendChild(script);
  });
  return gisPromise;
}

export interface GoogleProfile {
  email: string;
  name: string;
}

/** Decode the public payload of a Google id_token (JWT) to read email/name. */
export function decodeGoogleProfile(idToken: string): GoogleProfile {
  try {
    const payload = idToken.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(""),
    );
    const data = JSON.parse(json) as { email?: string; name?: string };
    const email = data.email ?? "";
    return { email, name: data.name || email.split("@")[0] || "Google User" };
  } catch {
    return { email: "", name: "Google User" };
  }
}

interface GoogleSignInButtonProps {
  /** "signin_with" | "signup_with" | "continue_with" — the Google button text. */
  label?: string;
  /** Called with the Google id_token once the user signs in. */
  onCredential: (idToken: string) => void;
  /** Called if Google Identity Services cannot be set up. */
  onError?: (message: string) => void;
}

export function GoogleSignInButton({
  label = "signin_with",
  onCredential,
  onError,
}: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  // The client id is known at module load, so availability is derived, not state.
  const configured = Boolean(CLIENT_ID);

  // Keep the latest callbacks in refs (synced via effect, not during render).
  const onCredentialRef = useRef(onCredential);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onCredentialRef.current = onCredential;
    onErrorRef.current = onError;
  }, [onCredential, onError]);

  useEffect(() => {
    if (!CLIENT_ID) return;
    let cancelled = false;

    (async () => {
      try {
        await loadGis();
        if (cancelled) return;
        const id = window.google?.accounts?.id;
        const container = containerRef.current;
        if (!id || !container) return;

        id.initialize({
          client_id: CLIENT_ID,
          callback: (response) => onCredentialRef.current(response.credential),
        });

        // The Google button renders at a fixed pixel width (max 400).
        const width = Math.min(container.offsetWidth || 320, 400);
        container.innerHTML = "";
        id.renderButton(container, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: label,
          shape: "pill",
          logo_alignment: "center",
          width,
        });
      } catch {
        if (cancelled) return;
        setLoadFailed(true);
        onErrorRef.current?.("Could not load Google sign-in.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [label]);

  if (!configured || loadFailed) {
    return (
      <p className="text-center text-xs text-on-surface-variant">
        Google sign-in is unavailable right now.
      </p>
    );
  }

  return <div ref={containerRef} className="flex w-full justify-center" />;
}
