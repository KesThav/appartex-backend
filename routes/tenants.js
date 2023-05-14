const Router = require("@koa/router");
const router = new Router({ prefix: "/tenants" });
const Tenant = require("../models/tenant.model");
const Contract = require("../models/contract.model");
const Bill = require("../models/bill.model");
const Appart = require("../models/appartment.model");
const Building = require("../models/building.model");
const Billstatus = require("../models/bill_status.model");
let ObjectId = require("mongodb").ObjectId;
const jwt = require("../middlewares/jwt");
const adminAccess = require("../middlewares/adminAccess");
const filterAccess = require("../middlewares/filterAccess");
const bcrypt = require("bcrypt");
const { userSchema } = require("../helpers/validation");
const Task = require("../models/task.model");
const Message = require("../models/message.model");
const multer = require("@koa/multer");
const path = require("path");
const fs = require("fs");
const File = require("../models/file.model");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/tenant");
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
      return cb(new Error("Only image files are allowed!"));
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
 *     Tenant:
 *       properties:
 *         name:
 *           type: String
 *           example: Patrick
 *         lastname:
 *           type: string
 *           example: Bruel
 *         email:
 *           type: String
 *           example: Jean@paul.com
 *         password:
 *            type: String
 *            minimum: 6
 *            example: 1a3b5c
 *         status:
 *            type: String
 *            default: "Actif"
 *            example: Actif
 *         dateofbirth:
 *            type: Date
 *            example: 1996-02-17
 *         file:
 *            type: id
 *            example: 5fd3273ce9ad210015711348
 *       required:
 *          - name
 *          - lastname
 *          - email
 *          - password
 *
 *     TenantPartial:
 *       properties:
 *         _id:
 *           type: id
 *           example: 5fd3275ee9ad210015711349
 *         name:
 *           type: String
 *           example: Patrick
 *         lastname:
 *           type: string
 *           example: Bruel
 *         email:
 *           type: String
 *           example: Jean@paul.com
 *         status:
 *            type: String
 *            default: "Actif"
 *            example: Actif
 *         dateofbirth:
 *            type: Date
 *            example: 1996-02-17
 *         file:
 *            type: id
 *            example: 5fd3273ce9ad210015711348
 *       required:
 *          - name
 *          - lastname
 *          - email
 *
 *     Tenant_populate:
 *       properties:
 *         _id:
 *           type: id
 *           example: 5fd3275ee9ad210015711349
 *         name:
 *           type: String
 *           example: Patrick
 *         lastname:
 *           type: string
 *           example: Bruel
 *         email:
 *           type: String
 *           example: Jean@paul.com
 *         password:
 *            type: String
 *            minimum: 6
 *            example: 1a3b5c
 *         status:
 *            type: String
 *            default: "Actif"
 *            example: Actif
 *         dateofbirth:
 *            type: Date
 *            example: 1996-02-17
 *         file:
 *            $ref : '#/components/schemas/File'
 *       required:
 *          - name
 *          - lastname
 *          - email
 *          - password
 */

/**
 *  @swagger
 *
 *  /tenants:
 *  get :
 *    summary : Return all tenants
 *    operationId : gettenants
 *    tags :
 *        - tenant
 *    security:
 *        - bearerAuth: []
 *    responses:
 *      '200':
 *        description: 'Success'
 *        content :
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/TenantPartial'
 *      '403':
 *         description: Forbidden
 *      '500':
 *         description: Server error
 *
 */

router.get("/", jwt, adminAccess, async (ctx) => {
  try {
    let alltenants = await Tenant.find({
      createdBy: ctx.request.jwt._id,
    })
      .select({
        _id: 1,
        name: 1,
        lastname: 1,
        email: 1,
        status: 1,
        dateofbirth: 1,
        file: 1,
      })
      .sort({ updatedAt: -1 });
    ctx.body = alltenants;
  } catch (err) {
    ctx.throw(500, error);
  }
});

/**
 *  @swagger
 * /tenants/{tenant_id}:
 *  get :
 *    summary : Return one tenant
 *    operationId : getonetenant
 *    tags :
 *        - tenant
 *    security:
 *        - bearerAuth: []
 *    parameters:
 *     - name: tenant_id
 *       in: path
 *       required: true
 *       description: the id of the tenant
 *    responses:
 *      '200':
 *        description: 'Success'
 *        content :
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Tenant_populate'
 *      '403':
 *         description: Forbidden
 *      '404':
 *         description: Tenant not found
 *      '500':
 *         description: Server error
 *
 */

