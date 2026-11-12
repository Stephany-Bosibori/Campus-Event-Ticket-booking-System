const pool = require("../config/db");

async function getBookingById(id) {
  const [rows] = await pool.query("SELECT * FROM bookings WHERE id = ?", [id]);
  return rows[0] || null;
}

async function listByUser(userId) {
  const [rows] = await pool.query(
    `SELECT b.*, e.title AS event_title, e.event_date, e.venue
     FROM bookings b JOIN events e ON b.event_id = e.id
     WHERE b.user_id = ? ORDER BY b.created_at DESC`,
    [userId]
  );
  return rows;
}

async function updateStatus(id, status) {
  await pool.query("UPDATE bookings SET status = ? WHERE id = ?", [status, id]);
  return getBookingById(id);
}

// Takes a connection (not the pool) so it can run inside a transaction.
async function insertBooking(connection, { userId, eventId, quantity, totalAmount }) {
  const [result] = await connection.query(
    `INSERT INTO bookings (user_id, event_id, quantity, total_amount, status)
     VALUES (?, ?, ?, ?, 'pending')`,
    [userId, eventId, quantity, totalAmount]
  );
  return result.insertId;
}

module.exports = { getBookingById, listByUser, updateStatus, insertBooking };