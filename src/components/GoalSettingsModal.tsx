/**
 * Pixel Studio Pro - Goal Settings Modal (GoalSettingsModal)
 *
 * Allows the level creator to configure the main objective / challenge for the level:
 * - None (Regular completion to finish flag)
 * - Collect all coins (🪙)
 * - Defeat all enemies (⚔️)
 * - Time-based speedrun with configurable seconds (⏱️)
 * - Collect all crystals (💎)
 * - Complete without losing a life (❤️)
 * - Collect all stars (⭐)
 *
 * Saves directly into LevelData state.
 */

import React, { useState, useEffect } from 'react';
import { Target, Clock, Coins, Swords, Gem, Heart, Sparkles, Check, AlertCircle } from 'lucide-react';
import { sound } from '../audio/soundEngine';
import { LevelData, LevelGoalType } from '../types/game';
import { StudioModal } from './StudioModal';

interface GoalSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  levelData: LevelData;
  onSaveGoal: (goalType: LevelGoalType, timeLimit: number, hasTimer?: boolean) => void;
}

interface GoalOptionConfig {
  id: LevelGoalType;
  name: string;
  badge: string;
  description: string;
  icon: React.ReactNode;
}

const GOAL_OPTIONS: GoalOptionConfig[] = [
  {
    id: 'none',
    name: 'Без цели (Обычное прохождение)',
    badge: 'Классика',
    description: 'Игроку нужно просто добраться до финишной арки живым.',
    icon: <Target className="w-4 h-4 text-slate-400" />,
  },
  {
    id: 'coins',
    name: 'Собрать все монеты',
    badge: 'Сбор',
    description: 'Игрок должен собрать абсолютно все золотые монеты на уровне.',
    icon: <Coins className="w-4 h-4 text-amber-400" />,
  },
  {
    id: 'enemies',
    name: 'Победить всех врагов',
    badge: 'Битва',
    description: 'Игрок должен одолеть всех врагов на уровне прыжком сверху.',
    icon: <Swords className="w-4 h-4 text-rose-400" />,
  },
  {
    id: 'time',
    name: 'Пройти на время',
    badge: 'Спидран',
    description: 'Уложиться в заданный лимит времени до того, как истечет таймер.',
    icon: <Clock className="w-4 h-4 text-sky-400" />,
  },
  {
    id: 'crystals',
    name: 'Собрать все кристаллы',
    badge: 'Кристаллы',
    description: 'Отыскать и собрать все драгоценные кристаллы на уровне.',
    icon: <Gem className="w-4 h-4 text-purple-400" />,
  },
  {
    id: 'no_damage',
    name: 'Пройти без потери жизней',
    badge: 'Идеал',
    description: 'Пройти уровень аккуратно, сохранив все 3 сердечка.',
    icon: <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />,
  },
  {
    id: 'stars',
    name: 'Собрать все звёзды',
    badge: 'Секреты',
    description: 'Найти и забрать все секретные супер-звёзды на уровне.',
    icon: <Sparkles className="w-4 h-4 text-yellow-300 fill-yellow-300" />,
  },
];

