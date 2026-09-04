const prisma = require("../../config/prisma");

function childAccessWhere(user, childId) {
  const where = { id: childId, deletedAt: null };

  if (user.role === "PARENT") {
    where.parents = { some: { parentId: user.id } };
  } else if (user.role === "THERAPIST") {
    where.therapists = { some: { therapistId: user.id } };
  }

  return where;
}

exports.getIntakeForm = async (req, res, next) => {
  try {
    const { childId } = req.params;

    const child = await prisma.child.findFirst({
      where: childAccessWhere(req.user, childId),
      select: { id: true },
    });
    if (!child) return res.status(404).json({ message: "Child not found" });

    const intake = await prisma.intakeForm.findUnique({ where: { childId } });
    return res.status(200).json({ intake });
  } catch (error) {
    next(error);
  }
};

exports.upsertIntakeForm = async (req, res, next) => {
  try {
    const { childId } = req.params;
    const { developmentalHistory, behaviourConcerns, parentGoals } = req.body;

    const child = await prisma.child.findFirst({
      where: childAccessWhere(req.user, childId),
      select: { id: true },
    });
    if (!child) return res.status(404).json({ message: "Child not found" });

    const intake = await prisma.intakeForm.upsert({
      where: { childId },
      create: { childId, developmentalHistory, behaviourConcerns, parentGoals },
      update: { developmentalHistory, behaviourConcerns, parentGoals },
    });

    return res.status(200).json({ message: "Intake form saved", intake });
  } catch (error) {
    next(error);
  }
};
