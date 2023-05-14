const Contract = require("../models/contract.model");
const Building = require("../models/building.model");
const Appart = require("../models/appartment.model");
const Tenant = require("../models/tenant.model");
let ObjectId = require("mongodb").ObjectId;
const { contractSchema } = require("./validation");

module.exports = async (ctx, next) => {
  let validate = ObjectId.isValid(ctx.params.contractid);
  if (!validate) return ctx.throw(404, "contract not found");
  const { charge, rent, tenant, appartmentid, other } = ctx.request.body;
  const { error } = contractSchema.validate(ctx.request.body);
  if (error) {
    ctx.throw(400, error);
  }

  const appart = new ObjectId(appartmentid);
  const oneappart = await Appart.findById(appart);
  if (!oneappart) {
    ctx.throw(400, "appartment not found");
  }


  const tenantid = new ObjectId(tenant);
  const onetenant = await Tenant.findById(tenantid);
  if (!onetenant) {
    ctx.throw(400, "tenant not found");
  }
  if (onetenant.status == "Inactif") {
    ctx.throw(400, "can't use inactive tenant");
  }

  await next();
};
