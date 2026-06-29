import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../lib/language-context';
import { useAuth } from '../lib/auth-context';
import { supabase, Profile, Job, Review } from '../lib/supabase';
import {
  User,
  Star,
  CheckCircle,
  Edit2,
  Save,
  X,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Loader2,
  Plus,
} from 'lucide-react';

export function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user, profile: currentUserProfile, isGuest, updateProfile } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Profile>>({});
  const [skillInput, setSkillInput] = useState('');
  const [saving, setSaving] = useState(false);

  const isOwnProfile = id === user?.id || (!id && user?.id);

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    const targetId = id || user?.id;

    if (!targetId && !isGuest) {
      navigate('/login');
      return;
    }

    if (isGuest && !id) {
      setLoading(false);
      return;
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', targetId)
      .maybeSingle();

    if (profileData) {
      setProfile(profileData as Profile);
      setEditForm(profileData as Profile);

      // Fetch jobs
      const { data: jobsData } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', targetId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (jobsData) setJobs(jobsData as Job[]);

      // Fetch reviews
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*, reviewer:profiles!reviews_reviewer_id_fkey(*)')
        .eq('reviewee_id', targetId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (reviewsData) setReviews(reviewsData as Review[]);
    }

    setLoading(false);
  };

  const handleSave = async () => {
    if (!saving) return;
    setSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: editForm.full_name,
        phone: editForm.phone,
        bio: editForm.bio,
        skills: editForm.skills,
      })
      .eq('id', user!.id);

    if (!error) {
      setProfile(editForm as Profile);
      setEditing(false);
    }
    setSaving(false);
  };

  const addSkill = () => {
    if (skillInput.trim()) {
      setEditForm({
        ...editForm,
        skills: [...(editForm.skills || []), skillInput.trim()],
      });
      setSkillInput('');
    }
  };

  const removeSkill = (index: number) => {
    setEditForm({
      ...editForm,
      skills: editForm.skills?.filter((_, i) => i !== index),
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  if (isGuest && !id) {
    return (
      <div className="min-h-screen pt-24 px-4 flex items-center justify-center">
        <div className="max-w-md w-full text-center bg-zinc-800/50 backdrop-blur-sm rounded-2xl border border-zinc-700/30 p-8">
          <h2 className="text-xl font-bold text-white mb-4">{t('auth.loginTitle')}</h2>
          <p className="text-zinc-400 mb-6">{t('profile.noProfile')}</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold rounded-xl"
          >
            {t('nav.login')}
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400">{t('profile.noProfile')}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 text-amber-400 hover:text-amber-300"
          >
            {t('nav.home')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl border border-zinc-700/30 p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-zinc-700 flex items-center justify-center overflow-hidden border-2 border-amber-500/30">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl text-zinc-400">{profile.full_name?.[0] || '?'}</span>
                )}
              </div>
              {profile.is_verified && (
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-2 border-zinc-800">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-white">{profile.full_name}</h1>
                  <p className="text-zinc-400 mt-1">
                    {profile.is_worker ? t('profile.workerProfile') : t('profile.customerProfile')}
                  </p>
                </div>
                {isOwnProfile && (
                  <button
                    onClick={() => setEditing(!editing)}
                    className="p-2 rounded-xl bg-zinc-700/50 text-zinc-400 hover:text-amber-400 hover:bg-zinc-700 transition-colors"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-4">
                <div className="flex items-center gap-1 text-amber-400">
                  <Star className="w-5 h-5 fill-current" />
                  <span className="font-semibold">{profile.rating.toFixed(1)}</span>
                </div>
                <div className="text-zinc-400">
                  {profile.completed_jobs} {t('profile.completedJobs')}
                </div>
                <div className="flex items-center gap-1 text-zinc-400">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">
                    {t('profile.memberSince')} {formatDate(profile.created_at)}
                  </span>
                </div>
              </div>

              {/* Skills */}
              {(profile.skills?.length > 0 || editing) && (
                <div className="mt-4">
                  <p className="text-sm text-zinc-400 mb-2">{t('profile.skills')}</p>
                  <div className="flex flex-wrap gap-2">
                    {(editing ? editForm.skills : profile.skills)?.map((skill, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-zinc-700/50 rounded-lg text-sm text-zinc-300 flex items-center gap-1"
                      >
                        {skill}
                        {editing && (
                          <button onClick={() => removeSkill(i)}>
                            <X className="w-3 h-3 text-zinc-500 hover:text-red-400" />
                          </button>
                        )}
                      </span>
                    ))}
                    {editing && (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={skillInput}
                          onChange={(e) => setSkillInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                          placeholder="+"
                          className="w-20 px-2 py-1 bg-zinc-700/30 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bio and Contact */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-zinc-400 mb-1">{t('profile.bio')}</p>
              {editing ? (
                <textarea
                  value={editForm.bio || ''}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  rows={3}
                  className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 resize-none"
                />
              ) : (
                <p className="text-white">{profile.bio || '-'}</p>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-zinc-400 mb-1">{t('profile.phone')}</p>
                {editing ? (
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="tel"
                      value={editForm.phone || ''}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 bg-zinc-900/50 border border-zinc-700/50 rounded-xl text-white focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                ) : (
                  <p className="text-white flex items-center gap-2">
                    <Phone className="w-4 h-4 text-zinc-500" />
                    {profile.phone || '-'}
                  </p>
                )}
              </div>

              <div>
                <p className="text-sm text-zinc-400 mb-1">{t('auth.email')}</p>
                <p className="text-white flex items-center gap-2">
                  <Mail className="w-4 h-4 text-zinc-500" />
                  {profile.email}
                </p>
              </div>
            </div>
          </div>

          {editing && (
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setEditing(false)}
                className="px-4 py-2 bg-zinc-700 text-zinc-300 rounded-xl hover:bg-zinc-600"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-amber-500 text-black font-semibold rounded-xl hover:bg-amber-400 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? t('common.loading') : t('common.save')}
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Jobs */}
          <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl border border-zinc-700/30 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">{t('profile.myJobs')}</h2>
            {jobs.length === 0 ? (
              <p className="text-zinc-500 text-center py-8">{t('jobs.noJobs')}</p>
            ) : (
              <div className="space-y-3">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => navigate(`/job/${job.id}`)}
                    className="p-4 bg-zinc-900/50 rounded-xl cursor-pointer hover:bg-zinc-900 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-white font-medium">{job.title}</p>
                        <p className="text-zinc-500 text-sm">{formatDate(job.created_at)}</p>
                      </div>
                      <span className="text-amber-400 font-medium">
                        {job.budget.toLocaleString()} {t('common.lari')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reviews */}
          <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl border border-zinc-700/30 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">{t('profile.myReviews')}</h2>
            {reviews.length === 0 ? (
              <p className="text-zinc-500 text-center py-8">{t('reviews.noReviews')}</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="p-4 bg-zinc-900/50 rounded-xl">
                    <div className="flex items-center gap-1 mb-2">
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
                      <p className="text-zinc-300 text-sm">{review.comment}</p>
                    )}
                    <p className="text-zinc-500 text-xs mt-2">{formatDate(review.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
