export const calculatePercentage = (score, total) => {
  if (!Number.isFinite(Number(score)) || !Number.isFinite(Number(total)) || Number(total) <= 0) return 0;
  return Math.max(0, (Number(score) / Number(total)) * 100);
};

export const resolveAttemptStatus = (expiresAt, now = Date.now()) =>
  now >= new Date(expiresAt).getTime() ? 'auto_submitted' : 'submitted';
