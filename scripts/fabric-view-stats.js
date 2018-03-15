// author: InMon Corp.
// version: 1.0
// date: 10/8/2015
// description: Fabric View - Statistics module
// copyright: Copyright (c) 2015 InMon Corp. ALL RIGHTS RESERVED

include(scriptdir() + '/inc/common.js');

setFlow('fv-frames', {value:'frames', t:flow_timeout});
setFlow('fv-stack', {keys:'stack', value:'bytes', n:5, t:flow_timeout});
setFlow('fv-sources',{keys:'ipsource', value:'bytes', filter:'first:stack:.:ip:ipv6=ip',n:5,t:flow_timeout});
setFlow('fv-destinations',{keys:'ipdestination', value:'bytes', filter:'first:stack:.:ip:ipv6=ip', n:5, t:flow_timeout});
setFlow('fv-pairs', {keys:'ipsource,ipdestination', value:'bytes',  filter:'first:stack:.:ip:ipv6=ip',n:5, t:flow_timeout});
setFlow('fv-sourcegroups', {keys:'group:ipsource:fv',value:'bytes', filter:'first:stack:.:ip:ipv6=ip',n:5, t:flow_timeout});
setFlow('fv-destinationgroups', {keys:'group:ipdestination:fv',value:'bytes', filter:'first:stack:.:ip:ipv6=ip',n:5, t:flow_timeout});
setFlow('fv-grouppairs', {keys:'group:ipsource:fv,group:ipdestination:fv', value:'bytes',  filter:'first:stack:.:ip:ipv6=ip', n:5, t:flow_timeout});

var other = '-other-';
function calculateTopN(metric,n,minVal, edge_bps) {     
  var total, top, topN, i, bps;
  top = activeFlows('TOPOLOGY',metric,n,minVal,'edge');
  var topN = {};
  if(top) {
    total = 0;
    for(i in top) {
      bps = top[i].value * 8;
      topN[top[i].key] = bps;
      total += bps;
    }
    if(edge_bps > total) topN[other] = edge_bps - total;
  }
  return topN;
}

function calculateTopInterface(metric,n) {
  var top = table('TOPOLOGY','sort:'+metric+':-'+n);
  var topN = {};
  if(top) {
    for(var i = 0; i < top.length; i++) {
      var val = top[i][0];
      var port = topologyInterfaceToPort(val.agent,val.dataSource);
      if(port && port.node && port.port) {
        topN[port.node + SEP + port.port] = val.metricValue;
      }
    }
  }
  return topN;
}

function getMetric(res, idx, defVal) {
  var val = defVal;
  if(res && res.length && res.length > idx && res[idx].hasOwnProperty('metricValue')) val = res[idx].metricValue;
  return val;
}

var metric_list = [
  'sum:ifindiscards',
  'sum:ifoutdiscards',
  'sum:ifinerrors',
  'sum:ifouterrors',
  'max:cpu_utilization',
  'max:load_one_per_cpu',
  'max:mem_utilization',
  'max:disk_utilization',
  'max:part_max_used',
  'max:bcm_host_utilization',
  'max:bcm_mac_utilization',
  'max:bcm_ipv4_utilization',
  'max:bcm_ipv6_utilization',
  'max:bcm_ipv4_ipv6_utilization',
  'max:bcm_long_ipv6_utilizaton',
  'max:bcm_total_routes_utilization',
  'max:bcm_ecmp_nexthops_utilization',
  'max:bcm_acl_ingress_utilization',
  'max:bcm_acl_ingress_meters_utilization',
  'max:bcm_acl_ingress_counters_utilization',
  'max:bcm_acl_egress_utilization',
  'max:bcm_acl_egress_meters_utilization',
  'max:bcm_acl_egress_counters_utilization'
];

setIntervalHandler(function(now) {
  var res, top, edge_bps, edge_fps, mice_bps, edge;

  points = {};

  res = metric('TOPOLOGY',metric_list);
  points['discards'] = getMetric(res,0,0) + getMetric(res,1,0);
  points['errors'] = getMetric(res,2,0) + getMetric(res,3,0);
  points['cpu_util'] = getMetric(res,4,0);
  points['load_per_cpu'] = getMetric(res,5,0) * 100;
  points['mem_util'] = getMetric(res,6,0);
  points['disk_util'] = getMetric(res,7,0);
  points['part_max_util'] = getMetric(res,8,0);
  points['hw_host_util'] = getMetric(res,9,0);
  points['hw_mac_util'] = getMetric(res,10,0);
  points['hw_ipv4_util'] = getMetric(res,11,0);
  points['hw_ipv6_util'] = getMetric(res,12,0);
  points['hw_ipv4_ipv6_util'] = getMetric(res,13,0);
  points['hw_ipv6_long_util'] = getMetric(res,14,0);
  points['hw_total_routes_util'] = getMetric(res,15,0);
  points['hw_ecmp_nexthops_util'] = getMetric(res,16,0);
  points['hw_acl_ingress_util'] = getMetric(res,17,0);
  points['hw_acl_ingress_meters_util'] = getMetric(res,18,0);
  points['hw_acl_ingress_counters_util'] = getMetric(res,19,0);
  points['hw_acl_egress_util'] = getMetric(res,20,0);
  points['hw_acl_egress_meters_util'] = getMetric(res,21,0);
  points['hw_acl_egress_counters_util'] = getMetric(res,22,0);

  top = activeFlows('TOPOLOGY','fv-bytes',1,0,'edge');
  edge_bps = 0;
  if(top && top.length > 0) edge_bps = top[0].value * 8;
  points['edge_bps'] = edge_bps;

  top = activeFlows('TOPOLOGY','fv-frames',1,0,'edge');
  edge_fps = 0;
  if(top && top.length > 0) edge_fps = top[0].value;
  points['edge_fps'] = edge_fps;

  points['top-5-stack'] = calculateTopN('fv-stack',5,100,edge_bps);
  points['top-5-sources'] = calculateTopN('fv-sources',5,100,edge_bps);
  points['top-5-destinations'] = calculateTopN('fv-destinations',5,100,edge_bps);
  points['top-5-pairs'] = calculateTopN('fv-pairs',5,100,edge_bps);
  points['top-5-sourcegroups'] = calculateTopN('fv-sourcegroups',5,100,edge_bps);
  points['top-5-destinationgroups'] = calculateTopN('fv-destinationgroups',5,100,edge_bps);
  points['top-5-grouppairs'] = calculateTopN('fv-grouppairs', 5,100,edge_bps);
  points['top-5-flows'] = calculateTopN('fv-flow',5,100,edge_bps);

  points['top-5-indiscards'] = calculateTopInterface('ifindiscards',5);
  points['top-5-outdiscards'] = calculateTopInterface('ifoutdiscards',5);
  points['top-5-inerrors'] = calculateTopInterface('ifinerrors',5);
  points['top-5-outerrors'] = calculateTopInterface('ifouterrors',5);
  points['top-5-inutilization'] = calculateTopInterface('ifinutilization',5);
  points['top-5-oututilization'] = calculateTopInterface('ifoututilization',5);

  sharedSet('stats',points);
},1);
