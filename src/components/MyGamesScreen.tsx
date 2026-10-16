/**
 * Super Pixel World - My Games Screen (Список сохранённых игр)
 * Shows the child's created levels saved in LocalStorage.
 * Grid layout (3 in a row on desktop), cartoon cards with play, edit, duplicate, and delete actions.
 * Empty state with cute mascot and 'Create' CTA.
 */

import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Gamepad2,
  Hammer,
  Play,
  Plus,
  Sparkles,
  Trash2,
  Copy,
} from 'lucide-react';
import { sound } from '../audio/soundEngine';
import { SaveManager } from '../services/storageManager';
import { THEMES } from '../game/constants';
import { LevelData } from '../types/game';
import { PRESET_AVATARS, SavedGame, UserProfile } from '../types/storage';

interface MyGamesScreenProps {
  profile: UserProfile | null;
  onBackToMenu: () => void;
  onPlayGame: (level: LevelData) => void;
  onEditGame: (level: LevelData) => void;
  onCreateNewGame: () => void;
}

export const MyGamesScreen: React.FC<MyGamesScreenProps> = ({
  profile,
  onBackToMenu,
  onPlayGame,
  onEditGame,
  onCreateNewGame,
}) => {
  const [games, setGames] = useState<SavedGame[]>(() => SaveManager.getSavedGames());
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const avatar = PRESET_AVATARS.find((a) => a.id === profile?.avatarId) || PRESET_AVATARS[0];

  const handlePlay = (game: SavedGame) => {
    sound.playCoin();
    onPlayGame(game.levelData);
  };

  const handleEdit = (game: SavedGame) => {
    sound.playClick();
    onEditGame(game.levelData);
  };

  const handleDuplicate = (game: SavedGame) => {
    sound.playPlaceTile();
    SaveManager.duplicateGame(game.id);
    setGames(SaveManager.getSavedGames());
  };

  const handleDelete = (id: string) => {
    sound.playBump();
    SaveManager.deleteGame(id);
    setGames(SaveManager.getSavedGames());
    setDeleteConfirmId(null);
  };

  return (
    <div className="w-full h-full min-h-screen bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto select-none">
      {/* Top Bar */}
      <div className="w-full max-w-6xl mx-auto flex items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <button
          onClick={() => {
            sound.playClick();
            onBackToMenu();
          }}
          className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-black flex items-center gap-2 border-2 border-slate-700 transition-all cursor-pointer active:scale-95 shadow-md"
        >
          <ArrowLeft className="w-4 h-4 stroke-[3]" />
          <span>В меню</span>
        </button>

        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-md bg-slate-950 shrink-0"
          >
            <img
              src={avatar.imageUrl}
              alt={avatar.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
          <div>
            <div className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-amber-400">
              Коллекция уровней
            </div>
            <h1 className="text-lg sm:text-2xl font-black text-white">
              Игры {profile?.name || 'игрока'}
            </h1>
          </div>
        </div>

        <button
          onClick={() => {
            sound.playClick();
            onCreateNewGame();
          }}
          className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 text-xs sm:text-sm font-black flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span className="hidden sm:inline">Создать уровень</span>
          <span className="sm:hidden">Создать</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-6xl mx-auto py-8 flex-1">
        {games.length === 0 ? (
          /* Empty State */
          <div className="h-full min-h-[50vh] flex flex-col items-center justify-center text-center p-6 space-y-5 animate-in fade-in duration-300">
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl overflow-hidden border-4 border-amber-400/80 shadow-2xl shadow-indigo-500/20 bg-slate-950 animate-bounce">
              <img
                src={avatar.imageUrl}
                alt={avatar.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
            <div className="space-y-2 max-w-md">
              <h2 className="text-xl sm:text-3xl font-black text-white">
                У тебя пока нет игр!
              </h2>
              <p className="text-sm sm:text-base text-slate-300 font-medium">
                Нажми «Создать», чтобы построить свой самый первый крутой уровень с препятствиями, монетками и врагами!
              </p>
            </div>
            <button
              onClick={() => {
                sound.playClick();
                onCreateNewGame();
              }}
              className="py-4 px-8 rounded-2xl bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-black text-base uppercase tracking-wider flex items-center gap-3 shadow-xl shadow-emerald-500/30 active:scale-95 transition-all cursor-pointer animate-bounce"
            >
              <Hammer className="w-5 h-5 stroke-[2.5]" />
              <span>ПОСТРОИТЬ ПЕРВУЮ ИГРУ</span>
            </button>
          </div>
        ) : (
          /* Grid of Games (3 in a row on desktop) */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {games.map((game) => {
              const theme = THEMES[game.levelData?.bgTheme || 'green_islands'] || THEMES['green_islands'];
              const itemCount = game.levelData?.items?.length || 0;

              return (
                <div
                  key={game.id}
                  className="bg-slate-900/90 border-3 border-slate-800 hover:border-amber-400/70 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-amber-500/10 transition-all flex flex-col justify-between group"
                >
                  {/* Card Thumbnail / Header */}
                  <div className="relative h-32 bg-slate-950 overflow-hidden">
                    <img
                      src={theme.image}
                      alt={theme.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-bottom opacity-75 group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent" />

                    {/* Theme Badge */}
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-slate-950/80 border border-slate-700/80 text-[10px] font-bold text-amber-300 flex items-center gap-1 backdrop-blur-xs">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>{theme.name}</span>
                    </div>

                    {/* Item count tag */}
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-lg bg-slate-950/80 border border-slate-700/80 text-[10px] font-bold text-slate-300 backdrop-blur-xs">
                      {itemCount} блоков
                    </div>

                    {/* Big Green Play Button floating on card */}
                    <button
                      onClick={() => handlePlay(game)}
                      title="Играть в этот уровень"
                      className="absolute -bottom-5 right-5 w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 hover:from-emerald-300 hover:to-green-500 text-slate-950 flex items-center justify-center shadow-xl shadow-emerald-500/40 active:scale-95 transition-all cursor-pointer border-3 border-slate-900"
                    >
                      <Play className="w-7 h-7 fill-slate-950 translate-x-0.5" />
                    </button>
                  </div>

                  {/* Card Info */}
                  <div className="p-5 pt-3 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="text-lg font-black text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                        {game.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>Создан: {game.date}</span>
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-800 gap-2">
                      <button
                        onClick={() => handleEdit(game)}
                        className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Hammer className="w-3.5 h-3.5 text-amber-400" />
                        <span>Изменить</span>
                      </button>

                      <button
                        onClick={() => handleDuplicate(game)}
                        title="Создать копию"
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setDeleteConfirmId(game.id)}
                        title="Удалить уровень"
                        className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-600 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-slate-900 border-3 border-rose-500/60 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 text-xl font-bold">
                🗑️
              </div>
              <div>
                <h4 className="text-lg font-black text-white">
                  Удалить уровень?
                </h4>
                <p className="text-xs text-slate-300">
                  Этот уровень будет удален из твоих сохранённых игр.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Отмена
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black transition-colors cursor-pointer"
              >
                Да, удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
