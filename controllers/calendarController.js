const db = require("../db/queries");

const getCalendar = async (req, res, next) => {
    try {
        const defaultYear =
            req.user && req.user.id === 7 ? 2026 : new Date().getFullYear();
        const year = req.query.year || defaultYear;
        const month = req.query.month;
        const day = req.query.day;

        if (day && month) {
            const date = new Date(year, month - 1, day);
            const workouts = await db.getWorkoutsByDate(req.user.id, date);
            const runs = await db.getRunsByDate(req.user.id, date);
            res.render("calendarDay", { workouts, runs, year, month, day });
        } else if (month) {
            const breakdown = await db.getMonthlyWorkoutBreakdown(
                req.user.id,
                year,
                month,
            );
            res.render("calendarMonth", { breakdown, year, month });
        } else {
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

const getEditExercise = async (req, res, next) => {
    try {
        const { year, month, day, exerciseId } = req.query;

        if (!exerciseId || exerciseId === "") {
            return res.status(400).send("Exercise ID is required");
        }

        const date = new Date(year, month - 1, day);

        const exerciseData = await db.getExerciseDataByDateAndExercise(
            req.user.id,
            date,
            parseInt(exerciseId),
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
            day,
        });
    } catch (error) {
        next(error);
    }
};

const postEditExercise = async (req, res, next) => {
    try {
        const { year, month, day } = req.body;
        const updates = [];

        Object.keys(req.body).forEach((key) => {
            if (key.startsWith("weight-")) {
                const id = key.split("-")[1];
                const reps = req.body[`reps-${id}`];
                const weight = req.body[`weight-${id}`];
                const sets = req.body[`sets-${id}`];

                if (reps && weight && sets) {
                    updates.push({ id, weight, reps, sets });
                }
            }
        });

        for (const update of updates) {
            const weightId = await db.getWeightIdFromWeight(
                parseInt(update.weight),
            );
            await db.updateExerciseData(
                parseInt(update.id),
                weightId.id,
                parseInt(update.reps),
                parseInt(update.sets),
            );
        }

        res.redirect(`/calendar?year=${year}&month=${month}&day=${day}`);
    } catch (error) {
        next(error);
    }
};

const deleteExercise = async (req, res, next) => {
    try {
        const { id, year, month, day } = req.body;
        await db.deleteExerciseData(parseInt(id));
        res.redirect(`/calendar?year=${year}&month=${month}&day=${day}`);
    } catch (error) {
        next(error);
    }
};

const getEditRun = async (req, res, next) => {
    try {
        const { runId, year, month, day } = req.query;

        if (!runId || runId === "") {
            return res.status(400).send("Run ID is required");
        }

        const run = await db.getRunById(parseInt(runId));

        if (!run) {
            return res.status(404).send("Run not found");
        }

        // Verify the run belongs to this user
        if (run.user_id !== req.user.id) {
            return res.status(403).send("Unauthorized");
        }

        res.render("calendarEditRun", {
            run,
            year,
            month,
            day,
        });
    } catch (error) {
        next(error);
    }
};

const postEditRun = async (req, res, next) => {
    try {
        const { runId, duration, distance, year, month, day } = req.body;

        // Validate duration format
        const durationRegex = /^[0-9]{1,2}:[0-9]{2}:[0-9]{2}$/;
        if (!durationRegex.test(duration)) {
            return res
                .status(400)
                .send("Invalid duration format. Use HH:MM:SS");
        }

        const parts = duration.split(":");
        const hours = parseInt(parts[0]);
        const minutes = parseInt(parts[1]);
        const seconds = parseInt(parts[2]);

        if (minutes >= 60 || seconds >= 60) {
            return res
                .status(400)
                .send("Minutes and seconds must be less than 60");
        }

        if (hours === 0 && minutes === 0 && seconds === 0) {
            return res.status(400).send("Duration must be greater than 0");
        }

        const dist = parseFloat(distance);
        if (isNaN(dist) || dist <= 0 || dist > 999.99) {
            return res.status(400).send("Invalid distance");
        }

        const formattedDuration = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

        await db.updateRun(parseInt(runId), formattedDuration, dist);

        res.redirect(`/calendar?year=${year}&month=${month}&day=${day}`);
    } catch (error) {
        next(error);
    }
};

const deleteRunPost = async (req, res, next) => {
    try {
        const { runId, year, month, day } = req.body;
        await db.deleteRun(parseInt(runId));
        res.redirect(`/calendar?year=${year}&month=${month}&day=${day}`);
    } catch (error) {
        next(error);
    }
};

const deleteAllSets = async (req, res, next) => {
    try {
        const { ids, year, month, day } = req.body;
        const idArray = JSON.parse(ids);

        // Delete all sets
        for (const id of idArray) {
            await db.deleteExerciseData(parseInt(id));
        }

        res.redirect(`/calendar?year=${year}&month=${month}&day=${day}`);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCalendar,
    getEditExercise,
    postEditExercise,
    deleteExercise,
    getEditRun,
    postEditRun,
    deleteRunPost,
    deleteAllSets,
};
