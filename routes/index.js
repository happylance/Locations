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
  var time_cn = time_prefix_cn + String(hour) + "点" + pad(datetime.getMinutes(), 2) + "分"
  var datetime_cn = date_cn + time_cn
  console.log('time: ' + datetime_cn);
  return datetime_cn
}

function locationInChinese(distanceInMeters) {
  console.log('location: ' + distanceInMeters);

  var location_cn = "离家" + distanceInMeters + "米"
  if (distanceInMeters < 30) location_cn = "在家"
  return location_cn
}

/* GET home page. */
router.get('/1', function(req, res, next) {
  //res.render('index', { title: 'Express' });
  var locations = [];
  var filename = 'public/locations.log';
  readline.createInterface({
    input: fs.createReadStream(filename),
    terminal: false
  }).on('line', function(line) {
    var location = line.substring(line.lastIndexOf(":") + 2, line.lastIndexOf(" "));
    console.log('location: ' + location);

    var time = line.substring(0, line.lastIndexOf(":"));
    console.log('time: ' + time);
    locations.splice(0, 0, {time:time, location:location})
  }).on('close', function(){
      res.render('index', {locations:locations});
    });
});

router.get('/', function(req, res, next) {
  //res.render('index', { title: 'Express' });
  var locations = [];
  var filename = 'public/locations.log';
  readline.createInterface({
    input: fs.createReadStream(filename),
    terminal: false
  }).on('line', function(line) {
    var distanceInMeters = line.substring(line.lastIndexOf(" ") + 1);
    var location_cn = locationInChinese(distanceInMeters)

    var time = line.substring(0, line.lastIndexOf(":"));
    var datetime_cn = datetimeInChinese(new Date(time))
    locations.splice(0, 0, {time:datetime_cn, location:location_cn})
  }).on('close', function(){
      var now_cn = datetimeInChinese(new Date())
      var update_time = "更新于北京时间" + now_cn
      res.render('layout', {locations:locations, update_time:update_time});
    });
});

module.exports = router;
