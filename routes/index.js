var express = require('express');
var router = express.Router();
var fs = require('fs')
var readline = require('readline');

function handleClick(e) {
  console.log('Clicked at position', e.latLng);
}

function pad(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}

function datetimeInChinese(datetime) {
  datetime = new Date(datetime.getTime() + (datetime.getTimezoneOffset() + 8 * 60) * 60 * 1000)
  var date_cn = String(datetime.getMonth() + 1) + "月" + String(datetime.getDate()) + "日"
  var hour = datetime.getHours()
  var time_prefix_cn = hour < 12 ? "上午" : "下午"
  if (hour < 6) time_prefix_cn = "凌晨"
  if (hour > 17) time_prefix_cn = "晚上"
  hour = hour > 12 ? hour - 12 : hour
  var time_cn = time_prefix_cn + String(hour) + ":" + pad(datetime.getMinutes(), 2)
  var datetime_cn = date_cn + time_cn
  console.log('time: ' + datetime_cn);
  return datetime_cn
}

function locationInChinese(distanceInMeters) {
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

/* GET home page. */
router.get('/1', function(req, res, next) {
  //res.render('index', { title: 'Express' });
  var locations = [];
  var filename = 'public/locations.log';
  var today = new Date().getDate()
  readline.createInterface({
    input: fs.createReadStream(filename),
    terminal: false
  }).on('line', function(line) {
    var location = line.substring(line.lastIndexOf(":") + 2, line.lastIndexOf(" "));
    console.log('location: ' + location);

    var time = line.substring(0, line.lastIndexOf(":"));
    console.log('time: ' + time);
    var datetime = new Date(time)
    if (datetime.getDate() == today) {
      locations.push({time:time, location:location})
    }
  }).on('close', function(){
      res.render('index', {locations:locations});
    });
});

router.get('/', function(req, res, next) {
  var locations = [];
  var filename = 'public/locations.log';
  var today = new Date().getDate()
  readline.createInterface({
    input: fs.createReadStream(filename),
    terminal: false
  }).on('line', function(line) {
    var distanceInMeters = line.substring(line.lastIndexOf(" ") + 1);
    var location_cn = locationInChinese(distanceInMeters)

    var time = line.substring(0, line.lastIndexOf(":"));
    var datetime = new Date(time)
    if (datetime.getDate() == today) {
      var datetime_cn = datetimeInChinese(datetime)
      locations.push({time:datetime_cn, location:location_cn})
    }
  }).on('close', function(){
      var now_cn = datetimeInChinese(new Date())
      var update_time = "更新于北京时间" + now_cn
      res.render('layout', {locations:locations, update_time:update_time});
    });
});

module.exports = router;
