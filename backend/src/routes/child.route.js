// Children routes — CRUD for parent's children
const express = require("express");
const { createChild, listChildren, getChild, updateChild, deleteChild, assignTherapist } = require("../modules/children/child.controller");
const { verifyToken, authorize } = require("../middleware/auth");
const { validate, createChildSchema, updateChildSchema, childIdParamSchema, assignTherapistSchema } = require("../validators/child.validator");

const router = express.Router();

// All child routes require authentication
router.use(verifyToken);

// List parent's children (or therapist's assigned children)
router.get("/", listChildren);

// Create child (auto-links to current parent)
router.post("/", validate(createChildSchema), createChild);

// Assign therapist (admin only)
router.post("/:id/assign", authorize("ADMIN"), validate(assignTherapistSchema), assignTherapist);

// Get single child
router.get("/:id", validate(childIdParamSchema), getChild);

// Update child
router.patch("/:id", validate(updateChildSchema), updateChild);

// Delete child (soft)
router.delete("/:id", validate(childIdParamSchema), deleteChild);

module.exports = router;