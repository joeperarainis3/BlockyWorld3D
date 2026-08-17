import React from 'react';
import { Play, Pause, Trash2, Box, Sparkles, Plus, RotateCw, Eraser, Layers } from 'lucide-react';
import { sounds } from '../audio/soundManager';

interface BuilderToolbarProps {
  selectedBlockType: string;
  onSelectBlockType: (type: any) => void;
  selectedColor: string;
  onSelectColor: (color: string) => void;
  isTestPlaying: boolean;
  onToggleTestPlay: () => void;
  onClearBlocks: () => void;
  onLoadPreset: (preset: string) => void;
  onQuickPlace?: () => void;
  onRotateBlock?: () => void;
  isDeleteMode?: boolean;
  onToggleDeleteMode?: () => void;
  onOpenGoogleDrive?: () => void;
}

const BLOCK_TYPES = [
  { id: 'cube', name: 'Solid Block', icon: '🧱' },
  { id: 'ramp', name: 'Ramp Wedge', icon: '📐' },
  { id: 'trampoline', name: 'Super Trampoline', icon: '🟡' },
  { id: 'speed', name: 'Speed Boost Strip', icon: '⚡' },
  { id: 'lava', name: 'Lava Hazard', icon: '🔥' },
  { id: 'spinner', name: 'Laser Spinner', icon: '🌀' },
  { id: 'coin', name: 'Coin Spawner', icon: '🪙' },
  { id: 'checkpoint', name: 'Checkpoint Pad', icon: '🏁' },
];

const COLORS = [
  '#ef4444', '#f97316', '#facc15', '#22c55e', '#06b6d4', '#3b82f6', '#a855f7', '#ec4899', '#f8fafc', '#1e293b'
];

