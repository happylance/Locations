exports = module.exports = {}
var fs = require('fs')
var readline = require('readline');
var dateUtil = require('./dateUtil')
var moment = require('moment-timezone')

const locationLogFile = 'data/locations.log';

function _distanceInChinese(distanceInMeters) {
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

function getLocations(tab_date, onClose) {
  var distances = [];
  var locations = [];
  readline.createInterface({
    input: fs.createReadStream(locationLogFile),
    terminal: false
  }).on('line', function(line) {
    var time = line.substring(0, line.lastIndexOf(":"));
    var datetime = new Date(time)
    if (datetime.getDate() == tab_date.getDate()) {
      var distanceInMeters = line.substring(line.lastIndexOf(" ") + 1);
      var distance_cn = _distanceInChinese(distanceInMeters)

      var location = line.substring(line.lastIndexOf(":") + 2, line.lastIndexOf(" "));

      var datetime_cn = dateUtil.datetimeInChinese(moment(datetime).valueOf() / 1000, "Asia/Shanghai", false)
      console.log(datetime_cn + distance_cn)
      locations.push({time:datetime_cn, distance:distance_cn, location:location, timestamp:datetime.getTime()})
    }
  }).on('close', function(){
    onClose(locations)
  });
};

exports.getLocations = getLocations
