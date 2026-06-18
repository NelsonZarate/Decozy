"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useUpload } from "@/components/ui/UploadContext";

export function UploadArea() {
  const router = useRouter();
  const { isAuthenticated, isReady } = useAuth();
  const { imageUrl, setImage, clearImage } = useUpload();

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [chooserOpen, setChooserOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  // Clean up the stream when the camera modal closes or the component unmounts.
  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const handleAreaClick = () => {
    if (isReady && !isAuthenticated) {
      router.push("/signin");
      return;
    }
    setChooserOpen(true);
  };

  const applyImage = (blob: Blob) => {
    setImage(blob);
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) applyImage(file);
    setChooserOpen(false);
  };

  const openCamera = async () => {
    setChooserOpen(false);
    setCameraError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera is not supported on this device or browser.");
      setCameraOpen(true);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOpen(true);
      // Attach after the modal renders the video element.
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      });
    } catch {
      setCameraError(
        "Could not access the camera. Please allow camera permission and try again.",
      );
      setCameraOpen(true);
    }
  };

  const closeCamera = () => {
    stopCamera();
    setCameraOpen(false);
    setCameraError(null);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          applyImage(blob);
        }
        closeCamera();
      },
      "image/jpeg",
      0.92,
    );
  };

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={handleAreaClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") handleAreaClick();
        }}
        className="relative overflow-hidden border-2 border-dashed border-outline-variant rounded-lg flex flex-col items-center justify-center min-h-[210px] px-8 bg-surface-container-low cursor-pointer hover:border-secondary transition-colors"
      >
        {imageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Selected room"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <button
              type="button"
              aria-label="Remove image"
              onClick={(e) => {
                e.stopPropagation();
                clearImage();
              }}
              className="absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="18" y1="6" x2="6" y2="18" />
              </svg>
            </button>
          </>
        ) : (
          <>
            <svg
              width="48"
              height="48"
              viewBox="0 0 48 48"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-on-surface-variant mb-3"
            >
              <rect x="6" y="10" width="36" height="28" rx="3" />
              <circle cx="18" cy="22" r="4" />
              <path d="M42 32l-10-10-16 16" />
              <circle cx="36" cy="14" r="3" fill="currentColor" opacity="0.3" />
              <line x1="35" y1="11" x2="37" y2="11" strokeWidth="2" />
              <line x1="36" y1="10" x2="36" y2="12" strokeWidth="2" />
            </svg>
            <span className="text-sm font-medium text-on-surface-variant">
              Tap to Camera or Gallery
            </span>
          </>
        )}
      </div>

      {/* Hidden gallery input */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleGalleryChange}
        className="hidden"
      />

      {/* Source chooser action sheet */}
      {chooserOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          onClick={() => setChooserOpen(false)}
        >
          <div
            className="w-full max-w-md bg-surface rounded-t-2xl p-4 pb-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-outline-variant" />
            <h3 className="font-serif text-lg font-medium text-primary-container mb-3 px-2">
              Add a photo
            </h3>

            <button
              onClick={openCamera}
              className="w-full flex items-center gap-3 px-4 py-4 rounded-xl text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors text-left"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-secondary">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              Take a photo
            </button>

            <button
              onClick={() => galleryInputRef.current?.click()}
              className="w-full flex items-center gap-3 px-4 py-4 rounded-xl text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors text-left"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-secondary">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
              Choose from Gallery
            </button>

            <button
              onClick={() => setChooserOpen(false)}
              className="w-full mt-2 py-3 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Live camera modal */}
      {cameraOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black">
          {cameraError ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
              <p className="text-sm text-white/90">{cameraError}</p>
              <button
                onClick={closeCamera}
                className="px-6 py-2 rounded-full bg-white text-sm font-semibold text-black"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                className="flex-1 w-full object-cover"
              />
              <div className="flex items-center justify-between px-8 py-6 bg-black">
                <button
                  onClick={closeCamera}
                  className="text-sm font-semibold text-white/80"
                >
                  Cancel
                </button>
                <button
                  onClick={capturePhoto}
                  aria-label="Capture photo"
                  className="h-16 w-16 rounded-full border-4 border-white bg-white/30 active:scale-95 transition-transform"
                />
                <span className="w-12" aria-hidden />
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
