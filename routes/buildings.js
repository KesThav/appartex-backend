const Router = require("@koa/router");
const router = new Router({ prefix: "/buildings" });
const Building = require("../models/building.model");
const Contract = require("../models/contract.model");
const Appart = require("../models/appartment.model");
const jwt = require("../middlewares/jwt");
const adminAccess = require("../middlewares/adminAccess");
let ObjectId = require("mongodb").ObjectId;
const { buildingSchema } = require("../helpers/validation");
const Tenant = require("../models/tenant.model");

/**
 * @swagger
 *
 * components:
 *   schemas:
 *     BuildingPartial:
 *       properties:
 *         numberofAppart:
 *           type: Number
 *           example: 14
 *         adress:
 *           type: string
 *           example: Rte de Pérolles 21
 *         postalcode:
 *           type: Number
 *           minimum : 4
 *           maximum : 4
 *           example: 1700
 *         city:
 *            type: String
 *            example: Fribourg
 *       required:
 *          - adress
 *          - postalcode
 *          - city
 *     Building:
 *       properties:
 *         _id:
 *           type: id
 *           example: 5fd3275ee9ad210015711349
 *         numberofAppart:
 *           type: Number
 *           example: 14
 *         adress:
 *           type: string
 *           example: Rte de Pérolles 21
 *         postalcode:
 *           type: Number
 *           minimum : 4
 *           maximum : 4
 *           example: 1700
 *         city:
 *            type: String
 *            example: Fribourg
 *       required:
 *          - adress
 *          - postalcode
 *          - city
 *
 */

/**
 *  @swagger
 *
 *  /buildings:
 *  get :
 *    summary : Return all buildings
 *    operationId : getbuildings
 *    tags :
 *        - building
 *    security:
 *        - bearerAuth: []
 *    responses:
 *      '200':
 *        description: Success
 *        content :
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Building'
 *      '403':
 *         description: Forbidden
 *      '500':
 *         description: Server error
 *
 */

router.get("/", jwt, adminAccess, async (ctx) => {
  try {
    let allbuildings = await Building.find({
      createdBy: ctx.request.jwt._id,
    }).sort({ updatedAt: -1 });
    ctx.body = allbuildings;
  } catch (err) {
    ctx.throw(500, error);
  }
});

/**
 *  @swagger
 * /buildings/{building_id}:
 *  get :
 *    summary : Return one building
 *    operationId : getonebuilding
 *    tags :
 *        - building
 *    security:
 *        - bearerAuth: []
 *    parameters:
 *     - name: building_id
 *       in: path
 *       required: true
 *       description: the id of the building
 *    responses:
 *      '200':
 *        description: 'Success'
 *        content :
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Building'
 *      '403':
 *         description: Forbidden
 *      '404':
 *         description : Building not found
 *      '500':
 *         description: Server error
 *
 */

router.get("/:buildingid", jwt, adminAccess, async (ctx) => {
  let validate = ObjectId.isValid(ctx.params.buildingid);
  if (!validate) return ctx.throw(404, "building not found");
  try {
    let buildingid = new ObjectId(ctx.params.buildingid);
    const onebuilding = await Building.findById(buildingid).exec();
    if (!onebuilding) {
      ctx.throw(404, "Building not found");
    } else {
      ctx.body = onebuilding;
    }
  } catch (err) {
    ctx.throw(500, err);
  }
});

/**
 *  @swagger
 * /buildings/tenants/{building_id}:
 *  get :
 *    summary : Return tenants from one building
 *    operationId : gettenantsonebuilding
 *    tags :
 *        - building
 *    security:
 *        - bearerAuth: []
 *    parameters:
 *     - name: building_id
 *       in: path
 *       required: true
 *       description: the id of the building
 *    responses:
 *      '200':
 *        description: 'Success'
 *        content :
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/TenantPartial'
 *      '403':
 *         description: Forbidden
 *      '404':
 *         description : Building not found
 *      '500':
 *         description: Server error
 *
 */

