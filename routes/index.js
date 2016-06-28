var express = require('express');
var router = express.Router();
var fs = require('fs')
var readline = require('readline');

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
  if (hour < 6) time_prefix_cn = "凌晨"
  if (hour > 17) time_prefix_cn = "晚上"
  hour = hour > 12 ? hour - 12 : hour
  hour = hour == 0 ? hour = 12 : hour
  var time_cn = time_prefix_cn + String(hour) + ":" + pad(datetime.getMinutes(), 2)
  var datetime_cn = date_cn + time_cn
  console.log('time: ' + datetime_cn);
  return datetime_cn
}

function distanceInChinese(distanceInMeters) {
  console.log('location: ' + distanceInMeters);
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

function router_get(req, res, tab_id) {
  var distances = [];
  var locations = [];
  var filename = 'data/locations.log';
  var today = new Date()
  var tab_date = new Date(today.getTime() - 86400 * 1000 * tab_id)
  readline.createInterface({
    input: fs.createReadStream(filename),
    terminal: false
  }).on('line', function(line) {
    var distanceInMeters = line.substring(line.lastIndexOf(" ") + 1);
    var distance_cn = distanceInChinese(distanceInMeters)

    var location = line.substring(line.lastIndexOf(":") + 2, line.lastIndexOf(" "));

    var time = line.substring(0, line.lastIndexOf(":"));
    var datetime = new Date(time)
    if (datetime.getDate() == tab_date.getDate()) {
      var datetime_cn = datetimeInChinese(datetime)
      locations.push({time:datetime_cn, distance:distance_cn, location:location})
    }
  }).on('close', function(){
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
      res.render('index', {locations:locations, update_time:update_time, currentURL:"/" + tab_id, titles:titles});
    });
}

router.get('/', function(req, res, next) {
  router_get(req, res, 0)
});

// https://tanyanam.com/2012/06/27/tabbed-navigation-with-jade-and-node-js/
router.get('/:tab_id', function(req, res, next) {
  var tab_id = req.params.tab_id;
  router_get(req, res, tab_id)
});

module.exports = router;
