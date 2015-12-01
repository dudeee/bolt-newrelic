import Client from 'newrelic-api';

const FAIL = 'Operation failed :(';

export default bot => {
  let { compare } = bot.utils;

  let client = new Client({
    key: bot.data.newrelic.key
  });

  let model = bot.pocket.model('newrelicapp', {
    name: String,
    id: String,
    enabled: Boolean
  });

  let { threshold, target } = bot.data.newrelic;

  const isEnabled = async function(app) {
    return await model.findOne({ id: app.id }).enabled;
  }

  const process = async function(job) {
    let { data } = job.attrs;
    let { app } = data;

    let enable = await isEnabled(app);
    if (!enable) return false;

    let { average: apdex } = await client.apdex({
      app: app.id
    });

    if (compare(threshold.apdex, apdex)) {
      bot.sendMessage(target, `Newrelic Application *${app.name}*'s apdex
      score is ${apdex}`);
    }

    let error = await client.error({
      app: app.id
    });

    if (compare(threshold.error, error)) {
      bot.sendMessage(target, `Newrelic Application *${app.name}*'s error rate
      is ${error}!`);
    }
  };

  bot.agenda.define('monitor-newrelic', process);

  bot.agenda.on('ready', async () => {
    let apps = await client.apps();
    let names = apps.map(app => app.name);
    bot.log.verbose('[newrelic] fetched applications', names);

    await model.find().remove();
    await* apps.map(app => {
      app.enabled = true;
      return bot.pocket.save('newrelicapp', app);
    });

    for (let app of apps) {
      bot.agenda.every('15 minutes', 'monitor-newrelic', { app });
    }

    bot.listen(/newrelic list/i, async (message) => {
      const apps = await model.find('newrelicapp').exec();
      let response = apps.map((app, index) => {
        let status = app.enabled ? 'Enabled' : 'Disabled';

        return `${index}. ${app.name} – ${status}`;
      });

      return message.reply(response.join('\n'));
    }, { permissions: ['admin', 'server'] });

    bot.listen(/newrelic enable (.*)/i, async (message) => {
      let [, app] = message.match;

      let apps = await client.apps();

      let target = isNaN(+app) ? apps.find(i => i.name === app)
                               : apps[+app];

      let m = await model.findOne('newrelicapp', {id: target.id});
      m.enabled = true;
      await m.save();

      message.reply(`Enabled *${target.name}*.`)
    }, { permissions: ['admin', 'server'] });

    bot.listen(/newrelic disable (.*)/i, async (message) => {
      let [, app] = message.match;

      let apps = await client.apps();

      let target = isNaN(+app) ? apps.find(i => i.name === app)
                               : apps[+app];

      let m = await model.findOne('newrelicapp', {id: target.id});
      m.enabled = false;
      await m.save();

      message.reply(`Disabled *${target.name}*.`)
    }, { permissions: ['admin', 'server'] })
  })

  bot.help('newrelic', 'manage newrelic alerts', `
list — show a list of newrelic applications\n
enable <appname> — enable application monitoring\n
disable <appname> — disable application monitoring`);
}
