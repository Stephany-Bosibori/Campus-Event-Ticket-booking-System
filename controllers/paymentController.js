const pool = require("../config/db");
const Booking = require("../models/Booking");
const Payment = require("../controller/Payment");

const { sendBookingConfirmation } = require("../services/notificationService");
// TODO (Part 6): once the tickets branch is merged, uncomment these lines
    // and add this at the top of the file:
    //   const Ticket = require("../models/Ticket");
    // await Ticket.generateForBooking(booking.id);
const pool = require("../config/db");
const Booking = require("../models/Booking");
const Payment = require("../controller/Payment");
const { sendBookingConfirmation } = require("../services/notificationService");

const ALLOWED_METHODS = ["mock", "mpesa"];

async function pay(req, res) {
  const { booking_id, method = "mock" } = req.body;

  if (!booking_id) {
    return res.status(400).json({ error: "booking_id is required" });
  }

  if (!ALLOWED_METHODS.includes(method)) {
    return res.status(400).json({ error: "method must be 'mock' or 'mpesa'" });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // FOR UPDATE locks the booking row, so two payments for the same
    // booking cannot both succeed.
    const [rows] = await connection.query(
      "SELECT * FROM bookings WHERE id = ? FOR UPDATE",
      [booking_id]
    );
    const booking = rows[0];

    if (!booking) {
      await connection.rollback();
      return res.status(404).json({ error: "Booking not found" });
    }

    if (booking.user_id !== req.user.id) {
      await connection.rollback();
      return res.status(403).json({ error: "You can only pay for your own bookings" });
    }

    if (booking.status !== "pending") {
      await connection.rollback();
      return res.status(400).json({ error: `Booking is already ${booking.status}, only pending bookings can be paid` });
    }

    // Mock payment: no real M-Pesa call, we just record a successful payment.
    const payment = await Payment.createPayment(connection, {
      bookingId: booking.id,
      amount: booking.total_amount,
      method,
    });

    await Booking.markAsPaid(connection, booking.id);
    await connection.commit();

    // TODO (Part 6): once the tickets branch is merged, uncomment these lines
    // and add this at the top of the file:
    //   const Ticket = require("../models/Ticket");
    // await Ticket.generateForBooking(booking.id);

    // Part 8a: print the booking confirmation. It never throws, so it
    // cannot break a payment that has already succeeded.
    await sendBookingConfirmation(booking.id);

    res.status(201).json({
      message: "Payment successful",
      payment: { id: payment.id, reference: payment.reference, amount: booking.total_amount, method },
      booking: await Booking.getBookingById(booking.id),
    });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ error: "Could not process payment" });
  } finally {
    connection.release();
  }
}

module.exports = { pay };

  const { booking_id, method = "mock" } = req.body;

  if (!booking_id) {
    return res.status(400).json({ error: "booking_id is required" });
  }

  if (!ALLOWED_METHODS.includes(method)) {
    return res.status(400).json({ error: "method must be 'mock' or 'mpesa'" });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // FOR UPDATE locks the booking row, so two payments for the same
    // booking cannot both succeed.
    const [rows] = await connection.query(
      "SELECT * FROM bookings WHERE id = ? FOR UPDATE",
      [booking_id]
    );
    const booking = rows[0];

    if (!booking) {
      await connection.rollback();
      return res.status(404).json({ error: "Booking not found" });
    }

    if (booking.user_id !== req.user.id) {
      await connection.rollback();
      return res.status(403).json({ error: "You can only pay for your own bookings" });
    }

    if (booking.status !== "pending") {
      await connection.rollback();
      return res.status(400).json({ error: `Booking is already ${booking.status}, only pending bookings can be paid` });
    }

    // Mock payment: no real M-Pesa call, we just record a successful payment.
    const payment = await Payment.createPayment(connection, {
      bookingId: booking.id,
      amount: booking.total_amount,
      method,
    });

    await Booking.markAsPaid(connection, booking.id);
    await connection.commit();

    // Part 8a: print the booking confirmation. It never throws, so it
    // cannot break a payment that has already succeeded.
    await sendBookingConfirmation(booking.id);

    res.status(201).json({
      message: "Payment successful",
      payment: { id: payment.id, reference: payment.reference, amount: booking.total_amount, method },
      booking: await Booking.getBookingById(booking.id),
    });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ error: "Could not process payment" });
  } finally {
    connection.release();
  }


module.exports = { pay };

