"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _medusaInterfaces = require("medusa-interfaces");
var _typeorm = require("typeorm");
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var ServiceHandlerService = /*#__PURE__*/function (_BaseService) {
  (0, _inherits2["default"])(ServiceHandlerService, _BaseService);
  var _super = _createSuper(ServiceHandlerService);
  function ServiceHandlerService(_ref, options) {
    var _this;
    var manager = _ref.manager,
      productService = _ref.productService,
      productRepository = _ref.productRepository,
      shippingProfileService = _ref.shippingProfileService;
    (0, _classCallCheck2["default"])(this, ServiceHandlerService);
    _this = _super.call(this);
    _this.manager_ = manager;
    _this.productService_ = productService;
    _this.shippingProfileService_ = shippingProfileService;
    _this.productRepository_ = productRepository;
    _this.typeName = options.serviceName || "Service";
    _this.defaultSelection = ["created_at", "status", "thumbnail", "updated_at", "deleted_at", "title", "type", "type_id", "id", "subtitle", "description", "handle", "metadata"];
    _this.defaultRelation = ["type"];
    _this.options = options;
    return _this;
  }

  //TODO Create new product variant which is a service
  (0, _createClass2["default"])(ServiceHandlerService, [{
    key: "create",
    value: function () {
      var _create = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(req, res) {
        var _this2 = this;
        var _req$body, title, handle, metadata, entityManager, newProduct, product;
        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _req$body = req.body, title = _req$body.title, handle = _req$body.handle;
                metadata = {
                  products: []
                };
                entityManager = req.scope.resolve("manager");
                _context2.next = 5;
                return entityManager.transaction( /*#__PURE__*/function () {
                  var _ref2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(manager) {
                    var shippingProfile, newProduct;
                    return _regenerator["default"].wrap(function _callee$(_context) {
                      while (1) {
                        switch (_context.prev = _context.next) {
                          case 0:
                            _context.next = 2;
                            return _this2.shippingProfileService_.withTransaction(manager).retrieveDefault();
                          case 2:
                            shippingProfile = _context.sent;
                            _context.next = 5;
                            return _this2.productService_.withTransaction(manager).create({
                              title: title,
                              handle: handle,
                              metadata: metadata,
                              profile_id: shippingProfile.id,
                              type: {
                                value: _this2.typeName
                              }
                            });
                          case 5:
                            newProduct = _context.sent;
                            return _context.abrupt("return", newProduct);
                          case 7:
                          case "end":
                            return _context.stop();
                        }
                      }
                    }, _callee);
                  }));
                  return function (_x3) {
                    return _ref2.apply(this, arguments);
                  };
                }());
              case 5:
                newProduct = _context2.sent;
                _context2.next = 8;
                return this.productService_.retrieve(newProduct.id, {
                  relations: this.defaultRelation
                });
              case 8:
                product = _context2.sent;
                return _context2.abrupt("return", product);
              case 10:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));
      function create(_x, _x2) {
        return _create.apply(this, arguments);
      }
      return create;
    }() //TODO auto remove product, if product id not exist
  }, {
    key: "filteringExistProduct",
    value: function () {
      var _filteringExistProduct = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3(service_id, val, detailProduct) {
        var productIdList, productDetailList, productIdFilteredList, _iterator, _step, x, getProduct;
        return _regenerator["default"].wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                if (Array.isArray(val)) {
                  _context3.next = 2;
                  break;
                }
                return _context3.abrupt("return");
              case 2:
                productIdList = val.filter(function (item, index) {
                  return val.indexOf(item) === index;
                }); // remove duplicate id
                productDetailList = [];
                productIdFilteredList = [];
                if (!(productIdList.length > 0)) {
                  _context3.next = 31;
                  break;
                }
                _iterator = _createForOfIteratorHelper(productIdList);
                _context3.prev = 7;
                _iterator.s();
              case 9:
                if ((_step = _iterator.n()).done) {
                  _context3.next = 23;
                  break;
                }
                x = _step.value;
                _context3.prev = 11;
                _context3.next = 14;
                return this.productService_.retrieve(x);
              case 14:
                getProduct = _context3.sent;
                if (detailProduct) {
                  productDetailList.push(getProduct);
                }
                productIdFilteredList.push(x);
                _context3.next = 21;
                break;
              case 19:
                _context3.prev = 19;
                _context3.t0 = _context3["catch"](11);
              case 21:
                _context3.next = 9;
                break;
              case 23:
                _context3.next = 28;
                break;
              case 25:
                _context3.prev = 25;
                _context3.t1 = _context3["catch"](7);
                _iterator.e(_context3.t1);
              case 28:
                _context3.prev = 28;
                _iterator.f();
                return _context3.finish(28);
              case 31:
                if (!(productIdFilteredList.length != productIdList.length)) {
                  _context3.next = 34;
                  break;
                }
                _context3.next = 34;
                return this.productService_.update(service_id, {
                  metadata: {
                    products: productIdFilteredList
                  }
                });
              case 34:
                if (!detailProduct) {
                  _context3.next = 36;
                  break;
                }
                return _context3.abrupt("return", productDetailList);
              case 36:
                return _context3.abrupt("return", productIdFilteredList);
              case 37:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this, [[7, 25, 28, 31], [11, 19]]);
      }));
      function filteringExistProduct(_x4, _x5, _x6) {
        return _filteringExistProduct.apply(this, arguments);
      }
      return filteringExistProduct;
    }()
  }, {
    key: "filterQuery",
    value: function filterQuery(config) {
      if (!(config !== null && config !== void 0 && config.limit)) {
        config.limit = 15;
      } else {
        config.limit = parseInt(config.limit);
      }
      if (!(config !== null && config !== void 0 && config.offset)) {
        config.offset = 0;
      } else {
        config.offset = parseInt(config.offset);
      }
      if (!(config !== null && config !== void 0 && config.q)) {
        config.q = "";
      }
      if (!(config !== null && config !== void 0 && config.showProductDetail)) {
        config.showProductDetail = true;
      } else {
        if (parseInt(config.showProductDetail) == 0) {
          config.showProductDetail = false;
        } else {
          config.showProductDetail = true;
        }
      }
      return config;
    }

    //TODO Get all products which are services
  }, {
    key: "list",
    value: function () {
      var _list = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4(req, res) {
        var _this$filterQuery, limit, offset, q, showProductDetail, _yield$this$listAndCo, services, count, _iterator2, _step2, _service$metadata, _service$metadata$pro, service, productList;
        return _regenerator["default"].wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _this$filterQuery = this.filterQuery(req.query), limit = _this$filterQuery.limit, offset = _this$filterQuery.offset, q = _this$filterQuery.q, showProductDetail = _this$filterQuery.showProductDetail;
                _context4.next = 3;
                return this.listAndCount({
                  limit: limit,
                  offset: offset,
                  q: q
                });
              case 3:
                _yield$this$listAndCo = _context4.sent;
                services = _yield$this$listAndCo.services;
                count = _yield$this$listAndCo.count;
                _iterator2 = _createForOfIteratorHelper(services);
                _context4.prev = 7;
                _iterator2.s();
              case 9:
                if ((_step2 = _iterator2.n()).done) {
                  _context4.next = 19;
                  break;
                }
                service = _step2.value;
                if (!(((_service$metadata = service.metadata) === null || _service$metadata === void 0 ? void 0 : (_service$metadata$pro = _service$metadata.products) === null || _service$metadata$pro === void 0 ? void 0 : _service$metadata$pro.length) > 0)) {
                  _context4.next = 16;
                  break;
                }
                _context4.next = 14;
                return this.filteringExistProduct(service.id, service.metadata.products, showProductDetail);
              case 14:
                productList = _context4.sent;
                service.products = productList;
              case 16:
                delete service.metadata;
              case 17:
                _context4.next = 9;
                break;
              case 19:
                _context4.next = 24;
                break;
              case 21:
                _context4.prev = 21;
                _context4.t0 = _context4["catch"](7);
                _iterator2.e(_context4.t0);
              case 24:
                _context4.prev = 24;
                _iterator2.f();
                return _context4.finish(24);
              case 27:
                return _context4.abrupt("return", {
                  services: services,
                  count: count,
                  limit: limit,
                  offset: offset
                });
              case 28:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this, [[7, 21, 24, 27]]);
      }));
      function list(_x7, _x8) {
        return _list.apply(this, arguments);
      }
      return list;
    }()
  }, {
    key: "listAndCount",
    value: function () {
      var _listAndCount = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee5(config) {
        var manager, productRepo, _yield$productRepo$fi, _yield$productRepo$fi2, services, count;
        return _regenerator["default"].wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                manager = this.manager_;
                productRepo = manager.getCustomRepository(this.productRepository_);
                _context5.next = 4;
                return productRepo.findAndCount({
                  relations: this.defaultRelation,
                  select: this.defaultSelection,
                  where: {
                    type: {
                      value: this.typeName
                    },
                    title: (0, _typeorm.ILike)("%".concat(config.q, "%"))
                  },
                  take: config.limit,
                  skip: config.offset
                });
              case 4:
                _yield$productRepo$fi = _context5.sent;
                _yield$productRepo$fi2 = (0, _slicedToArray2["default"])(_yield$productRepo$fi, 2);
                services = _yield$productRepo$fi2[0];
                count = _yield$productRepo$fi2[1];
                return _context5.abrupt("return", {
                  services: services,
                  count: count
                });
              case 9:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));
      function listAndCount(_x9) {
        return _listAndCount.apply(this, arguments);
      }
      return listAndCount;
    }()
  }, {
    key: "get",
    value: function () {
      var _get = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee6(req, res) {
        var id, _this$filterQuery2, showProductDetail, _yield$this$productSe, _yield$this$productSe2, services, _iterator3, _step3, _service$metadata2, _service$metadata2$pr, service, productList;
        return _regenerator["default"].wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                id = req.params.id;
                _this$filterQuery2 = this.filterQuery(req.query), showProductDetail = _this$filterQuery2.showProductDetail;
                _context6.next = 4;
                return this.productService_.listAndCount({
                  id: id
                }, {
                  select: this.defaultSelection
                });
              case 4:
                _yield$this$productSe = _context6.sent;
                _yield$this$productSe2 = (0, _slicedToArray2["default"])(_yield$this$productSe, 1);
                services = _yield$this$productSe2[0];
                _iterator3 = _createForOfIteratorHelper(services);
                _context6.prev = 8;
                _iterator3.s();
              case 10:
                if ((_step3 = _iterator3.n()).done) {
                  _context6.next = 21;
                  break;
                }
                service = _step3.value;
                if (!(((_service$metadata2 = service.metadata) === null || _service$metadata2 === void 0 ? void 0 : (_service$metadata2$pr = _service$metadata2.products) === null || _service$metadata2$pr === void 0 ? void 0 : _service$metadata2$pr.length) > 0)) {
                  _context6.next = 17;
                  break;
                }
                _context6.next = 15;
                return this.filteringExistProduct(service.id, service.metadata.products, showProductDetail);
              case 15:
                productList = _context6.sent;
                service.products = productList;
              case 17:
                delete service.metadata;
                return _context6.abrupt("return", service);
              case 19:
                _context6.next = 10;
                break;
              case 21:
                _context6.next = 26;
                break;
              case 23:
                _context6.prev = 23;
                _context6.t0 = _context6["catch"](8);
                _iterator3.e(_context6.t0);
              case 26:
                _context6.prev = 26;
                _iterator3.f();
                return _context6.finish(26);
              case 29:
                return _context6.abrupt("return", {
                  message: "service id not found :("
                });
              case 30:
              case "end":
                return _context6.stop();
            }
          }
        }, _callee6, this, [[8, 23, 26, 29]]);
      }));
      function get(_x10, _x11) {
        return _get.apply(this, arguments);
      }
      return get;
    }() //TODO Update service based on specific id
  }, {
    key: "update",
    value: function () {
      var _update = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee7(req, res) {
        var _serviceData$type;
        var id, products, serviceData, fieldList, updateDataQuery, _i, _fieldList, field, productList, updateProduct;
        return _regenerator["default"].wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                id = req.params.id;
                products = req.body.products;
                _context7.next = 4;
                return this.productService_.retrieve(id, {
                  relations: this.defaultRelation
                });
              case 4:
                serviceData = _context7.sent;
                if (!(serviceData.type == null || ((_serviceData$type = serviceData.type) === null || _serviceData$type === void 0 ? void 0 : _serviceData$type.value) != this.typeName)) {
                  _context7.next = 7;
                  break;
                }
                return _context7.abrupt("return", {
                  message: "sorry this item is not service :("
                });
              case 7:
                fieldList = ["title", "subtitle", "handle", "status", "description", "subtitle"];
                updateDataQuery = {};
                for (_i = 0, _fieldList = fieldList; _i < _fieldList.length; _i++) {
                  field = _fieldList[_i];
                  if (req.body[field]) {
                    updateDataQuery = _objectSpread((0, _defineProperty2["default"])({}, field, req.body[field]), updateDataQuery);
                  }
                }
                if (!products) {
                  _context7.next = 15;
                  break;
                }
                _context7.next = 13;
                return this.filteringExistProduct(id, products, false);
              case 13:
                productList = _context7.sent;
                updateDataQuery = _objectSpread({
                  metadata: {
                    products: productList
                  }
                }, updateDataQuery);
              case 15:
                _context7.next = 17;
                return this.productService_.update(id, updateDataQuery);
              case 17:
                updateProduct = _context7.sent;
                return _context7.abrupt("return", {
                  id: updateProduct.id,
                  created_at: updateProduct.created_at,
                  updated_at: updateProduct.updated_at,
                  deleted_at: updateProduct.deleted_at,
                  title: updateProduct.title,
                  subtitle: updateProduct.subtitle,
                  description: updateProduct.description,
                  handle: updateProduct.handle,
                  status: updateProduct.status,
                  products: updateProduct.metadata.products
                });
              case 19:
              case "end":
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));
      function update(_x12, _x13) {
        return _update.apply(this, arguments);
      }
      return update;
    }() //TODO Delete service based on specific id
  }, {
    key: "delete",
    value: function () {
      var _delete2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee8(req, res) {
        var _serviceData$type2;
        var id, serviceData;
        return _regenerator["default"].wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                id = req.params.id;
                _context8.next = 3;
                return this.productService_.retrieve(id, {
                  relations: this.defaultRelation
                });
              case 3:
                serviceData = _context8.sent;
                if (!(serviceData.type == null || ((_serviceData$type2 = serviceData.type) === null || _serviceData$type2 === void 0 ? void 0 : _serviceData$type2.value) != this.typeName)) {
                  _context8.next = 6;
                  break;
                }
                return _context8.abrupt("return", {
                  message: "sorry this item is not service :("
                });
              case 6:
                _context8.next = 8;
                return this.productService_["delete"](id);
              case 8:
                return _context8.abrupt("return", _context8.sent);
              case 9:
              case "end":
                return _context8.stop();
            }
          }
        }, _callee8, this);
      }));
      function _delete(_x14, _x15) {
        return _delete2.apply(this, arguments);
      }
      return _delete;
    }()
  }]);
  return ServiceHandlerService;
}(_medusaInterfaces.BaseService);
var _default = ServiceHandlerService;
exports["default"] = _default;