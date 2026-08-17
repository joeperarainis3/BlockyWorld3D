/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  AvatarCustomization,
  ChatMessage,
  GameMode,
  LeaderboardEntry,
  Pet,
  SandboxBlock,
} from './types';
import { ThreeGameEngine } from './game/threeEngine';
import { GameHUD } from './components/GameHUD';
import { AvatarShopModal } from './components/AvatarShopModal';
import { PetEggModal } from './components/PetEggModal';
import { EmoteWheelModal } from './components/EmoteWheelModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { CelebrationModal } from './components/CelebrationModal';
import { BuilderToolbar } from './components/BuilderToolbar';
import { ChatWidget } from './components/ChatWidget';
import { GoogleDriveModal } from './components/GoogleDriveModal';
import { initAuth } from './services/firebaseAuth';
import { DriveSaveData } from './services/googleDriveService';
import { User } from 'firebase/auth';
import confetti from 'canvas-confetti';
import { sounds } from './audio/soundManager';

const INITIAL_CUSTOMIZATION: AvatarCustomization = {
  skinColor: '#fde047',
  torsoColor: '#3b82f6',
  leftArmColor: '#fde047',
  rightArmColor: '#fde047',
  leftLegColor: '#22c55e',
  rightLegColor: '#22c55e',
  faceExpression: 'smile',
  hat: 'party',
  backAccessory: 'cape',
  heldItem: 'balloon',
  trail: 'rainbow',
  title: 'Obby Champ',
};

const INITIAL_PETS: Pet[] = [
  {
    id: 'pet_starter_1',
    name: 'Starter Puppy',
    species: 'dog',
    rarity: 'Common',
    color: '#f59e0b',
    coinMultiplier: 0.2,
    speedBoost: 0.1,
    jumpBoost: 0.05,
    level: 1,
    equipped: true,
  },
];

