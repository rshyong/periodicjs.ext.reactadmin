'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _overlay = require('../components/AppSectionLoading/overlay');

var _overlay2 = _interopRequireDefault(_overlay);

var _AppLayoutMap = require('../components/AppLayoutMap');

var _constants = require('../constants');

var _constants2 = _interopRequireDefault(_constants);

var _util = require('../util');

var _util2 = _interopRequireDefault(_util);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// import AppSectionLoading from '../components/AppSectionLoading';
var isLoggedIn = function isLoggedIn() {
  return window && !!window.localStorage[_constants2.default.jwt_token.TOKEN_NAME];
};

var _handleComponentLifecycle = function _handleComponentLifecycle() {
  var _this = this;

  this.setState({ ui_is_loaded: false, async_data_is_loaded: false });
  var parentState = this.props.getState();
  var pathname = this.props.location.pathname ? this.props.location.pathname : window.location.href || window.location.pathname;
  var isAuthenticated = isLoggedIn();
  if (!isAuthenticated) {
    if (parentState.manifest && Array.isArray(parentState.manifest.unauthenticated_routes)) {
      if (parentState.manifest.unauthenticated_routes.indexOf(pathname) !== -1) return this.fetchData();
    }
    return this.props.reduxRouter.replace({
      pathname: pathname.indexOf('p-admin') !== -1 ? '/p-admin/login?return_url=' + pathname : '/login?return_url=' + pathname,
      state: {
        nextPathname: pathname
      }
    });
  }
  if (parentState.manifest && parentState.manifest.hasLoaded) {
    if (pathname === '/mfa' && window.location.pathname === '/mfa') return this.fetchData();else {
      var isValid = this.props.enforceMFA(true);
      if (isValid) this.fetchData();
    }
  } else {
    return this.props.initializeAuthenticatedUser(parentState.user.jwt_token, false).then(function () {
      return _this.props.enforceMFA(true);
    }).then(function (isValid) {
      if (isValid) _this.fetchData();
    }, function (e) {
      return _this.fetchDynamicErrorContent(pathname);
    });
  }
};

var DynamicPage = function (_Component) {
  (0, _inherits3.default)(DynamicPage, _Component);

  function DynamicPage() {
    (0, _classCallCheck3.default)(this, DynamicPage);

    var _this2 = (0, _possibleConstructorReturn3.default)(this, (DynamicPage.__proto__ || (0, _getPrototypeOf2.default)(DynamicPage)).apply(this, arguments));

    _this2.state = {
      ui_is_loaded: false,
      async_data_is_loaded: false
    };
    _this2.uiLayout = {};
    _this2.getRenderedComponent = _AppLayoutMap.getRenderedComponent.bind(_this2);
    _this2.handleComponentLifecycle = _handleComponentLifecycle.bind(_this2);
    _this2.fetchData = _util2.default.fetchDynamicContent.bind(_this2);
    return _this2;
  }

  (0, _createClass3.default)(DynamicPage, [{
    key: 'fetchDynamicErrorContent',
    value: function fetchDynamicErrorContent() /*pathname*/{
      return _util2.default.fetchErrorContent.call(this);
    }
  }, {
    key: 'componentDidMount',
    value: function componentDidMount() {
      this.handleComponentLifecycle();
    }
  }, {
    key: 'componentWillReceiveProps',
    value: function componentWillReceiveProps() {
      this.handleComponentLifecycle();
    }
  }, {
    key: 'render',
    value: function render() {
      return _react2.default.createElement(
        'div',
        { style: {
            width: '100%',
            height: '100%' } },
        _react2.default.createElement(_overlay2.default, { display: !this.state.ui_is_loaded, wrapperstyle: {
            position: 'fixed',
            height: '100%',
            width: '100%',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'rgba(255,255,255,.8)',
            zIndex: 100
          } }),
        this.state.async_data_is_loaded && this.uiLayout ? this.uiLayout : null
      );
    }
  }]);
  return DynamicPage;
}(_react.Component);

exports.default = DynamicPage;