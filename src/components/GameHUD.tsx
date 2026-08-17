import React, { useState, useEffect, useRef } from 'react';
import { GameMode } from '../types';
import { sounds } from '../audio/soundManager';
import {
  Sparkles,
  Trophy,
  RotateCcw,
  Volume2,
  VolumeX,
  Music,
  ShoppingBag,
  Egg,
  Compass,
  Zap,
  ArrowUp,
  Smile,
  Globe,
  Layers,
  ChevronDown,
  X,
  Flame,
  ShieldAlert,
  HardDrive,
  Cloud,
} from 'lucide-react';

interface GameHUDProps {
  currentMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  coins: number;
  gems: number;
  stage: number;
  stageName: string;
  tycoonCash: { uncollected: number; total: number };
  lavaInfo: { timeLeft: number; lavaHeight: number; active: boolean };
  onRespawn: () => void;
  onOpenAvatarShop: () => void;
  onOpenPetEggModal: () => void;
  onOpenEmotes: () => void;
  onOpenLeaderboard: () => void;
  onOpenGoogleDrive?: () => void;
  interactivePrompt: string | null;
  onJoystickMove: (x: number, y: number) => void;
  onRequestJump: () => void;
  onToggleSprint: (sprint: boolean) => void;
  notifications: { id: string; text: string; icon: string }[];
}

