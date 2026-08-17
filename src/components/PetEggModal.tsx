import React, { useState } from 'react';
import { EggType, Pet } from '../types';
import { sounds } from '../audio/soundManager';
import confetti from 'canvas-confetti';
import { X, Sparkles, Check, Egg, Zap, Coins } from 'lucide-react';

interface PetEggModalProps {
  isOpen: boolean;
  onClose: () => void;
  coins: number;
  gems: number;
  inventory: Pet[];
  onHatchPet: (pet: Pet, cost: number, currency: 'coins' | 'gems') => void;
  onToggleEquip: (petId: string) => void;
}

export const EGG_TYPES: EggType[] = [
  {
    id: 'basic_egg',
    name: 'Starter Egg',
    cost: 40,
    currency: 'coins',
    color: '#38bdf8',
    icon: '🥚',
    drops: [
      { species: 'dog', name: 'Shiba Pup', rarity: 'Common', color: '#f59e0b', chance: 50, coinMultiplier: 0.15, speedBoost: 0.1, jumpBoost: 0.05 },
      { species: 'cat', name: 'Calico Kitty', rarity: 'Rare', color: '#ec4899', chance: 35, coinMultiplier: 0.25, speedBoost: 0.15, jumpBoost: 0.1 },
      { species: 'panda', name: 'Bouncing Panda', rarity: 'Epic', color: '#f8fafc', chance: 15, coinMultiplier: 0.4, speedBoost: 0.2, jumpBoost: 0.2 },
    ],
  },
  {
    id: 'jungle_egg',
    name: 'Jungle Egg',
    cost: 120,
    currency: 'coins',
    color: '#22c55e',
    icon: '🌴',
    drops: [
      { species: 'dino', name: 'Baby Rex', rarity: 'Rare', color: '#16a34a', chance: 50, coinMultiplier: 0.35, speedBoost: 0.2, jumpBoost: 0.15 },
      { species: 'dog', name: 'Jungle Wolf', rarity: 'Epic', color: '#64748b', chance: 35, coinMultiplier: 0.5, speedBoost: 0.3, jumpBoost: 0.2 },
      { species: 'dragon', name: 'Emerald Drake', rarity: 'Legendary', color: '#10b981', chance: 15, coinMultiplier: 0.8, speedBoost: 0.4, jumpBoost: 0.35 },
    ],
  },
  {
    id: 'cosmic_egg',
    name: 'Cosmic Egg',
    cost: 10,
    currency: 'gems',
    color: '#8b5cf6',
    icon: '🚀',
    drops: [
      { species: 'alien', name: 'Glow Alien', rarity: 'Rare', color: '#a855f7', chance: 50, coinMultiplier: 0.6, speedBoost: 0.3, jumpBoost: 0.25 },
      { species: 'cat', name: 'Cosmic Astro-Cat', rarity: 'Legendary', color: '#3b82f6', chance: 35, coinMultiplier: 1.0, speedBoost: 0.5, jumpBoost: 0.4 },
      { species: 'phoenix', name: 'Supernova Phoenix', rarity: 'Mythic', color: '#f43f5e', chance: 15, coinMultiplier: 1.5, speedBoost: 0.7, jumpBoost: 0.6 },
    ],
  },
  {
    id: 'rainbow_egg',
    name: 'Mythic Rainbow Egg',
    cost: 25,
    currency: 'gems',
    color: '#facc15',
    icon: '🌈',
    drops: [
      { species: 'unicorn', name: 'Golden Rainbow Unicorn', rarity: 'Legendary', color: '#fde047', chance: 50, coinMultiplier: 1.2, speedBoost: 0.6, jumpBoost: 0.5 },
      { species: 'dragon', name: 'Inferno Gold Dragon', rarity: 'Legendary', color: '#ef4444', chance: 35, coinMultiplier: 1.4, speedBoost: 0.65, jumpBoost: 0.55 },
      { species: 'phoenix', name: 'Celestial Solar Phoenix', rarity: 'Mythic', color: '#fbbf24', chance: 15, coinMultiplier: 2.2, speedBoost: 0.9, jumpBoost: 0.8 },
    ],
  },
];

