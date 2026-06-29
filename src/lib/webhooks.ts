// Webhook trigger service for n8n backend automation
// This is a hidden layer - users never see or interact with n8n

const WEBHOOK_BASE_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || '';

// Event types that trigger n8n workflows
export enum WebhookEvent {
  JOB_CREATED = 'job_created',
  JOB_UPDATED = 'job_updated',
  USER_APPLIED = 'user_applied',
  CHAT_MESSAGE_SENT = 'chat_message_sent',
  JOB_ACCEPTED = 'job_accepted',
  JOB_COMPLETED = 'job_completed',
  REVIEW_SUBMITTED = 'review_submitted',
  USER_REGISTERED = 'user_registered',
}

// Activity log entry type (for UI feed - NOT workflow visualization)
export interface ActivityLogEntry {
  id: string;
  event_type: WebhookEvent;
  actor_user_id: string;
  actor_name: string;
  target_type?: 'job' | 'user' | 'message';
  target_id?: string;
  description: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// Trigger webhook - invisible to user, powers backend automation
async function triggerWebhook(event: WebhookEvent, data: Record<string, unknown>): Promise<void> {
  if (!WEBHOOK_BASE_URL) {
    // In development, log instead of sending
    console.log(`[Webhook] ${event}:`, data);
    return;
  }

  try {
    const response = await fetch(`${WEBHOOK_BASE_URL}/${event}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        data,
      }),
    });

    if (!response.ok) {
      console.error(`[Webhook] ${event} failed:`, response.status);
    }
  } catch (error) {
    console.error(`[Webhook] ${event} error:`, error);
  }
}

// Job Created trigger
export async function triggerJobCreated(job: {
  id: string;
  user_id: string;
  title: string;
  category: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  budget: number;
  job_date: string;
  job_time?: string;
}): Promise<void> {
  await triggerWebhook(WebhookEvent.JOB_CREATED, {
    job_id: job.id,
    user_id: job.user_id,
    title: job.title,
    category: job.category,
    location: job.location,
    coordinates: job.latitude && job.longitude
      ? { lat: job.latitude, lng: job.longitude }
      : null,
    budget: job.budget,
    job_date: job.job_date,
    job_time: job.job_time,
  });
}

// Job Updated trigger
export async function triggerJobUpdated(job: {
  id: string;
  user_id: string;
  status: string;
  assigned_to?: string;
}): Promise<void> {
  await triggerWebhook(WebhookEvent.JOB_UPDATED, {
    job_id: job.id,
    user_id: job.user_id,
    status: job.status,
    assigned_to: job.assigned_to,
  });
}

// User Applied trigger
export async function triggerUserApplied(application: {
  job_id: string;
  job_title: string;
  employer_id: string;
  worker_id: string;
  worker_name: string;
  message?: string;
}): Promise<void> {
  await triggerWebhook(WebhookEvent.USER_APPLIED, {
    job_id: application.job_id,
    job_title: application.job_title,
    employer_id: application.employer_id,
    worker_id: application.worker_id,
    worker_name: application.worker_name,
    message: application.message,
  });
}

// Chat Message Sent trigger
export async function triggerChatMessageSent(message: {
  message_id: string;
  job_id?: string;
  sender_id: string;
  sender_name: string;
  receiver_id: string;
  content: string;
  type: string;
}): Promise<void> {
  await triggerWebhook(WebhookEvent.CHAT_MESSAGE_SENT, {
    message_id: message.message_id,
    job_id: message.job_id,
    sender_id: message.sender_id,
    sender_name: message.sender_name,
    receiver_id: message.receiver_id,
    content: message.content,
    type: message.type,
  });
}

// Job Accepted trigger
export async function triggerJobAccepted(acceptance: {
  job_id: string;
  job_title: string;
  employer_id: string;
  worker_id: string;
  worker_name: string;
}): Promise<void> {
  await triggerWebhook(WebhookEvent.JOB_ACCEPTED, {
    job_id: acceptance.job_id,
    job_title: acceptance.job_title,
    employer_id: acceptance.employer_id,
    worker_id: acceptance.worker_id,
    worker_name: acceptance.worker_name,
  });
}

// Job Completed trigger
export async function triggerJobCompleted(completion: {
  job_id: string;
  job_title: string;
  employer_id: string;
  worker_id: string;
  employer_name: string;
  worker_name: string;
}): Promise<void> {
  await triggerWebhook(WebhookEvent.JOB_COMPLETED, {
    job_id: completion.job_id,
    job_title: completion.job_title,
    employer_id: completion.employer_id,
    worker_id: completion.worker_id,
    employer_name: completion.employer_name,
    worker_name: completion.worker_name,
  });
}

// Review Submitted trigger
export async function triggerReviewSubmitted(review: {
  review_id: string;
  job_id: string;
  reviewer_id: string;
  reviewer_name: string;
  reviewee_id: string;
  reviewee_name: string;
  rating: number;
  comment?: string;
}): Promise<void> {
  await triggerWebhook(WebhookEvent.REVIEW_SUBMITTED, {
    review_id: review.review_id,
    job_id: review.job_id,
    reviewer_id: review.reviewer_id,
    reviewer_name: review.reviewer_name,
    reviewee_id: review.reviewee_id,
    reviewee_name: review.reviewee_name,
    rating: review.rating,
    comment: review.comment,
  });
}

// User Registered trigger
export async function triggerUserRegistered(user: {
  user_id: string;
  email: string;
  full_name: string;
  is_worker: boolean;
  skills?: string[];
}): Promise<void> {
  await triggerWebhook(WebhookEvent.USER_REGISTERED, {
    user_id: user.user_id,
    email: user.email,
    full_name: user.full_name,
    is_worker: user.is_worker,
    skills: user.skills,
  });
}
