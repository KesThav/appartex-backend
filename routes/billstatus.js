const Router = require("@koa/router");
const router = new Router({ prefix: "/history/bills" });
const Billstatus = require("../models/bill_status.model");
const jwt = require("../middlewares/jwt");
const adminAccess = require("../middlewares/adminAccess");
let ObjectId = require("mongodb").ObjectId;

/**
 * @swagger
 *
 * components:
 *   schemas:
 *     BillHistory:
 *       properties:
 *         billid:
 *           type: id
 *           example: 5f9820a2d32a1820dc695040
 *         status:
 *           $ref: '#/components/schemas/Status'
 *       required:
 *          - billid
 *          - status
 *
 */

/**
 *  @swagger
 *
 *  /history/bills:
 *  get :
 *    summary : Return all bills histories
 *    operationId : getbillshistories
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
 *              $ref: '#/components/schemas/BillHistory'
 *      '403':
 *         description: Forbidden
 *      '500':
 *         description: Server error
 *
 */

router.get("/", jwt, adminAccess, async (ctx) => {
  try {
    const allbillstatus = await Billstatus.find({
      createdBy: ctx.request.jwt._id,
    })
      .sort({
        updatedAt: -1,
      })
      .populate({
        path: "billid",
        select: "tenant",
        populate: { path: "tenant", select: "name lastname" },
      })
      .populate("status", "name");
    ctx.body = allbillstatus;
  } catch (err) {
    ctx.throw(400, err);
  }
});

/**
 *  @swagger
 * /history/bills/{bill_id}:
 *  get :
 *    summary : Return all histories of one bill
 *    operationId : getbillhistories
 *    tags :
 *        - history
 *    security:
 *        - bearerAuth: []
 *    parameters:
 *     - name: bill_id
 *       in: path
 *       required: true
 *       description: the id of the bill
 *    responses:
 *      '200':
 *        description: 'Success'
 *        content :
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/BillHistory'
 *      '403':
 *         description: Forbidden
 *      '404':
 *        description: Bill not found
 *      '500':
 *         description: Server error
 *
 */

router.get("/:billid", jwt, adminAccess, async (ctx) => {
  let validate = ObjectId.isValid(ctx.params.billid);
  if (!validate) return ctx.throw(404, "bill not found");
  const billid = new ObjectId(ctx.params.billid);
  try {
    const bill = await Billstatus.find({ billid: billid })
      .populate({
        path: "billid",
        select: "tenant",
        populate: { path: "tenant", select: "name lastname" },
      })
      .populate("status", "name")
      .sort({ updatedAt: -1 });
    if (!bill) {
      ctx.throw(400, "bill not found");
    } else {
      ctx.body = bill;
    }
  } catch (err) {
    ctx.throw(500, err);
  }
});

module.exports = router;
