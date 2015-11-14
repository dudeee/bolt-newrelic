'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _this3 = this;

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _newrelicApi = require('newrelic-api');

var _newrelicApi2 = _interopRequireDefault(_newrelicApi);

var FAIL = 'Operation failed :(';

exports['default'] = function (bot) {
  var compare = bot.utils.compare;

  var client = new _newrelicApi2['default']({
    key: bot.data.newrelic.key
  });

  var model = bot.pocket.model('newrelicapp', {
    name: String,
    id: String
  });

  var _bot$data$newrelic = bot.data.newrelic;
  var threshold = _bot$data$newrelic.threshold;
  var target = _bot$data$newrelic.target;

  var isEnabled = function isEnabled(app) {
    return regeneratorRuntime.async(function isEnabled$(context$2$0) {
      while (1) switch (context$2$0.prev = context$2$0.next) {
        case 0:
          context$2$0.next = 2;
          return regeneratorRuntime.awrap(model.findOne({ id: app.id }));

        case 2:
          return context$2$0.abrupt('return', !!context$2$0.sent);

        case 3:
        case 'end':
          return context$2$0.stop();
      }
    }, null, this);
  };

  var process = function process(job) {
    var data, app, enable, _ref, apdex, error;

    return regeneratorRuntime.async(function process$(context$2$0) {
      while (1) switch (context$2$0.prev = context$2$0.next) {
        case 0:
          data = job.attrs.data;
          app = data.app;
          context$2$0.next = 4;
          return regeneratorRuntime.awrap(isEnabled(app));

        case 4:
          enable = context$2$0.sent;

          if (enable) {
            context$2$0.next = 7;
            break;
          }

          return context$2$0.abrupt('return', false);

        case 7:
          context$2$0.next = 9;
          return regeneratorRuntime.awrap(client.apdex({
            app: app.id
          }));

        case 9:
          _ref = context$2$0.sent;
          apdex = _ref.average;

          if (compare(threshold.apdex, apdex)) {
            bot.sendMessage(target, 'Newrelic Application *' + app.name + '*\'s apdex\n      score is ' + apdex);
          }

          context$2$0.next = 14;
          return regeneratorRuntime.awrap(client.error({
            app: app.id
          }));

        case 14:
          error = context$2$0.sent;

          if (compare(threshold.error, error)) {
            bot.sendMessage(target, 'Newrelic Application *' + app.name + '*\'s error rate\n      is ' + error + '!');
          }

        case 16:
        case 'end':
          return context$2$0.stop();
      }
    }, null, this);
  };

  bot.agenda.define('monitor-newrelic', process);

  bot.agenda.on('ready', function callee$1$0() {
    var apps, names, enabled, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, app;

    return regeneratorRuntime.async(function callee$1$0$(context$2$0) {
      var _this2 = this;

      while (1) switch (context$2$0.prev = context$2$0.next) {
        case 0:
          context$2$0.next = 2;
          return regeneratorRuntime.awrap(client.apps());

        case 2:
          apps = context$2$0.sent;
          names = apps.map(function (app) {
            return app.name;
          });

          bot.log.verbose('[newrelic] fetched applications', names);

          context$2$0.next = 7;
          return regeneratorRuntime.awrap(model.find().exec());

        case 7:
          enabled = context$2$0.sent;

          if (enabled.length) {
            context$2$0.next = 11;
            break;
          }

          context$2$0.next = 11;
          return regeneratorRuntime.awrap(Promise.all(apps.map(function (app) {
            return bot.pocket.save('NewrelicApp', app);
          })));

        case 11:
          _iteratorNormalCompletion = true;
          _didIteratorError = false;
          _iteratorError = undefined;
          context$2$0.prev = 14;

          for (_iterator = apps[Symbol.iterator](); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            app = _step.value;

            bot.agenda.every('15 minutes', 'monitor-newrelic', { app: app });
          }

          context$2$0.next = 22;
          break;

        case 18:
          context$2$0.prev = 18;
          context$2$0.t0 = context$2$0['catch'](14);
          _didIteratorError = true;
          _iteratorError = context$2$0.t0;

        case 22:
          context$2$0.prev = 22;
          context$2$0.prev = 23;

          if (!_iteratorNormalCompletion && _iterator['return']) {
            _iterator['return']();
          }

        case 25:
          context$2$0.prev = 25;

          if (!_didIteratorError) {
            context$2$0.next = 28;
            break;
          }

          throw _iteratorError;

        case 28:
          return context$2$0.finish(25);

        case 29:
          return context$2$0.finish(22);

        case 30:
          bot.listen(/newrelic list/i, function callee$2$0(message) {
            var apps, response;
            return regeneratorRuntime.async(function callee$2$0$(context$3$0) {
              var _this = this;

              while (1) switch (context$3$0.prev = context$3$0.next) {
                case 0:
                  context$3$0.next = 2;
                  return regeneratorRuntime.awrap(client.apps());

                case 2:
                  apps = context$3$0.sent;
                  context$3$0.next = 5;
                  return regeneratorRuntime.awrap(Promise.all(apps.map(function callee$3$0(app, index) {
                    var status;
                    return regeneratorRuntime.async(function callee$3$0$(context$4$0) {
                      while (1) switch (context$4$0.prev = context$4$0.next) {
                        case 0:
                          context$4$0.next = 2;
                          return regeneratorRuntime.awrap(isEnabled(app));

                        case 2:
                          if (!context$4$0.sent) {
                            context$4$0.next = 6;
                            break;
                          }

                          context$4$0.t0 = 'Enabled';
                          context$4$0.next = 7;
                          break;

                        case 6:
                          context$4$0.t0 = 'Disabled';

                        case 7:
                          status = context$4$0.t0;
                          return context$4$0.abrupt('return', index + '. ' + app.name + ' – ' + status);

                        case 9:
                        case 'end':
                          return context$4$0.stop();
                      }
                    }, null, _this);
                  })));

                case 5:
                  response = context$3$0.sent;
                  return context$3$0.abrupt('return', message.reply(response.join('\n')));

                case 7:
                case 'end':
                  return context$3$0.stop();
              }
            }, null, _this2);
          }, { permissions: ['admin', 'server'] });

          bot.listen(/newrelic enable (.*)/i, function callee$2$0(message) {
            var _message$match, app, apps, target;

            return regeneratorRuntime.async(function callee$2$0$(context$3$0) {
              while (1) switch (context$3$0.prev = context$3$0.next) {
                case 0:
                  _message$match = _slicedToArray(message.match, 2);
                  app = _message$match[1];
                  context$3$0.next = 4;
                  return regeneratorRuntime.awrap(client.apps());

                case 4:
                  apps = context$3$0.sent;
                  target = isNaN(+app) ? apps.find(function (i) {
                    return i.name === app;
                  }) : apps[+app];
                  context$3$0.next = 8;
                  return regeneratorRuntime.awrap(bot.pocket.save('newrelicapp', target));

                case 8:

                  message.reply('Enabled *' + target.name + '*.');

                case 9:
                case 'end':
                  return context$3$0.stop();
              }
            }, null, _this2);
          }, { permissions: ['admin', 'server'] });

          bot.listen(/newrelic disable (.*)/i, function callee$2$0(message) {
            var _message$match2, app, apps, target;

            return regeneratorRuntime.async(function callee$2$0$(context$3$0) {
              while (1) switch (context$3$0.prev = context$3$0.next) {
                case 0:
                  _message$match2 = _slicedToArray(message.match, 2);
                  app = _message$match2[1];
                  context$3$0.next = 4;
                  return regeneratorRuntime.awrap(client.apps());

                case 4:
                  apps = context$3$0.sent;
                  target = isNaN(+app) ? apps.find(function (i) {
                    return i.name === app;
                  }) : apps[+app];
                  context$3$0.next = 8;
                  return regeneratorRuntime.awrap(bot.pocket.remove('newrelicapp', { id: target.id }));

                case 8:

                  message.reply('Enabled *' + target.name + '*.');

                case 9:
                case 'end':
                  return context$3$0.stop();
              }
            }, null, _this2);
          }, { permissions: ['admin', 'server'] });

        case 33:
        case 'end':
          return context$2$0.stop();
      }
    }, null, _this3, [[14, 18, 22, 30], [23,, 25, 29]]);
  });

  bot.help('newrelic', 'manage newrelic alerts', '\nlist — show a list of newrelic applications\n\nenable <appname> — enable application monitoring\n\ndisable <appname> — disable application monitoring');
};

module.exports = exports['default'];
