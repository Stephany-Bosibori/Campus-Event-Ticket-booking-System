const Event = require("../models/Event");

async function create(req, res) {
  try {
    const { title, event_date, capacity } = req.body;
    if (!title || !event_date || !capacity) {
      return res.status(400).json({ error: "title, event_date and capacity are required" });
    }
    const event = await Event.createEvent(req.user.id, req.body);
    res.status(201).json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not create event" });
  }
}

async function list(req, res) {
  try {
    const { category, venue, search } = req.query;
    const events = await Event.listEvents({ category, venue, search, onlyPublished: true });
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not fetch events" });
  }
}

async function getOne(req, res) {
  try {
    const event = await Event.getEventById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });
    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not fetch event" });
  }
}

async function update(req, res) {
  try {
    const event = await Event.getEventById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });

    const isOwner = event.organizer_id === req.user.id;
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ error: "You can only edit your own events" });
    }

    const updated = await Event.updateEvent(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not update event" });
  }
}

module.exports = { create, list, getOne, update };