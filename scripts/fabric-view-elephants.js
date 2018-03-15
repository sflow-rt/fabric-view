// author: InMon Corp.
// version: 1.0
// date: 10/8/2015
// description: Fabric View - Elephant Flow analytics module
// copyright: Copyright (c) 2015 InMon Corp. ALL RIGHTS RESERVED

include(scriptdir() + '/inc/common.js');

var opt;

// lock the flows to the IPv4 underlay with first:stack:.:ip:ip6=ip filter
setFlow('fv-flow', {
  keys:'ipsource,ipdestination,ipprotocol,or:tcpsourceport:udpsourceport,or:tcpdestinationport:udpdestinationport', 
  value:'bytes', filter:'first:stack:.:ip:ip6=ip&ipprotocol=6,17&direction=ingress', n:10, t:flow_timeout
});

var elephants;
var elephantCounts = {};

var busyLinks;
var busyLinkCounts = {};

// moving average over last 100 flows
baselineCreate('duration',100,1,1);
baselineCreate('rate',100,1,1);

function resetCounts() {
  elephantCounts.arrivals = 0;
  elephantCounts.departures = 0;
  elephantCounts.bytes = 0;
  busyLinkCounts.elephant = 0;
  busyLinkCounts.collision = 0;
}

function initializeElephants() {
  elephants = {};
  elephantCounts.current = 0;
}

function initializeBusyLinks() {
  busyLinks = {};
  busyLinkCounts.core = 0;
  busyLinkCounts.edge = 0;
}

function elephantCount(agent, dataSource) {
  var linkflows, topKeys, i, count=0;
  linkflows = metric(agent,dataSource + '.fv-flow');
  if(linkflows && linkflows.length === 1) {
    topKeys = linkflows[0].topKeys;
    if(topKeys) {
      for(i = 0; i < topKeys.length; i++) {
        let el = elephants[topKeys[i].key];
        if(el && topKeys[i].value >= el.threshold) {
          count++;
        }
      }
    }
  }
  return count;
}

function elephantStart(flowKey, rec) {
  // place holder to mark elephant flows
}

function linkBusy(linkDs, linkRec, now) {
  // place holder to steer elephant flows
}

function elephantEnd(flowKey, rec) {
  // place holder to remove marking
}

setEventHandler(function(evt) {
  var rec, nodes, links, isCore, linkDS, linkflows, topKeys, ecount;
  switch(evt.thresholdID) {
    case 'fv-1G-elephant':
    case 'fv-10G-elephant':
    case 'fv-25G-elephant':
    case 'fv-40G-elephant':
    case 'fv-50G-elephant':
    case 'fv-100G-elehant':
      rec = topologyInterfaceToLink(evt.agent,evt.dataSource);
      isCore = rec && rec.linkname;
      if(isCore) break;

      nodes = topologyNodesForAgent(evt.agent,evt.dataSource);
      if(!nodes || nodes.length !== 1) break;

      links = topologyNodeLinks(nodes[0]);
      if(!links || links.length === 0) break; 

      rec = elephants[evt.flowKey];
      if(rec) break;

      rec = { start: evt.timestamp, bytes:evt.value, n:1, agent: evt.agent, dataSource: evt.dataSource, metric: evt.metric, thresholdID: evt.thresholdID, threshold:evt.threshold};
      elephants[evt.flowKey] = rec;
      elephantCounts.current++;
      elephantCounts.arrivals++;
      elephantStart(evt.flowKey, rec);
      break;
    case 'fv-1G-utilization':
    case 'fv-10G-utilization':
    case 'fv-25G-utilization':
    case 'fv-40G-utilization':
    case 'fv-50G-utilization':
    case 'fv-100G-utilization':
      rec = topologyInterfaceToLink(evt.agent,evt.dataSource);
      isCore = rec && rec.linkname;
      if(!isCore) break;

      linkDS = evt.agent + '.' + evt.dataSource;
      rec = busyLinks[linkDS];
      if(rec) break;

      rec = {start: evt.timestamp, agent:evt.agent, dataSource: evt.dataSource, metric: evt.metric, thresholdID: evt.thresholdID, threshold:evt.threshold };
      busyLinks[linkDS] = rec;
      busyLinkCounts.core++;
      linkBusy(linkDS, rec, evt.timestamp);
      break;
  }
}, [
  'fv-1G-elephant',
  'fv-10G-elephant',
  'fv-25G-elephant',
  'fv-40G-elephant',
  'fv-50G-elephant',
  'fv-100G-elephant',
  'fv-1G-utilization',
  'fv-10G-utilization',
  'fv-25G-utilization',
  'fv-40G-utilization',
  'fv-50G-utilization',
  'fv-100G-utilization']);

function updateElephants(now) {
  var flowKey, rec, triggered, duration, bps, utilization, duration, val;
  for(flowKey in elephants) {
    rec = elephants[flowKey];
    triggered = thresholdTriggered(rec.thresholdID, rec.agent, rec.dataSource + '.' + rec.metric, flowKey);
    if(triggered) {
      val = flowValue(rec.agent, rec.dataSource + '.' + rec.metric, flowKey);
      rec.bytes += val;
      rec.n++;
      elephantCounts.bytes += val;
    }
    else {
      delete elephants[flowKey];
      duration = Math.round((now - rec.start) / 1000) - thresh_timeout;
      if(duration < 1) duration = 1;
      // assume extra data points below threshold are small
      bps = (rec.bytes * 8) / duration;

      baselineCheck('duration',duration);
      baselineCheck('rate',bps);
            
      elephantCounts.current--;
      elephantCounts.departures++;
      elephantEnd(flowKey, rec);
    } 
  }
}

function updateBusyLinks(now) {
  var linkDS, rec, triggered, count;
  for(linkDS in busyLinks) {
    rec = busyLinks[linkDS];
    triggered = thresholdTriggered(rec.thresholdID, rec.agent, rec.dataSource + '.' + rec.metric);
    if(triggered) {
      count = elephantCount(rec.agent, rec.dataSource);
      if(count === 1) busyLinkCounts.elephant++;
      else if(count > 1) {
        busyLinkCounts.collision++;
        linkBusy(linkDS, rec, now);
      }
    }
    else {
      busyLinkCounts.core--;
      delete busyLinks[linkDS];
    }
  }
}

setIntervalHandler(function(now) {
  opt = sharedGet('opt');
  if(!opt) return;

  updateElephants(now);
  updateBusyLinks(now);

  points = {};

  var durationStats = baselineStatistics('duration');
  if(durationStats) points['elephant_flow_duration'] = durationStats.mean;
  else points['elephant_flow_duration'] = 0;

  var rateStats = baselineStatistics('rate');
  if(rateStats) points['elephant_flow_rate'] = rateStats.mean;
  else points['elephant_flow_rate'] = 0;
  
  points['elephant_current'] = elephantCounts.current;
  points['elephant_arrivals'] = elephantCounts.arrivals;
  points['elephant_departures'] = elephantCounts.departures;
  points['elephant_bps'] = elephantCounts.bytes * 8;

  points['busy_links_mice'] = Math.max(busyLinkCounts.core - busyLinkCounts.elephant - busyLinkCounts.collision, 0);
  points['busy_links_elephant'] = busyLinkCounts.elephant;
  points['busy_links_collision'] = busyLinkCounts.collision;

  sharedSet("elephants",points);

  resetCounts();
},1);

initializeElephants();
initializeBusyLinks();
resetCounts();
