const prisma = require("../../config/prisma");
const paystack = require("../../services/paystack.service");

exports.listPlans = async (req, res, next) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: "asc" },
    });
    return res.status(200).json({ plans });
  } catch (error) {
    next(error);
  }
};

exports.createPlan = async (req, res, next) => {
  try {
    const { name, description, price, duration, features } = req.body;
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Only admins can create plans" });
    }

    const plan = await prisma.subscriptionPlan.create({
      data: { name, description, price, duration, features: features || [] },
    });
    return res.status(201).json({ message: "Plan created", plan });
  } catch (error) {
    next(error);
  }
};

exports.updatePlan = async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Only admins can update plans" });
    }
    const plan = await prisma.subscriptionPlan.update({
      where: { id: req.params.id },
      data: req.body,
    });
    return res.status(200).json({ message: "Plan updated", plan });
  } catch (error) {
    next(error);
  }
};

exports.subscribe = async (req, res, next) => {
  try {
    const { planId } = req.body;

    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan || !plan.isActive) {
      return res.status(404).json({ message: "Plan not found or inactive" });
    }

    const activeSub = await prisma.userSubscription.findFirst({
      where: { userId: req.user.id, status: "ACTIVE" },
    });
    if (activeSub) {
      return res.status(409).json({ message: "You already have an active subscription" });
    }

    const reference = `SUB-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const response = await paystack.initializeTransaction({
      email: req.user.email,
      amount: plan.price,
      reference,
      metadata: { userId: req.user.id, subscriptionId: planId },
    });

    await prisma.transaction.create({
      data: {
        userId: req.user.id,
        email: req.user.email,
        amount: plan.price,
        reference,
        status: "PENDING",
        metadata: { subscriptionId: planId },
        subscriptionId: planId,
      },
    });

    return res.status(200).json({
      authorizationUrl: response.data.authorization_url,
      reference,
    });
  } catch (error) {
    next(error);
  }
};

exports.mySubscription = async (req, res, next) => {
  try {
    const sub = await prisma.userSubscription.findFirst({
      where: { userId: req.user.id, status: "ACTIVE" },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json({ subscription: sub || null });
  } catch (error) {
    next(error);
  }
};

exports.allSubscriptions = async (req, res, next) => {
  try {
    const subscriptions = await prisma.userSubscription.findMany({
      include: { plan: true, user: { select: { id: true, firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json({ subscriptions });
  } catch (error) {
    next(error);
  }
};
