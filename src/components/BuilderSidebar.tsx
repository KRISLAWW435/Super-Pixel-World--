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

export type StudioSidebarTab = 'platforms' | 'interactive' | 'world';

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
      <aside className="w-14 h-full bg-[#131B2E] border-l border-slate-800 flex flex-col justify-between items-center py-2.5 shrink-0 select-none z-20">
        <button
          onClick={() => setIsCollapsed(false)}
          title="Развернуть панель инструментов"
          className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 flex items-center justify-center transition-colors cursor-pointer shadow-sm"
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
            className={`w-10 h-10 rounded-xl relative flex items-center justify-center cursor-pointer transition-all ${
              activeTool === 'brush'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <PenTool className="w-4 h-4" />
            <kbd className="absolute -bottom-1 -right-1 px-1 py-0.2 bg-[#1E293B] border border-slate-700 rounded text-[9px] font-mono text-[#F8FAFC]">
              B
            </kbd>
          </button>

          {/* Area / Rect */}
          <button
            onClick={() => {
              onSelectTool('line');
              sound.playSelect();
            }}
            title="Область / Прямоугольник (R)"
            className={`w-10 h-10 rounded-xl relative flex items-center justify-center cursor-pointer transition-all ${
              activeTool === 'line'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Move className="w-4 h-4" />
            <kbd className="absolute -bottom-1 -right-1 px-1 py-0.2 bg-[#1E293B] border border-slate-700 rounded text-[9px] font-mono text-[#F8FAFC]">
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
            className={`w-10 h-10 rounded-xl relative flex items-center justify-center cursor-pointer transition-all ${
              activeTool === 'erase'
                ? 'bg-rose-500 text-white font-bold shadow-md shadow-rose-500/20'
                : 'bg-slate-800 text-rose-400 hover:bg-slate-700'
            }`}
          >
            <Eraser className="w-4 h-4" />
            <kbd className="absolute -bottom-1 -right-1 px-1 py-0.2 bg-[#1E293B] border border-slate-700 rounded text-[9px] font-mono text-[#F8FAFC]">
              E
            </kbd>
          </button>
        </div>

        {/* Playtest button */}
        <button
          onClick={onPlay}
          title="Запустить тест уровня (P или Enter)"
          className="w-10 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center font-bold cursor-pointer shadow-lg shadow-emerald-500/30 relative"
        >
          <Play className="w-4 h-4 fill-slate-950" />
          <kbd className="absolute -bottom-1 -right-1 px-1 py-0.2 bg-[#0F172A] border border-emerald-400/60 rounded text-[9px] font-mono text-emerald-300">
            P
          </kbd>
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-full md:w-80 lg:w-[280px] xl:w-[320px] h-full bg-[#131B2E] border-l border-slate-800 flex flex-col justify-between shrink-0 select-none shadow-2xl z-20 overflow-hidden">
      {/* 1. Header Toolbar (Title, Collapse, Utilities) */}
      <div className="px-3 py-2.5 bg-[#0F172A] border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => setIsCollapsed(true)}
            title="Свернуть панель инструментов"
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider truncate">
              Мастерская блоков
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onToggleMute}
            title={isMuted ? 'Включить звук' : 'Выключить звук'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
          <button
            onClick={onToggleFullscreen}
            title={isFullscreen ? 'Оконный режим' : 'Во весь экран'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onOpenTutorial}
            title="Инструкция геймдизайнера"
            className="p-1.5 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Three Unified Studio Tabs (Platforms, Interactive, World) */}
      <div className="grid grid-cols-3 bg-[#0B0F19] border-b border-slate-800 p-1.5 gap-1 shrink-0">
        <button
          id="tour-tab-platforms"
          onClick={() => {
            handleSelectTab('platforms');
            if (activeTool === 'erase') onSelectTool('brush');
            sound.playClick();
          }}
          style={{ pointerEvents: 'auto' }}
          className={`tutorial-target py-2 px-1 text-xs font-bold rounded-xl transition-all text-center flex flex-col items-center gap-1 cursor-pointer ${
            activeTab === 'platforms'
              ? 'bg-[#1E293B] text-amber-300 border border-amber-400/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Платформы</span>
        </button>

        <button
          id="tour-tab-interactive"
          onClick={() => {
            handleSelectTab('interactive');
            if (activeTool === 'erase') onSelectTool('brush');
            sound.playClick();
          }}
          style={{ pointerEvents: 'auto' }}
          className={`tutorial-target py-2 px-1 text-xs font-bold rounded-xl transition-all text-center flex flex-col items-center gap-1 cursor-pointer ${
            activeTab === 'interactive'
              ? 'bg-[#1E293B] text-amber-300 border border-amber-400/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
          <span>Интерактив</span>
        </button>

        <button
          id="tour-tab-world"
          onClick={() => {
            handleSelectTab('world');
            sound.playClick();
          }}
          style={{ pointerEvents: 'auto' }}
          className={`tutorial-target py-2 px-1 text-xs font-bold rounded-xl transition-all text-center flex flex-col items-center gap-1 cursor-pointer ${
            activeTab === 'world'
              ? 'bg-[#1E293B] text-amber-300 border border-amber-400/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Palette className="w-3.5 h-3.5 text-cyan-400" />
          <span>Мир и герой</span>
        </button>
      </div>

      {/* 3. Palette Items Content Area */}
      <div className="flex-1 p-3 overflow-y-auto space-y-3">
        {/* TAB 1: PLATFORMS */}
        {activeTab === 'platforms' && (
          <div className="space-y-2">
            <div className="text-[11px] font-semibold text-slate-400">
              Строительные блоки и платформы:
            </div>
            <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
              {platformItems.map((item) => {
                const isSelected = activeTool !== 'erase' && selectedTile === item.id;
                return (
                  <button
                    key={item.id}
                    id={`tour-tile-${item.id}`}
                    onClick={() => {
                      onSelectTile(item.id);
                      if (activeTool === 'erase') onSelectTool('brush');
                      sound.playPlaceTile();
                    }}
                    title={item.hint}
                    className={`tutorial-target flex items-center gap-2.5 p-2.5 sm:p-3 rounded-2xl text-left border transition-all cursor-pointer min-h-[58px] sm:min-h-[64px] select-none touch-manipulation ${
                      isSelected
                        ? 'bg-amber-500/25 border-amber-400 ring-2 ring-amber-400/60 text-white shadow-md shadow-amber-500/20 scale-[1.02]'
                        : 'bg-[#0B0F19]/90 hover:bg-slate-800 border-slate-700/80 text-slate-200 hover:border-slate-500 active:scale-95'
                    }`}
                  >
                    <div className="shrink-0 w-9.5 h-9.5 sm:w-10 sm:h-10 rounded-xl bg-[#0F172A] flex items-center justify-center border border-slate-700/60 shadow-inner">
                      <PaletteTilePreview tileId={item.id} size={36} />
                    </div>
                    <span className="text-xs sm:text-[13px] font-bold leading-snug line-clamp-2">
                      {item.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: INTERACTIVE & ENEMIES */}
        {activeTab === 'interactive' && (
          <div className="space-y-3.5">
            {/* Interactive Items Section */}
            <div className="space-y-2">
              <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
                Бонусы и механизмы:
              </div>
              <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                {interactiveItems.map((item) => {
                  const isSelected = activeTool !== 'erase' && selectedTile === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`tour-tile-${item.id}`}
                      onClick={() => {
                        onSelectTile(item.id);
                        if (activeTool === 'erase') onSelectTool('brush');
                        sound.playPlaceTile();
                      }}
                      title={item.hint}
                      className={`tutorial-target flex items-center gap-2.5 p-2.5 sm:p-3 rounded-2xl text-left border transition-all cursor-pointer min-h-[58px] sm:min-h-[64px] select-none touch-manipulation ${
                        isSelected
                          ? 'bg-amber-500/25 border-amber-400 ring-2 ring-amber-400/60 text-white shadow-md shadow-amber-500/20 scale-[1.02]'
                          : 'bg-[#0B0F19]/90 hover:bg-slate-800 border-slate-700/80 text-slate-200 hover:border-slate-500 active:scale-95'
                      }`}
                    >
                      <div className="shrink-0 w-9.5 h-9.5 sm:w-10 sm:h-10 rounded-xl bg-[#0F172A] flex items-center justify-center border border-slate-700/60 shadow-inner">
                        <PaletteTilePreview tileId={item.id} size={36} />
                      </div>
                      <span className="text-xs sm:text-[13px] font-bold leading-snug line-clamp-2">
                        {item.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Enemies Section with Ground Requirement Note */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Swords className="w-3.5 h-3.5" />
                  <span>Противники:</span>
                </div>
                <span className="text-[10px] text-slate-400">
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
                        if (activeTool === 'erase') onSelectTool('brush');
                        sound.playPlaceTile();
                      }}
                      title={
                        isGround
                          ? `${item.name}: ставится только на твердую поверхность`
                          : `${item.name}: летает в воздухе`
                      }
                      className={`tutorial-target flex items-center justify-between p-2.5 rounded-xl text-left border transition-all cursor-pointer min-h-[50px] select-none ${
                        isSelected
                          ? 'bg-rose-500/25 border-rose-400 ring-2 ring-rose-400/60 text-white shadow-md shadow-rose-500/20'
                          : 'bg-[#0B0F19]/90 hover:bg-slate-800 border-slate-700/80 text-slate-300 hover:border-slate-500 active:scale-98'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="shrink-0 w-8 h-8 rounded-lg bg-[#0F172A] flex items-center justify-center border border-slate-700/60">
                          <PaletteTilePreview tileId={item.id} size={30} />
                        </div>
                        <div>
                          <div className="text-xs font-bold leading-tight text-white">
                            {item.name}
                          </div>
                          <div className="text-[10px] text-slate-400 line-clamp-1">
                            {roleLabel}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border shrink-0 ${
                          isGround
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            : 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                        }`}
                      >
                        {isGround ? '🌱 на землю' : '☁️ в воздухе'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: WORLD THEMES & HEROES */}
        {activeTab === 'world' && (
          <div className="space-y-3.5">
            {/* World Biomes */}
            <div className="space-y-2">
              <div className="text-[11px] font-semibold text-slate-400">
                Биом и панорамный фон:
              </div>
              <div className="space-y-1.5">
                {(Object.keys(THEMES) as ThemeId[]).map((tId) => {
                  const th = THEMES[tId];
                  const isSelected = selectedTheme === tId;
                  return (
                    <button
                      key={tId}
                      onClick={() => {
                        onSelectTheme(tId);
                        sound.playCheckpoint();
                      }}
                      className={`w-full text-left rounded-xl overflow-hidden border transition-all group cursor-pointer ${
                        isSelected
                          ? 'border-amber-400 ring-2 ring-amber-400/40 shadow-md'
                          : 'border-slate-700/80 hover:border-slate-500'
                      }`}
                    >
                      <div className="relative h-14 w-full overflow-hidden bg-slate-950">
                        <img
                          src={th.image}
                          alt={th.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover object-bottom transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
                        <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between">
                          <span className="text-xs font-bold text-white">
                            {th.name}
                          </span>
                          {isSelected && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 text-[10px] font-black uppercase">
                              Выбрано
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Playable Heroes */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>Главный герой:</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {(Object.keys(HEROES) as HeroId[]).map((hId) => {
                  const hero = HEROES[hId];
                  const isSelected = selectedHero === hId;
                  return (
                    <button
                      key={hId}
                      onClick={() => {
                        onSelectHero(hId);
                        sound.playJump();
                      }}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-400 ring-1 ring-amber-400/50'
                          : 'bg-[#0B0F19]/80 hover:bg-slate-800 border-slate-700/80'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-700 flex items-center justify-center shrink-0">
                        <PaletteTilePreview heroId={hId} size={28} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">
                          {hero.name}
                        </div>
                        <div className="text-[10px] text-emerald-400 truncate">
                          {hero.perk}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Tools & Actions Bottom Panel with Hotkey Badges */}
      <div className="p-3 bg-[#0F172A] border-t border-slate-800 space-y-2 shrink-0">
        {/* Tool Mode Buttons (Brush [B], Area [R], Eraser [E], Clear) */}
        <div className="grid grid-cols-4 gap-1.5">
          {/* Freehand Brush */}
          <button
            id="tour-tool-brush"
            onClick={() => {
              onSelectTool('brush');
              sound.playSelect();
            }}
            title="Свободная кисть (B) — рисование блоков в любом направлении"
            className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer relative ${
              activeTool === 'brush'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span className="text-[10px]">Кисть</span>
            <kbd className="absolute top-1 right-1 px-1 py-0.2 bg-[#1E293B] border border-slate-700 rounded text-[9px] font-mono text-[#F8FAFC]">
              B
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
            className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer relative ${
              activeTool === 'line'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Move className="w-4 h-4" />
            <span className="text-[10px]">Область</span>
            <kbd className="absolute top-1 right-1 px-1 py-0.2 bg-[#1E293B] border border-slate-700 rounded text-[9px] font-mono text-[#F8FAFC]">
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
            className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer relative ${
              activeTool === 'erase'
                ? 'bg-rose-500 text-white border-rose-400 shadow-sm'
                : 'bg-slate-800 text-rose-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Eraser className="w-4 h-4" />
            <span className="text-[10px]">Ластик</span>
            <kbd className="absolute top-1 right-1 px-1 py-0.2 bg-[#1E293B] border border-slate-700 rounded text-[9px] font-mono text-[#F8FAFC]">
              E
            </kbd>
          </button>

          {/* Clear Level */}
          <button
            onClick={() => setConfirmClearOpen(true)}
            title="Очистить уровень"
            className="py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 border border-slate-700 bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span className="text-[10px]">Сброс</span>
          </button>
        </div>

        {/* Save / Presets Row with Hotkey badge Ctrl+S */}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={onSave}
            title="Сохранить уровень в библиотеку проектов студии (Ctrl+S)"
            className="py-2.5 px-2 rounded-xl text-xs font-bold flex items-center justify-between bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 hover:text-emerald-300 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" />
              <span>Сохранить</span>
            </div>
            <kbd className="px-1.5 py-0.5 bg-[#1E293B] border border-slate-700 rounded text-[9px] font-mono text-slate-300">
              Ctrl+S
            </kbd>
          </button>

          <button
            onClick={onLoad}
            title="Готовые уровни студии и импорт JSON"
            className="py-2.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-purple-400" />
            <span>Готовые миры</span>
          </button>
        </div>
      </div>

      {/* Clear Confirmation Dialog */}
      {confirmClearOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B0F19]/80 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-[#131B2E] border border-rose-500/50 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Очистить уровень?</h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Все расставленные блоки будут стёрты. Не волнуйтесь: действие можно вернуть кнопкой «Назад» (Ctrl+Z).
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmClearOpen(false)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Отмена
              </button>
              <button
                onClick={() => {
                  setConfirmClearOpen(false);
                  onClear();
                }}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
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
