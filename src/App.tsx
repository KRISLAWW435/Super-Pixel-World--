/**
 * SUPER PIXEL WORLD — яркий 2D-платформер с конструктором уровней
 * Main App Component orchestrating Level Editor, Game Player, and Builder Toolbox.
 */

import React, { useEffect, useRef, useState } from 'react';
import { sound } from './audio/soundEngine';
import { BuilderSidebar } from './components/BuilderSidebar';
import { GamePlayer } from './components/GamePlayer';
import { LevelEditor } from './components/LevelEditor';
import { LoadPresetModal } from './components/LoadPresetModal';
import { TutorialModal } from './components/TutorialModal';
import { createDefaultLevel } from './game/presetLevels';
import { HeroId, LevelData, LevelItem, ThemeId, TileId, ToolMode } from './types/game';

const LOCAL_STORAGE_KEY = 'super_pixel_world_level_v1';

export default function App() {
  // Mode: 'editor' or 'playing'
  const [gameMode, setGameMode] = useState<'editor' | 'playing'>('editor');

  // Level Data
  const [levelData, setLevelData] = useState<LevelData>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback to default
    }
    return createDefaultLevel();
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
  const [isLoadModalOpen, setIsLoadModalOpen] = useState<boolean>(false);

  // Fullscreen Container Ref
  const appContainerRef = useRef<HTMLDivElement | null>(null);

  // Autosave to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(levelData));
    } catch {
      // ignore
    }
  }, [levelData]);

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

  // Keyboard Shortcuts (Ctrl+Z, Ctrl+Y)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameMode !== 'editor') return;

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
    setGameMode('playing');
  };

  // Switch to Editor Mode
  const handleExitToEditor = () => {
    setGameMode('editor');
  };

  return (
    <div
      ref={appContainerRef}
      className="w-screen h-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col font-sans select-none"
    >
      {gameMode === 'playing' ? (
        /* Fullscreen Game Play Mode */
        <GamePlayer
          levelData={levelData}
          heroId={selectedHero}
          themeId={selectedTheme}
          isFullscreen={isFullscreen}
          isMuted={isMuted}
          onExitToEditor={handleExitToEditor}
          onToggleFullscreen={handleToggleFullscreen}
          onToggleMute={handleToggleMute}
        />
      ) : (
        /* Level Editor Mode: 78-82% Left Canvas, 18-22% Right Toolbox */
        <div className="w-full h-full flex flex-col md:flex-row overflow-hidden">
          {/* Left Main Level Canvas & Minimap */}
          <LevelEditor
            levelData={levelData}
            activeTool={activeTool}
            selectedTile={selectedTile}
            selectedTheme={selectedTheme}
            onUpdateItems={handleUpdateItems}
            onOpenTutorial={() => setIsTutorialOpen(true)}
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
            onSave={() => setIsLoadModalOpen(true)}
            onLoad={() => setIsLoadModalOpen(true)}
            onToggleFullscreen={handleToggleFullscreen}
            onToggleMute={handleToggleMute}
            onOpenTutorial={() => setIsTutorialOpen(true)}
          />
        </div>
      )}

      {/* Interactive Step-by-Step Tutorial Modal */}
      <TutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
      />

      {/* Preset Levels & Save/Load Modal */}
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
