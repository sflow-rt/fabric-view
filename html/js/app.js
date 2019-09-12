$(function() { 
  var restPath =  '../scripts/fabric-view.js/';
  var dataURL = restPath + 'view/json';
  var shortcutsURL = restPath + 'shortcuts/json';
  var topologyInfoURL = restPath + 'topology/info/json';
  var topologyURL = restPath + 'topology/json';
  var groupsInfoURL = restPath + 'groups/info/json';
  var groupsURL = restPath + 'groups/json';
  var thresholdsURL = restPath + 'thresholds/json';
  var linksURL = restPath + 'links/json';
  var nodesURL = restPath + 'nodes/json';
  var hostsURL = restPath + 'hosts/json';
  var versionURL = restPath + 'version/json';

  var usrPath = '../scripts/fabric-view-usr.js/';
  var keysURL =  usrPath + 'flowkeys/json';
  var topURL = usrPath + 'flows/json';

  var colors = $.inmon.stripchart.prototype.options.colors;

  var SEP = '_SEP_';
  var defaults = {
    tab:0,
    perf0:'show',
    perf1:'hide',
    perf2:'hide',
    perf3:'hide',
    perf4:'hide',
    perf5:'hide',
    ports0:'show',
    ports1:'show',
    ports2:'show',
    traf0:'show',
    traf1:'hide',
    traf2:'hide',
    traf3:'hide',
    hlp0:'hide',
    hlp1:'hide',
    hlp2:'hide',
    hlp3:'hide',
    hlp4:'hide',
    hlp5:'hide',
    hlp6:'hide',
    hlp7:'hide',
    hlp8:'hide',
    hlp9:'hide',
    hlp10:'hide',
    hlp11:'hide',
    keys:'',
    value:'',
    filter:'',
    topshow:25,
    swishow:25,
    lnkshow:25,
    hstshow:25
  };

  var state = {};
  $.extend(state,defaults);
        
  function nf(value,fix) {
    var suffixes = ["\u00B5", "m", "", "K", "M", "G", "T", "P", "E"];
    if (value === 0) return value;
    var i = 2;
    var divisor = 1;
    var factor = 1000;
    var absVal, scaled;
    absVal = Math.abs(value);
    while (i < suffixes.length) {
      if ((absVal / divisor) < factor) break;
      divisor *= factor;
      i++;
    }
    scaled = Math.round(absVal * factor / divisor) / factor;
    if(fix) scaled = scaled.toFixed(fix);
    return scaled + suffixes[i];
  };

  function createQuery(params) {
    var query, key, value;
    for(key in params) {
      value = params[key];
      if(value == defaults[key]) continue;
      if(query) query += '&';
      else query = '';
      query += encodeURIComponent(key)+'='+encodeURIComponent(value);
    }
    return query;
  }

  function getState(key, defVal) {
    return window.sessionStorage.getItem('fv_'+key) || state[key] || defVal;
  }

  function setState(key, val, showQuery) {
    state[key] = val;
    window.sessionStorage.setItem('fv_'+key, val);
    if(showQuery) {
      var query = createQuery(state);
      window.history.replaceState({},'',query ? '?' + query : './');
    }
  }

  function setQueryParams(query) {
    var vars, params, i, pair;
    vars = query.split('&');
    params = {};
    for(i = 0; i < vars.length; i++) {
      pair = vars[i].split('=');
      if(pair.length == 2) setState(decodeURIComponent(pair[0]), decodeURIComponent(pair[1]),false);
    }
  }

  var search = window.location.search;
  if(search) setQueryParams(search.substring(1));

  $('#performance-acc > div').each(function(idx) {
    $(this).accordion({
      heightStyle:'content',
      collapsible: true,
      active: getState('perf'+idx, 'hide') === 'show' ? 0 : false,
      activate: function(event, ui) {
        var newIndex = $(this).accordion('option','active');
        setState('perf'+idx, newIndex === 0 ? 'show' : 'hide', true);
        $.event.trigger({type:'updateChart'});
      }
    });
  });

  $('#ports-acc > div').each(function(idx) {
    $(this).accordion({
      heightStyle:'content',
      collapsible: true,
      active: getState('ports'+idx, 'hide') == 'show' ? 0 : false,
      activate: function(event, ui) {
        var newIndex = $(this).accordion('option','active');
        setState('ports'+idx, newIndex === 0 ? 'show' : 'hide', true);
        $.event.trigger({type:'updateChart'});
      }
    });
  });

  $('#traffic-acc > div').each(function(idx) {
    $(this).accordion({
      heightStyle:'content',
      collapsible: true,
      active: getState('traf'+idx, 'hide') === 'show' ? 0 : false,
      activate: function(event, ui) {
        var newIndex = $(this).accordion('option','active');
        setState('traf'+idx, newIndex === 0 ? 'show' : 'hide', true);
        $.event.trigger({type:'updateChart'});
      }
    });
  });

  $('#help-acc > div').each(function(idx) {
    $(this).accordion({
      heightStyle:'content',
      collapsible: true,
      active: getState('hlp'+idx, 'hide') === 'show' ? 0 : false,
      activate: function(event, ui) {
        var newIndex = $(this).accordion('option','active');
        setState('hlp'+idx, newIndex === 0 ? 'show' : 'hide', true);
      }
    });
  });
        
  $('#tabs').tabs({
    active: getState('tab', 0),
    activate: function(event, ui) {
      var newIndex = ui.newTab.index();
      setState('tab', newIndex, true);
      if(newIndex == 2) $.event.trigger({type:'updateTopN'});
      else if(newIndex < 2) $.event.trigger({type:'updateChart'});
    },
    create: function(event,ui) {
      var idx = ui.tab.index();
      if(idx == 2) $.event.trigger({type:'updateTopN'});
      else if(idx < 2) $.event.trigger({type:'updateChart'});
    }
  });

  $('#clone_button').button({icons:{primary:'ui-icon-newwin'},text:false}).click(function() {
    window.open(window.location);
  }); 

  // define charts

  var db = {};

  // Performance charts (type:trend)
  $('#total').chart({
    type: 'trend',
    metrics: ['elephant_bps','mice_bps'],
    stack:true,
    legend:['Elephants','Mice'],
    units: 'Bits per Second'},
  db);
  $('#total_fps').chart({
    type: 'trend',
    metrics: ['edge_fps'],
    stack:true,
    units: 'Frames per Second'},
  db);
  $('#elephants-mice').chart( {
    type: 'trend',
    metrics: ['elephant_bps'],
    stack:true,
    units: 'Bits per Second' },
  db);
  $('#arrivals-departures').chart( {
    type: 'trend',
    metrics:['elephant_arrivals','elephant_departures'],
    stack:false,
    legend: ['Arrivals','Departures'],
    colors: [colors[3],colors[4]],
    units: 'Flows per Second' },
  db);
  $('#current').chart( {
    type: 'trend',
    metrics:['elephant_current'],
    stack:true,
    units: 'Number of Flows' },
  db);
  $('#congested-links').chart( {
    type:'trend',
    stack:true,
    metrics:['busy_links_elephant','busy_links_mice','busy_links_collision'],
    legend:['Elephant','Mice','Collision'],
    units:'Number of Links'},
  db);
  $('#discards').chart( {
    type:'trend',
    metrics:['discards'],
    legend:['Discards'],
    units:'Packets per Second'},
  db);      
  $('#errors').chart( {
    type:'trend',
    metrics:['errors'],
    legend:['Errors'],
    units:'Packets per Second'},
  db);
  $('#duration').chart( {
    type:'trend',
    metrics:['elephant_flow_duration'],
    units:'Seconds'},
  db);
  $('#rate').chart({
    type:'trend',
    metrics:['elephant_flow_rate'],
    units:'Bits per Second'},
  db);
  $('#cpu').chart({
    type: 'trend',
    legend: ['CPU Utilization','Load per Core','Memory Utilization','Disk Utilization','Disk Partition Utilization'],
    metrics:['cpu_util','load_per_cpu','mem_util','disk_util','part_max_util'],
    units: 'Percentage'},
  db);
  $('#fwd').chart({
    type: 'trend',
    legend: ['Host Table','MAC Table','IPv4 Table','IPv6 Table','IPv4/IPv6 Table','Long IPv6 Table','Total Routes','ECMP Nexthops Table'],
    metrics:['hw_host_util','hw_mac_util','hw_ipv4_util','hw_ipv6_util','hw_ipv4_ipv6_util','hw_ipv6_long_util','hw_total_routes_util','hw_ecmp_nexthops_util'],
    units: 'Percentage'},
  db);
  $('#acl').chart({
    type: 'trend',
    legend: ['ACL Ingress Table','ACL Ingress Meters Table','ACL Ingress Counters Table','ACL Egress Table','ACL Egress Meters Table','ACL Egress Counters Table'],
    metrics:['hw_acl_ingress_util','hw_acl_ingress_meters_util','hw_acl_ingress_counters_util','hw_acl_egress_util','hw_acl_egress_meters_util','hw_acl_egress_counters_util'],
    units: 'Percentage'},
  db);

  // Top port charts (type: topn)
  $('#utilizationin').chart({
    type: 'topn',
    metric: 'top-5-inutilization',
    legendHeadings:['Switch','Ingress Port'],
    stack: false,
    includeOther:false,
    sep: SEP,
    units: '% Utilization'},
  db);
  $('#utilizationout').chart({
    type: 'topn',
    metric: 'top-5-oututilization',
    legendHeadings:['Switch','Egress Port'],
    stack: false,
    includeOther:false,
    sep: SEP,
    units: '% Utilization'},
  db);
  $('#discardsin').chart({
    type: 'topn',
    metric: 'top-5-indiscards',
    legendHeadings:['Switch','Ingress Port'],
    stack: false,
    includeOther:false,
    sep: SEP,
    units: 'Frames per Second'},
  db);
  $('#discardsout').chart({
    type: 'topn',
    metric: 'top-5-outdiscards',
    legendHeadings:['Switch','Egress Port'],
    stack: false,
    includeOther:false,
    sep: SEP,
    units: 'Frames per Second'},
  db);
  $('#errorsin').chart({
    type: 'topn',
    metric: 'top-5-inerrors',
    legendHeadings:['Switch','Ingress Port'],
    stack: false,
    includeOther:false,
    sep: SEP,
    units: 'Frames per Second'},
  db);
  $('#errorsout').chart({
    type: 'topn',
    metric: 'top-5-outerrors',
    legendHeadings:['Switch','Egress Port'],
    stack: false,
    includeOther:false,
    sep: SEP,
    units: 'Frames per Second'},
  db);

  // Traffic charts (type:topn)
  $('#topprotocols').chart( {
    type: 'topn',
    stack: true,
    includeOther:false,
    metric: 'top-5-stack',
    legendHeadings: ['Protocol Stack'],
    units: 'Bits per Second'},
  db);
  $('#topsources' ).chart( {
    type: 'topn',
    stack: true,
    includeOther: false,
    metric:'top-5-sources',
    legendHeadings: ['Source'],
    units: 'Bits per Second'},
  db);
  $('#topdestinations' ).chart({
    type: 'topn',
    stack: true,
    includeOther: false,
    metric:'top-5-destinations',
    legendHeadings: ['Destination'],
    units: 'Bits per Second'},
  db);
  $('#toppairs').chart( {
    type: 'topn',
    stack: true,
    includeOther:false,
    metric:'top-5-pairs',
    legendHeadings: ['Source','Destination'],
    units: 'Bits per Second'},
  db);   
  $('#topsourcegroups' ).chart( {
    type: 'topn',
    stack: true,
    includeOther: false,
    metric:'top-5-sourcegroups',
    legendHeadings: ['Source Groups'],
    units: 'Bits per Second'},
  db);
  $('#topdestinationgroups' ).chart( {
    type: 'topn',
    stack: true,
    includeOther: false,
    metric:'top-5-destinationgroups',
    legendHeadings: ['Destination Groups'],
    units: 'Bits per Second'},
  db);
  $('#topgrouppairs').chart( {
    type: 'topn',
    stack: true,
    includeOther: false,
    metric:'top-5-grouppairs',
    legendHeadings: ['Source Group','Destination Group'],
    units: 'Bits per Second'},
  db);
  $('#topflows').chart( {
    type: 'topn',
    stack: true,
    includeOther: false,
    metric:'top-5-flows',
    legendHeadings: ['Source','Destination','Protocol','Sport','Dport'],
    keyName: function(k,i) { return i === 2 ? (k === '6' ? 'tcp' : 'udp') : k; },
    units: 'Bits per Second'},
  db);

  function updateData(data) {
    if(!data 
      || !data.trend 
      || !data.trend.times 
      || data.trend.times.length === 0) return;

    if(db.trend) {
      // merge in new data
      var maxPoints = db.trend.maxPoints;
      var remove = db.trend.times.length > maxPoints ? db.trend.times.length - maxPoints : 0;
      db.trend.times = db.trend.times.concat(data.trend.times);
      if(remove) db.trend.times = db.trend.times.slice(remove);
      for(var name in db.trend.trends) {
        db.trend.trends[name] = db.trend.trends[name].concat(data.trend.trends[name]);
        if(remove) db.trend.trends[name] = db.trend.trends[name].slice(remove);
      }
    } else db.trend = data.trend;

    db.trend.start = new Date(db.trend.times[0]);
    db.trend.end = new Date(db.trend.times[db.trend.times.length - 1]);

    $.event.trigger({type:'updateChart'});
  }

  function pollTrends() {
    $.ajax({
      url: dataURL,
      data: db.trend && db.trend.end ? {after:db.trend.end.getTime()} : null,
      success: function(data) {
        updateData(data);
        setTimeout(pollTrends, 1000);
      },
      error: function(result,status,errorThrown) {
        setTimeout(pollTrends,5000);
      },
      timeout: 60000
    });
  };

  // topN flows
  var db_top = {};
  var top_keys = getState('keys','');
  var top_value = getState('value','');
  var top_filter = getState('filter','');

  $('#keys')
    .val(top_keys)
    .bind( "keydown", function( event ) {
      if ( event.keyCode === $.ui.keyCode.TAB &&
        $( this ).autocomplete( "instance" ).menu.active ) {
           event.preventDefault();
        }
      })
    .autocomplete({
      minLength: 0,
      source: function( request, response) {
        $.getJSON(keysURL, { search: request.term.split(/,\s*/).pop() }, response)
      },
      focus: function() {
        // prevent value inserted on focus
        return false;
      },
      select: function( event, ui ) {
        var terms = this.value.split(/,\s*/);
        // remove the current input
        terms.pop();
        // add the selected item
        terms.push( ui.item.value );
        // add placeholder to get the comma-and-space at the end
        terms.push( "" );
        this.value = terms.join( "," );
        return false;
      }
    })
    .focus(function() { $(this).autocomplete('search'); });

  $('#value')
    .val(top_value)
    .autocomplete({
       minLength:0,
       source:['bps', 'Bps', 'fps']
    })
    .focus(function() { $(this).autocomplete('search'); });

  $('#filter')
    .val(top_filter)
    .bind( "keydown", function( event ) {
      if ( event.keyCode === $.ui.keyCode.TAB &&
        $( this ).autocomplete( "instance" ).menu.active ) {
          event.preventDefault();
        }
    })
    .autocomplete({
      minLength: 0,
      source: function( request, response) {
        $.getJSON(keysURL, { search: request.term.split(/[&|(]\s*/).pop() }, response)
      },
      focus: function() {
        // prevent value inserted on focus
        return false;
      },
      select: function( event, ui ) {
        var val = this.value;
        var re = /[&|(]/g;
        var end = 0;
        while(re.test(val)) { end = re.lastIndex; }
        this.value = val.substring(0,end) + ui.item.value + "=";
        return false;
      }
    })
    .focus(function() { $(this).autocomplete('search'); });

  $('#cleardef').button({icons:{primary:'ui-icon-cancel'},text:false}).click(function() {
    $('#keys').val('');
    $('#value').val('');
    $('#filter').val('');
    top_keys = '';
    top_value = '';
    top_filter = '';
    setState('keys',top_keys);
    setState('value',top_value);
    setState('filter',top_filter,true);
    emptyTopFlows();
  });
  $('#submitdef').button({icons:{primary:'ui-icon-check'},text:false}).click(function() {
    top_keys = $.trim($('#keys').val()).replace(/(,$)/g, "");
    top_value = $.trim($('#value').val());
    top_filter = $.trim($('#filter').val());
    setState('keys',top_keys);
    setState('value',top_value);
    setState('filter',top_filter,true);
    emptyTopFlows();
  });
  function valueToKey(val) {
    var key;
    switch(val) {
    case 'bps':
      key = 'bytes';
      break;
    case 'Bps':
      key = 'bytes';
      break;
    case 'fps':
      key = 'frames';
      break;
    default:
      key = val;
    }
    return key;
  }

  function valueToScale(val) {
    return 'bps' === val ? 8 : 1;
  }

  function valueToTitle(val) {
    var title;
    switch(val) {
    case 'bps':
      title = 'Bits per Second';
      break;
    case 'bytes':
      case 'Bps':
      title = 'Bytes per Second';
      break;
    case 'frames':
      case 'fps':
      title  = 'Frames per Second';
      break;
    case 'requests':
      title = 'Requests per Second';
      break;
    default:
      title = val;
    }
    return title;
  }

  function addFilter(key, value, filter) {
    var newFilter = filter;
    if(!newFilter) newFilter = "";
    if(newFilter.length > 0) newFilter += "&";
    newFilter += "'" + key + "'='" + value + "'";
    $('#filter').val(newFilter);
    top_filter = newFilter;
    setState('filter', top_filter, true);
    emptyTopFlows();
  }

  var $shortcutsTable;
  function initializeShortcutsTable() {
    $shortcutsTable = $('#shortcutstable').DataTable({
      ajax: {
        url: shortcutsURL,
        dataSrc: function(data) {
          return data;
        }
      },
      deferRenderer: true,
      columns:[
        {data:'category'},
        {data:'protocol'},
        {data:'description'}
      ],
      columnDefs: [ { targets: 2, orderable: false } ]
    })
    .page.len(getState('topshow'))
    .on('length', function(e,settings,len) {
      setState('topshow', len, true);
    })
    .on('xhr', function(e,settings,json) {
      var len = json.length || 0;
      $('#numshortcuts').val(len).removeClass(len ? 'error' : 'good').addClass(len ? 'good' : 'error');;
    })
    .on('click', 'tr', function(e) {
      var row = $shortcutsTable.row($(this));
      var shortcut = row.data();
      if(!shortcut) return;
      top_keys = shortcut.keys || '';
      top_value = shortcut.value || '';
      top_filter = shortcut.filter || '';
      $('#keys').val(top_keys);
      $('#value').val(top_value);
      $('#filter').val(top_filter);
      setState('keys', top_keys, false);
      setState('value', top_value, false);
      setState('filter', top_filter, true);
      emptyTopFlows();
    });
  }

  function updateTopN(data,scale) {
    if(!data
      || !data.trend
      || !data.trend.times
      || data.trend.times.length == 0) return;

    if(scale !== 1) {
      var topn = data.trend.trends.topn;
      for(var i = 0; i < topn.length; i++) {
        var entry = topn[i];
        for(var flow in entry) {
          entry[flow]*=scale;
        }
      }
    }

    if(db_top.trend) {
      // merge in new data
      var maxPoints = db_top.trend.maxPoints;
      var remove = db_top.trend.times.length > maxPoints ? db_top.trend.times.length - maxPoints : 0;
      db_top.trend.times = db_top.trend.times.concat(data.trend.times);
      if(remove) db_top.trend.times = db_top.trend.times.slice(remove);
      for(var name in db_top.trend.trends) {
        db_top.trend.trends[name] = db_top.trend.trends[name].concat(data.trend.trends[name]);
        if(remove) db_top.trend.trends[name] = db_top.trend.trends[name].slice(remove);
      }
    } else db_top.trend = data.trend;

    db_top.trend.start = new Date(db_top.trend.times[0]);
    db_top.trend.end = new Date(db_top.trend.times[db_top.trend.times.length - 1]);

    $.event.trigger({type:'updateTopN'});
  }


  var running_topflows;
  var timeout_topflows;
  function pollTopFlows() {
    running_topflows = true;
    var query = {keys:top_keys,value:valueToKey(top_value),filter:top_filter};
    if(db_top.trend && db_top.trend.end) query.after=db_top.trend.end.getTime();
    var scale = valueToScale(top_value);
    $.ajax({
      url: topURL,
      data: query,
      success: function(data) {
        if(running_topflows) {
          updateTopN(data,scale);
          timeout_topflows = setTimeout(pollTopFlows, 1000);
        }
      },
      error: function(result,status,errorThrown) {
        if(running_topflows) timeout_topflows = setTimeout(pollTopFlows, 5000);
      }
    });
  }

  function stopPollTopFlows() {
    running_topflows = false;
    if(timeout_topflows) clearTimeout(timeout_topflows);
  }

  function emptyTopFlows() {
    stopPollTopFlows();
    if(db_top.trend) {
      $(document).off('updateTopN');
      $('#topn').stripchart('destroy');
      $('#topn').empty();
      delete db_top.trend;
    }
    if(!top_keys || !top_value) {
      $('#shortcutstable_wrapper').show();
      $('#topn').hide();
      return;
    }
    $('#shortcutstable_wrapper').hide();
    $('#topn').show();

    if(!db_top.trend) {
       $('#topn').chart({
          type: 'topn',
          legendHeadings: top_keys.match(/(\\.|[^,])+/g),
          units:valueToTitle(top_value),
          stack: true,
          sep: SEP,
          metric: 'topn',
          updateEvent: 'updateTopN'
       },db_top);
    }

    var query = {keys:top_keys,value:valueToKey(top_value),filter:top_filter};
    pollTopFlows();
  }

  $('#topn').click(function(e) {
    var idx,key,val,tgt = $(e.target);
    if(tgt.is('td')) {
      idx = tgt.index() - 1;
      key = top_keys.match(/(\\.|[^,])+/g)[idx];
      val = tgt.text();
      addFilter(key,val,top_filter);
    }
    else if(tgt.is('div') && tgt.parent().is('td')) {
      var row = tgt.parent().parent();
      row.children().each(function(i,td) {
        if(i>0) {
          idx = i - 1;
          key = top_keys.split(',')[idx];
          val = $(td).text();
          addFilter(key,val,top_filter);
        }
      });
    }
  }); 

  // settings
  function percentageLimits(event,ui) {
    if ( $(this).spinner('value') > 100 ) {
      $( this ).spinner( "value", 100 );
    } else if ( $(this).spinner('value') < 0 ) {
      $( this ).spinner( "value", 0 );
    }
  }

  function getThresholds() {   
    $.ajax({
      url:thresholdsURL, 
      dataType:'json',
      success: function(data) {
        $('#elephant').spinner('value', data.elephant);
        $('#utilization').spinner('value', data.utilization);
      }
    });
  }

  function setThresholds() {
    var elephant =  Math.round($('#elephant').spinner('value'));
    var utilization = Math.round($('#utilization').spinner('value'));
    var settings = {"utilization":  utilization, "elephant": elephant};
    $.ajax({
      url:thresholdsURL, 
      type: 'POST',
      contentType:'application/json',
      data: JSON.stringify(settings)
    });
  }

  function refreshTopology() {
    $.ajax({
      url: topologyInfoURL,
      dataType: 'json',
      success: function(data) {
        $('#topologynodes').val(data.nodes).removeClass(data.nodes ? 'error' : 'good').addClass(data.nodes ? 'good' : 'error');
        $('#topologylinks').val(data.links).removeClass(data.links ? 'error' : 'good').addClass(data.links ? 'good' : 'error');
      }
    }); 
  }

  refreshTopology();

  function getTopology() {
    location.href = topologyURL;
  }

  function refreshGroups() {
    $.ajax({
      url:groupsInfoURL,
      dataType: 'json',
      success: function(data) {
        $('#numgroups').val(data.groups).removeClass(data.groups ? 'error' : 'good').addClass(data.groups ? 'good' : 'error');
        $('#numcidrs').val(data.cidrs).removeClass(data.cidrs ? 'error' : 'good').addClass(data.cidrs ? 'good' : 'error');
      }
    });
  }

  refreshGroups();

  function getGroups() {
    location.href = groupsURL;
  }

  function refreshShortcuts() {
    $shortcutsTable.ajax.reload();
  }

  function getShortcuts() {
    location.href = shortcutsURL;
  }
      
  function warningDialog(message) {
    $('<div>' + message + '</div>').dialog({dialogClass:'alert', modal:true, buttons:{'Close': function() { $(this).dialog('close'); }}})
  }

  $('#elephant').spinner({min:0,max:100,step:5, change: percentageLimits});
  $('#utilization').spinner({min:0,max:100,step:5, change: percentageLimits});
  $('#thresholdget').button({icons:{primary:'ui-icon-arrowrefresh-1-e'},text:false}).click(getThresholds);
  $('#thresholdset').button({icons:{primary:'ui-icon-arrowstop-1-n'},text:false}).click(setThresholds);
  $('#topologyrefresh').button({icons:{primary:'ui-icon-arrowrefresh-1-e'},text:false}).click(refreshTopology);
  $('#topologyget').button({icons:{primary:'ui-icon-search'},text:false}).click(getTopology);
  $('#topologyfile').hide().change(function(event) {
    var input = event.target;
    var reader = new FileReader();
    var $this = $(this);
    reader.onload = function(){
      var text = reader.result;
      $this.wrap('<form>').closest('form').get(0).reset();
      $this.unwrap();
      $.ajax({
        url:topologyURL,
        type: 'POST',
        contentType:'application/json',
        data:text,
        success:refreshTopology,
        error: function() { warningDialog('Badly formatted topology'); }
      });
    }
    reader.readAsText(input.files[0]);
  });
  $('#topologyset').button({icons:{primary:'ui-icon-arrowstop-1-n'},text:false}).click(function() {$('#topologyfile').click();});
  $('#groupsrefresh').button({icons:{primary:'ui-icon-arrowrefresh-1-e'},text:false}).click(refreshGroups);
  $('#groupsget').button({icons:{primary:'ui-icon-search'},text:false}).click(getGroups);
  $('#groupsfile').hide().change(function(event) {
    var input = event.target;
    var reader = new FileReader();
    var $this = $(this);
    reader.onload = function(){
      var text = reader.result;
      $this.wrap('<form>').closest('form').get(0).reset();
      $this.unwrap();
      $.ajax({
        url:groupsURL,
        type: 'POST',
        contentType:'application/json',
        data:text,
        success:refreshGroups,
        error: function() { warningDialog('Badly formatted groups'); }
      });
    };
    reader.readAsText(input.files[0]);
  });
  $('#groupsset').button({icons:{primary:'ui-icon-arrowstop-1-n'},text:false}).click(function() {$('#groupsfile').click();});
  $('#shortcutsrefresh').button({icons:{primary:'ui-icon-arrowrefresh-1-e'},text:false}).click(refreshShortcuts);
  $('#shortcutsget').button({icons:{primary:'ui-icon-search'},text:false}).click(getShortcuts);
  $('#shortcutsfile').hide().change(function(event) {
    var input = event.target;
    var reader = new FileReader();
    var $this = $(this);
    reader.onload = function(){
      var text = reader.result;
      $this.wrap('<form>').closest('form').get(0).reset();
      $this.unwrap();
      $.ajax({
        url:shortcutsURL,
        type: 'POST',
        contentType:'application/json',
        data:text,
        success:refreshShortcuts,
        error: function() { warningDialog('Badly formatted shortcuts'); }
      });
    };
    reader.readAsText(input.files[0]);
  });
  $('#shortcutsset').button({icons:{primary:'ui-icon-arrowstop-1-n'},text:false}).click(function() {$('#shortcutsfile').click();});

  getThresholds();

  function escapeHTML(t) { return $('<div/>').text(t).html(); }
  function nodeDetails(data, nodeData) {
    if(!data || !nodeData) return;

    var details = '<div class="slider">';
           
    // node details
    details += '<table  cellpadding="5" cellspacing="0" border="0" class="nodeDetails"><tbody><tr>';
    if(data.node) {
      var loadAvg = '';
      if(data.node.hasOwnProperty('load_one') && data.node.hasOwnProperty('load_five') && data.node.hasOwnProperty('load_fifteen')) loadAvg = '' + data.node['load_one'].toFixed(2) + '/' + data.node['load_five'].toFixed(2) + '/' + data.node['load_fifteen'].toFixed(2);
      details += '<td>Load Avg:</td><td>' + loadAvg + '</td>';
      details += '<td>Agent:</td><td>' + nodeData['agent'] + '</td>';
      details += '<td>CPU:</td><td>' + (data.node['machine_type'] ? data.node['machine_type'] : '') + '</td>';
      details += '<td>Release:</td><td>' + (data.node['os_release'] ? escapeHTML(data.node['os_release']) : '') + '</td>';
      details += '</tr></tbody></table>';
    }
         
    // interface table
    if(data.ports && data.ports.length > 0) {       
      details += '<table cellpadding="5" cellspacing="0" border="0" class="portDetails">';
      details += '<thead><tr><th>Port</th><th>Speed</th><th>Status</th><th>Counters</th><th>Flows</th></tr></thead>';
      details += '<tbody>';
      for(var i = 0; i < data.ports.length; i++) {
        details += '<tr>';
        var port = data.ports[i];
        details += '<td>' + (port.name || '') + '</td>';
        details += '<td>' + (port.speed >= 0 ?  nf(port.speed) : '') + '</td>';
        details += '<td class="' + (port.status ? 'good' : 'warn') + '">' + (port.status ? "OK" : (port.counters ? "Down" : "Missing")) + '</td>';
        details += '<td class="' + (port.counters ? 'good' : 'warn') + '">' + (port.counters ? "OK" : "Missing") + '</td>';
        details += '<td class="' + (port.flows ? 'good' : 'warn') + '">' + (port.flows ? "OK" : "Missing") + '</td>';
        details += '</tr>';
      }
      details += '</tbody>';
      details += '</table>';
    }
    details += '</div>';
    return details;
  }

  function initializeNodesTable() {
    var $nodesTable = $('#nodestable').DataTable({
      ajax: {
        url:nodesURL,
        dataSrc: function(data) {
          // update summary counts
          var sumNodes = 0, sumUnlinked = 0, sumAdminDown = 0, sumOperDown = 0;
          if(data && data.length) {
            sumNodes = data.length;
            for(var i = 0; i < data.length; i++) {
              var node = data[i];
              if(node['link_count'] === 0) sumUnlinked++;
              sumAdminDown += node['admin_down'];
              sumOperDown += node['oper_down'];
            }
          }
          $('#nodecount').val(sumNodes);
          $('#nodesdisconnected').val(sumUnlinked).removeClass(sumUnlinked ? 'good' : 'error').addClass(sumUnlinked ? 'error' : 'good');
          $('#portsdown').val(sumOperDown);
          return data;
        }
      },
      deferRenderer:true,
      columns: [
        {
          "class": 'details-control',
          "orderable": false,
          "data": null,
          "defaultContent": ''
        },
        {data:'name'},
        {data:'cpu_utilization'},
        {data:'memory_utilization'},
        {data:'disk_utilization'},
        {data:'disk_part_utilization'},
        {data:'uptime'},
        {data:'link_count'},
        {data:'interfaces'},
        {data:'oper_down'}
      ],
      columnDefs: [
        {},
        {},
        { class: 'alignr', render: function(data, type, row) { return data === -1 ? '' : data.toFixed(2); }, targets:2},
        { class: 'alignr', render: function(data, type, row) { return data === -1 ? '' : data.toFixed(2); }, targets:3},      
        { class: 'alignr', render: function(data, type, row) { return data === -1 ? '' : data.toFixed(2); }, targets:4},
        { class: 'alignr', render: function(data, type, row) { return data === -1 ? '' : data.toFixed(2); }, targets:5},
        { class: 'alignr', render: function(data, type, row) { return data === -1 ? '' : (data /  86400).toFixed(2); },  targets:6 },
        { class: 'alignr', targets: 7},
        { class: 'alignr',targets: 8},
        { class: 'alignr',targets: 9}
      ],
      order: [[1, 'asc']],
      createdRow: function(row, data, index) {
        data['link_count'] ? $('td', row).eq(7).addClass('good') : $('td', row).eq(7).addClass('error');
      }
    })
    .page.len(getState('swishow'))
    .on('length', function(e,settings,len) {
      setState('swishow', len, true);
    })
    .on('click', 'td.details-control', function(e) {
      var tr = $(this).closest('tr');
      var row = $nodesTable.row(tr);
      if( row.child.isShown()) {
        $('div.slider', row.child()).slideUp( function() {
          row.child.hide();
          tr.removeClass('shown');
        });
      }
      else {
        // make a query for details on selected node
        var nodeData = row.data();
        $.ajax({
          url: restPath + 'node/' + encodeURIComponent(nodeData['name'] ) + '/json',
          data: {agent: nodeData['agent'] },
          success: function(data) {
            row.child(nodeDetails(data, nodeData),'no-padding').show();
            tr.addClass('shown');
            $('div.slider', row.child()).slideDown();
          }
        });
      }
    });
    $('#refreshnodes').button({icons:{primary:'ui-icon-arrowrefresh-1-e'},text:false}).click(function() { $nodesTable.ajax.reload(); });
  }

  function initializeLinksTable() { 
    var $linksTable = $('#linkstable').DataTable({
      ajax:{
        url: linksURL, 
        dataSrc: function(data) { 
          // update summary counts
          var sumLinks = 0, sumStatus = 0, sumCounters = 0, sumFlows = 0;
          if(data && data.length) {
            sumLinks = data.length;
            for(var i = 0; i < data.length; i++) {
              var link = data[i];
              if(!link.statusOK) sumStatus++;
              if(!link.countersOK) sumCounters++;
              if(!link.flowsOK) sumFlows++;
            }
          }
          $('#linkcount').val(sumLinks);
          $('#linkstatuscount').val(sumStatus).removeClass(sumStatus ? 'good' : 'error').addClass(sumStatus ? 'error' : 'good');
          $('#linkcounterscount').val(sumCounters).removeClass(sumCounters ? 'good' : 'error').addClass(sumCounters ? 'error' : 'good');
          $('#linkflowscount').val(sumFlows).removeClass(sumFlows ? 'good' : 'warn').addClass(sumFlows ? 'warn' : 'good');
          return data
        }
      },
      deferRenderer: true,
      columns:[
        {data:'name'},
        {data:'node1'},
        {data:'port1'},
        {data:'node2'},
        {data:'port2'},
        {data:'speed'},
        {data:'statusOK'},
        {data:'countersOK'},
        {data:'flowsOK'}
      ],
      columnDefs: [
        {},
        {},
        {},
        {},
        {},
        {},
        { render: function(data, type, row) { return data ? nf(data) : 'Unknown'; }, targets:5},
        { render: function(data,type,row) { return data ? 'OK' : row['countersOK'] ? 'Down' : 'Missing'}, targets:6},
        { render: function(data,type,row) { return data ? 'OK' : 'Missing'}, targets:7},
        { render: function(data,type,row) { return data ? 'OK' : 'Missing'}, targets:8}
      ],
      createdRow: function(row, data, index) {
        data['statusOK'] ? $('td', row).eq(6).addClass('good') : $('td', row).eq(6).addClass('error');
        data['countersOK'] ? $('td', row).eq(7).addClass('good') : $('td', row).eq(7).addClass('error');
        data['flowsOK'] ? $('td', row).eq(8).addClass('good') : $('td', row).eq(8).addClass('warn');
    }
  })
  .page.len(getState('lnkshow'))
  .on('length', function(e,settings,len) {
    setState('lnkshow', len, true);
  });
  $('#refreshlinks').button({icons:{primary:'ui-icon-arrowrefresh-1-e'},text:false}).click(function() { $linksTable.ajax.reload();});
  }

  function initializeHostsTable() {
  var $edgeTable = $('#hoststable').DataTable({
    ajax:{
      url: hostsURL,
      dataSrc: function(data) {
        // update summary counts
        var sumHosts = 0;
        if(data && data.length) {
          sumHosts = data.length;
        }
        $('#hostcount').val(sumHosts);
        return data;
      }
    },
    deferRenderer: true,
    columns:[
      {data:'node'},
      {data:'port'},
      {data:'vlan'},
      {data:'mac'},
      {data:'ouiname'},
      {data:'ipaddress'},
      {data:'ip6address'}
    ]
  })
  .page.len(getState('hstshow'))
  .on('length', function(e,settings,len) {
    setState('hstshow', len, true);
  });
  $('#refreshhosts').button({icons:{primary:'ui-icon-arrowrefresh-1-e'},text:false}).click(function() { $edgeTable.ajax.reload();})
  }

  function initializeVersion() {
    $.getJSON(versionURL, function(data) { $('#version').text(data); });
  }
        
  $(window).resize(function() {
    $.event.trigger({type:'updateChart'});
  });

  initializeVersion();
  pollTrends();
  initializeShortcutsTable();
  emptyTopFlows();
  initializeNodesTable();
  initializeLinksTable();
  initializeHostsTable();
});
