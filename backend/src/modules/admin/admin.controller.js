const prisma = require("../../config/prisma");
const { sendAdminInviteEmail } = require("../../services/email.service");
const { getTherapySessionFeePesewas, setTherapySessionFeePesewas } = require("../../services/settings.service");

const userSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  dateOfBirth: true,
  role: true,
  isApproved: true,
  areaofexpertise: true,
  avatar: true,
  createdAt: true,
};

const startOfDay = (date) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

const daysAgo = (count) => {
  const value = startOfDay(new Date());
  value.setDate(value.getDate() - count);
  return value;
};

const getAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  const birth = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age;
};

const formatUser = (user) => ({
  ...user,
  fullName: `${user.firstName} ${user.lastName}`,
  age: getAge(user.dateOfBirth),
});

const accountStatus = (user, activityDates = []) => {
  if (!user.isApproved) return "INACTIVE";
  const latest = activityDates.filter(Boolean).sort((a, b) => new Date(b) - new Date(a))[0];
  if (!latest) return "DORMANT";
  return new Date(latest) >= daysAgo(90) ? "ACTIVE" : "DORMANT";
};

exports.listUsers = async (req, res, next) => {
  try {
    const { role, isApproved } = req.query;
    let where = { deletedAt: null };
    if (role) where.role = role;
    if (isApproved !== undefined) where.isApproved = isApproved === "true";

    const users = await prisma.user.findMany({
      where,
      select: userSelect,
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ users });
  } catch (error) {
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phone, dateOfBirth, areaofexpertise, isApproved } = req.body;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) return res.status(404).json({ message: "User not found" });

    const data = {};
    if (firstName !== undefined) data.firstName = firstName;
    if (lastName !== undefined) data.lastName = lastName;
    if (email !== undefined) data.email = email || null;
    if (phone !== undefined) data.phone = phone || null;
    if (dateOfBirth !== undefined) data.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (areaofexpertise !== undefined) data.areaofexpertise = existing.role === "THERAPIST" ? areaofexpertise : null;
    if (isApproved !== undefined) data.isApproved = isApproved;

    const user = await prisma.user.update({
      where: { id },
      data,
      select: userSelect,
    });

    return res.status(200).json({ message: "User updated", user });
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({ message: "Administrators cannot delete their own account" });
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) return res.status(404).json({ message: "User not found" });

    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isApproved: false },
    });

    return res.status(200).json({ message: "User deleted" });
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
      select: { id: true, firstName: true, lastName: true, email: true, phone: true, dateOfBirth: true, role: true, isApproved: true },
    });

    return res.status(200).json({ message: "Therapist approved", user: updated });
  } catch (error) {
    next(error);
  }
};

