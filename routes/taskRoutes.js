const express = require("express");
const router = express.Router();

const taskController = require("../controllers/taskController");
const auth = require("../middleware/auth");
const role = require("../middleware/role");

// ========================================
// ROUTES TÂCHES
// ========================================

// 1. Créer une tâche (user ou manager authentifié)
//    User peut créer des tâches uniquement dans ses propres projets
router.post("/", auth, taskController.createTask);

// 2. Récupérer toutes les tâches (avec filtres et tri)
//    - Manager : voit toutes les tâches de tous les projets
//    - User : voit uniquement les tâches de ses projets
router.get("/", auth, taskController.getAllTasks);

// 3. Récupérer toutes les tâches d'un projet spécifique
//    - Manager : voit les tâches de n'importe quel projet
//    - User : voit les tâches de ses projets uniquement
router.get("/project/:projectId", auth, taskController.getTasksByProject);

// 4. Rechercher des tâches (par titre, description, statut)
//    - Manager : recherche dans toutes les tâches
//    - User : recherche dans les tâches de ses projets
router.get("/search/query", auth, taskController.searchTasks);

// 5. Récupérer une tâche spécifique par ID
//    - Manager : peut voir n'importe quelle tâche
//    - User : peut voir les tâches de ses projets uniquement
router.get("/:id", auth, taskController.getTask);

// 6. Mettre à jour une tâche
//    - Manager : peut modifier n'importe quelle tâche
//    - User : peut modifier les tâches de ses projets uniquement
//    Note: Seul le manager peut modifier utilisateurAssigne
router.put("/:id", auth, taskController.updateTask);

// 7. Assigner une tâche à un utilisateur (MANAGER UNIQUEMENT)
//    Route spéciale pour l'assignation
router.put("/:id/assign", auth, role("manager"), taskController.assignTask);

// 8. Supprimer une tâche
//    - Manager : peut supprimer n'importe quelle tâche
//    - User : peut supprimer les tâches de ses projets uniquement
router.delete("/:id", auth, taskController.deleteTask);

module.exports = router;