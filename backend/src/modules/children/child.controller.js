// Child controller — CRUD for children linked to authenticated parent
const prisma = require("../../config/prisma");

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

// List all children linked to the authenticated parent
exports.listChildren = async (req, res, next) => {
  try {
    const children = await prisma.child.findMany({
      where: {
        parents: {
          some: { parentId: req.user.id },
        },
        deletedAt: null,
      },
      select: childResponseFields,
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ children });
  } catch (error) {
    next(error);
  }
};

// Get a single child by ID (must belong to the parent)
exports.getChild = async (req, res, next) => {
  try {
    const { id } = req.params;

    const child = await prisma.child.findFirst({
      where: {
        id,
        deletedAt: null,
        parents: {
          some: { parentId: req.user.id },
        },
      },
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

    // Verify ownership
    const existing = await prisma.child.findFirst({
      where: { id, deletedAt: null, parents: { some: { parentId: req.user.id } } },
    });

    if (!existing) {
      return res.status(404).json({ message: "Child not found" });
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
      where: { id, deletedAt: null, parents: { some: { parentId: req.user.id } } },
    });

    if (!existing) {
      return res.status(404).json({ message: "Child not found" });
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