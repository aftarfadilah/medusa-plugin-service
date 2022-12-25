"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _express = require("express");
var _admin = _interopRequireDefault(require("./routes/admin"));
var _store = _interopRequireDefault(require("./routes/store"));
var _errorHandler = _interopRequireDefault(require("./middleware/error-handler"));
var _default = function _default(rootDirectory, options) {
  var app = (0, _express.Router)();
  (0, _admin["default"])(app, rootDirectory, options);
  (0, _store["default"])(app, rootDirectory, options);
  app.use((0, _errorHandler["default"])());
  return app;
};
exports["default"] = _default;