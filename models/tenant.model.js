const Mongoose = require("mongoose");

const tenantSchema = new Mongoose.Schema(
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
      default: "User",
    },
    status: {
      type: String,
      default: "Actif",
    },
    dateofbirth: {
      type: Date,
    },
    createdBy: {
      type: Mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Owner",
    },
    file: [{ type: Mongoose.Schema.Types.ObjectId, ref: "File" }],
  },
  { timestamps: true }
);

module.exports = Mongoose.model("Tenant", tenantSchema);
