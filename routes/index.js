var express = require('express');
var router = express.Router();
var fs = require('fs')
var readline = require('readline');
var moment = require('moment')

const Console = require('console').Console;
const output = fs.createWriteStream('./map.log', {'flags': 'a'});
// custom simple logger
const logger = new Console(output, output);


function pad(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}

function dayInChinese(day) {
  switch(day){
    case 0:
        return "日";
    case 1:
        return "一";
    case 2:
        return "二";
    case 3:
        return "三";
    case 4:
        return "四";
    case 5:
        return "五";
    case 6:
        return "六";
    default:
        return "";
  }
}

function datetimeInChinese(datetime) {
  datetime = new Date(datetime.getTime() + (datetime.getTimezoneOffset() + 8 * 60) * 60 * 1000)
  var date_cn = "周" + dayInChinese(datetime.getDay())
  var hour = datetime.getHours()
  var time_prefix_cn = hour < 12 ? "上午" : "下午"
  if (hour < 8) time_prefix_cn = "早上"
  if (hour < 4) time_prefix_cn = "凌晨"
  if (hour > 17) time_prefix_cn = "晚上"
  hour = hour > 12 ? hour - 12 : hour
  hour = hour == 0 ? hour = 12 : hour
  var time_cn = time_prefix_cn + String(hour) + ":" + pad(datetime.getMinutes(), 2)
  var datetime_cn = date_cn + time_cn
  return datetime_cn
}

function datetimeInEnglish(datetime) {
  var date_en = datetime.toDateString()
  var time_en = datetime.toLocaleTimeString()
  var datetime_en = date_en + ' ' + time_en
  return datetime_en
}

function distanceInChinese(distanceInMeters) {
  if (distanceInMeters < 30)
    return "在家"

  var distance_cn = distanceInMeters + "米"
  if (distanceInMeters >= 500) {
    var distanceInQuarterKM = Math.round(distanceInMeters / 250)
    var distanceInLi = Math.floor(distanceInQuarterKM / 2)
    distance_cn = distanceInLi + "里"
    if(distanceInQuarterKM % 2 == 1) {
      distance_cn += "半"
    }
  }

  var location_cn = "离家" + distance_cn
  return location_cn
}

function actionInChinese(action) {
  switch (action) {
    case "startMeditation":
      return "开始打坐"
    case "stopMeditation":
      return "打坐完毕"
    default:
      return "";
  }
}
// Get client IP address from request object ----------------------
getClientAddress = function (req) {
  var addr =  (req.headers['x-forwarded-for'] || '').split(',')[0] || req.connection.remoteAddress;
  addr = addr.replace(/::ffff:/, '')
  console.log(addr)
  return addr
};

function getLocations(logFile, tab_date, onClose) {
  var distances = [];
  var locations = [];
  readline.createInterface({
    input: fs.createReadStream(logFile),
    terminal: false
  }).on('line', function(line) {
    var time = line.substring(0, line.lastIndexOf(":"));
    var datetime = new Date(time)
    if (datetime.getDate() == tab_date.getDate()) {
      var distanceInMeters = line.substring(line.lastIndexOf(" ") + 1);
      var distance_cn = distanceInChinese(distanceInMeters)

      var location = line.substring(line.lastIndexOf(":") + 2, line.lastIndexOf(" "));

      var datetime_cn = datetimeInChinese(datetime)
      console.log(datetime_cn + distance_cn)
      locations.push({time:datetime_cn, distance:distance_cn, location:location, timestamp:datetime.getTime()})
    }
  }).on('close', function(){
    onClose(locations)
  });
};

