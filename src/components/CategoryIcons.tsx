interface IconProps {
  className?: string;
}

export function ConstructionIcon({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 21h18M3 7v14M21 7v14M6 7V4a1 1 0 011-1h10a1 1 0 011 1v3M6 7h12M6 11h12M6 15h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 4v3M15 4v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export function CleaningIcon({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C8 2 5 5 5 9c0 6 7 13 7 13s7-7 7-13c0-4-3-7-7-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 6c-1.5 0-2.5 1.5-2.5 2.5S10.5 11 12 11s2.5 1.5 2.5 2.5S13.5 15 12 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="12" cy="7" r="0.5" fill="currentColor"/>
    </svg>
  );
}

export function DeliveryIcon({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="4" width="15" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
      <path d="M16 8h4l3 4v6h-7V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="6" cy="18" r="2" stroke="currentColor" strokeWidth="2"/>
      <circle cx="18" cy="18" r="2" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );
}

export function GardeningIcon({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 22V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M12 10c-4-4-4-8 0-8s4 4 0 8z" stroke="currentColor" strokeWidth="2" fill="none"/>
      <path d="M12 10c4-4 4-8 0-8" stroke="currentColor" strokeWidth="2"/>
      <path d="M8 14c-2 0-4-1-5-3 3-1 6 1 9-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M16 14c2 0 4-1 5-3-3-1-6 1-9-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export function MovingIcon({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="8" width="20" height="10" rx="2" stroke="currentColor" strokeWidth="2"/>
      <path d="M6 8V6a2 2 0 012-2h8a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2"/>
      <circle cx="6" cy="18" r="2" stroke="currentColor" strokeWidth="2"/>
      <circle cx="18" cy="18" r="2" stroke="currentColor" strokeWidth="2"/>
      <path d="M10 12h4M12 10v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export function RepairIcon({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.7-3.7a1 1 0 000-1.4l-1.6-1.6a1 1 0 00-1.4 0l-3.7 3.7z" stroke="currentColor" strokeWidth="2"/>
      <path d="M12 8L4 16v3h3l8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2 2l20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export function TutoringIcon({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 19.5v-15A2.5 2.5 0 016.5 2H20v20H6.5a2 2 0 01-2-2v-.5z" stroke="currentColor" strokeWidth="2"/>
      <path d="M8 7h8M8 11h8M8 15h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export function OtherIcon({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export function getCategoryIcon(category: string) {
  switch (category) {
    case 'construction':
      return ConstructionIcon;
    case 'cleaning':
      return CleaningIcon;
    case 'delivery':
      return DeliveryIcon;
    case 'gardening':
      return GardeningIcon;
    case 'moving':
      return MovingIcon;
    case 'repair':
      return RepairIcon;
    case 'tutoring':
      return TutoringIcon;
    default:
      return OtherIcon;
  }
}
