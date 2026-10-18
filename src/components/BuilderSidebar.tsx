/**
 * Pixel Studio Pro - Tool & Palette Sidebar (BuilderSidebar)
 *
 * Stage 2 Polish:
 * - Hotkey badges (B, R, E, Ctrl+S) on tool buttons and collapsed rail
 * - Educational tooltips with shortcut cues
 * - 3 Unified accessible tabs with 44px+ touch targets
 * - Strict Pixel Studio Pro color tokens (#0B0F19 background, #131B2E surface, #F59E0B amber, #10B981 emerald)
 * - Collapsible sidebar rail
 */

import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eraser,
  Hand,
  HelpCircle,
  Layers,
  Maximize2,
  Minimize2,
  Move,
  Palette,
  PenTool,
  Play,
  Sparkles,
  Swords,
  Trash2,
  Upload,
  User,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { sound } from '../audio/soundEngine';
import { HEROES, PALETTE_ITEMS, THEMES } from '../game/constants';
import { TutorialManager } from '../services/TutorialManager';
import { HeroId, ThemeId, TileId, ToolMode } from '../types/game';
import { PaletteTilePreview } from './PaletteTilePreview';

export type StudioSidebarTab = 'platforms' | 'interactive' | 'enemies' | 'world';

interface BuilderSidebarProps {
  activeTab?: StudioSidebarTab;
  onTabChange?: (tab: StudioSidebarTab) => void;
  activeTool: ToolMode;
  selectedTile: TileId;
  selectedTheme: ThemeId;
  selectedHero: HeroId;
  canUndo: boolean;
  canRedo: boolean;
  isFullscreen: boolean;
  isMuted: boolean;
  onSelectTool: (tool: ToolMode) => void;
  onSelectTile: (tile: TileId) => void;
  onSelectTheme: (theme: ThemeId) => void;
  onSelectHero: (hero: HeroId) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onPlay: () => void;
  onSave: () => void;
  onLoad: () => void;
  onToggleFullscreen: () => void;
  onToggleMute: () => void;
  onOpenTutorial: () => void;
  onExitToMenu?: () => void;
  isGuidedTourOpen?: boolean;
}

