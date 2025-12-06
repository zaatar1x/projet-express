const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: [true, "Le nom du projet est requis"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    proprietaire: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Le propriétaire du projet est requis"],
    },
    statut: {
      type: String,
      enum: ["en cours", "terminé", "en pause"],
      default: "en cours",
    },
  },
  {
    timestamps: true, // Ajoute automatiquement createdAt et updatedAt
  }
);

// Index pour améliorer les performances de recherche
projectSchema.index({ proprietaire: 1 });
projectSchema.index({ statut: 1 });
projectSchema.index({ nom: "text", description: "text" }); // Pour la recherche textuelle

module.exports = mongoose.model("Project", projectSchema);