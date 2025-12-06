const express = require("express");
const router = express.Router();

const projectController = require("../controllers/projectController");
const auth = require("../middleware/auth");
const role = require("../middleware/role");

// ========================================
// ROUTES PROJETS
// ========================================

// 1. Créer un projet (user ou manager authentifié)
router.post("/", auth, projectController.createProject);

// 2. Récupérer TOUS les projets (MANAGER uniquement)
router.get("/", auth, role("manager"), projectController.getAllProjects);

// 3. Récupérer les projets
//    - Manager : voit TOUS les projets de tous les utilisateurs
//    - User : voit uniquement ses propres projets
router.get("/my-projects", auth, projectController.getMyProjects);

// 4. Rechercher des projets (par nom, description, statut)
router.get("/search/query", auth, projectController.searchProjects);

// 5. Récupérer un projet spécifique par ID
router.get("/:id", auth, projectController.getProject);

// 6. Mettre à jour un projet
router.put("/:id", auth, projectController.updateProject);

// 7. Supprimer un projet
router.delete("/:id", auth, projectController.deleteProject);

module.exports = router;