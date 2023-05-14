const Mongoose = require("mongoose");

const commentSchema = new Mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
    },
    createdBy: {
      type: Mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "createdByType",
    },
    createdByType: {
      type: String,
      required: true,
      enum: ["Owner", "Tenant"],
    },
  },
  { timestamps: true }
);
module.exports = Mongoose.model("Comment", commentSchema);
