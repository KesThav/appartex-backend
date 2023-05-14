const Router = require("@koa/router");
const router = new Router({ prefix: "/bills" });
const Bill = require("../models/bill.model");
const jwt = require("../middlewares/jwt");
const adminAccess = require("../middlewares/adminAccess");
const billValidation = require("../helpers/billValidation");
const { billSchema } = require("../helpers/validation");
const Billstatus = require("../models/bill_status.model");
let ObjectId = require("mongodb").ObjectId;
const fs = require("fs");
const File = require("../models/file.model");
const multer = require("@koa/multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/bill");
  },
  filename: function (req, file, cb) {
    let type = file.originalname.split(".")[1];
    let filename = file.originalname.split(".")[0];
    cb(null, `${filename}-${Date.now().toString(16)}.${type}`);
  },
});

const limits = {
  fields: 10,
  fileSize: 500 * 1024,
};

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|pdf|doc|docx)$/)) {
      return cb(new Error("Format not allow!"));
    }
    cb(null, true);
  },
  limits,
});

/**
 * @swagger
 *
 * components:
 *   schemas:
 *     Bill:
 *       properties:
 *         tenant:
 *           type: id
 *           example: 507f1f77bcf86cd799439011
 *         reference:
 *           type: String
 *           example: DC-134
 *         endDate:
 *           type: Date
 *           example: 2021-02-17
 *         amount:
 *           type: Number
 *           example: 1994
 *         reason:
 *            type: String
 *            example: Rent
 *         status:
 *            type: id
 *            example: 507f1f77bcf86cd799439011
 *         file:
 *            type: id
 *            example : 5f954d4c94a4981bc4284277
 *       required:
 *          - tenant
 *          - endDate
 *          - amount
 *          - reason
 *     Bill_populate:
 *       properties:
 *         _id:
 *           type: id
 *           example: 5fd3275ee9ad210015711349
 *         tenant:
 *           $ref : '#/components/schemas/TenantPartial'
 *         reference:
 *           type: String
 *           example: DC-134
 *         endDate:
 *           type: Date
 *           example: 2021-02-17
 *         amount:
 *           type: Number
 *           example: 1994
 *         reason:
 *            type: String
 *            example: Rent
 *         status:
 *            $ref : '#/components/schemas/Status'
 *         file:
 *            type: id
 *            example: 507f1f77bcf86cd799439011
 *       required:
 *          - tenant
 *          - endDate
 *          - amount
 *          - reason
 *     Bill_populate_file:
 *       properties:
 *         _id:
 *           type: id
 *           example: 5fd3275ee9ad210015711349
 *         tenant:
 *           $ref : '#/components/schemas/TenantPartial'
 *         reference:
 *           type: String
 *           example: DC-134
 *         endDate:
 *           type: Date
 *           example: 2021-02-17
 *         amount:
 *           type: Number
 *           example: 1994
 *         reason:
 *            type: String
 *            example: Rent
 *         status:
 *            $ref : '#/components/schemas/Status'
 *         file:
 *            $ref: '#/components/schemas/File'
 *       required:
 *          - tenant
 *          - endDate
 *          - amount
 *          - reason
 */

/**
 *  @swagger
 *
 *  /bills:
 *  get :
 *    summary : Return all bills
 *    operationId : getbills
 *    tags :
 *        - bill
 *    security:
 *        - bearerAuth: []
 *    responses:
 *      '200':
 *        description: 'Success'
 *        content :
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Bill_populate'
 *      '403':
 *         description: Forbidden
 *      '500':
 *         description: Server error
 *
 */

router.get("/", jwt, adminAccess, async (ctx) => {
  try {
    let allbills = await Bill.find({ createdBy: ctx.request.jwt._id })
      .populate("status", "name")
      .populate("tenant", "name lastname")
      .sort({ updatedAt: -1 });
    ctx.body = allbills;
  } catch (err) {
    ctx.throw(400, error);
  }
});

