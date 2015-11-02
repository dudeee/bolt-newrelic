'use strict';

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; })();

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _newrelicApi = require('newrelic-api');

var _newrelicApi2 = _interopRequireDefault(_newrelicApi);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _typeof(obj) { return obj && obj.constructor === Symbol ? "symbol" : typeof obj; }

var FAIL = 'Operation failed :(';

exports.default = function (bot) {
  var compare = bot.utils.compare;

  var client = new _newrelicApi2.default({
    key: bot.data.newrelic.key
  });

  var APPS = [];
  var ENABLED = [];

  var model = bot.pocket.model('NewrelicApp', {
    name: String,
    id: String
  });

  bot.agenda.define('monitor-newrelic', function (job, done) {
    var data = job.attrs.data;

    model.findOne({ id: data.app.id }).exec().then(function (enabled) {
      var index = ENABLED.findIndex(function (i) {
        return i.id === data.app.id;
      });

      if (!enabled) {
        if (index > -1) {
          ENABLED.splice(index, 1);
        }
        return;
      }
      if (index === -1) {
        ENABLED.push({
          id: data.app.id,
          name: data.app.name
        });
      }

      var threshold = bot.data.newrelic.threshold;

      client.apdex({
        app: data.app.id
      }).then(function (rate) {
        if (compare(threshold.apdex, rate)) {
          var msg = 'Application ' + data.app.name + '\n                       \'s apdex score has dropped below 0.7!';

          bot.sendMessage(bot.data.newrelic.target, msg);
        }

        done();
      }).then(function () {
        return client.error({
          app: data.app.id
        }).then(function (rate) {
          if (compare(threshold.error, rate)) {
            var msg = 'Application ' + data.app.name + '\n                         \'s error rating is over 2%!';

            bot.sendMessage(bot.data.newrelic.target, msg);
          }
        });
      }).then(done);
    });
  });

  bot.agenda.on('ready', function () {
    client.apps().then(function (apps) {
      APPS = apps;

      var enabled = model.find().exec().then(function (enabled) {
        ENABLED = enabled;
        if (!enabled.length) {
          return Promise.all(apps.map(function (app) {
            return bot.pocket.save('NewrelicApp', app);
          }));
        }

        return enabled.map(function (name) {
          return apps.find(function (i) {
            return i.name === name;
          });
        });
      });

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = apps[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var app = _step.value;

          var job = bot.agenda.create('monitor-newrelic', { app: app });
          job.repeatEvery('15 minutes');
          job.save();
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    });

    bot.listen(/newrelic (\w+)\s?(.*)?/i, function (message) {
      var _message$match = _slicedToArray(message.match, 3);

      var command = _message$match[1];
      var arg = _message$match[2];

      if (command === 'list') {
        var msg = APPS.map(function (app, index) {
          var status = ENABLED.find(function (i) {
            return i.name === app.name;
          }) ? 'Enabled' : 'Disabled';
          return index + '. ' + app.name + ' – ' + status;
        }).join('\n');

        return message.reply(msg);
      }

      if (command === 'enable' || command === 'disable') {
        var _ret = (function () {
          var target = APPS.find(function (i) {
            return i.name === arg;
          });

          if (!target) {
            return {
              v: message.reply('Application ' + arg + ' doesn\'t exist')
            };
          }
          if (command === 'enable') {
            bot.pocket.save('NewrelicApp', target).then(function () {
              message.reply('Application ' + arg + ' is enabled now.');

              var index = ENABLED.findIndex(function (i) {
                return i.id === target.id;
              });
              if (index === -1) {
                ENABLED.push(target);
              }
            }, function () {
              message.reply(FAIL);
            });
          }

          if (command === 'disable') {
            bot.pocket.remove('NewrelicApp', { id: target.id }).then(function () {
              message.reply('Application ' + arg + ' is disabled now.');

              var index = ENABLED.findIndex(function (i) {
                return i.id === target.id;
              });
              if (index > -1) {
                ENABLED.splice(index, 1);
              }
            }, function () {
              message.reply(FAIL);
            });
          }
        })();

        if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
      }
    }, { permissions: ['admin', 'server'] });
  });

  bot.help('newrelic', 'manage newrelic alerts', '\n    list — show a list of newrelic applications\n\n    enable <appname> — enable application monitoring\n\n    disable <appname> — disable application monitoring\n  ');
};
