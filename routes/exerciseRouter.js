const router = require("express").Router();
const exerciseController = require("../controllers/exerciseController");

const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/");
};

// Apply authentication to ALL exercise routes
router.use(isAuthenticated);

router.get("/", exerciseController.getDefaultPage);
router.get("/upper", exerciseController.getUpper);
router.get("/lower", exerciseController.getLower);
router.get("/run", exerciseController.getRunPage);
router.get("/insertData", exerciseController.getInsertDataPage);
router.post("/insertData", exerciseController.postInsertData);
router.post("/insertRun", exerciseController.postInsertRun);

module.exports = router;
