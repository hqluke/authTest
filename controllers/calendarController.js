const db = require("../db/queries");

const getCalendar = async (req, res, next) => {
    try {
        const year = req.query.year || new Date().getFullYear();
        const month = req.query.month;
        const day = req.query.day;

        if (day && month) {
            // Show workout details for specific day
            const date = new Date(year, month - 1, day);
            const workouts = await db.getWorkoutsByDate(req.user.id, date);
            res.render("calendarDay", { workouts, year, month, day });
        } else if (month) {
            // Show daily view for the selected month
            const workoutDays = await db.getWorkoutDaysInMonth(
                req.user.id,
                year,
                month,
            );
            res.render("calendarMonth", { workoutDays, year, month });
        } else {
            // Show monthly summary view
            const monthlyCounts = await db.getMonthlyWorkoutCounts(
                req.user.id,
                year,
            );
            res.render("calendar", { monthlyCounts, year });
        }
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCalendar,
};
