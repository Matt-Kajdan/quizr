const express = require("express");
const requireAuth = require("../middleware/requireAuth");
const router = express.Router();

const UsersController = require("../controllers/users");
const tokenChecker = require("../middleware/tokenChecker");

router.post("/", UsersController.createUser);
router.get("/me", requireAuth, UsersController.showUser);
router.post("/me", requireAuth, UsersController.upsertMe);
router.get("/:userId", UsersController.getUserById)
router.delete("/:userId", UsersController.deleteUser)

module.exports = router;
