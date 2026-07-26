"use client";

import { useEffect, useState } from "react";

const WORKFLOW_STAGES = [
  { stage: "STAGE 01", icon: "📝", title: "Story Planning", desc: "Turn your raw plot idea into structured scenes and character beats." },
  { stage: "STAGE 02", icon: "🎙️", title: "Voice Direction", desc: "Bring your script to life with realistic voiceovers and emotion controls." },
  { stage: "STAGE 03", icon: "🎬", title: "Visual Shots", desc: "Preview and approve vertical scene visuals with consistent characters." },
  { stage: "STAGE 04", icon: "⚡️", title: "Final Cut", desc: "Combine video, narration, and background score into a ready-to-share trailer." },
];

export function GuidedWorkflowShowcase() {
  const [activeStage, setActiveStage] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStage((prev) => (prev + 1) % WORKFLOW_STAGES.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="landing-steps-container">
      <div className="landing-steps-header">
        <h2 className="workflow-section-title">Studio Production Pipeline</h2>
      </div>

      <div className="landing-steps" aria-label="Four production stages">
        {WORKFLOW_STAGES.map((item, idx) => {
          const isActive = idx === activeStage;
          return (
            <article
              key={item.stage}
              className={`step-card-modern ${isActive ? "is-pulse-active" : ""}`}
            >
              <div className="step-card-top-row">
                <span className="step-pill-tag">
                  {isActive && <span className="pulse-stage-dot" />}
                  {item.stage}
                </span>
                <span className="step-top-icon" aria-hidden="true">{item.icon}</span>
              </div>
              <h2>{item.title}</h2>
              <p>{item.desc}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
