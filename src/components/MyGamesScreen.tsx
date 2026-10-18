/**
 * Super Pixel World - My Games Screen (Архив проектов и картриджей)
 *
 * Bright, joyful pixel-art redesign featuring:
 * - Soft sunny pixel-art sky background with light protective overlay for peak readability
 * - Chunky physical game cartridge cards (thick borders, 3D hard shadows, retro grooves)
 * - Live search input (filters by level title OR author name)
 * - Sorting dropdown (Newest First, Oldest First, Name A-Z, Name Z-A)
 * - Favorites Feature (⭐ Star toggle on each cartridge + dedicated Favorites tab filter)
 * - Full responsive grid with tactile, chunky pixel buttons
 */

import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Calendar,
  Hammer,
  Play,
  Plus,
  Sparkles,
  Trash2,
  Copy,
  Search,
  Star,
  ArrowUpDown,
  X,
  Layers,
} from 'lucide-react';
import { sound } from '../audio/soundEngine';
import { SaveManager } from '../services/storageManager';
import { THEMES } from '../game/constants';
import { LevelData } from '../types/game';
import { PRESET_AVATARS, SavedGame, UserProfile } from '../types/storage';
import archiveBgImg from '../assets/images/pixel_archive_sky_bg_1792309583036.jpg';

interface MyGamesScreenProps {
  profile: UserProfile | null;
  onBackToMenu: () => void;
  onPlayGame: (level: LevelData) => void;
  onEditGame: (level: LevelData) => void;
  onCreateNewGame: () => void;
}

type SortOption = 'newest' | 'oldest' | 'name_asc' | 'name_desc';
type FilterTab = 'all' | 'favorites';

