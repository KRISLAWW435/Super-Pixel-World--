/**
 * Super Pixel World - My Games Screen (Архив проектов и картриджей)
 *
 * Unified Chunky Pixel Art UI:
 * - Softer, darker overlay on pixel-art background so cards stand out crisply
 * - Dark slate pixel-art panel cartridges with chunky borders and hard drop shadows
 * - Readable normal-case typography (Fredoka for body, Press Start 2P for small badges/numbers)
 * - Concise "Поиск" placeholder and fully visible level names
 * - Favorites star toggle, search by name/author, and sorting
 */

import React, { useMemo, useState } from 'react';
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
  Settings,
} from 'lucide-react';
import { sound } from '../audio/soundEngine';
import { THEMES } from '../game/constants';
import { SaveManager } from '../services/storageManager';
import { LevelData } from '../types/game';
import { PRESET_AVATARS, SavedGame, UserProfile } from '../types/storage';
import { SettingsModal } from './SettingsModal';
import archiveBgImg from '../assets/images/pixel_archive_sky_bg_1792309583036.jpg';
import bgGreenIslands from '../assets/images/bg_green_islands.webp';

interface MyGamesScreenProps {
  onBackToMenu: () => void;
  onPlayGame: (levelData: LevelData) => void;
  onEditGame: (levelData: LevelData) => void;
  onCreateNewGame: () => void;
  profile?: UserProfile | null;
}

type FilterTab = 'all' | 'favorites';
type SortOption = 'newest' | 'oldest' | 'name_asc' | 'name_desc';

