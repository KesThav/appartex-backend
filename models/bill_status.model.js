const { date } = require("joi");
const Mongoose = require("mongoose");

const billstatusSchema = new Mongoose.Schema(
  {
    billid: {
      type: Mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Bill",
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: Mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Status",
    },
    createdBy: {
      type: Mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Owner",
    },
  },
  { timestamps: true }
);

module.exports = Mongoose.model("Billstatus", billstatusSchema);
