// Child controller — CRUD for children linked to authenticated parent
const prisma = require("../../config/prisma");
const { emitToUser } = require("../../sockets");
const { createNotification } = require("../../services/notification.service");

// Child response fields
const childResponseFields = {
  id: true,
  firstName: true,
  lastName: true,
  dateOfBirth: true,
  gender: true,
  diagnosis: true,
  school: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
};

// Create a new child and auto-link to current parent
exports.createChild = async (req, res, next) => {
  try {
    const { firstName, lastName, dateOfBirth, gender, diagnosis, school, notes } = req.body;

    const child = await prisma.child.create({
      data: {
        firstName,
        lastName,
        dateOfBirth: new Date(dateOfBirth),
        gender,
        diagnosis: diagnosis || null,
        school: school || null,
        notes: notes || null,
      },
      select: childResponseFields,
    });

    // Auto-link child to the authenticated parent
    await prisma.childParent.create({
      data: {
        childId: child.id,
        parentId: req.user.id,
        relationship: "Parent",
      },
    });

    return res.status(201).json({
      message: "Child created successfully",
      child,
    });
  } catch (error) {
    next(error);
  }
};

// List children — parents see their own, therapists see assigned, admins see all
exports.listChildren = async (req, res, next) => {
  try {
    let where = { deletedAt: null };

    if (req.user.role === "PARENT") {
      where.parents = { some: { parentId: req.user.id } };
    } else if (req.user.role === "THERAPIST") {
      where.therapists = { some: { therapistId: req.user.id } };
    }
    // ADMIN sees all non-deleted children

    const children = await prisma.child.findMany({
      where,
      select: childResponseFields,
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ children });
  } catch (error) {
    next(error);
  }
};

// Get a single child by ID (must belong to parent / be assigned to therapist / be admin)
exports.getChild = async (req, res, next) => {
  try {
    const { id } = req.params;

    let where = { id, deletedAt: null };
    if (req.user.role === "PARENT") {
      where.parents = { some: { parentId: req.user.id } };
    } else if (req.user.role === "THERAPIST") {
      where.therapists = { some: { therapistId: req.user.id } };
    }
    // ADMIN has no extra filter

    const child = await prisma.child.findFirst({
      where,
      select: {
        ...childResponseFields,
        parents: {
          select: { id: true, parentId: true, relationship: true, parent: { select: { id: true, firstName: true, lastName: true, email: true } } },
        },
        therapists: {
          select: { id: true, therapistId: true, assignedAt: true, therapist: { select: { id: true, firstName: true, lastName: true, areaofexpertise: true } } },
        },
        intakeForm: true,
        goals: true,
        sessions: { take: 5, orderBy: { sessionDate: "desc" } },
        behaviours: true,
      },
    });

    if (!child) {
      return res.status(404).json({ message: "Child not found" });
    }

    return res.status(200).json({ child });
  } catch (error) {
    next(error);
  }
};

// Update a child (must belong to the parent)
exports.updateChild = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, dateOfBirth, gender, diagnosis, school, notes } = req.body;

    const existing = await prisma.child.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, parents: { where: { parentId: req.user.id } } },
    });

    if (!existing) {
      return res.status(404).json({ message: "Child not found" });
    }
    // Only parents who own the child or admins can update
    if (req.user.role !== "ADMIN" && existing.parents.length === 0) {
      return res.status(403).json({ message: "You do not have permission to update this child" });
    }

    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = new Date(dateOfBirth);
    if (gender !== undefined) updateData.gender = gender;
    if (diagnosis !== undefined) updateData.diagnosis = diagnosis;
    if (school !== undefined) updateData.school = school;
    if (notes !== undefined) updateData.notes = notes;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No valid fields provided for update" });
    }

    const child = await prisma.child.update({
      where: { id },
      data: updateData,
      select: childResponseFields,
    });

    return res.status(200).json({ message: "Child updated successfully", child });
  } catch (error) {
    next(error);
  }
};

// Soft delete a child (must belong to the parent)
exports.deleteChild = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.child.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, parents: { where: { parentId: req.user.id } } },
    });

    if (!existing) {
      return res.status(404).json({ message: "Child not found" });
    }
    if (req.user.role !== "ADMIN" && existing.parents.length === 0) {
      return res.status(403).json({ message: "You do not have permission to delete this child" });
    }

    await prisma.child.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return res.status(200).json({ message: "Child deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// Assign a therapist to a child (admin only)
exports.assignTherapist = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { therapistId } = req.body;

    const child = await prisma.child.findUnique({ where: { id } });
    if (!child || child.deletedAt) {
      return res.status(404).json({ message: "Child not found" });
    }

    const therapist = await prisma.user.findUnique({
      where: { id: therapistId },
      select: { id: true, role: true },
    });
    if (!therapist || therapist.role !== "THERAPIST") {
      return res.status(400).json({ message: "Invalid therapist ID" });
    }

    const assignment = await prisma.therapistAssignment.upsert({
      where: { childId_therapistId: { childId: id, therapistId } },
      create: { childId: id, therapistId },
      update: {},
      select: { id: true, childId: true, therapistId: true, assignedAt: true },
    });

    // Real-time: notify parents that a therapist was assigned and the
    // therapist of their new assignment. Both get a persisted notification
    // (via createNotification) and the therapist also gets a live socket
    // event so their dashboard can update immediately.
    const childName = await prisma.child.findUnique({ where: { id }, select: { firstName: true, lastName: true } });
    const therapistUser = await prisma.user.findUnique({ where: { id: therapistId }, select: { firstName: true, lastName: true } });
    const parentLinks = await prisma.childParent.findMany({ where: { childId: id }, select: { parentId: true } });

    for (const p of parentLinks) {
      await createNotification({ userId: p.parentId, title: "Therapist Assigned", body: `${therapistUser.firstName} ${therapistUser.lastName} has been assigned to ${childName.firstName} ${childName.lastName}.` });
    }
    await createNotification({ userId: therapistId, title: "New Child Assignment", body: `You have been assigned to ${childName.firstName} ${childName.lastName}.` });
    emitToUser(therapistId, "assignment:new", { childId: id, child: childName });

    return res.status(200).json({ message: "Therapist assigned successfully", assignment });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ message: "Therapist is already assigned to this child" });
    }
    next(error);
  }
};