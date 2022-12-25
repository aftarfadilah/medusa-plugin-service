"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _medusaInterfaces = require("medusa-interfaces");
var _typeorm = require("typeorm");
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var ProductHandlerService = /*#__PURE__*/function (_BaseService) {
  (0, _inherits2["default"])(ProductHandlerService, _BaseService);
  var _super = _createSuper(ProductHandlerService);
  function ProductHandlerService(_ref, options) {
    var _this;
    var manager = _ref.manager,
      productService = _ref.productService,
      pricingService = _ref.pricingService,
      productRepository = _ref.productRepository;
    (0, _classCallCheck2["default"])(this, ProductHandlerService);
    _this = _super.call(this);
    _this.manager_ = manager;
    _this.productService_ = productService;
    _this.pricingService_ = pricingService;
    _this.productRepository_ = productRepository;
    _this.typeName = options.serviceName || "Service";
    return _this;
  }
  (0, _createClass2["default"])(ProductHandlerService, [{
    key: "filterQuery",
    value: function filterQuery(config) {
      var _config$expand, _config$fields;
      config.relations = config === null || config === void 0 ? void 0 : (_config$expand = config.expand) === null || _config$expand === void 0 ? void 0 : _config$expand.split(",");
      config.select = config === null || config === void 0 ? void 0 : (_config$fields = config.fields) === null || _config$fields === void 0 ? void 0 : _config$fields.split(",");
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
      return config;
    }
  }, {
    key: "list",
    value: function () {
      var _list = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(req, res) {
        var _this$filterQuery, select, relations, is_giftcard, offset, limit, q, _yield$this$listAndCo, products, count;
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _this$filterQuery = this.filterQuery(req.query), select = _this$filterQuery.select, relations = _this$filterQuery.relations, is_giftcard = _this$filterQuery.is_giftcard, offset = _this$filterQuery.offset, limit = _this$filterQuery.limit, q = _this$filterQuery.q;
                _context.next = 3;
                return this.listAndCount({
                  q: q
                }, {
                  select: select,
                  relations: relations,
                  skip: offset,
                  take: limit,
                  include_discount_prices: is_giftcard || false
                });
              case 3:
                _yield$this$listAndCo = _context.sent;
                products = _yield$this$listAndCo.products;
                count = _yield$this$listAndCo.count;
                return _context.abrupt("return", {
                  products: products,
                  count: count,
                  offset: offset,
                  limit: limit
                });
              case 7:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));
      function list(_x, _x2) {
        return _list.apply(this, arguments);
      }
      return list;
    }()
  }, {
    key: "listAndCount",
    value: function () {
      var _listAndCount = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(selector, config) {
        var manager, relationsList, productRepo, _yield$productRepo$fi, _yield$productRepo$fi2, rawProducts, count, products, includesPricing;
        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                manager = this.manager_;
                relationsList = config.relations || []; // add type into relation cause it's needed for checking data
                if (!relationsList.includes("type")) {
                  relationsList.push("type");
                }
                productRepo = manager.getCustomRepository(this.productRepository_);
                _context2.next = 6;
                return productRepo.findAndCount({
                  where: [{
                    type: {
                      value: (0, _typeorm.Not)(this.typeName)
                    },
                    title: (0, _typeorm.ILike)("%".concat(selector === null || selector === void 0 ? void 0 : selector.q, "%"))
                  }, {
                    type_id: null,
                    title: (0, _typeorm.ILike)("%".concat(selector === null || selector === void 0 ? void 0 : selector.q, "%"))
                  }],
                  relations: relationsList,
                  select: config.select,
                  take: config.take,
                  skip: config.skip
                });
              case 6:
                _yield$productRepo$fi = _context2.sent;
                _yield$productRepo$fi2 = (0, _slicedToArray2["default"])(_yield$productRepo$fi, 2);
                rawProducts = _yield$productRepo$fi2[0];
                count = _yield$productRepo$fi2[1];
                products = rawProducts;
                includesPricing = ["variants", "variants.prices"].every(function (relation) {
                  var _config$relations;
                  return (_config$relations = config.relations) === null || _config$relations === void 0 ? void 0 : _config$relations.includes(relation);
                });
                if (!includesPricing) {
                  _context2.next = 16;
                  break;
                }
                _context2.next = 15;
                return this.pricingService_.setProductPrices(rawProducts);
              case 15:
                products = _context2.sent;
              case 16:
                return _context2.abrupt("return", {
                  products: products,
                  count: count
                });
              case 17:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));
      function listAndCount(_x3, _x4) {
        return _listAndCount.apply(this, arguments);
      }
      return listAndCount;
    }()
  }]);
  return ProductHandlerService;
}(_medusaInterfaces.BaseService);
var _default = ProductHandlerService;
exports["default"] = _default;