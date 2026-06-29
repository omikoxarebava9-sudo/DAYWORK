import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../lib/language-context';
import { supabase, Job, Profile } from '../lib/supabase';
import { Loader2, MapPin, Star, X } from 'lucide-react';

export function MapPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<(Job & { profiles: Profile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<(Job & { profiles: Profile }) | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchJobs();
    getUserLocation();
  }, []);

  const fetchJobs = async () => {
    const { data, error } = await supabase
      .from('jobs')
      .select('*, profiles!jobs_user_id_fkey(*)')
      .eq('status', 'open')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    if (!error && data) {
      setJobs(data as (Job & { profiles: Profile })[]);
    }
    setLoading(false);
  };

  const getUserLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          // Default to Tbilisi, Georgia
          setUserLocation({ lat: 41.7151, lng: 44.8271 });
        }
      );
    } else {
      setUserLocation({ lat: 41.7151, lng: 44.8271 });
    }
  };

  // Simulated map markers since we can't use actual map library
  const renderMapMarkers = () => {
    return jobs.map((job, index) => {
      // Generate pseudo-random position based on job id
      const seed = parseInt(job.id.replace(/[^0-9]/g, '').slice(0, 6), 10) || index;
      const offsetX = ((seed % 100) / 100) * 0.1 - 0.05;
      const offsetY = ((seed % 1000) / 1000) * 0.1 - 0.05;

      const x = 50 + offsetY * 200;
      const y = 50 + offsetX * 200;

      return (
        <button
          key={job.id}
          onClick={() => setSelectedJob(job)}
          className="absolute transform -translate-x-1/2 -translate-y-full"
          style={{ left: `${x}%`, top: `${y}%` }}
        >
          <div className="relative group">
            <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:scale-125 transition-transform">
              <MapPin className="w-4 h-4 text-black" />
            </div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent border-t-amber-500" />

            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-zinc-800 rounded-lg text-white text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              <p className="font-medium">{job.title}</p>
              <p className="text-amber-400">{job.budget.toLocaleString()} {t('common.lari')}</p>
            </div>
          </div>
        </button>
      );
    });
  };

  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-7xl mx-auto">
        <div className="p-4">
          <h1 className="text-2xl font-bold text-white mb-4">{t('map.title')}</h1>
        </div>

        {/* Map Container */}
        <div className="relative h-[calc(100vh-8rem)] bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 mx-4">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
            </div>
          ) : (
            <>
              {/* Map Background Pattern */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

              {/* Gradient overlays */}
              <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-zinc-900 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-zinc-900 to-transparent" />

              {/* User Location */}
              {userLocation && (
                <div
                  className="absolute transform -translate-x-1/2 -translate-y-1/2"
                  style={{ left: '50%', top: '50%' }}
                >
                  <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white animate-pulse" />
                  <div className="absolute inset-0 w-4 h-4 bg-blue-500/30 rounded-full animate-ping" />
                </div>
              )}

              {/* Job Markers */}
              {renderMapMarkers()}
            </>
          )}

          {/* Job count badge */}
          <div className="absolute top-4 left-4 px-4 py-2 bg-zinc-800/90 backdrop-blur-sm rounded-xl border border-zinc-700/50">
            <p className="text-zinc-400 text-sm">
              <span className="text-amber-400 font-bold">{jobs.length}</span>{' '}
              {jobs.length === 1 ? 'job' : 'jobs'}
            </p>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 px-4 py-3 bg-zinc-800/90 backdrop-blur-sm rounded-xl border border-zinc-700/50 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-500 rounded-full" />
              <span className="text-zinc-400 text-sm">{t('jobs.open')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
              <span className="text-zinc-400 text-sm">{t('profile.title')}</span>
            </div>
          </div>
        </div>

        {/* Selected Job Panel */}
        {selectedJob && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-800 z-50">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-start gap-4">
                {selectedJob.photos.length > 0 && (
                  <img
                    src={selectedJob.photos[0]}
                    alt={selectedJob.title}
                    className="w-24 h-24 rounded-xl object-cover"
                  />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{selectedJob.title}</h3>
                      <p className="text-zinc-400 text-sm line-clamp-1">{selectedJob.description}</p>
                    </div>
                    <button onClick={() => setSelectedJob(null)} className="p-1 text-zinc-400 hover:text-white">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-amber-400 font-bold">
                      {selectedJob.budget.toLocaleString()} {t('common.lari')}
                    </span>
                    {selectedJob.profiles && (
                      <div className="flex items-center gap-1 text-zinc-400 text-sm">
                        <span>{selectedJob.profiles.full_name}</span>
                        {selectedJob.profiles.rating > 0 && (
                          <>
                            <Star className="w-3 h-3 text-amber-400 fill-current" />
                            <span>{selectedJob.profiles.rating.toFixed(1)}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/job/${selectedJob.id}`)}
                  className="px-6 py-3 bg-amber-500 text-black font-semibold rounded-xl hover:bg-amber-400 transition-colors"
                >
                  {t('jobs.details')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
