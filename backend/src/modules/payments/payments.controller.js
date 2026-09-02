const prisma = require("../../config/prisma");
const paystack = require("../../services/paystack.service");
const { createNotification } = require("../../services/notification.service");
const { getTherapySessionFeePesewas } = require("../../services/settings.service");

exports.getSessionFee = async (req, res, next) => {
  try {
    const amount = await getTherapySessionFeePesewas();
    return res.status(200).json({ amount });
  } catch (error) {
    next(error);
  }
};

exports.initializePayment = async (req, res, next) => {
  try {
    const { amount, bookingId } = req.body;
    let payableAmount = Number(amount);

    if (bookingId) {
      const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
      if (!booking) return res.status(404).json({ message: "Booking not found" });
      if (booking.parentId !== req.user.id && req.user.role !== "ADMIN") {
        return res.status(403).json({ message: "You cannot pay for this booking" });
      }
      payableAmount = await getTherapySessionFeePesewas();
    }

    if (!payableAmount || payableAmount < 100) {
      return res.status(400).json({ message: "Amount must be at least 100 pesewas (GHS 1)" });
    }

    const reference = `NB-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const metadata = { userId: req.user.id };
    if (bookingId) metadata.bookingId = bookingId;

    const response = await paystack.initializeTransaction({
      email: req.user.email,
      amount: payableAmount,
      reference,
      metadata,
    });

    await prisma.transaction.create({
      data: {
        userId: req.user.id,
        email: req.user.email,
        amount: payableAmount,
        reference,
        status: "PENDING",
        metadata,
        bookingId: bookingId || null,
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

exports.verifyPayment = async (req, res, next) => {
  try {
    const { reference } = req.params;
    const response = await paystack.verifyTransaction(reference);

    if (response.data.status === "success") {
      await prisma.transaction.update({
        where: { reference },
        data: { status: "SUCCESS", paidAt: new Date() },
      });

      const tx = await prisma.transaction.findUnique({ where: { reference } });

      if (tx.bookingId) {
        await prisma.booking.update({
          where: { id: tx.bookingId },
          data: { status: "CONFIRMED" },
        });
      }

      return res.status(200).json({ status: "success", transaction: response.data });
    }

    await prisma.transaction.update({
      where: { reference },
      data: { status: "FAILED" },
    });

    return res.status(200).json({ status: "failed", transaction: response.data });
  } catch (error) {
    next(error);
  }
};

exports.handleWebhook = async (req, res, next) => {
  try {
    const event = req.body;

    if (event.event === "charge.success") {
      const { reference, status, amount, metadata } = event.data;

      await prisma.transaction.update({
        where: { reference },
        data: {
          status: status === "success" ? "SUCCESS" : "FAILED",
          paidAt: status === "success" ? new Date() : undefined,
        },
      });

      if (metadata?.bookingId && status === "success") {
        await prisma.booking.update({
          where: { id: metadata.bookingId },
          data: { status: "CONFIRMED" },
        });

        const booking = await prisma.booking.findUnique({
          where: { id: metadata.bookingId },
          include: { child: { select: { firstName: true } } },
        });

        if (booking) {
          await createNotification({
            userId: booking.parentId,
            title: "Payment Successful",
            body: `Payment of GHS ${amount / 100} confirmed for ${booking.child.firstName}'s session`,
          });
          await createNotification({
            userId: booking.therapistId,
            title: "Session Booked & Paid",
            body: `A session has been booked and paid for`,
          });
        }
      }

      if (metadata?.subscriptionId && status === "success") {
        const sub = await prisma.subscriptionPlan.findUnique({
          where: { id: metadata.subscriptionId },
        });
        if (sub) {
          await prisma.userSubscription.create({
            data: {
              userId: metadata.userId,
              planId: sub.id,
              startDate: new Date(),
              endDate: new Date(Date.now() + sub.duration * 86400000),
              status: "ACTIVE",
              transactionId: reference,
            },
          });
        }
      }
    }

    return res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};

exports.listTransactions = async (req, res, next) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json({ transactions });
  } catch (error) {
    next(error);
  }
};

exports.revenueDashboard = async (req, res, next) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const [transactions, activeSubs, totalUsers] = await Promise.all([
      prisma.transaction.findMany({
        where: { status: "SUCCESS" },
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
      }),
      prisma.userSubscription.count({ where: { status: "ACTIVE" } }),
      prisma.user.count(),
    ]);

    const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);
    const thisMonth = transactions.filter(
      (t) => new Date(t.createdAt).getMonth() === new Date().getMonth()
    );
    const monthlyRevenue = thisMonth.reduce((sum, t) => sum + t.amount, 0);

    return res.status(200).json({
      revenue: { total: totalRevenue, monthly: monthlyRevenue },
      activeSubscriptions: activeSubs,
      totalUsers,
      recentTransactions: transactions.slice(0, 20),
    });
  } catch (error) {
    next(error);
  }
};
