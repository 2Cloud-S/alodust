import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Clean up expired invite links daily at 3 AM UTC
crons.daily(
  "cleanup-expired-invites",
  { hourUTC: 3, minuteUTC: 0 },
  internal.invites.cleanupExpiredInvites
);

export default crons;
