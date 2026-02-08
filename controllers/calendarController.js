const db = require("../db/queries");

const getCalendar = async (req, res, next) => {
    try {
        const calendar = await db.getCalendarByYear();
        res.render("calendar", { calendar });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCalendar,
};
