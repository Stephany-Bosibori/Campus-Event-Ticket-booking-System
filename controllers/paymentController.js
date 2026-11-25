const db = require("../config/db");
const Booking = require("../models/Booking");

// Safe optional load for Part 6 (Ticket model) so Part 5 works before and after Part 6 merges
let Ticket = null;
try {
  Ticket = require("../models/Ticket");
} catch (err) {
  if (err.code !== "MODULE_NOT_FOUND") {
    throw err;
  }
}

/**
 * POST /api/payments
 * Processes payment for a pending booking, marks it as paid, and triggers ticket generation.
 */
exports.createPayment = async (req, res) => {
  try {
    const { booking_id, amount, payment_method, transaction_ref } = req.body;

    // 1. Validate required fields
    if (!booking_id || amount === undefined || !payment_method) {
      return res.status(400).json({
        error: "booking_id, amount, and payment_method are required.",
      });
    }

    const numericAmount = Number(amount);
    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        error: "amount must be a positive number.",
      });
    }

    const allowedMethods = ["mpesa", "card", "cash", "bank_transfer"];
    const normalizedMethod = String(payment_method).toLowerCase().trim();
    if (!allowedMethods.includes(normalizedMethod)) {
      return res.status(400).json({
        error: `payment_method must be one of: ${allowedMethods.join(", ")}.`,
      });
    }

    // 2. Fetch booking and verify it exists
    const [bookingRows] = await db.query(
      "SELECT * FROM bookings WHERE id = ?",
      [booking_id]
    );

    if (!bookingRows || bookingRows.length === 0) {
      return res.status(404).json({ error: "Booking not found." });
    }

    const booking = bookingRows[0];

    // 3. Duplicate-payment protection
    if (booking.status === "paid" || booking.payment_status === "paid") {
      return res.status(409).json({
        error: "This booking has already been paid.",
      });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({
        error: "Cannot pay for a cancelled booking.",
      });
    }

    const [existingPayments] = await db.query(
      "SELECT id FROM payments WHERE booking_id = ? AND status = 'completed'",
      [booking.id]
    );

    if (existingPayments && existingPayments.length > 0) {
      return res.status(409).json({
        error: "A completed payment already exists for this booking.",
      });
    }

    // 4. Verify payment amount matches booking total (if total_amount is stored on bookings)
    if (
      booking.total_amount !== undefined &&
      booking.total_amount !== null &&
      numericAmount < Number(booking.total_amount)
    ) {
      return res.status(400).json({
        error: `Insufficient payment amount. Expected at least ${booking.total_amount}.`,
      });
    }

    // 5. Record payment in the payments table
    const reference =
      transaction_ref ||
      `PAY-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const [insertResult] = await db.query(
      `INSERT INTO payments (booking_id, amount, payment_method, transaction_ref, status)
       VALUES (?, ?, ?, ?, 'completed')`,
      [booking.id, numericAmount, normalizedMethod, reference]
    );

    // 6. Mark booking as paid using Booking.markAsPaid
    await Booking.markAsPaid(booking.id);

    // 7. Generate e-tickets once Part 6 (models/Ticket) is merged
    if (Ticket && typeof Ticket.generateForBooking === "function") {
      await Ticket.generateForBooking(booking.id);
    }

    return res.status(201).json({
      message: "Payment successful.",
      payment: {
        id: insertResult.insertId,
        booking_id: booking.id,
        amount: numericAmount,
        payment_method: normalizedMethod,
        transaction_ref: reference,
        status: "completed",
      },
    });
  } catch (err) {
    console.error("Payment processing error:", err);
    return res.status(500).json({
      error: "Internal server error while processing payment.",
    });
  }
};

/**
 * GET /api/payments/:bookingId
 * Retrieves payment details for a specific booking.
 */
exports.getPaymentByBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM payments WHERE booking_id = ? ORDER BY created_at DESC",
      [bookingId]
    );

    if (!rows || rows.length === 0) {
      return res
        .status(404)
        .json({ error: "No payment record found for this booking." });
    }

    return res.status(200).json({ payments: rows });
  } catch (err) {
    console.error("Fetch payment error:", err);
    return res.status(500).json({
      error: "Internal server error while retrieving payment.",
    });
  }
};