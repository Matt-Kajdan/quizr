const express = require("express");
const requireAuth = require("../../lib/middleware/requireAuth");
const FriendsController = require("./friends.controller")
const router = express.Router()

router.post("/:userId", requireAuth, FriendsController.sendRequest);
router.patch("/:friendId/accept", requireAuth, FriendsController.acceptRequest);
router.delete("/:userId", requireAuth, FriendsController.removeRequest);
router.get("/", requireAuth, FriendsController.listFriends);
router.get("/pending/all", requireAuth, FriendsController.pendingRequests);

module.exports = router
