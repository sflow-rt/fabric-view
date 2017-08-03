// author: InMon Corp.
// version: 2.0
// date: 8/2/2017
// description: Fabric View - Custom TopN module
// copyright: Copyright (c) 2017 InMon Corp. ALL RIGHTS RESERVED

include(scriptdir()+'/inc/common.js');
include(scriptdir()+'/inc/trend.js');

var SEP = '_SEP_';

var userFlows = {};
var maxFlows = 10;

function escapeRegExp(str) {
  // seems like a bug - Rhino doesn't convert Java strings into native JavaScript strings
  str = new String(str);
  return str ? str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&") : null;
}

var specID = 0;
function flowSpec(keys,value,filter) {
  var keysStr = keys ? keys.join(',') : '';
  var valueStr = value ? value.join(',') : '';
  var filterStr = filter ? filter.join('&') : '';

  if(keysStr.length === 0 || valueStr.length === 0) return null;

  var key = keysStr || '';
  if(valueStr) key += '#' + valueStr;
  if(filterStr) key += '#' + filterStr;
  var entry = userFlows[key];
  if(!entry) {
    // try to create flow
    var name = 'fv-' + specID;
    try {
      setFlow(name,{keys:keysStr, value:valueStr, filter: filterStr.length > 0 ? filterStr : null, t:flow_timeout, n:maxFlows, fs:SEP});
      entry = {name:name, trend: new Trend(300,1)};
      entry.trend.addPoints({topn:{}});
      userFlows[key] = entry;
      specID++;
    } catch(e) {
      entry = null;
    }
  }
  if(!entry) return null;
  entry.lastQuery = (new Date()).getTime();

  return entry;
}

setIntervalHandler(function() {
  var key, entry, top, topN, i, now = (new Date()).getTime();
  for(key in userFlows) {
    entry = userFlows[key];
    if(now - entry.lastQuery > 10000) {
      clearFlow(entry.name);
      delete userFlows[key];
    } else {
      topN = {};
      top = activeFlows('TOPOLOGY',entry.name,maxFlows,1,'edge');
      if(top) {
        for(i = 0; i < top.length; i++) {
          topN[top[i].key] = top[i].value;
        }
      }
      entry.trend.addPoints({topn:topN}); 
    }
  }
},1);

function validShortcuts(obj) {
  if(!Array.isArray(obj)) return false;
  var attrs = ['category','protocol','description','keys','value','filter'];
  for(var i = 0; i < obj.length; i++) {
    let shortcut = obj[i];
    for(var j = 0; j < attrs.length; j++) {
      let attr = attrs[j];
      if(!shortcut.hasOwnProperty(attr)) return false;
      if(typeof shortcut[attr] !== 'string') return false;
    }
  }
  return true;
}

setHttpHandler(function(req) {
  var result, trend, key, entry, path = req.path;
  if(!path || path.length === 0) throw "not_found";
     
  switch(path[0]) {
  case 'shortcuts':
    if(path.length > 1) throw "not_found";
    switch(req.method) {
    case 'POST':
    case 'PUT':
      if(req.error) throw "bad_request";
      if(!validShortcuts(req.body)) throw "bad_request";
        shortcuts = req.body;
	storeSet('shortcuts', shortcuts);
	break;
    default: return shortcuts;
    }
    break;
  case 'flowkeys':
    if(path.length > 1) throw "not_found";
    result = [];
    var search = req.query['search'];
    if(search) {
      var matcher = new RegExp('^' + escapeRegExp(search), 'i');
      for(key in flowKeys()) {
        if(matcher.test(key)) result.push(key);
      }
    } else {
      for(key in flowKeys()) result.push(key);
    }
    result.sort();
    break;
  case 'flows':
    if(path.length > 1) throw "not_found";
    entry = flowSpec(req.query['keys'],req.query['value'],req.query['filter']);
    if(!entry) throw 'bad_request';
    trend = entry.trend;
    result = {};
    result.trend = req.query.after ? trend.after(parseInt(req.query.after)) : trend;
    break;
  default: throw 'not_found';
  } 
  return result;
});

