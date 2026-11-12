const pool = require("../config/db");
const Booking = require("../models/Booking");

async function create(req, res) {
  const { event_id, quantity } = req.body;
  const qty = parseInt(quantity, 10);
  if (!event_id || !qty || qty < 1) {
    return res.status(400).json({ error: "event_id and a quantity of at least 1 are required" });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // FOR UPDATE locks this event row, so a second request has to wait
    const [eventRows] = await connection.query("SELECT * FROM events WHERE id = ? FOR UPDATE", [event_id]);
    const event = eventRows[0];
    if (!event || event.status !== "published") {
      await connection.rollback();
      return res.status(404).json({ error: "Event not found or not open for booking" });
    }

    const [reservedRows] = await connection.query(
      "SELECT COALESCE(SUM(quantity), 0) AS reserved FROM bookings WHERE event_id = ? AND status IN ('pending', 'paid')",
      [event_id]
    );
    const remaining = event.capacity - reservedRows[0].reserved;
    if (qty > remaining) {
      await connection.rollback();
      return res.status(409).json({ error: `Only ${remaining} ticket(s) left for this event` });
    }

    const bookingId = await Booking.insertBooking(connection, {
      userId: req.user.id,
      eventId: event_id,
      quantity: qty,
      totalAmount: qty * parseFloat(event.ticket_price),
    });
    await connection.commit();
    res.status(201).json(await Booking.getBookingById(bookingId));
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ error: "Could not create booking" });
  } finally {
    connection.release();
  }
}

async function listMine(req, res) {
  try {
    res.json(await Booking.listByUser(req.user.id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not fetch bookings" });
  }
}

async function cancel(req, res) {
  try {
    const booking = await Booking.getBookingById(req.params.id);
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    if (booking.user_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "You can only cancel your own bookings" });
    }
    if (booking.status === "cancelled") {
      return res.status(400).json({ error: "Booking is already cancelled" });
    }
    res.json(await Booking.updateStatus(req.params.id, "cancelled"));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not cancel booking" });
  }
}

module.exports = { create, listMine, cancel };