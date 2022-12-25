"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _typeof = require("@babel/runtime/helpers/typeof");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _express = require("express");
var bodyParser = _interopRequireWildcard(require("body-parser"));
var _cors = _interopRequireDefault(require("cors"));
var _medusaCoreUtils = require("medusa-core-utils");
var _authenticate = _interopRequireDefault(require("@medusajs/medusa/dist/api/middlewares/authenticate"));
var _services = _interopRequireDefault(require("./services"));
var _products = _interopRequireDefault(require("./products"));
var _locations = _interopRequireDefault(require("./locations"));
var _companies = _interopRequireDefault(require("./companies"));
var _calendars = _interopRequireDefault(require("./calendars"));
var _appointments = _interopRequireDefault(require("./appointments"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
var route = (0, _express.Router)();
var _default = function _default(app, rootDirectory, config) {
  app.use("/admin/ms", route);
  var _getConfigFile = (0, _medusaCoreUtils.getConfigFile)(rootDirectory, "medusa-config"),
    configModule = _getConfigFile.configModule;
  var projectConfig = configModule.projectConfig;
  var corsOptions = {
    origin: projectConfig.admin_cors.split(","),
    credentials: true
  };
  route.use(bodyParser.json());
  route.use((0, _cors["default"])(corsOptions));
  route.use((0, _authenticate["default"])());
  (0, _services["default"])(route);
  (0, _products["default"])(route);
  (0, _locations["default"])(route);
  (0, _companies["default"])(route);
  (0, _calendars["default"])(route);
  (0, _appointments["default"])(route);
  return app;
};
exports["default"] = _default;