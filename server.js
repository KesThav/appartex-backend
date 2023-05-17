const Koa = require("koa");
const bodyParser = require("koa-bodyparser");
const Router = require("@koa/router");
const Mongoose = require("mongoose");
const router = require("./routes");
const cors = require("@koa/cors");
const json = require("koa-json");
const { koaSwagger } = require("koa2-swagger-ui");
const Swagger = require("./middlewares/swagger");
const serve = require("koa-static");

require("dotenv").config();

const app = new Koa();

const mongooseOptions = {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
};
// Connect to the MongoDB database
Mongoose.connect(process.env.DB, mongooseOptions, () =>
  console.log("connected")
);

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title:
        "Appartex : Une application de gestion pour propriétaires indépendants",
      version: "1.0.0",
      description:
        "Backend de Appartex, une application de gestion pour propriétaires indépendants",
      contact: {
        name: "Kesigan Thavarajasingam",
        email: "kesigan.thav@gmail.com",
      },
    },
  },

  apis: [
    "./routes/auth.js",
    "./routes/tenants.js",
    "./routes/buildings.js",
    "./routes/appartments.js",
    "./routes/contracts.js",
    "./routes/bills.js",
    "./routes/status.js",
    "./routes/billstatus.js",
    "./routes/messages.js",
    "./routes/tasks.js",
    "./routes/taskstatus.js",
    "./routes/repairs.js",
    "./routes/repairstatus.js",
  ],

  path: "/swagger.json",
  validatorUrl: null,
};

const swagger = Swagger(swaggerOptions);

const swaggerUi = koaSwagger({
  routePrefix: "/doc",
  swaggerOptions: {
    url: swaggerOptions.path,
    validatorUrl: null,
  },
});

const disabledPrefixes = [
  "/appartments",
  "/buildings",
  "/history",
  "/tenants",
  "/contracts",
  "/bills",
  "/status",
  "/messages",
  "/tasks",
  "/repairs",
];

const port = process.env.PORT || 5000;
app
  .use((ctx, next) => {
    if (disabledPrefixes.some((prefix) => ctx.path.startsWith(prefix))) {
      if (["POST", "PUT", "DELETE"].includes(ctx.method)) {
        ctx.status = 403;
        ctx.body = { message: "Method disabled" };
        return;
      }
    }
    return next();
  })
  .use(swagger)
  .use(swaggerUi)
  .use(cors())
  .use(bodyParser())
  .use(json())
  .use(router())
  .use(serve("./public"))
  .listen(port, () => console.log(`listen on port ${port}`));
