const prisma = require("../../config/prisma");

exports.listSlots = async (req, res, next) => {
  try {
    const { therapistId, dayOfWeek } = req.query;
    const where = {};
    if (therapistId) where.therapistId = therapistId;
    if (dayOfWeek !== undefined) where.dayOfWeek = parseInt(dayOfWeek);

    const slots = await prisma.availabilitySlot.findMany({
      where,
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      include: { therapist: { select: { id: true, firstName: true, lastName: true } } },
    });

    return res.status(200).json({ slots });
  } catch (error) {
    next(error);
  }
};

exports.getSlot = async (req, res, next) => {
  try {
    const slot = await prisma.availabilitySlot.findUnique({
      where: { id: req.params.id },
      include: { therapist: { select: { id: true, firstName: true, lastName: true, areaofexpertise: true, avatar: true } } },
    });
    if (!slot) return res.status(404).json({ message: "Slot not found" });
    return res.status(200).json({ slot });
  } catch (error) {
    next(error);
  }
};

exports.createSlot = async (req, res, next) => {
  try {
    const { dayOfWeek, specificDate, startTime, endTime, isRecurring } = req.body;

    if (req.user.role !== "THERAPIST") {
      return res.status(403).json({ message: "Only therapists can create availability slots" });
    }

    const slot = await prisma.availabilitySlot.create({
      data: {
        therapistId: req.user.id,
        dayOfWeek: dayOfWeek ?? null,
        specificDate: specificDate ? new Date(specificDate) : null,
        startTime,
        endTime,
        isRecurring: isRecurring ?? true,
      },
    });

    return res.status(201).json({ message: "Availability slot created", slot });
  } catch (error) {
    next(error);
  }
};

exports.updateSlot = async (req, res, next) => {
  try {
    const existing = await prisma.availabilitySlot.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: "Slot not found" });
    if (existing.therapistId !== req.user.id) {
      return res.status(403).json({ message: "Not your slot" });
    }

    const { dayOfWeek, specificDate, startTime, endTime, isRecurring } = req.body;
    const slot = await prisma.availabilitySlot.update({
      where: { id: req.params.id },
      data: {
        dayOfWeek: dayOfWeek ?? existing.dayOfWeek,
        specificDate: specificDate ? new Date(specificDate) : existing.specificDate,
        startTime: startTime ?? existing.startTime,
        endTime: endTime ?? existing.endTime,
        isRecurring: isRecurring ?? existing.isRecurring,
      },
    });

    return res.status(200).json({ message: "Slot updated", slot });
  } catch (error) {
    next(error);
  }
};

exports.deleteSlot = async (req, res, next) => {
  try {
    const existing = await prisma.availabilitySlot.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: "Slot not found" });
    if (existing.therapistId !== req.user.id) {
      return res.status(403).json({ message: "Not your slot" });
    }

    await prisma.availabilitySlot.delete({ where: { id: req.params.id } });
    return res.status(200).json({ message: "Slot deleted" });
  } catch (error) {
    next(error);
  }
};
