const express = require("express");
const UsersController = require("./users.controller")
const router = express.Router();

router.get("/", UsersController.showUser);
router.patch("/theme", UsersController.updateThemePreference);

module.exports = router;
