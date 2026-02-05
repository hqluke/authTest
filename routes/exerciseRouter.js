const router = require("express").Router();
const exerciseController = require("../controllers/exerciseController");

router.get("/", exerciseController.getDefaultPage);
router.post("/upper", exerciseController.getUpper);

router.get("/insertData", exerciseController.getInsertDataPage);
router.post("/insertData", exerciseController.postInsertData);

module.exports = router;
