/**
 * SUPER PIXEL WORLD — яркий 2D-платформер с конструктором уровней
 * Main App Component orchestrating Profile Creation, Main Menu, My Games, Level Editor, and Game Player.
 */

import React, { useEffect, useRef, useState } from 'react';
import { sound } from './audio/soundEngine';
import { BuilderSidebar } from './components/BuilderSidebar';
import { GamePlayer } from './components/GamePlayer';
import { LevelEditor } from './components/LevelEditor';
import { LoadPresetModal } from './components/LoadPresetModal';
import { MainMenuScreen } from './components/MainMenuScreen';
import { MyGamesScreen } from './components/MyGamesScreen';
import { ProfileCreationScreen } from './components/ProfileCreationScreen';
import { SaveGameModal } from './components/SaveGameModal';
import { TutorialModal } from './components/TutorialModal';
import { createDefaultLevel } from './game/presetLevels';
import { ProfileManager, SaveManager, SettingsManager } from './services/storageManager';
import { HeroId, LevelData, LevelItem, ThemeId, TileId, ToolMode } from './types/game';
import { UserProfile } from './types/storage';

export type AppScreenMode = 'profile_create' | 'main_menu' | 'my_games' | 'editor' | 'playing';

export default function App() {
  // Player / Creator Profile
  const [profile, setProfile] = useState<UserProfile>(() => {
    const existing = ProfileManager.getProfile();
    if (existing) return existing;
    return ProfileManager.createProfile('Создатель', 'fox');
  });

  // Screen Mode: 'profile_create' | 'main_menu' | 'my_games' | 'editor' | 'playing'
  const [screenMode, setScreenMode] = useState<AppScreenMode>('main_menu');

  // Level Data: strictly clean of pre-placed enemies, coins, stars, and crystals
  const [levelData, setLevelData] = useState<LevelData>(() => {
    // Check if there are any saved games
    const saved = SaveManager.getSavedGames();
    if (saved.length > 0 && saved[0].levelData) {
      return saved[0].levelData;
    }
    const def = createDefaultLevel();
    def.items = def.items.filter(
      (it: LevelItem) =>
        !it.tileId.startsWith('enemy_') &&
        (it.tileId as string) !== 'enemy_walker' &&
        it.tileId !== 'coin' &&
        it.tileId !== 'star' &&
        it.tileId !== 'crystal'
    );
    return def;
  });

  // Editor Tools & Selections
  const [activeTool, setActiveTool] = useState<ToolMode>('brush');
  const [selectedTile, setSelectedTile] = useState<TileId>('grass_dirt');
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>(levelData.bgTheme || 'green_islands');
  const [selectedHero, setSelectedHero] = useState<HeroId>(levelData.heroId || 'leo');

  // History stack for Undo/Redo
  const [history, setHistory] = useState<LevelItem[][]>([levelData.items]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // App UI State
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);
  const [tutorialStep, setTutorialStep] = useState<number>(0);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState<boolean>(false);

  // Fullscreen Container Ref
  const appContainerRef = useRef<HTMLDivElement | null>(null);

  // Initialize sound settings on launch
  useEffect(() => {
    const settings = SettingsManager.getSettings();
    sound.applySettings(settings);
    setIsMuted(sound.getMuted());
  }, []);

  // Sync theme/hero to levelData
  useEffect(() => {
    setLevelData((prev) => ({
      ...prev,
      bgTheme: selectedTheme,
      heroId: selectedHero,
    }));
  }, [selectedTheme, selectedHero]);

  // Handle Items Update with History
  const handleUpdateItems = (newItems: LevelItem[], recordHistory: boolean = true) => {
    setLevelData((prev) => ({ ...prev, items: newItems }));

    if (recordHistory) {
      setHistory((prev) => {
        const sliced = prev.slice(0, historyIndex + 1);
        return [...sliced, newItems];
      });
      setHistoryIndex((prev) => prev + 1);
    }
  };

  // Undo / Redo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const nextIdx = historyIndex - 1;
      const targetItems = history[nextIdx];
      setHistoryIndex(nextIdx);
      setLevelData((prev) => ({ ...prev, items: targetItems }));
      sound.playBump();
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      const targetItems = history[nextIdx];
      setHistoryIndex(nextIdx);
      setLevelData((prev) => ({ ...prev, items: targetItems }));
      sound.playPlaceTile();
    }
  };

  // Clear level
  const handleClearLevel = () => {
    const keepSpawn = levelData.items.filter((it) => it.tileId === 'player_spawn');
    handleUpdateItems(keepSpawn, true);
    sound.playErase();
  };

  // Keyboard Shortcuts (Ctrl+Z, Ctrl+Y) in editor
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (screenMode !== 'editor') return;

      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyY') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Fullscreen Toggle
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      appContainerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Mute Toggle
  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  // Switch to Play Mode
  const handleStartPlay = () => {
    setScreenMode('playing');
  };

  // Switch to Editor Mode
  const handleExitToEditor = () => {
    setScreenMode('editor');
  };

  // Switch to Main Menu
  const handleExitToMenu = () => {
    sound.stopBgm();
    setScreenMode('main_menu');
  };

  // Create fresh new level
  const handleCreateNewGame = () => {
    const def = createDefaultLevel();
    def.name = 'Новый уровень';
    def.items = def.items.filter(
      (it: LevelItem) =>
        !it.tileId.startsWith('enemy_') &&
        (it.tileId as string) !== 'enemy_walker' &&
        it.tileId !== 'coin' &&
        it.tileId !== 'star' &&
        it.tileId !== 'crystal'
    );
    setLevelData(def);
    setSelectedTheme('green_islands');
    setSelectedHero('leo');
    setHistory([def.items]);
    setHistoryIndex(0);
    setScreenMode('editor');
  };

  // Load level from MyGames into Player
  const handlePlayLevel = (level: LevelData) => {
    setLevelData(level);
    setSelectedTheme(level.bgTheme || 'green_islands');
    setSelectedHero(level.heroId || 'leo');
    setScreenMode('playing');
  };

  // Load level from MyGames into Editor
  const handleEditLevel = (level: LevelData) => {
    setLevelData(level);
    setSelectedTheme(level.bgTheme || 'green_islands');
    setSelectedHero(level.heroId || 'leo');
    setHistory([level.items]);
    setHistoryIndex(0);
    setScreenMode('editor');
  };

  return (
    <div
      ref={appContainerRef}
      className="w-screen h-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col font-sans select-none"
    >
      {/* 1. SCREEN: Profile Creation (First launch if no profile in LocalStorage) */}
      {screenMode === 'profile_create' && (
        <ProfileCreationScreen
          onProfileCreated={(newProfile) => {
            setProfile(newProfile);
            setScreenMode('main_menu');
          }}
        />
      )}

      {/* 2. SCREEN: Main Menu (Hero greeting, Play, Create, Settings) */}
      {screenMode === 'main_menu' && profile && (
        <MainMenuScreen
          profile={profile}
          onOpenPlayGames={() => setScreenMode('my_games')}
          onOpenCreateEditor={() => setScreenMode('editor')}
          onOpenPresets={() => setIsLoadModalOpen(true)}
          onProfileUpdated={(updated) => setProfile(updated)}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* 3. SCREEN: My Games (Grid of child's saved levels) */}
      {screenMode === 'my_games' && (
        <MyGamesScreen
          profile={profile}
          onBackToMenu={handleExitToMenu}
          onPlayGame={handlePlayLevel}
          onEditGame={handleEditLevel}
          onCreateNewGame={handleCreateNewGame}
        />
      )}

      {/* 4. SCREEN: Fullscreen Game Play Mode */}
      {screenMode === 'playing' && (
        <GamePlayer
          levelData={levelData}
          heroId={selectedHero}
          themeId={selectedTheme}
          isFullscreen={isFullscreen}
          isMuted={isMuted}
          onExitToEditor={handleExitToEditor}
          onExitToMenu={handleExitToMenu}
          onToggleFullscreen={handleToggleFullscreen}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* 5. SCREEN: Level Editor Mode (78-82% Left Canvas, 18-22% Right Toolbox) */}
      {screenMode === 'editor' && (
        <div className="w-full h-full flex flex-col md:flex-row overflow-hidden">
          {/* Left Main Level Canvas & Minimap */}
          <LevelEditor
            levelData={levelData}
            activeTool={activeTool}
            selectedTile={selectedTile}
            selectedTheme={selectedTheme}
            onUpdateItems={handleUpdateItems}
            onOpenTutorial={(stepIdx) => {
              setTutorialStep(stepIdx ?? 0);
              setIsTutorialOpen(true);
            }}
            onSelectTile={setSelectedTile}
            onStartPlay={handleStartPlay}
            canUndo={historyIndex > 0}
            canRedo={historyIndex < history.length - 1}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onExitToMenu={handleExitToMenu}
          />

          {/* Right Compact Level Builder Panel */}
          <BuilderSidebar
            activeTool={activeTool}
            selectedTile={selectedTile}
            selectedTheme={selectedTheme}
            selectedHero={selectedHero}
            canUndo={historyIndex > 0}
            canRedo={historyIndex < history.length - 1}
            isFullscreen={isFullscreen}
            isMuted={isMuted}
            onSelectTool={setActiveTool}
            onSelectTile={setSelectedTile}
            onSelectTheme={setSelectedTheme}
            onSelectHero={setSelectedHero}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onClear={handleClearLevel}
            onPlay={handleStartPlay}
            onSave={() => setIsSaveModalOpen(true)}
            onLoad={() => setIsLoadModalOpen(true)}
            onToggleFullscreen={handleToggleFullscreen}
            onToggleMute={handleToggleMute}
            onOpenTutorial={() => {
              setTutorialStep(0);
              setIsTutorialOpen(true);
            }}
            onExitToMenu={handleExitToMenu}
          />
        </div>
      )}

      {/* Interactive Step-by-Step Tutorial Modal */}
      <TutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        initialStep={tutorialStep}
        onSelectTile={(tile) => {
          setSelectedTile(tile);
          setIsTutorialOpen(false);
        }}
        onStartPlay={() => {
          setIsTutorialOpen(false);
          handleStartPlay();
        }}
      />

      {/* Save Level to LocalStorage "Мои Игры" Modal */}
      <SaveGameModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        currentLevel={levelData}
        profile={profile}
        onSaved={(savedName) => {
          setLevelData((prev) => ({ ...prev, name: savedName }));
        }}
      />

      {/* Preset Levels & Import/Export Modal */}
      <LoadPresetModal
        isOpen={isLoadModalOpen}
        onClose={() => setIsLoadModalOpen(false)}
        currentLevel={levelData}
        onSelectLevel={(newLevel) => {
          setLevelData(newLevel);
          setSelectedTheme(newLevel.bgTheme || 'green_islands');
          setSelectedHero(newLevel.heroId || 'leo');
          setHistory([newLevel.items]);
          setHistoryIndex(0);
        }}
      />
    </div>
  );
}
