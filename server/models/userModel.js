const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    min: 3,
    max: 20,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    min: 8,
  },
  avatarImage: {
    type: String,
    default: "",
  },
});

module.exports = mongoose.model("Users", userSchema);
