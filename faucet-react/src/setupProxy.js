const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/increment', // Path that needs to be proxied to the backend
    createProxyMiddleware({
      target: 'http://103.209.145.177:3999/increment', // Backend server (your Express app)
      changeOrigin: true, // Ensures frontend IP is seen in backend
      secure: false, // Disable SSL verification (if needed)
      })
  );
};