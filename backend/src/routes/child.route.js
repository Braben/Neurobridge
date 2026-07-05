// Children routes — CRUD for parent's children
const express = require("express");
const { createChild, listChildren, getChild, updateChild, deleteChild } = require("../modules/children/child.controller");
const { verifyToken } = require("../middleware/auth");
const { validate, createChildSchema, updateChildSchema, childIdParamSchema } = require("../validators/child.validator");

const router = express.Router();

// All child routes require authentication
router.use(verifyToken);

// List parent's children
router.get("/", listChildren);

// Create child (auto-links to current parent)
router.post("/", validate(createChildSchema), createChild);

// Get single child
router.get("/:id", validate(childIdParamSchema), getChild);

// Update child
router.patch("/:id", validate(updateChildSchema), updateChild);

// Delete child (soft)
router.delete("/:id", validate(childIdParamSchema), deleteChild);

module.exports = router;