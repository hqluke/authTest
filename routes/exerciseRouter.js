const router = require("express").Router();
const exerciseController = require("../controllers/exerciseController");

router.get("/", exerciseController.getDefaultPage);

module.exports = router;
