const { appartSchema } = require("./validation");
const Building = require("../models/building.model");
let ObjectId = require("mongodb").ObjectId;

module.exports = async (ctx, next) => {
  const { size, adress, building, postalcode, city } = ctx.request.body;
  const { error } = appartSchema.validate(ctx.request.body);
  if (error) {
    ctx.throw(400, error);
  }
  if ((adress || postalcode || city) && building) {
    ctx.throw(400, "Adress and building can't be filled at the same time");
  }
  if ((!adress || !postalcode || !city) && !building) {
    ctx.throw(400, "Adress and building can't be empty at the same time");
  }
  /* if (building) {
    const buildingid = new ObjectId(building);
    const onebuilding = await Building.findById(buildingid);
    if (!onebuilding) {
      ctx.throw(400, "building not found");
    }
  } */

  await next();
};
