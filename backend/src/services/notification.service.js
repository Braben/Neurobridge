// Notification service — creates database records and simultaneously pushes
// real-time socket events so recipients see alerts instantly.
// Every notification is persisted for the notification history page and emitted
// via socket.io so the frontend can show a toast / update the badge immediately.
const prisma = require("../config/prisma");
const { emitToUser } = require("../sockets");
const { sendNotificationEmail } = require("./email.service");
const { sendNotificationSms } = require("./sms.service");

const externalNotificationsEnabled = (key) => process.env[key] === "true";

const dispatchExternalNotification = async ({ userId, title, body }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, phone: true },
  });

  if (!user) return;

  const deliveries = [];
  if (user.email && externalNotificationsEnabled("EMAIL_NOTIFICATIONS_ENABLED")) {
    deliveries.push(sendNotificationEmail(user.email, title, body));
  }
  if (user.phone && externalNotificationsEnabled("SMS_NOTIFICATIONS_ENABLED")) {
    deliveries.push(sendNotificationSms(user.phone, title, body));
  }

  if (!deliveries.length) return;

  const results = await Promise.allSettled(deliveries);
  results
    .filter((result) => result.status === "rejected")
    .forEach((result) => {
      console.error("External notification delivery failed:", result.reason?.message || result.reason);
    });
};

/**
 * Creates a single notification for a user and pushes it in real-time.
 * @param {object} params
 * @param {string} params.userId   - recipient
 * @param {string} params.title    - short headline (e.g. "New Session Logged")
 * @param {string} params.body     - longer description
 * @returns {Promise<object>} the created notification row
 */
const createNotification = async ({ userId, title, body }) => {
  const notification = await prisma.notification.create({
    data: { userId, title, body },
  });

  // Real-time push — frontend SocketManager picks this up and dispatches to Redux
  emitToUser(userId, "notification:new", { notification });

  dispatchExternalNotification({ userId, title, body }).catch((err) => {
    console.error("Notification delivery failed:", err.message);
  });

  return notification;
};

/**
 * Notifies every participant in a conversation except the excluded user.
 * Useful when a new message is sent or the conversation is updated.
 */
const notifyConversationParticipants = async (conversationId, excludeUserId, title, body) => {
  const participants = await prisma.conversationParticipant.findMany({
    where: { conversationId },
    select: { userId: true },
  });

  for (const p of participants) {
    if (p.userId === excludeUserId) continue;
    await createNotification({ userId: p.userId, title, body });
  }
};

/**
 * Notifies all parents linked to a child (e.g. session logged, note added).
 */
const notifyChildParents = async (childId, title, body) => {
  const parents = await prisma.childParent.findMany({
    where: { childId },
    select: { parentId: true },
  });

  for (const p of parents) {
    await createNotification({ userId: p.parentId, title, body });
  }
};

/**
 * Notifies all therapists assigned to a child (e.g. intake form submitted).
 */
const notifyChildTherapists = async (childId, title, body) => {
  const therapists = await prisma.therapistAssignment.findMany({
    where: { childId },
    select: { therapistId: true },
  });

  for (const t of therapists) {
    await createNotification({ userId: t.therapistId, title, body });
  }
};

module.exports = { createNotification, notifyConversationParticipants, notifyChildParents, notifyChildTherapists };
