const prisma = require("../../config/prisma");
const { createNotification } = require("../../services/notification.service");

exports.listBookings = async (req, res, next) => {
  try {
    const where = {};
    if (req.user.role === "PARENT") where.parentId = req.user.id;
    else if (req.user.role === "THERAPIST") where.therapistId = req.user.id;

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        slot: true,
        child: { select: { id: true, firstName: true, lastName: true } },
        therapist: { select: { id: true, firstName: true, lastName: true } },
        parent: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return res.status(200).json({ bookings });
  } catch (error) {
    next(error);
  }
};

exports.getBooking = async (req, res, next) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        slot: true,
        child: { select: { id: true, firstName: true, lastName: true } },
        therapist: { select: { id: true, firstName: true, lastName: true, avatar: true, areaofexpertise: true } },
        parent: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const canRead =
      req.user.role === "ADMIN" ||
      booking.parentId === req.user.id ||
      booking.therapistId === req.user.id;
    if (!canRead) {
      return res.status(403).json({ message: "You do not have permission to view this booking" });
    }

    return res.status(200).json({ booking });
  } catch (error) {
    next(error);
  }
};

exports.createBooking = async (req, res, next) => {
  try {
    const { slotId, childId, therapistId, notes } = req.body;

    if (req.user.role !== "PARENT") {
      return res.status(403).json({ message: "Only parents can create bookings" });
    }

    const slot = await prisma.availabilitySlot.findUnique({ where: { id: slotId } });
    if (!slot) return res.status(404).json({ message: "Slot not found" });
    if (slot.therapistId !== therapistId) {
      return res.status(400).json({ message: "Slot does not belong to this therapist" });
    }

    const existingBooking = await prisma.booking.findFirst({
      where: { slotId, status: { in: ["PENDING", "CONFIRMED"] } },
    });
    if (existingBooking) {
      return res.status(409).json({ message: "This slot is already booked" });
    }

    const child = await prisma.child.findUnique({ where: { id: childId } });
    if (!child) return res.status(404).json({ message: "Child not found" });

    const isParent = await prisma.childParent.findUnique({
      where: { childId_parentId: { childId, parentId: req.user.id } },
    });
    if (!isParent) {
      return res.status(403).json({ message: "You are not a parent of this child" });
    }

    const booking = await prisma.booking.create({
      data: { slotId, childId, parentId: req.user.id, therapistId, notes },
      include: {
        slot: true,
        child: { select: { id: true, firstName: true, lastName: true } },
        therapist: { select: { id: true, firstName: true, lastName: true } },
        parent: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await createNotification({
      userId: therapistId,
      title: "New Booking Request",
      body: `${req.user.firstName} ${req.user.lastName} booked a session for ${child.firstName} on ${slot.startTime}-${slot.endTime}`,
    });

    return res.status(201).json({ message: "Booking created", booking });
  } catch (error) {
    next(error);
  }
};

exports.updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validTransitions = { PENDING: ["CONFIRMED", "CANCELLED"], CONFIRMED: ["COMPLETED", "CANCELLED"] };

    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { child: { select: { firstName: true, lastName: true } } },
    });
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (req.user.role === "THERAPIST" && booking.therapistId !== req.user.id) {
      return res.status(403).json({ message: "Not your booking" });
    }
    if (req.user.role === "PARENT" && booking.parentId !== req.user.id) {
      return res.status(403).json({ message: "Not your booking" });
    }
    if (req.user.role === "PARENT" && status !== "CANCELLED") {
      return res.status(403).json({ message: "Parents can only cancel pending bookings from this endpoint" });
    }

    const allowed = validTransitions[booking.status];
    if (!allowed || !allowed.includes(status)) {
      return res.status(400).json({ message: `Cannot transition from ${booking.status} to ${status}` });
    }

    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data: { status },
      include: {
        slot: true,
        child: { select: { id: true, firstName: true, lastName: true } },
        therapist: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (status === "CONFIRMED") {
      await createNotification({
        userId: booking.parentId,
        title: "Booking Confirmed",
        body: `Your session for ${booking.child.firstName} has been confirmed`,
      });
    }

    return res.status(200).json({ message: `Booking ${status.toLowerCase()}`, booking: updated });
  } catch (error) {
    next(error);
  }
};
