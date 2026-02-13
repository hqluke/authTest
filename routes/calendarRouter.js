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
router.get("/edit", isAuthenticated, calendarController.getEditExercise);
router.post("/edit", isAuthenticated, calendarController.postEditExercise);
router.post("/delete", isAuthenticated, calendarController.deleteExercise);

module.exports = router;