exports.inviteAdmin = async (req, res, next) => {
  try {
    const email = req.body.email.toLowerCase();
    const inviteCode = process.env.ADMIN_INVITE_CODE;

    if (!inviteCode) {
      return res.status(500).json({ message: "Admin invite code is not configured" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser && !existingUser.deletedAt) {
      return res.status(409).json({ message: "A user with this email already exists" });
    }

    const inviterName = `${req.user.firstName || "An administrator"} ${req.user.lastName || ""}`.trim();
    await sendAdminInviteEmail(email, inviteCode, inviterName);

    return res.status(200).json({ message: "Admin invite email sent" });
  } catch (error) {
    next(error);
  }
};

exports.getSessionFee = async (req, res, next) => {
  try {
    const amount = await getTherapySessionFeePesewas();
    return res.status(200).json({ amount });
  } catch (error) {
    next(error);
  }
};

exports.updateSessionFee = async (req, res, next) => {
  try {
    const setting = await setTherapySessionFeePesewas(req.body.amount, req.user.id);
    return res.status(200).json({ message: "Therapy session fee updated", amount: Number(setting.value) });
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

exports.getOverview = async (req, res, next) => {
  try {
    const now = new Date();
    const weekStart = daysAgo(7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const [
      totalChildren,
      totalParents,
      totalTherapists,
      pendingTherapists,
      totalSessions,
      totalUsers,
      usersToday,
      sessionsThisWeek,
      successfulTransactions,
      bookings,
      users,
      children,
    ] = await Promise.all([
      prisma.child.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { role: "PARENT", deletedAt: null } }),
      prisma.user.count({ where: { role: "THERAPIST", deletedAt: null } }),
      prisma.user.count({ where: { role: "THERAPIST", isApproved: false, deletedAt: null } }),
      prisma.session.count(),
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { deletedAt: null, createdAt: { gte: startOfDay(now) } } }),
      prisma.session.count({ where: { sessionDate: { gte: weekStart } } }),
      prisma.transaction.findMany({ where: { status: "SUCCESS", createdAt: { gte: yearStart } } }),
      prisma.booking.findMany({ where: { createdAt: { gte: daysAgo(6) } }, select: { createdAt: true } }),
      prisma.user.findMany({ where: { deletedAt: null, createdAt: { gte: daysAgo(4) } }, select: { role: true, createdAt: true } }),
      prisma.child.findMany({ where: { deletedAt: null, createdAt: { gte: daysAgo(4) } }, select: { createdAt: true } }),
    ]);

    const dayLabels = Array.from({ length: 5 }, (_, index) => {
      const date = daysAgo(4 - index);
      return {
        key: date.toISOString().slice(0, 10),
        label: date.toLocaleDateString("en-US", { weekday: "short" }),
        parents: 0,
        therapists: 0,
        children: 0,
      };
    });

    users.forEach((user) => {
      const key = startOfDay(user.createdAt).toISOString().slice(0, 10);
      const bucket = dayLabels.find((item) => item.key === key);
      if (!bucket) return;
      if (user.role === "PARENT") bucket.parents += 1;
      if (user.role === "THERAPIST") bucket.therapists += 1;
    });

    children.forEach((child) => {
      const key = startOfDay(child.createdAt).toISOString().slice(0, 10);
      const bucket = dayLabels.find((item) => item.key === key);
      if (bucket) bucket.children += 1;
    });

    const bookingTrend = Array.from({ length: 7 }, (_, index) => {
      const date = daysAgo(6 - index);
      const key = date.toISOString().slice(0, 10);
      return {
        key,
        label: date.toLocaleDateString("en-US", { weekday: "short" }),
        bookings: bookings.filter((booking) => startOfDay(booking.createdAt).toISOString().slice(0, 10) === key).length,
      };
    });

    const revenueTrend = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(now.getFullYear(), index, 1);
      return {
        label: date.toLocaleDateString("en-US", { month: "short" }),
        revenue: successfulTransactions
          .filter((transaction) => new Date(transaction.createdAt).getMonth() === index)
          .reduce((sum, transaction) => sum + transaction.amount, 0),
      };
    });

    const totalRevenue = successfulTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
    const revenueThisWeek = successfulTransactions
      .filter((transaction) => new Date(transaction.createdAt) >= weekStart)
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    const revenueThisMonth = successfulTransactions
      .filter((transaction) => new Date(transaction.createdAt) >= monthStart)
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    return res.status(200).json({
      stats: { totalChildren, totalParents, totalTherapists, pendingTherapists, totalSessions, totalUsers },
      changes: { usersToday, sessionsThisWeek, revenueThisWeek, revenueThisMonth },
      userGrowth: dayLabels,
      bookingTrend,
      revenueTrend,
      revenue: { total: totalRevenue },
    });
  } catch (error) {
    next(error);
  }
};

exports.listParents = async (req, res, next) => {
  try {
    const parents = await prisma.user.findMany({
      where: { role: "PARENT", deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        children: {
          include: {
            child: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                createdAt: true,
                sessions: { select: { sessionDate: true }, orderBy: { sessionDate: "desc" }, take: 1 },
                bookings: { select: { updatedAt: true }, orderBy: { updatedAt: "desc" }, take: 1 },
              },
            },
          },
        },
      },
    });

    return res.status(200).json({
      parents: parents.map((parent) => {
        const activityDates = parent.children.flatMap((link) => [
          link.child.createdAt,
          link.child.sessions[0]?.sessionDate,
          link.child.bookings[0]?.updatedAt,
        ]);
        return {
          ...formatUser(parent),
          accountStatus: accountStatus(parent, activityDates),
          children: parent.children.map((link) => ({
            id: link.child.id,
            firstName: link.child.firstName,
            lastName: link.child.lastName,
          })),
        };
      }),
    });
  } catch (error) {
    next(error);
  }
};

exports.listTherapists = async (req, res, next) => {
  try {
    const therapists = await prisma.user.findMany({
      where: { role: "THERAPIST", deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        therapistAssignments: {
          include: { child: { select: { id: true, firstName: true, lastName: true } } },
        },
        bookingsAsTherapist: { select: { id: true, updatedAt: true, status: true } },
      },
    });

    return res.status(200).json({
      therapists: therapists.map((therapist) => ({
        ...formatUser(therapist),
        accountStatus: accountStatus(therapist, therapist.bookingsAsTherapist.map((booking) => booking.updatedAt)),
        assignedChildren: therapist.therapistAssignments.map((assignment) => ({
          id: assignment.child.id,
          firstName: assignment.child.firstName,
          lastName: assignment.child.lastName,
        })),
        assignedChildrenCount: therapist.therapistAssignments.length,
        bookingsCount: therapist.bookingsAsTherapist.length,
      })),
    });
  } catch (error) {
    next(error);
  }
};

