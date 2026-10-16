/**
 * Super Pixel World - Interactive In-Editor Walkthrough Bar ("Обучение как в играх")
 * Floats at the top of LevelEditor, guiding the player step-by-step through each stage:
 * what to pick, how and where to place it, sample insertion, and starting to play.
 */

import React from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Eye,
  HelpCircle,
  Play,
  Sparkles,
  Wand2,
  X,
} from 'lucide-react';
import { sound } from '../audio/soundEngine';
import { TileId } from '../types/game';
import { TUTORIAL_STEPS } from './TutorialModal';

interface EditorTutorialBarProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  onSelectTile: (tile: TileId) => void;
  onApplySample: (step: number) => void;
  onStartPlay: () => void;
  onOpenFullModal: (step: number) => void;
  onClose: () => void;
  isMinimized: boolean;
  onToggleMinimize: () => void;
}

export const EditorTutorialBar: React.FC<EditorTutorialBarProps> = ({
  currentStep,
  onStepChange,
  onSelectTile,
  onApplySample,
  onStartPlay,
  onOpenFullModal,
  onClose,
  isMinimized,
  onToggleMinimize,
}) => {
  const step = TUTORIAL_STEPS[currentStep] || TUTORIAL_STEPS[0];
  const Icon = step.icon;

  const handlePickItem = () => {
    if (step.tileId) {
      onSelectTile(step.tileId);
      sound.playSelect();
    }
  };

  const handleApplySample = () => {
    if (currentStep === 6) {
      onStartPlay();
      return;
    }
    onApplySample(currentStep);
    sound.playPlaceTile();
  };

  if (isMinimized) {
    return (
      <div className="absolute top-3 left-4 z-30 pointer-events-auto">
        <button
          onClick={onToggleMinimize}
          className="px-3.5 py-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-xl shadow-amber-500/20 border-2 border-amber-300 transition-all cursor-pointer active:scale-95"
        >
          <Icon className="w-4 h-4" />
          <span>Обучение: Этап {currentStep + 1} из 7</span>
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="absolute top-3 left-4 right-4 z-30 pointer-events-none flex justify-center">
      <div className="w-full max-w-4xl bg-slate-900/95 backdrop-blur-md border-2 border-amber-500/50 rounded-2xl shadow-2xl shadow-amber-500/10 pointer-events-auto p-3 flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
        {/* Top Line: Stage Title & Quick Controls */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Этап {currentStep + 1} / 7
                </span>
                <span className="text-xs font-bold text-slate-300 truncate">
                  {step.title}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => onOpenFullModal(currentStep)}
              title="Открыть подробную инструкцию"
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Справка</span>
            </button>
            <button
              onClick={onToggleMinimize}
              title="Свернуть панель"
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              title="Закрыть обучение"
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Middle Line: Actionable Steps (What to pick & Where to put) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 text-xs">
          {/* WHAT TO TAKE (Колонка 1) */}
          <div className="md:col-span-5 p-2 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between gap-1.5">
            <div>
              <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-0.5">
                1. Что взять:
              </div>
              <div className="text-slate-200 line-clamp-2">
                {step.whatToTake}
              </div>
            </div>
            {step.tileId && (
              <button
                onClick={handlePickItem}
                className="w-full py-1 px-2.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 text-[11px]"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Взять {step.tileName}</span>
              </button>
            )}
          </div>

          {/* HOW & WHERE TO PLACE (Колонка 2) */}
          <div className="md:col-span-7 p-2 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between gap-1.5">
            <div>
              <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-0.5">
                2. Как и куда поставить:
              </div>
              <div className="text-slate-200 text-[11px] leading-relaxed line-clamp-2">
                {step.howToPlace} {step.whereToPlace}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-850">
              {currentStep < 6 ? (
                <button
                  onClick={handleApplySample}
                  className="py-1 px-2.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 text-[11px]"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Поставить образец этого шага</span>
                </button>
              ) : (
                <button
                  onClick={onStartPlay}
                  className="py-1 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 text-xs animate-pulse"
                >
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Начать играть прямо сейчас!</span>
                </button>
              )}

              {/* Navigation Arrows */}
              <div className="flex items-center gap-1">
                <button
                  disabled={currentStep === 0}
                  onClick={() => onStepChange(Math.max(0, currentStep - 1))}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-300 transition-colors cursor-pointer"
                  title="Предыдущий шаг"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-[11px] font-mono font-bold text-slate-400 px-1">
                  {currentStep + 1}/7
                </span>
                <button
                  disabled={currentStep === 6}
                  onClick={() => onStepChange(Math.min(6, currentStep + 1))}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-300 transition-colors cursor-pointer"
                  title="Следующий шаг"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
