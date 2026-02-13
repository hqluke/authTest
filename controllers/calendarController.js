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

const getEditExercise = async (req, res, next) => {
    try {
        const { year, month, day, exerciseId } = req.query;
        
        if (!exerciseId || exerciseId === '') {
            return res.status(400).send("Exercise ID is required");
        }
        
        const date = new Date(year, month - 1, day);
        
        const exerciseData = await db.getExerciseDataByDateAndExercise(
            req.user.id,
            date, 
            parseInt(exerciseId)  // Parse to int
        );
        
        if (!exerciseData || exerciseData.length === 0) {
            return res.status(404).send("Exercise data not found");
        }
        
        const weights = await db.getWeights();
        const reps = await db.getReps();
        const sets = await db.getSets();
        
        res.render("calendarEdit", { 
            exerciseData, 
            weights, 
            reps, 
            sets,
            year, 
            month, 
            day 
        });
    } catch (error) {
        next(error);
    }
};

const postEditExercise = async (req, res, next) => {
    try {
        const { year, month, day } = req.body;
        const updates = [];
        
        // Parse all the update data
        Object.keys(req.body).forEach(key => {
            if (key.startsWith('weight-')) {
                const id = key.split('-')[1];
                const reps = req.body[`reps-${id}`];  // Fixed: use brackets
                const weight = req.body[`weight-${id}`];  // Fixed: use brackets
                const sets = req.body[`sets-${id}`];  // Fixed: use brackets
                
                if (reps && weight && sets) {
                    updates.push({ id, weight, reps, sets });
                }
            }
        });
        
        // Update each record
        for (const update of updates) {
            const weightId = await db.getWeightIdFromWeight(parseInt(update.weight));
            await db.updateExerciseData(
                parseInt(update.id),
                weightId.id,
                parseInt(update.reps),
                parseInt(update.sets)
            );
        }
        
        res.redirect(`/calendar?year=${year}&month=${month}&day=${day}`);  // Fixed: use parentheses
    } catch (error) {
        next(error);
    }
};

const deleteExercise = async (req, res, next) => {
    try {
        const { id, year, month, day } = req.body;
        await db.deleteExerciseData(parseInt(id));
        res.redirect(`/calendar?year=${year}&month=${month}&day=${day}`);  // Fixed: use parentheses
    } catch (error) {
        next(error);
    }
};
module.exports = {
    getCalendar,
    getEditExercise,
    postEditExercise,
    deleteExercise,
};
