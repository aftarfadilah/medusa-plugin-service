"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
var _exportNames = {};
exports["default"] = void 0;
var _express = require("express");
var _middleware = _interopRequireDefault(require("../../../middleware"));
var _createService = require("./create-service");
Object.keys(_createService).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _createService[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _createService[key];
    }
  });
});
var _updateService = require("./update-service");
Object.keys(_updateService).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _updateService[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _updateService[key];
    }
  });
});
var _deleteService = require("./delete-service");
Object.keys(_deleteService).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _deleteService[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _deleteService[key];
    }
  });
});
var _listService = require("./list-service");
Object.keys(_listService).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _listService[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _listService[key];
    }
  });
});
var _getService = require("./get-service");
Object.keys(_getService).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _getService[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _getService[key];
    }
  });
});
var route = (0, _express.Router)();
var _default = function _default(app) {
  app.use("/services", route);
  route.post("/", _middleware["default"].wrap(require("./create-service")["default"]));
  route.get("/", _middleware["default"].wrap(require("./list-service")["default"]));
  route.get("/:id", _middleware["default"].wrap(require("./get-service")["default"]));
  route.put("/:id", _middleware["default"].wrap(require("./update-service")["default"]));
  route["delete"]("/:id", _middleware["default"].wrap(require("./delete-service")["default"]));
  return app;
};
exports["default"] = _default;