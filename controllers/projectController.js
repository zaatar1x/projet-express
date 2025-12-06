const Project = require("../models/Project");

// -----------------------------------------------
// CREATE PROJECT
// N'importe quel utilisateur authentifié peut créer un projet
// -----------------------------------------------
exports.createProject = async (req, res) => {
  try {
    const { nom, description, statut } = req.body;
    const proprietaire = req.user.id; // ID de l'utilisateur connecté

    const project = await Project.create({
      nom,
      description,
      proprietaire,
      statut: statut || "en cours",
    });

    // Populer les infos du propriétaire
    await project.populate("proprietaire", "nom login role");

    res.status(201).json({
      message: "Projet créé avec succès",
      project,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -----------------------------------------------
// GET ALL PROJECTS (MANAGER UNIQUEMENT)
// Le manager voit TOUS les projets de tous les utilisateurs
// -----------------------------------------------
exports.getAllProjects = async (req, res) => {
  try {
    // Paramètres de tri et filtrage
    const { statut, sort = "-createdAt" } = req.query;

    let filter = {};

    // Filtrer par statut si fourni
    if (statut) {
      filter.statut = statut;
    }

    const projects = await Project.find(filter)
      .populate("proprietaire", "nom login role")
      .sort(sort);

    res.json({
      count: projects.length,
      projects,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -----------------------------------------------
// GET MY PROJECTS
// Manager : voit TOUS les projets de tous les utilisateurs
// User : voit uniquement ses propres projets
// -----------------------------------------------
exports.getMyProjects = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const userRole = req.user.role;

    // Paramètres de tri et filtrage
    const { statut, sort = "-createdAt" } = req.query;

    let filter = {};

    // Si user normal, filtrer uniquement ses projets
    // Si manager, voir tous les projets
    if (userRole !== "manager") {
      filter.proprietaire = currentUserId;
    }

    // Filtrer par statut si fourni
    if (statut) {
      filter.statut = statut;
    }

    const projects = await Project.find(filter)
      .populate("proprietaire", "nom login role")
      .sort(sort);

    res.json({
      count: projects.length,
      projects,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -----------------------------------------------
// GET ONE PROJECT
// Manager : peut voir n'importe quel projet
// User : peut voir uniquement ses propres projets
// -----------------------------------------------
exports.getProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const currentUserId = req.user.id;
    const userRole = req.user.role;

    const project = await Project.findById(projectId).populate(
      "proprietaire",
      "nom login role"
    );

    if (!project) {
      return res.status(404).json({ message: "Projet introuvable" });
    }

    // Vérification des permissions
    if (
      userRole !== "manager" &&
      project.proprietaire._id.toString() !== currentUserId
    ) {
      return res.status(403).json({
        message: "Accès refusé : vous ne pouvez voir que vos propres projets",
      });
    }

    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -----------------------------------------------
// UPDATE PROJECT
// Manager : peut modifier n'importe quel projet
// User : peut modifier uniquement ses propres projets
// -----------------------------------------------
exports.updateProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const currentUserId = req.user.id;
    const userRole = req.user.role;

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: "Projet introuvable" });
    }

    // Vérification des permissions
    if (
      userRole !== "manager" &&
      project.proprietaire.toString() !== currentUserId
    ) {
      return res.status(403).json({
        message:
          "Accès refusé : vous ne pouvez modifier que vos propres projets",
      });
    }

    // Empêcher un user de changer le propriétaire
    if (userRole !== "manager" && req.body.proprietaire) {
      return res.status(403).json({
        message: "Vous ne pouvez pas changer le propriétaire du projet",
      });
    }

    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      req.body,
      { new: true, runValidators: true }
    ).populate("proprietaire", "nom login role");

    res.json({
      message: "Projet mis à jour avec succès",
      project: updatedProject,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -----------------------------------------------
// DELETE PROJECT
// Manager : peut supprimer n'importe quel projet
// User : peut supprimer uniquement ses propres projets
// -----------------------------------------------
exports.deleteProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const currentUserId = req.user.id;
    const userRole = req.user.role;

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: "Projet introuvable" });
    }

    // Vérification des permissions
    if (
      userRole !== "manager" &&
      project.proprietaire.toString() !== currentUserId
    ) {
      return res.status(403).json({
        message:
          "Accès refusé : vous ne pouvez supprimer que vos propres projets",
      });
    }

    await Project.findByIdAndDelete(projectId);

    res.json({ message: "Projet supprimé avec succès" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -----------------------------------------------
// SEARCH PROJECTS
// Recherche par nom, description ou statut
// Manager : recherche dans tous les projets
// User : recherche uniquement dans ses propres projets
// -----------------------------------------------
exports.searchProjects = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const userRole = req.user.role;
    const { q, statut, sort = "-createdAt" } = req.query;

    let filter = {};

    // Si user normal, filtrer uniquement ses projets
    if (userRole !== "manager") {
      filter.proprietaire = currentUserId;
    }

    // Recherche textuelle si 'q' est fourni
    if (q) {
      filter.$or = [
        { nom: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ];
    }

    // Filtrer par statut si fourni
    if (statut) {
      filter.statut = statut;
    }

    const projects = await Project.find(filter)
      .populate("proprietaire", "nom login role")
      .sort(sort);

    res.json({
      count: projects.length,
      projects,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};