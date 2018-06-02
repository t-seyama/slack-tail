function convertUser(message, rtm) {
  var res = message;
  while (true) {
    var match = res.match(/<@[a-zA-Z0-9]*>/);
    if (match != null) {
      var userId = match[0].replace('<@', '').replace('>', '');
      var userName = rtm.dataStore.getUserById(userId).name;
      res = res.replace(match[0], ('@' + userName).red);
    } else {
      return res;
    }
  }
}

var dateformat = require('dateformat');
var colors = require('colors');
var RtmClient = require('@slack/client').RtmClient;

var MemoryDataStore = require('@slack/client').MemoryDataStore;
var CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;
var token = process.env.SLACK_API_TOKEN;

var rtm = new RtmClient(token, {
  logLevel: 'error',
  dataStore: new MemoryDataStore(),
  autoReconnect: true,
  autoMark: true
});

rtm.start();

rtm.on(CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, function () {
  var user = rtm.dataStore.getUserById(rtm.activeUserId);
  var team = rtm.dataStore.getTeamById(rtm.activeTeamId);
  console.log('Connected to ' + team.name + ' as ' + user.name);
});

rtm.on('message', (event) => {
  console.log(event);
  var channel = rtm.dataStore.getChannelById(event.channel) || rtm.dataStore.getGroupById(event.channel) || rtm.dataStore.getDMById(event.channel);
  var channelName = "";
  if (channel.name) {
    channelName = "#" + channel.name;
  } else {
    channelName = "@" + rtm.dataStore.getUserById(channel.user).name;
  }
  channelName = (channelName + " ".repeat(14)).slice(0, 17);

  var userName = 'system';
  if (event.username) {
    //bot user
    userName = event.userName;
  } else if (event.bot_id) {
    userName = event.bot_id;
  } else {
    if (rtm.dataStore.getUserById(event.user)) {
      userName = rtm.dataStore.getUserById(event.user).name;
    }
  }
  userName = ("@" + userName + " ".repeat(14)).slice(0, 17);

  var message = 'system operation';
  if (event.text) {
    message = event.text;
  }

  var date = new Date(Math.floor(event.ts * 1000));
  var dispDate = dateformat(date, 'mm/dd HH:MM:ss');

  var messages = message.split('\n');
  console.log(dispDate.green + ' - ' + channelName.blue + ' ' + userName.cyan + ': ' + convertUser(messages[0], rtm));
  if (messages.length > 1) {
    for (i = 1; i < messages.length; i++) {
      console.log(" ".repeat(54) + convertUser(messages[i], rtm));
    }
  }
})
