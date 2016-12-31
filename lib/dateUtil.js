exports = module.exports = {}

function _pad(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}

var dayInChinese = function(day) {
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

var datetimeInChinese = function(datetime) {
  datetime = new Date(datetime.getTime() + (datetime.getTimezoneOffset() + 8 * 60) * 60 * 1000)
  var date_cn = "周" + dayInChinese(datetime.getDay())
  var hour = datetime.getHours()
  var time_prefix_cn = hour < 12 ? "上午" : "下午"
  if (hour < 8) time_prefix_cn = "早上"
  if (hour < 4) time_prefix_cn = "凌晨"
  if (hour > 17) time_prefix_cn = "晚上"
  hour = hour > 12 ? hour - 12 : hour
  hour = hour == 0 ? hour = 12 : hour
  var time_cn = time_prefix_cn + String(hour) + ":" + _pad(datetime.getMinutes(), 2)
  var datetime_cn = date_cn + time_cn
  return datetime_cn
}

function datetimeInEnglish(datetime) {
  var date_en = datetime.toDateString()
  var time_en = datetime.toLocaleTimeString()
  var datetime_en = date_en + ' ' + time_en
  return datetime_en
}

exports.dayInChinese = dayInChinese
exports.datetimeInChinese = datetimeInChinese
exports.datetimeInEnglish = datetimeInEnglish
