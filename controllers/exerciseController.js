const db = require("../db/queries");

const getDefaultPage = async (req, res) => {
    console.log("--------------Calling exercises--------------");
    const { year, month, day } = req.query;
    
    const exerciseList = await db.getExercises();
    console.log("--------Exercies found:----------");
    console.log(exerciseList);
    console.log("--------------Calling weights--------------");
    const weightList = await db.getWeights();
    console.log("--------Weights found:----------");
    console.log(weightList);
    
    // Pass date info to template
    res.render("exercise", { 
        exerciseList, 
        weightList,
        year: year || null,
        month: month || null,
        day: day || null
    });
};

const getUpper = async (req, res) => {
    console.log("--------------Calling For Upper body exercises--------------");
    const { year, month, day } = req.query;
    
    const upperBodyExercises = await db.getUperBodyExercises();
    console.log("--------Upper body exercises found:----------");
    console.log(upperBodyExercises);
    res.render("showExercises", {
        exercises: upperBodyExercises,
        exerciseType: "Upper Body",
        year: year || null,
        month: month || null,
        day: day || null
    });
};

const getLower = async (req, res) => {
    console.log("--------------Calling For Lower body exercises--------------");
    const { year, month, day } = req.query;
    
    const lowerBodyExercises = await db.getLowerBodyExercises();
    console.log("--------Lower body exercises found:----------");
    console.log(lowerBodyExercises);
    res.render("showExercises", {
        exercises: lowerBodyExercises,
        exerciseType: "Lower Body",
        year: year || null,
        month: month || null,
        day: day || null
    });
};

const getInsertDataPage = async (req, res) => {
    const exerciseId = req.query.exerciseId;
    const { year, month, day } = req.query;

    if (!exerciseId) {
        return res
            .status(400)
            .send("Exercise ID is required <a href='/exercise'>Go Back</a>");
    }

    const exercise = await db.getExerciseById(exerciseId);
    const weights = await db.getWeights();
    const reps = await db.getReps();
    const sets = await db.getSets();
    const userId = req.user.id;
    const lastData = await db.getLastDataFromExerciseID(exerciseId, userId);

    res.render("insertData", { 
        exercise, 
        weights, 
        reps, 
        sets, 
        lastData,
        year: year || null,
        month: month || null,
        day: day || null
    });
};

const postInsertData = async (req, res) => {
    const { exerciseId, sets, isUpperBody, year, month, day } = req.body;
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
        // Determine the date to use
        let dateToUse;
        if (year && month && day) {
            dateToUse = new Date(year, month - 1, day).toISOString().split("T")[0];
        } else {
            dateToUse = new Date().toISOString().split("T")[0];
        }

        for (let i = 0; i < sets; i++) {
            let weightId = await db.getWeightIdFromWeight(weightArray[i]);
            console.log(weightId);

            await db.insertData(
                userId,
                exerciseId,
                weightId.id,
                repsArray[i],
                sets,
                dateToUse
            );
        }
        
        // Redirect back to calendar if date was provided
        if (year && month && day) {
            res.redirect(`/calendar?year=${year}&month=${month}&day=${day}`);
        } else {
            const redirectPath = isUpperBody === "true" ? "/exercise/upper" : "/exercise/lower";
            res.redirect(redirectPath);
        }
    } catch (error) {
        console.error("Error inserting data:", error);
        return res
            .status(500)
            .send("Internal server error <a href='/exercise'>Go Back</a>");
    }
};

const getRunPage = async (req, res) => {
    const { year, month, day } = req.query;
    res.render("insertRun", {
        year: year || null,
        month: month || null,
        day: day || null
    });
};

const postInsertRun = async (req, res) => {
    const { duration, distance, year, month, day } = req.body;
    const userId = req.user.id;

    try {
        const durationRegex = /^[0-9]{1,2}:[0-9]{2}:[0-9]{2}$/;
        if (!durationRegex.test(duration)) {
            return res.status(400).send("Invalid duration format. Use HH:MM:SS");
        }

        const parts = duration.split(':');
        const hours = parseInt(parts[0]);
        const minutes = parseInt(parts[1]);
        const seconds = parseInt(parts[2]);

        if (minutes >= 60 || seconds >= 60) {
            return res.status(400).send("Minutes and seconds must be less than 60");
        }

        if (hours === 0 && minutes === 0 && seconds === 0) {
            return res.status(400).send("Duration must be greater than 0");
        }

        const dist = parseFloat(distance);
        if (isNaN(dist) || dist <= 0 || dist > 999.99) {
            return res.status(400).send("Invalid distance. Must be between 0.01 and 999.99 miles");
        }

        const formattedDuration = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        // Determine the date to use
        let dateToUse;
        if (year && month && day) {
            dateToUse = new Date(year, month - 1, day).toISOString().split("T")[0];
        } else {
            dateToUse = new Date().toISOString().split("T")[0];
        }

        await db.insertRun(userId, formattedDuration, dist, dateToUse);
        
        // Redirect back to calendar if date was provided
        if (year && month && day) {
            res.redirect(`/calendar?year=${year}&month=${month}&day=${day}`);
        } else {
            res.redirect("/exercise");
        }
    } catch (error) {
        console.error("Error inserting run data:", error);
        return res.status(500).send("Internal server error <a href='/exercise'>Go Back</a>");
    }
};

module.exports = {
    getDefaultPage,
    getUpper,
    getLower,
    getInsertDataPage,
    postInsertData,
    getRunPage,
    postInsertRun,
};
