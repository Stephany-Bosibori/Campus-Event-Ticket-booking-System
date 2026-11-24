// Generate e-tickets once Part 6 (models/Ticket) is merged
try {
  const Ticket = require("../models/Ticket");
  await Ticket.generateForBooking(booking.id);
} catch (err) {
  if (err.code !== "MODULE_NOT_FOUND") {
    throw err;
  }
}