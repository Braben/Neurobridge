const prisma = require("../../config/prisma");

exports.listBehaviours = async (req, res, next) => {
  try {
    const { childId } = req.params;
    const behaviours = await prisma.behaviour.findMany({
      where: { childId },
      include: { _count: { select: { logs: true } } },
      orderBy: { id: "asc" },
    });
    return res.status(200).json({ behaviours });
  } catch (error) {
    next(error);
  }
};

exports.createBehaviour = async (req, res, next) => {
  try {
    const { childId } = req.params;
    const { name, description } = req.body;

    const child = await prisma.child.findUnique({ where: { id: childId }, select: { id: true, deletedAt: true } });
    if (!child || child.deletedAt) return res.status(404).json({ message: "Child not found" });

    const behaviour = await prisma.behaviour.create({
      data: { childId, name, description: description || null },
    });

    return res.status(201).json({ message: "Behaviour created", behaviour });
  } catch (error) {
    next(error);
  }
};

exports.updateBehaviour = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const existing = await prisma.behaviour.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: "Behaviour not found" });

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    const behaviour = await prisma.behaviour.update({ where: { id }, data: updateData });
    return res.status(200).json({ message: "Behaviour updated", behaviour });
  } catch (error) {
    next(error);
  }
};

exports.deleteBehaviour = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.behaviour.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: "Behaviour not found" });

    await prisma.behaviourLog.deleteMany({ where: { behaviourId: id } });
    await prisma.behaviour.delete({ where: { id } });
    return res.status(200).json({ message: "Behaviour deleted" });
  } catch (error) {
    next(error);
  }
};

exports.listBehaviourLogs = async (req, res, next) => {
  try {
    const { id } = req.params;
    const logs = await prisma.behaviourLog.findMany({
      where: { behaviourId: id },
      orderBy: { recordedAt: "desc" },
    });
    return res.status(200).json({ logs });
  } catch (error) {
    next(error);
  }
};

exports.createBehaviourLog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { frequency, notes, recordedAt } = req.body;

    const existing = await prisma.behaviour.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: "Behaviour not found" });

    const log = await prisma.behaviourLog.create({
      data: { behaviourId: id, frequency, notes: notes || null, recordedAt: new Date(recordedAt) },
    });

    return res.status(201).json({ message: "Log recorded", log });
  } catch (error) {
    next(error);
  }
};
