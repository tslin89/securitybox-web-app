export const EVENT_LABELS: Record<string, string> = {
  C000: 'Wifi connected',
  C001: 'Box opened',
  C002: 'Box closed',
  C003: 'Parcel delivered',
  C004: 'Parcel retrieved',
  C005: 'Security deactivated',
  C006: 'Security reactivated',
  C007: 'Parcel stolen',
  C008: 'Parcel returned',
  C009: 'Box stolen',
  C010: 'Box returned',
};

// Buckets for charts/summary – you can tweak any time without changing SQL
export const EVENT_SETS = {
  deliveries: ['C003'],
  retrievals: ['C004'],
  returns:    ['C008', 'C010'],
  incidents:  ['C007', 'C009'], // parcel stolen / box stolen
};
