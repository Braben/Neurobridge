const express = require("express");
const {
  approveUser,
  deleteUser,
  getOverview,
  getStats,
  listChildrenDatabase,
  listParents,
  listTherapists,
  listTherapySessions,
  listUsers,
  rescheduleBooking,
  updateUser,
} = require("../modules/admin/admin.controller");
const { verifyToken, authorize } = require("../middleware/auth");
const { bookingRescheduleSchema, validate, updateUserSchema, userIdParamSchema } = require("../validators/admin.validator");

const router = express.Router();

router.use(verifyToken);
router.use(authorize("ADMIN"));

router.get("/users", listUsers);
router.get("/overview", getOverview);
router.get("/parents", listParents);
router.get("/therapists", listTherapists);
router.get("/children", listChildrenDatabase);
router.get("/sessions", listTherapySessions);
router.patch("/users/:id/approve", validate(userIdParamSchema), approveUser);
router.patch("/users/:id", validate(updateUserSchema), updateUser);
router.delete("/users/:id", validate(userIdParamSchema), deleteUser);
router.patch("/bookings/:id/reschedule", validate(bookingRescheduleSchema), rescheduleBooking);
router.get("/stats", getStats);

module.exports = router;
