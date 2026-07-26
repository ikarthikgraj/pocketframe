"use client";

import { useState, useEffect, useRef } from "react";

const PREVIEW_VIDEOS = [
  { id: 1, src: "/previews/prev1.mp4", label: "POCKET FM ORIGINAL", title: "Insta Millionaire", category: "Drama · Romance", plays: "48.2M Plays", rating: "4.9 ★" },
  { id: 2, src: "/previews/prev2.mp4", label: "NO. 1 TRENDING", title: "Devil Se Shaadi", category: "Romantic Thriller", plays: "62.4M Plays", rating: "4.8 ★" },
  { id: 3, src: "/previews/prev3.mp4", label: "NEW RELEASE", title: "The Secret Heiress", category: "Mystery · Suspense", plays: "31.9M Plays", rating: "4.9 ★" },
  { id: 4, src: "/previews/prev4.mp4", label: "AUDIO BLOCKBUSTER", title: "My Vampire System", category: "Sci-Fi · Action", plays: "55.7M Plays", rating: "4.9 ★" },
];

export function TrailerStudioHeroVisual() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Auto-switch preview every 3.5 seconds
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % PREVIEW_VIDEOS.length);
    }, 3500);

    return () => clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      }
    }
  }, [currentIndex]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }
  };

  const skip10 = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime + seconds);
    }
  };

  const currentPreview = PREVIEW_VIDEOS[currentIndex];

  return (
    <div className="trailer-studio-hero-visual" role="region" aria-label="Pocket FM Audio Series Preview Player">
      <div className="square-mockup-frame pocketfm-audio-series-frame">
        <div className="mockup-header-bar pocketfm-header-bar">
          <div className="mockup-live-badge pocketfm-live-badge">
            <span className="live-dot" /> POCKET FM AUDIO SERIES
          </div>
          <span className="mockup-indicator pocketfm-ep-badge">EP 0{currentIndex + 1}</span>
        </div>

        <div className="mockup-video-wrapper">
          <video
            ref={videoRef}
            src={currentPreview.src}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="square-video-element"
          />

          <div className="mockup-video-overlay pocketfm-overlay">
            <div className="pocketfm-badge-row">
              <span className="pocketfm-tag">{currentPreview.label}</span>
              <span className="pocketfm-category">{currentPreview.category}</span>
            </div>
            <h3 className="pocketfm-series-title">{currentPreview.title}</h3>
            <div className="pocketfm-stats-bar">
              <span className="pocketfm-plays">🎧 {currentPreview.plays}</span>
              <span className="pocketfm-rating">{currentPreview.rating}</span>
              <div className="pocketfm-wave-visualizer" aria-hidden="true">
                <span className="wave-bar wb1" />
                <span className="wave-bar wb2" />
                <span className="wave-bar wb3" />
                <span className="wave-bar wb4" />
              </div>
            </div>
          </div>
        </div>

        <div className="mockup-controls-bar pocketfm-controls-bar">
          <div className="control-buttons">
            <button
              type="button"
              className="control-btn skip-btn"
              onClick={() => skip10(-10)}
              title="Rewind 10 seconds"
              aria-label="Rewind 10 seconds"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 19l-9-7 9-7v14z" />
                <path d="M22 19l-9-7 9-7v14z" />
              </svg>
              <span>-10s</span>
            </button>

            <button
              type="button"
              className="control-btn play-btn pocketfm-play-btn"
              onClick={togglePlay}
              title={isPlaying ? "Pause" : "Play"}
              aria-label={isPlaying ? "Pause audio preview" : "Play audio preview"}
            >
              {isPlaying ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5 3l14 9-14 9V3z" />
                </svg>
              )}
            </button>

            <button
              type="button"
              className="control-btn skip-btn"
              onClick={() => skip10(10)}
              title="Skip 10 seconds"
              aria-label="Skip 10 seconds"
            >
              <span>+10s</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 19l9-7-9-7v14z" />
                <path d="M2 19l9-7-9-7v14z" />
              </svg>
            </button>
          </div>

          <div className="preview-selector-pills">
            {PREVIEW_VIDEOS.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                className={`preview-pill pocketfm-ep-pill ${idx === currentIndex ? "active" : ""}`}
                onClick={() => setCurrentIndex(idx)}
                title={item.title}
              >
                Ep {idx + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}





