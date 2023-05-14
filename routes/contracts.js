const Router = require("@koa/router");
const router = new Router({ prefix: "/contracts" });
const Contract = require("../models/contract.model");
const jwt = require("../middlewares/jwt");
const adminAccess = require("../middlewares/adminAccess");
let ObjectId = require("mongodb").ObjectId;
const contractValidation = require("../helpers/contractValidation");
const Appart = require("../models/appartment.model");
const Building = require("../models/building.model");
const multer = require("@koa/multer");
const path = require("path");
const fs = require("fs");
const { contractSchema } = require("../helpers/validation");
const File = require("../models/file.model");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/contract");
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
 *     Contract:
 *       properties:
 *         charge:
 *           type: Number
 *           example: 1750
 *         rent:
 *            type: Number
 *            example: 457
 *         tenant:
 *            type: id
 *            example: 507f1f77bcf86cd799439011
 *         appartmentid:
 *            type: id
 *            example: 5f954d4c94a4981bc4284277
 *         other:
 *            type: String
 *            example: Two rent paid in advance
 *         status:
 *            type: String
 *            example: Actif
 *            default : Actif
 *         file:
 *            type: id
 *            example : 5f954d4c94a4981bc4284277
 *       required:
 *          - charge
 *          - rent
 *          - tenant
 *     Contract_populate:
 *       properties:
 *         _id:
 *           type: id
 *           example: 5fd3275ee9ad210015711349
 *         charge:
 *           type: Number
 *           example: 1750
 *         rent:
 *            type: Number
 *            example: 457
 *         tenant:
 *            $ref : '#/components/schemas/TenantPartial'
 *         appartmentid:
 *            $ref : '#/components/schemas/Appartment_populate'
 *         other:
 *            type: String
 *            example: Two rent paid in advance
 *         status:
 *            type: String
 *            example: Actif
 *            default : Actif
 *         file:
 *            $ref: '#/components/schemas/File'
 *       required:
 *          - charge
 *          - rent
 *          - tenant
 *
 */

/**
 *  @swagger
 *
 *  /contracts:
 *  get :
 *    summary : Return all contracts
 *    operationId : getcontracts
 *    tags :
 *        - contract
 *    security:
 *        - bearerAuth: []
 *    responses:
 *      '200':
 *        description: 'Success'
 *        content :
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Contract_populate'
 *      '403':
 *         description: Forbidden
 *      '500':
 *         description: Server error
 *
 */

router.get("/", jwt, adminAccess, async (ctx) => {
  try {
    let allcontracts = await Contract.find({ createdBy: ctx.request.jwt._id })
      .populate("tenant")
      .populate({ path: "appartmentid", populate: { path: "building" } })
      .sort({ updatedAt: -1 });
    ctx.body = allcontracts;
  } catch (err) {
    ctx.throw(err);
  }
});

/**
 *  @swagger
 * /contracts/{contract_id}:
 *  get :
 *    summary : Return one contract
 *    operationId : getonecontract
 *    tags :
 *        - contract
 *    security:
 *        - bearerAuth: []
 *    parameters:
 *     - name: contract_id
 *       in: path
 *       required: true
 *       description: the id of the contract
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
 *         description: Contract not found
 *      '500':
 *         description: Server error
 *
 */

router.get("/:contractid", jwt, adminAccess, async (ctx) => {
  let validate = ObjectId.isValid(ctx.params.contractid);
  if (!validate) return ctx.throw(404, "contract not found");
  try {
    let contractid = new ObjectId(ctx.params.contractid);
    const onecontract = await Contract.findById(contractid)
      .populate("tenant")
      .populate("file")
      .populate({ path: "appartmentid", populate: { path: "building" } });
    if (!onecontract) {
      ctx.throw(404, "contract not found");
    } else {
      ctx.body = onecontract;
    }
  } catch (err) {
    ctx.throw(500, err);
  }
});

