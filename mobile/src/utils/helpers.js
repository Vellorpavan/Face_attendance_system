import { supabase } from "../config/supabase";

/**
 * Continuous Period Fix:
 * If P3 has no attendance, reuse P2 data (same subject + date)
 */
export function applyContinuousPeriodFix(records, timetableSlots) {
  if (!records?.length || !timetableSlots?.length) return records;

  const sortedSlots = [...timetableSlots].sort((a, b) => {
    const aNum = parseInt(a.period.replace("P", ""), 10);
    const bNum = parseInt(b.period.replace("P", "", 10));
    return aNum - bNum;
  });

  const recordMap = {};
  records.forEach((r) => {
    const key = `${r.subject_id}-${r.period}`;
    recordMap[key] = r;
  });

  for (let i = 1; i < sortedSlots.length; i++) {
    const prev = sortedSlots[i - 1];
    const curr = sortedSlots[i];
    if (
      prev.subject_id === curr.subject_id &&
      prev.subject_id !== null
    ) {
      const prevKey = `${prev.subject_id}-${prev.period}`;
      const currKey = `${curr.subject_id}-${curr.period}`;
      if (recordMap[prevKey] && !recordMap[currKey]) {
        const reused = { ...recordMap[prevKey], period: curr.period };
        records.push(reused);
        recordMap[currKey] = reused;
      }
    }
  }

  return records;
}

/**
 * Get continuous period range for a subject on a given day
 */
export function getContinuousPeriodRange(timetableSlots, startPeriod) {
  const sortedSlots = [...timetableSlots].sort((a, b) => {
    const aNum = parseInt(a.period.replace("P", ""), 10);
    const bNum = parseInt(b.period.replace("P", "", 10));
    return aNum - bNum;
  });

  const startSlot = sortedSlots.find((s) => s.period === startPeriod);
  if (!startSlot || !startSlot.subject_id) return [startPeriod];

  const periods = [startPeriod];
  const startIdx = sortedSlots.indexOf(startSlot);

  for (let i = startIdx + 1; i < sortedSlots.length; i++) {
    if (sortedSlots[i].subject_id === startSlot.subject_id) {
      periods.push(sortedSlots[i].period);
    } else {
      break;
    }
  }

  return periods;
}

/**
 * Format date as YYYY-MM-DD
 */
export function formatDate(date) {
  if (!date) date = new Date();
  const d = new Date(date);
  return d.toISOString().split("T")[0];
}

/**
 * Get day of week as 3-letter uppercase
 */
export function getDayOfWeek(date) {
  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  return days[new Date(date).getDay()];
}

/**
 * Relative time string
 */
export function timeAgo(dateString) {
  if (!dateString) return "";
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now - past;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return past.toLocaleDateString();
}

/**
 * Calculate attendance percentage
 */
export function calcPercentage(present, total) {
  if (!total) return 0;
  return Math.round((present / total) * 100);
}

/**
 * Get attendance grade label
 */
export function getGrade(pct) {
  if (pct >= 85) return { label: "Excellent", color: "#34A853" };
  if (pct >= 60) return { label: "Average", color: "#FBBC04" };
  return { label: "Low", color: "#EA4335" };
}
