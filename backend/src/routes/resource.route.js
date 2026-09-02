// Resource library routes — browsing and curation of articles, videos, and PDFs
// All endpoints require JWT authentication (verifyToken applied to the entire router).
// Create/update are restricted to ADMIN and THERAPIST roles; delete is ADMIN-only.
const express = require("express");
const { listResources, getResource, createResource, updateResource, deleteResource } = require("../modules/resources/resource.controller");
const { verifyToken, authorize } = require("../middleware/auth");
const {
  createResourceSchema,
  resourceIdParamSchema,
  resourceListSchema,
  updateResourceSchema,
  validate,
} = require("../validators/resource.validator");

const router = express.Router();

// Every route below requires a valid JWT
router.use(verifyToken);

// Public (authenticated) — any logged-in user can list and view resources
router.get("/", validate(resourceListSchema), listResources);
router.get("/:id", validate(resourceIdParamSchema), getResource);

// Write operations — only staff roles may create or edit resources
router.post("/", authorize("ADMIN", "THERAPIST"), validate(createResourceSchema), createResource);
router.put("/:id", authorize("ADMIN", "THERAPIST"), validate(updateResourceSchema), updateResource);

// Deletion — only ADMIN may permanently remove resources
router.delete("/:id", authorize("ADMIN"), validate(resourceIdParamSchema), deleteResource);

module.exports = router;