/**
 *  @swagger
 * /contracts/add:
 *  post :
 *    summary : Create a contract
 *    operationId : createcontract
 *    tags :
 *        - contract
 *    security:
 *        - bearerAuth: []
 *    requestBody :
 *     required: true
 *     content :
 *       application/json:
 *          schema:
 *            $ref: '#/components/schemas/Contract'
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
  const { charge, rent, tenant, appartmentid, other } = ctx.request.body;

  const { error } = contractSchema.validate(ctx.request.body);
  if (error) {
    ctx.throw(400, error);
  }
  try {
    let newcontract = new Contract({
      charge,
      rent,
      tenant,
      appartmentid,
      other,
      createdBy: new ObjectId(ctx.request.jwt._id),
    });

    await Appart.findByIdAndUpdate(appartmentid, { status: "Occupé" });

    const appart = await Appart.findById(appartmentid);
    if (appart.building) {
      await Building.findByIdAndUpdate(appart.building, {
        $inc: { counter: 1 },
      });
    }

    await newcontract.save();
    ctx.body = newcontract;
  } catch (err) {
    ctx.throw(500, err);
  }
});

/**
 *  @swagger
 * /contracts/update/{contract_id}:
 *  put :
 *    summary : Update a contract
 *    operationId : updatecontract
 *    tags :
 *        - contract
 *    security:
 *        - bearerAuth: []
 *    parameters:
 *     - name: contract_id
 *       in: path
 *       required: true
 *       description: the id of the contract
 *    requestBody :
 *     required: true
 *     content :
 *       application/json:
 *          schema:
 *            $ref: '#/components/schemas/Contract'
 *    responses:
 *      '200':
 *        description: 'Success'
 *      '403':
 *        description: Forbidden
 *      '404':
 *        description: Contract not found
 *      '500':
 *        description: Server error
 *
 */

router.put(
  "/update/:contractid",
  jwt,
  adminAccess,
  contractValidation,
  async (ctx) => {
    let contractid = new ObjectId(ctx.params.contractid);

    const contract = await Contract.findById(contractid);
    if (!contract) {
      ctx.throw(404, "contract not found");
    }

    const { charge, rent, tenant, appartmentid, other } = ctx.request.body;

    if (contract.appartmentid.status == "Occupé") {
      if (appartmentid !== contract.appartmentid) {
        ctx.throw(400, "appartment is already taken");
      }
    }
    console.log(appartmentid != contract.appartmentid);

    if (appartmentid != contract.appartmentid) {
      ctx.throw(400, "can't modify appartment, create a new contract");
    }

    const update = { charge, rent, tenant, appartmentid, other };
    try {
      const updatedcontract = await Contract.findByIdAndUpdate(
        contractid,
        update,
        {
          new: true,
        }
      );
      ctx.body = updatedcontract;
    } catch (err) {
      ctx.throw(500, err);
    }
  }
);

/**
 *  @swagger
 * /contracts/archive/{contract_id}:
 *  put :
 *    summary : Archive a contract
 *    operationId : archivecontract
 *    tags :
 *        - contract
 *    security:
 *        - bearerAuth: []
 *    parameters:
 *     - name: contract_id
 *       in: path
 *       required: true
 *       description: the id of the contract
 *    responses:
 *      '200':
 *        description: 'Success'
 *      '403':
 *        description: Forbidden
 *      '404':
 *        description: Contract not found
 *      '500':
 *        description: Server error
 *
 */

router.put("/archive/:contractid", jwt, adminAccess, async (ctx) => {
  let validate = ObjectId.isValid(ctx.params.contractid);
  if (!validate) return ctx.throw(404, "contract not found");
  const contractid = new ObjectId(ctx.params.contractid);
  const contract = await Contract.findById(contractid);
  if (!contract) return ctx.throw(404, "contract not found");

  try {
    await Appart.findByIdAndUpdate(contract.appartmentid, { status: "Libre" });

    const buildingid = await Appart.findById(contract.appartmentid).select({
      building: 1,
      _id: 0,
    });

    await Building.findByIdAndUpdate(buildingid.building, {
      $inc: { counter: -1 },
    });

    await Contract.findByIdAndUpdate(contractid, { status: "Archivé" });

    ctx.body = "ok";
  } catch (err) {
    ctx.throw(err);
  }
});

