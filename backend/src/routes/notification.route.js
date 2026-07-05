// Notification routes — all require authentication.
// The order matters: /unread-count and /read-all must be defined before
// /:id/read so Express doesn't interpret "unread-count" as an :id param.
const express = require("express");
const { listNotifications, markAsRead, markAllAsRead, getUnreadCount } = require("../modules/notifications/notification.controller");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

router.use(verifyToken);

router.get("/", listNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/:id/read", markAsRead);
router.patch("/read-all", markAllAsRead);

module.exports = router;
