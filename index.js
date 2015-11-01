import Client from 'newrelic-api';

const FAIL = 'Operation failed :(';

export default bot => {
  let betternet = new Client({
    key: bot.data.newrelic.key
  });

  let APPS = [];
  let ENABLED = [];

  bot.agenda.define('monitor-newrelic', (job, done) => {
    let { data } = job.attrs;

    model.findOne({ id: data.app.id }).exec().then(enabled => {
      let index = ENABLED.findIndex({ id: data.app.id });

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

      betternet.error({
        app: data.app.id
      }).then(rate => {
        console.log(`Application ${data.app.name} has ${rate} error rate`);
        if (rate > 2) {
          const msg = `Application ${data.app.name}
                       has greater than 2% error rate!`;

          bot.sendMessage(bot.data.newrelic.target, msg);
        }

        done();
      });
    });
  });

  let model = bot.pocket.model('NewrelicApp', {
    name: String,
    id: String
  });

  betternet.apps().then(apps => {
    APPS = apps;

    let enabled = model.find().select('name').exec().then(enabled => {
      ENABLED = enabled;
      if (!enabled.length) {
        return Promise.all(apps.map(app => {
          return bot.pocket.save('NewrelicApp', app);
        }));
      }

      return enabled.map(name => {
        return apps.find(i => i.name === name);
      })
    });

    for (let app of apps) {
      let job = bot.agenda.create('monitor-newrelic', { app });
      job.repeatEvery('15 minutes');
      job.save();
    }

    bot.agenda.start();
  });

  bot.listen(/newrelic (\w+)\s?(.*)?/i, message => {
    let [, command, arg] = message.match;

    if (command === 'list') {
      const msg = APPS.map((app, index) => {
        let status = ENABLED.find(i => i.name === app.name) ? 'Enabled'
                                                            : 'Disabled';
        return index + '. ' + app.name + ' – ' + status;
      }).join('\n');

      return message.reply(msg);
    }

    if (command === 'enable' || command === 'disable') {
      let target = APPS.find(i => i.name === arg);

      if (!target) {
        return message.reply(`Application ${arg} doesn't exist`);
      }
      if (command === 'enable') {
        bot.pocket.save('NewrelicApp', target).then(() => {
          message.reply(`Application ${arg} is enabled now.`);

          let index = ENABLED.findIndex(i => i.id === target.id);
          if (index === -1) {
            ENABLED.push(target);
          }
        }, () => {
          message.reply(FAIL);
        });
      }

      if (command === 'disable') {
        bot.pocket.remove('NewrelicApp', {id: target.id}).then(() => {
          message.reply(`Application ${arg} is disabled now.`);

          let index = ENABLED.findIndex(i => i.id === target.id);
          if (index > -1) {
            ENABLED.splice(index, 1);
          }
        }, () => {
          message.reply(FAIL);
        });
      }
    }

    if (command === 'help') {
      message.reply(`
        list - show a list of newrelic applications\n
        enable <appname> - enable application monitoring\n
        disable <appname> - disable application monitoring
      `);
    }

  }, { permissions: ['admin', 'server'] });
}

