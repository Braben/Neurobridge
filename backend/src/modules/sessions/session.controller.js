const prisma = require("../../config/prisma");
const { emitToUser } = require("../../sockets");
const { notifyChildParents } = require("../../services/notification.service");

const sessionFields = {
  id: true, childId: true, therapistId: true, bookingId: true, sessionDate: true, duration: true, createdAt: true,
  note: { select: { id: true, goalsWorkedOn: true, observations: true, recommendations: true, extraNotes: true, createdAt: true, updatedAt: true } },
  child: { select: { id: true, firstName: true, lastName: true } },
  therapist: { select: { id: true, firstName: true, lastName: true, avatar: true, areaofexpertise: true } },
  booking: { select: { id: true, status: true } },
};

exports.listSessions = async (req, res, next) => {
  try {
    const { childId } = req.query;
    let where = {};

    if (childId) where.childId = childId;
    if (req.user.role === "PARENT") {
      where.child = { parents: { some: { parentId: req.user.id } } };
    } else if (req.user.role === "THERAPIST") {
      where.therapistId = req.user.id;
    }

    const sessions = await prisma.session.findMany({
      where,
      select: sessionFields,
      orderBy: { sessionDate: "desc" },
    });

    return res.status(200).json({ sessions });
  } catch (error) {
    next(error);
  }
};

exports.createSession = async (req, res, next) => {
  try {
    const { childId, sessionDate, duration, bookingId, therapistId } = req.body;
    const owningTherapistId = req.user.role === "ADMIN" ? therapistId : req.user.id;

    if (!owningTherapistId) {
      return res.status(400).json({ message: "Therapist ID is required when an admin creates a session" });
    }

    const childRecord = await prisma.child.findUnique({ where: { id: childId }, select: { id: true, firstName: true, lastName: true, deletedAt: true } });
    if (!childRecord || childRecord.deletedAt) {
      return res.status(404).json({ message: "Child not found" });
    }

    if (bookingId) {
      const booking = await prisma.booking.findFirst({
        where: { id: bookingId, childId, therapistId: owningTherapistId },
        select: { id: true },
      });
      if (!booking) {
        return res.status(400).json({ message: "Booking does not match this therapist and child" });
      }
    }

    const assignment = await prisma.therapistAssignment.findUnique({
      where: { childId_therapistId: { childId, therapistId: owningTherapistId } },
    });
    if (!assignment) {
      return res.status(403).json({ message: "Therapist is not assigned to this child" });
    }

    const session = await prisma.session.create({
      data: { childId, therapistId: owningTherapistId, bookingId: bookingId || null, sessionDate: new Date(sessionDate), duration: duration || null },
      select: sessionFields,
    });

    // Real-time: notify the child's parents that a session was logged, and
    // emit session:created back to the therapist so their session list updates.
    const therapist = await prisma.user.findUnique({
      where: { id: owningTherapistId },
      select: { firstName: true, lastName: true },
    });
    await notifyChildParents(
      childId,
      "New Session Logged",
      `${therapist.firstName} ${therapist.lastName} logged a session for ${childRecord.firstName} ${childRecord.lastName}`,
    );
    emitToUser(owningTherapistId, "session:created", { session });

    return res.status(201).json({ message: "Session created successfully", session });
  } catch (error) {
    next(error);
  }
};

exports.getSession = async (req, res, next) => {
  try {
    const { id } = req.params;

    let where = { id };
    if (req.user.role === "PARENT") {
      where.child = { parents: { some: { parentId: req.user.id } } };
    } else if (req.user.role === "THERAPIST") {
      where.therapistId = req.user.id;
    }

    const session = await prisma.session.findFirst({ where, select: sessionFields });
    if (!session) return res.status(404).json({ message: "Session not found" });

    return res.status(200).json({ session });
  } catch (error) {
    next(error);
  }
};

exports.updateSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { sessionDate, duration } = req.body;

    const existing = await prisma.session.findFirst({
      where: req.user.role === "ADMIN" ? { id } : { id, therapistId: req.user.id },
    });
    if (!existing) return res.status(404).json({ message: "Session not found or not yours" });

    const updateData = {};
    if (sessionDate !== undefined) updateData.sessionDate = new Date(sessionDate);
    if (duration !== undefined) updateData.duration = duration;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No valid fields provided" });
    }

    const session = await prisma.session.update({
      where: { id },
      data: updateData,
      select: sessionFields,
    });

    // Real-time: notify the therapist and the child's parents of the update.
    emitToUser(req.user.id, "session:updated", { session });
    await notifyChildParents(session.childId, "Session Updated", `A session for ${session.child.firstName} ${session.child.lastName} has been updated.`);

    return res.status(200).json({ message: "Session updated", session });
  } catch (error) {
    next(error);
  }
};

exports.deleteSession = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.session.findFirst({
      where: req.user.role === "ADMIN" ? { id } : { id, therapistId: req.user.id },
    });
    if (!existing) return res.status(404).json({ message: "Session not found" });

    await prisma.sessionNote.deleteMany({ where: { sessionId: id } });
    await prisma.session.delete({ where: { id } });

    return res.status(200).json({ message: "Session deleted" });
  } catch (error) {
    next(error);
  }
};

exports.upsertSessionNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { goalsWorkedOn, observations, recommendations, extraNotes } = req.body;

    const existingSession = await prisma.session.findFirst({
      where: req.user.role === "ADMIN" ? { id } : { id, therapistId: req.user.id },
    });
    if (!existingSession) return res.status(404).json({ message: "Session not found or not yours" });

    const note = await prisma.sessionNote.upsert({
      where: { sessionId: id },
      create: { sessionId: id, goalsWorkedOn, observations, recommendations, extraNotes: extraNotes || null },
      update: { goalsWorkedOn, observations, recommendations, extraNotes: extraNotes || null },
    });

    // Real-time: tell the therapist the note was saved, and notify parents
    // that new therapy notes are available for review.
    const childInfo = await prisma.session.findUnique({
      where: { id },
      select: { childId: true, child: { select: { firstName: true, lastName: true } } },
    });
    emitToUser(req.user.id, "session:updated", { session: { id, note } });
    if (childInfo) {
      await notifyChildParents(childInfo.childId, "Session Note Added", `New therapy notes available for ${childInfo.child.firstName} ${childInfo.child.lastName}.`);
    }

    return res.status(200).json({ message: "Session note saved", note });
  } catch (error) {
    next(error);
  }
};
