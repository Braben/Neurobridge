// Therapist profile controller — public-facing therapist information
// Provides a public profile for therapists (name, expertise, avatar, stats)
// and a directory listing of all approved therapists. These endpoints are
// deliberately limited to non-sensitive fields; no private data is exposed.
const prisma = require("../../config/prisma");

// GET /api/v1/therapists/:id
// Returns the public profile for a single approved therapist, including
// aggregate counts of children assigned and sessions logged. The _count
// field from Prisma is flattened into childCount / sessionCount for the API
// response. Returns 404 if the therapist is not found, not approved, or deleted.
exports.getTherapistProfile = async (req, res, next) => {
  try {
    const therapist = await prisma.user.findFirst({
      where: { id: req.params.id, role: "THERAPIST", deletedAt: null },
      select: {
        id: true, firstName: true, lastName: true, email: true, phone: true,
        areaofexpertise: true, avatar: true, isApproved: true, createdAt: true,
        _count: { select: { therapistAssignments: true, sessions: true } },
      },
    });
    if (!therapist) return res.status(404).json({ message: "Therapist not found" });

    // Flatten Prisma's _count into top-level fields for cleaner client usage
    return res.status(200).json({
      therapist: {
        ...therapist,
        childCount: therapist._count.therapistAssignments,
        sessionCount: therapist._count.sessions,
        _count: undefined,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/therapists
// Lists all approved, non-deleted therapists ordered by creation date.
// Returns lightweight profiles suitable for a directory or search listing.
// Soft-deleted and unapproved therapists are excluded from results.
exports.listTherapists = async (req, res, next) => {
  try {
    const therapists = await prisma.user.findMany({
      where: { role: "THERAPIST", deletedAt: null, isApproved: true },
      select: {
        id: true, firstName: true, lastName: true, areaofexpertise: true, avatar: true,
        _count: { select: { therapistAssignments: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      therapists: therapists.map((t) => ({ ...t, childCount: t._count.therapistAssignments, _count: undefined })),
    });
  } catch (error) {
    next(error);
  }
};