/**
 *  @swagger
 * /bills/{bill_id}:
 *  get :
 *    summary : Return one bill
 *    operationId : getonebill
 *    tags :
 *        - bill
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
 *              $ref: '#/components/schemas/Bill_populate_file'
 *      '403':
 *         description: Forbidden
 *      '500':
 *         description: Server error
 *
 */

router.get("/:billid", jwt, adminAccess, async (ctx) => {
  let validate = ObjectId.isValid(ctx.params.billid);
  if (!validate) return ctx.throw(404, "bill not found");
  const billid = new ObjectId(ctx.params.billid);
  try {
    const bill = await Bill.findById(billid)
      .populate("status", "name")
      .populate("tenant", "name lastname")
      .populate("file")
      .sort({ updatedAt: -1 });
    if (!bill) {
      ctx.throw(400, "Bill not found");
    } else {
      ctx.body = bill;
    }
  } catch (err) {
    ctx.throw(500, err);
  }
});

/**
 *  @swagger
 * /bills/add:
 *  post :
 *    summary : Create a bill
 *    operationId : createbill
 *    tags :
 *        - bill
 *    security:
 *        - bearerAuth: []
 *    requestBody :
 *     required: true
 *     content :
 *       application/json:
 *          schema:
 *            $ref: '#/components/schemas/Bill'
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

router.post("/add", jwt, adminAccess, billValidation, async (ctx) => {
  const {
    tenant,
    reference,
    endDate,
    amount,
    reason,
    status,
  } = ctx.request.body;
  try {
    const newbill = new Bill({
      tenant,
      reference,
      endDate,
      amount,
      reason,
      status,
      createdBy: new ObjectId(ctx.request.jwt._id),
    });

    await newbill.save();

    const newbillstatus = new Billstatus({
      endDate: newbill.endDate,
      billid: newbill._id,
      status: newbill.status,
      createdBy: new ObjectId(ctx.request.jwt._id),
    });

    await newbillstatus.save();

    ctx.body = newbill;
  } catch (err) {
    ctx.throw(500, err);
  }
});

/**
 *  @swagger
 * /bills/update/{bill_id}:
 *  put :
 *    summary : Update a status
 *    operationId : updatestatus
 *    tags :
 *        - bill
 *    security:
 *        - bearerAuth: []
 *    parameters:
 *     - name: bill_id
 *       in: path
 *       required: true
 *       description: the id of the bill
 *    requestBody :
 *     required: true
 *     content :
 *       application/json:
 *          schema:
 *            $ref: '#/components/schemas/Bill'
 *    responses:
 *      '200':
 *        description: 'Success'
 *      '403':
 *        description: Forbidden
 *      '404':
 *        description: Bill not found
 *      '500':
 *        description: Server error
 *
 */

router.put("/update/:billid", jwt, adminAccess, billValidation, async (ctx) => {
  let validate = ObjectId.isValid(ctx.params.billid);
  if (!validate) return ctx.throw(404, "bill not found");
  const billid = new ObjectId(ctx.params.billid);

  const bill = await Bill.findById(billid);
  if (!bill) {
    ctx.throw(400, "bill not found");
  }

  const {
    tenant,
    reference,
    endDate,
    amount,
    reason,
    status,
  } = ctx.request.body;

  const update = { tenant, reference, endDate, amount, reason, status };
  try {
    const updatedbill = await Bill.findByIdAndUpdate(billid, update, {
      new: true,
    });

    const billstatus = new Billstatus({
      endDate: update.endDate,
      billid: billid,
      status: update.status,
      createdBy: new ObjectId(ctx.request.jwt._id),
    });

    await billstatus.save();
    ctx.body = updatedbill;
  } catch (err) {
    ctx.throw(500, err);
  }
});

/**
 *  @swagger
 * /bills/delete/{bill_id}:
 *  delete :
 *    summary : Delete a bill
 *    operationId : deletebill
 *    tags :
 *        - bill
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
 *      '403':
 *        description: Forbidden
 *      '404':
 *        description: Bill not found
 *      '500':
 *        description: Server error
 *
 */

