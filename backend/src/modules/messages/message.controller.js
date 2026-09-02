const prisma = require("../../config/prisma");
const { emitToUser, getIO } = require("../../sockets");
const { notifyConversationParticipants } = require("../../services/notification.service");

exports.listConversations = async (req, res, next) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: { participants: { some: { userId: req.user.id } } },
      include: {
        participants: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true, avatar: true } } } },
        messages: { take: 1, orderBy: { createdAt: "desc" }, select: { content: true, createdAt: true, senderId: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ conversations });
  } catch (error) {
    next(error);
  }
};

exports.createConversation = async (req, res, next) => {
  try {
    const { participantIds } = req.body;

    const allIds = [...new Set([req.user.id, ...participantIds])];

    const conversation = await prisma.conversation.create({
      data: {
        participants: {
          create: allIds.map((userId) => ({ userId })),
        },
      },
      include: {
        participants: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true, avatar: true } } } },
      },
    });

    // Real-time: notify all new participants (except creator) so their
    // conversation list updates instantly without polling.
    for (const p of allIds) {
      if (p !== req.user.id) {
        emitToUser(p, "conversation:new", { conversation });
      }
    }

    return res.status(201).json({ message: "Conversation created", conversation });
  } catch (error) {
    next(error);
  }
};

exports.getMessages = async (req, res, next) => {
  try {
    const { id } = req.params;

    const participant = await prisma.conversationParticipant.findFirst({
      where: { conversationId: id, userId: req.user.id },
    });
    if (!participant) return res.status(403).json({ message: "Not a participant" });

    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "asc" },
      include: { sender: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
    });

    return res.status(200).json({ messages });
  } catch (error) {
    next(error);
  }
};

exports.sendMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const participant = await prisma.conversationParticipant.findFirst({
      where: { conversationId: id, userId: req.user.id },
    });
    if (!participant) return res.status(403).json({ message: "Not a participant" });

    const message = await prisma.message.create({
      data: { conversationId: id, senderId: req.user.id, content },
      include: { sender: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
    });

    // Real-time: push the new message to all conversation participants
    // (except the sender). The frontend's SocketManager catches this event
    // globally and the conversation page's local listener adds it to state.
    const participants = await prisma.conversationParticipant.findMany({
      where: { conversationId: id },
      select: { userId: true },
    });
    for (const p of participants) {
      if (p.userId !== req.user.id) {
        emitToUser(p.userId, "message:new", { conversationId: id, message });
      }
    }

    return res.status(201).json({ message: "Message sent", msg: message });
  } catch (error) {
    next(error);
  }
};
