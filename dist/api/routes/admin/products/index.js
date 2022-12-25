"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
var _exportNames = {};
exports["default"] = void 0;
var _express = require("express");
var _middleware = _interopRequireDefault(require("../../../middleware"));
var _listProduct = require("./list-product");
Object.keys(_listProduct).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _listProduct[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _listProduct[key];
    }
  });
});
var route = (0, _express.Router)();
var _default = function _default(app) {
  app.use("/products", route);
  route.get("/", _middleware["default"].wrap(require("./list-product")["default"]));
  return app;
};
exports["default"] = _default;