// Progress controller — aggregated child progress data for the charts dashboard
// Fetches and computes summary statistics, session history, goal status counts,
// and behaviour frequency trends for a single child. Designed to power the
// Recharts-based progress visualisation on the frontend.
const prisma = require("../../config/prisma");

// GET /api/v1/progress/:childId
// Returns a comprehensive progress snapshot for the given child:
//   - child: basic name/ID info
//   - summary: totalSessions, totalDuration (minutes), goalCounts by status
//   - sessions: chronological list of session dates and durations
//   - goals: full goal records with current status
//   - behaviourTrends: per-behaviour arrays of { date, frequency } logs
// Throws 404 if the child does not exist.
exports.getChildProgress = async (req, res, next) => {
  try {
    const { childId } = req.params;

    // Verify the child exists before running the heavier queries
    const child = await prisma.child.findUnique({ where: { id: childId }, select: { id: true, firstName: true, lastName: true } });
    if (!child) return res.status(404).json({ message: "Child not found" });

    // Fetch sessions, goals, and behaviours in parallel for efficiency.
    // Logs are embedded in the behaviour query via Prisma include.
    const [sessions, goals, behaviours] = await Promise.all([
      prisma.session.findMany({
        where: { childId },
        orderBy: { sessionDate: "asc" },
        select: { id: true, sessionDate: true, duration: true, note: { select: { goalsWorkedOn: true } } },
      }),
      prisma.goal.findMany({
        where: { childId },
        orderBy: { createdAt: "asc" },
      }),
      prisma.behaviour.findMany({
        where: { childId },
        include: { logs: { orderBy: { recordedAt: "asc" }, select: { frequency: true, recordedAt: true } } },
      }),
    ]);

    // Compute summary statistics
    const totalSessions = sessions.length;
    const totalDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const goalCounts = { NOT_STARTED: 0, IN_PROGRESS: 0, ACHIEVED: 0, ARCHIVED: 0 };
    for (const g of goals) goalCounts[g.status]++;

    // Transform behaviour logs into a chart-friendly format:
    // one entry per behaviour with its time-ordered frequency data points
    const behaviourTrends = behaviours.map((b) => ({
      name: b.name,
      logs: b.logs.map((l) => ({ date: l.recordedAt, frequency: l.frequency })),
    }));

    return res.status(200).json({
      child,
      summary: { totalSessions, totalDuration, goalCounts },
      sessions: sessions.map((s) => ({ id: s.id, date: s.sessionDate, duration: s.duration })),
      goals,
      behaviourTrends,
    });
  } catch (error) {
    next(error);
  }
};
