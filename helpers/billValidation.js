const Status = require("../models/status.model");
const Tenant = require("../models/tenant.model");
let ObjectId = require("mongodb").ObjectId;
const { billSchema } = require("./validation");

module.exports = async (ctx, next) => {

  const {
    tenant,
    reference,
    endDate,
    amount,
    reason,
    status,
  } = ctx.request.body;
  const { error } = billSchema.validate(ctx.request.body);
  if (error) {
    ctx.throw(400, error);
  }

  const tenantid = new ObjectId(tenant);
  const onetenant = await Tenant.findById(tenantid);
  if (!onetenant) {
    ctx.throw(400, "tenant not found");
  }
  if (onetenant.status == "Inactif") {
    ctx.throw(400, "can't use inactive tenant");
  }

  const statusid = new ObjectId(status);
  const onestatus = await Status.findById(statusid);
  if (!onestatus) {
    ctx.throw(400, "status not found");
  }

  await next();
};
