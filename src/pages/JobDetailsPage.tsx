import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../lib/language-context';
import { useAuth } from '../lib/auth-context';
import { supabase, Job, Profile, Review } from '../lib/supabase';
import { triggerUserApplied } from '../lib/webhooks';
import {
  MapPin,
  Calendar,
  Clock,
  Banknote,
  Star,
  MessageCircle,
  Flag,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  CheckCircle,
  X,
  Loader2,
  Languages,
} from 'lucide-react';

export function JobDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user, profile, isGuest } = useAuth();
  const [job, setJob] = useState<(Job & { profiles: Profile }) | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [applying, setApplying] = useState(false);
  const [translated, setTranslated] = useState(false);

  useEffect(() => {
    if (id) fetchJob();
  }, [id]);

  const fetchJob = async () => {
    const { data, error } = await supabase
      .from('jobs')
      .select('*, profiles!jobs_user_id_fkey(*)')
      .eq('id', id)
      .maybeSingle();

    if (!error && data) {
      setJob(data as Job & { profiles: Profile });

      // Fetch reviews for user
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*, reviewer:profiles!reviews_reviewer_id_fkey(*)')
        .eq('reviewee_id', data.user_id)
        .limit(5);

      if (reviewsData) setReviews(reviewsData as Review[]);
    }
    setLoading(false);
  };

  const handleApply = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setApplying(true);

    // Create message
    await supabase.from('messages').insert({
      job_id: id,
      sender_id: user.id,
      receiver_id: job!.user_id,
      content: `I'm interested in this job: ${job!.title}`,
      type: 'text',
    });

    // Trigger n8n webhook for user applied (invisible backend automation)
    await triggerUserApplied({
      job_id: id!,
      job_title: job!.title,
      employer_id: job!.user_id,
      worker_id: user.id,
      worker_name: profile?.full_name || 'Unknown',
      message: `I'm interested in this job`,
    });

    setApplying(false);
    setShowApplyModal(false);
    navigate('/messages');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '';
    return timeStr;
  };

  const statusColors = {
    open: 'bg-green-500/20 text-green-400 border-green-500/30',
    in_progress: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    completed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  const statusLabels = {
    open: t('jobs.open'),
    in_progress: t('jobs.inProgress'),
    completed: t('jobs.completed'),
    cancelled: t('jobs.cancelled'),
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400">{t('common.noResults')}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 text-amber-400 hover:text-amber-300"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{t('jobs.details')}</span>
        </button>

        {/* Photo Gallery */}
        {job.photos.length > 0 && (
          <div className="relative mb-6 rounded-2xl overflow-hidden bg-zinc-800">
            <img
              src={job.photos[currentPhotoIndex]}
              alt={job.title}
              className="w-full h-64 sm:h-96 object-cover"
            />

            {job.photos.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentPhotoIndex(Math.max(0, currentPhotoIndex - 1))}
                  disabled={currentPhotoIndex === 0}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white disabled:opacity-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setCurrentPhotoIndex(Math.min(job.photos.length - 1, currentPhotoIndex + 1))}
                  disabled={currentPhotoIndex === job.photos.length - 1}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white disabled:opacity-50"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {job.photos.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPhotoIndex(i)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        i === currentPhotoIndex ? 'bg-white' : 'bg-white/30'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Job Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl border border-zinc-700/30 p-6">
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-2xl font-bold text-white">{job.title}</h1>
                <span className={`px-3 py-1 rounded-xl text-sm border ${statusColors[job.status]}`}>
                  {statusLabels[job.status]}
                </span>
              </div>

              <div className="flex items-center gap-4 text-amber-400 text-2xl font-bold mb-6">
                <Banknote className="w-6 h-6" />
                {job.budget.toLocaleString()} {t('common.lari')}
              </div>

              <div className="prose prose-invert max-w-none">
                <p className="text-zinc-300 whitespace-pre-wrap">{job.description}</p>
              </div>

              <button
                onClick={() => setTranslated(!translated)}
                className="mt-4 flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 transition-colors"
              >
                <Languages className="w-4 h-4" />
                {translated ? 'Original' : t('messages.translate')}
              </button>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              {job.job_date && (
                <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl border border-zinc-700/30 p-4">
                  <div className="flex items-center gap-2 text-zinc-400 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">{t('jobs.date')}</span>
                  </div>
                  <p className="text-white font-medium">{formatDate(job.job_date)}</p>
                </div>
              )}

              {job.job_time && (
                <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl border border-zinc-700/30 p-4">
                  <div className="flex items-center gap-2 text-zinc-400 mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">{t('jobs.time')}</span>
                  </div>
                  <p className="text-white font-medium">{formatTime(job.job_time)}</p>
                </div>
              )}

              {job.location && (
                <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl border border-zinc-700/30 p-4">
                  <div className="flex items-center gap-2 text-zinc-400 mb-1">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{t('jobs.location')}</span>
                  </div>
                  <p className="text-white font-medium">{job.location}</p>
                </div>
              )}

              {job.estimated_duration && (
                <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl border border-zinc-700/30 p-4">
                  <div className="flex items-center gap-2 text-zinc-400 mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">{t('jobs.duration')}</span>
                  </div>
                  <p className="text-white font-medium">{job.estimated_duration}</p>
                </div>
              )}
            </div>

            {/* Contact Instructions */}
            {job.contact_instructions && (
              <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl border border-zinc-700/30 p-6">
                <h3 className="text-lg font-semibold text-white mb-2">{t('jobs.contactInstructions')}</h3>
                <p className="text-zinc-400">{job.contact_instructions}</p>
              </div>
            )}
          </div>

          {/* Right: Profile & Actions */}
          <div className="space-y-6">
            {/* Customer Profile */}
            <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl border border-zinc-700/30 p-6">
              <h3 className="text-sm text-zinc-400 mb-4">{t('profile.customerProfile')}</h3>

              <div
                className="flex items-center gap-4 cursor-pointer"
                onClick={() => navigate(`/profile/${job.user_id}`)}
              >
                <div className="w-16 h-16 rounded-full bg-zinc-700 flex items-center justify-center overflow-hidden">
                  {job.profiles.avatar_url ? (
                    <img src={job.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl text-zinc-400">{job.profiles.full_name?.[0] || '?'}</span>
                  )}
                </div>
                <div>
                  <p className="text-white font-semibold">{job.profiles.full_name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1 text-amber-400">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-sm">{job.profiles.rating.toFixed(1)}</span>
                    </div>
                    {job.profiles.is_verified && (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                <div className="bg-zinc-900/50 rounded-xl p-3">
                  <p className="text-xl font-bold text-white">{job.profiles.completed_jobs}</p>
                  <p className="text-xs text-zinc-400">{t('profile.completedJobs')}</p>
                </div>
                <div className="bg-zinc-900/50 rounded-xl p-3">
                  <p className="text-xl font-bold text-amber-400">{job.profiles.rating.toFixed(1)}</p>
                  <p className="text-xs text-zinc-400">{t('profile.rating')}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              {job.status === 'open' && job.user_id !== user?.id && (
                <button
                  onClick={() => setShowApplyModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold rounded-xl hover:from-amber-400 hover:to-amber-500 transition-all duration-200 shadow-lg shadow-amber-500/20"
                >
                  {t('jobs.apply')}
                </button>
              )}

              <button
                onClick={() => {
                  if (!user) navigate('/login');
                  else navigate(`/messages?job=${id}&to=${job.user_id}`);
                }}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-zinc-800/50 border border-zinc-700/30 text-white font-semibold rounded-xl hover:bg-zinc-700/50 transition-all duration-200"
              >
                <MessageCircle className="w-5 h-5" />
                {t('jobs.chat')}
              </button>

              <button
                onClick={() => setShowReportModal(true)}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-zinc-800/50 border border-red-500/20 text-red-400 font-medium rounded-xl hover:bg-red-500/10 transition-all duration-200"
              >
                <Flag className="w-5 h-5" />
                {t('jobs.report')}
              </button>
            </div>

            {/* Reviews */}
            {reviews.length > 0 && (
              <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl border border-zinc-700/30 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">{t('reviews.title')}</h3>
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-zinc-700/30 last:border-0 pb-4 last:pb-0">
                      <div className="flex items-center gap-2 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating ? 'text-amber-400 fill-current' : 'text-zinc-600'
                            }`}
                          />
                        ))}
                      </div>
                      {review.comment && (
                        <p className="text-zinc-400 text-sm">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-700/50 p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">{t('jobs.apply')}</h2>
              <button onClick={() => setShowApplyModal(false)}>
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>
            <p className="text-zinc-400 mb-6">
              {t('jobs.apply')} - {job.title}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowApplyModal(false)}
                className="flex-1 px-4 py-3 bg-zinc-800 text-zinc-400 rounded-xl hover:bg-zinc-700"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleApply}
                disabled={applying}
                className="flex-1 px-4 py-3 bg-amber-500 text-black font-semibold rounded-xl hover:bg-amber-400"
              >
                {applying ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : t('jobs.apply')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-700/50 p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">{t('report.title')}</h2>
              <button onClick={() => setShowReportModal(false)}>
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>
            <p className="text-zinc-400 mb-6">{t('report.success')}</p>
            <button
              onClick={() => setShowReportModal(false)}
              className="w-full px-4 py-3 bg-amber-500 text-black font-semibold rounded-xl hover:bg-amber-400"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
