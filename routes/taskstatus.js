const Router = require("@koa/router");
const router = new Router({ prefix: "/history/tasks" });
const Taskstatus = require("../models/task_status.model");
const jwt = require("../middlewares/jwt");
const adminAccess = require("../middlewares/adminAccess");
let ObjectId = require("mongodb").ObjectId;

/**
 * @swagger
 *
 * components:
 *   schemas:
 *     TaskHistory:
 *       properties:
 *         taskid:
 *           type: id
 *           example: 5f9820a2d32a1820dc695040
 *         status:
 *           $ref: '#/components/schemas/Status'
 *       required:
 *          - taskid
 *          - status
 *
 */

/**
 *  @swagger
 *
 *  /history/tasks:
 *  get :
 *    summary : Return all tasks histories
 *    operationId : gettasksshistories
 *    tags :
 *        - history
 *    security:
 *        - bearerAuth: []
 *    responses:
 *      '200':
 *        description: 'Success'
 *        content :
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/TaskHistory'
 *      '403':
 *         description: Forbidden
 *      '500':
 *         description: Server error
 *
 */

router.get("/", jwt, adminAccess, async (ctx) => {
  try {
    const alltasksstatus = await Taskstatus.find({
      createdBy: ctx.request.jwt._id,
    })
      .sort({
        updatedAt: -1,
      })
      .populate({
        path: "taskid",
      })
      .populate("status", "name");
    ctx.body = alltasksstatus;
  } catch (err) {
    ctx.throw(400, err);
  }
});

/**
 *  @swagger
 * /history/tasks/{task_id}:
 *  get :
 *    summary : Return all histories of one task
 *    operationId : gettaskhistories
 *    tags :
 *        - history
 *    security:
 *        - bearerAuth: []
 *    parameters:
 *     - name: task_id
 *       in: path
 *       required: true
 *       description: the id of the task
 *    responses:
 *      '200':
 *        description: 'Success'
 *        content :
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/TaskHistory'
 *      '403':
 *         description: Forbidden
 *      '404':
 *        description: Task not found
 *      '500':
 *         description: Server error
 *
 */

router.get("/:taskid", jwt, adminAccess, async (ctx) => {
  let validate = ObjectId.isValid(ctx.params.taskid);
  if (!validate) return ctx.throw(404, "task not found");
  const taskid = new ObjectId(ctx.params.taskid);
  try {
    const task = await Taskstatus.find({ taskid: taskid })
      .populate("taskid")
      .populate("status", "name")
      .sort({ updatedAt: -1 });
    if (!task) {
      ctx.throw(400, "bill not found");
    } else {
      ctx.body = task;
    }
  } catch (err) {
    ctx.throw(500, err);
  }
});

module.exports = router;
