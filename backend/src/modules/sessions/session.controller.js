const prisma = require("../../config/prisma");

const sessionFields = {
  id: true, childId: true, therapistId: true, sessionDate: true, duration: true, createdAt: true,
  note: { select: { id: true, goalsWorkedOn: true, observations: true, recommendations: true } },
  child: { select: { id: true, firstName: true, lastName: true } },
  therapist: { select: { id: true, firstName: true, lastName: true } },
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
    const { childId, sessionDate, duration } = req.body;

    const child = await prisma.child.findUnique({ where: { id: childId }, select: { id: true, deletedAt: true } });
    if (!child || child.deletedAt) {
      return res.status(404).json({ message: "Child not found" });
    }

    const session = await prisma.session.create({
      data: { childId, therapistId: req.user.id, sessionDate: new Date(sessionDate), duration: duration || null },
      select: sessionFields,
    });

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
      where: { id, therapistId: req.user.id },
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
    const { goalsWorkedOn, observations, recommendations } = req.body;

    const session = await prisma.session.findFirst({
      where: { id, therapistId: req.user.id },
    });
    if (!session) return res.status(404).json({ message: "Session not found or not yours" });

    const note = await prisma.sessionNote.upsert({
      where: { sessionId: id },
      create: { sessionId: id, goalsWorkedOn, observations, recommendations },
      update: { goalsWorkedOn, observations, recommendations },
    });

    return res.status(200).json({ message: "Session note saved", note });
  } catch (error) {
    next(error);
  }
};
