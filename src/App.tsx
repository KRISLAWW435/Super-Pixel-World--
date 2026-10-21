/**
 * SUPER PIXEL WORLD — яркий 2D-платформер с конструктором уровней
 * Main App Component orchestrating Profile Creation, Main Menu, My Games, Level Editor, and Game Player.
 */

import React, { useEffect, useRef, useState } from 'react';
import { sound } from './audio/soundEngine';
import { BuilderSidebar, StudioSidebarTab } from './components/BuilderSidebar';
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
  // Player / Creator Profile (Multi-profile active profile)
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    return ProfileManager.getActiveProfile();
  });

  // Screen Mode: 'profile_create' | 'main_menu' | 'my_games' | 'editor' | 'playing'
  // On first launch or if no active profile exists, force profile creation
  const [screenMode, setScreenMode] = useState<AppScreenMode>(() => {
    return ProfileManager.getActiveProfile() ? 'main_menu' : 'profile_create';
  });

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

  // Interactive Onboarding Guided Tour State (Checks the active profile's completion status)
  const [isGuidedTourOpen, setIsGuidedTourOpen] = useState<boolean>(() => {
    const active = ProfileManager.getActiveProfile();
    return active ? !active.tutorialCompleted : true;
  });
  const [guidedTourStep, setGuidedTourStep] = useState<number>(1);
  const [tourBlocksPlaced, setTourBlocksPlaced] = useState<number>(0);
  const [tourVictory, setTourVictory] = useState<boolean>(false);

  // Builder Sidebar Tab State (synchronized with TutorialManager & event bus)
  const [sidebarTab, setSidebarTab] = useState<StudioSidebarTab>('platforms');
  const [tourStepSuccess, setTourStepSuccess] = useState<boolean>(false);
  const [tourSuccessMsg, setTourSuccessMsg] = useState<string>('');

  // Multi-phase tour step selection flags (tile selection in palette -> canvas placement)
  const [tourCoinSelected, setTourCoinSelected] = useState<boolean>(false);
  const [tourEnemySelected, setTourEnemySelected] = useState<boolean>(false);
  const [tourSpikesSelected, setTourSpikesSelected] = useState<boolean>(false);

  // App UI State
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);
  const [tutorialStep, setTutorialStep] = useState<number>(0);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState<boolean>(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState<boolean>(false);
  const [editorToast, setEditorToast] = useState<string | null>(null);
  const editorToastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showEditorToast = (msg: string) => {
    if (editorToastTimerRef.current) clearTimeout(editorToastTimerRef.current);
    setEditorToast(msg);
    editorToastTimerRef.current = setTimeout(() => {
      setEditorToast(null);
    }, 3500);
  };

  // Fullscreen Container Ref
  const appContainerRef = useRef<HTMLDivElement | null>(null);

  // Listen to tab changed events via TutorialManager (Event Bus)
  useEffect(() => {
    const unsubscribe = TutorialManager.onTabChanged((tab) => {
      setSidebarTab(tab as StudioSidebarTab);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Listen to tile selected events via TutorialManager (Event Bus)
  useEffect(() => {
    const unsubscribe = TutorialManager.onTileSelected((tile) => {
      handleSelectTile(tile as TileId);
    });
    return () => {
      unsubscribe();
    };
  }, [isGuidedTourOpen, guidedTourStep]);

  // Listen to Phase 2 gameplay actions (move, jump, victory) from GamePlayer
  useEffect(() => {
    if (!isGuidedTourOpen) return;

    const unsubscribe = TutorialManager.onGameplayAction((action) => {
      console.log('[Tutorial] Gameplay action received:', action, 'at step:', guidedTourStep);
      if (guidedTourStep === 10 && action === 'move') {
        sound.playSelect();
        setTourStepSuccess(true);
        setTourSuccessMsg('Отлично! Герой движется!');
        setTimeout(() => {
          setTourStepSuccess(false);
          setGuidedTourStep(11);
        }, 350);
      } else if (guidedTourStep === 11 && action === 'jump') {
        sound.playJump();
        setTourStepSuccess(true);
        setTourSuccessMsg('Великолепный прыжок!');
        setTimeout(() => {
          setTourStepSuccess(false);
          setGuidedTourStep(12);
        }, 350);
      } else if (guidedTourStep >= 10 && action === 'victory') {
        sound.playVictory();
        setTourVictory(true);
        setGuidedTourStep(12);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isGuidedTourOpen, guidedTourStep]);

  // Handle direct sidebar tab change
  const handleSidebarTabChange = (tab: StudioSidebarTab) => {
    setSidebarTab(tab);
  };

  // Guided Tour Step Selection Handlers (Step 2 Tool, Step 3 Tile)
  const handleSelectTool = (tool: ToolMode) => {
    setActiveTool(tool);
    if (isGuidedTourOpen && guidedTourStep === 2 && tool === 'brush') {
      sound.playSelect();
      TutorialManager.logStep(2, 'Brush tool selected');
      setTourStepSuccess(true);
      setTourSuccessMsg('Отлично! Кисть выбрана.');
      setTimeout(() => {
        setTourStepSuccess(false);
        setSidebarTab('platforms');
        setGuidedTourStep(3);
      }, 300);
    }
  };

  const handleSelectTile = (tile: TileId) => {
    setSelectedTile(tile);

    if (!isGuidedTourOpen) return;

    // Step 3: Grass dirt selected
    if (guidedTourStep === 3 && (tile === 'grass_dirt' || tile === 'ice_block' || tile === 'stone')) {
      sound.playPlaceTile();
      TutorialManager.logStep(3, 'Tile grass_dirt selected');
      setTourStepSuccess(true);
      setTourSuccessMsg('Блок выбран! Теперь построй дорогу.');
      setTimeout(() => {
        setTourStepSuccess(false);
        setGuidedTourStep(4);
        setTourBlocksPlaced(0);
      }, 300);
      return;
    }

    // Step 6: Coin selected from palette
    if (guidedTourStep === 6 && tile === 'coin') {
      sound.playCoin();
      TutorialManager.logStep(6, 'Tile coin selected from palette');
      setTourStepSuccess(true);
      setTourSuccessMsg('Монета выбрана! Теперь поставь её на поле.');
      setTourCoinSelected(true);
      setTimeout(() => {
        setTourStepSuccess(false);
      }, 450);
      return;
    }

    // Step 7: Enemy selected from palette
    if (guidedTourStep === 7 && (tile === 'enemy_chaser' || tile.startsWith('enemy_'))) {
      sound.playBump();
      TutorialManager.logStep(7, 'Enemy selected from palette');
      setTourStepSuccess(true);
      setTourSuccessMsg('Зверь-охотник выбран! Поставь его на платформу.');
      setTourEnemySelected(true);
      setTimeout(() => {
        setTourStepSuccess(false);
      }, 450);
      return;
    }

    // Step 8: Spikes selected from palette
    if (guidedTourStep === 8 && tile === 'spikes') {
      sound.playPlaceTile();
      TutorialManager.logStep(8, 'Spikes selected from palette');
      setTourStepSuccess(true);
      setTourSuccessMsg('Шипы выбраны! Размести их на пути героя.');
      setTourSpikesSelected(true);
      setTimeout(() => {
        setTourStepSuccess(false);
      }, 450);
      return;
    }
  };

  // Step 5: Mouse Wheel / Camera Navigation Action
  const handleWheelAction = () => {
    if (isGuidedTourOpen && guidedTourStep === 5) {
      sound.playSelect();
      TutorialManager.logStep(5, 'Camera navigated');
      setTourStepSuccess(true);
      setTourSuccessMsg('Отлично! Камера перемещается.');
      setTimeout(() => {
        setTourStepSuccess(false);
        setSidebarTab('interactive');
        setSelectedTile('coin');
        setTourCoinSelected(false);
        setGuidedTourStep(6);
      }, 400);
    }
  };

  const handleSkipStep = () => {
    sound.playClick();
    console.log('[Tutorial] Step skipped by user from:', guidedTourStep);
    if (guidedTourStep === 1) {
      setGuidedTourStep(2);
    } else if (guidedTourStep === 2) {
      setActiveTool('brush');
      setSidebarTab('platforms');
      setGuidedTourStep(3);
    } else if (guidedTourStep === 3) {
      setSelectedTile('grass_dirt');
      setGuidedTourStep(4);
    } else if (guidedTourStep === 4) {
      setGuidedTourStep(5);
    } else if (guidedTourStep === 5) {
      setSidebarTab('interactive');
      setSelectedTile('coin');
      setTourCoinSelected(false);
      setGuidedTourStep(6);
    } else if (guidedTourStep === 6) {
      setSidebarTab('enemies');
      setSelectedTile('enemy_chaser');
      setTourCoinSelected(false);
      setTourEnemySelected(false);
      setGuidedTourStep(7);
    } else if (guidedTourStep === 7) {
      setSidebarTab('interactive');
      setSelectedTile('spikes');
      setTourEnemySelected(false);
      setTourSpikesSelected(false);
      setGuidedTourStep(8);
    } else if (guidedTourStep === 8) {
      setTourSpikesSelected(false);
      setGuidedTourStep(9);
    } else if (guidedTourStep === 9) {
      setGuidedTourStep(10);
      setScreenMode('playing');
    } else if (guidedTourStep === 10) {
      setGuidedTourStep(11);
    } else if (guidedTourStep === 11) {
      setGuidedTourStep(12);
    } else if (guidedTourStep >= 12) {
      handleCompleteTour();
    } else {
      setGuidedTourStep((s) => s + 1);
    }
  };

  const handleStartTour = () => {
    setGuidedTourStep(2);
    TutorialManager.logStep(2, 'Tour started - step 2');
  };

  const handleCompleteTour = () => {
    TutorialManager.setGuidedTourCompleted(true);
    if (profile) {
      ProfileManager.setTutorialCompleted(profile.id, true);
      setProfile((prev) => (prev ? { ...prev, tutorialCompleted: true } : prev));
    }
    setIsGuidedTourOpen(false);
    setTourVictory(false);
    setScreenMode('editor');
    sound.playVictory();
  };

  const handleSkipTour = () => {
    TutorialManager.setGuidedTourCompleted(true);
    if (profile) {
      ProfileManager.setTutorialCompleted(profile.id, true);
      setProfile((prev) => (prev ? { ...prev, tutorialCompleted: true } : prev));
    }
    setIsGuidedTourOpen(false);
    setTourVictory(false);
  };

  const handleRestartTour = () => {
    setGuidedTourStep(1);
    setTourBlocksPlaced(0);
    setTourVictory(false);
    setTourCoinSelected(false);
    setTourEnemySelected(false);
    setTourSpikesSelected(false);
    setIsGuidedTourOpen(true);
    setScreenMode('editor');
  };

  // Initialize sound, theme, and desktop responsive UI scale on launch
  useEffect(() => {
    const settings = SettingsManager.getSettings();
    sound.applySettings(settings);
    setIsMuted(sound.getMuted());

    // Apply Theme mode to document.body
    if (settings.themeMode === 'light') {
      document.body.classList.add('theme-light');
    } else {
      document.body.classList.remove('theme-light');
    }

    // Apply Responsive Desktop UI Scaling
    const updateScaling = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const currentSettings = SettingsManager.getSettings();
      const userScale = currentSettings.uiScale ?? 1.0;
      let autoFactor = 1.0;
      if (w >= 3400) {
        autoFactor = 1.3; // 4K Display
      } else if (w >= 2400) {
        autoFactor = 1.15; // QHD / 2K
      } else if (w <= 1280 || h <= 720) {
        autoFactor = 0.9; // Compact laptop
      }
      const finalScale = Number((autoFactor * userScale).toFixed(2));
      document.documentElement.style.setProperty('--ui-scale', String(finalScale));
    };

    updateScaling();
    window.addEventListener('resize', updateScaling);
    return () => window.removeEventListener('resize', updateScaling);
  }, []);

  // Sync theme/hero to levelData
  useEffect(() => {
    setLevelData((prev) => ({
      ...prev,
      bgTheme: selectedTheme,
      heroId: selectedHero,
    }));
  }, [selectedTheme, selectedHero]);

  // Handle Items Update with History and Tour Step validations (Steps 4, 6, 7, 8)
  const handleUpdateItems = (newItems: LevelItem[], recordHistory: boolean = true) => {
    if (isGuidedTourOpen) {
      if (guidedTourStep === 4) {
        // Step 4: Build road (wait for 3 blocks placed)
        const prevCount = levelData.items.length;
        const newCount = newItems.length;
        const added = newCount > prevCount ? newCount - prevCount : 1;
        setTourBlocksPlaced((cur) => {
          const next = Math.min(3, cur + added);
          if (next >= 3) {
            sound.playMissionComplete();
            TutorialManager.logStep(4, 'Road built - 3 blocks placed');
            setTourStepSuccess(true);
            setTourSuccessMsg('Отлично! Дорога построена!');
            setTimeout(() => {
              setTourStepSuccess(false);
              setGuidedTourStep(5);
            }, 500);
          }
          return next;
        });
      } else if (guidedTourStep === 6) {
        // Step 6: Golden coin placed
        const hadCoin = levelData.items.some((it) => it.tileId === 'coin');
        const hasCoin = newItems.some((it) => it.tileId === 'coin');
        if (hasCoin && (!hadCoin || newItems.length > levelData.items.length)) {
          sound.playCoin();
          TutorialManager.logStep(6, 'Coin placed on canvas');
          setTourStepSuccess(true);
          setTourSuccessMsg('Золотая монета размещена!');
          setTimeout(() => {
            setTourStepSuccess(false);
            setTourCoinSelected(false);
            setSidebarTab('enemies');
            setSelectedTile('enemy_chaser');
            setGuidedTourStep(7);
          }, 450);
        }
      } else if (guidedTourStep === 7) {
        // Step 7: Beast hunter enemy placed
        const hadEnemy = levelData.items.some((it) => it.tileId === 'enemy_chaser' || it.tileId.startsWith('enemy_'));
        const hasEnemy = newItems.some((it) => it.tileId === 'enemy_chaser' || it.tileId.startsWith('enemy_'));
        if (hasEnemy && (!hadEnemy || newItems.length > levelData.items.length)) {
          sound.playBump();
          TutorialManager.logStep(7, 'Enemy placed on canvas');
          setTourStepSuccess(true);
          setTourSuccessMsg('Зверь-охотник на страже!');
          setTimeout(() => {
            setTourStepSuccess(false);
            setTourEnemySelected(false);
            setSidebarTab('interactive');
            setSelectedTile('spikes');
            setGuidedTourStep(8);
          }, 450);
        }
      } else if (guidedTourStep === 8) {
        // Step 8: Hazard spikes placed
        const hadSpikes = levelData.items.some((it) => it.tileId === 'spikes');
        const hasSpikes = newItems.some((it) => it.tileId === 'spikes');
        if (hasSpikes && (!hadSpikes || newItems.length > levelData.items.length)) {
          sound.playPlaceTile();
          TutorialManager.logStep(8, 'Spikes placed on canvas');
          setTourStepSuccess(true);
          setTourSuccessMsg('Опасные шипы установлены!');
          setTimeout(() => {
            setTourStepSuccess(false);
            setTourSpikesSelected(false);
            setGuidedTourStep(9);
          }, 450);
        }
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
      // V or H -> Move (Hand) Tool
      else if (
        (e.code === 'KeyV' || e.code === 'KeyH' || e.key === 'v' || e.key === 'h' || e.key === 'м' || e.key === 'р') &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey
      ) {
        e.preventDefault();
        setActiveTool('move');
        sound.playSelect();
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

  // Sync isMuted state with sound engine
  useEffect(() => {
    const unsub = sound.onSettingsChange((s) => {
      setIsMuted(s.isMuted);
    });
    return () => unsub();
  }, []);

  // Global BGM Switcher: 'Save State' for Menu & Editor, 'Pixel Bounce' for GamePlayer
  useEffect(() => {
    if (screenMode === 'playing') {
      sound.playBgm('gameplay');
    } else {
      sound.playBgm('menu_editor');
    }
  }, [screenMode]);

  // Mute Toggle
  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  // Switch to Play Mode
  const handleStartPlay = () => {
    if (isGuidedTourOpen && guidedTourStep === 9) {
      sound.playCoin();
      TutorialManager.logStep(9, 'Play button clicked - starting phase 2 gameplay');
      setTourStepSuccess(false);
      setGuidedTourStep(10);
      setScreenMode('playing');
      return;
    }
    setScreenMode('playing');
  };

  // Switch to Editor Mode
  const handleExitToEditor = () => {
    setScreenMode('editor');
  };

  // Update LevelData fields (goals, timer, theme, hero, etc.)
  const handleUpdateLevelData = (updated: Partial<LevelData>) => {
    setLevelData((prev) => ({
      ...prev,
      ...updated,
    }));
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
      {/* 1. SCREEN: Profile Creation (First launch or adding a new profile) */}
      {screenMode === 'profile_create' && (
        <ProfileCreationScreen
          onProfileCreated={(newProfile) => {
            setProfile(newProfile);
            // If tutorial is not completed for this profile, automatically launch Level Editor & Guided Tour
            if (!newProfile.tutorialCompleted) {
              const def = createDefaultLevel();
              def.items = def.items.filter(
                (it: LevelItem) =>
                  !it.tileId.startsWith('enemy_') &&
                  (it.tileId as string) !== 'enemy_walker' &&
                  it.tileId !== 'coin' &&
                  it.tileId !== 'star' &&
                  it.tileId !== 'crystal'
              );
              setLevelData(def);
              setHistory([def.items]);
              setHistoryIndex(0);
              setGuidedTourStep(1);
              setTourBlocksPlaced(0);
              setTourVictory(false);
              setTourCoinSelected(false);
              setTourEnemySelected(false);
              setTourSpikesSelected(false);
              setIsGuidedTourOpen(true);
              setScreenMode('editor');
            } else {
              setScreenMode('main_menu');
            }
          }}
          onCancel={profile ? () => setScreenMode('main_menu') : undefined}
        />
      )}

      {/* 2. SCREEN: Main Menu (3 Buttons: Continue, Switch Profile, Settings) */}
      {screenMode === 'main_menu' && profile && (
        <MainMenuScreen
          profile={profile}
          onOpenPlayGames={() => setScreenMode('my_games')}
          onOpenCreateEditor={() => setScreenMode('editor')}
          onOpenCreateEditorWithTutorial={() => {
            const def = createDefaultLevel();
            def.items = def.items.filter(
              (it: LevelItem) =>
                !it.tileId.startsWith('enemy_') &&
                (it.tileId as string) !== 'enemy_walker' &&
                it.tileId !== 'coin' &&
                it.tileId !== 'star' &&
                it.tileId !== 'crystal'
            );
            setLevelData(def);
            setHistory([def.items]);
            setHistoryIndex(0);
            setGuidedTourStep(1);
            setTourBlocksPlaced(0);
            setTourVictory(false);
            setTourCoinSelected(false);
            setTourEnemySelected(false);
            setTourSpikesSelected(false);
            setIsGuidedTourOpen(true);
            setScreenMode('editor');
          }}
          onOpenPresets={() => setIsLoadModalOpen(true)}
          onProfileUpdated={(updated) => {
            setProfile(updated);
            setIsGuidedTourOpen(!updated.tutorialCompleted);
          }}
          onOpenCreateProfile={() => setScreenMode('profile_create')}
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
          isGuidedTour={isGuidedTourOpen}
        />
      )}

      {/* 5. SCREEN: Level Editor Mode */}
      {screenMode === 'editor' && (
        <LevelEditor
          levelData={levelData}
          activeTool={activeTool}
          selectedTile={selectedTile}
          selectedTheme={selectedTheme}
          onUpdateItems={handleUpdateItems}
          onUpdateLevelData={handleUpdateLevelData}
          onOpenTutorial={handleRestartTour}
          onSelectTile={handleSelectTile}
          onStartPlay={handleStartPlay}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onExitToMenu={handleExitToMenu}
          onCameraAction={handleWheelAction}
          isGuidedTourOpen={isGuidedTourOpen}
          guidedTourStep={guidedTourStep}
          tourBlocksPlaced={tourBlocksPlaced}
          isGoalModalOpen={isGoalModalOpen}
          onToggleGoalModal={setIsGoalModalOpen}
          sidebar={
            <BuilderSidebar
              activeTab={sidebarTab}
              onTabChange={handleSidebarTabChange}
              activeTool={activeTool}
              selectedTile={selectedTile}
              selectedTheme={selectedTheme}
              selectedHero={selectedHero}
              customHeroData={levelData.customHeroData}
              onUpdateCustomHero={(dataUrl) => handleUpdateLevelData({ customHeroData: dataUrl })}
              onShowToast={showEditorToast}
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
              onOpenGoalSettings={() => setIsGoalModalOpen(true)}
              currentGoal={levelData.goalType}
            />
          }
        />
      )}

      {/* Interactive Guided Tour Spotlight Overlay (Active in Editor and GamePlayer) */}
      {(() => {
        const getTourStepConfig = () => {
          switch (guidedTourStep) {
            case 0:
            case 1:
              return {
                targetId: undefined,
                title: 'Привет, Геймдизайнер!',
                message:
                  'Давай создадим твою первую игру! Я покажу тебе шаг за шагом, как строить уровни, добавлять врагов и награды, а затем победить!',
                handAction: 'none' as const,
                wrongClickMsg: undefined,
              };
            case 2:
              return {
                targetId: 'tour-tool-brush',
                title: 'Выбор кисти',
                message: 'Это твоя кисть. Нажми на неё, чтобы рисовать блоки!',
                handAction: 'click' as const,
                wrongClickMsg: 'Нажми на значок кисти в панели инструментов!',
              };
            case 3:
              return {
                targetId: 'tour-tile-grass_dirt',
                title: 'Выбор блока',
                message: 'Выбери блок травы с землёй! Это основа для дорог твоего мира.',
                handAction: 'click' as const,
                wrongClickMsg: 'Выбери блок травы в палитре блоков!',
              };
            case 4:
              return {
                targetId: undefined, // Free canvas: centered line animation, zero blackout
                title: 'Построй дорогу',
                message: 'Построй дорогу! Зажми левую кнопку мыши и протяни линию из 3 блоков на поле.',
                handAction: 'drag-horizontal' as const,
                wrongClickMsg: 'Ставь блоки на игровом поле!',
              };
            case 5:
              return {
                targetId: undefined,
                title: 'Навигация по уровню',
                message:
                  'Крути колесико мыши вверх-вниз, чтобы двигать камеру вертикально. А если зажать колесико (или нажать Пробел и потянуть) — можно двигать холст горизонтально!',
                handAction: 'wheel' as const,
                wrongClickMsg: 'Покрути колёсико мыши или зажми Пробел для панорамирования!',
              };
            case 6:
              if (!tourCoinSelected) {
                return {
                  targetId: sidebarTab === 'interactive' ? 'tour-tile-coin' : 'tour-tab-interactive',
                  title: 'Золотая награда',
                  message:
                    sidebarTab === 'interactive'
                      ? 'Нажми на золотую монету в палитре бонусов!'
                      : 'Открой вкладку «Бонусы», чтобы найти монеты!',
                  handAction: 'click' as const,
                  wrongClickMsg:
                    sidebarTab === 'interactive'
                      ? 'Нажми на золотую монету!'
                      : 'Нажми на вкладку «Бонусы»!',
                };
              }
              return {
                targetId: undefined, // Canvas is completely open!
                title: 'Золотая награда',
                message: 'Отлично! Теперь поставь золотую монету на игровое поле над платформой.',
                handAction: 'click' as const,
                wrongClickMsg: 'Поставь монету на игровое поле!',
              };
            case 7:
              if (!tourEnemySelected) {
                return {
                  targetId: sidebarTab === 'enemies' ? 'tour-tile-enemy_chaser' : 'tour-tab-enemies',
                  title: 'Враг на карте',
                  message:
                    sidebarTab === 'enemies'
                      ? 'Выбери Зверя-охотника в палитре врагов!'
                      : 'Открой вкладку «Враги», чтобы выбрать противника!',
                  handAction: 'click' as const,
                  wrongClickMsg:
                    sidebarTab === 'enemies'
                      ? 'Нажми на Зверя-охотника!'
                      : 'Нажми на вкладку «Враги»!',
                };
              }
              return {
                targetId: undefined,
                title: 'Враг на карте',
                message: 'Отлично! Теперь поставь Зверя-охотника на платформу.',
                handAction: 'click' as const,
                wrongClickMsg: 'Поставь Зверя-охотника на платформу!',
              };
            case 8:
              if (!tourSpikesSelected) {
                return {
                  targetId: sidebarTab === 'interactive' ? 'tour-tile-spikes' : 'tour-tab-interactive',
                  title: 'Опасные шипы',
                  message:
                    sidebarTab === 'interactive'
                      ? 'Выбери Опасные шипы в палитре бонусов!'
                      : 'Открой вкладку «Бонусы», чтобы найти шипы!',
                  handAction: 'click' as const,
                  wrongClickMsg:
                    sidebarTab === 'interactive'
                      ? 'Нажми на Опасные шипы!'
                      : 'Нажми на вкладку «Бонусы»!',
                };
              }
              return {
                targetId: undefined,
                title: 'Опасные шипы',
                message: 'Отлично! Теперь размести шипы на пути героя.',
                handAction: 'click' as const,
                wrongClickMsg: 'Поставь шипы на игровое поле!',
              };
            case 9:
              return {
                targetId: 'tour-play-button',
                title: 'Проверка уровня',
                message: 'Уровень готов! Нажми ТЕСТ, чтобы проверить его.',
                handAction: 'click' as const,
                wrongClickMsg: 'Нажми зелёную кнопку «ТЕСТ»!',
              };
            case 10:
              return {
                targetId: undefined,
                title: 'Бег героя',
                message: 'Используй клавиши A и D (или стрелочки) для бега!',
                handAction: 'keys-ad' as const,
                wrongClickMsg: 'Нажми клавишу A или D!',
              };
            case 11:
              return {
                targetId: undefined,
                title: 'Прыжок героя',
                message: 'Нажми ПРОБЕЛ (или W / стрелочку вверх) для прыжка!',
                handAction: 'keys-space' as const,
                wrongClickMsg: 'Нажми Пробел для прыжка!',
              };
            case 12:
            default:
              return {
                targetId: undefined,
                title: 'Финал обучения',
                message: 'Отлично! Теперь доберись до флага победы в конце пути!',
                handAction: 'none' as const,
                wrongClickMsg: undefined,
              };
          }
        };

        const currentTour = getTourStepConfig();

        return (
          <TutorialOverlay
            isOpen={isGuidedTourOpen && (screenMode === 'editor' || screenMode === 'playing')}
            step={guidedTourStep}
            totalSteps={12}
            targetElementId={currentTour.targetId}
            title={currentTour.title}
            message={currentTour.message}
            handAction={currentTour.handAction}
            onSkip={handleSkipTour}
            onStartTour={handleStartTour}
            onCompleteTour={handleCompleteTour}
            onSkipStep={handleSkipStep}
            placedCount={tourBlocksPlaced}
            targetPlacedCount={3}
            wrongClickMessage={currentTour.wrongClickMsg}
            isSuccess={tourStepSuccess}
            successMessage={tourSuccessMsg}
            onWheelAction={handleWheelAction}
            isVictory={tourVictory}
          />
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

      {/* Custom Hero / Studio Toast Notification */}
      {editorToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-slate-900 border-2 border-amber-400 text-amber-200 shadow-[4px_4px_0px_#000000] text-xs font-pixel rounded flex items-center gap-2 pointer-events-none animate-bounce">
          <span>✨</span>
          <span>{editorToast}</span>
        </div>
      )}
    </div>
  );
}
