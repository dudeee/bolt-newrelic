'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _this2 = this;

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
    id: Number,
    enabled: Boolean
  });

  var _bot$data$newrelic = bot.data.newrelic;
  var threshold = _bot$data$newrelic.threshold;
  var target = _bot$data$newrelic.target;
  var spike = _bot$data$newrelic.spike;

  var isEnabled = function isEnabled(app) {
    return regeneratorRuntime.async(function isEnabled$(context$2$0) {
      while (1) switch (context$2$0.prev = context$2$0.next) {
        case 0:
          context$2$0.next = 2;
          return regeneratorRuntime.awrap(model.findOne({ id: app.id }));

        case 2:
          return context$2$0.abrupt('return', context$2$0.sent.enabled);

        case 3:
        case 'end':
          return context$2$0.stop();
      }
    }, null, this);
  };

  var process = function process(job) {
    var data, apps, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, app, enable, _ref, apdex, enduser, avgApdex, i, aslice, eslice, current, _ref2, errors, otherTransaction, httpDispatcher, avgError, oslice, hslice;

    return regeneratorRuntime.async(function process$(context$2$0) {
      while (1) switch (context$2$0.prev = context$2$0.next) {
        case 0:
          data = job.attrs.data;
          apps = data.apps;
          _iteratorNormalCompletion = true;
          _didIteratorError = false;
          _iteratorError = undefined;
          context$2$0.prev = 5;
          _iterator = apps[Symbol.iterator]();

        case 7:
          if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
            context$2$0.next = 51;
            break;
          }

          app = _step.value;
          context$2$0.prev = 9;
          context$2$0.next = 12;
          return regeneratorRuntime.awrap(isEnabled(app));

        case 12:
          enable = context$2$0.sent;

          bot.log.verbose('[newrelic] [' + app.name + '] id: ' + app.id + ', status: ' + (enable ? 'enabled' : 'disabled'));

          if (enable) {
            context$2$0.next = 16;
            break;
          }

          return context$2$0.abrupt('return', false);

        case 16:
          context$2$0.next = 18;
          return regeneratorRuntime.awrap(client.apdex({
            app: app.id
          }));

        case 18:
          _ref = context$2$0.sent;
          apdex = _ref.apdex;
          enduser = _ref.enduser;
          avgApdex = 0;

          for (i = 0; i < apdex.timeslices.length; i++) {
            aslice = apdex.timeslices[i];
            eslice = enduser.timeslices[i];

            avgApdex += client.averageApdex(aslice, eslice);
          }

          avgApdex = avgApdex / apdex.timeslices.length;

          bot.log.verbose('[newrelic] [' + app.name + '] average apdex score ' + avgApdex);

          for (i = 0; i < apdex.timeslices.length; i++) {
            aslice = apdex.timeslices[i];
            eslice = enduser.timeslices[i];
            current = client.averageApdex(aslice, eslice);

            bot.log.verbose('[newrelic] [' + app.name + '] apdex score spike ' + (current - avgApdex));
            if (compare(spike.apdex, current - avgApdex)) {
              bot.sendMessage(target, 'Newrelic Application *' + app.name + '*\n            is experiencing an apdex score spike!');
            }
          }

          bot.log.verbose('[newrelic] [' + app.name + '] apdex score spike threshold ' + spike.apdex);
          bot.log.verbose('[newrelic] [' + app.name + '] apdex score threshold ' + threshold.apdex);

          if (compare(threshold.apdex, avgApdex)) {
            bot.sendMessage(target, 'Newrelic Application *' + app.name + '*\'s apdex\n          score is ' + apdex + '!');
          }

          context$2$0.next = 31;
          return regeneratorRuntime.awrap(client.error({
            app: app.id
          }));

        case 31:
          _ref2 = context$2$0.sent;
          errors = _ref2.errors;
          otherTransaction = _ref2.otherTransaction;
          httpDispatcher = _ref2.httpDispatcher;
          avgError = 0;

          for (i = 0; i < errors.timeslices.length; i++) {
            eslice = errors.timeslices[i];
            oslice = otherTransaction.timeslices[i];
            hslice = httpDispatcher.timeslices[i];

            avgError += client.averageError(eslice, oslice, hslice);
          }

          avgError = avgError / errors.timeslices.length;

          bot.log.verbose('[newrelic] [' + app.name + '] average error rate is ' + avgError);

          for (i = 0; i < errors.timeslices.length; i++) {
            eslice = errors.timeslices[i];
            oslice = otherTransaction.timeslices[i];
            hslice = httpDispatcher.timeslices[i];
            current = client.averageError(eslice, oslice, hslice);

            bot.log.verbose('[newrelic] [' + app.name + '] error rate spike ' + (current - avgError));
            if (compare(spike.error, current - avgError)) {
              bot.sendMessage(target, 'Newrelic Application *' + app.name + '* is\n            experiencing an errot rate spike!');
            }
          }

          bot.log.verbose('[newrelic] [' + app.name + '] error rate threshold ' + threshold.error);
          bot.log.verbose('[newrelic] [' + app.name + '] error rate spike threshold ' + spike.error);

          if (compare(threshold.error, avgError)) {
            bot.sendMessage(target, 'Newrelic Application *' + app.name + '*\'s error rate\n          is ' + error + '!');
          }
          context$2$0.next = 48;
          break;

        case 45:
          context$2$0.prev = 45;
          context$2$0.t0 = context$2$0['catch'](9);

          bot.log.info('[newrelic] [' + app.name + '] response error: ' + context$2$0.t0.title);

        case 48:
          _iteratorNormalCompletion = true;
          context$2$0.next = 7;
          break;

        case 51:
          context$2$0.next = 57;
          break;

        case 53:
          context$2$0.prev = 53;
          context$2$0.t1 = context$2$0['catch'](5);
          _didIteratorError = true;
          _iteratorError = context$2$0.t1;

        case 57:
          context$2$0.prev = 57;
          context$2$0.prev = 58;

          if (!_iteratorNormalCompletion && _iterator['return']) {
            _iterator['return']();
          }

        case 60:
          context$2$0.prev = 60;

          if (!_didIteratorError) {
            context$2$0.next = 63;
            break;
          }

          throw _iteratorError;

        case 63:
          return context$2$0.finish(60);

        case 64:
          return context$2$0.finish(57);

        case 65:
        case 'end':
          return context$2$0.stop();
      }
    }, null, this, [[5, 53, 57, 65], [9, 45], [58,, 60, 64]]);
  };

  bot.agenda.define('monitor-newrelic', process);

  bot.agenda.on('ready', function callee$1$0() {
    var apps, names;
    return regeneratorRuntime.async(function callee$1$0$(context$2$0) {
      var _this = this;

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
          return regeneratorRuntime.awrap(model.find().remove());

        case 7:
          context$2$0.next = 9;
          return regeneratorRuntime.awrap(Promise.all(apps.map(function (app) {
            app.enabled = true;
            return bot.pocket.save('newrelicapp', app);
          })));

        case 9:

          process({ attrs: { data: { apps: apps } } });
          bot.agenda.every('15 minutes', 'monitor-newrelic', { apps: apps });

          bot.listen(/newrelic list/i, function callee$2$0(message) {
            var apps, response;
            return regeneratorRuntime.async(function callee$2$0$(context$3$0) {
              while (1) switch (context$3$0.prev = context$3$0.next) {
                case 0:
                  context$3$0.next = 2;
                  return regeneratorRuntime.awrap(model.find('newrelicapp').exec());

                case 2:
                  apps = context$3$0.sent;
                  response = apps.map(function (app, index) {
                    var status = app.enabled ? 'Enabled' : 'Disabled';

                    return index + '. ' + app.name + ' – ' + status;
                  });
                  return context$3$0.abrupt('return', message.reply(response.join('\n')));

                case 5:
                case 'end':
                  return context$3$0.stop();
              }
            }, null, _this);
          }, { permissions: ['admin', 'server'] });

          bot.listen(/newrelic enable (.*)/i, function callee$2$0(message) {
            var _message$match, app, apps, target, m;

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
                  return regeneratorRuntime.awrap(model.findOne({ id: target.id }));

                case 8:
                  m = context$3$0.sent;

                  m.enabled = true;
                  context$3$0.next = 12;
                  return regeneratorRuntime.awrap(m.save());

                case 12:

                  message.reply('Enabled *' + target.name + '*.');

                case 13:
                case 'end':
                  return context$3$0.stop();
              }
            }, null, _this);
          }, { permissions: ['admin', 'server'] });

          bot.listen(/newrelic disable (.*)/i, function callee$2$0(message) {
            var _message$match2, app, apps, target, m;

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
                  return regeneratorRuntime.awrap(model.findOne({ id: target.id }));

                case 8:
                  m = context$3$0.sent;

                  m.enabled = false;
                  context$3$0.next = 12;
                  return regeneratorRuntime.awrap(m.save());

                case 12:

                  message.reply('Disabled *' + m.name + '*.');

                case 13:
                case 'end':
                  return context$3$0.stop();
              }
            }, null, _this);
          }, { permissions: ['admin', 'server'] });

        case 14:
        case 'end':
          return context$2$0.stop();
      }
    }, null, _this2);
  });

  bot.help('newrelic', 'manage newrelic alerts', '\nlist — show a list of newrelic applications\n\nenable <appname> — enable application monitoring\n\ndisable <appname> — disable application monitoring');
};

module.exports = exports['default'];
