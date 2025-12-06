const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    titre: {
      type: String,
      required: [true, "Le titre de la tâche est requis"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    statut: {
      type: String,
      enum: ["todo", "doing", "done"],
      default: "todo",
    },
    deadline: {
      type: Date,
    },
    projet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Le projet associé est requis"],
    },
    utilisateurAssigne: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true, // Ajoute automatiquement createdAt et updatedAt
  }
);

// Index pour améliorer les performances
taskSchema.index({ projet: 1 });
taskSchema.index({ utilisateurAssigne: 1 });
taskSchema.index({ statut: 1 });
taskSchema.index({ deadline: 1 });
taskSchema.index({ titre: "text", description: "text" }); // Pour la recherche textuelle

module.exports = mongoose.model("Task", taskSchema);