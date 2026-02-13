const pool = require("./pool");

const getExercises = async () => {
    const exerciseList = await pool.query("SELECT * FROM exercise");
    return exerciseList.rows;
};

const getWeights = async () => {
    const weightList = await pool.query("SELECT * FROM weights");
    return weightList.rows;
};

const getWeightIdFromWeight = async (weight) => {
    const weightId = await pool.query(
        "SELECT id FROM weights WHERE weight = $1",
        [weight],
    );
    return weightId.rows[0];
};

const getUperBodyExercises = async () => {
    const upperBodyExercises = await pool.query(
        "SELECT * FROM exercise WHERE isupperbody = true",
    );
    return upperBodyExercises.rows;
};

const getLowerBodyExercises = async () => {
    const lowerBodyExercises = await pool.query(
        "SELECT * FROM exercise WHERE isupperbody = false",
    );
    return lowerBodyExercises.rows;
};

const getExerciseById = async (id) => {
    const exercise = await pool.query(
        "SELECT distinct * FROM exercise WHERE id = $1",
        [id],
    );
    return exercise.rows[0];
};

const getReps = async () => {
    const reps = await pool.query("SELECT * FROM reps");
    return reps.rows;
};

const getSets = async () => {
    const sets = await pool.query("SELECT * FROM sets");
    return sets.rows;
};

const insertData = async (userId, exerciseId, weight, reps, sets, date = null) => {
    const dateToUse = date || new Date().toISOString().split("T")[0];

    const result = await pool.query(
        "INSERT INTO complete (user_id, date, exercise_id, weight_id, reps, sets) VALUES ($1, $2, $3, $4, $5, $6)",
        [userId, dateToUse, exerciseId, weight, reps, sets],
    );
    return result.rows;
};

const getLastDataFromExerciseID = async (exerciseId, userId) => {
    const lastData = await pool.query(
        "SELECT * FROM complete WHERE exercise_id = $1 and user_id = $2 ORDER BY date DESC LIMIT 10",
        [exerciseId, userId],
    );

    if (lastData.rows.length === 0) {
        return [];
    }

    const newestDate = lastData.rows[0].date;

    const latestData = await pool.query(
        `SELECT c.reps, w.weight, c.weight_id, c.sets from complete c join weights w on c.weight_id = w.id where c.exercise_id = $1 and c.user_id = $2 and c.date = $3 order by c.weight_id desc, c.reps desc`,
        [exerciseId, userId, newestDate],
    );

    const sets = latestData.rows[0].sets;
    return latestData.rows.slice(0, sets);
};

const getCalendarByYear = async (userId, year = new Date().getFullYear()) => {
    const calendar = await pool.query(
        `SELECT c.date, e.name, c.reps, w.weight, c.weight_id, c.sets
        FROM complete c
        JOIN exercise e ON c.exercise_id = e.id
        JOIN weights w ON c.weight_id = w.id
        WHERE EXTRACT(YEAR FROM c.date) = $1 and c.user_id = $2
        ORDER BY c.date DESC, c.id`,
        [year, userId],
    );
    return calendar.rows;
};

const getMonthlyWorkoutCounts = async (userId, year = new Date().getFullYear()) => {
    const monthlyCounts = await pool.query(
        `WITH all_workout_dates AS (
            SELECT DISTINCT 
                EXTRACT(MONTH FROM date) as month,
                date
            FROM complete
            WHERE user_id = $1 AND EXTRACT(YEAR FROM date) = $2
            
            UNION
            
            SELECT DISTINCT 
                EXTRACT(MONTH FROM date) as month,
                date
            FROM run
            WHERE user_id = $1 AND EXTRACT(YEAR FROM date) = $2
        )
        SELECT 
            month,
            COUNT(DISTINCT date) as total_days,
            COUNT(DISTINCT CASE WHEN EXISTS (
                SELECT 1 FROM complete c
                JOIN exercise e ON c.exercise_id = e.id
                WHERE c.date = awd.date 
                AND c.user_id = $1
                AND e.isupperbody = true
            ) THEN date END) as upper_days,
            COUNT(DISTINCT CASE WHEN EXISTS (
                SELECT 1 FROM complete c
                JOIN exercise e ON c.exercise_id = e.id
                WHERE c.date = awd.date 
                AND c.user_id = $1
                AND e.isupperbody = false
            ) THEN date END) as lower_days,
            COUNT(DISTINCT CASE WHEN EXISTS (
                SELECT 1 FROM run r
                WHERE r.date = awd.date 
                AND r.user_id = $1
            ) THEN date END) as run_days
        FROM all_workout_dates awd
        GROUP BY month
        ORDER BY month`,
        [userId, year]
    );
    return monthlyCounts.rows;
};
const getWorkoutDaysInMonth = async (userId, year, month) => {
    const workoutDays = await pool.query(
        `SELECT DISTINCT date
        FROM complete
        WHERE user_id = $1 
            AND EXTRACT(YEAR FROM date) = $2 
            AND EXTRACT(MONTH FROM date) = $3
        ORDER BY date`,
        [userId, year, month],
    );
    return workoutDays.rows;
};

