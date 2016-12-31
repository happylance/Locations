exports = module.exports = {}

var fs = require('fs')
var readline = require('readline');
var moment = require('moment')
var datetimeInChinese = require('./dateUtil').datetimeInChinese

const actionLogFile = 'data/actions.log';
const cancelToken = "cancel_023F3CD0-5B6D-47E7-9E6C-3319C1811738";

function _actionInChinese(action) {
  switch (action) {
    case "startMeditation":
      return "开始打坐"
    case "stopMeditation":
      return "打坐完毕"
    default:
      return "";
  }
}

function _AddAction(actionString) {
  var now = moment().format("YYYY-MM-DD hh:mm:ss A")
  var newAction = now + ' ' + actionString
  console.log(newAction)
  fs.appendFile(actionLogFile, '\n' + newAction, function (err) {
    if (err) {
      console.log(err)
    }
  });
}

function _removeLastLine(lines) {
  if(lines.lastIndexOf("\n")>0) {
    return lines.substring(0, lines.lastIndexOf("\n"));
  } else {
    return "";
  }
}

function _removeLastAction() {
  var actionLogFile = 'data/actions.log';
  var data = fs.readFileSync(actionLogFile, 'utf-8');
  var newData = _removeLastLine(data);
  fs.writeFileSync(actionLogFile, newData, 'utf-8');
  console.log('Removed last action');
}

function getActions(tab_date, onClose) {
  var logFile = actionLogFile
  var actions = []
  var startMeditationTime = 0
  readline.createInterface({
    input: fs.createReadStream(logFile),
    terminal: false
  }).on('line', function(line) {
    var time = line.substring(0, line.lastIndexOf(" "));
    var datetime = new Date(time)
    var action = line.substring(line.lastIndexOf(" ") + 1);
    if (action == "startMeditation") startMeditationTime = datetime.getTime()
    if (datetime.getDate() == tab_date.getDate()) {
      var action_cn = _actionInChinese(action)
      var datetime_cn = datetimeInChinese(datetime)
      if (action == "stopMeditation") {
        var durationInMinutes = Math.floor((datetime.getTime() - startMeditationTime) / (60 * 1000))
        action_cn = action_cn + "，历时" + durationInMinutes + "分"
      }

      console.log(datetime_cn + action_cn)
      actions.push({time:datetime_cn, action:action_cn,timestamp:datetime.getTime()})
    }
  }).on('close', function(){
    console.log(actions)
    onClose(actions)
  });
};

function handleAction(action) {
  if (action == "startMeditation" || action == "stopMeditation") {
    _AddAction(action)
  } else if (action == cancelToken) {
    _removeLastAction()
  }
}

function mergeActions(a, b) {
  var c = [];
  while(a.length && b.length){
    if(b[0].timestamp <= a[0].timestamp) c.push(b.shift());
    else c.push(a.shift());
  }
  if(a.length) c = c.concat(a);
  if(b.length) c = c.concat(b);
  return c;
}

function isMeditating() {
  var data = fs.readFileSync(actionLogFile, 'utf-8');
  var lines = data.trim().split('\n');

  if (lines.length > 0) {
    var lastLine = lines.slice(-1)[0];
    console.log(lastLine)
    if (lastLine.indexOf("startMeditation") > -1) {
      console.log("Meditating=yes")
      return true
    }
  }
  console.log("Meditating=false")
  return false
}

exports.getActions = getActions
exports.handleAction = handleAction
exports.mergeActions = mergeActions
exports.cancelToken = cancelToken
exports.isMeditating = isMeditating
