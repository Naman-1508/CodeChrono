"use client";

import { useState, useEffect } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getLanguageFromPath } from "@/lib/utils";
import { File, Folder, ChevronRight, Loader2, Code2 } from "lucide-react";
import dynamic from "next/dynamic";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });
const DiffEditor = dynamic(
  () => import("@monaco-editor/react").then((m) => m.DiffEditor),
  { ssr: false }
);

type TreeNode = {
  path: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
};

type Props = {
  owner: string;
  repo: string;
  commitSha: string;
  prevSha?: string;
  selectedFile: string | null;
  onFileSelect: (path: string) => void;
  changedFiles: string[];
  newFiles: string[];
  deletedFiles: string[];
};

type TreeEntry = { name: string; path: string; type: "blob" | "tree"; children?: TreeEntry[] };

function buildTree(nodes: TreeNode[]): TreeEntry[] {
  const root: TreeEntry[] = [];

  for (const node of nodes) {
    const parts = node.path.split("/");
    let current = root;
    for (let i = 0; i < parts.length; i++) {
      const name = parts[i];
      const isLast = i === parts.length - 1;
      let found = current.find((e) => e.name === name);
      if (!found) {
        found = {
          name,
          path: parts.slice(0, i + 1).join("/"),
          type: isLast ? node.type : "tree",
          children: isLast && node.type === "blob" ? undefined : [],
        };
        current.push(found);
      }
      if (found.children) current = found.children;
    }
  }

  function sortEntries(entries: TreeEntry[]): TreeEntry[] {
    return entries
      .map((e) => ({ ...e, children: e.children ? sortEntries(e.children) : undefined }))
      .sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === "tree" ? -1 : 1;
      });
  }

  return sortEntries(root);
}

function TreeItem({
  entry,
  depth,
  selectedFile,
  changedFiles,
  newFiles,
  deletedFiles,
  onFileSelect,
}: {
  entry: TreeEntry;
  depth: number;
  selectedFile: string | null;
  changedFiles: string[];
  newFiles: string[];
  deletedFiles: string[];
  onFileSelect: (path: string) => void;
}) {
  const [open, setOpen] = useState(depth < 1);

  const dotColor = newFiles.includes(entry.path)
    ? "#10b981"
    : deletedFiles.includes(entry.path)
    ? "#ef4444"
    : changedFiles.includes(entry.path)
    ? "#f59e0b"
    : null;

  const isSelected = selectedFile === entry.path;

  if (entry.type === "tree") {
    return (
      <div>
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1.5 w-full text-left py-1 px-2 rounded hover:bg-white/5 transition-colors text-xs"
          style={{ paddingLeft: `${8 + depth * 14}px`, color: "var(--text-secondary)" }}
        >
          <ChevronRight
            size={12}
            style={{ transform: open ? "rotate(90deg)" : "rotate(0)", transition: "transform 0.15s" }}
          />
          <Folder size={13} style={{ color: "#f59e0b" }} />
          <span>{entry.name}</span>
        </button>
        {open && entry.children?.map((child) => (
          <TreeItem
            key={child.path}
            entry={child}
            depth={depth + 1}
            selectedFile={selectedFile}
            changedFiles={changedFiles}
            newFiles={newFiles}
            deletedFiles={deletedFiles}
            onFileSelect={onFileSelect}
          />
        ))}
      </div>
    );
  }

  return (
    <button
      onClick={() => onFileSelect(entry.path)}
      className="flex items-center gap-1.5 w-full text-left py-1 px-2 rounded transition-colors text-xs"
      style={{
        paddingLeft: `${8 + depth * 14}px`,
        background: isSelected ? "rgba(0,255,170,0.08)" : "transparent",
        color: isSelected ? "var(--accent-green)" : "var(--text-secondary)",
      }}
    >
      <File size={12} />
      <span className="truncate flex-1">{entry.name}</span>
      {dotColor && (
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: dotColor }} />
      )}
    </button>
  );
}

