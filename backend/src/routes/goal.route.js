const express = require("express");
const { listGoals, createGoal, updateGoal, deleteGoal } = require("../modules/goals/goal.controller");
const { verifyToken } = require("../middleware/auth");
const { validate, createGoalSchema, updateGoalSchema, goalIdParamSchema } = require("../validators/goal.validator");

const router = express.Router();

router.use(verifyToken);

router.get("/child/:childId", listGoals);
router.post("/child/:childId", validate(createGoalSchema), createGoal);
router.patch("/:id", validate(updateGoalSchema), updateGoal);
router.delete("/:id", validate(goalIdParamSchema), deleteGoal);

module.exports = router;
