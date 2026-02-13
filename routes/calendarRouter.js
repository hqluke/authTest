const express = require("express");
const router = express.Router();
const calendarController = require("../controllers/calendarController");

const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/");
};

router.get("/", isAuthenticated, calendarController.getCalendar);

module.exports = router;
