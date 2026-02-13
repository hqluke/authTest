const router = require("express").Router();
const exerciseController = require("../controllers/exerciseController");

router.get("/", exerciseController.getDefaultPage);
router.get("/upper", exerciseController.getUpper);
router.get("/lower", exerciseController.getLower);
router.get("/run", exerciseController.getRunPage);

router.get("/insertData", exerciseController.getInsertDataPage);
router.post("/insertData", exerciseController.postInsertData);
router.post("/insertRun", exerciseController.postInsertRun);

module.exports = router;
