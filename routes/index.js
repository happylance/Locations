var express = require('express');
var router = express.Router();

var dateUtil = require('../lib/dateUtil')
var dayInChinese = dateUtil.dayInChinese
var datetimeInChinese = dateUtil.datetimeInChinese

var action = require('../lib/action')
var getLocations = require('../lib/location').getLocations
var addAccessLog = require('../lib/log').addAccessLog

function router_get(req, res, tab_id) {
  var today = new Date()
  var tab_date = new Date(today.getTime() - 86400 * 1000 * tab_id)

  addAccessLog(req, tab_id)

  getLocations(tab_date, function(locations) {
    action.getActions(tab_date, function(actions) {
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
      var cancel = "";
      if (req.query.action && req.query.action == "cancel") {
        cancel = action.cancelToken
      } else if (req.query.action && req.query.action == action.cancelToken) {
        redirectUrl = "http://" + req.headers.host + '/'
        console.log(redirectUrl)
        res.redirect(redirectUrl)
        return
      } else {
        actions = action.mergeActions(actionsFromLocations(locations), actions)
      }
      res.render('index', {locations:locations, actions:actions, update_time:update_time,
        currentURL:"/" + tab_id, titles:titles, cancel:cancel});
    });
  });
}

function actionsFromLocations(locations) {
  return locations.map(function(location) {
    return {time:location.time, action:location.distance,timestamp:location.timestamp};
  })
}

router.get('/', function(req, res, next) {
  if (req.query.action) {
    action.handleAction(req.query.action)
  }

  router_get(req, res, 0)
});

router.get('/meditating', function(req, res, next) {
  var isMeditating = action.isMeditating()
  res.send({meditating:isMeditating})
  return
});

// https://tanyanam.com/2012/06/27/tabbed-navigation-with-jade-and-node-js/
router.get('/:tab_id', function(req, res, next) {
  var tab_id = req.params.tab_id;
  router_get(req, res, tab_id)
});

module.exports = router;