export function CodeViewer({
  owner,
  repo,
  commitSha,
  prevSha,
  selectedFile,
  onFileSelect,
  changedFiles,
  newFiles,
  deletedFiles,
}: Props) {
  const [fileTree, setFileTree] = useState<TreeNode[]>([]);
  const [fileContent, setFileContent] = useState<string>("");
  const [prevContent, setPrevContent] = useState<string>("");
  const [loadingTree, setLoadingTree] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);

  const getFileTree = useAction(api.commitActions.getFileTree);
  const getFileContent = useAction(api.commitActions.getFileContent);

  // Load file tree when sha changes
  useEffect(() => {
    if (!commitSha) return;
    setLoadingTree(true);
    getFileTree({ owner, repo, sha: commitSha })
      .then((tree) => setFileTree(tree as TreeNode[]))
      .catch(console.error)
      .finally(() => setLoadingTree(false));
  }, [commitSha, owner, repo]);

  // Load file content when file or sha changes
  useEffect(() => {
    if (!selectedFile || !commitSha) return;
    setLoadingFile(true);
    setFileContent("");
    setPrevContent("");

    const contentPromise = getFileContent({ owner, repo, path: selectedFile, sha: commitSha });
    const prevPromise = prevSha
      ? getFileContent({ owner, repo, path: selectedFile, sha: prevSha }).catch(() => "")
      : Promise.resolve("");

    Promise.all([contentPromise, prevPromise])
      .then(([curr, prev]) => {
        setFileContent(curr as string);
        setPrevContent(prev as string);
      })
      .catch(console.error)
      .finally(() => setLoadingFile(false));
  }, [selectedFile, commitSha, prevSha, owner, repo]);

  const treeEntries = buildTree(fileTree);
  const language = selectedFile ? getLanguageFromPath(selectedFile) : "plaintext";

  return (
    <div className="flex h-full overflow-hidden rounded-2xl" style={{ border: "1px solid var(--border)", background: "var(--bg-card)" }}>
      {/* File tree */}
      <div
        className="overflow-y-auto flex-shrink-0"
        style={{ width: 240, borderRight: "1px solid var(--border)", background: "var(--bg-secondary)" }}
      >
        <div className="p-3 border-b flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
          <Code2 size={13} style={{ color: "var(--accent-green)" }} />
          <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>FILES</span>
          {loadingTree && <Loader2 size={11} className="animate-spin ml-auto" style={{ color: "var(--text-muted)" }} />}
        </div>
        <div className="py-1">
          {treeEntries.map((entry) => (
            <TreeItem
              key={entry.path}
              entry={entry}
              depth={0}
              selectedFile={selectedFile}
              changedFiles={changedFiles}
              newFiles={newFiles}
              deletedFiles={deletedFiles}
              onFileSelect={onFileSelect}
            />
          ))}
        </div>
      </div>

      {/* Code pane */}
      <div className="flex-1 overflow-hidden relative">
        {!selectedFile ? (
          <div className="flex items-center justify-center h-full" style={{ color: "var(--text-muted)" }}>
            <div className="text-center">
              <Code2 size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Select a file to view its code</p>
              <p className="text-xs mt-1 opacity-60">Arrow keys to navigate commits</p>
            </div>
          </div>
        ) : loadingFile ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={24} className="animate-spin" style={{ color: "var(--accent-green)" }} />
          </div>
        ) : prevSha && prevContent ? (
          <DiffEditor
            height="100%"
            language={language}
            original={prevContent}
            modified={fileContent}
            theme="vs-dark"
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: "on",
              wordWrap: "on",
              scrollBeyondLastLine: false,
              renderSideBySide: true,
            }}
          />
        ) : (
          <MonacoEditor
            height="100%"
            language={language}
            value={fileContent}
            theme="vs-dark"
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: "on",
              wordWrap: "on",
              scrollBeyondLastLine: false,
            }}
          />
        )}
      </div>
    </div>
  );
}
