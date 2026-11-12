const express = require("express");
const router = express.Router();
const eventController = require("../controllers/eventController");
const { requireAuth, requireRole } = require("../middleware/auth");

router.get("/", eventController.list);
router.get("/:id", eventController.getOne);
router.post("/", requireAuth, requireRole("organizer", "admin"), eventController.create);
router.patch("/:id", requireAuth, requireRole("organizer", "admin"), eventController.update);

module.exports = router;