export const BuilderToolbar: React.FC<BuilderToolbarProps> = ({
  selectedBlockType,
  onSelectBlockType,
  selectedColor,
  onSelectColor,
  isTestPlaying,
  onToggleTestPlay,
  onClearBlocks,
  onLoadPreset,
  onQuickPlace,
  onRotateBlock,
  isDeleteMode = false,
  onToggleDeleteMode,
  onOpenGoogleDrive,
}) => {
  return (
    <div id="builder_toolbar" className="fixed top-20 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 max-w-[95vw]">
      {/* Top action bar */}
      <div className="flex items-center gap-2 bg-black/60 backdrop-blur-xl border border-white/20 p-2.5 rounded-3xl shadow-2xl">
        <button
          id="toggle_test_play_btn"
          onClick={() => {
            sounds.playCheckpoint();
            onToggleTestPlay();
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border-b-4 active:border-b-0 active:translate-y-1 shadow-lg ${
            isTestPlaying
              ? 'bg-amber-400 hover:bg-amber-300 border-amber-700 text-slate-950 shadow-amber-500/30'
              : 'bg-emerald-500 hover:bg-emerald-400 border-emerald-800 text-slate-950 shadow-emerald-500/30'
          }`}
        >
          {isTestPlaying ? (
            <>
              <Pause className="w-4 h-4" /> Edit Mode
            </>
          ) : (
            <>
              <Play className="w-4 h-4" /> Test Play Course!
            </>
          )}
        </button>

        {onOpenGoogleDrive && (
          <button
            onClick={() => {
              sounds.playCheckpoint();
              onOpenGoogleDrive();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-b-4 border-indigo-900 text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-500/30 transition-all active:border-b-0 active:translate-y-1 whitespace-nowrap"
            title="Google Drive Cloud Save & Load Courses"
          >
            <span>☁️</span>
            <span>Drive Courses</span>
          </button>
        )}

        {!isTestPlaying && (
          <>
            <div className="h-6 w-px bg-white/15" />

            {/* Quick Place button */}
            <button
              onClick={() => {
                if (onQuickPlace) onQuickPlace();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/30 hover:bg-blue-500/50 text-blue-200 border border-blue-400/40 text-xs font-black uppercase tracking-wider transition-all active:scale-95"
              title="Place block in front of character [F]"
            >
              <Plus className="w-4 h-4" />
              <span>Place [F]</span>
            </button>

            {/* Rotate block button */}
            <button
              onClick={() => {
                if (onRotateBlock) onRotateBlock();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-500/30 hover:bg-purple-500/50 text-purple-200 border border-purple-400/40 text-xs font-black uppercase tracking-wider transition-all active:scale-95"
              title="Rotate Block 90° [R]"
            >
              <RotateCw className="w-4 h-4" />
              <span>Rotate [R]</span>
            </button>

            {/* Eraser / Delete toggle */}
            <button
              onClick={() => {
                if (onToggleDeleteMode) onToggleDeleteMode();
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 ${
                isDeleteMode
                  ? 'bg-rose-500 text-white border border-rose-300 shadow-lg shadow-rose-500/30'
                  : 'bg-white/10 hover:bg-white/20 text-white/80 border border-white/15'
              }`}
              title="Toggle Delete Mode [X]"
            >
              <Eraser className="w-4 h-4" />
              <span>{isDeleteMode ? 'Deleting' : 'Erase [X]'}</span>
            </button>
          </>
        )}

        <div className="h-6 w-px bg-white/15" />

        {/* Course Presets */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => onLoadPreset('spiral')}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-[11px] font-black uppercase tracking-wider text-white border border-white/15 transition-all whitespace-nowrap"
          >
            Rainbow Spiral
          </button>
          <button
            onClick={() => onLoadPreset('trampoline')}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-[11px] font-black uppercase tracking-wider text-white border border-white/15 transition-all whitespace-nowrap"
          >
            Trampoline Sky
          </button>
          <button
            onClick={() => onLoadPreset('obby')}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-[11px] font-black uppercase tracking-wider text-white border border-white/15 transition-all whitespace-nowrap"
          >
            Obby Challenge
          </button>
          <button
            onClick={() => onLoadPreset('castle')}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-[11px] font-black uppercase tracking-wider text-white border border-white/15 transition-all whitespace-nowrap"
          >
            Castle
          </button>
        </div>

        <div className="h-6 w-px bg-white/15" />

        <button
          onClick={onClearBlocks}
          className="p-2.5 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all hover:scale-105"
          title="Clear All Blocks"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Blocks Palette */}
      {!isTestPlaying && (
        <div className="flex flex-col gap-2 bg-black/60 backdrop-blur-xl border border-white/20 p-3 rounded-3xl shadow-2xl">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-[85vw]">
            {BLOCK_TYPES.map((bt) => (
              <button
                key={bt.id}
                onClick={() => {
                  sounds.playJump();
                  onSelectBlockType(bt.id);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all border-b-4 active:border-b-0 active:translate-y-1 ${
                  selectedBlockType === bt.id
                    ? 'bg-blue-600 border-blue-900 text-white shadow-lg shadow-blue-500/30 scale-105'
                    : 'bg-white/10 text-white/70 hover:bg-white/20 border-white/15'
                }`}
              >
                <span>{bt.icon}</span>
                <span>{bt.name}</span>
              </button>
            ))}
          </div>

          {/* Colors palette */}
          <div className="flex items-center justify-between border-t border-white/10 pt-2 px-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-white/60">Block Color:</span>
            <div className="flex gap-1.5">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    sounds.playJump();
                    onSelectColor(c);
                  }}
                  style={{ backgroundColor: c }}
                  className={`w-7 h-7 rounded-xl border-2 transition-transform hover:scale-110 shadow-lg ${
                    selectedColor === c ? 'border-white scale-110 shadow-white/30' : 'border-white/20'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Key shortcut helper */}
          <div className="text-[10px] text-white/50 text-center font-bold tracking-wide border-t border-white/10 pt-1.5">
            🖱️ Click: Place • Right-Click: Delete • [F] Quick Place • [R] Rotate • [WASD/Space] Walk & Jump
          </div>
        </div>
      )}
    </div>
  );
};
