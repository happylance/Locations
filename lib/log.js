exports = module.exports = {}
var fs = require('fs')
var readline = require('readline');
var datetimeInEnglish = require('./dateUtil').datetimeInEnglish
const accessLogFile = './map.log'
const output = fs.createWriteStream(accessLogFile, {'flags': 'a'});

// Get client IP address from request object ----------------------
_getClientAddress = function (req) {
  var addr =  (req.headers['x-forwarded-for'] || '').split(',')[0] || req.connection.remoteAddress;
  addr = addr.replace(/::ffff:/, '')
  console.log(addr)
  return addr
};

function _addLog(req_log) {
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

function addAccessLog(req, tab_id) {
  var user_agent = req.headers['user-agent']
  user_agent = user_agent.replace(/Mozilla\/5\.0 \(/, "")
  user_agent = user_agent.replace(/like Mac OS X\) AppleWebKit\/601\.1\.46 \(KHTML, like Gecko\) Mobile\/13F69/, "")
  user_agent = user_agent.replace(/; CPU.*OS/, "")
  var today = new Date()
  var req_log = datetimeInEnglish(today) + ' ' + String(tab_id) + ' ' +
    _getClientAddress(req) + ' ' + user_agent
  console.log(req_log)
  _addLog(req_log)
}

exports.addAccessLog = addAccessLog
