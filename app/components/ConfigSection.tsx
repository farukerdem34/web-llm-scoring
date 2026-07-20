"use client";

import { useState, useRef, useEffect } from "react";

interface ConfigSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function ConfigSection({
  title,
  defaultOpen = true,
  children,
}: ConfigSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | null>(
    defaultOpen ? null : 0
  );

  useEffect(() => {
    if (!contentRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      setContentHeight(entry.contentRect.height);
    });
    observer.observe(contentRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="border-b border-[var(--sand-200)] last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-12 w-full cursor-pointer items-center justify-between text-left"
        aria-expanded={isOpen}
      >
        <span className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--ink-muted)]">
          {title}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0 text-[var(--ink-faint)]"
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 200ms ease",
          }}
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>

      <div
        className="overflow-hidden"
        style={{
          height: contentHeight !== null ? contentHeight : "auto",
          transition: "height 200ms ease",
        }}
      >
        <div ref={contentRef} className="px-4 pb-6 pt-0">
          <div className="space-y-5">{children}</div>
        </div>
      </div>
    </div>
  );
}
