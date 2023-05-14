const Router = require("@koa/router");
const router = new Router({ prefix: "/repairs" });
const Repair = require("../models/repair.model");
const jwt = require("../middlewares/jwt");
const adminAccess = require("../middlewares/adminAccess");
const { repairSchema } = require("../helpers/validation");
const Repairstatus = require("../models/repair_status.model");
const Task = require("../models/task.model");
let ObjectId = require("mongodb").ObjectId;
const multer = require("@koa/multer");
const path = require("path");
const fs = require("fs");
const File = require("../models/file.model");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/repair");
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
    if (!file.originalname.match(/\.(jpg|jpeg|png|pdf|doc|docx|gif|svg)$/)) {
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
 *     Repair:
 *       properties:
 *         status:
 *           type: id
 *           example: 507f1f77bcf86cd799439011
 *         reason:
 *           type: String
 *           example: DC-134
 *         amount:
 *           type: Number
 *           example: 1994
 *         taskid:
 *            type: id
 *            example: 507f1f77bcf86cd799439011
 *       required:
 *          - status
 *          - taskid
 *          - amount
 *          - reason
 *     Repair_populate:
 *       properties:
 *         status:
 *           $ref : '#/components/schemas/Status'
 *         reason:
 *           type: String
 *           example: DC-134
 *         amount:
 *           type: Number
 *           example: 1994
 *         taskid:
 *          $ref : '#/components/schemas/Task_populate'
 *       required:
 *          - status
 *          - taskid
 *          - amount
 *          - reason
 *
 */

/**
 *  @swagger
 *
 *  /repairs:
 *  get :
 *    summary : Return all repairs
 *    operationId : getrepairs
 *    tags :
 *        - repair
 *    security:
 *        - bearerAuth: []
 *    responses:
 *      '200':
 *        description: 'Success'
 *        content :
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Repair_populate'
 *      '403':
 *         description: Forbidden
 *      '500':
 *         description: Server error
 *
 */

router.get("/", jwt, adminAccess, async (ctx) => {
  try {
    let allrepairs = await Repair.find({ createdBy: ctx.request.jwt._id })
      .populate("status", "name")
      .populate("taskid")
      .populate("file")
      .sort({ updatedAt: -1 });
    ctx.body = allrepairs;
  } catch (err) {
    ctx.throw(400, error);
  }
});

/**
 *  @swagger
 * /repairs/{repair_id}:
 *  get :
 *    summary : Return one repair
 *    operationId : getonerepair
 *    tags :
 *        - repair
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
 *              $ref: '#/components/schemas/Repair_populate'
 *      '403':
 *         description: Forbidden
 *      '500':
 *         description: Server error
 *
 */

router.get("/:repairid", jwt, adminAccess, async (ctx) => {
  let validate = ObjectId.isValid(ctx.params.repairid);
  if (!validate) return ctx.throw(404, "repair not found");
  const repairid = new ObjectId(ctx.params.repairid);
  try {
    const repair = await Repair.findById(repairid)
      .populate("status", "name")
      .populate("taskid")
      .populate("file")
      .sort({ updatedAt: -1 });
    if (!repair) {
      ctx.throw(400, "Repair not found");
    } else {
      ctx.body = repair;
    }
  } catch (err) {
    ctx.throw(500, err);
  }
});

/**
 *  @swagger
 * /repairs/add:
 *  post :
 *    summary : Create a repair
 *    operationId : createrepair
 *    tags :
 *        - repair
 *    security:
 *        - bearerAuth: []
 *    requestBody :
 *     required: true
 *     content :
 *       application/json:
 *          schema:
 *            $ref: '#/components/schemas/Repair'
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
  const { amount, status, reason, taskid } = ctx.request.body;

  const { error } = repairSchema.validate(ctx.request.body);
  if (error) {
    ctx.throw(400, error);
  }

  const task = await Task.findById(taskid);
  if (!task) {
    ctx.throw(400, "Task not found");
  }

  try {
    const newrepair = new Repair({
      amount,
      status,
      reason,
      taskid,
      createdBy: new ObjectId(ctx.request.jwt._id),
    });

    await newrepair.save();

    const newrepairstatus = new Repairstatus({
      repairid: newrepair._id,
      status: newrepair.status,
      createdBy: new ObjectId(ctx.request.jwt._id),
    });

    await newrepairstatus.save();

    ctx.body = newrepair;
  } catch (err) {
    ctx.throw(500, err);
  }
});

/**
 *  @swagger
 * /repairs/update/{repair_id}:
 *  put :
 *    summary : Update a repair
 *    operationId : updaterepair
 *    tags :
 *        - repair
 *    security:
 *        - bearerAuth: []
 *    parameters:
 *     - name: repair_id
 *       in: path
 *       required: true
 *       description: the id of the repair
 *    requestBody :
 *     required: true
 *     content :
 *       application/json:
 *          schema:
 *            $ref: '#/components/schemas/Repair'
 *    responses:
 *      '200':
 *        description: 'Success'
 *      '403':
 *        description: Forbidden
 *      '404':
 *        description: Repair not found
 *      '500':
 *        description: Server error
 *
 */

router.put("/update/:repairid", jwt, adminAccess, async (ctx) => {
  let validate = ObjectId.isValid(ctx.params.repairid);
  if (!validate) return ctx.throw(404, "repair not found");
  const repairid = new ObjectId(ctx.params.repairid);

  const repair = await Repair.findById(repairid);
  if (!repair) {
    ctx.throw(400, "repair not found");
  }

  const { amount, status, reason, taskid } = ctx.request.body;

  const update = { amount, status, reason, taskid };
  try {
    const updatedrepair = await Repair.findByIdAndUpdate(repairid, update, {
      new: true,
    });

    const repairstatus = new Repairstatus({
      repairid: repairid,
      status: update.status,
      createdBy: new ObjectId(ctx.request.jwt._id),
    });

    await repairstatus.save();
    ctx.body = updatedrepair;
  } catch (err) {
    ctx.throw(500, err);
  }
});

/**
 *  @swagger
 * /repairs/delete/{repair_id}:
 *  delete :
 *    summary : Delete a repair
 *    operationId : deleterepair
 *    tags :
 *        - repair
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
 *      '403':
 *        description: Forbidden
 *      '404':
 *        description: Repair not found
 *      '500':
 *        description: Server error
 *
 */

router.delete("/delete/:repairid", jwt, adminAccess, async (ctx) => {
  let validate = ObjectId.isValid(ctx.params.repairid);
  if (!validate) return ctx.throw(404, "Repair not found");
  let repairid = new ObjectId(ctx.params.repairid);

  const repair = await Repair.findById(repairid);
  if (repair.length == 0) {
    ctx.throw(400, "repair not found");
  }
  try {
    await Repairstatus.deleteMany({ repairid: repairid });
    await Repair.findByIdAndDelete(repairid);
    ctx.body = "ok";
  } catch (err) {
    ctx.throw(500, err);
  }
});

/**
 *  @swagger
 * /repairs/upload/{repair_id}:
 *  put :
 *    summary : Add file to repair
 *    operationId : addfilerepair
 *    tags :
 *        - repair
 *    security:
 *        - bearerAuth: []
 *    parameters:
 *     - name: repair_id
 *       in: path
 *       required: true
 *       description: the id of the repair
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
 *        description: Repair not found
 *      '500':
 *        description: Server error
 *
 */

router.put("/upload/:repairid", jwt, adminAccess, async (ctx, next) => {
  let uploadedFiles = [];
  let validate = ObjectId.isValid(ctx.params.repairid);
  if (!validate) return ctx.throw(404, "repair not found");
  let repairid = new ObjectId(ctx.params.repairid);

  const repair = await Repair.findById(repairid);
  if (!repair) {
    ctx.throw(404, "repair not found");
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
      await Repair.findByIdAndUpdate(repairid, {
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
 * /repairs/delete/file/{repair_id}:
 *  put :
 *    summary : delete file from repair
 *    operationId : deletefilerepair
 *    tags :
 *        - repair
 *    security:
 *        - bearerAuth: []
 *    parameters:
 *     - name: repair_id
 *       in: path
 *       required: true
 *       description: the id of the repair
 *    requestBody :
 *     required: true
 *     content :
 *       application/json:
 *          schema:
 *            type: object
 *            properties:
 *              file:
 *                type: string
 *                example: file/random-file.pdf
 *            required:
 *              - file
 *    responses:
 *      '200':
 *        description: 'Success'
 *      '403':
 *        description: Forbidden
 *      '404':
 *        description: Repair not found
 *      '500':
 *        description: Server error
 *
 */

router.put("/delete/file/:repairid", jwt, adminAccess, async (ctx) => {
  let validate = ObjectId.isValid(ctx.params.repairid);
  if (!validate) return ctx.throw(404, "repair not found");
  let repairid = new ObjectId(ctx.params.repairid);

  const repair = await Repair.findById(repairid);
  if (!repair) {
    ctx.throw(404, "repair not found");
  }

  try {
    await Repair.findByIdAndUpdate(repairid, {
      $pull: { file: ctx.request.body.file },
    });
    await File.findByIdAndDelete(ctx.request.body.file);
    ctx.body = "ok";
  } catch (err) {
    ctx.throw(500, err);
  }
});
module.exports = router;
