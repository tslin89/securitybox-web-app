// Note: Event labels and types are now dynamically loaded from the API
// through the AuthContext.eventCodes array instead of hardcoded values.

// Buckets for charts/summary – you can tweak any time without changing SQL
// These can still be used for client-side categorization if needed
export const EVENT_SETS = {
  deliveries: ['C003'],
  retrievals: ['C004'],
  returns:    ['C008', 'C010'],
  incidents:  ['C007', 'C009'], // parcel stolen / box stolen
};
