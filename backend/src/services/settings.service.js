const prisma = require("../config/prisma");

const THERAPY_SESSION_FEE_KEY = "therapy_session_fee_pesewas";
const DEFAULT_THERAPY_SESSION_FEE = Number(process.env.SESSION_FEE_PESEWAS) || 15000;

exports.getTherapySessionFeePesewas = async () => {
  const setting = await prisma.appSetting.findUnique({
    where: { key: THERAPY_SESSION_FEE_KEY },
  });

  const amount = Number(setting?.value);
  return Number.isInteger(amount) && amount >= 100 ? amount : DEFAULT_THERAPY_SESSION_FEE;
};

exports.setTherapySessionFeePesewas = async (amount, updatedById) => {
  return prisma.appSetting.upsert({
    where: { key: THERAPY_SESSION_FEE_KEY },
    create: {
      key: THERAPY_SESSION_FEE_KEY,
      value: String(amount),
      description: "Payment amount charged per therapy session for parents, in pesewas.",
      updatedById,
    },
    update: {
      value: String(amount),
      updatedById,
    },
  });
};
