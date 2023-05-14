const combineRouters = require("koa-combine-routers");
const authRouter = require("./auth");
const tenantRouter = require("./tenants");
const buildingRouter = require("./buildings");
const appartmentRouter = require("./appartments");
const billRouter = require("./bills");
const contractRouter = require("./contracts");
const messageRouter = require("./messages");
const taskRouter = require("./tasks");
const repairRouter = require("./repairs");
const statusRouter = require("./status");
const billstatusRouter = require("./billstatus");
const taskstatusRouter = require("./taskstatus");
const repairstatusRouter = require("./repairstatus");

const router = combineRouters(
  authRouter,
  tenantRouter,
  buildingRouter,
  appartmentRouter,
  billRouter,
  contractRouter,
  messageRouter,
  taskRouter,
  repairRouter,
  statusRouter,
  billstatusRouter,
  taskstatusRouter,
  repairstatusRouter
);

module.exports = router;
