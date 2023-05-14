const Router = require("@koa/router");
const router = new Router({ prefix: "/history/repairs" });
const Repairstatus = require("../models/repair_status.model");
const jwt = require("../middlewares/jwt");
const adminAccess = require("../middlewares/adminAccess");
let ObjectId = require("mongodb").ObjectId;

/**
 * @swagger
 *
 * components:
 *   schemas:
 *     RepairHistory:
 *       properties:
 *         repairid:
 *           type: id
 *           example: 5f9820a2d32a1820dc695040
 *         status:
 *           $ref: '#/components/schemas/Status'
 *       required:
 *          - repairid
 *          - status
 *
 */

/**
 *  @swagger
 *
 *  /history/repairs:
 *  get :
 *    summary : Return all repairs histories
 *    operationId : getrepairshistories
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
 *              $ref: '#/components/schemas/RepairHistory'
 *      '403':
 *         description: Forbidden
 *      '500':
 *         description: Server error
 *
 */

router.get("/", jwt, adminAccess, async (ctx) => {
  try {
    const allrepairstatus = await Repairstatus.find({
      createdBy: ctx.request.jwt._id,
    })
      .sort({
        updatedAt: -1,
      })
      .populate("repairid")
      .populate("status", "name");
    ctx.body = allrepairstatus;
  } catch (err) {
    ctx.throw(400, err);
  }
});

/**
 *  @swagger
 * /history/repairs/{repair_id}:
 *  get :
 *    summary : Return all histories of one repair
 *    operationId : getrepairhistories
 *    tags :
 *        - history
 *    security:
 *        - bearerAuth: []
 *    parameters:
 *     - name: repair_id
 *       in: path
 *       required: true
 *       description: the id of the repair
 *    responses:
 *      '200':
 *        description: 'Success'
 *        content :
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/RepairHistory'
 *      '403':
 *         description: Forbidden
 *      '404':
 *        description: Repair not found
 *      '500':
 *         description: Server error
 *
 */

router.get("/:repairid", jwt, adminAccess, async (ctx) => {
  let validate = ObjectId.isValid(ctx.params.repairid);
  if (!validate) return ctx.throw(404, "repair not found");
  const repairid = new ObjectId(ctx.params.repairid);
  try {
    const repair = await Repairstatus.find({ repairid: repairid })
      .populate("repairid")
      .populate("status", "name")
      .sort({ updatedAt: -1 });
    if (!repair) {
      ctx.throw(400, "repair not found");
    } else {
      ctx.body = repair;
    }
  } catch (err) {
    ctx.throw(500, err);
  }
});

module.exports = router;
