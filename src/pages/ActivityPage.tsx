import { useState, useEffect } from 'react';
import { useLanguage } from '../lib/language-context';
import { useAuth } from '../lib/auth-context';
import { supabase, Job, Message, Review } from '../lib/supabase';
import {
  Briefcase,
  MessageCircle,
  Star,
  UserCheck,
  CheckCircle,
  Clock,
  Loader2,
} from 'lucide-react';

type ActivityItem = {
  id: string;
  type: 'job_created' | 'job_accepted' | 'job_completed' | 'message' | 'review' | 'user_joined';
  timestamp: string;
  actor_name: string;
  actor_id: string;
  target_name?: string;
  job_title?: string;
  description: string;
};

export function ActivityPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, [user]);

  const fetchActivities = async () => {
    if (!user) return;

    // Fetch recent jobs
    const { data: jobs } = await supabase
      .from('jobs')
      .select('id, title, created_at, user_id, status, profiles!jobs_user_id_fkey(full_name)')
      .order('created_at', { ascending: false })
      .limit(20);

    // Fetch recent messages
    const { data: messages } = await supabase
      .from('messages')
      .select('id, created_at, sender_id, receiver_id, sender:profiles!messages_sender_id_fkey(full_name), receiver:profiles!messages_receiver_id_fkey(full_name)')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(20);

    // Fetch recent reviews
    const { data: reviews } = await supabase
      .from('reviews')
      .select('id, created_at, rating, reviewer_id, reviewee_id, reviewer:profiles!reviews_reviewer_id_fkey(full_name), reviewee:profiles!reviews_reviewee_id_fkey(full_name)')
      .order('created_at', { ascending: false })
      .limit(10);

    const allActivities: ActivityItem[] = [];

    // Process jobs
    if (jobs) {
      jobs.forEach((job: any) => {
        const profile = job.profiles as { full_name: string | null };
        const actorName = profile?.full_name || 'Unknown';

        allActivities.push({
          id: `job-${job.id}`,
          type: job.status === 'completed' ? 'job_completed' :
                job.status === 'in_progress' ? 'job_accepted' : 'job_created',
          timestamp: job.created_at,
          actor_name: actorName,
          actor_id: job.user_id,
          job_title: job.title,
          description: job.status === 'completed' ? 'completed a job' :
                       job.status === 'in_progress' ? 'started working on' : 'posted a new job',
        });
      });
    }

    // Process messages
    if (messages) {
      messages.forEach((msg: any) => {
        const senderName = msg.sender?.full_name || 'Someone';
        const receiverName = msg.receiver?.full_name || 'Someone';

        allActivities.push({
          id: `msg-${msg.id}`,
          type: 'message',
          timestamp: msg.created_at,
          actor_name: senderName,
          actor_id: msg.sender_id,
          target_name: receiverName,
          description: 'sent a message',
        });
      });
    }

    // Process reviews
    if (reviews) {
      reviews.forEach((rev: any) => {
        const reviewerName = rev.reviewer?.full_name || 'Someone';
        const revieweeName = rev.reviewee?.full_name || 'Someone';

        allActivities.push({
          id: `rev-${rev.id}`,
          type: 'review',
          timestamp: rev.created_at,
          actor_name: reviewerName,
          actor_id: rev.reviewer_id,
          target_name: revieweeName,
          description: `left a ${rev.rating}-star review`,
        });
      });
    }

    // Sort by timestamp
    allActivities.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    setActivities(allActivities.slice(0, 50));
    setLoading(false);
  };

  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'job_created':
        return <Briefcase className="w-5 h-5" />;
      case 'job_accepted':
        return <UserCheck className="w-5 h-5" />;
      case 'job_completed':
        return <CheckCircle className="w-5 h-5" />;
      case 'message':
        return <MessageCircle className="w-5 h-5" />;
      case 'review':
        return <Star className="w-5 h-5" />;
      case 'user_joined':
        return <UserCheck className="w-5 h-5" />;
    }
  };

  const getIconColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'job_created':
        return 'text-amber-400 bg-amber-500/20';
      case 'job_accepted':
        return 'text-blue-400 bg-blue-500/20';
      case 'job_completed':
        return 'text-green-400 bg-green-500/20';
      case 'message':
        return 'text-purple-400 bg-purple-500/20';
      case 'review':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'user_joined':
        return 'text-cyan-400 bg-cyan-500/20';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen pt-20 pb-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">{t('notifications.title')}</h1>
          <p className="text-zinc-400 mt-2">
            Latest activity on the platform
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-16 bg-zinc-800/30 rounded-3xl border border-zinc-700/30">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center">
              <Clock className="w-8 h-8 text-zinc-600" />
            </div>
            <p className="text-zinc-500">{t('notifications.noNotifications')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="bg-zinc-800/50 backdrop-blur-sm rounded-2xl border border-zinc-700/30 p-4 hover:border-zinc-600/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${getIconColor(activity.type)}`}>
                    {getIcon(activity.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-white">
                      <span className="font-semibold">{activity.actor_name}</span>{' '}
                      <span className="text-zinc-400">{activity.description}</span>
                      {activity.job_title && (
                        <span className="text-amber-400"> {activity.job_title}</span>
                      )}
                      {activity.target_name && (
                        <>
                          {' '}<span className="text-zinc-400">to</span>{' '}
                          <span className="font-medium">{activity.target_name}</span>
                        </>
                      )}
                    </p>
                    <p className="text-zinc-500 text-sm mt-1">
                      {formatTime(activity.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
