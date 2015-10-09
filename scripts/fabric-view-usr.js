// author: InMon Corp.
// version: 1.0
// date: 10/8/2015
// description: Fabric View - Custom TopN module
// copyright: Copyright (c) 2015 InMon Corp. ALL RIGHTS RESERVED

include(scriptdir() + '/inc/common.js');

var SEP = '_SEP_';

function escapeRegExp(str) {
  // Rhino doesn't convert Java strings into native JavaScript strings
  var str = new String(str);
  return str ? str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&") : null;
}

var userFlows = {};
var specID = 0;
function flowSpecName(keys,value,filter) {
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
      setFlow(name,{keys:keysStr, value:valueStr, filter: filterStr.length > 0 ? filterStr : null, t:flow_timeout, n:10, fs:SEP});
      entry = {name:name};
      userFlows[key] = entry;
      specID++;
    } catch(e) {
      entry = null;
    }
  }
  if(!entry) return null;
  entry.lastQuery = (new Date()).getTime();

  return entry.name;
}

function deleteUserFlows(now) {
  var key, entry;
  for(key in userFlows) {
    entry = userFlows[key];
    if(now - entry.lastQuery > 10000) {
      clearFlow(entry.name);
      delete userFlows[key];
    }
  }
}

setIntervalHandler(function() {
  var now = (new Date()).getTime();
  deleteUserFlows(now);
},5);

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
  var result, key, name, path = req.path;
  if(!path || path.length === 0) throw "not_found";
     
  switch(path[0]) {
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
      name = flowSpecName(req.query['keys'],req.query['value'],req.query['filter']);
      if(!name) throw 'bad_request';
      result = activeFlows('TOPOLOGY',name,20,1,'edge');
      break;
    default: throw 'not_found';
  } 
  return result;
});

