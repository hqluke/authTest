const pool = require("./pool");

const getExercises = async () => {
    const exerciseList = await pool.query("SELECT * FROM exercise");
    return exerciseList.rows;
};

const getWeights = async () => {
    const weightList = await pool.query("SELECT * FROM weights");
    return weightList.rows;
};

module.exports = {
    getExercises,
    getWeights,
};