export const GoalSettingsModal: React.FC<GoalSettingsModalProps> = ({
  isOpen,
  onClose,
  levelData,
  onSaveGoal,
}) => {
  const [selectedGoal, setSelectedGoal] = useState<LevelGoalType>(() => {
    return levelData.goalType || 'none';
  });

  const [hasTimer, setHasTimer] = useState<boolean>(() => {
    if (levelData.hasTimer !== undefined) return levelData.hasTimer;
    return levelData.goalType === 'time';
  });

  const [timeSeconds, setTimeSeconds] = useState<number>(() => {
    return levelData.targetTime || levelData.timeLimit || 60;
  });

  const [isSavedSuccess, setIsSavedSuccess] = useState<boolean>(false);

  // Synchronize initial state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedGoal(levelData.goalType || 'none');
      setTimeSeconds(levelData.targetTime || levelData.timeLimit || 60);
      setHasTimer(levelData.hasTimer !== undefined ? levelData.hasTimer : (levelData.goalType === 'time'));
      setIsSavedSuccess(false);
    }
  }, [isOpen, levelData.goalType, levelData.targetTime, levelData.timeLimit, levelData.hasTimer]);

  // Count items on the level
  const coinCount = levelData.items.filter((it) => it.tileId === 'coin').length;
  const enemyCount = levelData.items.filter((it) => it.tileId.startsWith('enemy_')).length;
  const crystalCount = levelData.items.filter((it) => it.tileId === 'crystal').length;
  const starCount = levelData.items.filter((it) => it.tileId === 'star').length;

  const currentOption = GOAL_OPTIONS.find((g) => g.id === selectedGoal) || GOAL_OPTIONS[0];

  const handleApply = () => {
    sound.playCoin();
    onSaveGoal(selectedGoal, timeSeconds, hasTimer);
    setIsSavedSuccess(true);
    setTimeout(() => {
      setIsSavedSuccess(false);
      onClose();
    }, 450);
  };

  return (
    <StudioModal
      isOpen={isOpen}
      onClose={onClose}
      title="Настройка цели уровня"
      subtitle="Задайте главное игровое испытание для игроков"
      icon={<Target className="w-5 h-5 text-amber-400" />}
      badge="Челлендж"
      badgeColor="amber"
    >
      <div className="space-y-4">
        {/* Dropdown Goal Type Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-amber-400" />
              Цель уровня:
            </span>
            <span className="text-[10px] font-mono text-amber-300 uppercase">
              {currentOption.badge}
            </span>
          </label>
          <div className="relative">
            <select
              value={selectedGoal}
              onChange={(e) => {
                sound.playSelect();
                const nextGoal = e.target.value as LevelGoalType;
                setSelectedGoal(nextGoal);
                if (nextGoal === 'time') {
                  setHasTimer(true);
                }
              }}
              className="w-full px-3 py-2.5 bg-[#0B0F19] border-2 border-black rounded-xl text-white font-bold text-xs sm:text-sm outline-none focus:border-amber-400 transition-all cursor-pointer shadow-inner appearance-none pr-8"
            >
              {GOAL_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id} className="bg-slate-900 text-white py-1">
                  {opt.name}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-amber-400 font-bold text-xs">
              ▼
            </div>
          </div>
        </div>

        {/* Goal Description Card */}
        <div className="p-3 rounded-xl bg-[#0F172A] border border-slate-700/80 flex items-start gap-2.5">
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-700 shrink-0">
            {currentOption.icon}
          </div>
          <div className="min-w-0 text-xs">
            <div className="font-bold text-amber-300">{currentOption.name}</div>
            <p className="text-slate-300 mt-0.5 leading-relaxed">{currentOption.description}</p>
          </div>
        </div>

        {/* Level Timer Toggle (On/Off) */}
        <div className="p-3.5 rounded-xl bg-[#0B0F19] border-2 border-black flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-lg border-2 border-black shadow-[2px_2px_0px_#000] flex items-center justify-center ${
                hasTimer
                  ? 'bg-amber-400 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold font-pixel text-white">
                ТАЙМЕР В ИГРЕ
              </div>
              <div className="text-[11px] text-slate-400">
                {hasTimer ? 'Обратный отсчёт времени включен для этого уровня' : 'Без ограничения по времени (таймер выключен)'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setHasTimer((prev) => !prev);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-pixel font-bold flex items-center gap-1.5 border-2 border-black shadow-[2px_2px_0px_#000] cursor-pointer transition-all ${
              hasTimer
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
            }`}
          >
            {hasTimer && <Check className="w-3 h-3 stroke-[3]" />}
            <span>{hasTimer ? 'ВКЛ' : 'ВЫКЛ'}</span>
          </button>
        </div>

        {/* Time-Based Input Field (Shown when hasTimer is ON or 'time' goal is selected) */}
        {(hasTimer || selectedGoal === 'time') && (
          <div className="p-3.5 rounded-xl bg-[#0B0F19] border-2 border-black space-y-2 animate-in fade-in duration-200">
            <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sky-400">
                <Clock className="w-4 h-4" />
                Лимит времени (в секундах):
              </span>
              <span className="font-pixel text-[11px] text-amber-400 font-bold">{timeSeconds} сек.</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={10}
                max={999}
                step={5}
                value={timeSeconds}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setTimeSeconds(Math.max(5, Math.min(999, val || 30)));
                }}
                className="w-full px-3.5 py-2 bg-[#131B2E] border-2 border-slate-700 focus:border-amber-400 rounded-lg text-white font-bold text-sm outline-none transition-all"
              />
              <span className="text-xs text-slate-400 font-bold shrink-0">сек.</span>
            </div>
            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400 mr-1">Быстрый выбор:</span>
              {[30, 45, 60, 90, 120, 180, 300].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setTimeSeconds(s);
                  }}
                  className={`px-2 py-1 rounded-md text-[10px] font-pixel font-bold cursor-pointer transition-all border ${
                    timeSeconds === s
                      ? 'bg-amber-400 text-slate-950 border-black shadow-[1px_1px_0px_#000]'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {s}с
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Current Level Objects Stats Breakdown */}
        <div className="p-3 rounded-xl bg-[#0B0F19] border border-slate-800 space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Объекты на уровне сейчас:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-[10px] text-amber-400 font-bold flex items-center justify-center gap-1">
                <Coins className="w-3 h-3" /> Монеты
              </div>
              <div className="font-pixel text-sm font-bold text-white mt-1">{coinCount}</div>
            </div>
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-[10px] text-rose-400 font-bold flex items-center justify-center gap-1">
                <Swords className="w-3 h-3" /> Враги
              </div>
              <div className="font-pixel text-sm font-bold text-white mt-1">{enemyCount}</div>
            </div>
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-[10px] text-purple-400 font-bold flex items-center justify-center gap-1">
                <Gem className="w-3 h-3" /> Кристаллы
              </div>
              <div className="font-pixel text-sm font-bold text-white mt-1">{crystalCount}</div>
            </div>
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-[10px] text-yellow-300 font-bold flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3" /> Звёзды
              </div>
              <div className="font-pixel text-sm font-bold text-white mt-1">{starCount}</div>
            </div>
          </div>

          {/* Contextual Warning if Target Objects are Missing */}
          {selectedGoal === 'coins' && coinCount === 0 && (
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/40 text-amber-300 flex items-center gap-2 text-[11px] font-bold">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>На уровне пока нет монет! Добавьте монеты во вкладке «Бонусы».</span>
            </div>
          )}
          {selectedGoal === 'enemies' && enemyCount === 0 && (
            <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/40 text-rose-300 flex items-center gap-2 text-[11px] font-bold">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>На уровне пока нет врагов! Добавьте врагов во вкладке «Враги».</span>
            </div>
          )}
          {selectedGoal === 'crystals' && crystalCount === 0 && (
            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/40 text-purple-300 flex items-center gap-2 text-[11px] font-bold">
              <AlertCircle className="w-4 h-4 shrink-0 text-purple-400" />
              <span>На уровне пока нет кристаллов! Добавьте их во вкладке «Бонусы».</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-98 transition-all cursor-pointer border-2 border-black"
          >
            {isSavedSuccess ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Цель сохранена!</span>
              </>
            ) : (
              <>
                <Target className="w-4 h-4 stroke-[2.5]" />
                <span>Применить цель</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs sm:text-sm transition-all cursor-pointer border-2 border-black"
          >
            Отмена
          </button>
        </div>
      </div>
    </StudioModal>
  );
};