/**
 *  @swagger
 * /contracts/delete/{contract_id}:
 *  delete :
 *    summary : Delete a contract
 *    operationId : deletecontract
 *    tags :
 *        - contract
 *    security:
 *        - bearerAuth: []
 *    parameters:
 *     - name: contract_id
 *       in: path
 *       required: true
 *       description: the id of the contract
 *    responses:
 *      '200':
 *        description: 'Success'
 *      '403':
 *        description: Forbidden
 *      '404':
 *        description: Contract not found
 *      '500':
 *        description: Server error
 *
 */

router.delete("/delete/:contractid", jwt, adminAccess, async (ctx) => {
  let validate = ObjectId.isValid(ctx.params.contractid);
  if (!validate) return ctx.throw(404, "contract not found");
  const contractid = new ObjectId(ctx.params.contractid);
  const contract = await Contract.findById(contractid);
  if (!contract) return ctx.throw(404, "contract not found");

  try {
    const status = await Contract.findById(contractid).select({ status: 1 });
    if (status.status !== "Archivé") {
      await Appart.findByIdAndUpdate(contract.appartmentid, {
        status: "Libre",
      });

      const buildingid = await Appart.findById(contract.appartmentid).select({
        building: 1,
        _id: 0,
      });

      await Building.findByIdAndUpdate(buildingid.building, {
        $inc: { counter: -1 },
      });

      await Contract.findByIdAndDelete(contractid);
    } else {
      await Contract.findByIdAndDelete(contractid);
    }

    ctx.body = "ok";
  } catch (err) {
    ctx.throw(err);
  }
});

/**
 *  @swagger
 * /contracts/upload/{contract_id}:
 *  put :
 *    summary : Add file to contract
 *    operationId : addfilecontract
 *    tags :
 *        - contract
 *    security:
 *        - bearerAuth: []
 *    parameters:
 *     - name: contract_id
 *       in: path
 *       required: true
 *       description: the id of the contract
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
 *        description: Contract not found
 *      '500':
 *        description: Server error
 *
 */

router.put("/upload/:contractid", jwt, adminAccess, async (ctx, next) => {
  let uploadedFiles = [];
  let validate = ObjectId.isValid(ctx.params.contractid);
  if (!validate) return ctx.throw(404, "contract not found");
  let contractid = new ObjectId(ctx.params.contractid);

  const contract = await Contract.findById(contractid);
  if (!contract) {
    ctx.throw(404, "contract not found");
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
      await Contract.findByIdAndUpdate(contractid, {
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
 * /contracts/delete/file/{contract_id}:
 *  put :
 *    summary : delete file from contract
 *    operationId : deletefilecontract
 *    tags :
 *        - contract
 *    security:
 *        - bearerAuth: []
 *    parameters:
 *     - name: contract_id
 *       in: path
 *       required: true
 *       description: the id of the contract
 *    requestBody :
 *     required: true
 *     content :
 *       application/json:
 *          schema:
 *            type: object
 *            properties:
 *              file:
 *                type: string
 *                example: 5fd506d5900bbc0ac0d2d863
 *            required:
 *              - file
 *    responses:
 *      '200':
 *        description: 'Success'
 *      '403':
 *        description: Forbidden
 *      '404':
 *        description: Contract not found
 *      '500':
 *        description: Server error
 *
 */

router.put("/delete/file/:contractid", jwt, adminAccess, async (ctx) => {
  let validate = ObjectId.isValid(ctx.params.contractid);
  if (!validate) return ctx.throw(404, "contract not found");
  let contractid = new ObjectId(ctx.params.contractid);

  const contract = await Contract.findById(contractid);
  if (!contract) {
    ctx.throw(404, "contract not found");
  }

  try {
    await Contract.findByIdAndUpdate(contractid, {
      $pull: { file: ctx.request.body.file },
    });
    await File.findByIdAndDelete(ctx.request.body.file);
    ctx.body = "ok";
  } catch (err) {
    ctx.throw(500, err);
  }
});

module.exports = router;
