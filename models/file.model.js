const Mongoose = require("mongoose");

const fileSchema = new Mongoose.Schema(
  {
    data: {
      type: Buffer,
    },
    contentType: {
      type: String,
    },
    name: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = Mongoose.model("File", fileSchema);
