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
import { TutorialOverlay } from './components/TutorialOverlay';
import { createDefaultLevel } from './game/presetLevels';
import { ProfileManager, SaveManager, SettingsManager } from './services/storageManager';
import { TutorialManager } from './services/TutorialManager';
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

  // Interactive Onboarding Guided Tour State
  const [isGuidedTourOpen, setIsGuidedTourOpen] = useState<boolean>(() => {
    return !TutorialManager.isGuidedTourCompleted();
  });
  const [guidedTourStep, setGuidedTourStep] = useState<number>(0);
  const [tourBlocksPlaced, setTourBlocksPlaced] = useState<number>(0);

  // App UI State
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);
  const [tutorialStep, setTutorialStep] = useState<number>(0);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState<boolean>(false);

  // Fullscreen Container Ref
  const appContainerRef = useRef<HTMLDivElement | null>(null);

  // Guided Tour Step Selection Handlers
  const handleSelectTool = (tool: ToolMode) => {
    setActiveTool(tool);
    if (isGuidedTourOpen && guidedTourStep === 1 && tool === 'brush') {
      sound.playSelect();
      setGuidedTourStep(2);
    }
  };

  const handleSelectTile = (tile: TileId) => {
    setSelectedTile(tile);
    if (isGuidedTourOpen && guidedTourStep === 2 && (tile === 'grass_dirt' || tile === 'ice_block' || tile === 'stone')) {
      sound.playPlaceTile();
      setGuidedTourStep(3);
      setTourBlocksPlaced(0);
    } else if (isGuidedTourOpen && guidedTourStep === 4 && tile === 'coin') {
      sound.playCoin();
      setGuidedTourStep(5);
    }
  };

  const handleStartTour = () => {
    setGuidedTourStep(1);
  };

  const handleCompleteTour = () => {
    TutorialManager.setGuidedTourCompleted(true);
    setIsGuidedTourOpen(false);
    setScreenMode('playing');
  };

  const handleSkipTour = () => {
    TutorialManager.setGuidedTourCompleted(true);
    setIsGuidedTourOpen(false);
  };

  const handleRestartTour = () => {
    setGuidedTourStep(0);
    setTourBlocksPlaced(0);
    setIsGuidedTourOpen(true);
  };

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
    if (isGuidedTourOpen && guidedTourStep === 3) {
      const prevCount = levelData.items.length;
      const newCount = newItems.length;
      if (newCount > prevCount) {
        const added = newCount - prevCount;
        setTourBlocksPlaced((cur) => {
          const next = cur + added;
          if (next >= 3) {
            sound.playMissionComplete();
            setTimeout(() => {
              setGuidedTourStep(4);
            }, 550);
          }
          return next;
        });
      }
    }

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

  // Stage 2: Global Editor Keyboard Shortcuts (B, R, E, Ctrl+S, Enter/P, Ctrl+Z/Y)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (screenMode !== 'editor') return;

      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');

      // Ctrl+S / Cmd+S: Save Game (prevent default browser save page)
      if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyS' || e.key === 's' || e.key === 'ы')) {
        e.preventDefault();
        setIsSaveModalOpen(true);
        return;
      }

      // Undo / Redo
      if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyZ' || e.key === 'z' || e.key === 'я')) {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
        return;
      } else if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyY' || e.key === 'y' || e.key === 'н')) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Do not trigger single-key tool hotkeys while typing in input fields or modals
      if (isInput || isSaveModalOpen || isLoadModalOpen || isTutorialOpen) return;

      // B -> Freehand Brush
      if (e.code === 'KeyB' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        handleSelectTool('brush');
      }
      // R -> Rectangle / Area
      else if (e.code === 'KeyR' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setActiveTool('line');
        sound.playSelect();
      }
      // E -> Eraser
      else if (e.code === 'KeyE' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setActiveTool('erase');
        sound.playErase();
      }
      // Enter or P -> Playtest
      else if ((e.code === 'Enter' || e.code === 'KeyP') && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        sound.playCoin();
        handleStartPlay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screenMode, historyIndex, history, isSaveModalOpen, isLoadModalOpen, isTutorialOpen]);

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
    if (isGuidedTourOpen && guidedTourStep === 5) {
      sound.playVictory();
      setGuidedTourStep(6);
      return;
    }
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
      {screenMode === 'editor' && (() => {
        const isCoinInDom = typeof document !== 'undefined' && !!document.getElementById('tour-tile-coin');

        const getTourStepConfig = () => {
          switch (guidedTourStep) {
            case 0:
              return {
                targetId: undefined,
                title: 'Привет, Геймдизайнер!',
                message:
                  'Давай создадим твою первую игру! Я покажу тебе шаг за шагом, как строить уровни и оживлять миры.',
                handAction: 'none' as const,
                wrongClickMsg: undefined,
              };
            case 1:
              return {
                targetId: 'tour-tool-brush',
                title: 'Инструмент Кисть',
                message: 'Это твоя кисть. Нажми на неё, чтобы рисовать блоки!',
                handAction: 'click' as const,
                wrongClickMsg: 'Нажми на значок кисти!',
              };
            case 2:
              return {
                targetId: 'tour-tile-grass_dirt',
                title: 'Выбор блока',
                message: 'Выбери блок травы с землёй! Это основа для дорог твоего мира.',
                handAction: 'click' as const,
                wrongClickMsg: 'Выбери блок травы в палитре!',
              };
            case 3:
              return {
                targetId: 'tour-canvas-zone',
                title: 'Построй дорогу',
                message: 'Нарисуй дорогу! Зажми левую кнопку мыши и протяни линию из 3 блоков на игровом поле!',
                handAction: 'drag-horizontal' as const,
                wrongClickMsg: 'Ставь блоки на игровом поле!',
              };
            case 4:
              return {
                targetId: isCoinInDom ? 'tour-tile-coin' : 'tour-tab-interactive',
                title: isCoinInDom ? 'Золотая награда' : 'Интерактив',
                message: isCoinInDom
                  ? 'Отлично! Теперь выбери золотую монетку, чтобы порадовать героя!'
                  : 'Открой вкладку «Интерактив», чтобы найти монеты и бонусы!',
                handAction: 'click' as const,
                wrongClickMsg: isCoinInDom ? 'Нажми на монетку!' : 'Нажми на вкладку «Интерактив»!',
              };
            case 5:
              return {
                targetId: 'tour-play-button',
                title: 'Проверка уровня',
                message: 'Ты молодец! Теперь нажми на зелёную кнопку «ТЕСТ», чтобы сыграть на своём уровне!',
                handAction: 'click' as const,
                wrongClickMsg: 'Нажми зелёную кнопку «ТЕСТ»!',
              };
            case 6:
            default:
              return {
                targetId: undefined,
                title: 'Тур Завершён!',
                message:
                  'Поздравляю! Ты сделал свой первый шаг в создании игр! Теперь у тебя есть все необходимые инструменты — твори свободно!',
                handAction: 'none' as const,
                wrongClickMsg: undefined,
              };
          }
        };

        const currentTour = getTourStepConfig();

        return (
          <>
            <div className="w-full h-full flex flex-col md:flex-row overflow-hidden relative">
              {/* Left Main Level Canvas & Minimap */}
              <LevelEditor
                levelData={levelData}
                activeTool={activeTool}
                selectedTile={selectedTile}
                selectedTheme={selectedTheme}
                onUpdateItems={handleUpdateItems}
                onOpenTutorial={handleRestartTour}
                onSelectTile={handleSelectTile}
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
                onSelectTool={handleSelectTool}
                onSelectTile={handleSelectTile}
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
                onOpenTutorial={handleRestartTour}
                onExitToMenu={handleExitToMenu}
                isGuidedTourOpen={isGuidedTourOpen}
              />
            </div>

            {/* Interactive Guided Tour Spotlight Overlay */}
            <TutorialOverlay
              isOpen={isGuidedTourOpen}
              step={guidedTourStep}
              targetElementId={currentTour.targetId}
              title={currentTour.title}
              message={currentTour.message}
              handAction={currentTour.handAction}
              onSkip={handleSkipTour}
              onStartTour={handleStartTour}
              onCompleteTour={handleCompleteTour}
              placedCount={tourBlocksPlaced}
              targetPlacedCount={3}
              wrongClickMessage={currentTour.wrongClickMsg}
            />
          </>
        );
      })()}

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
