const Task = require("../models/Task");
const Project = require("../models/Project");

// -----------------------------------------------
// CREATE TASK
// N'importe quel utilisateur authentifié peut créer une tâche
// -----------------------------------------------
exports.createTask = async (req, res) => {
  try {
    const { titre, description, statut, deadline, projet } = req.body;
    const currentUserId = req.user.id;
    const userRole = req.user.role;

    // Vérifier que le projet existe
    const projectExists = await Project.findById(projet);
    if (!projectExists) {
      return res.status(404).json({ message: "Projet introuvable" });
    }

    // Vérifier que l'utilisateur a accès au projet
    if (
      userRole !== "manager" &&
      projectExists.proprietaire.toString() !== currentUserId
    ) {
      return res.status(403).json({
        message: "Vous ne pouvez créer des tâches que dans vos propres projets",
      });
    }

    const task = await Task.create({
      titre,
      description,
      statut: statut || "todo",
      deadline,
      projet,
    });

    // Populer les références
    await task.populate([
      { path: "projet", select: "nom proprietaire" },
      { path: "utilisateurAssigne", select: "nom login" },
    ]);

    res.status(201).json({
      message: "Tâche créée avec succès",
      task,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -----------------------------------------------
// GET ALL TASKS
// Manager : voit toutes les tâches
// User : voit uniquement les tâches de ses projets
// -----------------------------------------------
exports.getAllTasks = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const userRole = req.user.role;
    const { statut, sort = "-createdAt" } = req.query;

    let filter = {};

    // Si user normal, filtrer par ses projets
    if (userRole !== "manager") {
      const userProjects = await Project.find({
        proprietaire: currentUserId,
      }).select("_id");
      const projectIds = userProjects.map((p) => p._id);
      filter.projet = { $in: projectIds };
    }

    // Filtrer par statut si fourni
    if (statut) {
      filter.statut = statut;
    }

    const tasks = await Task.find(filter)
      .populate("projet", "nom proprietaire statut")
      .populate("utilisateurAssigne", "nom login role")
      .sort(sort);

    res.json({
      count: tasks.length,
      tasks,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -----------------------------------------------
// GET TASKS BY PROJECT
// Récupérer toutes les tâches d'un projet spécifique
// -----------------------------------------------
exports.getTasksByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const currentUserId = req.user.id;
    const userRole = req.user.role;
    const { statut, sort = "-createdAt" } = req.query;

    // Vérifier que le projet existe
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Projet introuvable" });
    }

    // Vérifier les permissions
    if (
      userRole !== "manager" &&
      project.proprietaire.toString() !== currentUserId
    ) {
      return res.status(403).json({
        message: "Vous ne pouvez voir que les tâches de vos propres projets",
      });
    }

    let filter = { projet: projectId };

    // Filtrer par statut si fourni
    if (statut) {
      filter.statut = statut;
    }

    const tasks = await Task.find(filter)
      .populate("projet", "nom proprietaire statut")
      .populate("utilisateurAssigne", "nom login role")
      .sort(sort);

    res.json({
      count: tasks.length,
      project: {
        _id: project._id,
        nom: project.nom,
      },
      tasks,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -----------------------------------------------
// GET ONE TASK
// Manager : peut voir n'importe quelle tâche
// User : peut voir les tâches de ses projets uniquement
// -----------------------------------------------
exports.getTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const currentUserId = req.user.id;
    const userRole = req.user.role;

    const task = await Task.findById(taskId)
      .populate("projet", "nom proprietaire statut")
      .populate("utilisateurAssigne", "nom login role");

    if (!task) {
      return res.status(404).json({ message: "Tâche introuvable" });
    }

    // Vérifier les permissions
    if (
      userRole !== "manager" &&
      task.projet.proprietaire.toString() !== currentUserId
    ) {
      return res.status(403).json({
        message: "Vous ne pouvez voir que les tâches de vos propres projets",
      });
    }

    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -----------------------------------------------
// UPDATE TASK
// Manager : peut modifier n'importe quelle tâche
// User : peut modifier les tâches de ses projets uniquement
// -----------------------------------------------
exports.updateTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const currentUserId = req.user.id;
    const userRole = req.user.role;

    const task = await Task.findById(taskId).populate("projet");

    if (!task) {
      return res.status(404).json({ message: "Tâche introuvable" });
    }

    // Vérifier les permissions
    if (
      userRole !== "manager" &&
      task.projet.proprietaire.toString() !== currentUserId
    ) {
      return res.status(403).json({
        message:
          "Vous ne pouvez modifier que les tâches de vos propres projets",
      });
    }

    // Empêcher un user d'assigner une tâche
    if (userRole !== "manager" && req.body.utilisateurAssigne) {
      return res.status(403).json({
        message: "Seul un manager peut assigner une tâche à un utilisateur",
      });
    }

    const updatedTask = await Task.findByIdAndUpdate(taskId, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("projet", "nom proprietaire statut")
      .populate("utilisateurAssigne", "nom login role");

    res.json({
      message: "Tâche mise à jour avec succès",
      task: updatedTask,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -----------------------------------------------
// ASSIGN TASK (MANAGER UNIQUEMENT)
// Assigner une tâche à un utilisateur
// -----------------------------------------------
exports.assignTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const { utilisateurAssigne } = req.body;

    if (!utilisateurAssigne) {
      return res
        .status(400)
        .json({ message: "L'ID de l'utilisateur est requis" });
    }

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ message: "Tâche introuvable" });
    }

    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { utilisateurAssigne },
      { new: true }
    )
      .populate("projet", "nom proprietaire statut")
      .populate("utilisateurAssigne", "nom login role");

    res.json({
      message: "Tâche assignée avec succès",
      task: updatedTask,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -----------------------------------------------
// DELETE TASK
// Manager : peut supprimer n'importe quelle tâche
// User : peut supprimer les tâches de ses projets uniquement
// -----------------------------------------------
exports.deleteTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const currentUserId = req.user.id;
    const userRole = req.user.role;

    const task = await Task.findById(taskId).populate("projet");

    if (!task) {
      return res.status(404).json({ message: "Tâche introuvable" });
    }

    // Vérifier les permissions
    if (
      userRole !== "manager" &&
      task.projet.proprietaire.toString() !== currentUserId
    ) {
      return res.status(403).json({
        message:
          "Vous ne pouvez supprimer que les tâches de vos propres projets",
      });
    }

    await Task.findByIdAndDelete(taskId);

    res.json({ message: "Tâche supprimée avec succès" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -----------------------------------------------
// SEARCH TASKS
// Recherche par titre, description, statut
// Manager : recherche dans toutes les tâches
// User : recherche uniquement dans les tâches de ses projets
// -----------------------------------------------
exports.searchTasks = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const userRole = req.user.role;
    const { q, statut, sort = "-createdAt" } = req.query;

    let filter = {};

    // Si user normal, filtrer par ses projets
    if (userRole !== "manager") {
      const userProjects = await Project.find({
        proprietaire: currentUserId,
      }).select("_id");
      const projectIds = userProjects.map((p) => p._id);
      filter.projet = { $in: projectIds };
    }

    // Recherche textuelle si 'q' est fourni
    if (q) {
      filter.$or = [
        { titre: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ];
    }

    // Filtrer par statut si fourni
    if (statut) {
      filter.statut = statut;
    }

    const tasks = await Task.find(filter)
      .populate("projet", "nom proprietaire statut")
      .populate("utilisateurAssigne", "nom login role")
      .sort(sort);

    res.json({
      count: tasks.length,
      tasks,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};