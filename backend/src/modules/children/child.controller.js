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
  coExistingConditions: true,
  currentMedications: true,
  profileImage: true,
  school: true,
  notes: true,
  supportMessage: true,
  createdAt: true,
  updatedAt: true,
};

// Parent and therapist dashboards need a lightweight assignment summary from
// the child list without exposing unrelated user fields.
const childListFields = {
  ...childResponseFields,
  therapists: {
    orderBy: { assignedAt: "desc" },
    select: {
      id: true,
      therapistId: true,
      assignedAt: true,
      therapist: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
          areaofexpertise: true,
          email: true,
          phone: true,
        },
      },
    },
  },
};

// Create a new child and auto-link to current parent
exports.createChild = async (req, res, next) => {
  try {
    const { firstName, lastName, dateOfBirth, gender, diagnosis, coExistingConditions, currentMedications, profileImage, school, notes, supportMessage } = req.body;

    const child = await prisma.child.create({
      data: {
        firstName,
        lastName,
        dateOfBirth: new Date(dateOfBirth),
        gender,
        diagnosis: diagnosis || null,
        coExistingConditions: coExistingConditions || null,
        currentMedications: currentMedications || null,
        profileImage: profileImage || null,
        school: school || null,
        notes: notes || null,
        supportMessage: supportMessage || null,
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
      select: childListFields,
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
    const { firstName, lastName, dateOfBirth, gender, diagnosis, coExistingConditions, currentMedications, profileImage, school, notes, supportMessage } = req.body;

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
    if (coExistingConditions !== undefined) updateData.coExistingConditions = coExistingConditions;
    if (currentMedications !== undefined) updateData.currentMedications = currentMedications;
    if (profileImage !== undefined) updateData.profileImage = profileImage;
    if (school !== undefined) updateData.school = school;
    if (notes !== undefined) updateData.notes = notes;
    if (supportMessage !== undefined) updateData.supportMessage = supportMessage;

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

// Assign or change a child's therapist (admin only). The product design treats
// Assigned Therapist as one current value, so replacing an assignment removes
// any previous therapist links for the child before creating the new one.
exports.assignTherapist = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { therapistId } = req.body;

    const child = await prisma.child.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        deletedAt: true,
        parents: { select: { parentId: true } },
        therapists: {
          take: 1,
          orderBy: { assignedAt: "desc" },
          select: { id: true, therapistId: true },
        },
      },
    });
    if (!child || child.deletedAt) {
      return res.status(404).json({ message: "Child not found" });
    }

    const therapist = await prisma.user.findUnique({
      where: { id: therapistId },
      select: { id: true, firstName: true, lastName: true, role: true, isApproved: true, deletedAt: true },
    });
    if (!therapist || therapist.deletedAt || therapist.role !== "THERAPIST") {
      return res.status(400).json({ message: "Invalid therapist ID" });
    }
    if (!therapist.isApproved) {
      return res.status(400).json({ message: "Therapist must be approved before assignment" });
    }

    const currentAssignment = child.therapists[0];
    if (currentAssignment?.therapistId === therapistId) {
      return res.status(200).json({
        message: "Therapist is already assigned to this child",
        assignment: currentAssignment,
      });
    }

    const assignment = await prisma.$transaction(async (tx) => {
      await tx.therapistAssignment.deleteMany({ where: { childId: id } });
      return tx.therapistAssignment.create({
        data: { childId: id, therapistId },
        select: { id: true, childId: true, therapistId: true, assignedAt: true },
      });
    });

    const childFullName = `${child.firstName} ${child.lastName}`;
    const therapistFullName = `${therapist.firstName} ${therapist.lastName}`;

    // Notify the parents and new therapist after the DB write succeeds. When
    // changing therapists, notify the previous therapist that access changed.
    for (const p of child.parents) {
      await createNotification({ userId: p.parentId, title: "Therapist Assigned", body: `${therapistFullName} has been assigned to ${childFullName}.` });
    }
    await createNotification({ userId: therapistId, title: "New Child Assignment", body: `You have been assigned to ${childFullName}.` });
    emitToUser(therapistId, "assignment:new", { childId: id, child: { firstName: child.firstName, lastName: child.lastName } });

    if (currentAssignment?.therapistId) {
      await createNotification({
        userId: currentAssignment.therapistId,
        title: "Child Assignment Updated",
        body: `${childFullName} has been reassigned to another therapist.`,
      });
      emitToUser(currentAssignment.therapistId, "assignment:removed", { childId: id });
    }

    return res.status(200).json({ message: "Therapist assigned successfully", assignment });
  } catch (error) {
    next(error);
  }
};
