const transformHandler = (action) => {
  return async (req, res, next) => {
    try {
      const result = await action(req);
      if (!result) {
        return res.sendStatus(204);
      }
      res.status(200).send(result);
    } catch (err) {
      next(err);
    }
  };
};

const transformMiddleware = (action) => {
  return async (...args) => {
    const next = args[args.length - 1];
    try {
      await action(...args);
      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = (app) => {
  const methods = ['use', 'all', 'get', 'post', 'patch', 'put', 'delete'];

  const handler = app;
  handler.error = handler.use;

  methods.forEach((method) => {
    const origFunction = handler[method];

    handler[method] = function(...args) {
      const func = origFunction.bind(this);
      const [path, ...actions] = args;
      const [action, ...middlewares] = actions.reverse();

      if (path instanceof Function) {
        return func(transformMiddleware(path));
      }

      if (action instanceof Function) {
        if (!middlewares.length) {
          return func(path, transformHandler(action));
        }

        return func(path, ...[...middlewares.map(transformMiddleware), transformHandler(action)]);
      }

      return func(...args);
    };
  });

  return handler;
};
