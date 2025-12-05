const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// -----------------------------------------------
// REGISTER
// -----------------------------------------------
exports.register = async (req, res) => {
  try {
    const { nom, login, password, role } = req.body;

    const existing = await User.findOne({ login });
    if (existing)
      return res.status(400).json({ message: "Login déjà utilisé." });

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      nom,
      login,
      password: hashed,
      role,
    });

    res.status(201).json({ message: "Utilisateur créé", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -----------------------------------------------
// LOGIN
// -----------------------------------------------
exports.login = async (req, res) => {
  try {
    const { login, password } = req.body;

    const user = await User.findOne({ login });
    if (!user)
      return res.status(400).json({ message: "Identifiants incorrects." });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(400).json({ message: "Identifiants incorrects." });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      "SECRET_KEY",
      { expiresIn: "24h" }
    );

    res.json({ message: "Connexion réussie", token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -----------------------------------------------
// GET ALL USERS (manager only)
// -----------------------------------------------
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -----------------------------------------------
// GET ONE USER
// -----------------------------------------------
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user)
      return res.status(404).json({ message: "Utilisateur introuvable" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -----------------------------------------------
// UPDATE USER
// -----------------------------------------------
exports.updateUser = async (req, res) => {
  try {
    const updates = req.body;

    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    }).select("-password");

    res.json({ message: "Utilisateur mis à jour", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -----------------------------------------------
// DELETE USER
// -----------------------------------------------
exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "Utilisateur supprimé" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