export const PetEggModal: React.FC<PetEggModalProps> = ({
  isOpen,
  onClose,
  coins,
  gems,
  inventory,
  onHatchPet,
  onToggleEquip,
}) => {
  const [activeTab, setActiveTab] = useState<'hatch' | 'inventory'>('hatch');
  const [isHatching, setIsHatching] = useState<boolean>(false);
  const [hatchProgress, setHatchProgress] = useState<number>(0);
  const [hatchedPet, setHatchedPet] = useState<Pet | null>(null);

  if (!isOpen) return null;

  const handleStartHatch = (egg: EggType) => {
    const userFunds = egg.currency === 'coins' ? coins : gems;
    if (userFunds < egg.cost) {
      sounds.playLavaDefeat();
      return;
    }

    setIsHatching(true);
    setHatchProgress(0);
    setHatchedPet(null);

    // Crack sounds sequence
    setTimeout(() => { sounds.playEggCrack(); setHatchProgress(1); }, 400);
    setTimeout(() => { sounds.playEggCrack(); setHatchProgress(2); }, 900);
    setTimeout(() => { sounds.playEggCrack(); setHatchProgress(3); }, 1400);

    setTimeout(() => {
      // Pick random drop
      const rand = Math.random() * 100;
      let cum = 0;
      let selected = egg.drops[0];
      for (const d of egg.drops) {
        cum += d.chance;
        if (rand <= cum) {
          selected = d;
          break;
        }
      }

      const newPet: Pet = {
        id: `pet_${Date.now()}`,
        name: selected.name,
        species: selected.species,
        rarity: selected.rarity,
        color: selected.color,
        coinMultiplier: selected.coinMultiplier,
        speedBoost: selected.speedBoost,
        jumpBoost: selected.jumpBoost,
        level: 1,
        equipped: true,
      };

      setHatchedPet(newPet);
      sounds.playEggFanfare(newPet.rarity);
      confetti({
        particleCount: newPet.rarity === 'Mythic' ? 120 : 60,
        spread: 70,
        origin: { y: 0.6 },
      });

      onHatchPet(newPet, egg.cost, egg.currency);
      setIsHatching(false);
    }, 1800);
  };

  const equippedCount = inventory.filter((p) => p.equipped).length;

  return (
    <div id="pet_egg_modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl bg-slate-950/90 backdrop-blur-2xl border-2 border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.8)] p-6 text-white flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center shadow-inner">
              <Egg className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-wide">Pet Hatchery & Simulator</h2>
              <p className="text-xs text-white/60 font-medium">Hatch mystery eggs and equip flying 3D companion pets!</p>
            </div>
          </div>
          <button
            id="close_pet_modal_btn"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle with 3D Bevels */}
        <div className="flex gap-2 border-b border-white/10 py-3">
          <button
            id="tab_egg_shop"
            onClick={() => { setActiveTab('hatch'); setHatchedPet(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border-b-4 active:border-b-0 active:translate-y-1 ${
              activeTab === 'hatch'
                ? 'bg-purple-600 text-white border-purple-900 shadow-lg'
                : 'bg-white/10 text-white/70 hover:bg-white/20 border-white/15'
            }`}
          >
            <Egg className="w-4 h-4" /> Hatch Eggs
          </button>
          <button
            id="tab_my_pets"
            onClick={() => setActiveTab('inventory')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border-b-4 active:border-b-0 active:translate-y-1 ${
              activeTab === 'inventory'
                ? 'bg-purple-600 text-white border-purple-900 shadow-lg'
                : 'bg-white/10 text-white/70 hover:bg-white/20 border-white/15'
            }`}
          >
            <Sparkles className="w-4 h-4" /> My Pets ({inventory.length}) • Equipped ({equippedCount}/3)
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto py-4">
          {/* Egg Hatching Animation Overlay */}
          {isHatching && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">
              <div
                className={`text-8xl transform transition-transform duration-150 ${
                  hatchProgress === 1
                    ? '-rotate-12 scale-105'
                    : hatchProgress === 2
                    ? 'rotate-12 scale-110'
                    : hatchProgress === 3
                    ? '-rotate-6 scale-125'
                    : 'animate-bounce'
                }`}
              >
                🥚
              </div>
              <h3 className="text-2xl font-black text-purple-300 animate-pulse">
                {hatchProgress === 3 ? 'CRACKING OPEN!!' : 'Hatching Egg...'}
              </h3>
              <p className="text-sm text-white/60">Cross your fingers for a Legendary or Mythic!</p>
            </div>
          )}

          {/* Hatched Pet Reveal Card */}
          {hatchedPet && !isHatching && (
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-4 bg-purple-950/40 rounded-3xl border-2 border-purple-400 p-6 shadow-2xl backdrop-blur-md">
              <span className="px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 shadow-md">
                {hatchedPet.rarity}
              </span>
              <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-6xl shadow-inner border-2 border-white/20" style={{ backgroundColor: hatchedPet.color }}>
                {hatchedPet.species === 'dragon' ? '🐲' : hatchedPet.species === 'unicorn' ? '🦄' : hatchedPet.species === 'alien' ? '👽' : hatchedPet.species === 'phoenix' ? '🦅' : hatchedPet.species === 'dino' ? '🦖' : '🐶'}
              </div>
              <div>
                <h4 className="text-2xl font-black text-white">{hatchedPet.name}</h4>
                <div className="flex justify-center gap-3 mt-2 text-xs font-mono">
                  <span className="text-amber-300 bg-amber-500/20 px-3 py-1 rounded-xl border border-amber-500/30 font-bold">
                    +{Math.round(hatchedPet.coinMultiplier * 100)}% Coins
                  </span>
                  <span className="text-emerald-300 bg-emerald-500/20 px-3 py-1 rounded-xl border border-emerald-500/30 font-bold">
                    +{Math.round(hatchedPet.speedBoost * 100)}% Speed
                  </span>
                  <span className="text-cyan-300 bg-cyan-500/20 px-3 py-1 rounded-xl border border-cyan-500/30 font-bold">
                    +{Math.round(hatchedPet.jumpBoost * 100)}% Jump
                  </span>
                </div>
              </div>
              <button
                onClick={() => setHatchedPet(null)}
                className="px-6 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 border-b-4 border-purple-900 font-black text-xs uppercase tracking-wider text-white shadow-lg transition-all active:border-b-0 active:translate-y-1"
              >
                Awesome! Hatch Another
              </button>
            </div>
          )}

          {/* Hatch Shop Grid */}
          {activeTab === 'hatch' && !isHatching && !hatchedPet && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {EGG_TYPES.map((egg) => {
                const canAfford = egg.currency === 'coins' ? coins >= egg.cost : gems >= egg.cost;
                return (
                  <div
                    key={egg.id}
                    className="p-5 rounded-3xl border border-white/15 bg-white/5 hover:bg-white/10 hover:border-purple-400/50 flex flex-col justify-between space-y-4 transition-all backdrop-blur-md shadow-xl"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-4xl p-2.5 rounded-2xl bg-black/40 border border-white/15">{egg.icon}</span>
                        <div>
                          <h4 className="font-black text-base text-white">{egg.name}</h4>
                          <span className="text-xs text-white/60">3 Mystery Pets Inside</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-black font-mono ${egg.currency === 'coins' ? 'text-amber-300' : 'text-cyan-300'}`}>
                          {egg.currency === 'coins' ? `🪙 ${egg.cost}` : `💎 ${egg.cost}`}
                        </span>
                      </div>
                    </div>

                    {/* Chances Preview */}
                    <div className="bg-black/40 rounded-2xl p-3 space-y-1.5 text-xs border border-white/10">
                      {egg.drops.map((d, i) => (
                        <div key={i} className="flex justify-between items-center text-white/80">
                          <span className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full shadow" style={{ backgroundColor: d.color }} />
                            <span className="font-bold">{d.name}</span>
                            <span className="text-[10px] text-white/50 uppercase font-bold">({d.rarity})</span>
                          </span>
                          <span className="font-mono text-white/60 font-bold">{d.chance}%</span>
                        </div>
                      ))}
                    </div>

                    <button
                      id={`hatch_btn_${egg.id}`}
                      disabled={!canAfford}
                      onClick={() => handleStartHatch(egg)}
                      className={`w-full py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all border-b-4 active:border-b-0 active:translate-y-1 ${
                        canAfford
                          ? 'bg-purple-600 hover:bg-purple-500 border-purple-900 text-white shadow-purple-500/25'
                          : 'bg-white/5 border-white/10 text-white/40 cursor-not-allowed'
                      }`}
                    >
                      <Sparkles className="w-4 h-4" /> Hatch ({egg.currency === 'coins' ? `${egg.cost} Coins` : `${egg.cost} Gems`})
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pet Inventory */}
          {activeTab === 'inventory' && (
            <div>
              {inventory.length === 0 ? (
                <div className="py-12 text-center text-white/60 space-y-3">
                  <span className="text-5xl">🥚</span>
                  <p className="font-bold text-white">You don't have any pets yet!</p>
                  <p className="text-xs text-white/40">Go to the Hatch tab to crack open your first egg!</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {inventory.map((pet) => (
                    <div
                      key={pet.id}
                      className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 transition-all backdrop-blur-md ${
                        pet.equipped
                          ? 'border-purple-400 bg-purple-950/40 shadow-lg shadow-purple-500/20'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/40 text-purple-300 border border-purple-400/30">
                          {pet.rarity}
                        </span>
                        {pet.equipped && (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-black bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                            <Check className="w-3 h-3" /> EQUIPPED
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col items-center text-center">
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-white/20 mb-2"
                          style={{ backgroundColor: pet.color }}
                        >
                          {pet.species === 'dragon' ? '🐲' : pet.species === 'unicorn' ? '🦄' : pet.species === 'alien' ? '👽' : pet.species === 'phoenix' ? '🦅' : pet.species === 'dino' ? '🦖' : '🐶'}
                        </div>
                        <h5 className="font-black text-sm text-white">{pet.name}</h5>
                        <span className="text-[11px] text-amber-300 font-mono font-bold mt-1">
                          +{Math.round(pet.coinMultiplier * 100)}% Coins
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          sounds.playJump();
                          onToggleEquip(pet.id);
                        }}
                        className={`w-full py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border-b-4 active:border-b-0 active:translate-y-1 ${
                          pet.equipped
                            ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white/80'
                            : 'bg-purple-600 hover:bg-purple-500 border-purple-900 text-white shadow-lg'
                        }`}
                      >
                        {pet.equipped ? 'Unequip' : 'Equip in 3D'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Balance */}
        <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-2">
          <div className="flex items-center gap-3 text-sm font-mono">
            <span className="text-amber-300 bg-black/40 px-3.5 py-1.5 rounded-xl border border-white/15 font-black">
              🪙 <b>{coins}</b> Coins
            </span>
            <span className="text-cyan-300 bg-black/40 px-3.5 py-1.5 rounded-xl border border-white/15 font-black">
              💎 <b>{gems}</b> Gems
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
