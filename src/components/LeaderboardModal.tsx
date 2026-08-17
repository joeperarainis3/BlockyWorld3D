import React from 'react';
import { LeaderboardEntry } from '../types';
import { Trophy, X, Medal, Flame, Sparkles } from 'lucide-react';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: LeaderboardEntry[];
  currentMode: string;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  entries,
  currentMode,
}) => {
  if (!isOpen) return null;

  return (
    <div id="leaderboard_modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-950/90 backdrop-blur-2xl border-2 border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.8)] p-6 text-white flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 flex items-center justify-center shadow-inner">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg text-white tracking-wide">Global Blox Rankings</h3>
              <p className="text-[11px] text-white/60 font-medium">Live leaderboards across all worlds</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto space-y-2 py-2">
          {entries.map((entry, index) => {
            const isTop3 = index < 3;
            const rankBadge =
              index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;

            return (
              <div
                key={entry.id}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                  entry.isPlayer
                    ? 'border-yellow-400/80 bg-yellow-500/20 shadow-lg shadow-yellow-500/10'
                    : isTop3
                    ? 'border-white/20 bg-white/10'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-black text-sm w-7 text-center font-mono text-white/80">
                    {rankBadge}
                  </span>
                  <div className="text-2xl p-1.5 rounded-xl bg-black/40 border border-white/15">
                    {entry.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-sm text-white">{entry.name}</span>
                      {entry.isPlayer && (
                        <span className="px-1.5 py-0.2 rounded-md text-[9px] font-black uppercase bg-yellow-400 text-slate-950">
                          YOU
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-white/60">
                      Obby Stage: <b className="text-emerald-400 font-black">{entry.stage}</b>
                    </span>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="text-sm font-black text-amber-300">🪙 {entry.coins}</div>
                  <span className="text-[10px] text-white/40">{entry.score} pts</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-white/10 pt-3 mt-2 text-center">
          <p className="text-xs text-white/60 font-medium">Complete more Obby stages & Tycoons to climb rank #1!</p>
        </div>
      </div>
    </div>
  );
};
