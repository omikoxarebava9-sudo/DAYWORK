import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../lib/language-context';
import { supabase, Job, Profile } from '../lib/supabase';
import {
  Search,
  Filter,
  MapPin,
  Calendar,
  Star,
  X,
} from 'lucide-react';
import { getCategoryIcon } from '../components/CategoryIcons';

export function SearchPage() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<(Job & { profiles: Profile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || 'all',
    minBudget: searchParams.get('minBudget') || '',
    maxBudget: searchParams.get('maxBudget') || '',
    sortBy: searchParams.get('sortBy') || 'newest',
  });

  useEffect(() => {
    searchJobs();
  }, [searchParams]);

  const searchJobs = async () => {
    setLoading(true);
    let query = supabase
      .from('jobs')
      .select('*, profiles!jobs_user_id_fkey(*)')
      .eq('status', 'open');

    const q = searchParams.get('q');
    if (q) {
      query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
    }

    const category = searchParams.get('category');
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    const minBudget = searchParams.get('minBudget');
    if (minBudget) {
      query = query.gte('budget', parseFloat(minBudget));
    }

    const maxBudget = searchParams.get('maxBudget');
    if (maxBudget) {
      query = query.lte('budget', parseFloat(maxBudget));
    }

    const sortBy = searchParams.get('sortBy') || 'newest';
    if (sortBy === 'newest') {
      query = query.order('created_at', { ascending: false });
    } else if (sortBy === 'highestBudget') {
      query = query.order('budget', { ascending: false });
    } else if (sortBy === 'lowestBudget') {
      query = query.order('budget', { ascending: true });
    }

    const { data, error } = await query;

    if (!error && data) {
      setJobs(data as (Job & { profiles: Profile })[]);
    }
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (filters.category !== 'all') params.set('category', filters.category);
    if (filters.minBudget) params.set('minBudget', filters.minBudget);
    if (filters.maxBudget) params.set('maxBudget', filters.maxBudget);
    params.set('sortBy', filters.sortBy);
    setSearchParams(params);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setFilters({
      category: 'all',
      minBudget: '',
      maxBudget: '',
      sortBy: 'newest',
    });
    setSearchParams({});
  };

  const categories = [
    { id: 'all', label: t('jobs.categories.all') },
    { id: 'construction', label: t('jobs.categories.construction') },
    { id: 'cleaning', label: t('jobs.categories.cleaning') },
    { id: 'delivery', label: t('jobs.categories.delivery') },
    { id: 'gardening', label: t('jobs.categories.gardening') },
    { id: 'moving', label: t('jobs.categories.moving') },
    { id: 'repair', label: t('jobs.categories.repair') },
    { id: 'tutoring', label: t('jobs.categories.tutoring') },
    { id: 'other', label: t('jobs.categories.other') },
  ];

  const sortOptions = [
    { id: 'newest', label: t('filters.newest') },
    { id: 'highestBudget', label: t('filters.highestBudget') },
    { id: 'lowestBudget', label: t('filters.lowestBudget') },
  ];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen pt-20 pb-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">{t('nav.search')}</h1>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('hero.searchPlaceholder')}
                className="w-full pl-12 pr-4 py-3 bg-zinc-800/50 border border-zinc-700/30 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 rounded-xl border transition-colors ${
                showFilters
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                  : 'bg-zinc-800/50 border-zinc-700/30 text-zinc-400 hover:border-zinc-600'
              }`}
            >
              <Filter className="w-5 h-5" />
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold rounded-xl hover:from-amber-400 hover:to-amber-500 transition-all"
            >
              {t('common.search')}
            </button>
          </div>
        </form>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl border border-zinc-700/30 p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">{t('filters.apply')}</h3>
              <button
                onClick={resetFilters}
                className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
              >
                {t('filters.reset')}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Category */}
              <div>
                <label className="text-sm text-zinc-400 mb-2 block">{t('filters.category')}</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Min Budget */}
              <div>
                <label className="text-sm text-zinc-400 mb-2 block">
                  {t('jobs.budget')} ({t('common.lari')}) - {t('filters.from') || 'მინ'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={filters.minBudget}
                  onChange={(e) => setFilters({ ...filters, minBudget: e.target.value })}
                  className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
                />
              </div>

              {/* Max Budget */}
              <div>
                <label className="text-sm text-zinc-400 mb-2 block">
                  {t('jobs.budget')} ({t('common.lari')}) - {t('filters.to') || 'მაქს'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={filters.maxBudget}
                  onChange={(e) => setFilters({ ...filters, maxBudget: e.target.value })}
                  className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
                />
              </div>

              {/* Sort By */}
              <div>
                <label className="text-sm text-zinc-400 mb-2 block">{t('filters.sortBy') || 'დალაგება'}</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                  className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={applyFilters}
                className="px-6 py-2 bg-amber-500 text-black font-semibold rounded-xl hover:bg-amber-400 transition-colors"
              >
                {t('filters.apply')}
              </button>
            </div>
          </div>
        )}

        {/* Active Filters */}
        {(filters.category !== 'all' || filters.minBudget || filters.maxBudget) && (
          <div className="flex flex-wrap gap-2 mb-6">
            {filters.category !== 'all' && (
              <span className="px-3 py-1 bg-zinc-800/50 rounded-lg text-sm text-zinc-400 flex items-center gap-2">
                {categories.find((c) => c.id === filters.category)?.label}
                <button onClick={() => { setFilters({ ...filters, category: 'all' }); applyFilters(); }}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.minBudget && (
              <span className="px-3 py-1 bg-zinc-800/50 rounded-lg text-sm text-zinc-400">
                {t('filters.from') || 'მინ'}: {filters.minBudget} {t('common.lari')}
              </span>
            )}
            {filters.maxBudget && (
              <span className="px-3 py-1 bg-zinc-800/50 rounded-lg text-sm text-zinc-400">
                {t('filters.to') || 'მაქს'}: {filters.maxBudget} {t('common.lari')}
              </span>
            )}
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse bg-zinc-800 rounded-2xl h-64" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16 bg-zinc-800/30 rounded-3xl border border-zinc-700/30">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center">
              <Search className="w-8 h-8 text-zinc-600" />
            </div>
            <p className="text-zinc-500">{t('common.noResults')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <div
                key={job.id}
                onClick={() => navigate(`/job/${job.id}`)}
                className="group cursor-pointer bg-zinc-800/50 backdrop-blur-sm rounded-2xl border border-zinc-700/30 hover:border-amber-500/50 transition-all duration-300 overflow-hidden hover:shadow-xl hover:shadow-amber-500/5"
              >
                {job.photos.length > 0 ? (
                  <div className="h-40 overflow-hidden">
                    <img
                      src={job.photos[0]}
                      alt={job.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                ) : (
                  <div className="h-40 bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center">
                    {(() => {
                      const CategoryIcon = getCategoryIcon(job.category);
                      return <CategoryIcon className="w-12 h-12 text-amber-400/50" />;
                    })()}
                  </div>
                )}

                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                      {job.title}
                    </h3>
                    <span className="text-amber-400 font-bold">
                      {job.budget.toLocaleString()} {t('common.lari')}
                    </span>
                  </div>

                  <p className="text-zinc-400 text-sm mb-4 line-clamp-2">{job.description}</p>

                  <div className="flex items-center gap-4 text-xs text-zinc-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatDate(job.job_date)}</span>
                    </div>
                    {job.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="truncate max-w-24">{job.location}</span>
                      </div>
                    )}
                  </div>

                  {job.profiles && (
                    <div className="mt-4 pt-4 border-t border-zinc-700/50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center overflow-hidden">
                          {job.profiles.avatar_url ? (
                            <img src={job.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs text-zinc-400">{job.profiles.full_name?.[0] || '?'}</span>
                          )}
                        </div>
                        <span className="text-sm text-zinc-400">{job.profiles.full_name}</span>
                      </div>
                      {job.profiles.rating > 0 && (
                        <div className="flex items-center gap-1 text-amber-400">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span className="text-xs">{job.profiles.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
