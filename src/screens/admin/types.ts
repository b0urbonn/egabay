export type Section = 'overview' | 'groups' | 'terminals' | 'vehicles' | 'users' | 'reports' | 'audit';
export type Inspector = { title: string; subtitle: string; rows: { label: string; value: string }[]; detail?: string; onEdit?: () => void; editLabel?: string };
