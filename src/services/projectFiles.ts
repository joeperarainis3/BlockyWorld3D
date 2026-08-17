/// <reference types="vite/client" />
import JSZip from 'jszip';

// Dynamic in-memory bundling of ALL project files across the entire codebase
// 1. All files in /src (components, game worlds, audio, services, types, css, etc.)
const srcFiles = (import.meta as any).glob(
  '../**/*.{ts,tsx,css,json,html,js,svg}',
  { query: '?raw', import: 'default', eager: true }
) as Record<string, string>;

// 2. All root configuration and project files
const rootFiles = (import.meta as any).glob(
  [
    '../../index.html',
    '../../package.json',
    '../../tsconfig.json',
    '../../vite.config.ts',
    '../../metadata.json',
    '../../.env.example',
    '../../.gitignore',
    '../../firebase-applet-config.json'
  ],
  { query: '?raw', import: 'default', eager: true }
) as Record<string, string>;

export interface ProjectCodeFile {
  path: string; // e.g. "src/App.tsx" or "src/game/worlds/lobbyWorld.ts"
  fileName: string; // e.g. "App.tsx"
  folder: string; // e.g. "src" or "src/game/worlds"
  content: string;
  size: number;
  mimeType: string;
}

export function getAllProjectCodeFiles(): ProjectCodeFile[] {
  const fileMap = new Map<string, ProjectCodeFile>();

  // Process src files (relative path from /src/services/ -> "../")
  for (const [rawPath, content] of Object.entries(srcFiles)) {
    if (typeof content !== 'string' && typeof content !== 'object') continue;
    
    // Normalize path to "src/..."
    const cleanPath = rawPath
      .replace(/^\.\.\//, 'src/')
      .replace(/\\/g, '/');

    const parts = cleanPath.split('/');
    const fileName = parts[parts.length - 1];
    const folder = parts.length > 1 ? parts.slice(0, -1).join('/') : '';

    let mimeType = 'text/plain';
    if (fileName.endsWith('.json')) mimeType = 'application/json';
    else if (fileName.endsWith('.ts') || fileName.endsWith('.tsx')) mimeType = 'text/typescript';
    else if (fileName.endsWith('.css')) mimeType = 'text/css';
    else if (fileName.endsWith('.html')) mimeType = 'text/html';
    else if (fileName.endsWith('.svg')) mimeType = 'image/svg+xml';

    const stringContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2);

    fileMap.set(cleanPath, {
      path: cleanPath,
      fileName,
      folder,
      content: stringContent,
      size: stringContent.length,
      mimeType,
    });
  }

  // Process root files (relative path from /src/services/ -> "../../")
  for (const [rawPath, content] of Object.entries(rootFiles)) {
    if (typeof content !== 'string' && typeof content !== 'object') continue;

    // Normalize path to root fileName (e.g. "package.json")
    const cleanPath = rawPath
      .replace(/^\.\.\/\.\.\//, '')
      .replace(/\\/g, '/');

    const parts = cleanPath.split('/');
    const fileName = parts[parts.length - 1];
    const folder = parts.length > 1 ? parts.slice(0, -1).join('/') : '';

    let mimeType = 'text/plain';
    if (fileName.endsWith('.json')) mimeType = 'application/json';
    else if (fileName.endsWith('.ts') || fileName.endsWith('.tsx')) mimeType = 'text/typescript';
    else if (fileName.endsWith('.css')) mimeType = 'text/css';
    else if (fileName.endsWith('.html')) mimeType = 'text/html';

    const stringContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2);

    fileMap.set(cleanPath, {
      path: cleanPath,
      fileName,
      folder,
      content: stringContent,
      size: stringContent.length,
      mimeType,
    });
  }

  // Sort array alphabetically by path
  return Array.from(fileMap.values()).sort((a, b) => a.path.localeCompare(b.path));
}

// Generate and trigger browser download of a real .zip file containing ALL project files
export async function downloadProjectAsZip(onProgress?: (percent: number) => void): Promise<void> {
  const zip = new JSZip();
  const allFiles = getAllProjectCodeFiles();

  // Add every single file to the zip maintaining folder structure
  for (const file of allFiles) {
    zip.file(file.path, file.content);
  }

  // Generate zip binary
  const blob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 },
    },
    (metadata) => {
      if (onProgress) {
        onProgress(Math.round(metadata.percent));
      }
    }
  );

  // Trigger instant browser download
  const dateStr = new Date().toISOString().slice(0, 10);
  const zipName = `BlockyWorld3D_SourceCode_${dateStr}.zip`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = zipName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

