import React from 'react';
import { Trophy, Sparkles, ArrowRight, RotateCcw } from 'lucide-react';
import { sounds } from '../audio/soundManager';

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  coinsEarned: number;
  gemsEarned: number;
  onPlayAgain: () => void;
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  coinsEarned,
  gemsEarned,
  onPlayAgain,
}) => {
  if (!isOpen) return null;

  return (
    <div id="celebration_modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in zoom-in-95 duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-950/90 backdrop-blur-2xl border-2 border-yellow-400/80 p-8 text-center text-white shadow-[0_20px_70px_rgba(234,179,8,0.3)] flex flex-col items-center">
        {/* Animated Trophy */}
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-yellow-400 to-amber-300 flex items-center justify-center text-5xl text-slate-950 shadow-2xl mb-4 animate-bounce border-b-4 border-yellow-700">
          🏆
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-400 uppercase tracking-wide">
          {title}
        </h2>
        <p className="text-sm text-white/70 mt-1 max-w-xs font-medium">{subtitle}</p>

        {/* Rewards */}
        <div className="flex gap-4 my-6 font-mono">
          <div className="px-5 py-3 rounded-2xl bg-black/40 border border-amber-400/50 text-amber-300 flex items-center gap-2 shadow-inner">
            <span className="text-2xl">🪙</span>
            <span className="text-xl font-black">+{coinsEarned}</span>
          </div>

          <div className="px-5 py-3 rounded-2xl bg-black/40 border border-cyan-400/50 text-cyan-300 flex items-center gap-2 shadow-inner">
            <span className="text-2xl">💎</span>
            <span className="text-xl font-black">+{gemsEarned}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={() => {
              sounds.playCheckpoint();
              onPlayAgain();
              onClose();
            }}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border-b-4 border-white/20 text-white font-black text-xs uppercase tracking-wider transition-all active:border-b-0 active:translate-y-1"
          >
            <RotateCcw className="w-4 h-4" /> Play Again
          </button>
          <button
            onClick={() => {
              sounds.playCheckpoint();
              onClose();
            }}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 border-b-4 border-amber-700 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg active:border-b-0 active:translate-y-1 transition-all"
          >
            <Sparkles className="w-4 h-4" /> Continue
          </button>
        </div>
      </div>
    </div>
  );
};
