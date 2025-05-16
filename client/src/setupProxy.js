const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Simply proxy everything to the backend without rewriting paths
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5002',
      changeOrigin: true
    })
  );
};
