import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../lib/language-context';
import { useAuth } from '../lib/auth-context';
import { supabase, Job } from '../lib/supabase';
import { triggerJobCreated } from '../lib/webhooks';
import {
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Camera,
  Send,
  Loader2,
  X,
  Type,
  FileText,
} from 'lucide-react';

export function CreateJobPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user, isGuest, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other',
    location: '',
    budget: '',
    date: '',
    time: '',
    duration: '',
    contactInstructions: '',
    photos: [] as string[],
  });

  const categories = [
    { id: 'construction', label: t('jobs.categories.construction') },
    { id: 'cleaning', label: t('jobs.categories.cleaning') },
    { id: 'delivery', label: t('jobs.categories.delivery') },
    { id: 'gardening', label: t('jobs.categories.gardening') },
    { id: 'moving', label: t('jobs.categories.moving') },
    { id: 'repair', label: t('jobs.categories.repair') },
    { id: 'tutoring', label: t('jobs.categories.tutoring') },
    { id: 'other', label: t('jobs.categories.other') },
  ];

  if (isGuest) {
    return (
      <div className="min-h-screen pt-24 px-4 flex items-center justify-center">
        <div className="max-w-md w-full text-center bg-zinc-800/50 backdrop-blur-sm rounded-2xl border border-zinc-700/30 p-8">
          <h2 className="text-xl font-bold text-white mb-4">{t('auth.loginTitle')}</h2>
          <p className="text-zinc-400 mb-6">
            {t('jobs.create')} - {t('auth.login').toLowerCase()}
          </p>
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

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setFormData((prev) => ({
          ...prev,
          photos: [...prev.photos.slice(0, 4), result].slice(0, 4),
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const { data, error } = await supabase.from('jobs').insert({
        user_id: user.id,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        location: formData.location || null,
        budget: parseFloat(formData.budget),
        job_date: formData.date,
        job_time: formData.time || null,
        estimated_duration: formData.duration || null,
        photos: formData.photos,
        contact_instructions: formData.contactInstructions || null,
        status: 'open',
      }).select().maybeSingle();

      if (error) throw error;

      // Trigger n8n webhook for job creation (invisible backend automation)
      if (data) {
        await triggerJobCreated({
          id: data.id,
          user_id: user.id,
          title: formData.title,
          category: formData.category,
          location: formData.location || undefined,
          budget: parseFloat(formData.budget),
          job_date: formData.date,
          job_time: formData.time || undefined,
        });
      }

      navigate('/search');
    } catch (err) {
      console.error('Error creating job:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">{t('jobs.create')}</h1>
          <p className="text-zinc-400 mt-2">
            {profile?.full_name}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl border border-zinc-700/30 p-5">
            <label className="flex items-center gap-2 text-sm text-zinc-400 mb-3">
              <Type className="w-4 h-4" />
              {t('jobs.title')}
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
              required
            />
          </div>

          {/* Description */}
          <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl border border-zinc-700/30 p-5">
            <label className="flex items-center gap-2 text-sm text-zinc-400 mb-3">
              <FileText className="w-4 h-4" />
              {t('jobs.description')}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 resize-none"
              required
            />
          </div>

          {/* Category */}
          <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl border border-zinc-700/30 p-5">
            <label className="text-sm text-zinc-400 mb-3 block">{t('jobs.category')}</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat.id })}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    formData.category === cat.id
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                      : 'bg-zinc-900/50 text-zinc-400 border border-zinc-700/50 hover:border-zinc-600'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl border border-zinc-700/30 p-5">
            <label className="flex items-center gap-2 text-sm text-zinc-400 mb-3">
              <MapPin className="w-4 h-4" />
              {t('jobs.location')}
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          {/* Budget & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl border border-zinc-700/30 p-5">
              <label className="flex items-center gap-2 text-sm text-zinc-400 mb-3">
                <DollarSign className="w-4 h-4" />
                {t('jobs.budget')} ({t('common.lari')})
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
                required
              />
            </div>

            <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl border border-zinc-700/30 p-5">
              <label className="flex items-center gap-2 text-sm text-zinc-400 mb-3">
                <Calendar className="w-4 h-4" />
                {t('jobs.date')}
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
                required
              />
            </div>
          </div>

          {/* Time & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl border border-zinc-700/30 p-5">
              <label className="flex items-center gap-2 text-sm text-zinc-400 mb-3">
                <Clock className="w-4 h-4" />
                {t('jobs.time')}
              </label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl border border-zinc-700/30 p-5">
              <label className="text-sm text-zinc-400 mb-3 block">{t('jobs.duration')}</label>
              <input
                type="text"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="2-3 საათი / 2-3 hours"
                className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>

          {/* Photos */}
          <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl border border-zinc-700/30 p-5">
            <label className="flex items-center gap-2 text-sm text-zinc-400 mb-3">
              <Camera className="w-4 h-4" />
              {t('jobs.photos')}
            </label>

            <div className="grid grid-cols-4 gap-3 mb-3">
              {formData.photos.map((photo, index) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden group">
                  <img src={photo} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ))}
              {formData.photos.length < 4 && (
                <label className="aspect-square rounded-xl border-2 border-dashed border-zinc-700 flex items-center justify-center cursor-pointer hover:border-amber-500/50 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    multiple
                  />
                  <Camera className="w-6 h-6 text-zinc-600" />
                </label>
              )}
            </div>
          </div>

          {/* Contact Instructions */}
          <div className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl border border-zinc-700/30 p-5">
            <label className="text-sm text-zinc-400 mb-3 block">{t('jobs.contactInstructions')}</label>
            <textarea
              value={formData.contactInstructions}
              onChange={(e) => setFormData({ ...formData, contactInstructions: e.target.value })}
              rows={2}
              className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 resize-none"
              placeholder={t('jobs.contactInstructions')}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Send className="w-5 h-5" />
                {t('jobs.submit')}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
