const Router = require("@koa/router");
const router = new Router({ prefix: "/messages" });
const Message = require("../models/message.model");
const jwt = require("../middlewares/jwt");
const adminAccess = require("../middlewares/adminAccess");
const { messageSchema } = require("../helpers/validation");
const Tenant = require("../models/tenant.model");
const Owner = require("../models/owner.model");
const Comment = require("../models/comment.model");
let ObjectId = require("mongodb").ObjectId;
const Task = require("../models/task.model");

/**
 * @swagger
 *
 * components:
 *   schemas:
 *     Message:
 *       properties:
 *         sendedTo:
 *           type: Array
 *           items : id
 *           example: 507f1f77bcf86cd799439011
 *         sendedToType:
 *           type: String
 *           enum :
 *             - "Owner"
 *             - "Tenant"
 *           summary : ajoute la ref vers le bon schema
 *         content:
 *            type: String
 *            example: Welcome to Fribourg
 *         status:
 *            type: String
 *            default: "Non lu"
 *            example: Non lu
 *         title:
 *            type: String
 *            example: Greeting
 *         createdByType:
 *            type : String
 *            enum:
 *              - "Owner"
 *              - "Tenant"
 *            summary : ajoute la ref vers le bon schema
 *         comments:
 *            type: id
 *       required:
 *          - sendedTo
 *          - sendedToType
 *          - content
 *          - title
 *          -  createdByType
 *     Message_populate:
 *       properties:
 *         sendedTo:
 *           type: Array
 *           items : id
 *           example: 507f1f77bcf86cd799439011
 *         sendedToType:
 *           type: String
 *           enum :
 *             - "Owner"
 *             - "Tenant"
 *           summary : ajoute la ref vers le bon schema
 *         content:
 *            type: String
 *            example: Welcome to Fribourg
 *         status:
 *            type: String
 *            default: "Non lu"
 *            example: Non lu
 *         title:
 *            type: String
 *            example: Greeting
 *         createdByType:
 *            type : String
 *            enum:
 *              - "Owner"
 *              - "Tenant"
 *            summary : ajoute la ref vers le bon schema
 *         comments:
 *            $ref : '#/components/schemas/Comment'
 *       required:
 *          - sendedTo
 *          - sendedToType
 *          - content
 *          - title
 *          -  createdByType
 *
 */

/**
 * @swagger
 *
 * components:
 *   schemas:
 *     CommentPartial:
 *       properties:
 *         content:
 *           type: String
 *           example: Hello World
 *         createdByType:
 *            type : String
 *            enum: ["Owner", "Tenant"]
 *            summary : ajoute la ref vers le bon schema
 *       required:
 *          - content
 *          -  createdByType
 *
 *     Comment:
 *       properties:
 *         _id:
 *           type: id
 *           example: 507f1f77bcf86cd799439011
 *         content:
 *           type: String
 *           example: Hello World
 *         createdByType:
 *            type : String
 *            enum: ["Owner", "Tenant"]
 *            summary : ajoute la ref vers le bon schema
 *       required:
 *          - content
 *          -  createdByType
 *
 */

/**
 *  @swagger
 *
 *  /messages/sended:
 *  get :
 *    summary : Return all sended messages
 *    operationId : getsendedmessages
 *    tags :
 *        - message
 *    security:
 *        - bearerAuth: []
 *    responses:
 *      '200':
 *        description: 'Success'
 *        content :
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Message_populate'
 *      '403':
 *         description: Forbidden
 *      '500':
 *         description: Server error
 *
 */

router.get("/sended", jwt, async (ctx) => {
  try {
    let allmessages = await Message.find({
      createdBy: ctx.request.jwt._id,
      status: { $ne: "Archivé" },
    })
      .populate("sendedTo", "name lastname")
      .populate("createdBy", "name lastname")
      .populate({
        path: "comments",
        populate: { path: "createdBy", select: "name lastname" },
      })
      .sort({ updatedAt: -1 });
    ctx.status = 200;
    ctx.body = allmessages;
  } catch (err) {
    ctx.throw(400, err);
  }
});

/**
 *  @swagger
 *
 *  /messages/received:
 *  get :
 *    summary : Return all received messages
 *    operationId : getreceivedmessages
 *    tags :
 *        - message
 *    security:
 *        - bearerAuth: []
 *    responses:
 *      '200':
 *        description: 'Success'
 *        content :
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Message_populate'
 *      '403':
 *         description: Forbidden
 *      '500':
 *         description: Server error
 *
 */

router.get("/received", jwt, async (ctx) => {
  try {
    let allmessages = await Message.find({
      sendedTo: ctx.request.jwt._id,
      status: { $ne: "Archivé" },
    })
      .populate("sendedTo", "name lastname")
      .populate("createdBy", "name lastname")
      .populate({
        path: "comments",
        populate: { path: "createdBy", select: "name lastname" },
      })
      .sort({ updatedAt: -1 });
    ctx.status = 200;
    ctx.body = allmessages;
  } catch (err) {
    ctx.throw(400, err);
  }
});

