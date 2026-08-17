import React, { useState } from 'react';
import { AvatarCustomization } from '../types';
import { sounds } from '../audio/soundManager';
import { X, Sparkles, Shirt, Smile, Crown, Feather, Wand2 } from 'lucide-react';

interface AvatarShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  customization: AvatarCustomization;
  onSave: (customization: AvatarCustomization) => void;
  coins: number;
  gems: number;
}

const SKIN_COLORS = ['#fde047', '#fed7aa', '#fbcfe8', '#cbd5e1', '#86efac', '#93c5fd', '#c4b5fd', '#fdba74'];
const OUTFIT_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#0f172a', '#f8fafc'];

const HATS = [
  { id: 'none', name: 'No Hat', icon: '❌', cost: 0 },
  { id: 'party', name: 'Party Cone', icon: '🎉', cost: 30 },
  { id: 'tophat', name: 'Fancy Top Hat', icon: '🎩', cost: 75 },
  { id: 'catears', name: 'Cat Ears', icon: '🐱', cost: 100 },
  { id: 'crown', name: 'Golden Crown', icon: '👑', cost: 250 },
  { id: 'propeller', name: 'Spin Propeller', icon: '🚁', cost: 350 },
  { id: 'halo', name: 'Angel Halo', icon: '😇', cost: 500 },
];

const BACK_ITEMS = [
  { id: 'none', name: 'None', icon: '❌', cost: 0 },
  { id: 'cape', name: 'Hero Cape', icon: '🦸', cost: 50 },
  { id: 'sword', name: 'Dual Katanas', icon: '⚔️', cost: 120 },
  { id: 'angelWings', name: 'Angel Wings', icon: '🪽', cost: 300 },
  { id: 'demonWings', name: 'Dragon Wings', icon: '🦇', cost: 350 },
  { id: 'jetpack', name: 'Rocket Jetpack', icon: '🚀', cost: 600 },
];

const HELD_ITEMS = [
  { id: 'none', name: 'None', icon: '❌', boost: 'None', cost: 0 },
  { id: 'balloon', name: 'Helium Balloon', boost: 'Floaty Jump', cost: 50 },
  { id: 'popsicle', name: 'Rainbow Popsicle', boost: 'Sweet Style', cost: 80 },
  { id: 'speedCoil', name: 'Speed Coil', boost: '+60% Speed', cost: 250 },
  { id: 'gravityCoil', name: 'Gravity Coil', boost: '+50% Jump Height', cost: 300 },
  { id: 'magicWand', name: 'Star Wand', boost: 'Sparkle Power', cost: 450 },
];

const FACES: { id: AvatarCustomization['faceExpression']; name: string; icon: string }[] = [
  { id: 'smile', name: 'Happy Smile', icon: '😊' },
  { id: 'cool', name: 'Cool Shades', icon: '😎' },
  { id: 'wink', name: 'Playful Wink', icon: '😉' },
  { id: 'cat', name: 'Cute Kitty :3', icon: '😺' },
  { id: 'excited', name: 'Star Eyed', icon: '🤩' },
  { id: 'ninja', name: 'Ninja Mask', icon: '🥷' },
];

