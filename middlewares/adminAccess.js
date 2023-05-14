module.exports = async (ctx, next) => {
  if (!ctx.request.jwt) ctx.throw(403, "No token.");
  const { role } = ctx.request.jwt;

  if (role !== "Admin") ctx.throw(403, "Access Forbidden");

  await next();
};