router.get("/:tenantid", jwt, filterAccess, async (ctx) => {
  let validate = ObjectId.isValid(ctx.params.tenantid);
  if (!validate) return ctx.throw(404, "tenant not found");
  try {
    let tenantid = new ObjectId(ctx.params.tenantid);
    const onetenant = await Tenant.findById(tenantid).populate("file");
    if (!onetenant) {
      ctx.throw(404, "tenant not found");
    } else {
      ctx.body = onetenant;
    }
  } catch (err) {
    ctx.throw(500, err);
  }
});

/**
 *  @swagger
 * /tenants/add:
 *  post :
 *    summary : Create a tenant
 *    operationId : createtenant
 *    tags :
 *        - tenant
 *    security:
 *        - bearerAuth: []
 *    requestBody :
 *     required: true
 *     content :
 *       application/json:
 *          schema:
 *            $ref: '#/components/schemas/Tenant'
 *    responses:
 *      '200':
 *        description: 'Success'
 *      '400':
 *        description : Field missing
 *      '403':
 *         description: Forbidden
 *      '500':
 *         description: Server error
 *
 */

router.post("/add", jwt, adminAccess, async (ctx) => {
  const { name, lastname, email, dateofbirth, password } = ctx.request.body;

  const { error } = userSchema.validate(ctx.request.body);
  if (error) {
    ctx.throw(400, error);
  }

  const emailExist = await Tenant.findOne({ email });
  if (emailExist) {
    ctx.throw(400, `Email already exist`);
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  try {
    let newtenant = new Tenant({
      name,
      lastname,
      email,
      dateofbirth,
      password: hashedPassword,
      createdBy: new ObjectId(ctx.request.jwt._id),
    });
    await newtenant.save();
    ctx.body = newtenant;
  } catch (err) {
    ctx.throw(500, err);
  }
});

/**
 *  @swagger
 * /tenants/update/{tenant_id}:
 *  put :
 *    summary : Update a tenant
 *    operationId : updatetenant
 *    tags :
 *        - tenant
 *    security:
 *        - bearerAuth: []
 *    parameters:
 *     - name: tenant_id
 *       in: path
 *       required: true
 *       description: the id of the tenant
 *    requestBody :
 *     required: true
 *     content :
 *       application/json:
 *          schema:
 *            $ref: '#/components/schemas/Tenant'
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

router.put("/update/:tenantid", jwt, filterAccess, async (ctx) => {
  let validate = ObjectId.isValid(ctx.params.tenantid);
  if (!validate) return ctx.throw(404, "No tenant found");
  let tenantid = new ObjectId(ctx.params.tenantid);

  const tenant = await Tenant.findOne({ _id: tenantid });
  if (!tenant) {
    ctx.throw(404, "No tenant found");
  }

  if (ctx.request.body.email) {
    const emailExist = await Tenant.findOne({ email: ctx.request.body.email });
    if (emailExist) {
      if (!(emailExist._id == ctx.params.tenantid)) {
        ctx.throw(400, `Email already exist`);
      }
    }
  }
  if (ctx.request.body.status == "Inactif") {
    const res = await Contract.findOne({ tenant: tenantid, status: "Actif" });
    if (res) {
      ctx.throw(
        400,
        "Le locataire ne peut pas être désactivé car il possède des contrats actifs. Archivez d'abord les contrats."
      );
    }
  }
  try {
    const updatedtenant = await Tenant.findByIdAndUpdate(
      tenantid,
      ctx.request.body,
      {
        new: true,
      }
    );
    ctx.body = updatedtenant;
  } catch (err) {
    ctx.throw(500, err);
  }
});

router.put("/update/password/:tenantid", jwt, filterAccess, async (ctx) => {
  let validate = ObjectId.isValid(ctx.params.tenantid);
  if (!validate) return ctx.throw(404, "No tenant found");
  let tenantid = new ObjectId(ctx.params.tenantid);

  const tenant = await Tenant.findOne({ _id: tenantid });
  if (!tenant) {
    ctx.throw(404, "No tenant found");
  }

  const { password } = ctx.request.body;

  try {
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);
    const updatedtenant = await Tenant.findByIdAndUpdate(
      tenantid,
      { password: hashPassword },
      {
        new: true,
      }
    );
    ctx.body = updatedtenant;
  } catch (err) {
    ctx.throw(500, err);
  }
});

/**
 *  @swagger
 * /tenants/delete/{tenant_id}:
 *  delete :
 *    summary : Delete a tenant
 *    operationId : deletetenant
 *    tags :
 *        - tenant
 *    security:
 *        - bearerAuth: []
 *    parameters:
 *     - name: tenant_id
 *       in: path
 *       required: true
 *       description: the id of the tenant
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

router.delete("/delete/:tenantid", jwt, adminAccess, async (ctx) => {
  let buildingid = [];
  let billhistoriesid = [];
  let validate = ObjectId.isValid(ctx.params.tenantid);
  if (!validate) return ctx.throw(404, "No tenant found");
  let tenantid = new ObjectId(ctx.params.tenantid);
  const tenant = await Tenant.findById(tenantid);
  if (!tenant) {
    ctx.throw(404, "No tenant found");
  }
  try {
    //delete bill history
    const bills = await Bill.find({ tenant: tenantid }).select({
      _id: 1,
    });

    for (i = 0; i < bills.length; i++) {
      billhistoriesid.push(
        await Billstatus.find({ billid: bills[i]._id }).select({ _id: 1 })
      );
    }

    for (i = 0; i < billhistoriesid.length; i++) {
      await Billstatus.findByIdAndDelete(billhistoriesid[i]._id);
    }

    //delete bills
    await Bill.deleteMany({ tenant: tenantid });

    //change appartment statut
    const appartid = await Contract.find({ tenant: tenantid }).select({
      appartmentid: 1,
      _id: 0,
    });

    for (i = 0; i < appartid.length; i++) {
      await Appart.findByIdAndUpdate(
        appartid[i].appartmentid,
        { status: "Libre" },
        { new: true }
      );
    }

    //decrement building counter
    for (i = 0; i < appartid.length; i++) {
      if (appartid[i].appartmentid) {
        buildingid.push(
          await Appart.findById(appartid[i].appartmentid).select({
            building: 1,
            _id: 0,
          })
        );
      }
    }

    for (i = 0; i < buildingid.length; i++) {
      if (buildingid[i].building) {
        await Building.findByIdAndUpdate(buildingid[i].building, {
          $inc: { counter: -1 },
        });
      }
    }

    await Contract.deleteMany({ tenant: tenantid });
    await Tenant.findByIdAndDelete(tenantid);
    ctx.body = "ok";
  } catch (err) {
    ctx.throw(500, err);
  }
});

/*########################################################## Tenant endpoints #####################################################################################*/

/**
 *  @swagger
 * /tenants/contracts/{tenant_id}:
 *  get :
 *    summary : Return tenant contracts
 *    operationId : gettenantcontract
 *    tags :
 *        - tenant
 *    security:
 *        - bearerAuth: []
 *    parameters:
 *     - name: tenant_id
 *       in: path
 *       required: true
 *       description: the id of the tenant
 *    responses:
 *      '200':
 *        description: 'Success'
 *        content :
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Contract_populate'
 *      '403':
 *         description: Forbidden
 *      '404':
 *         description: No contract found
 *      '500':
 *         description: Server error
 *
 */

router.get("/contracts/:tenantid", jwt, filterAccess, async (ctx) => {
  let validate = ObjectId.isValid(ctx.params.tenantid);
  if (!validate) return ctx.throw(404, "no tenant found");
  try {
    let tenantid = new ObjectId(ctx.params.tenantid);
    const contracts = await Contract.find({ tenant: tenantid })
      .populate({
        path: "appartmentid",
        populate: { path: "building" },
      })
      .populate("file")
      .sort({ updatedAt: -1 });

    if (!contracts) {
      ctx.throw(404, "no contract found");
    } else {
      ctx.body = contracts;
    }
  } catch (err) {
    ctx.throw(500, err);
  }
});

/**
 *  @swagger
 * /tenants/bills/{tenant_id}:
 *  get :
 *    summary : Return tenant bills
 *    operationId : gettenantbill
 *    tags :
 *        - tenant
 *    security:
 *        - bearerAuth: []
 *    parameters:
 *     - name: tenant_id
 *       in: path
 *       required: true
 *       description: the id of the tenant
 *    responses:
 *      '200':
 *        description: 'Success'
 *        content :
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Bill_populate'
 *      '403':
 *         description: Forbidden
 *      '404':
 *         description: No bill found
 *      '500':
 *         description: Server error
 *
 */

router.get("/bills/:tenantid", jwt, filterAccess, async (ctx) => {
  let validate = ObjectId.isValid(ctx.params.tenantid);
  if (!validate) return ctx.throw(404, "no tenant found");
  try {
    let tenantid = new ObjectId(ctx.params.tenantid);
    const bills = await Bill.find({ tenant: tenantid })
      .populate("status")
      .populate("file")
      .sort({ updatedAt: -1 });

    if (!bills) {
      ctx.throw(404, "no contract found");
    } else {
      ctx.body = bills;
    }
  } catch (err) {
    ctx.throw(500, err);
  }
});

/**
 *  @swagger
 * /tenants/tasks/{tenant_id}:
 *  get :
 *    summary : Return tenant tasks
 *    operationId : gettenanttasks
 *    tags :
 *        - tenant
 *    security:
 *        - bearerAuth: []
 *    parameters:
 *     - name: tenant_id
 *       in: path
 *       required: true
 *       description: the id of the tenant
 *    responses:
 *      '200':
 *        description: 'Success'
 *        content :
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Task_populate'
 *      '403':
 *         description: Forbidden
 *      '404':
 *         description: No Task found
 *      '500':
 *         description: Server error
 *
 */

router.get("/tasks/:tenantid", jwt, filterAccess, async (ctx) => {
  let tasks = [];
  let validate = ObjectId.isValid(ctx.params.tenantid);
  if (!validate) return ctx.throw(404, "no bill found");
  try {
    const task = await Task.find({}).select({
      messageid: 1,
      _id: 1,
    });
    for (i = 0; i < task.length; i++) {
      const res = await Message.findOne({
        _id: task[i].messageid,
        $or: [
          { createdBy: ctx.params.tenantid },
          { sendedTo: ctx.params.tenantid },
        ],
      });
      if (res) {
        tasks.push(await Task.findOne({ messageid: res._id }));
      }
    }

    ctx.body = tasks.sort((a, b) => {
      return new Date(b.startDate) - new Date(a.startDate);
    });
  } catch (err) {
    ctx.throw(500, err);
  }
});

/**
 *  @swagger
 * /tenants/upload/{tenant_id}:
 *  put :
 *    summary : Add file to tenant
 *    operationId : addfiletenant
 *    tags :
 *        - tenant
 *    security:
 *        - bearerAuth: []
 *    parameters:
 *     - name: tenant_id
 *       in: path
 *       required: true
 *       description: the id of the tenant
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
 *        description: Tenant not found
 *      '500':
 *        description: Server error
 *
 */

router.put("/upload/:tenantid", jwt, adminAccess, async (ctx, next) => {
  let uploadedFiles = [];
  let validate = ObjectId.isValid(ctx.params.tenantid);
  if (!validate) return ctx.throw(404, "tenant not found");
  let tenantid = new ObjectId(ctx.params.tenantid);

  const tenant = await Tenant.findById(tenantid);
  if (!tenant) {
    ctx.throw(404, "tenant not found");
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
      await Tenant.findByIdAndUpdate(tenantid, {
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
 * /tenants/delete/file/{tenant_id}:
 *  put :
 *    summary : delete file from tenant
 *    operationId : deletefiletenant
 *    tags :
 *        - tenant
 *    security:
 *        - bearerAuth: []
 *    parameters:
 *     - name: tenant_id
 *       in: path
 *       required: true
 *       description: the id of the tenant
 *    requestBody :
 *     required: true
 *     content :
 *       application/json:
 *          schema:
 *            type: object
 *            properties:
 *              file:
 *                type: string
 *                example: 5fd32687e9ad210015711337
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

router.put("/delete/file/:tenantid", jwt, adminAccess, async (ctx) => {
  let validate = ObjectId.isValid(ctx.params.tenantid);
  if (!validate) return ctx.throw(404, "tenant not found");
  let tenantid = new ObjectId(ctx.params.tenantid);

  const tenant = await Tenant.findById(tenantid);
  if (!tenant) {
    ctx.throw(404, "tenant not found");
  }

  try {
    await Tenant.findByIdAndUpdate(tenantid, {
      $pull: { file: ctx.request.body.file },
    });

    ctx.body = "ok";
  } catch (err) {
    ctx.throw(500, err);
  }
});

module.exports = router;
