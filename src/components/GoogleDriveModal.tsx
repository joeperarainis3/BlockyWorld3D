import React, { useState, useEffect } from 'react';
import {
  X,
  HardDrive,
  Cloud,
  CloudUpload,
  CloudDownload,
  Trash2,
  FolderOpen,
  Save,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  Coins,
  Gem,
  Award,
  RefreshCw,
  LogOut,
  ExternalLink,
  Code,
  FileCode,
  FileText,
  FolderArchive,
  Check,
  Download,
  Package,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { googleSignIn, logout, getAccessToken } from '../services/firebaseAuth';
import {
  GoogleDriveService,
  DriveCourseMetadata,
  DriveSaveMetadata,
  DriveCourseData,
  DriveSaveData,
} from '../services/googleDriveService';
import { getAllProjectCodeFiles, downloadProjectAsZip, ProjectCodeFile } from '../services/projectFiles';
import { ConfirmModal } from './ConfirmModal';
import { DriveFolderViewerModal } from './DriveFolderViewerModal';
import { sounds } from '../audio/soundManager';
import { SandboxBlock, AvatarCustomization, Pet, TycoonButton } from '../types';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onUserChanged: (user: User | null) => void;
  // Studio Course context
  currentBlocks: SandboxBlock[];
  onLoadCourseBlocks: (blocks: SandboxBlock[], title: string) => void;
  // Game progress context
  coins: number;
  gems: number;
  obbyStage: number;
  pets: Pet[];
  avatar: AvatarCustomization;
  tycoonButtons: TycoonButton[];
  onRestoreGameSave: (saveData: DriveSaveData) => void;
  onNotify: (text: string, icon?: string) => void;
}

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChanged,
  currentBlocks,
  onLoadCourseBlocks,
  coins,
  gems,
  obbyStage,
  pets,
  avatar,
  tycoonButtons,
  onRestoreGameSave,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<'courses' | 'saves' | 'code' | 'account'>('code');
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Courses state
  const [courses, setCourses] = useState<DriveCourseMetadata[]>([]);
  const [courseTitle, setCourseTitle] = useState<string>('My Awesome Obby');
  const [courseDesc, setCourseDesc] = useState<string>('Created in Blocky World 3D Studio');

  // Saves state
  const [saves, setSaves] = useState<DriveSaveMetadata[]>([]);

  // Code files & backups state
  const [projectCodeFiles, setProjectCodeFiles] = useState<ProjectCodeFile[]>([]);
  const [codeBackups, setCodeBackups] = useState<{ id: string; name: string; modifiedTime: string; webViewLink?: string }[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
    currentFileName: string;
  } | null>(null);
  const [lastUploadedFolder, setLastUploadedFolder] = useState<{ id: string; name: string } | null>(null);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [zipProgress, setZipProgress] = useState<number>(0);

  // About Info
  const [aboutInfo, setAboutInfo] = useState<{ user?: any; storageQuota?: any } | null>(null);

  // Folder Explorer Modal state
  const [folderViewerTarget, setFolderViewerTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Confirm delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
    type: 'course' | 'save' | 'code';
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    // Load local project code files bundle
    const files = getAllProjectCodeFiles();
    setProjectCodeFiles(files);
  }, []);

  useEffect(() => {
    if (isOpen && currentUser) {
      loadDriveData();
    }
  }, [isOpen, currentUser]);

  const loadDriveData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [fetchedCourses, fetchedSaves, fetchedCodeBackups] = await Promise.all([
        GoogleDriveService.listCourses().catch(() => []),
        GoogleDriveService.listSaves().catch(() => []),
        GoogleDriveService.listCodeBackups().catch(() => []),
      ]);
      setCourses(fetchedCourses);
      setSaves(fetchedSaves);
      setCodeBackups(fetchedCodeBackups);

      GoogleDriveService.getAboutInfo()
        .then((info) => setAboutInfo(info))
        .catch(() => {});
    } catch (err: any) {
      console.error('Error loading Drive data:', err);
      setErrorMessage(err.message || 'Failed to load files from Google Drive.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMessage(null);
    try {
      const res = await googleSignIn();
      if (res?.user) {
        onUserChanged(res.user);
        onNotify('Connected to Google Drive!', '☁️');
        sounds.playVictory();
      }
    } catch (err: any) {
      console.error('Sign in failed:', err);
      setErrorMessage(err.message || 'Failed to authenticate with Google Drive.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    onUserChanged(null);
    setCourses([]);
    setSaves([]);
    setAboutInfo(null);
    onNotify('Signed out of Google Drive', '👋');
  };

  // Save course to Google Drive
  const handleSaveCourse = async () => {
    if (currentBlocks.length === 0) {
      setErrorMessage('Cannot save empty course. Place some blocks in Studio first!');
      return;
    }
    if (!courseTitle.trim()) {
      setErrorMessage('Please provide a title for your course.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await GoogleDriveService.saveCourse(
        courseTitle,
        courseDesc,
        currentBlocks,
        undefined,
        currentUser?.displayName || 'Player'
      );
      sounds.playVictory();
      onNotify(`Course "${courseTitle}" saved to Google Drive!`, '☁️');
      await loadDriveData();
    } catch (err: any) {
      console.error('Save course error:', err);
      setErrorMessage(err.message || 'Failed to save course to Google Drive.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load course from Google Drive
  const handleLoadCourse = async (fileId: string, courseName: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const courseData = await GoogleDriveService.loadCourse(fileId);
      onLoadCourseBlocks(courseData.blocks, courseData.title || courseName);
      sounds.playCheckpoint();
      onNotify(`Loaded "${courseData.title || courseName}" (${courseData.blocks.length} blocks)!`, '🛠️');
      onClose();
    } catch (err: any) {
      console.error('Load course error:', err);
      setErrorMessage(err.message || 'Failed to load course from Google Drive.');
    } finally {
      setIsLoading(false);
    }
  };

  // Backup Game Save to Google Drive
  const handleSaveGameProgress = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await GoogleDriveService.saveGameProgress({
        coins,
        gems,
        stage: obbyStage,
        totalCheckpoints: obbyStage,
        pets,
        avatar,
        tycoonProgress: tycoonButtons.filter((b) => b.built).map((b) => b.id),
      });
      sounds.playVictory();
      onNotify('Game progress backed up to Google Drive!', '☁️');
      await loadDriveData();
    } catch (err: any) {
      console.error('Save progress error:', err);
      setErrorMessage(err.message || 'Failed to backup game progress.');
    } finally {
      setIsLoading(false);
    }
  };

  // Restore Game Save from Google Drive
  const handleRestoreGameSave = async (fileId: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const saveData = await GoogleDriveService.loadGameProgress(fileId);
      onRestoreGameSave(saveData);
      sounds.playVictory();
      onNotify('Game progress restored from Google Drive!', '✨');
      onClose();
    } catch (err: any) {
      console.error('Restore save error:', err);
      setErrorMessage(err.message || 'Failed to restore game progress.');
    } finally {
      setIsLoading(false);
    }
  };

  // Upload all project code files to Google Drive
  const handleUploadAllCodeFiles = async () => {
    if (projectCodeFiles.length === 0) {
      setErrorMessage('No code files found to upload.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setUploadProgress({ current: 0, total: projectCodeFiles.length, currentFileName: 'Creating Drive folder...' });

    try {
      const result = await GoogleDriveService.uploadAllCodeFiles(
        projectCodeFiles,
        (current, total, fileName) => {
          setUploadProgress({ current, total, currentFileName: fileName });
        }
      );

      setLastUploadedFolder({
        id: result.rootFolderId,
        name: result.rootFolderName,
      });
      sounds.playVictory();
      onNotify(`All ${result.uploadedCount} code files uploaded to Google Drive!`, '🚀');
      await loadDriveData();
    } catch (err: any) {
      console.error('Code upload error:', err);
      setErrorMessage(err.message || 'Failed to upload code files to Google Drive.');
    } finally {
      setIsLoading(false);
      setUploadProgress(null);
    }
  };

  // Instant local ZIP file download containing ALL project files
  const handleDownloadZip = async () => {
    if (projectCodeFiles.length === 0) {
      setErrorMessage('No files available to package into ZIP.');
      return;
    }

    setIsZipping(true);
    setZipProgress(0);
    setErrorMessage(null);
    try {
      await downloadProjectAsZip((percent) => setZipProgress(percent));
      sounds.playVictory();
      onNotify(`Downloaded ZIP with all ${projectCodeFiles.length} files!`, '📦');
    } catch (err: any) {
      console.error('ZIP packaging error:', err);
      setErrorMessage(err.message || 'Failed to generate ZIP archive.');
    } finally {
      setIsZipping(false);
    }
  };

  // Delete confirmation executor
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await GoogleDriveService.deleteFile(deleteTarget.id);
      sounds.playBlockDelete();
      onNotify(`Deleted ${deleteTarget.name} from Google Drive`, '🗑️');
      setDeleteTarget(null);
      await loadDriveData();
    } catch (err: any) {
      console.error('Delete error:', err);
      setErrorMessage(err.message || 'Failed to delete file from Google Drive.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div id="google_drive_modal_overlay" className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
        <div
          id="google_drive_modal_container"
          className="w-full max-w-2xl bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border border-white/20 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-white relative"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-blue-600 via-amber-500 to-emerald-500 text-white shadow-lg">
                <HardDrive className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                  Google Drive Cloud
                  <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-black bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    Sync & Backup
                  </span>
                </h2>
                <p className="text-xs text-white/60">
                  Save, share, and backup your 3D custom Obby courses & game progress
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Auth Banner / GSI Button */}
          {!currentUser ? (
            <div className="p-8 flex flex-col items-center justify-center text-center space-y-5 bg-black/20 my-auto">
              <div className="w-16 h-16 rounded-3xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-xl">
                <Cloud className="w-8 h-8 animate-pulse" />
              </div>
              <div className="max-w-md space-y-1.5">
                <h3 className="text-lg font-black text-white">Connect Your Google Drive</h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  Sign in with Google to cloud-save your Studio builder courses, access them anywhere, and restore your game inventory & progress across devices.
                </p>
              </div>

              {/* Official GSI Material Button & Quick ZIP Export */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md">
                <button
                  onClick={handleSignIn}
                  disabled={isSigningIn}
                  className="gsi-material-button flex-1 w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white hover:bg-gray-100 text-gray-800 font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 active:scale-95 disabled:opacity-50"
                >
                  <div className="gsi-material-button-icon w-6 h-6">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-full h-full">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                      <path fill="none" d="M0 0h48v48H0z" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold tracking-wide">
                    {isSigningIn ? 'Connecting to Google...' : 'Sign in with Google'}
                  </span>
                </button>

                <button
                  onClick={handleDownloadZip}
                  disabled={isZipping || projectCodeFiles.length === 0}
                  className="flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-2xl shadow-xl transition-all active:scale-95 text-xs uppercase tracking-wider shrink-0 disabled:opacity-50"
                  title="Download all code files as a .ZIP archive directly to your computer"
                >
                  {isZipping ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Package className="w-4 h-4" />
                  )}
                  <span>{isZipping ? `${zipProgress}%` : 'Download ZIP'}</span>
                </button>
              </div>

              {errorMessage && (
                <div className="flex items-center gap-2 p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs max-w-md">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Connected User Bar */}
              <div className="flex items-center justify-between px-5 py-3 bg-white/5 border-b border-white/10 text-xs">
                <div className="flex items-center gap-2.5">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'User'}
                      className="w-7 h-7 rounded-full border border-emerald-400"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center font-bold">
                      {currentUser.displayName?.[0] || 'U'}
                    </div>
                  )}
                  <div>
                    <div className="font-bold flex items-center gap-1.5 text-white">
                      <span>{currentUser.displayName || 'Google User'}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="text-[10px] text-white/50">{currentUser.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={loadDriveData}
                    disabled={isLoading}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 transition-colors"
                    title="Refresh Drive Files"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 border border-rose-500/30 text-[11px] font-bold transition-colors"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>

              {/* Tabs Navigation */}
              <div className="flex border-b border-white/10 bg-black/20 px-4 pt-2 gap-2 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('code')}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-2xl text-xs font-black uppercase tracking-wider transition-all shrink-0 ${
                    activeTab === 'code'
                      ? 'bg-emerald-600/30 text-emerald-300 border-t-2 border-emerald-400 border-x border-white/10'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Code className="w-4 h-4" />
                  <span>Code Files ({projectCodeFiles.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab('courses')}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-2xl text-xs font-black uppercase tracking-wider transition-all shrink-0 ${
                    activeTab === 'courses'
                      ? 'bg-blue-600/30 text-blue-300 border-t-2 border-blue-400 border-x border-white/10'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Studio Courses ({courses.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab('saves')}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-2xl text-xs font-black uppercase tracking-wider transition-all shrink-0 ${
                    activeTab === 'saves'
                      ? 'bg-amber-600/30 text-amber-300 border-t-2 border-amber-400 border-x border-white/10'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <CloudDownload className="w-4 h-4" />
                  <span>Cloud Saves ({saves.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab('account')}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-2xl text-xs font-black uppercase tracking-wider transition-all shrink-0 ${
                    activeTab === 'account'
                      ? 'bg-purple-600/30 text-purple-300 border-t-2 border-purple-400 border-x border-white/10'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <HardDrive className="w-4 h-4" />
                  <span>Drive Info</span>
                </button>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="m-4 flex items-center justify-between p-3 bg-rose-500/20 border border-rose-500/40 rounded-2xl text-rose-300 text-xs">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                  <button onClick={() => setErrorMessage(null)} className="p-1 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Tab Content */}
              <div className="p-5 overflow-y-auto flex-1 space-y-5">
                {activeTab === 'code' && (
                  <div className="space-y-6">
                    {/* Top Upload Action Card */}
                    <div className="p-4.5 rounded-3xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 space-y-4 shadow-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                            <Code className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-black uppercase tracking-wider text-white">
                              Upload Project Source Code to Google Drive
                            </h4>
                            <p className="text-[11px] text-white/60">
                              Uploads all TypeScript, React, 3D engine, and configuration files into your Google Drive
                            </p>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                          {projectCodeFiles.length} Code Files
                        </span>
                      </div>

                      {/* Code Stats Grid */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2.5 rounded-2xl bg-black/40 border border-white/10">
                          <div className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Total Files</div>
                          <div className="text-base font-black text-emerald-400">{projectCodeFiles.length}</div>
                        </div>
                        <div className="p-2.5 rounded-2xl bg-black/40 border border-white/10">
                          <div className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Source Size</div>
                          <div className="text-base font-black text-cyan-400">
                            {(
                              projectCodeFiles.reduce((acc, f) => acc + f.size, 0) / 1024
                            ).toFixed(1)}{' '}
                            KB
                          </div>
                        </div>
                        <div className="p-2.5 rounded-2xl bg-black/40 border border-white/10">
                          <div className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Format</div>
                          <div className="text-base font-black text-amber-400">TS / TSX / JSON</div>
                        </div>
                      </div>

                      {/* Live Upload Progress */}
                      {uploadProgress && (
                        <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 space-y-2 animate-fadeIn">
                          <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
                            <span className="flex items-center gap-1.5">
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>
                                Uploading ({uploadProgress.current}/{uploadProgress.total})...
                              </span>
                            </span>
                            <span>{Math.round((uploadProgress.current / uploadProgress.total) * 100)}%</span>
                          </div>

                          <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden border border-emerald-500/30">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-200"
                              style={{
                                width: `${(uploadProgress.current / uploadProgress.total) * 100}%`,
                              }}
                            />
                          </div>

                          <div className="text-[10px] font-mono text-emerald-200/80 truncate">
                            {uploadProgress.currentFileName}
                          </div>
                        </div>
                      )}

                      {/* Success Alert */}
                      {lastUploadedFolder && !uploadProgress && (
                        <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                            <div className="min-w-0">
                              <span className="text-white/80">Uploaded to Google Drive: </span>
                              <strong className="font-mono text-white truncate block sm:inline">
                                {lastUploadedFolder.name}
                              </strong>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                            <button
                              onClick={() => setFolderViewerTarget(lastUploadedFolder)}
                              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/30 hover:bg-emerald-500/50 text-emerald-200 font-bold text-xs border border-emerald-400/30 transition-all"
                            >
                              <FolderOpen className="w-3.5 h-3.5" />
                              <span>Explore Files Inside</span>
                            </button>
                            <a
                              href={`https://drive.google.com/drive/folders/${lastUploadedFolder.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 transition-all"
                              title="Open in Google Drive Web"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons: Upload to Drive + Download ZIP */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <button
                          onClick={handleUploadAllCodeFiles}
                          disabled={isLoading || isZipping || projectCodeFiles.length === 0}
                          className="flex items-center justify-center gap-2.5 py-3 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-600/30 transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                          {isLoading ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <CloudUpload className="w-4 h-4" />
                          )}
                          <span>Upload All to Google Drive</span>
                        </button>

                        <button
                          onClick={handleDownloadZip}
                          disabled={isLoading || isZipping || projectCodeFiles.length === 0}
                          className="flex items-center justify-center gap-2.5 py-3 px-4 bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-orange-600/30 transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                          {isZipping ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Package className="w-4 h-4" />
                          )}
                          <span>{isZipping ? `Creating ZIP (${zipProgress}%)...` : `Download .ZIP (${projectCodeFiles.length} Files)`}</span>
                        </button>
                      </div>
                    </div>

                    {/* Code Files Included */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase tracking-wider text-white/70 flex items-center gap-1.5">
                          <FileCode className="w-4 h-4 text-emerald-400" />
                          <span>Included Code Files ({projectCodeFiles.length})</span>
                        </h4>
                        <span className="text-[10px] text-white/50">Structured directory hierarchy</span>
                      </div>

                      <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 border border-white/10 rounded-2xl p-2 bg-black/30">
                        {projectCodeFiles.map((file) => (
                          <div
                            key={file.path}
                            className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-xs"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <FileText className="w-3.5 h-3.5 text-white/50 shrink-0" />
                              <span className="font-mono text-white/90 text-[11px] truncate">{file.path}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] text-white/40 font-mono">
                                {(file.size / 1024).toFixed(1)} KB
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-white/10 text-white/70 uppercase">
                                {file.fileName.split('.').pop()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Previous Code Backups in Drive */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-white/70 flex items-center gap-1.5">
                        <FolderArchive className="w-4 h-4 text-cyan-400" />
                        <span>Code Folders in Google Drive ({codeBackups.length})</span>
                      </h4>

                      {codeBackups.length === 0 ? (
                        <div className="text-center py-6 text-white/40 text-xs border border-dashed border-white/10 rounded-2xl">
                          No previous code export folders found in Google Drive. Click Upload above to back up all project source code!
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-2">
                          {codeBackups.map((folder) => (
                            <div
                              key={folder.id}
                              className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
                            >
                              <div
                                onClick={() => setFolderViewerTarget({ id: folder.id, name: folder.name })}
                                className="space-y-0.5 cursor-pointer flex-1 min-w-0 pr-3"
                              >
                                <div className="flex items-center gap-2">
                                  <FolderOpen className="w-4 h-4 text-emerald-400 shrink-0" />
                                  <span className="font-bold text-xs text-white font-mono truncate group-hover:text-emerald-300 transition-colors">
                                    {folder.name}
                                  </span>
                                </div>
                                <div className="text-[10px] text-white/50">
                                  {new Date(folder.modifiedTime).toLocaleString()}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={() => setFolderViewerTarget({ id: folder.id, name: folder.name })}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all"
                                  title="Browse & open all files in this folder"
                                >
                                  <FolderOpen className="w-3.5 h-3.5" />
                                  <span>Open Folder</span>
                                </button>

                                <a
                                  href={`https://drive.google.com/drive/folders/${folder.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all"
                                  title="Open directly in Google Drive"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>

                                <button
                                  onClick={() =>
                                    setDeleteTarget({
                                      id: folder.id,
                                      name: folder.name,
                                      type: 'code',
                                    })
                                  }
                                  disabled={isLoading}
                                  className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 border border-rose-500/30 transition-all"
                                  title="Delete from Google Drive"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'courses' && (
                  <div className="space-y-6">
                    {/* Save Current Course Section */}
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CloudUpload className="w-4 h-4 text-blue-400" />
                          <h4 className="text-xs font-black uppercase tracking-wider text-white">
                            Save Current Studio Course ({currentBlocks.length} Blocks)
                          </h4>
                        </div>
                        <span className="text-[10px] text-white/50">Google Drive JSON format</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={courseTitle}
                          onChange={(e) => setCourseTitle(e.target.value)}
                          placeholder="Course Title"
                          className="px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                        />
                        <input
                          type="text"
                          value={courseDesc}
                          onChange={(e) => setCourseDesc(e.target.value)}
                          placeholder="Description (optional)"
                          className="px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <button
                        onClick={handleSaveCourse}
                        disabled={isLoading || currentBlocks.length === 0}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
                      >
                        {isLoading ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        <span>Upload Course to Google Drive</span>
                      </button>
                    </div>

                    {/* Saved Courses List */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-white/70">
                        Saved Courses in Google Drive
                      </h4>

                      {courses.length === 0 ? (
                        <div className="text-center py-8 text-white/40 text-xs border border-dashed border-white/10 rounded-2xl">
                          No saved courses found in Google Drive. Build a course in Studio and upload it!
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-2.5">
                          {courses.map((course) => (
                            <div
                              key={course.id}
                              className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-white">{course.name}</span>
                                  {course.blockCount !== undefined && (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                                      {course.blockCount} blocks
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-white/50 flex items-center gap-3">
                                  <span>{course.description}</span>
                                  <span>•</span>
                                  <span>{new Date(course.modifiedTime).toLocaleDateString()}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleLoadCourse(course.id, course.name)}
                                  disabled={isLoading}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md active:scale-95"
                                >
                                  <FolderOpen className="w-3.5 h-3.5" />
                                  <span>Load Course</span>
                                </button>
                                <button
                                  onClick={() =>
                                    setDeleteTarget({
                                      id: course.id,
                                      name: course.name,
                                      type: 'course',
                                    })
                                  }
                                  disabled={isLoading}
                                  className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 border border-rose-500/30 transition-all"
                                  title="Delete from Google Drive"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'saves' && (
                  <div className="space-y-6">
                    {/* Backup Section */}
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CloudUpload className="w-4 h-4 text-amber-400" />
                          <h4 className="text-xs font-black uppercase tracking-wider text-white">
                            Current Game Snapshot
                          </h4>
                        </div>
                        <span className="text-[10px] text-emerald-400 font-bold">Ready to Cloud Backup</span>
                      </div>

                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div className="p-2 rounded-xl bg-black/30 border border-white/10">
                          <div className="text-[10px] text-white/50">Stage</div>
                          <div className="text-sm font-black text-emerald-400">{obbyStage}</div>
                        </div>
                        <div className="p-2 rounded-xl bg-black/30 border border-white/10">
                          <div className="text-[10px] text-white/50">Coins</div>
                          <div className="text-sm font-black text-amber-400">{coins}</div>
                        </div>
                        <div className="p-2 rounded-xl bg-black/30 border border-white/10">
                          <div className="text-[10px] text-white/50">Gems</div>
                          <div className="text-sm font-black text-cyan-400">{gems}</div>
                        </div>
                        <div className="p-2 rounded-xl bg-black/30 border border-white/10">
                          <div className="text-[10px] text-white/50">Pets</div>
                          <div className="text-sm font-black text-purple-400">{pets.length}</div>
                        </div>
                      </div>

                      <button
                        onClick={handleSaveGameProgress}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
                      >
                        {isLoading ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <CloudUpload className="w-4 h-4" />
                        )}
                        <span>Backup Progress to Google Drive</span>
                      </button>
                    </div>

                    {/* Saves List */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-white/70">
                        Cloud Save Backups in Google Drive
                      </h4>

                      {saves.length === 0 ? (
                        <div className="text-center py-8 text-white/40 text-xs border border-dashed border-white/10 rounded-2xl">
                          No save backups found in Google Drive. Click Backup to create your first cloud restore point!
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-2.5">
                          {saves.map((save) => (
                            <div
                              key={save.id}
                              className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-white">
                                    Cloud Backup ({new Date(save.modifiedTime).toLocaleString()})
                                  </span>
                                </div>
                                <div className="text-[11px] text-white/60 flex items-center gap-2.5">
                                  {save.stage !== undefined && <span>Stage {save.stage}</span>}
                                  {save.coins !== undefined && <span>• 🪙 {save.coins} Coins</span>}
                                  {save.gems !== undefined && <span>• 💎 {save.gems} Gems</span>}
                                  {save.petsCount !== undefined && <span>• 🐾 {save.petsCount} Pets</span>}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleRestoreGameSave(save.id)}
                                  disabled={isLoading}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md active:scale-95"
                                >
                                  <CloudDownload className="w-3.5 h-3.5" />
                                  <span>Restore</span>
                                </button>
                                <button
                                  onClick={() =>
                                    setDeleteTarget({
                                      id: save.id,
                                      name: save.name,
                                      type: 'save',
                                    })
                                  }
                                  disabled={isLoading}
                                  className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 border border-rose-500/30 transition-all"
                                  title="Delete Backup from Google Drive"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'account' && (
                  <div className="space-y-4 text-xs">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                      <h4 className="font-black uppercase tracking-wider text-purple-300">Google Drive Account & Integration</h4>
                      <div className="space-y-2 text-white/80">
                        <div className="flex justify-between py-1 border-b border-white/5">
                          <span className="text-white/50">Google Account:</span>
                          <span className="font-mono">{currentUser.email}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-white/5">
                          <span className="text-white/50">Auth Provider:</span>
                          <span>Firebase Auth + Google Identity</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-white/5">
                          <span className="text-white/50">Drive Scopes:</span>
                          <span className="text-emerald-400 font-semibold">Active & Authorized</span>
                        </div>
                        {aboutInfo?.storageQuota && (
                          <div className="flex justify-between py-1 border-b border-white/5">
                            <span className="text-white/50">Drive Storage Usage:</span>
                            <span className="font-mono">
                              {(parseInt(aboutInfo.storageQuota.usage || '0', 10) / (1024 * 1024 * 1024)).toFixed(2)} GB /{' '}
                              {(parseInt(aboutInfo.storageQuota.limit || '0', 10) / (1024 * 1024 * 1024)).toFixed(2)} GB
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-200 space-y-1.5 leading-relaxed">
                      <div className="font-bold flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>Seamless 3D Cloud Sync</span>
                      </div>
                      <p className="text-[11px] text-blue-200/80">
                        All Blocky World 3D course blueprints and save states are formatted in clean JSON and saved directly into your Google Drive account. You have 100% control over your files.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Google Drive Folder & File Content Explorer Modal */}
      <DriveFolderViewerModal
        isOpen={!!folderViewerTarget}
        rootFolderId={folderViewerTarget?.id || null}
        rootFolderName={folderViewerTarget?.name || 'Google Drive Folder'}
        onClose={() => setFolderViewerTarget(null)}
        onNotify={onNotify}
      />

      {/* Confirmation Dialog for Destructive Operations */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title={`Delete ${
          deleteTarget?.type === 'course' ? 'Course' : deleteTarget?.type === 'code' ? 'Code Backup' : 'Save Backup'
        } from Google Drive?`}
        message={`Are you sure you want to permanently delete this ${
          deleteTarget?.type === 'course'
            ? 'course blueprint'
            : deleteTarget?.type === 'code'
            ? 'code backup folder'
            : 'save backup'
        } from your Google Drive? This action cannot be undone.`}
        itemName={deleteTarget?.name}
        confirmLabel="Delete from Drive"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
};