router.delete("/delete/:billid", jwt, adminAccess, async (ctx) => {
  let validate = ObjectId.isValid(ctx.params.billid);
  if (!validate) return ctx.throw(404, "bill not found");
  const billid = new ObjectId(ctx.params.billid);

  const bill = await Bill.findById(billid);
  if (!bill) {
    ctx.throw(400, "bill not found");
  }
  try {
    await Billstatus.deleteMany({ billid: billid });
    await Bill.findByIdAndDelete(billid);
    ctx.body = "ok";
  } catch (err) {
    ctx.throw(500, err);
  }
});

/**
 *  @swagger
 * /bills/upload/{bill_id}:
 *  put :
 *    summary : Add file to bill
 *    operationId : addfilebill
 *    tags :
 *        - bill
 *    security:
 *        - bearerAuth: []
 *    parameters:
 *     - name: bill_id
 *       in: path
 *       required: true
 *       description: the id of the bill
 *    requestBody :
 *     required: true
 *     content :
 *       multipart/form-data:
 *          schema:
 *            type: object
 *            properties:
 *              file:
 *                type: string
 *                format: binary
 *            required:
 *              - file
 *    responses:
 *      '200':
 *        description: 'Success'
 *      '403':
 *        description: Forbidden
 *      '404':
 *        description: Bill not found
 *      '500':
 *        description: Server error
 *
 */

router.put("/upload/:billid", jwt, adminAccess, async (ctx, next) => {
  let uploadedFiles = [];
  let validate = ObjectId.isValid(ctx.params.billid);
  if (!validate) return ctx.throw(404, "bill not found");
  let billid = new ObjectId(ctx.params.billid);

  const bill = await Bill.findById(billid);
  if (!bill) {
    ctx.throw(404, "bill not found");
  }
  try {
    let err = await upload
      .array("file")(ctx, next)
      .then((res) => res)
      .catch((err) => err);
    if (err) {
      ctx.throw(400, err.message);
    }
    for (i = 0; i < ctx.files.length; i++) {
      let file = new File({
        data: fs.readFileSync(ctx.files[i].path),
        contentType: ctx.files[i].mimetype,
        name: ctx.files[i].filename,
      });

      const savefile = await file.save();
      uploadedFiles.push(savefile._id);
    }

    for (i = 0; i < uploadedFiles.length; i++) {
      await Bill.findByIdAndUpdate(billid, {
        $push: {
          file: new ObjectId(uploadedFiles[i]),
        },
      });
    }
    ctx.body = "ok";
  } catch (err) {
    ctx.throw(500, err);
  }
});

/**
 *  @swagger
 * /bills/delete/file/{bill_id}:
 *  put :
 *    summary : delete file from bill
 *    operationId : deletefilebill
 *    tags :
 *        - bill
 *    security:
 *        - bearerAuth: []
 *    parameters:
 *     - name: bill_id
 *       in: path
 *       required: true
 *       description: the id of the bill
 *    requestBody :
 *     required: true
 *     content :
 *       application/json:
 *          schema:
 *            type: object
 *            properties:
 *              file:
 *                type: id
 *                example: 5fd3275ee9ad210015711349
 *            required:
 *              - file
 *    responses:
 *      '200':
 *        description: 'Success'
 *      '403':
 *        description: Forbidden
 *      '404':
 *        description: Tenant not found
 *      '500':
 *        description: Server error
 *
 */

router.put("/delete/file/:billid", jwt, adminAccess, async (ctx) => {
  let validate = ObjectId.isValid(ctx.params.billid);
  if (!validate) return ctx.throw(404, "Bill not found");
  let billid = new ObjectId(ctx.params.billid);

  const bill = await Bill.findById(billid);
  if (!bill) {
    ctx.throw(404, "bill not found");
  }

  try {
    await Bill.findByIdAndUpdate(billid, {
      $pull: { file: ctx.request.body.file },
    });
    await File.findByIdAndDelete(ctx.request.body.file);
    ctx.body = "ok";
  } catch (err) {
    ctx.throw(500, err);
  }
});
module.exports = router;
