const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// -----------------------------------------------
// REGISTER // nouveau new new
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
// Manager peut consulter n'importe quel utilisateur
// User peut consulter uniquement son propre profil
// -----------------------------------------------
exports.getUser = async (req, res) => {
  try {
    const requestedUserId = req.params.id;
    const currentUserId = req.user.id; // ID de l'utilisateur connecté (depuis le token)
    const userRole = req.user.role;

    // Vérification des permissions
    if (userRole !== "manager" && requestedUserId !== currentUserId) {
      return res.status(403).json({ 
        message: "Accès refusé : vous ne pouvez consulter que votre propre profil" 
      });
    }

    const user = await User.findById(requestedUserId).select("-password");
    if (!user)
      return res.status(404).json({ message: "Utilisateur introuvable" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -----------------------------------------------
// UPDATE USER
// Manager peut modifier n'importe quel utilisateur
// User peut modifier uniquement son propre profil
// -----------------------------------------------
exports.updateUser = async (req, res) => {
  try {
    const requestedUserId = req.params.id;
    const currentUserId = req.user.id;
    const userRole = req.user.role;

    // Vérification des permissions
    if (userRole !== "manager" && requestedUserId !== currentUserId) {
      return res.status(403).json({ 
        message: "Accès refusé : vous ne pouvez modifier que votre propre profil" 
      });
    }

    const updates = req.body;

    // Empêcher un utilisateur normal de changer son propre rôle
    if (userRole !== "manager" && updates.role) {
      return res.status(403).json({ 
        message: "Vous ne pouvez pas modifier votre propre rôle" 
      });
    }

    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    const user = await User.findByIdAndUpdate(requestedUserId, updates, {
      new: true,
    }).select("-password");

    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    res.json({ message: "Utilisateur mis à jour", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -----------------------------------------------
// DELETE USER (manager only)
// -----------------------------------------------
exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "Utilisateur supprimé" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};