function getActions(logFile, tab_date, onClose) {
  var actions = [];
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
      var action_cn = actionInChinese(action)
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

function addLogToFile(req_log, accessLogFile) {
  fs.appendFile(accessLogFile, '\n' + req_log, function (err) {
    if (err) {
      console.log(err)
    }
  });

  var today = new Date()
  function isLessThan3DaysOld(log) {
    var time = log.split(' ').slice(0,5)
    var datetime = new Date(time)
    return datetime.getTime() > (today - 3 * 86400 * 1000)
  }

  fs.readFile(accessLogFile, function(err, data) { // read file to memory
    if (!err) {
        data = data.toString(); // stringify buffer
        var mapLogs = data.split('\n')
        var recentMapLogs = mapLogs.filter(isLessThan3DaysOld)
        if (mapLogs.length == recentMapLogs.length) {
          return
        }

        var newLog = recentMapLogs.join('\n')
        fs.writeFile(accessLogFile, newLog, function(err) { // write file
            if (err) { // if error, report
                console.log (err);
            }
        });
    } else {
        console.log(err);
    }
  });
}
function router_get(req, res, tab_id) {
  var locationLogFile = 'data/locations.log';
  var actionLogFile = 'data/actions.log';
  var accessLogFile = './map.log'
  var today = new Date()
  var tab_date = new Date(today.getTime() - 86400 * 1000 * tab_id)

  var user_agent = req.headers['user-agent']
  user_agent = user_agent.replace(/Mozilla\/5\.0 \(/, "")
  user_agent = user_agent.replace(/like Mac OS X\) AppleWebKit\/601\.1\.46 \(KHTML, like Gecko\) Mobile\/13F69/, "")
  user_agent = user_agent.replace(/; CPU.*OS/, "")
  var req_log = datetimeInEnglish(today) + ' ' + String(tab_id) + ' ' +
    getClientAddress(req) + ' ' + user_agent
  console.log(req_log)
  addLogToFile(req_log, accessLogFile)

  getLocations(locationLogFile, tab_date, function(locations) {
    getActions(actionLogFile, tab_date, function(actions) {
      var now_cn = datetimeInChinese(new Date())
      var update_time = "更新于北京时间" + now_cn
      var today_day = today.getDay()
      var tab_count = 7
      var titles = []
      for (var i = 0; i < tab_count; i++) {
          var day = today_day - i
          if (day < 0) day += 7
          var day_cn = "周" + dayInChinese(day)
          titles.push(day_cn)
      }
      console.log(update_time)
      actions = mergeActions(actionsFromLocations(locations), actions)
      res.render('index', {locations:locations, actions:actions, update_time:update_time, currentURL:"/" + tab_id, titles:titles});
    });
  });
}

function actionsFromLocations(locations) {
  return locations.map(function(location) {
    return {time:location.time, action:location.distance,timestamp:location.timestamp};
  })
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

function AddAction(actionString) {
  var actionLogFile = 'data/actions.log';
  var now = moment().format("YYYY-MM-DD hh:mm:ss A")
  var newAction = now + ' ' + actionString
  console.log(newAction)
  fs.appendFile(actionLogFile, '\n' + newAction, function (err) {
    if (err) {
      console.log(err)
    }
  });
}

function removeLastLine(lines) {
  if(lines.lastIndexOf("\n")>0) {
    return lines.substring(0, lines.lastIndexOf("\n"));
  } else {
    return "";
  }
}

function removeLastAction() {
  var actionLogFile = 'data/actions.log';
  var data = fs.readFileSync(actionLogFile, 'utf-8');
  var newData = removeLastLine(data);
  fs.writeFileSync(actionLogFile, newData, 'utf-8');
  console.log('Removed last action');
}


function handleAction(action) {
  if (action == "startMeditation" || action == "stopMeditation") {
    AddAction(action)
  } else if (action == "cancel") {
    removeLastAction()
  }
}

router.get('/', function(req, res, next) {
  if (req.query.action) {
    handleAction(req.query.action)
  }

  router_get(req, res, 0)
});

// https://tanyanam.com/2012/06/27/tabbed-navigation-with-jade-and-node-js/
router.get('/:tab_id', function(req, res, next) {
  var tab_id = req.params.tab_id;
  router_get(req, res, tab_id)
});

module.exports = router;
