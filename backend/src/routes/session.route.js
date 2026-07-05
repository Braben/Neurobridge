const express = require("express");
const { listSessions, createSession, getSession, updateSession, deleteSession, upsertSessionNote } = require("../modules/sessions/session.controller");
const { verifyToken, authorize } = require("../middleware/auth");
const { validate, createSessionSchema, updateSessionSchema, sessionNoteSchema, sessionIdParamSchema } = require("../validators/session.validator");

const router = express.Router();

router.use(verifyToken);

router.get("/", listSessions);
router.post("/", authorize("THERAPIST", "ADMIN"), validate(createSessionSchema), createSession);
router.get("/:id", validate(sessionIdParamSchema), getSession);
router.patch("/:id", authorize("THERAPIST"), validate(updateSessionSchema), updateSession);
router.delete("/:id", authorize("THERAPIST", "ADMIN"), validate(sessionIdParamSchema), deleteSession);
router.put("/:id/notes", authorize("THERAPIST"), validate(sessionNoteSchema), upsertSessionNote);

module.exports = router;
