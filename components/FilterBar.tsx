"use client";

import { Search, Filter, X } from "lucide-react";

type Filters = {
  query: string;
  featureArea: string;
  changeType: string;
  author: string;
};

type Props = {
  filters: Filters;
  onFiltersChange: (f: Filters) => void;
  authors: string[];
  featureAreas: string[];
};

const CHANGE_TYPES = ["", "feature", "bugfix", "refactor", "docs", "test", "chore", "breaking"];

export function FilterBar({ filters, onFiltersChange, authors, featureAreas }: Props) {
  function update(patch: Partial<Filters>) {
    onFiltersChange({ ...filters, ...patch });
  }

  const hasFilters = filters.query || filters.featureArea || filters.changeType || filters.author;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Search */}
      <div className="relative flex-1 min-w-48">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
        <input
          id="commit-search-input"
          type="text"
          placeholder="Search commits…"
          value={filters.query}
          onChange={(e) => update({ query: e.target.value })}
          className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none transition-all"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
          }}
        />
      </div>

      {/* Feature Area */}
      <select
        id="area-filter"
        value={filters.featureArea}
        onChange={(e) => update({ featureArea: e.target.value })}
        className="rounded-lg text-sm px-3 py-2 outline-none transition-all"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          color: filters.featureArea ? "var(--text-primary)" : "var(--text-muted)",
        }}
      >
        <option value="">All Areas</option>
        {featureAreas.map((a) => (
          <option key={a} value={a}>{a}</option>
        ))}
      </select>

      {/* Change Type */}
      <select
        id="type-filter"
        value={filters.changeType}
        onChange={(e) => update({ changeType: e.target.value })}
        className="rounded-lg text-sm px-3 py-2 outline-none transition-all"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          color: filters.changeType ? "var(--text-primary)" : "var(--text-muted)",
        }}
      >
        {CHANGE_TYPES.map((t) => (
          <option key={t} value={t}>{t || "All Types"}</option>
        ))}
      </select>

      {/* Author */}
      <select
        id="author-filter"
        value={filters.author}
        onChange={(e) => update({ author: e.target.value })}
        className="rounded-lg text-sm px-3 py-2 outline-none transition-all"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          color: filters.author ? "var(--text-primary)" : "var(--text-muted)",
        }}
      >
        <option value="">All Authors</option>
        {authors.map((a) => (
          <option key={a} value={a}>{a}</option>
        ))}
      </select>

      {/* Clear */}
      {hasFilters && (
        <button
          id="clear-filters-btn"
          onClick={() => onFiltersChange({ query: "", featureArea: "", changeType: "", author: "" })}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all"
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            color: "#ef4444",
          }}
        >
          <X size={13} /> Clear
        </button>
      )}
    </div>
  );
}
