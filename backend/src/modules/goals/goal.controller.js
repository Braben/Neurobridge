const prisma = require("../../config/prisma");

exports.listGoals = async (req, res, next) => {
  try {
    const { childId } = req.params;

    const goals = await prisma.goal.findMany({
      where: { childId },
      orderBy: { createdAt: "desc" },
      include: { createdBy: { select: { id: true, firstName: true, lastName: true, role: true } } },
    });

    return res.status(200).json({ goals });
  } catch (error) {
    next(error);
  }
};

exports.createGoal = async (req, res, next) => {
  try {
    const { childId } = req.params;
    const { title, description } = req.body;

    const child = await prisma.child.findUnique({ where: { id: childId }, select: { id: true, deletedAt: true } });
    if (!child || child.deletedAt) return res.status(404).json({ message: "Child not found" });

    const goal = await prisma.goal.create({
      data: { childId, title, description, createdById: req.user.id },
      include: { createdBy: { select: { id: true, firstName: true, lastName: true, role: true } } },
    });

    return res.status(201).json({ message: "Goal created", goal });
  } catch (error) {
    next(error);
  }
};

exports.updateGoal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, status } = req.body;

    const existing = await prisma.goal.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: "Goal not found" });

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;

    const goal = await prisma.goal.update({
      where: { id },
      data: updateData,
      include: { createdBy: { select: { id: true, firstName: true, lastName: true, role: true } } },
    });

    return res.status(200).json({ message: "Goal updated", goal });
  } catch (error) {
    next(error);
  }
};

exports.deleteGoal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.goal.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: "Goal not found" });

    await prisma.goal.delete({ where: { id } });
    return res.status(200).json({ message: "Goal deleted" });
  } catch (error) {
    next(error);
  }
};
