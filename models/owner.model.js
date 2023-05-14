const Mongoose = require("mongoose");

const ownerSchema = new Mongoose.Schema(
  {
    name: {
      type: String,
    },
    lastname: {
      type: String,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: "Admin",
    },
  },
  { timestamps: true }
);

module.exports = Mongoose.model("Owner", ownerSchema);
