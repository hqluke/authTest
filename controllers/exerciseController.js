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
    res.render("showExercises", {
        exercises: upperBodyExercises,
        exerciseType: "Upper Body",
    });
};

const getLower = async (req, res) => {
    console.log("--------------Calling For Lower body exercises--------------");
    const lowerBodyExercises = await db.getLowerBodyExercises();
    console.log("--------Lower body exercises found:----------");
    console.log(lowerBodyExercises);
    res.render("showExercises", {
        exercises: lowerBodyExercises,
        exerciseType: "Lower Body",
    });
};

const getInsertDataPage = async (req, res) => {
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

    const userId = req.user.id;

    const lastData = await db.getLastDataFromExerciseID(exerciseId, userId);

    res.render("insertData", { exercise, weights, reps, sets, lastData });
};

const postInsertData = async (req, res) => {
    const { exerciseId, sets, isUpperBody } = req.body;
    const userId = req.user.id;

    const repsArray = Object.keys(req.body)
        .filter((key) => key.startsWith("reps-"))
        .sort()
        .map((key) => parseInt(req.body[key]));

    const weightArray = Object.keys(req.body)
        .filter((key) => key.startsWith("weight-"))
        .sort()
        .map((key) => parseInt(req.body[key]));

    console.log("--------Inserting Data:----------");
    console.log(userId, exerciseId, weightArray, repsArray, sets);

    try {
        for (let i = 0; i < sets; i++) {
            let weightId = await db.getWeightIdFromWeight(weightArray[i]);
            console.log(weightId);

            await db.insertData(
                userId,
                exerciseId,
                weightId.id,
                repsArray[i],
                sets,
            );
        }
        const redirectPath =
            isUpperBody === "true" ? "/exercise/upper" : "/exercise/lower";
        res.redirect(redirectPath);
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
    getLower,
};
