const axios = require("axios");

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_API = "https://api.paystack.co";

const paystack = axios.create({
  baseURL: PAYSTACK_API,
  headers: {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  },
});

exports.initializeTransaction = async ({ email, amount, metadata, reference }) => {
  const payload = { email, amount, metadata };
  if (reference) payload.reference = reference;
  const { data } = await paystack.post("/transaction/initialize", payload);
  return data;
};

exports.verifyTransaction = async (reference) => {
  const { data } = await paystack.get(`/transaction/verify/${reference}`);
  return data;
};

exports.listBanks = async () => {
  const { data } = await paystack.get("/bank?country=ghana");
  return data;
};
