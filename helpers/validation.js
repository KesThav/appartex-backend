const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);

const userSchema = Joi.object({
  lastname: Joi.string().required(),
  name: Joi.string().required(),
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().min(6).required(),
  dateofbirth: Joi.date(),
  status: Joi.string(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().min(6).required(),
});

const buildingSchema = Joi.object({
  adress: Joi.string().required(),
  postalcode: Joi.number().min(1000).max(9999).required(),
  city: Joi.string().required(),
});

const appartSchema = Joi.object({
  size: Joi.number().min(1).max(10).precision(1).required(),
  adress: Joi.string().allow(null, "").default(null),
  postalcode: Joi.number().min(1000).max(9999).allow("").default(-1),
  city: Joi.string().allow(null, "").default(null),
  building: Joi.objectId().allow(null, "").default(null),
  status: Joi.string(),
});

const contractSchema = Joi.object({
  charge: Joi.number().min(0).precision(2).required(),
  rent: Joi.number().min(0).precision(2).required(),
  tenant: Joi.objectId().required(),
  appartmentid: Joi.objectId().required(),
  other: Joi.string().allow("", null),
  status: Joi.string(),
});

const billSchema = Joi.object({
  tenant: Joi.objectId().required(),
  reference: Joi.string().allow(null, ""),
  endDate: Joi.date().required(),
  amount: Joi.number().min(0).precision(2).required(),
  reason: Joi.string().required(),
  status: Joi.objectId().required(),
});

const statusSchema = Joi.object({
  name: Joi.string().required(),
});

const messageSchema = Joi.object({
  sendedTo: Joi.array().items(Joi.objectId()).required(),
  content: Joi.string().required(),
  status: Joi.string(),
  title: Joi.string().required(),
  sendedToType: Joi.string().required(),
  createdByType: Joi.string().required(),
});

const taskSchema = Joi.object({
  content: Joi.string().required(),
  title: Joi.string().required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().required(),
  status: Joi.objectId().required(),
  messageid: Joi.objectId(),
});

const repairSchema = Joi.object({
  amount: Joi.number().min(0).precision(2).required(),
  status: Joi.objectId().required(),
  reason: Joi.string().required(),
  taskid: Joi.objectId().required(),
});
module.exports = {
  userSchema,
  loginSchema,
  buildingSchema,
  appartSchema,
  contractSchema,
  billSchema,
  statusSchema,
  messageSchema,
  taskSchema,
  repairSchema,
};
