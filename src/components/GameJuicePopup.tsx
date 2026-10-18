import React from 'react';

export type JuiceActionType = 'enemy' | 'coin' | 'heart' | 'crystal';

export interface JuiceEvent {
  id: number;
  type: JuiceActionType;
  text: string;
}

// 1. Text arrays (All uppercase, easily expandable)
export const GAME_JUICE_TEXTS: Record<JuiceActionType, string[]> = {
  enemy: ['НЕ ЖИЛЕЦ!', 'Я ТЕБЯ МОГНУЛ!', 'ИЗИ КАТКА!', 'НОКАУТ!', 'УДЕЛАЛ!'],
  coin: ['КАССА!', 'ЛАВЭ!', 'ЗАЛУТАНО!', 'ОПА, В КАРМАШЕК!', 'ХАЛЯВА!'],
  heart: ['ХИЛ!', 'ЖИВЕМ!', 'ФУЛЛ ХП!', 'ПОДЛЕЧИЛСЯ!'],
  crystal: ['ИМБА!', 'ЭПИК!', 'ОПА, АЛМАЗИК!', 'СЮДА!', 'МОЯ ПРЕЛЕСТЬ!'],
};

export const getRandomJuiceText = (type: JuiceActionType): string => {
  const list = GAME_JUICE_TEXTS[type];
  if (!list || list.length === 0) return '!';
  const index = Math.floor(Math.random() * list.length);
  return list[index];
};

interface GameJuicePopupProps {
  currentEvent: JuiceEvent | null;
}

export const GameJuicePopup: React.FC<GameJuicePopupProps> = ({ currentEvent }) => {
  if (!currentEvent) return null;

  const { id, type, text } = currentEvent;

  // Visual styling mapped to action type
  const colorStyles: Record<JuiceActionType, { textColor: string; glowColor: string; icon: string }> = {
    coin: {
      textColor: 'text-amber-300',
      glowColor: 'drop-shadow-[0_0_16px_rgba(250,204,21,0.85)]',
      icon: '🪙',
    },
    enemy: {
      textColor: 'text-red-500',
      glowColor: 'drop-shadow-[0_0_16px_rgba(239,68,68,0.85)]',
      icon: '💥',
    },
    heart: {
      textColor: 'text-rose-400',
      glowColor: 'drop-shadow-[0_0_16px_rgba(244,63,94,0.85)]',
      icon: '💖',
    },
    crystal: {
      textColor: 'text-purple-300',
      glowColor: 'drop-shadow-[0_0_16px_rgba(192,132,252,0.85)]',
      icon: '💎',
    },
  };

  const style = colorStyles[type] || colorStyles.coin;

  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 pointer-events-none select-none">
      <div
        key={id}
        className={`animate-game-juice flex items-center gap-2.5 font-pixel text-base sm:text-xl md:text-2xl font-black tracking-widest ${style.textColor} ${style.glowColor} juice-text-outline whitespace-nowrap`}
      >
        <span className="text-xl sm:text-2xl drop-shadow-md">{style.icon}</span>
        <span>{text}</span>
      </div>
    </div>
  );
};