router.get("/tenants/:buildingid", jwt, adminAccess, async (ctx) => {
  let tenantlist = [];
  let tenants = [];
  let validate = ObjectId.isValid(ctx.params.buildingid);
  if (!validate) return ctx.throw(404, "building not found");
  let buildingid = new ObjectId(ctx.params.buildingid);
  try {
    const appartofbuilding = await Appart.find({
      building: buildingid,
    }).select({ _id: 1 });

    for (i = 0; i < appartofbuilding.length; i++) {
      tenants.push(
        await Contract.findOne({
          appartmentid: appartofbuilding[i]._id,
          status: { $ne: "Archivé" },
        }).select({ tenant: 1, _id: 0 })
      );
    }
    tenants = tenants.filter((tenants) => tenants !== null);
    for (i = 0; i < tenants.length; i++) {
      if (tenants[i].tenant) {
        tenantlist.push(
          await Tenant.findOne({ _id: tenants[i].tenant }).select({
            id: 1,
            name: 1,
            lastname: 1,
            status: 1,
            email: 1,
            dateofbirth: 1,
            file : 1
          })
        );
      }
    }
    ctx.body = tenantlist;
  } catch (err) {
    ctx.throw(500, err);
  }
});

/**
 *  @swagger
 * /buildings/add:
 *  post :
 *    summary : Create a building
 *    operationId : createbuilding
 *    tags :
 *        - building
 *    security:
 *        - bearerAuth: []
 *    requestBody :
 *     required: true
 *     content :
 *       application/json:
 *          schema:
 *            $ref: '#/components/schemas/BuildingPartial'
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
  const { adress, postalcode, city } = ctx.request.body;
  const { error } = buildingSchema.validate(ctx.request.body);
  if (error) {
    ctx.throw(400, error);
  }

  try {
    let newbuilding = new Building({
      adress,
      postalcode,
      city,
      createdBy: new ObjectId(ctx.request.jwt._id),
    });
    await newbuilding.save();
    ctx.body = newbuilding;
  } catch (err) {
    ctx.throw(500, err);
  }
});

/**
 *  @swagger
 * /buildings/update/{building_id}:
 *  put :
 *    summary : Update a building
 *    operationId : updatebuilding
 *    tags :
 *        - building
 *    security:
 *        - bearerAuth: []
 *    parameters:
 *     - name: building_id
 *       in: path
 *       required: true
 *       description: the id of the building
 *    requestBody :
 *     required: true
 *     content :
 *       application/json:
 *          schema:
 *            $ref: '#/components/schemas/BuildingPartial'
 *    responses:
 *      '200':
 *        description: 'Success'
 *      '403':
 *        description: Forbidden
 *      '404':
 *        description: Building not found
 *      '500':
 *        description: Server error
 *
 */

router.put("/update/:buildingid", jwt, adminAccess, async (ctx) => {
  let validate = ObjectId.isValid(ctx.params.buildingid);
  if (!validate) return ctx.throw(404, "building not found");
  let buildingid = new ObjectId(ctx.params.buildingid);

  const building = await Building.findById(buildingid);
  if (building.length == 0) {
    ctx.throw(404, "building not found");
  }

  const { adress, postalcode, city } = ctx.request.body;

  const { error } = buildingSchema.validate(ctx.request.body);
  if (error) {
    ctx.throw(400, error);
  }

  const update = { adress, postalcode, city };
  try {
    const updatedbuilding = await Building.findByIdAndUpdate(
      buildingid,
      update,
      {
        new: true,
      }
    );
    ctx.body = updatedbuilding;
  } catch (err) {
    ctx.throw(500, err);
  }
});

/**
 *  @swagger
 * /buildings/delete/{building_id}:
 *  delete :
 *    summary : Delete a building
 *    operationId : deletebuilding
 *    tags :
 *        - building
 *    security:
 *        - bearerAuth: []
 *    parameters:
 *     - name: building_id
 *       in: path
 *       required: true
 *       description: the id of the building
 *    responses:
 *      '200':
 *        description: 'Success'
 *      '403':
 *        description: Forbidden
 *      '404':
 *        description: Building not found
 *      '500':
 *        description: Server error
 *
 */

router.delete("/delete/:buildingid", jwt, adminAccess, async (ctx) => {
  let validate = ObjectId.isValid(ctx.params.buildingid);
  if (!validate) return ctx.throw(404, "building not found");
  let buildingid = new ObjectId(ctx.params.buildingid);

  const building = await Building.findById(buildingid);
  if (building.length == 0) {
    ctx.throw(404, "building not found");
  }

  try {
    const appart = await Appart.find({ building: buildingid }).select({
      _id: 1,
    });
    for (i = 0; i < appart.length; i++) {
      await Contract.deleteMany({ appartmentid: appart[i]._id });
    }

    for (i = 0; appart.length; i++) {
      await Appart.findByIdAndDelete(appart[i]._id);
    }

    await Building.findByIdAndDelete(buildingid);
    ctx.body = "ok";
  } catch (err) {
    ctx.throw(500, err);
  }
});

module.exports = router;
