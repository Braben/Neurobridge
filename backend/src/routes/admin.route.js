const express = require("express");
const { listUsers, approveUser, getStats } = require("../modules/admin/admin.controller");
const { verifyToken, authorize } = require("../middleware/auth");
const { validate, userIdParamSchema } = require("../validators/admin.validator");

const router = express.Router();

router.use(verifyToken);
router.use(authorize("ADMIN"));

router.get("/users", listUsers);
router.patch("/users/:id/approve", validate(userIdParamSchema), approveUser);
router.get("/stats", getStats);

module.exports = router;
