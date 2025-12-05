const express = require("express");
const cors = require('cors');

const router = express.Router();

const userController = require("../controllers/userController");
const auth = require("../middleware/auth");
const role = require("../middleware/role");

// Authè
router.post("/register", userController.register);
router.post("/login", userController.login);

// CRUD
router.get("/", auth, role("manager"), userController.getUsers);
router.get("/:id", auth, userController.getUser);
router.put("/:id", auth, userController.updateUser);
router.delete("/:id", auth, role("manager"), userController.deleteUser);

module.exports = router;
