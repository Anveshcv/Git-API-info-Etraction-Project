var moment = require("moment");
var momentDurationFormatSetup = require("moment-duration-format")

var now  = "2015-07-16T16:33:39.113Z";
var then = "2015-06-16T22:33:39.113Z";

var ms = moment(now,"YYYY-MM-DD'T'HH:mm:ss:SSSZ").diff(moment(then,"YYYY-MM-DD'T'HH:mm:ss:SSSZ"));
var d = moment.duration(ms);
var s = d.format("dd:hh:mm:ss");
console.log(s);