export const MyGamesScreen: React.FC<MyGamesScreenProps> = ({
  profile,
  onBackToMenu,
  onPlayGame,
  onEditGame,
  onCreateNewGame,
}) => {
  const [games, setGames] = useState<SavedGame[]>(() =>
    SaveManager.getSavedGamesForProfile(profile?.id)
  );
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Search & Filter & Sort state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [sortOption, setSortOption] = useState<SortOption>('newest');

  React.useEffect(() => {
    setGames(SaveManager.getSavedGamesForProfile(profile?.id));
  }, [profile?.id]);

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
    setGames(SaveManager.getSavedGamesForProfile(profile?.id));
  };

  const handleDelete = (id: string) => {
    sound.playBump();
    SaveManager.deleteGame(id);
    setGames(SaveManager.getSavedGamesForProfile(profile?.id));
    setDeleteConfirmId(null);
  };

  const handleToggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    sound.playCheckpoint();
    SaveManager.toggleFavorite(id);
    setGames(SaveManager.getSavedGamesForProfile(profile?.id));
  };

  // Filtered & Sorted Games list
  const filteredAndSortedGames = useMemo(() => {
    let result = [...games];

    // Filter by tab
    if (activeTab === 'favorites') {
      result = result.filter((g) => Boolean(g.isFavorite));
    }

    // Filter by search query (Level Name OR Author Name)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((g) => {
        const nameMatch = g.name.toLowerCase().includes(q);
        const authorMatch = (g.authorName || profile?.name || '').toLowerCase().includes(q);
        return nameMatch || authorMatch;
      });
    }

    // Sorting
    result.sort((a, b) => {
      if (sortOption === 'newest') {
        return (b.date || '').localeCompare(a.date || '') || b.id.localeCompare(a.id);
      }
      if (sortOption === 'oldest') {
        return (a.date || '').localeCompare(b.date || '') || a.id.localeCompare(b.id);
      }
      if (sortOption === 'name_asc') {
        return a.name.localeCompare(b.name, 'ru', { sensitivity: 'base' });
      }
      if (sortOption === 'name_desc') {
        return b.name.localeCompare(a.name, 'ru', { sensitivity: 'base' });
      }
      return 0;
    });

    return result;
  }, [games, activeTab, searchQuery, sortOption, profile?.name]);

  const favoritesCount = useMemo(() => {
    return games.filter((g) => Boolean(g.isFavorite)).length;
  }, [games]);

  return (
    <div className="relative w-full h-full min-h-screen flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto select-none font-pixel">
      {/* 1. Light Sunny Pixel Art Sky Background */}
      <img
        src={archiveBgImg}
        alt="Солнечный мир пиксельных игр"
        className="fixed inset-0 w-full h-full object-cover object-center pointer-events-none select-none -z-20"
      />

      {/* 2. Soft Bright White/Cream Protective Overlay for High Readability */}
      <div className="fixed inset-0 bg-gradient-to-b from-sky-100/75 via-amber-50/80 to-emerald-50/75 backdrop-blur-[1.5px] pointer-events-none -z-10" />

      {/* ========================================================================= */}
      {/* TOP HEADER: Chunky Pixel-Art Bar */}
      {/* ========================================================================= */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between pb-5 border-b-4 border-slate-900 gap-4">
        {/* Back Button */}
        <button
          onClick={() => {
            sound.playClick();
            onBackToMenu();
          }}
          className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs sm:text-sm font-black flex items-center gap-2 border-3 border-slate-900 shadow-[0_4px_0_#0f172a] hover:shadow-[0_2px_0_#0f172a] hover:translate-y-0.5 active:translate-y-1 active:shadow-none transition-all cursor-pointer shrink-0"
        >
          <ArrowLeft className="w-4 h-4 stroke-[3]" />
          <span>В меню</span>
        </button>

        {/* Creator Identity Centerpiece */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl overflow-hidden border-3 border-slate-900 shadow-[0_4px_0_#0f172a] bg-amber-400 shrink-0">
            <img
              src={avatar.imageUrl}
              alt={avatar.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>Архив проектов</span>
            </div>
            <h1 className="text-base sm:text-2xl font-black text-slate-950 truncate drop-shadow-sm">
              Игры автора {profile?.name || 'студии'}
            </h1>
          </div>
        </div>

        {/* Create Level Action Button */}
        <button
          onClick={() => {
            sound.playClick();
            onCreateNewGame();
          }}
          className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-300 hover:to-green-400 text-slate-950 text-xs sm:text-sm font-black flex items-center gap-2 border-3 border-slate-900 shadow-[0_4px_0_#064e3b] hover:shadow-[0_2px_0_#064e3b] hover:translate-y-0.5 active:translate-y-1 active:shadow-none transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span className="hidden sm:inline">Создать уровень</span>
          <span className="sm:hidden">Создать</span>
        </button>
      </header>

      {/* ========================================================================= */}
      {/* CONTROL PANEL: Search Bar, Favorites Filter, & Sorting Controls */}
      {/* ========================================================================= */}
      <section className="w-full max-w-6xl mx-auto mt-6 bg-white/95 rounded-2xl border-3 border-slate-900 p-3 sm:p-4 shadow-[0_6px_0_#0f172a] flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Left: Tab Switcher (All vs Favorites) */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('all');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 border-2 border-slate-900 transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-amber-400 text-slate-950 shadow-[0_3px_0_#0f172a] translate-y-[-1px]'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 shadow-none'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Все проекты</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-md bg-slate-900/10 text-[11px] font-black">
              {games.length}
            </span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('favorites');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 border-2 border-slate-900 transition-all cursor-pointer ${
              activeTab === 'favorites'
                ? 'bg-amber-400 text-slate-950 shadow-[0_3px_0_#0f172a] translate-y-[-1px]'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 shadow-none'
            }`}
          >
            <Star className="w-4 h-4 fill-amber-500 text-amber-700" />
            <span>Избранные</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-950 text-[11px] font-black">
              {favoritesCount}
            </span>
          </button>
        </div>

        {/* Right: Search Input + Sorting Dropdown */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Search Bar */}
          <div className="relative flex-1 sm:w-64 md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по названию или автору..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 border-2 border-slate-900 text-xs sm:text-sm text-slate-900 font-bold placeholder:text-slate-400 placeholder:font-normal focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-[0_2px_0_#0f172a]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-slate-200 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sorting Dropdown */}
          <div className="relative flex items-center shrink-0">
            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
            <select
              value={sortOption}
              onChange={(e) => {
                sound.playClick();
                setSortOption(e.target.value as SortOption);
              }}
              className="w-full sm:w-auto appearance-none pl-8 pr-8 py-2 rounded-xl bg-slate-50 hover:bg-white border-2 border-slate-900 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-[0_2px_0_#0f172a] cursor-pointer"
            >
              <option value="newest">Сначала новые</option>
              <option value="oldest">Сначала старые</option>
              <option value="name_asc">По названию (А-Я)</option>
              <option value="name_desc">По названию (Я-А)</option>
            </select>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* MAIN CARTRIDGE GRID: Physical Game Cartridge Cards */}
      {/* ========================================================================= */}
      <main className="w-full max-w-6xl mx-auto py-6 sm:py-8 flex-1">
        {games.length === 0 ? (
          /* Global Empty State: No Games Yet */
          <div className="h-full min-h-[45vh] flex flex-col items-center justify-center text-center p-6 space-y-5 bg-white/90 rounded-3xl border-4 border-slate-900 shadow-[0_8px_0_#0f172a] animate-in fade-in duration-300">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl overflow-hidden border-4 border-slate-900 shadow-[0_6px_0_#0f172a] bg-amber-400 animate-bounce">
              <img
                src={avatar.imageUrl}
                alt={avatar.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
            <div className="space-y-2 max-w-md">
              <h2 className="text-xl sm:text-3xl font-black text-slate-950">
                У тебя пока нет сохранённых игр!
              </h2>
              <p className="text-xs sm:text-sm text-slate-700 font-bold leading-relaxed">
                Нажми кнопку «Построить первую игру», чтобы создать свой уникальный мир с платформерами, монетками и боевыми монстрами!
              </p>
            </div>
            <button
              onClick={() => {
                sound.playClick();
                onCreateNewGame();
              }}
              className="py-3 sm:py-4 px-6 sm:px-8 rounded-2xl bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-black text-sm sm:text-base uppercase tracking-wider flex items-center gap-3 border-3 border-slate-900 shadow-[0_6px_0_#064e3b] active:translate-y-1 active:shadow-none transition-all cursor-pointer"
            >
              <Hammer className="w-5 h-5 stroke-[2.5]" />
              <span>ПОСТРОИТЬ ПЕРВУЮ ИГРУ</span>
            </button>
          </div>
        ) : filteredAndSortedGames.length === 0 ? (
          /* Filter/Search Empty State */
          <div className="h-full min-h-[40vh] flex flex-col items-center justify-center text-center p-6 space-y-4 bg-white/90 rounded-3xl border-4 border-slate-900 shadow-[0_8px_0_#0f172a]">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 border-3 border-slate-900 flex items-center justify-center text-3xl shadow-[0_4px_0_#0f172a]">
              🔍
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="text-lg font-black text-slate-950">
                Ничего не найдено
              </h3>
              <p className="text-xs text-slate-600 font-bold">
                {activeTab === 'favorites'
                  ? 'В списке «Избранные» пока нет проектов с такими параметрами.'
                  : `По запросу «${searchQuery}» проекты не найдены.`}
              </p>
            </div>
            <button
              onClick={() => {
                sound.playClick();
                setSearchQuery('');
                setActiveTab('all');
              }}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black border-2 border-slate-900 shadow-[0_3px_0_#0f172a] active:translate-y-0.5 cursor-pointer"
            >
              Сбросить фильтры
            </button>
          </div>
        ) : (
          /* Grid of Chunky Pixel-Art Physical Cartridges */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedGames.map((game) => {
              const theme = THEMES[game.levelData?.bgTheme || 'green_islands'] || THEMES['green_islands'];
              const itemCount = game.levelData?.items?.length || 0;
              const isFav = Boolean(game.isFavorite);

              const authorAvatarId = game.authorAvatarId || profile?.avatarId || 'avatar_1';
              const authorAvatar =
                PRESET_AVATARS.find((a) => a.id === authorAvatarId) || PRESET_AVATARS[0];
              const authorName = game.authorName || profile?.name || 'Автор';

              return (
                <div
                  key={game.id}
                  className="group relative bg-[#F8FAFC] border-4 border-slate-900 rounded-2xl overflow-hidden shadow-[0_8px_0_#0f172a] hover:shadow-[0_12px_0_#0f172a] hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between"
                >
                  {/* Cartridge Top Grip Ridges (Physical Cartridge Detail) */}
                  <div className="w-full bg-slate-200/90 border-b-2 border-slate-900 px-4 py-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <div className="w-5 h-1 rounded-full bg-slate-400" />
                      <div className="w-5 h-1 rounded-full bg-slate-400" />
                      <div className="w-5 h-1 rounded-full bg-slate-400" />
                    </div>
                    <span className="text-[9px] font-black tracking-widest uppercase text-slate-600">
                      SPW-CART #{game.id.slice(-4).toUpperCase()}
                    </span>
                  </div>

                  {/* Cartridge Sticker Window */}
                  <div className="relative h-34 bg-slate-950 overflow-hidden border-b-3 border-slate-900">
                    <img
                      src={theme.image}
                      alt={theme.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-bottom group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/30" />

                    {/* Theme Badge */}
                    <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-white/95 border-2 border-slate-900 text-[10px] font-black text-slate-950 flex items-center gap-1 shadow-[0_2px_0_#0f172a]">
                      <Sparkles className="w-3 h-3 text-amber-500 fill-amber-400" />
                      <span>{theme.name}</span>
                    </div>

                    {/* Star Favorite Button (Top Right of Cartridge Sticker) */}
                    <button
                      onClick={(e) => handleToggleFavorite(e, game.id)}
                      title={isFav ? 'Убрать из избранного' : 'Добавить в избранное'}
                      className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-xl border-2 border-slate-900 flex items-center justify-center shadow-[0_3px_0_#0f172a] active:translate-y-0.5 transition-transform cursor-pointer ${
                        isFav
                          ? 'bg-amber-300 hover:bg-amber-200 text-amber-950'
                          : 'bg-white/90 hover:bg-white text-slate-400 hover:text-amber-500'
                      }`}
                    >
                      <Star
                        className={`w-4 h-4 transition-transform ${
                          isFav ? 'fill-amber-500 text-amber-800 scale-110' : ''
                        }`}
                      />
                    </button>

                    {/* Block count pill bottom left of sticker */}
                    <div className="absolute bottom-2 left-2.5 px-2 py-0.5 rounded-md bg-slate-900/80 border border-slate-700 text-[10px] font-bold text-amber-300 backdrop-blur-xs">
                      {itemCount} блоков
                    </div>

                    {/* Big Green Play Button floating on sticker corner */}
                    <button
                      onClick={() => handlePlay(game)}
                      title="Играть в этот уровень"
                      className="absolute bottom-2 right-2.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-300 hover:to-green-400 text-slate-950 text-xs font-black flex items-center gap-1.5 border-2 border-slate-900 shadow-[0_3px_0_#064e3b] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-slate-950" />
                      <span>ИГРАТЬ</span>
                    </button>
                  </div>

                  {/* Cartridge Info Body */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3 bg-white">
                    <div>
                      {/* Author badge */}
                      <div className="flex items-center gap-2 mb-2 bg-slate-100 px-2 py-1 rounded-lg border border-slate-300 w-fit">
                        <div className="w-5 h-5 rounded-md overflow-hidden border border-slate-800 bg-amber-400 shrink-0">
                          <img
                            src={authorAvatar.imageUrl}
                            alt={authorName}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                            style={{ imageRendering: 'pixelated' }}
                          />
                        </div>
                        <span className="text-[11px] font-black text-slate-800 truncate max-w-[140px]">
                          {authorName}
                        </span>
                      </div>

                      {/* Level Name */}
                      <h3 className="text-base sm:text-lg font-black text-slate-950 group-hover:text-amber-600 transition-colors line-clamp-1">
                        {game.name}
                      </h3>

                      {/* Creation Date */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 font-bold">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Создан: {game.date}</span>
                      </div>
                    </div>

                    {/* Cartridge Action Footer */}
                    <div className="flex items-center justify-between pt-3 border-t-2 border-slate-200 gap-2">
                      {/* Edit Button */}
                      <button
                        onClick={() => handleEdit(game)}
                        className="flex-1 py-2 px-3 rounded-xl bg-sky-400 hover:bg-sky-300 border-2 border-slate-900 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 shadow-[0_3px_0_#0f172a] hover:shadow-[0_1px_0_#0f172a] hover:translate-y-0.5 active:translate-y-1 active:shadow-none transition-all cursor-pointer"
                      >
                        <Hammer className="w-3.5 h-3.5" />
                        <span>Изменить</span>
                      </button>

                      {/* Duplicate Button */}
                      <button
                        onClick={() => handleDuplicate(game)}
                        title="Создать копию картриджа"
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border-2 border-slate-900 text-slate-800 shadow-[0_3px_0_#0f172a] hover:shadow-[0_1px_0_#0f172a] hover:translate-y-0.5 active:translate-y-1 active:shadow-none transition-all cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => setDeleteConfirmId(game.id)}
                        title="Удалить уровень"
                        className="p-2 rounded-xl bg-rose-100 hover:bg-rose-200 border-2 border-slate-900 text-rose-800 shadow-[0_3px_0_#0f172a] hover:shadow-[0_1px_0_#0f172a] hover:translate-y-0.5 active:translate-y-1 active:shadow-none transition-all cursor-pointer"
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
      </main>

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL: Chunky Pixel Style */}
      {/* ========================================================================= */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white border-4 border-slate-900 rounded-3xl p-6 shadow-[0_10px_0_#0f172a] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 border-3 border-slate-900 text-rose-700 flex items-center justify-center shrink-0 text-2xl font-bold shadow-[0_3px_0_#0f172a]">
                🗑️
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-950">
                  Удалить картридж?
                </h4>
                <p className="text-xs text-slate-600 font-bold">
                  Этот уровень будет безвозвратно удален из твоих проектов.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border-2 border-slate-900 text-slate-800 text-xs font-black shadow-[0_2px_0_#0f172a] active:translate-y-0.5 cursor-pointer"
              >
                Отмена
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 border-2 border-slate-900 text-white text-xs font-black shadow-[0_2px_0_#0f172a] active:translate-y-0.5 cursor-pointer"
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
