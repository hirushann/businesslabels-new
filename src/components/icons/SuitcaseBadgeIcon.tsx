type SuitcaseBadgeIconProps = {
  className?: string;
};

export default function SuitcaseBadgeIcon({ className }: SuitcaseBadgeIconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 12 12">
      <rect x="1" y="4" width="10" height="7" rx="1" />
      <path d="M4 4V3a2 2 0 014 0v1" />
    </svg>
  );
}
