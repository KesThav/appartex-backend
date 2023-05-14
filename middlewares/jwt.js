const jwt = require("jsonwebtoken");

module.exports = async (ctx, next) => {
  if (!ctx.headers["authorization"]) ctx.throw(403, "No token.");

  const token = ctx.headers.authorization.split(" ")[1];

  try {
    ctx.request.jwt = jwt.verify(token, process.env.TOKEN_SECRET);
  } catch (err) {
    ctx.throw(403, err);
  }

  await next();
};
