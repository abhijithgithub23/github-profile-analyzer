// Keeping heavy logic out of components
export const formatNumber = (num) => {
  if (!num) return 0;
  return num > 999 ? (num/1000).toFixed(1) + 'k' : num;
};