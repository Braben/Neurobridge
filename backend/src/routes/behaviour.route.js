const express = require("express");
const { listBehaviours, createBehaviour, updateBehaviour, deleteBehaviour, listBehaviourLogs, createBehaviourLog } = require("../modules/behaviours/behaviour.controller");
const { verifyToken } = require("../middleware/auth");
const { validate, createBehaviourSchema, updateBehaviourSchema, behaviourIdParamSchema, createBehaviourLogSchema } = require("../validators/behaviour.validator");

const router = express.Router();

router.use(verifyToken);

router.get("/child/:childId", listBehaviours);
router.post("/child/:childId", validate(createBehaviourSchema), createBehaviour);
router.patch("/:id", validate(updateBehaviourSchema), updateBehaviour);
router.delete("/:id", validate(behaviourIdParamSchema), deleteBehaviour);
router.get("/:id/logs", validate(behaviourIdParamSchema), listBehaviourLogs);
router.post("/:id/logs", validate(createBehaviourLogSchema), createBehaviourLog);

module.exports = router;