/**
 *  @swagger
 *
 *  /messages/archived:
 *  get :
 *    summary : Return all archive messages
 *    operationId : getarchivedmessages
 *    tags :
 *        - message
 *    security:
 *        - bearerAuth: []
 *    responses:
 *      '200':
 *        description: 'Success'
 *        content :
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Message_populate'
 *      '403':
 *         description: Forbidden
 *      '500':
 *         description: Server error
 *
 */

router.get("/archived", jwt, async (ctx) => {
  try {
    let allmessages = await Message.find({
      status: "Archivé",
    })
      .populate("sendedTo", "name lastname")
      .populate("createdBy", "name lastname")
      .populate({
        path: "comments",
        populate: { path: "createdBy", select: "name lastname" },
      })
      .sort({ updatedAt: -1 });
    ctx.status = 200;
    ctx.body = allmessages;
  } catch (err) {
    ctx.throw(400, err);
  }
});

/**
 *  @swagger
 * /messages/{message_id}:
 *  get :
 *    summary : Return one message
 *    operationId : getonemessage
 *    tags :
 *        - message
 *    security:
 *        - bearerAuth: []
 *    parameters:
 *     - name: message_id
 *       in: path
 *       required: true
 *       description: the id of the message
 *    responses:
 *      '200':
 *        description: 'Success'
 *        content :
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Message_populate'
 *      '403':
 *         description: Forbidden
 *      '404':
 *         description : Building not found
 *      '500':
 *         description: Server error
 *
 */

router.get("/:messageid", jwt, adminAccess, async (ctx) => {
  let validate = ObjectId.isValid(ctx.params.messageid);
  if (!validate) return ctx.throw(404, "message not found");
  const message = Message.findById(ctx.params.messageid);
  if (!message) {
    ctx.throw(404, "message not found");
  }

  try {
    const msg = await Message.findById(ctx.params.messageid)
      .populate("sendedTo", "name lastname")
      .populate("createdBy", "name lastname")
      .populate({
        path: "comments",
        populate: { path: "createdBy", select: "name lastname" },
      });
    ctx.body = msg;
  } catch (err) {
    ctx.throw(err);
  }
});

/**
 *  @swagger
 * /messages/add:
 *  post :
 *    summary : Create a message
 *    operationId : createmessage
 *    tags :
 *        - message
 *    security:
 *        - bearerAuth: []
 *    requestBody :
 *     required: true
 *     content :
 *       application/json:
 *          schema:
 *            $ref: '#/components/schemas/Message'
 *    responses:
 *      '200':
 *        description: 'Success'
 *      '403':
 *         description: Forbidden / Complete all fields
 *      '500':
 *         description: Server error
 *
 */

router.post("/add", jwt, async (ctx) => {
  const { error } = messageSchema.validate(ctx.request.body);
  if (error) {
    ctx.throw(400, error);
  }
  const {
    sendedTo,
    content,
    title,
    status,
    sendedToType,
    createdByType,
  } = ctx.request.body;

  if (sendedToType !== "Owner" && sendedToType !== "Tenant") {
    ctx.throw(400, "sendToType is not accepted");
  }
  if (createdByType !== "Owner" && createdByType !== "Tenant") {
    ctx.throw(400, "createdByType is not accepted");
  }

  const tenant = await Tenant.findById(sendedTo);
  const owner = await Owner.findById(sendedTo);

  if (!tenant && !owner) {
    ctx.throw(400, "recipient not found");
  }

  try {
    const newmessage = new Message({
      sendedTo,
      content,
      title,
      status,
      sendedToType,
      createdByType,
      createdBy: ctx.request.jwt._id,
    });
    await newmessage.save();
    ctx.body = "ok";
  } catch (err) {
    ctx.throw(500, err);
  }
});

/**
 *  @swagger
 * /messages/comment/add/{message_id}:
 *  post :
 *    summary : Add a comment
 *    operationId : addcomment
 *    tags :
 *        - message
 *    security:
 *        - bearerAuth: []
 *    parameters:
 *     - name: message_id
 *       in: path
 *       required: true
 *       description: the id of the contract
 *    requestBody :
 *     required: true
 *     content :
 *       application/json:
 *          schema:
 *            $ref: '#/components/schemas/CommentPartial'
 *    responses:
 *      '200':
 *        description: 'Success'
 *        content :
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Comment'
 *      '403':
 *         description: Forbidden
 *      '404':
 *         description: Contract not found
 *      '500':
 *         description: Server error
 *
 */

router.post("/comment/add/:messageid", jwt, async (ctx) => {
  let validate = ObjectId.isValid(ctx.params.messageid);
  if (!validate) return ctx.throw(404, "message not found");
  const message = Message.findById(ctx.params.messageid);
  if (!message) {
    ctx.throw(404, "message not found");
  }
  const createdByType = ctx.request.jwt.role == "Admin" ? "Owner" : "Tenant";

  try {
    const newcomment = new Comment({
      content: ctx.request.body.content,
      createdBy: ctx.request.jwt._id,
      createdByType,
    });

    const comment = await newcomment.save();

    await Message.findById(ctx.params.messageid).update({
      $push: {
        comments: comment._id,
      },
    });
    ctx.body = "ok";
  } catch (err) {
    ctx.throw(500, err);
  }
});

