const tz = () => process.env.TIMEZONE || 'Asia/Kolkata';

/** Today's date (YYYY-MM-DD) in the hospital's timezone. */
export const todayStr = () => new Date().toLocaleDateString('en-CA', { timeZone: tz() });

/** Current wall-clock time (HH:MM, 24h) in the hospital's timezone. */
export const nowTime = () =>
  new Date().toLocaleTimeString('en-GB', { timeZone: tz(), hour: '2-digit', minute: '2-digit', hour12: false });

export const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export const fromMinutes = (min) =>
  `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

/** 0 = Sunday … 6 = Saturday, for a YYYY-MM-DD string (timezone independent). */
export const weekdayOf = (dateStr) => new Date(`${dateStr}T00:00:00Z`).getUTCDay();
