const db = require("../db/queries");

const getCalendar = async (req, res, next) => {
    try {
        const year = req.query.year || new Date().getFullYear();
        const month = req.query.month;
        const day = req.query.day;
        
        if (day && month) {
            const date = new Date(year, month - 1, day);
            const workouts = await db.getWorkoutsByDate(req.user.id, date);
            const runs = await db.getRunsByDate(req.user.id, date);
            res.render("calendarDay", { workouts, runs, year, month, day });
        } else if (month) {
            const breakdown = await db.getMonthlyWorkoutBreakdown(req.user.id, year, month);
            res.render("calendarMonth", { breakdown, year, month });
        } else {
            const monthlyCounts = await db.getMonthlyWorkoutCounts(req.user.id, year);
            res.render("calendar", { monthlyCounts, year });
        }
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCalendar,
};
