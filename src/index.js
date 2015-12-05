import Client from 'newrelic-api';

const FAIL = 'Operation failed :(';

export default bot => {
  let { compare } = bot.utils;

  let client = new Client({
    key: bot.data.newrelic.key
  });

  let model = bot.pocket.model('newrelicapp', {
    name: String,
    id: Number,
    enabled: Boolean
  });

  let { threshold, target, spike } = bot.data.newrelic;

  const isEnabled = async function(app) {
    return (await model.findOne({ id: app.id })).enabled;
  }

  const process = async function(job) {
    let { data } = job.attrs;
    let { app } = data;

    let enable = await isEnabled(app);
    if (!enable) return false;

    let { apdex, enduser } = await client.apdex({
      app: app.id
    });

    let avgApdex = 0;

    for (let i = 0; i < apdex.timeslices.length; i++) {
      let aslice = apdex.timeslices[i];
      let eslice = enduser.timeslices[i];

      avgApdex = (avgApdex + client.averageApdex(aslice, eslice)) / 2;
    }

    bot.log.verbose(`[newrelic] average apdex score ${avgApdex}`)
    bot.log.verbose(`[newrelic] apdex score spike ${spike.apdex}`);

    for (let i = 0; i < apdex.timeslices.length; i++) {
      let aslice = apdex.timeslices[i];
      let eslice = enduser.timeslices[i];

      let current = client.averageApdex(aslice, eslice);

      if (compare(spike.apdex, current - avgApdex)) {
        bot.sendMessage(target, `Newrelic Application *${app.name}*
        is experiencing an apdex score spike!`);
      }
    }


    bot.log.verbose(`[newrelic] apdex score threshold ${threshold.apdex}`);

    if (compare(threshold.apdex, avgApdex)) {
      bot.sendMessage(target, `Newrelic Application *${app.name}*'s apdex
      score is ${apdex}!`);
    }


    let { errors, otherTransaction, httpDispatcher } = await client.error({
      app: app.id
    });

    let avgError = 0;

    for (let i = 0; i < errors.timeslices.length; i++) {
      let eslice = errors.timeslices[i];
      let oslice = otherTransaction.timeslices[i];
      let hslice = httpDispatcher.timeslices[i];

      avgError = (avgError + client.averageError(eslice, oslice, hslice)) / 2;
    }

    bot.log.verbose(`[newrelic] average error rate is ${avgError}`)
    bot.log.verbose(`[newrelic] error rate spike ${spike.error}`);

    for (let i = 0; i < errors.timeslices.length; i++) {
      let eslice = errors.timeslices[i];
      let oslice = otherTransaction.timeslices[i];
      let hslice = httpDispatcher.timeslices[i];

      let current = client.averageError(eslice, oslice, hslice);

      if (compare(spike.error, current - avgError)) {
        bot.sendMessage(target, `Newrelic Application *${app.name}* is
        experiencing an errot rate spike!`)
      }
    }

    bot.log.verbose(`[newrelic] error rate threshold ${threshold.error}`);

    if (compare(threshold.error, avgError)) {
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
      process({ attrs: { data: { app } }})
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

      let m = await model.findOne({id: target.id});
      m.enabled = true;
      await m.save();

      message.reply(`Enabled *${target.name}*.`)
    }, { permissions: ['admin', 'server'] });

    bot.listen(/newrelic disable (.*)/i, async (message) => {
      let [, app] = message.match;

      let apps = await client.apps();

      let target = isNaN(+app) ? apps.find(i => i.name === app)
                               : apps[+app];

      let m = await model.findOne({id: target.id});
      m.enabled = false;
      await m.save();

      message.reply(`Disabled *${m.name}*.`)
    }, { permissions: ['admin', 'server'] })
  })

  bot.help('newrelic', 'manage newrelic alerts', `
list — show a list of newrelic applications\n
enable <appname> — enable application monitoring\n
disable <appname> — disable application monitoring`);
}
