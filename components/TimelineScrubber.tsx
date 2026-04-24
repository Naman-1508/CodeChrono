"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { CHANGE_TYPE_COLORS, AREA_COLORS } from "@/lib/heuristics";
import { formatDate } from "@/lib/utils";

type Commit = {
  _id: string;
  index: number;
  sha: string;
  cleanMessage: string;
  authorName: string;
  timestamp: number;
  significance: number;
  changeType: string;
  featureArea: string;
  chapterId?: string;
};

type Chapter = {
  _id: string;
  name: string;
  startCommitIndex: number;
  endCommitIndex: number;
  color: string;
  primaryFeatureArea: string;
};

type Props = {
  commits: Commit[];
  chapters: Chapter[];
  selectedIndex: number;
  onSelect: (index: number) => void;
};

type TooltipState = {
  visible: boolean;
  x: number;
  y: number;
  commit: Commit | null;
};

const SCRUBBER_HEIGHT = 100;
const DOT_AREA_Y = 60;
const CHAPTER_HEIGHT = 28;
const CHAPTER_Y = 4;
const MIN_PADDING = 30;

export function TimelineScrubber({ commits, chapters, selectedIndex, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(800);
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, commit: null });
  const isDragging = useRef(false);
  const lastCallTime = useRef(0);

  useEffect(() => {
    const obs = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const getX = useCallback(
    (index: number) => {
      if (commits.length <= 1) return width / 2;
      return MIN_PADDING + ((index / (commits.length - 1)) * (width - MIN_PADDING * 2));
    },
    [commits.length, width]
  );

  const getIndexFromX = useCallback(
    (x: number) => {
      const ratio = (x - MIN_PADDING) / (width - MIN_PADDING * 2);
      const index = Math.round(ratio * (commits.length - 1));
      return Math.max(0, Math.min(commits.length - 1, index));
    },
    [commits.length, width]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Throttle scrubbing to ~60fps
      if (isDragging.current) {
        const now = Date.now();
        if (now - lastCallTime.current < 16) return;
        lastCallTime.current = now;
        onSelect(getIndexFromX(x));
        return;
      }

      // Hover: find nearest commit dot
      let nearest: Commit | null = null;
      let minDist = 18;
      for (const c of commits) {
        const cx = getX(c.index);
        const dist = Math.abs(cx - x);
        if (Math.abs(y - DOT_AREA_Y) < 20 && dist < minDist) {
          minDist = dist;
          nearest = c;
        }
      }

      if (nearest) {
        setTooltip({ visible: true, x: getX(nearest.index), y: DOT_AREA_Y, commit: nearest });
      } else {
        setTooltip((t) => ({ ...t, visible: false }));
      }
    },
    [commits, getX, getIndexFromX, onSelect]
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowRight") onSelect(Math.min(selectedIndex + 1, commits.length - 1));
      if (e.key === "ArrowLeft") onSelect(Math.max(selectedIndex - 1, 0));
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, commits.length, onSelect]);

  if (commits.length === 0) return null;

  const selectedCommit = commits.find((c) => c.index === selectedIndex);

  return (
    <div ref={containerRef} className="relative w-full" style={{ userSelect: "none" }}>
      <svg
        ref={svgRef}
        width={width}
        height={SCRUBBER_HEIGHT}
        style={{ cursor: isDragging.current ? "grabbing" : "crosshair", display: "block" }}
        onMouseMove={handleMouseMove}
        onMouseDown={(e) => {
          isDragging.current = true;
          const rect = svgRef.current?.getBoundingClientRect();
          if (rect) onSelect(getIndexFromX(e.clientX - rect.left));
        }}
        onMouseUp={() => { isDragging.current = false; }}
        onMouseLeave={() => {
          isDragging.current = false;
          setTooltip((t) => ({ ...t, visible: false }));
        }}
      >
        {/* Timeline base line */}
        <line
          x1={MIN_PADDING}
          y1={DOT_AREA_Y}
          x2={width - MIN_PADDING}
          y2={DOT_AREA_Y}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={2}
        />

        {/* Chapter bands */}
        {chapters.map((ch) => {
          const x1 = getX(ch.startCommitIndex);
          const x2 = getX(ch.endCommitIndex);
          const bw = Math.max(x2 - x1, 4);
          return (
            <g key={ch._id}>
              <rect
                x={x1}
                y={CHAPTER_Y}
                width={bw}
                height={CHAPTER_HEIGHT}
                rx={6}
                fill={ch.color}
                fillOpacity={0.12}
                stroke={ch.color}
                strokeOpacity={0.3}
                strokeWidth={1}
              />
              {bw > 60 && (
                <text
                  x={x1 + bw / 2}
                  y={CHAPTER_Y + 17}
                  textAnchor="middle"
                  fontSize={9}
                  fontWeight={600}
                  fill={ch.color}
                  opacity={0.8}
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  {ch.name.length > 22 ? ch.name.slice(0, 22) + "…" : ch.name}
                </text>
              )}
            </g>
          );
        })}

        {/* Commit dots */}
        {commits.map((c) => {
          const cx = getX(c.index);
          const r = 3 + (c.significance / 10) * 5;
          const color = CHANGE_TYPE_COLORS[c.changeType] ?? "#94a3b8";
          const isSelected = c.index === selectedIndex;

          return (
            <g key={c._id}>
              {isSelected && (
                <>
                  <circle cx={cx} cy={DOT_AREA_Y} r={r + 8} fill={color} fillOpacity={0.15} className="pulse-ring" />
                  <circle cx={cx} cy={DOT_AREA_Y} r={r + 4} fill={color} fillOpacity={0.2} />
                </>
              )}
              <circle
                cx={cx}
                cy={DOT_AREA_Y}
                r={isSelected ? r + 2 : r}
                fill={color}
                fillOpacity={isSelected ? 1 : 0.75}
                stroke={isSelected ? "#fff" : "transparent"}
                strokeWidth={isSelected ? 1.5 : 0}
                style={{ transition: "r 0.15s ease" }}
              />
            </g>
          );
        })}

        {/* Scrubber position indicator */}
        {selectedCommit && (
          <line
            x1={getX(selectedIndex)}
            y1={CHAPTER_Y}
            x2={getX(selectedIndex)}
            y2={SCRUBBER_HEIGHT - 8}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth={1}
            strokeDasharray="3,3"
          />
        )}

        {/* Bottom date labels */}
        {commits.length > 0 && (
          <>
            <text x={MIN_PADDING} y={SCRUBBER_HEIGHT - 4} fontSize={9} fill="rgba(255,255,255,0.3)" style={{ fontFamily: "Inter" }}>
              {formatDate(commits[0].timestamp)}
            </text>
            <text x={width - MIN_PADDING} y={SCRUBBER_HEIGHT - 4} fontSize={9} fill="rgba(255,255,255,0.3)" textAnchor="end" style={{ fontFamily: "Inter" }}>
              {formatDate(commits[commits.length - 1].timestamp)}
            </text>
          </>
        )}
      </svg>

      {/* Tooltip */}
      {tooltip.visible && tooltip.commit && (
        <div
          className="absolute pointer-events-none z-50 glass rounded-xl p-3 text-xs max-w-xs"
          style={{
            left: Math.min(tooltip.x, width - 220),
            top: tooltip.y - 90,
            transform: "translateX(-50%)",
            borderColor: CHANGE_TYPE_COLORS[tooltip.commit.changeType] ?? "var(--border)",
          }}
        >
          <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
            {tooltip.commit.cleanMessage.slice(0, 60)}
          </p>
          <p style={{ color: "var(--text-muted)" }}>
            {tooltip.commit.authorName} · {formatDate(tooltip.commit.timestamp)}
          </p>
        </div>
      )}
    </div>
  );
}