export const GameHUD: React.FC<GameHUDProps> = ({
  currentMode,
  onSelectMode,
  coins,
  gems,
  stage,
  stageName,
  tycoonCash,
  lavaInfo,
  onRespawn,
  onOpenAvatarShop,
  onOpenPetEggModal,
  onOpenEmotes,
  onOpenLeaderboard,
  onOpenGoogleDrive,
  interactivePrompt,
  onJoystickMove,
  onRequestJump,
  onToggleSprint,
  notifications,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);
  const [isSprintActive, setIsSprintActive] = useState(false);

  // Virtual Joystick State
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const [joystickActive, setJoystickActive] = useState(false);
  const [stickPos, setStickPos] = useState({ x: 0, y: 0 });

  const handleMuteToggle = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  const handleMusicToggle = () => {
    const playing = sounds.toggleMusic();
    setIsMusicPlaying(playing);
  };

  const handleSprintToggle = () => {
    const next = !isSprintActive;
    setIsSprintActive(next);
    onToggleSprint(next);
  };

  // Joystick touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setJoystickActive(true);
    updateJoystick(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!joystickActive) return;
    updateJoystick(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    setJoystickActive(false);
    setStickPos({ x: 0, y: 0 });
    onJoystickMove(0, 0);
  };

  const updateJoystick = (clientX: number, clientY: number) => {
    if (!joystickBaseRef.current) return;
    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const maxRadius = rect.width / 2;
    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);

    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }

    setStickPos({ x: dx, y: dy });
    onJoystickMove(dx / maxRadius, dy / maxRadius);
  };

  // Obby progress percentage
  const obbyProgress = Math.min(100, Math.round((stage / 10) * 100));

  return (
    <div id="game_hud_root" className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-4 sm:p-6 select-none">
      {/* Top Header Bar: Player Badge (Left) + World Switcher / Objective (Center) + Currency & Quick Controls (Right) */}
      <div className="flex items-start justify-between w-full gap-3">
        {/* Left: Player Profile & World Teleport */}
        <div className="relative pointer-events-auto flex items-center gap-3">
          {/* Avatar Circle & Player Pill */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-black/40 backdrop-blur-md rounded-full border-2 border-white/20 flex items-center justify-center overflow-hidden shadow-lg hover:border-amber-400/80 transition-all cursor-pointer"
                 onClick={() => { sounds.playCheckpoint(); onOpenAvatarShop(); }}
                 title="Open Avatar Dressing Room">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-yellow-400 rounded-full flex items-center justify-center text-xl shadow-inner border-2 border-amber-300/40">
                😎
              </div>
            </div>

            <div
              onClick={() => setIsModeDropdownOpen(!isModeDropdownOpen)}
              className="bg-black/40 backdrop-blur-md rounded-2xl px-4 py-2 border border-white/20 shadow-lg cursor-pointer hover:bg-white/10 hover:border-white/40 transition-all flex items-center gap-3"
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-white/60 font-black">
                    {currentMode === 'lobby' ? 'HUB WORLD' : currentMode === 'obby' ? `STAGE ${stage}` : currentMode === 'tycoon' ? 'TYCOON' : currentMode === 'lava' ? 'SURVIVAL' : 'STUDIO'}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="text-white font-black text-sm sm:text-base flex items-center gap-1.5">
                  <span>
                    {currentMode === 'lobby' ? 'Blox Plaza' : currentMode === 'obby' ? 'Mega Obby' : currentMode === 'tycoon' ? 'Candy Land' : currentMode === 'lava' ? 'Floor is Lava' : 'Course Studio'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-white/60" />
                </div>
              </div>
            </div>
          </div>

          {/* World Selector Dropdown Menu */}
          {isModeDropdownOpen && (
            <div className="absolute top-16 left-0 w-72 rounded-3xl bg-slate-950/90 backdrop-blur-xl border-2 border-white/20 shadow-2xl p-3 space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-150 z-50">
              <div className="flex items-center justify-between px-3 py-1 border-b border-white/10 pb-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-white/70">
                  Select Dimension
                </span>
                <span className="text-[10px] text-amber-300 font-bold">5 WORLDS</span>
              </div>
              {[
                { id: 'lobby', name: 'Blox Plaza (Hub)', icon: '🏠', color: 'from-sky-500 to-blue-600', border: 'border-blue-800' },
                { id: 'obby', name: 'Rainbow Mega Obby', icon: '🌈', color: 'from-pink-500 to-rose-600', border: 'border-rose-800' },
                { id: 'tycoon', name: 'Candy Land Tycoon', icon: '🍭', color: 'from-amber-500 to-yellow-600', border: 'border-yellow-800' },
                { id: 'lava', name: 'Floor is Lava Survival', icon: '🌋', color: 'from-red-500 to-orange-600', border: 'border-red-800' },
                { id: 'sandbox', name: 'Studio Course Builder', icon: '🛠️', color: 'from-emerald-500 to-teal-600', border: 'border-emerald-800' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    sounds.playCheckpoint();
                    onSelectMode(m.id as GameMode);
                    setIsModeDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-left transition-all border-b-4 ${m.border} active:border-b-0 active:translate-y-0.5 ${
                    currentMode === m.id
                      ? `bg-gradient-to-r ${m.color} text-white shadow-lg`
                      : 'bg-white/5 hover:bg-white/15 text-slate-200 border-white/10'
                  }`}
                >
                  <span className="text-xl">{m.icon}</span>
                  <div className="flex-1">
                    <div className="text-white font-black">{m.name}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Center: Live World Objectives Banner */}
        <div className="pointer-events-auto flex flex-col items-center">
          {currentMode === 'obby' && (
            <div className="flex items-center gap-3 px-5 py-2 rounded-2xl bg-black/40 backdrop-blur-md border border-white/20 shadow-lg text-center">
              <span className="text-sm font-black text-pink-400 uppercase tracking-wide">Stage {stage}/10</span>
              <div className="h-4 w-px bg-white/20" />
              <span className="text-xs sm:text-sm font-bold text-white">{stageName}</span>
            </div>
          )}

          {currentMode === 'tycoon' && (
            <div className="flex items-center gap-4 px-5 py-2 rounded-2xl bg-black/40 backdrop-blur-md border border-white/20 shadow-lg font-mono">
              <div className="text-center">
                <span className="text-[10px] text-white/60 uppercase font-sans font-black block">Ready Cash</span>
                <span className="text-sm font-black text-emerald-400">${tycoonCash.uncollected}</span>
              </div>
              <div className="h-5 w-px bg-white/20" />
              <div className="text-center">
                <span className="text-[10px] text-white/60 uppercase font-sans font-black block">Vault Bank</span>
                <span className="text-sm font-black text-amber-300">${tycoonCash.total}</span>
              </div>
            </div>
          )}

          {currentMode === 'lava' && (
            <div className="flex items-center gap-3 px-5 py-2 rounded-2xl bg-black/40 backdrop-blur-md border border-rose-500/50 shadow-lg">
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-rose-400 animate-bounce" />
                <span className="text-base font-black text-rose-400 font-mono">
                  {lavaInfo.timeLeft}s
                </span>
              </div>
              <div className="h-4 w-px bg-white/20" />
              <div className="text-xs font-bold text-slate-200">
                Magma: <b className="text-amber-300 font-mono">{Math.max(0, Math.round(lavaInfo.lavaHeight + 5))}m</b>
              </div>
            </div>
          )}
        </div>

        {/* Right: Currency Capsule & Reset Action */}
        <div className="pointer-events-auto flex items-center gap-3">
          {/* Currency Pill matching Immersive UI */}
          <div className="bg-black/40 backdrop-blur-md rounded-full px-4 sm:px-5 py-2 flex items-center gap-4 border border-white/20 shadow-lg font-mono">
            {/* Coins */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-black text-yellow-950 shadow-inner">
                $
              </div>
              <span className="font-black text-white text-base sm:text-lg">
                {coins.toLocaleString()}
              </span>
            </div>

            <div className="h-4 w-px bg-white/20" />

            {/* Gems */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-cyan-400 rounded-full flex items-center justify-center text-xs font-black text-cyan-950 shadow-inner">
                💎
              </div>
              <span className="font-black text-cyan-300 text-sm sm:text-base">
                {gems}
              </span>
            </div>
          </div>

          {/* Reset / Respawn Character Pill with 3D Red Bevel */}
          <button
            id="respawn_char_btn"
            onClick={onRespawn}
            className="w-11 h-11 sm:w-12 sm:h-12 bg-red-500 hover:bg-red-400 rounded-2xl flex items-center justify-center border-b-4 border-red-800 shadow-lg text-white font-black transition-all hover:scale-105 active:scale-95 active:border-b-0 active:translate-y-1"
            title="Reset Character [R]"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Right-Side Vertical Action Dock matching Immersive UI Glass Slots */}
      <div className="fixed right-4 sm:right-6 top-[110px] z-30 flex flex-col gap-3 pointer-events-auto">
        {/* Avatar Dressing Room */}
        <button
          id="open_avatar_shop_btn"
          onClick={() => { sounds.playCheckpoint(); onOpenAvatarShop(); }}
          className="w-12 h-12 sm:w-14 sm:h-14 bg-white/10 backdrop-blur-md rounded-2xl border-2 border-white/20 flex flex-col items-center justify-center shadow-lg hover:bg-white/20 transition-all hover:scale-105 active:scale-95 group"
          title="Avatar Dressing Room & Outfits"
        >
          <ShoppingBag className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
          <span className="text-[9px] font-black uppercase text-white/70 tracking-tighter">Shop</span>
        </button>

        {/* Pets Hatchery */}
        <button
          id="open_pets_btn"
          onClick={() => { sounds.playCheckpoint(); onOpenPetEggModal(); }}
          className="w-12 h-12 sm:w-14 sm:h-14 bg-white/10 backdrop-blur-md rounded-2xl border-2 border-white/20 flex flex-col items-center justify-center shadow-lg hover:bg-white/20 transition-all hover:scale-105 active:scale-95 group"
          title="Pet Hatchery & Companions"
        >
          <Egg className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
          <span className="text-[9px] font-black uppercase text-white/70 tracking-tighter">Pets</span>
        </button>

        {/* Emotes Wheel */}
        <button
          id="open_emotes_btn"
          onClick={() => { sounds.playJump(); onOpenEmotes(); }}
          className="w-12 h-12 sm:w-14 sm:h-14 bg-white/10 backdrop-blur-md rounded-2xl border-2 border-white/20 flex flex-col items-center justify-center shadow-lg hover:bg-white/20 transition-all hover:scale-105 active:scale-95 group"
          title="Emotes & Dances"
        >
          <Smile className="w-5 h-5 text-pink-400 group-hover:scale-110 transition-transform" />
          <span className="text-[9px] font-black uppercase text-white/70 tracking-tighter">Dance</span>
        </button>

        {/* Global Leaderboards */}
        <button
          id="open_leaderboard_btn"
          onClick={() => { sounds.playCheckpoint(); onOpenLeaderboard(); }}
          className="w-12 h-12 sm:w-14 sm:h-14 bg-white/10 backdrop-blur-md rounded-2xl border-2 border-white/20 flex flex-col items-center justify-center shadow-lg hover:bg-white/20 transition-all hover:scale-105 active:scale-95 group"
          title="Global Rankings & Trophies"
        >
          <Trophy className="w-5 h-5 text-yellow-400 group-hover:scale-110 transition-transform" />
          <span className="text-[9px] font-black uppercase text-white/70 tracking-tighter">Ranks</span>
        </button>

        {/* Google Drive Cloud Save & Sync & Code Export */}
        {onOpenGoogleDrive && (
          <button
            id="open_google_drive_btn"
            onClick={() => { sounds.playCheckpoint(); onOpenGoogleDrive(); }}
            className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-tr from-blue-600/40 via-amber-500/30 to-emerald-500/40 backdrop-blur-md rounded-2xl border-2 border-blue-400/50 flex flex-col items-center justify-center shadow-lg hover:border-blue-300 transition-all hover:scale-105 active:scale-95 group"
            title="Google Drive Cloud Sync, Course Blueprints & Code Export"
          >
            <Cloud className="w-5 h-5 text-blue-300 group-hover:scale-110 transition-transform" />
            <span className="text-[9px] font-black uppercase text-blue-200 tracking-tighter">Drive</span>
          </button>
        )}

        {/* Sound FX Toggle */}
        <button
          id="toggle_sfx_btn"
          onClick={handleMuteToggle}
          className="w-12 h-12 sm:w-14 sm:h-14 bg-white/10 backdrop-blur-md rounded-2xl border-2 border-white/20 flex items-center justify-center shadow-lg hover:bg-white/20 transition-all hover:scale-105 active:scale-95"
          title={isMuted ? 'Unmute SFX' : 'Mute SFX'}
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
        </button>

        {/* BGM Toggle */}
        <button
          id="toggle_music_btn"
          onClick={handleMusicToggle}
          className={`w-12 h-12 sm:w-14 sm:h-14 backdrop-blur-md rounded-2xl border-2 transition-all hover:scale-105 active:scale-95 flex items-center justify-center shadow-lg ${
            isMusicPlaying
              ? 'bg-emerald-500/30 border-emerald-400/80 text-emerald-300 animate-pulse'
              : 'bg-white/10 border-white/20 text-white/60 hover:bg-white/20'
          }`}
          title="Toggle Chiptune Music"
        >
          <Music className="w-5 h-5" />
        </button>
      </div>

      {/* Floating Notifications Toast Stack */}
      <div className="pointer-events-none flex flex-col items-center gap-2">
        {notifications.map((n) => (
          <div
            key={n.id}
            className="pointer-events-auto flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs font-black shadow-2xl animate-in slide-in-from-top-4 duration-200"
          >
            <span className="text-xl">{n.icon}</span>
            <span>{n.text}</span>
          </div>
        ))}
      </div>

      {/* Proximity Interactive Banner */}
      {interactivePrompt && (
        <div className="pointer-events-auto self-center mb-4 px-6 py-3 rounded-2xl bg-black/60 backdrop-blur-md text-white font-black text-sm shadow-2xl border border-white/30 animate-pulse flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-yellow-300" />
          <span>{interactivePrompt}</span>
        </div>
      )}

      {/* Bottom Interface Area: Mobile Touch Joystick (Left) + Hotbar & Status Gauge (Center) + Glowing Jump Button (Right) */}
      <div className="flex items-end justify-between w-full">
        {/* Left: Mobile Touch Virtual Joystick */}
        <div className="pointer-events-auto flex flex-col items-start gap-2">
          <div
            id="virtual_joystick_base"
            ref={joystickBaseRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-black/40 backdrop-blur-md border-2 border-white/20 shadow-2xl relative flex items-center justify-center touch-none"
          >
            {/* Stick Knob */}
            <div
              className="w-12 h-12 rounded-full bg-gradient-to-tr from-sky-400 to-blue-600 border-2 border-white/80 shadow-[0_0_20px_rgba(56,189,248,0.5)] pointer-events-none"
              style={{
                transform: `translate(${stickPos.x}px, ${stickPos.y}px)`,
                transition: joystickActive ? 'none' : 'transform 0.15s ease-out',
              }}
            />
          </div>

          {/* Desktop Controls Hint */}
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-white/70 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/15">
            <span>[WASD] Move</span>
            <span>•</span>
            <span>[Space] Jump</span>
            <span>•</span>
            <span>[Shift] Sprint</span>
            <span>•</span>
            <span>[R] Reset</span>
          </div>
        </div>

        {/* Center: Immersive Hotbar & Gauge */}
        <div className="pointer-events-auto flex flex-col items-center gap-3">
          {/* Obby / World Progress Gauge matching Immersive UI Health bar */}
          <div className="w-[280px] sm:w-[380px] h-6 sm:h-7 bg-black/40 rounded-full border border-white/20 overflow-hidden relative backdrop-blur-md shadow-inner">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                currentMode === 'lava'
                  ? 'bg-gradient-to-r from-orange-500 to-rose-500'
                  : currentMode === 'tycoon'
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-500'
                  : 'bg-gradient-to-r from-emerald-400 to-green-500'
              }`}
              style={{
                width:
                  currentMode === 'lava'
                    ? `${Math.max(0, Math.min(100, (lavaInfo.timeLeft / 60) * 100))}%`
                    : currentMode === 'tycoon'
                    ? `${Math.min(100, (tycoonCash.uncollected / 200) * 100)}%`
                    : `${obbyProgress}%`,
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-white drop-shadow">
              {currentMode === 'lava'
                ? `Lava Flood Timer: ${lavaInfo.timeLeft}s`
                : currentMode === 'tycoon'
                ? `Uncollected Candy: $${tycoonCash.uncollected}`
                : `Obby Stage Progress: ${obbyProgress}%`}
            </div>
          </div>

          {/* Tactile Hotbar 5 Slots matching Immersive UI */}
          <div className="flex gap-2 sm:gap-3 bg-black/40 p-2 sm:p-2.5 rounded-[24px] backdrop-blur-md border border-white/20 shadow-2xl">
            {/* Slot 1: Outfits */}
            <button
              onClick={() => { sounds.playJump(); onOpenAvatarShop(); }}
              className="w-13 h-13 sm:w-16 sm:h-16 bg-blue-500/80 hover:bg-blue-500 rounded-2xl border-b-4 border-blue-900 flex flex-col items-center justify-center relative transition-all active:border-b-0 active:translate-y-1 shadow-lg group"
              title="Equip Outfits"
            >
              <div className="text-[10px] text-white/60 font-black absolute top-1 left-1.5">1</div>
              <ShoppingBag className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
            </button>

            {/* Slot 2: Pets */}
            <button
              onClick={() => { sounds.playJump(); onOpenPetEggModal(); }}
              className="w-13 h-13 sm:w-16 sm:h-16 bg-green-500/80 hover:bg-green-500 rounded-2xl border-b-4 border-green-900 flex flex-col items-center justify-center relative transition-all active:border-b-0 active:translate-y-1 shadow-lg group"
              title="Equip Pets"
            >
              <div className="text-[10px] text-white/60 font-black absolute top-1 left-1.5">2</div>
              <Egg className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
            </button>

            {/* Slot 3: Emotes */}
            <button
              onClick={() => { sounds.playJump(); onOpenEmotes(); }}
              className="w-13 h-13 sm:w-16 sm:h-16 bg-purple-500/80 hover:bg-purple-500 rounded-2xl border-b-4 border-purple-900 flex flex-col items-center justify-center relative transition-all active:border-b-0 active:translate-y-1 shadow-lg group"
              title="Emote Wheel"
            >
              <div className="text-[10px] text-white/60 font-black absolute top-1 left-1.5">3</div>
              <Smile className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
            </button>

            {/* Slot 4: Sprint Boost */}
            <button
              onClick={handleSprintToggle}
              className={`w-13 h-13 sm:w-16 sm:h-16 rounded-2xl border-b-4 flex flex-col items-center justify-center relative transition-all active:border-b-0 active:translate-y-1 shadow-lg group ${
                isSprintActive
                  ? 'bg-amber-500 border-amber-800'
                  : 'bg-white/10 border-white/20 hover:bg-white/20'
              }`}
              title="Toggle Super Sprint"
            >
              <div className="text-[10px] text-white/60 font-black absolute top-1 left-1.5">4</div>
              <Zap className={`w-6 h-6 ${isSprintActive ? 'text-slate-950 animate-bounce' : 'text-amber-400'}`} />
            </button>

            {/* Slot 5: Rankings */}
            <button
              onClick={() => { sounds.playJump(); onOpenLeaderboard(); }}
              className="w-13 h-13 sm:w-16 sm:h-16 bg-white/10 hover:bg-white/20 rounded-2xl border-b-4 border-white/20 flex flex-col items-center justify-center relative transition-all active:border-b-0 active:translate-y-1 shadow-lg group"
              title="Leaderboard Rankings"
            >
              <div className="text-[10px] text-white/60 font-black absolute top-1 left-1.5">5</div>
              <Trophy className="w-6 h-6 text-yellow-400 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>

        {/* Right: Immersive UI Glowing Jump Button */}
        <div className="pointer-events-auto flex items-end gap-3">
          {/* Jump Button */}
          <button
            id="mobile_jump_btn"
            onClick={onRequestJump}
            className="w-20 h-20 sm:w-24 sm:h-24 bg-white/15 backdrop-blur-xl rounded-full border-4 border-white/30 flex flex-col items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.25)] hover:bg-white/25 active:scale-90 transition-all cursor-pointer select-none text-white font-black text-xs uppercase tracking-widest"
          >
            <ArrowUp className="w-8 h-8 stroke-[3.5] text-white mb-0.5" />
            <span className="text-[11px] font-black tracking-wider">JUMP</span>
          </button>
        </div>
      </div>
    </div>
  );
};

