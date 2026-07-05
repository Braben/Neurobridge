// Notification CRUD controller.
// All endpoints are scoped to the authenticated user — a user can only see
// and manage their own notifications. Unread count is computed client-side
// from the returned array for consistency, but also exposed as a dedicated
// endpoint for polling by the Navbar badge.
const prisma = require("../../config/prisma");

/**
 * GET /api/v1/notifications
 * Returns the 50 most recent notifications for the authenticated user,
 * along with a pre-computed unread count.
 */
exports.listNotifications = async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return res.status(200).json({ notifications, unreadCount });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/notifications/:id/read
 * Marks a single notification as read. Scoped to the owning user.
 */
exports.markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findFirst({
      where: { id, userId: req.user.id },
    });
    if (!notification) return res.status(404).json({ message: "Notification not found" });

    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return res.status(200).json({ message: "Marked as read" });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/notifications/read-all
 * Marks every unread notification belonging to the user as read in one query.
 */
exports.markAllAsRead = async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true },
    });

    return res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/notifications/unread-count
 * Lightweight endpoint for the Navbar badge to poll without fetching the full list.
 * Returns just { unreadCount: number }.
 */
exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await prisma.notification.count({
      where: { userId: req.user.id, isRead: false },
    });

    return res.status(200).json({ unreadCount: count });
  } catch (error) {
    next(error);
  }
};