export const BuilderSidebar: React.FC<BuilderSidebarProps> = ({
  activeTab: activeTabProp,
  onTabChange,
  activeTool,
  selectedTile,
  selectedTheme,
  selectedHero,
  canUndo,
  canRedo,
  isFullscreen,
  isMuted,
  onSelectTool,
  onSelectTile,
  onSelectTheme,
  onSelectHero,
  onUndo,
  onRedo,
  onClear,
  onPlay,
  onSave,
  onLoad,
  onToggleFullscreen,
  onToggleMute,
  onOpenTutorial,
  onExitToMenu,
  isGuidedTourOpen,
}) => {
  const [internalTab, setInternalTab] = useState<StudioSidebarTab>('platforms');
  const activeTab = activeTabProp !== undefined ? activeTabProp : internalTab;

  const handleSelectTab = (tab: StudioSidebarTab) => {
    setInternalTab(tab);
    onTabChange?.(tab);
    TutorialManager.emitTabChanged(tab);
  };

  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Keep sidebar uncollapsed whenever guided tour is active so child can see tools
  useEffect(() => {
    if (isGuidedTourOpen && isCollapsed) {
      setIsCollapsed(false);
    }
  }, [isGuidedTourOpen, isCollapsed]);

  // Guarantee 100% unique items (eliminates duplicate ice blocks)
  const platformItems = Array.from(
    new Map(
      PALETTE_ITEMS.filter((i) => i.category === 'platforms').map((item) => [item.id, item])
    ).values()
  ).filter((item, idx, arr) => arr.findIndex((t) => t.name.trim() === item.name.trim()) === idx);

  const interactiveItems = PALETTE_ITEMS.filter((i) => i.category === 'objects');
  const enemyItems = PALETTE_ITEMS.filter((i) => i.category === 'enemies');

  // If collapsed, render slim vertical tool rail with shortcut badges
  if (isCollapsed) {
    return (
      <aside className="w-14 h-full bg-[var(--panel-bg)] border-l-2 border-black flex flex-col justify-between items-center py-2.5 shrink-0 select-none z-20">
        <button
          onClick={() => setIsCollapsed(false)}
          title="Развернуть панель инструментов"
          className="w-10 h-10 rounded-xl bg-[var(--card-bg)] hover:bg-[var(--slot-bg)] text-amber-500 flex items-center justify-center transition-colors cursor-pointer border-2 border-black shadow-[2px_2px_0px_#000]"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Collapsed Tool Buttons with Hotkey Badges */}
        <div className="flex flex-col gap-2.5 w-full items-center">
          {/* Brush */}
          <button
            id="tour-tool-brush"
            onClick={() => {
              onSelectTool('brush');
              sound.playSelect();
            }}
            title="Свободная кисть (B)"
            className={`w-10 h-10 rounded-xl relative flex items-center justify-center cursor-pointer transition-all border-2 border-black ${
              activeTool === 'brush'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-[2px_2px_0px_#000]'
                : 'bg-[var(--card-bg)] text-[var(--text-main)] hover:bg-[var(--slot-bg)]'
            }`}
          >
            <PenTool className="w-4 h-4" />
            <kbd className="absolute -bottom-1 -right-1 px-1 py-0.2 bg-black border border-slate-700 rounded text-[9px] font-mono text-amber-400">
              B
            </kbd>
          </button>

          {/* Move / Hand */}
          <button
            onClick={() => {
              onSelectTool('move');
              sound.playSelect();
            }}
            title="Перемещение объектов (V или H) — перетаскивание блоков и врагов"
            className={`w-10 h-10 rounded-xl relative flex items-center justify-center cursor-pointer transition-all border-2 border-black ${
              activeTool === 'move'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-[2px_2px_0px_#000]'
                : 'bg-[var(--card-bg)] text-[var(--text-main)] hover:bg-[var(--slot-bg)]'
            }`}
          >
            <Hand className="w-4 h-4" />
            <kbd className="absolute -bottom-1 -right-1 px-1 py-0.2 bg-black border border-slate-700 rounded text-[9px] font-mono text-amber-400">
              V
            </kbd>
          </button>

          {/* Area / Rect */}
          <button
            onClick={() => {
              onSelectTool('line');
              sound.playSelect();
            }}
            title="Область / Прямоугольник (R)"
            className={`w-10 h-10 rounded-xl relative flex items-center justify-center cursor-pointer transition-all border-2 border-black ${
              activeTool === 'line'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-[2px_2px_0px_#000]'
                : 'bg-[var(--card-bg)] text-[var(--text-main)] hover:bg-[var(--slot-bg)]'
            }`}
          >
            <Move className="w-4 h-4" />
            <kbd className="absolute -bottom-1 -right-1 px-1 py-0.2 bg-black border border-slate-700 rounded text-[9px] font-mono text-amber-400">
              R
            </kbd>
          </button>

          {/* Eraser */}
          <button
            onClick={() => {
              onSelectTool('erase');
              sound.playErase();
            }}
            title="Ластик (E)"
            className={`w-10 h-10 rounded-xl relative flex items-center justify-center cursor-pointer transition-all border-2 border-black ${
              activeTool === 'erase'
                ? 'bg-rose-500 text-white font-bold shadow-[2px_2px_0px_#000]'
                : 'bg-[var(--card-bg)] text-rose-500 hover:bg-[var(--slot-bg)]'
            }`}
          >
            <Eraser className="w-4 h-4" />
            <kbd className="absolute -bottom-1 -right-1 px-1 py-0.2 bg-black border border-slate-700 rounded text-[9px] font-mono text-rose-400">
              E
            </kbd>
          </button>
        </div>

        {/* Playtest button */}
        <button
          onClick={onPlay}
          title="Запустить тест уровня (P или Enter)"
          className="w-10 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center font-bold cursor-pointer border-2 border-black shadow-[2px_2px_0px_#000] relative"
        >
          <Play className="w-4 h-4 fill-slate-950" />
          <kbd className="absolute -bottom-1 -right-1 px-1 py-0.2 bg-black border border-emerald-400 rounded text-[9px] font-mono text-emerald-300">
            P
          </kbd>
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-72 sm:w-80 lg:w-[280px] xl:w-[320px] h-full bg-[var(--panel-bg)] border-l-2 border-black flex flex-col justify-between shrink-0 select-none shadow-2xl z-20 overflow-hidden">
      {/* 1. Header Toolbar (Title, Collapse, Utilities) */}
      <div className="px-3 py-2.5 bg-[var(--panel-header)] border-b-2 border-black flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => setIsCollapsed(true)}
            title="Свернуть панель инструментов"
            className="p-1 rounded-lg hover:bg-[var(--card-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer border border-black/20"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <h3 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider truncate">
              Мастерская блоков
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onToggleFullscreen}
            title={isFullscreen ? 'Оконный режим' : 'Во весь экран'}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--card-subtle)] transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onOpenTutorial}
            title="Инструкция геймдизайнера"
            className="p-1.5 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-[var(--card-subtle)] transition-colors cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Three Unified Studio Tabs (Platforms, Interactive, Enemies) */}
      <div className="grid grid-cols-3 bg-[#0B0F19] border-b-2 border-black p-1.5 gap-1.5 shrink-0">
        <button
          id="tour-tab-platforms"
          onClick={() => {
            handleSelectTab('platforms');
            if (activeTool === 'erase') onSelectTool('brush');
            sound.playClick();
          }}
          style={{ pointerEvents: 'auto' }}
          className={`tutorial-target py-2 px-1 text-[11px] font-bold rounded-md transition-all text-center flex flex-col items-center gap-1 cursor-pointer border-2 ${
            activeTab === 'platforms'
              ? 'bg-amber-400 text-slate-950 border-black shadow-[2px_2px_0px_#000]'
              : 'bg-[var(--card-subtle)] text-[var(--text-muted)] border-black hover:text-[var(--text-main)] hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span className="truncate font-pixel text-[9px]">Блоки</span>
        </button>

        <button
          id="tour-tab-interactive"
          onClick={() => {
            handleSelectTab('interactive');
            if (activeTool === 'erase') onSelectTool('brush');
            sound.playClick();
          }}
          style={{ pointerEvents: 'auto' }}
          className={`tutorial-target py-2 px-1 text-[11px] font-bold rounded-md transition-all text-center flex flex-col items-center gap-1 cursor-pointer border-2 ${
            activeTab === 'interactive'
              ? 'bg-amber-400 text-slate-950 border-black shadow-[2px_2px_0px_#000]'
              : 'bg-[var(--card-subtle)] text-[var(--text-muted)] border-black hover:text-[var(--text-main)] hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-yellow-400" />
          <span className="truncate font-pixel text-[9px]">Бонусы</span>
        </button>

        <button
          id="tour-tab-enemies"
          onClick={() => {
            handleSelectTab('enemies');
            if (activeTool === 'erase') onSelectTool('brush');
            sound.playClick();
          }}
          style={{ pointerEvents: 'auto' }}
          className={`tutorial-target py-2 px-1 text-[11px] font-bold rounded-md transition-all text-center flex flex-col items-center gap-1 cursor-pointer border-2 ${
            activeTab === 'enemies'
              ? 'bg-rose-500 text-white border-black shadow-[2px_2px_0px_#000]'
              : 'bg-[var(--card-subtle)] text-[var(--text-muted)] border-black hover:text-[var(--text-main)] hover:bg-slate-800'
          }`}
        >
          <Swords className="w-4 h-4 text-rose-400" />
          <span className="truncate font-pixel text-[9px]">Враги</span>
        </button>
      </div>

      {/* 3. Palette Items Content Area */}
      <div className="flex-1 p-3 overflow-y-auto space-y-3">
        {/* TAB 1: PLATFORMS */}
        {activeTab === 'platforms' && (
          <div className="space-y-2">
            <div className="text-[11px] font-semibold text-[var(--text-muted)]">
              Строительные блоки и платформы:
            </div>
            <div className="grid grid-cols-2 gap-2">
              {platformItems.map((item) => {
                const isSelected = activeTool !== 'erase' && selectedTile === item.id;
                return (
                  <button
                    key={item.id}
                    id={`tour-tile-${item.id}`}
                    onClick={() => {
                      onSelectTile(item.id);
                      TutorialManager.emitTileSelected(item.id);
                      if (activeTool === 'erase') onSelectTool('brush');
                      sound.playPlaceTile();
                    }}
                    title={item.hint}
                    className={`tutorial-target retro-slot flex items-center gap-2 p-2 text-left cursor-pointer select-none transition-all ${
                      isSelected ? 'selected' : ''
                    }`}
                  >
                    <div className="shrink-0 w-8.5 h-8.5 rounded bg-black/40 flex items-center justify-center border border-black shadow-inner">
                      <PaletteTilePreview tileId={item.id} size={30} />
                    </div>
                    <span className="text-[11px] font-bold text-[var(--text-main)] leading-snug line-clamp-2">
                      {item.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: INTERACTIVE OBJECTS */}
        {activeTab === 'interactive' && (
          <div className="space-y-3.5">
            <div className="space-y-2">
              <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
                Бонусы и интерактивные объекты:
              </div>
              <div className="grid grid-cols-2 gap-2">
                {interactiveItems.map((item) => {
                  const isSelected = activeTool !== 'erase' && selectedTile === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`tour-tile-${item.id}`}
                      onClick={() => {
                        onSelectTile(item.id);
                        TutorialManager.emitTileSelected(item.id);
                        if (activeTool === 'erase') onSelectTool('brush');
                        sound.playPlaceTile();
                      }}
                      title={item.hint}
                      className={`tutorial-target retro-slot flex items-center gap-2 p-2 text-left cursor-pointer select-none transition-all ${
                        isSelected ? 'selected' : ''
                      }`}
                    >
                      <div className="shrink-0 w-8.5 h-8.5 rounded bg-black/40 flex items-center justify-center border border-black shadow-inner">
                        <PaletteTilePreview tileId={item.id} size={30} />
                      </div>
                      <span className="text-[11px] font-bold text-[var(--text-main)] leading-snug line-clamp-2">
                        {item.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ENEMIES */}
        {activeTab === 'enemies' && (
          <div className="space-y-3.5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Swords className="w-3.5 h-3.5" />
                  <span>Противники:</span>
                </div>
                <span className="text-[10px] text-[var(--text-muted)]">
                  Наземные / Летающие
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {enemyItems.map((item) => {
                  const isSelected = activeTool !== 'erase' && selectedTile === item.id;
                  const isGround = item.id !== 'enemy_slime';
                  const roleLabel =
                    item.id === 'enemy_chaser'
                      ? 'Зверь-охотник (быстрая погоня)'
                      : item.id === 'enemy_patrol'
                      ? 'Часовой дозора (патруль)'
                      : item.id === 'enemy_jumper'
                      ? 'Прыгун-засадник (прыжки)'
                      : 'Летучий пикировщик (в воздухе)';

                  return (
                    <button
                      key={item.id}
                      id={`tour-tile-${item.id}`}
                      onClick={() => {
                        onSelectTile(item.id);
                        TutorialManager.emitTileSelected(item.id);
                        if (activeTool === 'erase') onSelectTool('brush');
                        sound.playPlaceTile();
                      }}
                      title={
                        isGround
                          ? `${item.name}: ставится только на твердую поверхность`
                          : `${item.name}: летает в воздухе`
                      }
                      className={`tutorial-target retro-slot flex items-center justify-between p-2 text-left cursor-pointer select-none transition-all ${
                        isSelected ? 'selected' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="shrink-0 w-8 h-8 rounded bg-black/40 flex items-center justify-center border border-black shadow-inner">
                          <PaletteTilePreview tileId={item.id} size={28} />
                        </div>
                        <div>
                          <div className="text-[11px] font-bold leading-tight text-[var(--text-main)]">
                            {item.name}
                          </div>
                          <div className="text-[9px] text-[var(--text-muted)] line-clamp-1">
                            {roleLabel}
                          </div>
                        </div>
                      </div>
                      <span
                        className="text-[8px] font-pixel px-1.5 py-0.5 rounded border border-black bg-black/30 text-amber-400 shrink-0"
                      >
                        {isGround ? 'земля' : 'воздух'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}


      </div>

      {/* 4. Tools & Actions Bottom Panel with Hotkey Badges */}
      <div className="p-3 bg-[#0F172A] border-t-2 border-black space-y-2 shrink-0">
        {/* Tool Mode Buttons (Brush [B], Move [V], Area [R], Eraser [E], Clear) */}
        <div className="grid grid-cols-5 gap-1">
          {/* Freehand Brush */}
          <button
            id="tour-tool-brush"
            onClick={() => {
              onSelectTool('brush');
              sound.playSelect();
            }}
            title="Свободная кисть (B) — рисование блоков в любом направлении"
            className={`py-1.5 px-0.5 rounded-md text-xs font-bold flex flex-col items-center justify-center gap-1 border-2 border-black transition-all cursor-pointer relative overflow-hidden ${
              activeTool === 'brush'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-[2px_2px_0px_#000]'
                : 'bg-[var(--card-subtle)] text-[var(--text-main)] hover:bg-slate-700'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span className="text-[11px] font-body leading-none whitespace-nowrap">Кисть</span>
            <kbd className="absolute top-0.5 right-0.5 px-0.5 py-0.2 bg-black border border-slate-700 rounded text-[8px] font-mono text-amber-400">
              B
            </kbd>
          </button>

          {/* Move / Hand */}
          <button
            onClick={() => {
              onSelectTool('move');
              sound.playSelect();
            }}
            title="Перемещение объектов (V или H) — перетаскивание блоков и врагов"
            className={`py-1.5 px-0.5 rounded-md text-xs font-bold flex flex-col items-center justify-center gap-1 border-2 border-black transition-all cursor-pointer relative overflow-hidden ${
              activeTool === 'move'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-[2px_2px_0px_#000]'
                : 'bg-[var(--card-subtle)] text-[var(--text-main)] hover:bg-slate-700'
            }`}
          >
            <Hand className="w-3.5 h-3.5" />
            <span className="text-[11px] font-body leading-none whitespace-nowrap">Рука</span>
            <kbd className="absolute top-0.5 right-0.5 px-0.5 py-0.2 bg-black border border-slate-700 rounded text-[8px] font-mono text-amber-400">
              V
            </kbd>
          </button>

          {/* Area 2D Box */}
          <button
            id="tour-tool-line"
            onClick={() => {
              onSelectTool('line');
              sound.playSelect();
            }}
            title="Область (R) — прямоугольное заполнение стен или ям"
            className={`py-1.5 px-0.5 rounded-md text-xs font-bold flex flex-col items-center justify-center gap-1 border-2 border-black transition-all cursor-pointer relative overflow-hidden ${
              activeTool === 'line'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-[2px_2px_0px_#000]'
                : 'bg-[var(--card-subtle)] text-[var(--text-main)] hover:bg-slate-700'
            }`}
          >
            <Move className="w-3.5 h-3.5" />
            <span className="text-[11px] font-body leading-none whitespace-nowrap">Зона</span>
            <kbd className="absolute top-0.5 right-0.5 px-0.5 py-0.2 bg-black border border-slate-700 rounded text-[8px] font-mono text-amber-400">
              R
            </kbd>
          </button>

          {/* Eraser */}
          <button
            id="tour-tool-erase"
            onClick={() => {
              onSelectTool('erase');
              sound.playErase();
            }}
            title="Ластик (E) — удаление блоков кликом или протяжкой"
            className={`py-1.5 px-0.5 rounded-md text-xs font-bold flex flex-col items-center justify-center gap-1 border-2 border-black transition-all cursor-pointer relative overflow-hidden ${
              activeTool === 'erase'
                ? 'bg-rose-500 text-white font-bold shadow-[2px_2px_0px_#000]'
                : 'bg-[var(--card-subtle)] text-rose-400 hover:bg-slate-700'
            }`}
          >
            <Eraser className="w-3.5 h-3.5" />
            <span className="text-[11px] font-body leading-none whitespace-nowrap">Ластик</span>
            <kbd className="absolute top-0.5 right-0.5 px-0.5 py-0.2 bg-black border border-slate-700 rounded text-[8px] font-mono text-rose-300">
              E
            </kbd>
          </button>

          {/* Clear Level */}
          <button
            onClick={() => setConfirmClearOpen(true)}
            title="Очистить уровень"
            className="py-1.5 px-0.5 rounded-md text-xs font-bold flex flex-col items-center justify-center gap-1 border-2 border-black bg-[var(--card-subtle)] text-[var(--text-muted)] hover:text-rose-400 hover:bg-rose-950/30 transition-all cursor-pointer shadow-[1px_1px_0px_#000] overflow-hidden"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="text-[11px] font-body leading-none whitespace-nowrap">Сброс</span>
          </button>
        </div>

        {/* Save Row with Hotkey badge Ctrl+S */}
        <div className="pt-1">
          <button
            onClick={onSave}
            title="Сохранить уровень в библиотеку проектов студии (Ctrl+S)"
            className="retro-btn-sm w-full py-2 px-3 text-xs font-bold flex items-center justify-between bg-emerald-600 hover:bg-emerald-500 text-slate-950"
          >
            <div className="flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="font-pixel text-[9px]">Сохранить</span>
            </div>
            <kbd className="px-1.5 py-0.5 bg-black border border-emerald-400/50 rounded text-[8px] font-mono text-emerald-300">
              Ctrl+S
            </kbd>
          </button>
        </div>
      </div>


      {/* Clear Confirmation Dialog */}
      {confirmClearOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent select-none animate-in fade-in duration-150">
          <div className="w-full max-w-sm retro-modal p-5 shadow-[6px_6px_0px_#000] space-y-4 text-[var(--text-main)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-rose-500/20 text-rose-500 border-2 border-black flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-base font-pixel text-[var(--text-main)]">ОЧИСТИТЬ КАРТУ?</h4>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Все расставленные блоки будут стёрты. Действие можно вернуть кнопкой «Назад» (Ctrl+Z).
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmClearOpen(false)}
                className="retro-btn-sm px-3.5 py-1.5 bg-[var(--card-subtle)] text-[var(--text-main)]"
              >
                Отмена
              </button>
              <button
                onClick={() => {
                  setConfirmClearOpen(false);
                  onClear();
                }}
                className="retro-btn-sm px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold"
              >
                Да, очистить
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
