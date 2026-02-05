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

const insertData = async (userId, exerciseId, weight, reps, sets) => {
    const date = new Date().toISOString().split("T")[0]; // Get today's date (YYYY-MM-DD)

    const weightId = await getWeightIdFromWeight(weight);

    const result = await pool.query(
        "INSERT INTO complete (user_id, date, exercise_id, weight_id, reps, sets) VALUES ($1, $2, $3, $4, $5, $6)",
        [userId, date, exerciseId, weightId.id, reps, sets],
    );
    return result.rows;
};

module.exports = {
    getExercises,
    getWeights,
    getUperBodyExercises,
    getExerciseById,
    getReps,
    getSets,
    insertData,
};
