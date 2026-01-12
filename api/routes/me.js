const express = require("express");
const requireActiveUser = require("../middleware/requireActiveUser");
const UsersController = require("../controllers/users")
const router = express.Router();

router.get("/", UsersController.showUser);
router.patch("/theme", requireActiveUser, UsersController.updateThemePreference);

module.exports = router;
