"use client";

type FileStatEntry = {
  filePath: string;
  changeCount: number;
  stabilityScore: number;
  isHotspot: boolean;
  primaryArea: string;
};

type Props = {
  fileStats: FileStatEntry[];
  onFileSelect?: (path: string) => void;
};

const AREA_COLORS: Record<string, string> = {
  auth: "#7c3aed",
  api: "#0ea5e9",
  database: "#f59e0b",
  ui: "#ec4899",
  testing: "#10b981",
  docs: "#94a3b8",
  config: "#64748b",
  devops: "#ff6b35",
  utils: "#00ffaa",
  general: "#6366f1",
};

export function HeatmapOverlay({ fileStats, onFileSelect }: Props) {
  const hotspots = fileStats.filter((f) => f.isHotspot).slice(0, 20);
  const maxChanges = Math.max(...hotspots.map((f) => f.changeCount), 1);

  return (
    <div className="glass rounded-2xl p-5">
      <h3 className="font-bold mb-1" style={{ color: "var(--text-primary)" }}>Hotspot Files</h3>
      <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
        Files changed in &gt;20% of commits
      </p>

      {hotspots.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>No hotspots detected</p>
      ) : (
        <div className="space-y-2">
          {hotspots.map((f) => {
            const ratio = f.changeCount / maxChanges;
            const color = AREA_COLORS[f.primaryArea] ?? "#6366f1";
            return (
              <button
                key={f.filePath}
                onClick={() => onFileSelect?.(f.filePath)}
                className="w-full text-left group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className="text-xs mono truncate flex-1 mr-2 group-hover:text-white transition-colors"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {f.filePath}
                  </span>
                  <span className="text-xs flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                    {f.changeCount}×
                  </span>
                </div>
                <div className="w-full rounded-full overflow-hidden" style={{ height: 4, background: "var(--bg-elevated)" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${ratio * 100}%`, background: color, opacity: 0.7 }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
