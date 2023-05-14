const Mongoose = require("mongoose");

const messageSchema = new Mongoose.Schema(
  {
    sendedTo: [
      {
        type: Mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: "sendedToType",
      },
    ],
    sendedToType: {
      type: String,
      required: true,
      enum: ["Owner", "Tenant"],
    },
    content: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: "envoyé",
    },
    title: {
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
    comments: [{ type: Mongoose.Schema.ObjectId, ref: "Comment" }],
  },
  { timestamps: true }
);
module.exports = Mongoose.model("Message", messageSchema);