export const MyGamesScreen: React.FC<MyGamesScreenProps> = ({
  onBackToMenu,
  onPlayGame,
  onEditGame,
  onCreateNewGame,
  profile,
}) => {
  const [games, setGames] = useState<SavedGame[]>(() =>
    SaveManager.getSavedGamesForProfile(profile?.id)
  );
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Search & Filter State
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
    <div className="relative w-full h-full min-h-screen flex flex-col p-3 sm:p-5 lg:p-7 overflow-y-auto select-none text-[var(--text-main)]">
      {/* 1. Dynamic Game Backgrounds: Light Mode shows lush Green Islands with sunny pastel glow, Dark Mode shows Archive Sky */}
      <div className="fixed inset-0 pointer-events-none select-none -z-10 overflow-hidden">
        <img
          src={bgGreenIslands}
          alt="Солнечные острова"
          className="w-full h-full object-cover object-center light-theme-bg"
        />
        <img
          src={archiveBgImg}
          alt="Солнечный мир пиксельных игр"
          className="w-full h-full object-cover object-center dark-theme-bg"
        />
        {/* Soft pastel wash in light mode, retro pixel grid in dark mode */}
        <div className="absolute inset-0 bg-sky-100/35 backdrop-blur-[1px] light-theme-bg" />
        <div className="absolute inset-0 bg-slate-950/60 retro-grid-pattern dark-theme-bg" />
      </div>

      {/* ========================================================================= */}
      {/* TOP HEADER: Retro Console Bar */}
      {/* ========================================================================= */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between pb-4 border-b-4 border-[var(--border-color)] gap-3 shrink-0">
        {/* Back Button */}
        <button
          onClick={() => {
            sound.playClick();
            onBackToMenu();
          }}
          className="retro-btn bg-[var(--panel-bg)] hover:bg-amber-400 hover:text-slate-950 text-[var(--text-main)] px-3 py-2 flex items-center gap-1.5 shrink-0"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
          <span>В МЕНЮ</span>
        </button>

        {/* Creator Identity Centerpiece */}
        <div className="retro-panel px-3 py-1.5 flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded border-2 border-black overflow-hidden bg-amber-400 shrink-0">
            <img
              src={avatar.imageUrl}
              alt={avatar.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
          <div className="min-w-0">
            <div className="text-[9px] font-pixel uppercase tracking-wider text-amber-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Архив картриджей</span>
            </div>
            <h1 className="text-xs sm:text-sm font-bold text-[var(--text-main)] truncate font-pixel">
              {profile?.name || 'Игры автора'}
            </h1>
          </div>
        </div>

        {/* Right Header Actions: Settings & Create Level */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              sound.playClick();
              setIsSettingsOpen(true);
            }}
            title="Настройки игры, звука, темы и масштаба"
            className="retro-btn-sm bg-amber-400 hover:bg-amber-300 text-slate-950 px-2.5 py-2 flex items-center gap-1.5"
          >
            <Settings className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline text-[9px] font-pixel font-bold">НАСТРОЙКИ</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onCreateNewGame();
            }}
            className="retro-btn bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3.5 py-2 flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span className="hidden sm:inline text-xs font-pixel font-bold">СОЗДАТЬ</span>
            <span className="sm:hidden text-xs font-pixel font-bold">+</span>
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* CONTROL PANEL: Search Bar, Favorites Filter, & Sorting Controls */}
      {/* ========================================================================= */}
      <section className="w-full max-w-6xl mx-auto mt-5 bg-[var(--panel-bg)] rounded-[4px] border-4 border-[var(--border-color)] p-3 sm:p-4 shadow-[4px_4px_0px_var(--shadow-color)] flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Left: Tab Switcher (All vs Favorites) */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('all');
            }}
            className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-[4px] text-xs sm:text-sm font-bold flex items-center gap-2 border-2 border-[var(--border-color)] transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[var(--accent-amber)] text-slate-950 shadow-[2px_2px_0px_var(--shadow-color)] translate-y-[-1px]'
                : 'bg-[var(--card-subtle)] hover:bg-[var(--slot-bg)] text-[var(--text-main)] shadow-none'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Все проекты</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-[2px] bg-black/15 text-[10px] font-pixel">
              {games.length}
            </span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('favorites');
            }}
            className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-[4px] text-xs sm:text-sm font-bold flex items-center gap-2 border-2 border-[var(--border-color)] transition-all cursor-pointer ${
              activeTab === 'favorites'
                ? 'bg-[var(--accent-amber)] text-slate-950 shadow-[2px_2px_0px_var(--shadow-color)] translate-y-[-1px]'
                : 'bg-[var(--card-subtle)] hover:bg-[var(--slot-bg)] text-[var(--text-main)] shadow-none'
            }`}
          >
            <Star className="w-4 h-4 fill-amber-500 text-amber-700" />
            <span>Избранные</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-[2px] bg-black/15 text-[10px] font-pixel">
              {favoritesCount}
            </span>
          </button>
        </div>

        {/* Right: Search Input + Sorting Dropdown */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Search Bar - Small "Поиск" placeholder */}
          <div className="relative flex-1 sm:w-60 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск"
              className="w-full pl-9 pr-8 py-1.5 sm:py-2 rounded-[4px] bg-[var(--slot-bg)] border-2 border-[var(--border-color)] text-xs sm:text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] placeholder:font-normal focus:bg-[var(--panel-bg)] focus:outline-none focus:border-[var(--accent-amber)] shadow-[2px_2px_0px_var(--shadow-color)] font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-[2px] hover:bg-[var(--card-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sorting Dropdown */}
          <div className="relative flex items-center shrink-0">
            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)] pointer-events-none" />
            <select
              value={sortOption}
              onChange={(e) => {
                sound.playClick();
                setSortOption(e.target.value as SortOption);
              }}
              className="w-full sm:w-auto appearance-none pl-8 pr-8 py-1.5 sm:py-2 rounded-[4px] bg-[var(--slot-bg)] hover:bg-[var(--card-subtle)] border-2 border-[var(--border-color)] text-xs sm:text-sm font-bold text-[var(--text-main)] focus:outline-none focus:border-[var(--accent-amber)] shadow-[2px_2px_0px_var(--shadow-color)] cursor-pointer"
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
          <div className="h-full min-h-[45vh] flex flex-col items-center justify-center text-center p-6 space-y-4 bg-[var(--panel-bg)] rounded-[4px] border-4 border-[var(--border-color)] shadow-[6px_6px_0px_var(--shadow-color)] animate-in fade-in duration-300">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[4px] overflow-hidden border-4 border-[var(--border-color)] shadow-[4px_4px_0px_var(--shadow-color)] bg-amber-400 animate-bounce">
              <img
                src={avatar.imageUrl}
                alt={avatar.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
            <div className="space-y-1 max-w-md">
              <h2 className="text-lg sm:text-2xl font-bold font-body text-[var(--text-main)]">
                У тебя пока нет сохранённых игр!
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed font-body font-normal">
                Нажми кнопку «Построить первую игру», чтобы создать свой уникальный мир с платформами, монетками и боевыми врагами!
              </p>
            </div>
            <button
              onClick={() => {
                sound.playClick();
                onCreateNewGame();
              }}
              className="retro-btn py-3 px-6 rounded-[4px] bg-[var(--accent-emerald)] hover:brightness-110 active:brightness-95 text-white font-pixel text-xs sm:text-sm flex items-center gap-2 border-4 border-[var(--border-color)] shadow-[4px_4px_0px_var(--shadow-color)] transition-all cursor-pointer"
            >
              <Hammer className="w-4 h-4 stroke-[2.5]" />
              <span>Построить первую игру</span>
            </button>
          </div>
        ) : filteredAndSortedGames.length === 0 ? (
          /* Filter/Search Empty State */
          <div className="h-full min-h-[40vh] flex flex-col items-center justify-center text-center p-6 space-y-3 bg-[var(--panel-bg)] rounded-[4px] border-4 border-[var(--border-color)] shadow-[6px_6px_0px_var(--shadow-color)]">
            <div className="w-14 h-14 rounded-[4px] bg-[var(--slot-bg)] border-2 border-[var(--border-color)] flex items-center justify-center text-2xl shadow-[3px_3px_0px_var(--shadow-color)]">
              🔍
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="text-base font-bold font-body text-[var(--text-main)]">
                Ничего не найдено
              </h3>
              <p className="text-xs text-[var(--text-muted)] font-body font-normal">
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
              className="retro-btn-sm px-4 py-2 rounded-[4px] bg-[var(--accent-amber)] hover:brightness-110 text-slate-950 text-xs font-bold border-2 border-[var(--border-color)] shadow-[2px_2px_0px_var(--shadow-color)] cursor-pointer"
            >
              Сбросить фильтры
            </button>
          </div>
        ) : (
          /* Grid of Authentic Physical SNES / NES Cartridges */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
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
                  className="group retro-cartridge overflow-hidden flex flex-col justify-between"
                >
                  {/* Top Cartridge Grip Ridges & Notches */}
                  <div
                    className="w-full border-b-4 border-[var(--border-color)] px-3.5 py-1.5 flex items-center justify-between"
                    style={{ backgroundColor: 'var(--cartridge-notch)' }}
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-1.5 rounded-xs bg-black/40" />
                      <div className="w-4 h-1.5 rounded-xs bg-black/40" />
                      <div className="w-4 h-1.5 rounded-xs bg-black/40" />
                      <div className="w-4 h-1.5 rounded-xs bg-black/40" />
                    </div>
                    <span className="text-[9px] font-pixel text-[var(--text-muted)] font-bold">
                      NES-SPW-{game.id.slice(-4).toUpperCase()}
                    </span>
                  </div>

                  {/* Physical Cartridge Label Sticker */}
                  <div
                    className="m-2.5 p-2.5 border-2 border-[var(--border-color)] rounded-[2px] shadow-inner flex flex-col gap-2.5 flex-1 justify-between"
                    style={{ backgroundColor: 'var(--cartridge-label-bg)' }}
                  >
                    {/* Artwork Preview Window with Retro Badge */}
                    <div className="relative h-28 sm:h-32 bg-slate-950 rounded-[2px] overflow-hidden border-2 border-[var(--border-color)]">
                      <img
                        src={theme.image}
                        alt={theme.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-bottom group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/30 pointer-events-none" />

                      {/* Theme Badge */}
                      <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-[2px] bg-black/85 border border-[var(--accent-amber)] text-[9px] font-pixel text-[var(--accent-amber)] flex items-center gap-1 shadow-sm">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>{theme.name}</span>
                      </div>

                      {/* Star Favorite Button */}
                      <button
                        onClick={(e) => handleToggleFavorite(e, game.id)}
                        title={isFav ? 'Убрать из избранного' : 'Добавить в избранное'}
                        className={`retro-btn-sm absolute top-1.5 right-1.5 w-7 h-7 flex items-center justify-center cursor-pointer rounded-[2px] border border-[var(--border-color)] ${
                          isFav
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-black/80 text-slate-400 hover:text-amber-400'
                        }`}
                      >
                        <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                      </button>

                      {/* Block count badge */}
                      <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-[2px] bg-black/85 border border-slate-700 text-[9px] font-pixel text-slate-300">
                        {itemCount} БЛОКОВ
                      </div>
                    </div>

                    {/* Cartridge Title & Author Details */}
                    <div className="space-y-1.5">
                      <h3
                        className="text-xs font-pixel font-bold text-[var(--text-main)] group-hover:text-[var(--accent-amber)] transition-colors line-clamp-2 leading-relaxed"
                        title={game.name}
                      >
                        {game.name}
                      </h3>

                      <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-1 border-t border-[var(--border-color)]/20 font-body">
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-4 rounded-[2px] overflow-hidden border border-[var(--border-color)] bg-amber-400 shrink-0">
                            <img
                              src={authorAvatar.imageUrl}
                              alt={authorName}
                              className="w-full h-full object-cover"
                              style={{ imageRendering: 'pixelated' }}
                            />
                          </div>
                          <span className="font-semibold truncate max-w-[120px]">{authorName}</span>
                        </div>
                        <span className="flex items-center gap-1 text-[10px]">
                          <Calendar className="w-3 h-3" />
                          {game.date}
                        </span>
                      </div>
                    </div>

                    {/* Cartridge Chunky Retro Action Buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t-2 border-[var(--border-color)]/30">
                      {/* Play Button */}
                      <button
                        onClick={() => handlePlay(game)}
                        className="retro-btn flex-1 py-2 bg-[var(--accent-emerald)] hover:brightness-110 active:brightness-95 text-white flex items-center justify-center gap-1.5 text-xs font-pixel rounded-[4px] border-2 border-[var(--border-color)] shadow-[2px_2px_0px_var(--shadow-color)]"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>ИГРАТЬ</span>
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => handleEdit(game)}
                        title="Открыть в конструкторе"
                        className="retro-btn-sm py-1.5 px-2.5 bg-[var(--accent-amber)] hover:brightness-110 text-slate-950 flex items-center justify-center gap-1 rounded-[4px] border-2 border-[var(--border-color)] shadow-[2px_2px_0px_var(--shadow-color)] text-[10px]"
                      >
                        <Hammer className="w-3 h-3" />
                        <span>ИЗМЕНИТЬ</span>
                      </button>

                      {/* Duplicate Button */}
                      <button
                        onClick={() => handleDuplicate(game)}
                        title="Создать копию картриджа"
                        className="retro-btn-sm p-1.5 bg-[var(--card-subtle)] hover:bg-[var(--accent-amber)] hover:text-slate-950 text-[var(--text-main)] rounded-[4px] border-2 border-[var(--border-color)] shadow-[2px_2px_0px_var(--shadow-color)]"
                      >
                        <Copy className="w-3 h-3" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => setDeleteConfirmId(game.id)}
                        title="Удалить картридж"
                        className="retro-btn-sm p-1.5 bg-[var(--accent-rose)] hover:brightness-110 text-white rounded-[4px] border-2 border-[var(--border-color)] shadow-[2px_2px_0px_var(--shadow-color)]"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Physical Cartridge Bottom Connector Gold Pins */}
                  <div className="w-full bg-black/90 py-1 px-4 flex items-center justify-center gap-1.5 border-t-2 border-[var(--border-color)]">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} className="w-2.5 h-1.5 bg-amber-400/80 rounded-xs shadow-xs" />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL: Retro RPG Double Border Window */}
      {/* ========================================================================= */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent select-none animate-in fade-in duration-150">
          <div className="w-full max-w-sm retro-modal p-5 shadow-[6px_6px_0px_#000000] space-y-4 text-[var(--text-main)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-rose-500/20 text-rose-500 border-2 border-black flex items-center justify-center shrink-0 text-xl font-bold">
                🗑️
              </div>
              <div>
                <h4 className="text-sm font-bold font-pixel text-[var(--text-main)]">
                  УДАЛИТЬ КАРТРИДЖ?
                </h4>
                <p className="text-xs text-[var(--text-muted)] font-normal mt-0.5">
                  Этот уровень будет безвозвратно удален из твоих проектов.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t-2 border-black/30">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="retro-btn-sm px-3.5 py-1.5 bg-[var(--card-subtle)] text-[var(--text-main)]"
              >
                Отмена
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="retro-btn-sm px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold"
              >
                Да, удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};
