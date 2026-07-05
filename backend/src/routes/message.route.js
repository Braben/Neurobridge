const express = require("express");
const { listConversations, createConversation, getMessages, sendMessage } = require("../modules/messages/message.controller");
const { verifyToken } = require("../middleware/auth");
const { validate, createConversationSchema, sendMessageSchema, conversationIdParamSchema } = require("../validators/message.validator");

const router = express.Router();

router.use(verifyToken);

router.get("/conversations", listConversations);
router.post("/conversations", validate(createConversationSchema), createConversation);
router.get("/conversations/:id/messages", validate(conversationIdParamSchema), getMessages);
router.post("/conversations/:id/messages", validate(sendMessageSchema), sendMessage);

module.exports = router;
