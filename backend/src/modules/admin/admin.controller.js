const prisma = require("../../config/prisma");

exports.listUsers = async (req, res, next) => {
  try {
    const { role, isApproved } = req.query;
    let where = { deletedAt: null };
    if (role) where.role = role;
    if (isApproved !== undefined) where.isApproved = isApproved === "true";

    const users = await prisma.user.findMany({
      where,
      select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true, isApproved: true, areaofexpertise: true, avatar: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ users });
  } catch (error) {
    next(error);
  }
};

exports.approveUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || user.deletedAt) return res.status(404).json({ message: "User not found" });
    if (user.role !== "THERAPIST") return res.status(400).json({ message: "Only therapists can be approved" });

    const updated = await prisma.user.update({
      where: { id },
      data: { isApproved: true },
      select: { id: true, firstName: true, lastName: true, email: true, role: true, isApproved: true },
    });

    return res.status(200).json({ message: "Therapist approved", user: updated });
  } catch (error) {
    next(error);
  }
};

exports.getStats = async (req, res, next) => {
  try {
    const [totalChildren, totalParents, totalTherapists, pendingTherapists, totalSessions] = await Promise.all([
      prisma.child.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { role: "PARENT", deletedAt: null } }),
      prisma.user.count({ where: { role: "THERAPIST", deletedAt: null } }),
      prisma.user.count({ where: { role: "THERAPIST", isApproved: false, deletedAt: null } }),
      prisma.session.count(),
    ]);

    return res.status(200).json({
      stats: { totalChildren, totalParents, totalTherapists, pendingTherapists, totalSessions },
    });
  } catch (error) {
    next(error);
  }
};