/**
 *  @swagger
 * /messages/archive/{message_id}:
 *  put :
 *    summary : Archive a message
 *    operationId : archivemessage
 *    tags :
 *        - message
 *    security:
 *        - bearerAuth: []
 *    parameters:
 *     - name: message_id
 *       in: path
 *       required: true
 *       description: the id of the message
 *    responses:
 *      '200':
 *        description: 'Success'
 *      '403':
 *        description: Forbidden
 *      '404':
 *        description: Message not found
 *      '500':
 *        description: Server error
 *
 */

router.put("/archive/:messageid", jwt, adminAccess, async (ctx) => {
  let validate = ObjectId.isValid(ctx.params.messageid);
  if (!validate) return ctx.throw(404, "message not found");
  const message = Message.findById(ctx.params.messageid);
  if (!message) {
    ctx.throw(404, "message not found");
  }
  try {
    await Message.findByIdAndUpdate(ctx.params.messageid, {
      status: "Archivé",
    });
    ctx.body = "ok";
  } catch (err) {
    ctx.throw(500, err);
  }
});

/**
 *  @swagger
 * /messages/unarchive/{message_id}:
 *  put :
 *    summary : Unarchive a message
 *    operationId : unarchivemessage
 *    tags :
 *        - message
 *    security:
 *        - bearerAuth: []
 *    parameters:
 *     - name: message_id
 *       in: path
 *       required: true
 *       description: the id of the message
 *    responses:
 *      '200':
 *        description: 'Success'
 *      '403':
 *        description: Forbidden
 *      '404':
 *        description: Message not found
 *      '500':
 *        description: Server error
 *
 */

router.put("/unarchive/:messageid", jwt, adminAccess, async (ctx) => {
  let validate = ObjectId.isValid(ctx.params.messageid);
  if (!validate) return ctx.throw(404, "message not found");
  const message = Message.findById(ctx.params.messageid);
  if (!message) {
    ctx.throw(404, "message not found");
  }
  try {
    await Message.findByIdAndUpdate(ctx.params.messageid, {
      status: "Terminé",
    });
    ctx.body = "ok";
  } catch (err) {
    ctx.throw(500, err);
  }
});

/**
 *  @swagger
 * /messages/update/status/{message_id}:
 *  put :
 *    summary : update message status
 *    operationId : updatemessagestatus
 *    tags :
 *        - message
 *    security:
 *        - bearerAuth: []
 *    parameters:
 *     - name: message_id
 *       in: path
 *       required: true
 *       description: the id of the message
 *    responses:
 *      '200':
 *        description: 'Success'
 *      '403':
 *        description: Forbidden
 *      '404':
 *        description: Message not found
 *      '500':
 *        description: Server error
 *
 */

router.put("/update/status/:messageid", jwt, adminAccess, async (ctx) => {
  let validate = ObjectId.isValid(ctx.params.messageid);
  if (!validate) return ctx.throw(404, "message not found");
  const message = Message.findById(ctx.params.messageid);
  if (!message) {
    ctx.throw(404, "message not found");
  }
  try {
    await Message.findByIdAndUpdate(ctx.params.messageid, {
      status: ctx.request.body.status,
    });
    ctx.body = "ok";
  } catch (err) {
    ctx.throw(500, err);
  }
});

/**
 *  @swagger
 * /messages/delete/{message_id}:
 *  delete :
 *    summary : Delete a message
 *    operationId : deletemessage
 *    tags :
 *        - message
 *    security:
 *        - bearerAuth: []
 *    parameters:
 *     - name: message_id
 *       in: path
 *       required: true
 *       description: the id of the message
 *    responses:
 *      '200':
 *        description: 'Success'
 *      '403':
 *        description: Forbidden
 *      '404':
 *        description: Message not found
 *      '500':
 *        description: Server error
 *
 */

router.delete("/delete/:messageid", jwt, async (ctx) => {
  let validate = ObjectId.isValid(ctx.params.messageid);
  if (!validate) return ctx.throw(404, "message not found");
  const message = Message.findById(ctx.params.messageid);
  if (!message) {
    ctx.throw(404, "message not found");
  }
  const task = await Task.findOne({ messageid: ctx.params.messageid });
  if (task) {
    ctx.throw(
      400,
      "message is linked to a task. Delete Task then delete message"
    );
  }

  try {
    const comments = await Message.findById(ctx.params.messageid).select({
      comments: 1,
    });
    for (i = 0; i < comments.comments.length; i++) {
      await Comment.findByIdAndDelete(comments.comments[i]);
    }
    await Message.findByIdAndDelete(ctx.params.messageid);
    ctx.body = "ok";
  } catch (err) {
    ctx.throw(500, err);
  }
});

module.exports = router;