exports.listChildrenDatabase = async (req, res, next) => {
  try {
    const children = await prisma.child.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        parents: { include: { parent: { select: userSelect } } },
        therapists: { include: { therapist: { select: userSelect } } },
        intakeForm: true,
      },
    });

    return res.status(200).json({
      children: children.map((child) => ({
        id: child.id,
        shortId: child.id.slice(0, 4).toUpperCase(),
        firstName: child.firstName,
        lastName: child.lastName,
        fullName: `${child.firstName} ${child.lastName}`,
        age: getAge(child.dateOfBirth),
        dateOfBirth: child.dateOfBirth,
        gender: child.gender,
        diagnosis: child.diagnosis,
        coExistingConditions: child.coExistingConditions,
        currentMedications: child.currentMedications,
        developmentalHistorySummary: child.intakeForm?.developmentalHistory || child.notes,
        parents: child.parents.map((link) => formatUser(link.parent)),
        therapists: child.therapists.map((link) => formatUser(link.therapist)),
      })),
    });
  } catch (error) {
    next(error);
  }
};

exports.listTherapySessions = async (req, res, next) => {
  try {
    const bookings = await prisma.booking.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        slot: true,
        child: { select: { id: true, firstName: true, lastName: true, dateOfBirth: true, diagnosis: true } },
        therapist: { select: userSelect },
      },
    });

    const bookingIds = bookings.map((booking) => booking.id);
    const transactions = await prisma.transaction.findMany({
      where: { bookingId: { in: bookingIds } },
      orderBy: { createdAt: "desc" },
    });

    const sessions = await prisma.session.findMany({
      where: {
        OR: [
          { bookingId: { in: bookingIds } },
          {
            childId: { in: bookings.map((booking) => booking.childId) },
            therapistId: { in: bookings.map((booking) => booking.therapistId) },
          },
        ],
      },
      orderBy: { sessionDate: "desc" },
      include: { note: true },
    });

    const rows = bookings.map((booking) => {
      const transaction = transactions.find((item) => item.bookingId === booking.id);
      const session = sessions.find((item) => item.bookingId === booking.id)
        || sessions.find((item) => item.childId === booking.childId && item.therapistId === booking.therapistId);
      const sessionType = booking.child.diagnosis || "Therapy";
      const paymentStatus = transaction?.status === "SUCCESS"
        ? "PAID"
        : transaction?.status === "PENDING"
          ? "PENDING"
          : "UNPAID";

      return {
        id: booking.id,
        bookingId: booking.id,
        child: {
          id: booking.child.id,
          firstName: booking.child.firstName,
          lastName: booking.child.lastName,
          fullName: `${booking.child.firstName} ${booking.child.lastName}`,
          age: getAge(booking.child.dateOfBirth),
        },
        therapist: formatUser(booking.therapist),
        sessionDate: booking.slot.specificDate || booking.updatedAt,
        startTime: booking.slot.startTime,
        endTime: booking.slot.endTime,
        sessionType,
        bookingStatus: booking.status,
        paymentStatus,
        notePreview: session?.note?.observations || booking.notes || null,
      };
    });

    return res.status(200).json({ sessions: rows });
  } catch (error) {
    next(error);
  }
};

exports.rescheduleBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { specificDate, startTime, endTime } = req.body;

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.status === "CANCELLED" || booking.status === "COMPLETED") {
      return res.status(400).json({ message: "Only pending or confirmed bookings can be rescheduled" });
    }

    const slot = await prisma.availabilitySlot.create({
      data: {
        therapistId: booking.therapistId,
        specificDate: new Date(specificDate),
        startTime,
        endTime,
        isRecurring: false,
      },
    });

    const updated = await prisma.booking.update({
      where: { id },
      data: { slotId: slot.id },
      include: {
        slot: true,
        child: { select: { id: true, firstName: true, lastName: true } },
        therapist: { select: userSelect },
        parent: { select: userSelect },
      },
    });

    return res.status(200).json({ message: "Booking rescheduled", booking: updated });
  } catch (error) {
    next(error);
  }
};
