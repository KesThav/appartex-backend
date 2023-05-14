module.exports = async (ctx, next) => {
  if (!ctx.request.jwt) ctx.throw(403, "No token.");
  const { role, _id } = ctx.request.jwt;
  const { tenantid } = ctx.request.params;

  if (tenantid !== _id && role !== "Admin") ctx.throw(403, "Access Forbidden");

  await next();
};
