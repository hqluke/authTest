const express = require("express");
const router = express.Router();
const calendarController = require("../controllers/calendarController");

const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/");
};

// Apply authentication to ALL calendar routes
router.use(isAuthenticated);

router.get("/", calendarController.getCalendar);
router.get("/edit", calendarController.getEditExercise);
router.post("/edit", calendarController.postEditExercise);
router.post("/delete", calendarController.deleteExercise);
router.get("/edit-run", calendarController.getEditRun);
router.post("/edit-run", calendarController.postEditRun);
router.post("/delete-run", calendarController.deleteRunPost);

module.exports = router;
