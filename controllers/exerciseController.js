const db = require("../db/queries");

const getDefaultPage = async (req, res) => {
    console.log("--------------Calling exercises--------------");
    const exerciseList = await db.getExercises();
    console.log("--------Exercies found:----------");
    console.log(exerciseList);
    console.log("--------------Calling weights--------------");
    const weightList = await db.getWeights();
    console.log("--------Weights found:----------");
    console.log(weightList);
    res.render("exercise", { exerciseList, weightList });
};

const getUpper = async (req, res) => {
    console.log("--------------Calling For Upper body exercises--------------");
    const upperBodyExercises = await db.getUperBodyExercises();
    console.log("--------Upper body exercises found:----------");
    console.log(upperBodyExercises);
    res.render("upperBody", { upperBodyExercises });
};

const getInsertDataPage = async (req, res) => {
    //TODO: get the previous sets/reps from the database for the exercise based off user

    // directs the user to the insert data page based on the exercise id
    const exerciseId = req.query.exerciseId;

    if (!exerciseId) {
        return res
            .status(400)
            .send("Exercise ID is required <a href='/exercise'>Go Back</a>");
    }

    // Fetch the specific exercise
    const exercise = await db.getExerciseById(exerciseId);

    // Fetch all weights for the dropdown
    const weights = await db.getWeights();

    const reps = await db.getReps();

    const sets = await db.getSets();

    // TODO: get the previous sets/reps from the database for this user + exercise

    res.render("insertData", { exercise, weights, reps, sets });
};

const postInsertData = async (req, res) => {
    const { exerciseId, weight, reps, sets } = req.body; // Get the form data
    const userId = req.user.id; // Get the user ID from the passport session

    console.log("--------Inserting Data:----------");
    console.log(userId, exerciseId, weight, reps, sets);

    try {
        await db.insertData(userId, exerciseId, weight, reps, sets);
        res.redirect("/exercise");
    } catch (error) {
        console.error("Error inserting data:", error);
        return res
            .status(500)
            .send("Internal server error <a href='/exercise'>Go Back</a>");
    }
};

module.exports = {
    getDefaultPage,
    getUpper,
    getInsertDataPage,
    postInsertData,
};
