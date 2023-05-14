const Mongoose = require("mongoose");

const appartSchema = new Mongoose.Schema(
  {
    size: {
      type: Number,
      required: true,
    },
    adress: {
      type: String,
      default: "",
    },
    postalcode: {
      type: Number,
      default: -1,
    },
    city: {
      type: String,
      default: "",
    },
    building: {
      type: Mongoose.Schema.Types.ObjectId,
      ref: "Building",
      default: null,
    },
    picture: [
      {
        type: Mongoose.Schema.Types.ObjectId,
        ref: "File",
      },
    ],
    status: {
      type: String,
      default: "Libre",
    },
    createdBy: {
      type: Mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Owner",
    },
  },
  { timestamps: true }
);

module.exports = Mongoose.model("Appart", appartSchema);
