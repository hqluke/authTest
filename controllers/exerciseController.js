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

module.exports = {
    getDefaultPage,
};
