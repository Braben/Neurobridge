const express = require("express");
const {
  approveUser,
  deleteUser,
  getOverview,
  getSessionFee,
  getStats,
  inviteAdmin,
  listChildrenDatabase,
  listParents,
  listTherapists,
  listTherapySessions,
  listUsers,
  rescheduleBooking,
  updateSessionFee,
  updateUser,
} = require("../modules/admin/admin.controller");
const { verifyToken, authorize } = require("../middleware/auth");
const { writeLimiter } = require("../middleware/rateLimiters");
const { adminInviteSchema, bookingRescheduleSchema, sessionFeeSchema, validate, updateUserSchema, userIdParamSchema } = require("../validators/admin.validator");

const router = express.Router();
const { listInquiries, updateInquiryStatus } = require("../modules/contact/contact.controller"); // Keep inquiries separate from private conversations.
const { inquiryUpdateSchema } = require("../validators/contact.validator"); // Validate workflow status changes.
const { validate: validateBody } = require("../validators/auth.validator"); // Use body-only validation for inquiry updates.

router.use(verifyToken);
router.use(authorize("ADMIN"));
router.get("/inquiries", listInquiries); // Expose durable contact submissions to administrators only.
router.patch("/inquiries/:id/status", writeLimiter, validateBody(inquiryUpdateSchema), updateInquiryStatus); // Bound and validate admin writes.

router.get("/users", listUsers);
router.get("/overview", getOverview);
router.get("/parents", listParents);
router.get("/therapists", listTherapists);
router.get("/children", listChildrenDatabase);
router.get("/sessions", listTherapySessions);
router.post("/admin-invites", writeLimiter, validate(adminInviteSchema), inviteAdmin);
router.get("/settings/session-fee", getSessionFee);
router.patch("/settings/session-fee", writeLimiter, validate(sessionFeeSchema), updateSessionFee);
router.patch("/users/:id/approve", validate(userIdParamSchema), approveUser);
router.patch("/users/:id", validate(updateUserSchema), updateUser);
router.delete("/users/:id", validate(userIdParamSchema), deleteUser);
router.patch("/bookings/:id/reschedule", validate(bookingRescheduleSchema), rescheduleBooking);
router.get("/stats", getStats);

module.exports = router;
