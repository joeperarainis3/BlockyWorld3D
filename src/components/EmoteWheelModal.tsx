import React from 'react';
import { X, Sparkles } from 'lucide-react';

interface EmoteWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmote: (emote: string) => void;
}

const EMOTES = [
  { id: 'floss', name: 'The Floss', icon: '🕺', color: 'from-pink-500 to-rose-500' },
  { id: 'hype', name: 'Carlton Hype', icon: '💃', color: 'from-purple-500 to-indigo-500' },
  { id: 'backflip', name: 'Ninja Backflip', icon: '🤸', color: 'from-amber-500 to-orange-500' },
  { id: 'wave', name: 'Friendly Wave', icon: '👋', color: 'from-blue-500 to-cyan-500' },
  { id: 'cheer', name: 'Victory Cheer', icon: '🙌', color: 'from-emerald-500 to-teal-500' },
];

export const EmoteWheelModal: React.FC<EmoteWheelModalProps> = ({ isOpen, onClose, onSelectEmote }) => {
  if (!isOpen) return null;

  return (
    <div id="emote_wheel_modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-950/90 backdrop-blur-2xl border-2 border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.8)] p-6 text-white flex flex-col">
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">✨</span>
            <div>
              <h3 className="text-lg font-black text-white tracking-wide">Emote & Dance Wheel</h3>
              <p className="text-[11px] text-white/60 font-medium">Bust a move in the 3D Blox world!</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {EMOTES.map((e) => (
            <button
              key={e.id}
              id={`emote_btn_${e.id}`}
              onClick={() => {
                onSelectEmote(e.id);
                onClose();
              }}
              className="p-4 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/15 flex flex-col items-center gap-2 transition-all hover:scale-105 border-b-4 border-b-white/20 active:border-b-0 active:translate-y-1 shadow-lg"
            >
              <span className="text-4xl drop-shadow">{e.icon}</span>
              <span className="text-xs font-black text-white">{e.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
