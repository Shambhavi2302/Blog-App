const mongoose = require('mongoose');

const { Schema } = mongoose;

const userSchema = new Schema({
    name: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum:["Reader","Author"], default:"Reader" },
    image: { type: String, default: null },
    createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model("User", userSchema);
