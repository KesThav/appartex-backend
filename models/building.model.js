const Mongoose = require("mongoose");

const buildingSchema = new Mongoose.Schema(
  {
    counter: {
      type: Number,
      default: 0,
    },
    numberofAppart: {
      type: Number,
      default: 0,
    },
    adress: {
      type: String,
      required: true,
    },
    postalcode: {
      type: Number,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    createdBy: {
      type: Mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Owner",
    },
  },
  { timestamps: true }
);

module.exports = Mongoose.model("Building", buildingSchema);
