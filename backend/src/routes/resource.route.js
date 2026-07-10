// Resource library routes — browsing and curation of articles, videos, and PDFs
// All endpoints require JWT authentication (verifyToken applied to the entire router).
// Create/update are restricted to ADMIN and THERAPIST roles; delete is ADMIN-only.
const express = require("express");
const { listResources, getResource, createResource, updateResource, deleteResource } = require("../modules/resources/resource.controller");
const { verifyToken, authorize } = require("../middleware/auth");

const router = express.Router();

// Every route below requires a valid JWT
router.use(verifyToken);

// Public (authenticated) — any logged-in user can list and view resources
router.get("/", listResources);
router.get("/:id", getResource);

// Write operations — only staff roles may create or edit resources
router.post("/", authorize("ADMIN", "THERAPIST"), createResource);
router.put("/:id", authorize("ADMIN", "THERAPIST"), updateResource);

// Deletion — only ADMIN may permanently remove resources
router.delete("/:id", authorize("ADMIN"), deleteResource);

module.exports = router;