const getWorkoutsByDate = async (userId, date) => {
    const workouts = await pool.query(
        `SELECT c.id, c.date, e.name, e.id as exercise_id, c.reps, w.weight, c.weight_id, c.sets, e.isupperbody
        FROM complete c
        JOIN exercise e ON c.exercise_id = e.id
        JOIN weights w ON c.weight_id = w.id
        WHERE c.user_id = $1 AND c.date = $2
        ORDER BY c.id`,
        [userId, date]
    );
    return workouts.rows;
};

const getMonthlyWorkoutBreakdown = async (userId, year, month) => {
    const breakdown = await pool.query(
        `WITH workout_dates AS (
            SELECT DISTINCT date FROM complete WHERE user_id = $1
            AND EXTRACT(YEAR FROM date) = $2 
            AND EXTRACT(MONTH FROM date) = $3
            UNION
            SELECT DISTINCT date FROM run WHERE user_id = $1
            AND EXTRACT(YEAR FROM date) = $2 
            AND EXTRACT(MONTH FROM date) = $3
        )
        SELECT 
            wd.date,
            EXISTS(
                SELECT 1 FROM complete c 
                JOIN exercise e ON c.exercise_id = e.id 
                WHERE c.date = wd.date AND c.user_id = $1 AND e.isupperbody = true
            ) as has_upper,
            EXISTS(
                SELECT 1 FROM complete c 
                JOIN exercise e ON c.exercise_id = e.id 
                WHERE c.date = wd.date AND c.user_id = $1 AND e.isupperbody = false
            ) as has_lower,
            EXISTS(
                SELECT 1 FROM run r 
                WHERE r.date = wd.date AND r.user_id = $1
            ) as has_run
        FROM workout_dates wd
        ORDER BY wd.date`,
        [userId, year, month],
    );
    return breakdown.rows;
};

const getRunsByDate = async (userId, date) => {
    const runs = await pool.query(
        `SELECT 
            date, 
            TO_CHAR(duration, 'HH24:MI:SS') as duration,
            distance
        FROM run
        WHERE user_id = $1 AND date = $2`,
        [userId, date]
    );
    return runs.rows;
};

const getExerciseDataByDateAndExercise = async (userId, date, exerciseId) => {
    const data = await pool.query(
        `SELECT c.id, c.date, e.name, e.id as exercise_id, c.reps, w.weight, c.weight_id, c.sets, e.isupperbody
        FROM complete c
        JOIN exercise e ON c.exercise_id = e.id
        JOIN weights w ON c.weight_id = w.id
        WHERE c.user_id = $1 AND c.date = $2 AND c.exercise_id = $3
        ORDER BY c.id`,
        [userId, date, exerciseId]
    );
    return data.rows;
};

const updateExerciseData = async (completeId, weightId, reps, sets) => {
    const result = await pool.query(
        `UPDATE complete 
        SET weight_id = $1, reps = $2, sets = $3
        WHERE id = $4
        RETURNING *`,
        [weightId, reps, sets, completeId]
    );
    return result.rows[0];
};

const deleteExerciseData = async (completeId) => {
    const result = await pool.query(
        `DELETE FROM complete WHERE id = $1`,
        [completeId]
    );
    return result;
};

const insertRun = async (userId, duration, distance, date = null) => {
    const dateToUse = date || new Date().toISOString().split("T")[0];
    const result = await pool.query(
        "INSERT INTO run (user_id, date, duration, distance) VALUES ($1, $2, $3, $4) RETURNING *",
        [userId, dateToUse, duration, distance]
    );
    return result.rows[0];
};

module.exports = {
    getExercises,
    getWeights,
    getUperBodyExercises,
    getExerciseById,
    getReps,
    getSets,
    insertData,
    getLowerBodyExercises,
    getWeightIdFromWeight,
    getLastDataFromExerciseID,
    getCalendarByYear,
    getWorkoutDaysInMonth,
    getWorkoutsByDate,
    getMonthlyWorkoutCounts,
    getMonthlyWorkoutBreakdown,
    getRunsByDate,
    getExerciseDataByDateAndExercise,
    updateExerciseData,
    deleteExerciseData,
    insertRun,
};
