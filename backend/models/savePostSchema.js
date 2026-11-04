const mongoose = require("mongoose");

const savePostSchema = new mongoose.Schema(
  {
    savedPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate saves
savePostSchema.index(
  { savedPost: 1, user: 1 },
  { unique: true }
);

module.exports = mongoose.model("SavePost", savePostSchema);