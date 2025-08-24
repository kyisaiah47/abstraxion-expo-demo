export interface CountdownResult {
  timeRemaining: string;
  hasExpired: boolean;
  totalSeconds: number;
}

/**
 * Calculate countdown for task release based on escrow period
 * @param createdAt - Task creation timestamp
 * @param escrowHours - Hours until release (default 24)
 * @returns Countdown result with formatted time
 */
export function calculateTaskCountdown(
  createdAt: Date,
  escrowHours: number = 24
): CountdownResult {
  const now = new Date();
  const releaseTime = new Date(createdAt.getTime() + escrowHours * 60 * 60 * 1000);
  const timeDiff = releaseTime.getTime() - now.getTime();

  if (timeDiff <= 0) {
    return {
      timeRemaining: "Released",
      hasExpired: true,
      totalSeconds: 0,
    };
  }

  const totalSeconds = Math.floor(timeDiff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let timeRemaining: string;
  
  if (hours > 0) {
    timeRemaining = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    timeRemaining = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  return {
    timeRemaining: `Releases in ${timeRemaining}`,
    hasExpired: false,
    totalSeconds,
  };
}

/**
 * Get countdown text for different task statuses
 * @param task - Task object
 * @returns Countdown text or null if not applicable
 */
export function getTaskCountdownText(task: any): string | null {
  // Only show countdown for active tasks that are pending release
  if (task.status === "pending_release" || task.status === "awaiting_proof") {
    const countdown = calculateTaskCountdown(task.createdAt, 24); // 24 hour escrow
    return countdown.hasExpired ? null : countdown.timeRemaining;
  }
  
  return null;
}