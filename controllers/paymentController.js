const pool = require("../config/db");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");

const ALLOWED_METHODS = ["mock", "mpesa"];

async function pay(req, res) {
  const { booking_id, method = "mock" } = req.body;

  if (!booking_id) {
    return res.status(400).json({ error: "booking_id is required" });
  }

  if (!ALLOWED_METHODS.includes(method)) {
    return res.status(400).json({ error: "method must be 'mock' or 'mpesa'" });
  }

  // The booking checks and the payment itself are added in the next commits.
  res.status(501).json({ error: "Payment not finished yet" });
}

module.exports = { pay };
