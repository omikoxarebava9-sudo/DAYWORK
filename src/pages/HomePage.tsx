import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../lib/language-context';
import { supabase, Job, Profile } from '../lib/supabase';
import { Search, MapPin, Calendar, Star, ChevronRight } from 'lucide-react';
import { getCategoryIcon, ConstructionIcon, CleaningIcon, DeliveryIcon, GardeningIcon, MovingIcon, RepairIcon, TutoringIcon, OtherIcon } from '../components/CategoryIcons';

export function HomePage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [jobs, setJobs] = useState<(Job & { profiles: Profile })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    const { data, error } = await supabase
      .from('jobs')
      .select('*, profiles!jobs_user_id_fkey(*)')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(6);

    if (!error && data) {
      setJobs(data as (Job & { profiles: Profile })[]);
    }
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return t('common.today');
    if (date.toDateString() === tomorrow.toDateString()) return t('common.tomorrow');
    return date.toLocaleDateString();
  };

  const categories = [
    { id: 'construction', Icon: ConstructionIcon, label: t('jobs.categories.construction') },
    { id: 'cleaning', Icon: CleaningIcon, label: t('jobs.categories.cleaning') },
    { id: 'delivery', Icon: DeliveryIcon, label: t('jobs.categories.delivery') },
    { id: 'gardening', Icon: GardeningIcon, label: t('jobs.categories.gardening') },
    { id: 'moving', Icon: MovingIcon, label: t('jobs.categories.moving') },
    { id: 'repair', Icon: RepairIcon, label: t('jobs.categories.repair') },
    { id: 'tutoring', Icon: TutoringIcon, label: t('jobs.categories.tutoring') },
    { id: 'other', Icon: OtherIcon, label: t('jobs.categories.other') },
  ];

  return (
    <div className="min-h-screen pt-16">
      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 via-zinc-900/95 to-zinc-950" />

        {/* Floating elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-400/5 rounded-full blur-3xl animate-float-delayed" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 leading-tight">
            {t('hero.title')}
          </h1>
          <p className="text-lg sm:text-xl text-zinc-400 mb-12">{t('hero.subtitle')}</p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl blur opacity-25 group-focus-within:opacity-40 transition-all duration-300" />
              <div className="relative flex items-center bg-zinc-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-zinc-700/50">
                <Search className="w-5 h-5 text-zinc-500 ml-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('hero.searchPlaceholder')}
                  className="w-full py-5 px-4 bg-transparent text-white placeholder-zinc-500 focus:outline-none text-lg"
                />
                <button
                  type="submit"
                  className="m-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold rounded-xl hover:from-amber-400 hover:to-amber-500 transition-all duration-200 shadow-lg shadow-amber-500/20"
                >
                  {t('hero.searchButton')}
                </button>
              </div>
            </div>
          </form>

          {/* Categories */}
          <div className="mt-12 flex flex-wrap justify-center gap-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => navigate(`/search?category=${cat.id}`)}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 backdrop-blur-sm rounded-xl text-zinc-300 hover:bg-zinc-700/50 hover:text-white border border-zinc-700/30 transition-all duration-200 text-sm"
              >
                <cat.Icon className="w-5 h-5 text-amber-400" />
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Jobs Section */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white">{t('jobs.latestJobs')}</h2>
          <button
            onClick={() => navigate('/search')}
            className="flex items-center gap-1 text-amber-400 hover:text-amber-300 transition-colors text-sm"
          >
            {t('common.search')}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse bg-zinc-800 rounded-2xl h-64" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16 bg-zinc-800/30 rounded-3xl border border-zinc-700/30">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center">
              <Search className="w-8 h-8 text-zinc-600" />
            </div>
            <p className="text-zinc-500">{t('jobs.noJobs')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} onClick={() => navigate(`/job/${job.id}`)} formatDate={formatDate} t={t} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function JobCard({
  job,
  onClick,
  formatDate,
  t,
}: {
  job: Job & { profiles: Profile };
  onClick: () => void;
  formatDate: (d: string) => string;
  t: (k: string) => string;
}) {
  return (
    <div
      onClick={onClick}
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
  );
}