export const AvatarShopModal: React.FC<AvatarShopModalProps> = ({
  isOpen,
  onClose,
  customization,
  onSave,
  coins,
  gems,
}) => {
  const [current, setCurrent] = useState<AvatarCustomization>({ ...customization });
  const [activeTab, setActiveTab] = useState<'colors' | 'faces' | 'hats' | 'back' | 'held'>('colors');

  if (!isOpen) return null;

  const handleSave = () => {
    sounds.playCheckpoint();
    onSave(current);
    onClose();
  };

  return (
    <div id="avatar_shop_modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl bg-slate-950/90 backdrop-blur-2xl border-2 border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.8)] p-6 text-white flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center shadow-inner">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-wide">Avatar Dressing Room & Shop</h2>
              <p className="text-xs text-white/60 font-medium">Customize your 3D Roblox character style & power items</p>
            </div>
          </div>
          <button
            id="close_avatar_shop_btn"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs with 3D tactile buttons */}
        <div className="flex gap-2 border-b border-white/10 py-3 overflow-x-auto no-scrollbar">
          <button
            id="tab_colors"
            onClick={() => setActiveTab('colors')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap border-b-4 active:border-b-0 active:translate-y-1 ${
              activeTab === 'colors'
                ? 'bg-amber-500 text-slate-950 border-amber-800 shadow-lg'
                : 'bg-white/10 text-white/70 hover:bg-white/20 border-white/15'
            }`}
          >
            <Shirt className="w-4 h-4" /> Colors
          </button>
          <button
            id="tab_faces"
            onClick={() => setActiveTab('faces')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap border-b-4 active:border-b-0 active:translate-y-1 ${
              activeTab === 'faces'
                ? 'bg-amber-500 text-slate-950 border-amber-800 shadow-lg'
                : 'bg-white/10 text-white/70 hover:bg-white/20 border-white/15'
            }`}
          >
            <Smile className="w-4 h-4" /> Faces
          </button>
          <button
            id="tab_hats"
            onClick={() => setActiveTab('hats')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap border-b-4 active:border-b-0 active:translate-y-1 ${
              activeTab === 'hats'
                ? 'bg-amber-500 text-slate-950 border-amber-800 shadow-lg'
                : 'bg-white/10 text-white/70 hover:bg-white/20 border-white/15'
            }`}
          >
            <Crown className="w-4 h-4" /> Hats
          </button>
          <button
            id="tab_back"
            onClick={() => setActiveTab('back')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap border-b-4 active:border-b-0 active:translate-y-1 ${
              activeTab === 'back'
                ? 'bg-amber-500 text-slate-950 border-amber-800 shadow-lg'
                : 'bg-white/10 text-white/70 hover:bg-white/20 border-white/15'
            }`}
          >
            <Feather className="w-4 h-4" /> Wings & Back
          </button>
          <button
            id="tab_held"
            onClick={() => setActiveTab('held')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap border-b-4 active:border-b-0 active:translate-y-1 ${
              activeTab === 'held'
                ? 'bg-amber-500 text-slate-950 border-amber-800 shadow-lg'
                : 'bg-white/10 text-white/70 hover:bg-white/20 border-white/15'
            }`}
          >
            <Wand2 className="w-4 h-4" /> Coils & Items
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {activeTab === 'colors' && (
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-white/60 block mb-2">
                  Skin Tone
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {SKIN_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        sounds.playJump();
                        setCurrent({ ...current, skinColor: c });
                      }}
                      style={{ backgroundColor: c }}
                      className={`w-10 h-10 rounded-2xl border-2 transition-transform hover:scale-110 shadow-lg ${
                        current.skinColor === c ? 'border-white scale-110 shadow-white/30' : 'border-white/20'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-white/60 block mb-2">
                  Shirt / Torso Color
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {OUTFIT_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        sounds.playJump();
                        setCurrent({ ...current, torsoColor: c });
                      }}
                      style={{ backgroundColor: c }}
                      className={`w-10 h-10 rounded-2xl border-2 transition-transform hover:scale-110 shadow-lg ${
                        current.torsoColor === c ? 'border-white scale-110 shadow-white/30' : 'border-white/20'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-black uppercase tracking-wider text-white/60 block mb-2">
                    Left Arm & Right Arm
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {OUTFIT_COLORS.slice(0, 6).map((c) => (
                      <button
                        key={c}
                        onClick={() => {
                          sounds.playJump();
                          setCurrent({ ...current, leftArmColor: c, rightArmColor: c });
                        }}
                        style={{ backgroundColor: c }}
                        className={`w-8 h-8 rounded-xl border-2 ${
                          current.leftArmColor === c ? 'border-white scale-105' : 'border-white/20'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase tracking-wider text-white/60 block mb-2">
                    Pants / Legs
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {OUTFIT_COLORS.slice(0, 6).map((c) => (
                      <button
                        key={c}
                        onClick={() => {
                          sounds.playJump();
                          setCurrent({ ...current, leftLegColor: c, rightLegColor: c });
                        }}
                        style={{ backgroundColor: c }}
                        className={`w-8 h-8 rounded-xl border-2 ${
                          current.leftLegColor === c ? 'border-white scale-105' : 'border-white/20'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'faces' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {FACES.map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    sounds.playJump();
                    setCurrent({ ...current, faceExpression: f.id });
                  }}
                  className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                    current.faceExpression === f.id
                      ? 'border-amber-400 bg-amber-500/20 shadow-lg'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <span className="text-4xl">{f.icon}</span>
                  <span className="text-sm font-bold text-white">{f.name}</span>
                </button>
              ))}
            </div>
          )}

          {activeTab === 'hats' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {HATS.map((h) => (
                <button
                  key={h.id}
                  onClick={() => {
                    sounds.playJump();
                    setCurrent({ ...current, hat: h.id });
                  }}
                  className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                    current.hat === h.id
                      ? 'border-amber-400 bg-amber-500/20 shadow-lg'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <span className="text-4xl">{h.icon}</span>
                  <span className="text-sm font-bold text-white">{h.name}</span>
                  <span className="text-xs text-amber-300 font-mono font-black">
                    {h.cost === 0 ? 'FREE' : `🪙 ${h.cost}`}
                  </span>
                </button>
              ))}
            </div>
          )}

          {activeTab === 'back' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {BACK_ITEMS.map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    sounds.playJump();
                    setCurrent({ ...current, backAccessory: b.id });
                  }}
                  className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                    current.backAccessory === b.id
                      ? 'border-amber-400 bg-amber-500/20 shadow-lg'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <span className="text-4xl">{b.icon}</span>
                  <span className="text-sm font-bold text-white">{b.name}</span>
                  <span className="text-xs text-amber-300 font-mono font-black">
                    {b.cost === 0 ? 'FREE' : `🪙 ${b.cost}`}
                  </span>
                </button>
              ))}
            </div>
          )}

          {activeTab === 'held' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {HELD_ITEMS.map((i) => (
                <button
                  key={i.id}
                  onClick={() => {
                    sounds.playJump();
                    setCurrent({ ...current, heldItem: i.id });
                  }}
                  className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition-all text-center ${
                    current.heldItem === i.id
                      ? 'border-amber-400 bg-amber-500/20 shadow-lg'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <span className="text-3xl">{i.id === 'speedCoil' ? '🌀' : i.id === 'gravityCoil' ? '🔵' : i.id === 'magicWand' ? '🪄' : i.id === 'balloon' ? '🎈' : i.id === 'popsicle' ? '🍧' : '❌'}</span>
                  <span className="text-sm font-bold text-white">{i.name}</span>
                  <span className="text-xs text-emerald-400 font-semibold">{i.boost}</span>
                  <span className="text-xs text-amber-300 font-mono font-black">
                    {i.cost === 0 ? 'FREE' : `🪙 ${i.cost}`}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-2">
          <div className="flex items-center gap-3 text-sm font-mono">
            <span className="flex items-center gap-1.5 text-amber-300 bg-black/40 px-3.5 py-1.5 rounded-xl border border-white/15 font-black">
              🪙 <b>{coins}</b> Coins
            </span>
            <span className="flex items-center gap-1.5 text-cyan-300 bg-black/40 px-3.5 py-1.5 rounded-xl border border-white/15 font-black">
              💎 <b>{gems}</b> Gems
            </span>
          </div>

          <div className="flex gap-3">
            <button
              id="cancel_avatar_btn"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-colors"
            >
              Cancel
            </button>
            <button
              id="equip_avatar_btn"
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 border-b-4 border-amber-800 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg active:border-b-0 active:translate-y-1 transition-all"
            >
              <Sparkles className="w-4 h-4" /> Equip Style
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