const INITIAL_CHAT: ChatMessage[] = [
  { id: '1', sender: 'Blox_System', text: 'Welcome to Blocky World 3D! Choose a world or jump into the Rainbow Obby! 🌈', color: '#facc15', isSystem: true, time: '12:00' },
  { id: '2', sender: 'SparkleUnicorn', text: 'OMG just hatched a Golden Dragon in the egg shop!! 🐲✨', color: '#ec4899', time: '12:01' },
  { id: '3', sender: 'NoobMaster99', text: 'Who wants to race on Stage 4?', color: '#38bdf8', time: '12:02' },
  { id: '4', sender: 'GamerGirl_Jess', text: 'The Candy Tycoon elf is so helpful haha 🍭', color: '#a855f7', time: '12:02' },
];

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<ThreeGameEngine | null>(null);

  // Game state
  const [currentMode, setCurrentMode] = useState<GameMode>('lobby');
  const [coins, setCoins] = useState<number>(120);
  const [gems, setGems] = useState<number>(20);
  const [customization, setCustomization] = useState<AvatarCustomization>(INITIAL_CUSTOMIZATION);
  const [inventory, setInventory] = useState<Pet[]>(INITIAL_PETS);

  // Stage & Tycoon state
  const [stage, setStage] = useState<number>(1);
  const [stageName, setStageName] = useState<string>('Rainbow Steps');
  const [tycoonCash, setTycoonCash] = useState({ uncollected: 0, total: 0 });
  const [lavaInfo, setLavaInfo] = useState({ timeLeft: 60, lavaHeight: -5, active: true });
  const [interactivePrompt, setInteractivePrompt] = useState<string | null>(null);

  // Notifications
  const [notifications, setNotifications] = useState<{ id: string; text: string; icon: string }[]>([]);

  // Modals
  const [isAvatarShopOpen, setIsAvatarShopOpen] = useState<boolean>(false);
  const [isPetModalOpen, setIsPetModalOpen] = useState<boolean>(false);
  const [isEmoteModalOpen, setIsEmoteModalOpen] = useState<boolean>(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isGoogleDriveOpen, setIsGoogleDriveOpen] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [celebrationData, setCelebrationData] = useState<{
    isOpen: boolean;
    title: string;
    subtitle: string;
    coins: number;
    gems: number;
  }>({
    isOpen: false,
    title: '',
    subtitle: '',
    coins: 0,
    gems: 0,
  });

  // Sandbox Builder state
  const [sandboxBlockType, setSandboxBlockType] = useState<string>('cube');
  const [sandboxColor, setSandboxColor] = useState<string>('#ef4444');
  const [isTestPlaying, setIsTestPlaying] = useState<boolean>(false);
  const [isDeleteMode, setIsDeleteMode] = useState<boolean>(false);

  // Auth Initialization Listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        setCurrentUser(user);
      },
      () => {
        setCurrentUser(null);
      }
    );
    return () => {
      unsubscribe();
    };
  }, []);

  // Chat & Leaderboards
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_CHAT);
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([
    { id: 'p1', name: 'Blox_King', avatar: '👑', score: 14500, stage: 10, coins: 4800 },
    { id: 'p2', name: 'SparkleUnicorn', avatar: '🦄', score: 11200, stage: 9, coins: 3400 },
    { id: 'player', name: 'You (Player)', avatar: '😎', score: 3500, stage: 1, coins: 120, isPlayer: true },
    { id: 'p3', name: 'GamerGirl_Jess', avatar: '🌸', score: 2800, stage: 6, coins: 950 },
    { id: 'p4', name: 'NoobMaster99', avatar: '🚀', score: 1200, stage: 3, coins: 420 },
  ]);

  const addNotification = (text: string, icon: string) => {
    const id = `notif_${Date.now()}_${Math.random()}`;
    setNotifications((prev) => [...prev.slice(-3), { id, text, icon }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3200);
  };

  // Initialize Three.js Game Engine
  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new ThreeGameEngine(containerRef.current, customization, {
      onCoinsEarned: (amount, reason) => {
        setCoins((c) => c + amount);
        addNotification(`+${amount} Coins - ${reason}`, '🪙');
        // Update player score on leaderboard
        setLeaderboardEntries((prev) =>
          prev.map((entry) =>
            entry.isPlayer
              ? { ...entry, coins: entry.coins + amount, score: entry.score + amount * 10 }
              : entry
          )
        );
      },
      onGemsEarned: (amount, reason) => {
        setGems((g) => g + amount);
        addNotification(`+${amount} Gems - ${reason}`, '💎');
      },
      onStageChange: (newStage, newStageName) => {
        setStage(newStage);
        setStageName(newStageName);
        setLeaderboardEntries((prev) =>
          prev.map((entry) => (entry.isPlayer ? { ...entry, stage: Math.max(entry.stage, newStage) } : entry))
        );
      },
      onObbyFinish: () => {
        setCelebrationData({
          isOpen: true,
          title: 'Obby Champion!!',
          subtitle: 'You mastered all 10 stages of the Mega Rainbow Obby!',
          coins: 200,
          gems: 10,
        });
        confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 } });
      },
      onPortalEnter: (mode) => {
        if (mode === 'shop') {
          setIsAvatarShopOpen(true);
        } else if (mode === 'pets') {
          setIsPetModalOpen(true);
        } else {
          handleSelectMode(mode as GameMode);
        }
      },
      onTycoonCashUpdate: (uncollected, total) => {
        setTycoonCash({ uncollected, total });
      },
      onLavaRoundEnd: (survived) => {
        if (survived) {
          setCelebrationData({
            isOpen: true,
            title: 'Lava Survivor!!',
            subtitle: 'You escaped the rising magma and reached the peak airship!',
            coins: 150,
            gems: 5,
          });
        } else {
          addNotification('Burned in Lava! Respawning on perch...', '🌋');
        }
      },
      onLavaTimeUpdate: (timeLeft, lavaHeight) => {
        setLavaInfo({ timeLeft, lavaHeight, active: timeLeft > 0 });
      },
      onInteractiveNearby: (prompt) => {
        setInteractivePrompt(prompt);
      },
    });

    engine.setEquippedPets(inventory.filter((p) => p.equipped));
    engineRef.current = engine;

    // Periodic AI Buddy chat messages
    const buddyMessages = [
      { sender: 'NoobMaster99', text: 'I love double jumping with the angel wings! 🪽' },
      { sender: 'SparkleUnicorn', text: 'Who wants to try Floor is Lava round with me? 🌋' },
      { sender: 'Blox_King', text: 'GG to everyone clearing stage 10 today! 🏆' },
      { sender: 'PizzaLover', text: 'My candy tycoon is making $100/sec now!! 🍭💰' },
      { sender: 'GamerGirl_Jess', text: 'Look at my new cat ears and rainbow trail! 😺' },
    ];

    let buddyIdx = 0;
    const chatInterval = setInterval(() => {
      const b = buddyMessages[buddyIdx % buddyMessages.length];
      buddyIdx++;
      setChatMessages((prev) => [
        ...prev.slice(-25),
        {
          id: `chat_${Date.now()}`,
          sender: b.sender,
          text: b.text,
          color: b.sender === 'SparkleUnicorn' ? '#ec4899' : b.sender === 'Blox_King' ? '#eab308' : '#38bdf8',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 14000);

    return () => {
      clearInterval(chatInterval);
      engine.destroy();
    };
  }, []);

  // Mode change handler
  const handleSelectMode = (mode: GameMode) => {
    setCurrentMode(mode);
    if (engineRef.current) {
      engineRef.current.setGameMode(mode);
    }
  };

  // Avatar Customization update
  const handleSaveAvatar = (newCustom: AvatarCustomization) => {
    setCustomization(newCustom);
    if (engineRef.current) {
      engineRef.current.setAvatarCustomization(newCustom);
    }
    addNotification('Equipped new avatar outfit!', '✨');
  };

  // Pet hatching
  const handleHatchPet = (pet: Pet, cost: number, currency: 'coins' | 'gems') => {
    if (currency === 'coins') setCoins((c) => Math.max(0, c - cost));
    if (currency === 'gems') setGems((g) => Math.max(0, g - cost));

    const updated = [...inventory, pet];
    setInventory(updated);

    if (engineRef.current) {
      engineRef.current.setEquippedPets(updated.filter((p) => p.equipped));
    }

    addNotification(`Hatched ${pet.name} (${pet.rarity})!`, '🥚');
  };

  // Pet equip toggle
  const handleTogglePetEquip = (petId: string) => {
    const equippedNow = inventory.filter((p) => p.equipped);
    const target = inventory.find((p) => p.id === petId);

    if (target && !target.equipped && equippedNow.length >= 3) {
      addNotification('Max 3 pets can be equipped at once!', '⚠️');
      sounds.playLavaDefeat();
      return;
    }

    const updated = inventory.map((p) => (p.id === petId ? { ...p, equipped: !p.equipped } : p));
    setInventory(updated);

    if (engineRef.current) {
      engineRef.current.setEquippedPets(updated.filter((p) => p.equipped));
    }
  };

  // Emote trigger
  const handleSelectEmote = (emote: string) => {
    if (engineRef.current) {
      engineRef.current.triggerEmote(emote);
    }
    addNotification(`Dancing: ${emote.toUpperCase()}`, '🕺');
  };

  // Chat message send
  const handleSendMessage = (text: string) => {
    const newMsg: ChatMessage = {
      id: `chat_${Date.now()}`,
      sender: 'You',
      text,
      color: '#38bdf8',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages((prev) => [...prev, newMsg]);

    // Simulated friendly response after 2 seconds
    setTimeout(() => {
      const replies = ['Awesome jump!', 'Nice style!', 'Let\'s goooo! 🔥', 'GG friend!', 'Check out the tycoon!'];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];
      setChatMessages((prev) => [
        ...prev,
        {
          id: `chat_reply_${Date.now()}`,
          sender: 'SparkleUnicorn',
          text: randomReply,
          color: '#ec4899',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 2200);
  };

  // Google Drive Course & Save Handlers
  const handleLoadCourseBlocks = (blocks: SandboxBlock[], title: string) => {
    if (currentMode !== 'sandbox') {
      handleSelectMode('sandbox');
    }
    setTimeout(() => {
      engineRef.current?.loadCustomSandboxBlocks(blocks);
      addNotification(`Loaded "${title}" (${blocks.length} blocks) from Google Drive!`, '☁️');
    }, 100);
  };

  const handleRestoreGameSave = (saveData: DriveSaveData) => {
    if (saveData.coins !== undefined) setCoins(saveData.coins);
    if (saveData.gems !== undefined) setGems(saveData.gems);
    if (saveData.stage !== undefined) {
      setStage(saveData.stage);
      setStageName(`Stage ${saveData.stage}`);
    }
    if (saveData.pets && Array.isArray(saveData.pets)) {
      setInventory(saveData.pets);
      engineRef.current?.setEquippedPets(saveData.pets.filter((p) => p.equipped));
    }
    if (saveData.avatar) {
      setCustomization(saveData.avatar);
      engineRef.current?.setAvatarCustomization(saveData.avatar);
    }
    addNotification('Restored game data from Google Drive!', '✨');
  };

  return (
    <div id="game_app_container" className="relative w-screen h-screen overflow-hidden bg-slate-950 select-none">
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Roblox Game HUD */}
      <GameHUD
        currentMode={currentMode}
        onSelectMode={handleSelectMode}
        coins={coins}
        gems={gems}
        stage={stage}
        stageName={stageName}
        tycoonCash={tycoonCash}
        lavaInfo={lavaInfo}
        onRespawn={() => engineRef.current?.respawn()}
        onOpenAvatarShop={() => setIsAvatarShopOpen(true)}
        onOpenPetEggModal={() => setIsPetModalOpen(true)}
        onOpenEmotes={() => setIsEmoteModalOpen(true)}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        onOpenGoogleDrive={() => setIsGoogleDriveOpen(true)}
        interactivePrompt={interactivePrompt}
        onJoystickMove={(x, y) => engineRef.current?.setJoystickVector(x, y)}
        onRequestJump={() => engineRef.current?.requestJump()}
        onToggleSprint={(sprint) => engineRef.current?.setSprint(sprint)}
        notifications={notifications}
      />

      {/* Sandbox Studio Builder Toolbar */}
      {currentMode === 'sandbox' && (
        <BuilderToolbar
          selectedBlockType={sandboxBlockType}
          onSelectBlockType={(type) => {
            setSandboxBlockType(type);
            engineRef.current?.setSandboxBlockType(type);
          }}
          selectedColor={sandboxColor}
          onSelectColor={(color) => {
            setSandboxColor(color);
            engineRef.current?.setSandboxColor(color);
          }}
          isTestPlaying={isTestPlaying}
          onToggleTestPlay={() => {
            const next = !isTestPlaying;
            setIsTestPlaying(next);
            engineRef.current?.setSandboxEditMode(!next);
            addNotification(next ? 'Test Playing Course!' : 'Studio Edit Mode Active', next ? '🎮' : '🛠️');
          }}
          onClearBlocks={() => {
            engineRef.current?.clearSandboxBlocks();
            addNotification('Cleared all blocks!', '🗑️');
          }}
          onLoadPreset={(preset) => {
            engineRef.current?.loadSandboxPreset(preset);
            addNotification(`Loaded ${preset.toUpperCase()} course!`, '🛠️');
          }}
          onQuickPlace={() => {
            engineRef.current?.placeBlockInFrontOfPlayer();
          }}
          onRotateBlock={() => {
            engineRef.current?.rotateSandboxBlock();
          }}
          isDeleteMode={isDeleteMode}
          onToggleDeleteMode={() => {
            const nextDel = !isDeleteMode;
            setIsDeleteMode(nextDel);
            engineRef.current?.setSandboxDeleteMode(nextDel);
            addNotification(nextDel ? 'Eraser Mode On' : 'Eraser Mode Off', nextDel ? '🧹' : '✏️');
          }}
          onOpenGoogleDrive={() => setIsGoogleDriveOpen(true)}
        />
      )}

      {/* Simulated Live Chat Widget */}
      <ChatWidget
        messages={chatMessages}
        onSendMessage={handleSendMessage}
        isOpen={isChatOpen}
        onToggle={() => setIsChatOpen(!isChatOpen)}
      />

      {/* Avatar Shop & Dressing Room Modal */}
      <AvatarShopModal
        isOpen={isAvatarShopOpen}
        onClose={() => setIsAvatarShopOpen(false)}
        customization={customization}
        onSave={handleSaveAvatar}
        coins={coins}
        gems={gems}
      />

      {/* Pet Simulator & Egg Hatchery Modal */}
      <PetEggModal
        isOpen={isPetModalOpen}
        onClose={() => setIsPetModalOpen(false)}
        coins={coins}
        gems={gems}
        inventory={inventory}
        onHatchPet={handleHatchPet}
        onToggleEquip={handleTogglePetEquip}
      />

      {/* Emote Wheel Modal */}
      <EmoteWheelModal
        isOpen={isEmoteModalOpen}
        onClose={() => setIsEmoteModalOpen(false)}
        onSelectEmote={handleSelectEmote}
      />

      {/* Leaderboard Modal */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        entries={leaderboardEntries}
        currentMode={currentMode}
      />

      {/* Google Drive Cloud Sync & Save Modal */}
      <GoogleDriveModal
        isOpen={isGoogleDriveOpen}
        onClose={() => setIsGoogleDriveOpen(false)}
        currentUser={currentUser}
        onUserChanged={(u) => setCurrentUser(u)}
        currentBlocks={engineRef.current ? engineRef.current.getSandboxBlocks() : []}
        onLoadCourseBlocks={handleLoadCourseBlocks}
        coins={coins}
        gems={gems}
        obbyStage={stage}
        pets={inventory}
        avatar={customization}
        tycoonButtons={[]}
        onRestoreGameSave={handleRestoreGameSave}
        onNotify={(text, icon) => addNotification(text, icon || '☁️')}
      />

      {/* Victory Celebration Modal */}
      <CelebrationModal
        isOpen={celebrationData.isOpen}
        onClose={() => setCelebrationData((prev) => ({ ...prev, isOpen: false }))}
        title={celebrationData.title}
        subtitle={celebrationData.subtitle}
        coinsEarned={celebrationData.coins}
        gemsEarned={celebrationData.gems}
        onPlayAgain={() => {
          if (currentMode === 'obby') engineRef.current?.respawn();
          if (currentMode === 'lava') handleSelectMode('lava');
        }}
      />
    </div>
  );
}
