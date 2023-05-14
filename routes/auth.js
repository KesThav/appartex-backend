const Router = require("@koa/router");
const router = new Router({ prefix: "/auth" });
const Owner = require("../models/owner.model");
const Tenant = require("../models/tenant.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { userSchema, loginSchema } = require("../helpers/validation");

/**
 * @swagger
 *
 * components:
 *   schemas:
 *     Owner:
 *       properties:
 *         name:
 *           type: String
 *           example: Jean
 *         lastname:
 *           type: string
 *           example: Paul
 *         email:
 *           type: String
 *           example: Jean@paul.com
 *         password:
 *            type: String
 *            minimum: 6
 *            example: 1a3b5c
 *       required:
 *          - name
 *          - lastname
 *          - email
 *          - password
 *
 */

/**
 * @swagger
 *
 * components:
 *   schemas:
 *     Login:
 *       properties:
 *         email:
 *           type: String
 *           example: Jean@paul.com
 *         password:
 *            type: String
 *            minimum: 6
 *            example: 1a3b5c
 *       required:
 *          - name
 *          - lastname
 *          - email
 *          - password
 *
 */

/**
 * @swagger
 *
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 */

/**
 *  @swagger
 * /auth/register:
 *  post :
 *    summary : Register as owner
 *    operationId : register
 *    tags :
 *        - auth
 *    requestBody :
 *     required: true
 *     content :
 *       application/json:
 *          schema:
 *            $ref: '#/components/schemas/Owner'
 *    responses:
 *      '200':
 *        description: 'Success'
 *      '400':
 *         description: Field missing
 *      '500':
 *         description: Server error
 *
 */

router.post("/register", async (ctx) => {
  const { name, lastname, email, password } = ctx.request.body;

  const emailExist = await Owner.find({ email });
  if (emailExist.length !== 0) {
    ctx.throw(400, `Email already exist`);
  }

  const { error } = userSchema.validate(ctx.request.body);
  if (error) {
    ctx.throw(400, error);
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  try {
    let newowner = new Owner({
      name,
      lastname,
      email,
      password: hashedPassword,
    });
    await newowner.save();
    ctx.body = newowner;
  } catch (err) {
    if (err instanceof JoiError) {
      ctx.throw(400, err);
    } else {
      ctx.throw(500, err);
    }
  }
});

/**
 *  @swagger
 * /auth/login:
 *  post :
 *    summary : Login as owner
 *    operationId : login
 *    tags :
 *        - auth
 *    requestBody :
 *     required: true
 *     content :
 *       application/json:
 *          schema:
 *            $ref: '#/components/schemas/Login'
 *    responses:
 *      '200':
 *        description: 'Success'
 *      '400':
 *         description: Field missing
 *      '404':
 *         description: Wrong credentials
 *      '500':
 *         description: Server error
 *
 */

router.post("/login", async (ctx) => {
  const { email, password } = ctx.request.body;

  const { error } = loginSchema.validate(ctx.request.body);
  if (error) {
    ctx.throw(400, error);
  }

  const user = await Owner.findOne({ email: email });
  if (!user) {
    ctx.throw(404, "Wrong Credentials");
  }
  const validPass = await bcrypt.compare(password, user.password);
  if (!validPass) {
    ctx.throw(404, "Wrong Credentials");
  }

  try {
    const token = jwt.sign(
      {
        _id: user._id,
        name: user.name,
        lastname: user.lastname,
        email: user.email,
        role: user.role,
      },
      process.env.TOKEN_SECRET
    );
    ctx.body = token;
  } catch (err) {
    ctx.throw(401, "Authentification Failed");
  }
});

/**
 *  @swagger
 * /auth/tenant/login:
 *  post :
 *    summary : Login as tenant
 *    operationId : loginastenant
 *    tags :
 *        - auth
 *    requestBody :
 *     required: true
 *     content :
 *       application/json:
 *          schema:
 *            $ref: '#/components/schemas/Login'
 *    responses:
 *      '200':
 *        description: 'Success'
 *      '400':
 *         description: Field missing
 *      '404':
 *         description: Wrong credentials
 *      '500':
 *         description: Server error
 *
 */

router.post("/tenant/login", async (ctx) => {
  const { email, password } = ctx.request.body;

  const { error } = loginSchema.validate(ctx.request.body);
  if (error) {
    ctx.throw(400, error);
  }

  const user = await Tenant.findOne({ email: email });
  if (!user) {
    ctx.throw(400, "Wrong Credentials");
  }
  if (user) {
    if (user.status == "Inactif") {
      ctx.throw(400, "le compte est désactivé");
    }
  }
  const validPass = await bcrypt.compare(password, user.password);
  if (!validPass) {
    ctx.throw(404, "Wrong Credentials");
  }

  try {
    const token = jwt.sign(
      {
        _id: user._id,
        name: user.name,
        lastname: user.lastname,
        email: user.email,
        dateofbirth: user.dateofbirth,
        role: user.role,
        createdBy: user.createdBy,
      },
      process.env.TOKEN_SECRET
    );
    ctx.body = token;
  } catch (err) {
    ctx.throw(401, "Authentification Failed");
  }
});

module.exports = router;
