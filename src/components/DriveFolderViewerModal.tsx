import React, { useState, useEffect } from 'react';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  FileJson,
  ChevronRight,
  ExternalLink,
  Download,
  Copy,
  Check,
  ArrowLeft,
  RefreshCw,
  X,
  Eye,
  Calendar,
  HardDrive,
  Code2,
} from 'lucide-react';
import { GoogleDriveService } from '../services/googleDriveService';
import { sounds } from '../audio/soundManager';

interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime: string;
  webViewLink?: string;
  isFolder: boolean;
}

interface Breadcrumb {
  id: string;
  name: string;
}

interface DriveFolderViewerModalProps {
  isOpen: boolean;
  rootFolderId: string | null;
  rootFolderName: string;
  onClose: () => void;
  onNotify: (msg: string, icon?: string) => void;
}

export const DriveFolderViewerModal: React.FC<DriveFolderViewerModalProps> = ({
  isOpen,
  rootFolderId,
  rootFolderName,
  onClose,
  onNotify,
}) => {
  const [currentFolderId, setCurrentFolderId] = useState<string>('');
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
  const [items, setItems] = useState<DriveItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // File Preview State
  const [previewFile, setPreviewFile] = useState<{
    id: string;
    name: string;
    content: string;
    size?: string;
    mimeType: string;
    webViewLink?: string;
  } | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && rootFolderId) {
      setCurrentFolderId(rootFolderId);
      setBreadcrumbs([{ id: rootFolderId, name: rootFolderName }]);
      setPreviewFile(null);
      fetchFolderContents(rootFolderId);
    }
  }, [isOpen, rootFolderId, rootFolderName]);

  const fetchFolderContents = async (folderId: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const files = await GoogleDriveService.listFilesInFolder(folderId);
      setItems(files);
    } catch (err: any) {
      console.error('Failed to load drive folder contents:', err);
      setErrorMessage(err.message || 'Could not load folder contents from Google Drive.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenFolder = (item: DriveItem) => {
    sounds.playClick();
    setCurrentFolderId(item.id);
    setBreadcrumbs((prev) => [...prev, { id: item.id, name: item.name }]);
    setPreviewFile(null);
    fetchFolderContents(item.id);
  };

  const handleNavigateBreadcrumb = (index: number) => {
    sounds.playClick();
    const target = breadcrumbs[index];
    setBreadcrumbs(breadcrumbs.slice(0, index + 1));
    setCurrentFolderId(target.id);
    setPreviewFile(null);
    fetchFolderContents(target.id);
  };

  const handleNavigateUp = () => {
    if (breadcrumbs.length <= 1) return;
    sounds.playClick();
    const newCrumbs = breadcrumbs.slice(0, -1);
    const parent = newCrumbs[newCrumbs.length - 1];
    setBreadcrumbs(newCrumbs);
    setCurrentFolderId(parent.id);
    setPreviewFile(null);
    fetchFolderContents(parent.id);
  };

  const handleOpenFile = async (item: DriveItem) => {
    sounds.playClick();
    setIsLoadingPreview(true);
    setErrorMessage(null);
    try {
      const content = await GoogleDriveService.getFileContent(item.id);
      setPreviewFile({
        id: item.id,
        name: item.name,
        content,
        size: item.size,
        mimeType: item.mimeType,
        webViewLink: item.webViewLink || `https://drive.google.com/file/d/${item.id}/view`,
      });
    } catch (err: any) {
      console.error('Failed to read file:', err);
      setErrorMessage(err.message || `Failed to read ${item.name}`);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleCopyCode = () => {
    if (!previewFile) return;
    navigator.clipboard.writeText(previewFile.content);
    setCopied(true);
    sounds.playPop();
    onNotify(`Copied ${previewFile.name} to clipboard!`, '📋');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSingleFile = () => {
    if (!previewFile) return;
    const blob = new Blob([previewFile.content], { type: previewFile.mimeType || 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = previewFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    sounds.playPop();
    onNotify(`Downloaded ${previewFile.name}!`, '💾');
  };

  const getFileIcon = (name: string, mimeType: string, isFolder: boolean) => {
    if (isFolder) return <Folder className="w-5 h-5 text-amber-400 fill-amber-400/20 shrink-0" />;
    if (name.endsWith('.json')) return <FileJson className="w-5 h-5 text-yellow-400 shrink-0" />;
    if (name.endsWith('.ts') || name.endsWith('.tsx') || name.endsWith('.js') || name.endsWith('.jsx')) {
      return <FileCode className="w-5 h-5 text-cyan-400 shrink-0" />;
    }
    if (name.endsWith('.css') || name.endsWith('.html')) {
      return <Code2 className="w-5 h-5 text-indigo-400 shrink-0" />;
    }
    return <FileText className="w-5 h-5 text-emerald-400 shrink-0" />;
  };

  if (!isOpen) return null;

  return (
    <div
      id="drive_folder_viewer_modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl h-[85vh] bg-slate-900 border-2 border-emerald-500/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Title and Quick Actions */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 border-b border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shrink-0">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-white truncate">
                  Google Drive Folder Explorer
                </h3>
                <span className="hidden sm:inline px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Cloud Live
                </span>
              </div>
              <p className="text-xs text-white/60 truncate">
                Browse and view all files and subfolders stored in this Google Drive backup
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Open directly in Google Drive web */}
            <a
              href={`https://drive.google.com/drive/folders/${currentFolderId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-400/30 text-xs font-bold transition-all"
              title="Open this folder in Google Drive web tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Open in Drive</span>
            </a>

            <button
              onClick={() => fetchFolderContents(currentFolderId)}
              disabled={isLoading}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 transition-all disabled:opacity-50"
              title="Refresh Folder"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 transition-all hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Breadcrumb Navigation Bar */}
        <div className="px-4 py-2.5 bg-black/40 border-b border-white/10 flex items-center gap-2 overflow-x-auto text-xs">
          {breadcrumbs.length > 1 && (
            <button
              onClick={handleNavigateUp}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-[11px] transition-all shrink-0"
              title="Go to Parent Folder"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Back</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 shrink-0">
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <React.Fragment key={crumb.id}>
                  {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-white/30 shrink-0" />}
                  <button
                    onClick={() => handleNavigateBreadcrumb(idx)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-[11px] transition-all truncate max-w-[200px] ${
                      isLast
                        ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {idx === 0 ? <HardDrive className="w-3 h-3" /> : <Folder className="w-3 h-3 text-amber-400" />}
                    <span className="truncate">{crumb.name}</span>
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-4 mt-3 p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center justify-between">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="text-white/60 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Split View: Left File/Folder Directory List | Right Code/File Previewer */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left: Files & Subfolders Grid/List */}
          <div
            className={`flex-1 overflow-y-auto p-4 space-y-2 ${
              previewFile ? 'hidden md:block md:w-5/12 md:max-w-md md:border-r md:border-white/10' : 'w-full'
            }`}
          >
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3 text-white/60">
                <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider">Loading folder files from Google Drive...</span>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 gap-2 text-white/40 border-2 border-dashed border-white/10 rounded-2xl p-6 text-center">
                <FolderOpen className="w-10 h-10 text-white/20" />
                <div className="text-sm font-bold text-white/60">This folder is empty</div>
                <div className="text-xs">No files or subdirectories found in this path.</div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="text-[11px] font-black uppercase tracking-wider text-white/50 px-2 py-1 flex items-center justify-between">
                  <span>Contents ({items.length} items)</span>
                  <span>Click to open</span>
                </div>

                {items.map((item) => {
                  const isSelected = previewFile?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => (item.isFolder ? handleOpenFolder(item) : handleOpenFile(item))}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer group ${
                        isSelected
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-white shadow-lg'
                          : 'bg-white/5 hover:bg-white/10 border-white/5 text-white/90'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {getFileIcon(item.name, item.mimeType, item.isFolder)}
                        <div className="min-w-0">
                          <div className="font-mono text-xs font-bold truncate group-hover:text-emerald-300 transition-colors">
                            {item.name}
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-white/40 mt-0.5">
                            {item.size && (
                              <span>{(parseInt(item.size, 10) / 1024).toFixed(1)} KB</span>
                            )}
                            <span>{new Date(item.modifiedTime).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {item.isFolder ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Folder
                          </span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenFile(item);
                            }}
                            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all"
                            title="Preview file"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Interactive Code/File Viewer Panel */}
          {previewFile ? (
            <div className="flex-1 flex flex-col bg-black/60 overflow-hidden border-t md:border-t-0 md:border-l border-white/10">
              {/* File Header Toolbar */}
              <div className="p-3 bg-slate-950 border-b border-white/10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  {getFileIcon(previewFile.name, previewFile.mimeType, false)}
                  <div className="min-w-0">
                    <h4 className="font-mono text-xs font-bold text-white truncate">
                      {previewFile.name}
                    </h4>
                    <span className="text-[10px] text-white/50 font-mono">
                      {previewFile.content.split('\n').length} lines ·{' '}
                      {(previewFile.content.length / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all active:scale-95"
                    title="Copy to Clipboard"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={handleDownloadSingleFile}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/40 hover:bg-emerald-600/60 text-emerald-200 border border-emerald-500/40 text-xs font-bold transition-all active:scale-95"
                    title="Download File"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Download</span>
                  </button>

                  {previewFile.webViewLink && (
                    <a
                      href={previewFile.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all"
                      title="Open file in Google Drive"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}

                  <button
                    onClick={() => setPreviewFile(null)}
                    className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all md:hidden"
                    title="Close preview"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Code / Text Body with Line Numbers */}
              <div className="flex-1 overflow-auto p-4 font-mono text-xs text-white/90 bg-[#0d1117] leading-relaxed">
                {isLoadingPreview ? (
                  <div className="flex items-center justify-center h-full gap-2 text-white/50">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Loading file content...</span>
                  </div>
                ) : (
                  <div className="table w-full">
                    {previewFile.content.split('\n').map((line, lineIdx) => (
                      <div key={lineIdx} className="table-row hover:bg-white/5">
                        <span className="table-cell pr-4 py-0.5 text-right select-none text-white/30 text-[11px] w-10">
                          {lineIdx + 1}
                        </span>
                        <span className="table-cell py-0.5 whitespace-pre font-mono text-[12px] text-emerald-200/90 break-all">
                          {line || '\n'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="hidden md:flex flex-1 flex-col items-center justify-center p-8 bg-black/40 text-white/40 text-center gap-3">
              <FileCode className="w-12 h-12 text-white/20" />
              <div className="text-sm font-bold text-white/60">Select a file to inspect its content</div>
              <p className="text-xs max-w-xs text-white/40">
                Click on any TypeScript, JSON, React component, or CSS file on the left to read its full code with line numbers.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
