const Router = require("@koa/router");
const router = new Router({ prefix: "/status" });
const Status = require("../models/status.model");
const Bill = require("../models/bill.model");
const Task = require("../models/task.model");
const Repair = require("../models/repair.model");
const Billstatus = require("../models/bill_status.model");
const Taskstatus = require("../models/task_status.model");
const Repairstatus = require("../models/repair_status.model");
const jwt = require("../middlewares/jwt");
const adminAccess = require("../middlewares/adminAccess");
let ObjectId = require("mongodb").ObjectId;
const { statusSchema } = require("../helpers/validation");

/**
 * @swagger
 *
 * components:
 *   schemas:
 *     StatusPartial:
 *       properties:
 *         name:
 *           type: String
 *           example: Actif
 *       required:
 *          - name
 *     Status:
 *       properties:
 *         _id:
 *           type: id
 *           example: 5fd3275ee9ad210015711349
 *         name:
 *           type: String
 *           example: Actif
 *       required:
 *          - name
 *
 */

/**
 *  @swagger
 *
 *  /status:
 *  get :
 *    summary : Return all status
 *    operationId : getstatus
 *    tags :
 *        - status
 *    security:
 *        - bearerAuth: []
 *    responses:
 *      '200':
 *        description: 'Success'
 *        content :
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Status'
 *      '403':
 *         description: Forbidden
 *      '500':
 *         description: Server error
 *
 */

router.get("/", jwt, adminAccess, async (ctx) => {
  try {
    let allstatus = await Status.find({ createdBy: ctx.request.jwt._id }).sort({
      updatedAt: -1,
    });
    ctx.body = allstatus;
  } catch (err) {
    ctx.throw(400, error);
  }
});

/**
 *  @swagger
 * /status/{status_id}:
 *  get :
 *    summary : Return one status
 *    operationId : getonestatut
 *    tags :
 *        - status
 *    security:
 *        - bearerAuth: []
 *    parameters:
 *     - name: status_id
 *       in: path
 *       required: true
 *       description: the id of the status
 *    responses:
 *      '200':
 *        description: 'Success'
 *        content :
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Status'
 *      '403':
 *         description: Forbidden
 *      '404':
 *        description: Status not found
 *      '500':
 *         description: Server error
 *
 */

router.get("/:statusid", jwt, adminAccess, async (ctx) => {
  let validate = ObjectId.isValid(ctx.params.statusid);
  if (!validate) return ctx.throw(404, "status not found");
  const statusid = new ObjectId(ctx.params.statusid);
  try {
    const status = await Status.findById(statusid);
    if (!status) {
      ctx.throw(400, "Status not found");
    } else {
      ctx.body = status;
    }
  } catch (err) {
    ctx.throw(500, err);
  }
});

/**
 *  @swagger
 * /status/add:
 *  post :
 *    summary : Create a status
 *    operationId : createstatus
 *    tags :
 *        - status
 *    security:
 *        - bearerAuth: []
 *    requestBody :
 *     required: true
 *     content :
 *       application/json:
 *          schema:
 *            $ref: '#/components/schemas/StatusPartial'
 *    responses:
 *      '200':
 *        description: Success
 *      '400':
 *        description: Field missing
 *      '403':
 *         description: Forbidden
 *      '500':
 *         description: Server error
 *
 */

router.post("/add", jwt, adminAccess, async (ctx) => {
  const { name } = ctx.request.body;

  const { error } = statusSchema.validate(ctx.request.body);
  if (error) {
    ctx.throw(400, error);
  }
  try {
    const newstatus = new Status({
      name,
      createdBy: new ObjectId(ctx.request.jwt._id),
    });
    await newstatus.save();

    ctx.body = newstatus;
  } catch (err) {
    ctx.throw(500, err);
  }
});

/**
 *  @swagger
 * /status/update/{status_id}:
 *  put :
 *    summary : Update a status
 *    operationId : updatestatus
 *    tags :
 *        - status
 *    security:
 *        - bearerAuth: []
 *    parameters:
 *     - name: status_id
 *       in: path
 *       required: true
 *       description: the id of the status
 *    requestBody :
 *     required: true
 *     content :
 *       application/json:
 *          schema:
 *            $ref: '#/components/schemas/StatusPartial'
 *    responses:
 *      '200':
 *        description: 'Success'
 *      '403':
 *        description: Forbidden
 *      '404':
 *        description: Status not found
 *      '500':
 *        description: Server error
 *
 */

router.put("/update/:statusid", jwt, adminAccess, async (ctx) => {
  let validate = ObjectId.isValid(ctx.params.statusid);
  if (!validate) return ctx.throw(404, "status not found");
  const statusid = new ObjectId(ctx.params.statusid);

  const { error } = statusSchema.validate(ctx.request.body);
  if (error) {
    ctx.throw(400, error);
  }

  try {
    const status = await Status.findById(statusid);
    if (!status) {
      ctx.throw(400, "Status not found");
    }
    await Status.findByIdAndUpdate(statusid, { name: ctx.request.body.name });
    ctx.body = "ok";
  } catch (err) {
    ctx.throw(500, err);
  }
});

/**
 *  @swagger
 * /status/delete/{status_id}:
 *  delete :
 *    summary : Delete a status
 *    operationId : deletestatus
 *    tags :
 *        - status
 *    security:
 *        - bearerAuth: []
 *    parameters:
 *     - name: status_id
 *       in: path
 *       required: true
 *       description: the id of the status
 *    responses:
 *      '200':
 *        description: 'Success'
 *      '403':
 *        description: Forbidden
 *      '404':
 *        description: Status not found
 *      '500':
 *        description: Server error
 *
 */
router.delete("/delete/:statusid", jwt, adminAccess, async (ctx) => {
  let validate = ObjectId.isValid(ctx.params.statusid);
  if (!validate) return ctx.throw(404, "status not found");
  const statusid = new ObjectId(ctx.params.statusid);

  const status = await Status.findById(statusid);
  if (!status) {
    ctx.throw(400, "Status not found");
  }

  try {
    const bill = await Bill.findOne({ status: statusid });
    if (bill) {
      ctx.throw(400, "can't delete status. Status is used in bills");
    }

    const billstatus = await Billstatus.findOne({ status: statusid });
    if (billstatus) {
      ctx.throw(400, "can't delete status. Status is used in bills");
    }

    const task = await Task.findOne({ status: statusid });
    if (task) {
      ctx.throw(400, "can't delete status. Status is used in tasks");
    }

    const taskstatus = await Taskstatus.findOne({ status: statusid });
    if (taskstatus) {
      ctx.throw(400, "can't delete status. Status is used in tasks");
    }

    const repair = await Repair.findOne({ status: statusid });
    if (repair) {
      ctx.throw(400, "can't delete status. Status is used in repairs");
    }

    const repairstatus = await Repairstatus.findOne({ status: statusid });
    if (repairstatus) {
      ctx.throw(400, "can't delete status. Status is used in repairs");
    }

    await Status.findByIdAndDelete(statusid);

    ctx.body = "ok";
  } catch (err) {
    ctx.throw(500, err);
  }
});

module.exports = router;
