// author: InMon Corp.
// version: 1.0
// date: 10/8/2015
// description: Fabric View
// copyright: Copyright (c) 2015 InMon Corp. ALL RIGHTS RESERVED

include(scriptdir() + '/inc/trend.js');
include(scriptdir() + '/inc/extend.js');
include(scriptdir() + '/inc/common.js');

var M = 1000000;
var G = 1000 * M;

// user configuration parameters
var defaultSettings = {
  elephant         : 10,
  utilization      : 80
};

var defaultShortcuts = [
{category:'Traffic', protocol:'IP', description:'Sources',keys:'ipsource',value:'bps',filter:''},
{category:'Traffic', protocol:'IP', description:'Destinations',keys:'ipdestination',value:'bps',filter:''},
{category:'Traffic', protocol:'IP', description:'Source-destination pairs',keys:'ipsource,ipdestination',value:'bps',filter:''},
{category:'Traffic', protocol:'IP', description:'Source-destination groups',keys:'group:ipsource:fv,group:ipdestination:fv',value:'bps', filter:''},
{category:'Traffic', protocol:'IPv6', description:'Sources',keys:'ip6source',value:'bps',filter:''},
{category:'Traffic', protocol:'IPv6', description:'Destinations',keys:'ip6destination',value:'bps',filter:''},
{category:'Traffic', protocol:'IPv6', description:'Source-destination pairs',keys:'ip6source,ip6destination',value:'bps',filter:''},
{category:'Traffic', protocol:'IPv6', description:'Source-destination groups',keys:'group:ipsource:fv,group:ipdestination:fv',value:'bps', filter:''},
{category:'Traffic', protocol:'Ethernet', description:'Sources',keys:'macsource,oui:macsource:name',value:'fps',filter:''},
{category:'Traffic', protocol:'Ethernet', description:'Sources of broadcasts',keys:'macsource,oui:macsource:name',value:'fps',filter:'isbroadcast=true'},
{category:'QoS', protocol:'Ethernet', description:'802.1p priority', keys:'priority',value:'bps',filter:''},
{category:'QoS', protocol:'IP', description:'Differentiated services code point (DSCP)', keys:'ipdscpname',value:'bps',filter:''},
{category:'QoS', protocol:'IP', description:'Type of service (ToS)', keys:'iptos', value:'bps',filter:''},
{category:'QoS', protocol:'IPv6', description:'Differentiated services code point (DSCP)', keys:'ip6dscpname',value:'bps',filter:''},
{category:'QoS', protocol:'IPv6', description:'Type of service (ToS)', keys:'ip6tos', value:'bps',filter:''},
{category:'Security', protocol:'DNS', description:'Requested domains',keys:'dnsqname',value:'requests',filter:''},
{category:'Security', protocol:'DNS', description:'Requested top level domains (TLD)',keys:'suffix:dnsqname:.:2',value:'requests',filter:''},
{category:'Security', protocol:'DNS', description:'Request types',keys:'dnsqtypename',value:'requests',filter:''},
{category:'Security', protocol:'DNS', description:'Clients',keys:'or:ipsource:ip6source',value:'requests',filter:'dnsqr=false'},
{category:'Security', protocol:'DNS', description:'Servers',keys:'or:ipsource:ip6source',value:'requests',filter:'dnsqr=true'},
{category:'Security', protocol:'ICMP', description:'Unreachable ports', keys:'ipdestination,icmpunreachableport', value:'fps', filter:''},
{category:'Security', protocol:'ICMP', description:'Unreachable protocols', keys:'ipdestination,icmpunreachableprotocol', value:'fps', filter:''},
{category:'Security', protocol:'ICMP', description:'Unreachable hosts', keys:'ipdestination,icmpunreachablehost', value:'fps', filter:''},
{category:'Security', protocol:'ICMP', description:'Unreachable networks', keys:'ipdestination,icmpunreachablenet', value:'fps', filter:''},
{category:'Virtualization', protocol:'VxLAN', description:'Virtual network identifiers (VNI)', keys:'vni', value:'bps', filter:''},
{category:'Virtualization', protocol:'VxLAN', description:'Tunnels (underlay)', keys:'ipsource,ipdestination,vni', value:'bps', filter:''},
{category:'Virtualization', protocol:'VxLAN', description:'Tenant source (overlay)', keys:'ipsource,vni,macsource.1,ipsource.1', value:'bps', filter:''},
{category:'Virtualization', protocol:'VxLAN', description:'Tenant destination (overlay)', keys:'ipdestination,vni,macdestination.1,ipdestination.1', value:'bps',filter:''},
{category:'Virtualization', protocol:'VxLAN', description:'Tenant source-destination pairs (overlay)', keys:'ipsource,ipdestination,vni,macsource.1,ipsource.1,macdestination.1,ipdestination.1', value:'bps', filter:''}
];

var defaultGroups = {
  external:['0.0.0.0/0','::/0'],
  private:['10.0.0.0/8','172.16.0.0/12','192.168.0.0/16','FC00::/7'],
  multicast:['224.0.0.0/4']
};

var opt = extend(defaultSettings, storeGet('opt') || {});
sharedSet('opt',opt);

var topology = storeGet('topology');
var groups = storeGet('groups') || defaultGroups;
var shortcuts = storeGet('shortcuts') || defaultShortcuts;

setGroups('fv', groups);
if(topology) setTopology(topology);

var trend = new Trend(300,1);
var points;

function initializeUserMetrics() {
  setThreshold('fv-1G-elephant', {
    metric:'fv-flow',
    value: G * opt.elephant * 0.01 / 8,
    byFlow:true, timeout:thresh_timeout, 
    filter:{ifspeed:[G]} });
  setThreshold('fv-10G-elephant', {
    metric:'fv-flow',
    value: 10 * G * opt.elephant * 0.01 / 8,
    byFlow:true, timeout:thresh_timeout,
    filter:{ifspeed:[10*G]} });
  setThreshold('fv-25G-elephant', {
    metric:'fv-flow',
    value: 25 * G * opt.elephant * 0.01 / 8,
    byFlow:true, timeout:thresh_timeout,
    filter:{ifspeed:[25*G]} });
  setThreshold('fv-40G-elephant', {
    metric:'fv-flow',
    value: 40 * G * opt.elephant * 0.01 / 8,
    byFlow:true, timeout:thresh_timeout,
    filter:{ifspeed:[40*G]} });
  setThreshold('fv-50G-elephant', {
    metric:'fv-flow',
    value: 50 * G * opt.elephant * 0.01 / 8,
    byFlow:true, timeout:thresh_timeout,
    filter:{ifspeed:[50*G]} });
  setThreshold('fv-100G-elephant', {
    metric:'fv-flow',
    value: 100 * G * opt.elephant * 0.01 / 8,
    byFlow:true, timeout:thresh_timeout,
    filter:{ifspeed:[100*G]} });
  setThreshold('fv-1G-utilization', {
    metric:'fv-bytes',
    value: G * opt.utilization * 0.01 / 8,
    timeout:thresh_timeout,
    filter:{ifspeed:[G]} });
  setThreshold('fv-10G-utilization', {
    metric:'fv-bytes',
    value: 10 * G * opt.utilization * 0.01 / 8,
    timeout:thresh_timeout,
    filter:{ifspeed:[10 * G]} }); 
  setThreshold('fv-25G-utilization', {
    metric:'fv-bytes',
    value: 25 * G * opt.utilization * 0.01 / 8,
    timeout:thresh_timeout,
    filter:{ifspeed:[25 * G]} }); 
  setThreshold('fv-40G-utilization', {
    metric:'fv-bytes',
    value: 40 * G * opt.utilization * 0.01 / 8,
    timeout:thresh_timeout,
    filter:{ifspeed:[40 * G]} });
  setThreshold('fv-50G-utilization', {
    metric:'fv-bytes',
    value: 50 * G * opt.utilization * 0.01 / 8,
    timeout:thresh_timeout,
    filter:{ifspeed:[50 * G]} }); 
  setThreshold('fv-100G-utilization', {
    metric:'fv-bytes',
    value: 100 * G * opt.utilization * 0.01 / 8,
    timeout:thresh_timeout,
    filter:{ifspeed:[100 * G]} });
}

setFlow('fv-bytes', {value:'bytes', t:flow_timeout});

initializeUserMetrics(opt);

setIntervalHandler(function(now) {
  points = {};
  var elephants = sharedGet('elephants');
  if(elephants) extend(points,elephants);
  var stats = sharedGet('stats');
  if(stats) extend(points,stats);
  // mice = total - elephants
  // variance can result in negative value if values are close
  if(elephants && stats) points['mice_bps'] = Math.max(0, points['edge_bps'] - points['elephant_bps']);
  trend.addPoints(now,points);
},1);

function numberMetric(metric) {
  if(metric.hasOwnProperty('metricValue')) return metric.metricValue;
  return -1;
}

function addNodeStats(agent,node) {
  node['agent'] = agent;
  let hostinfo = metric(agent,'2.1.uptime,2.1.cpu_utilization,2.1.mem_utilization,2.1.disk_utilization,2.1.part_max_used');
  node['uptime'] = numberMetric(hostinfo[0]);
  node['cpu_utilization'] = numberMetric(hostinfo[1]);
  node['memory_utilization'] = numberMetric(hostinfo[2]);
  node['disk_utilization'] = numberMetric(hostinfo[3]);
  node['disk_part_utilization'] = numberMetric(hostinfo[4]);
  let ifinfo = dump(agent,'ifindex;ifoperstatus');
  let if_count = 0, if_oper = 0;
  for each (var m in ifinfo) {
    let val = m.metricValue;
    switch(m.metricName) {
      case 'ifindex':
        if_count++;
        break;
      case 'ifoperstatus':
        if('up' !== val) if_oper++;
        break;
    }
  }
  node['interfaces'] = if_count;
  node['oper_down'] = if_oper;
}

function nodeDetails(nodename,agent) {
  var details = {};
  if(agent) {
    let nodeMetrics = {};
    let hostinfo = metric(agent,'2.1.load_one,2.1.load_five,2.1.load_fifteen,2.1.machine_type,2.1.os_release,2.1.os_name,2.1.uuid');
    for each (let h in hostinfo) {
      if(h.hasOwnProperty('metricValue')) nodeMetrics[h.metricName.split('.')[2]] = h.metricValue;
    }
    details['node'] = nodeMetrics;
  }
  var ifinfo = {};
  var dss = [];
  if(agent) {
    let stats = dump(agent,'ifadminstatus;ifoperstatus;ifspeed;ifinoctets;fv-bytes');
    if(stats !== null && stats.length > 0) {
      for(let i = 0; i < stats.length; i++) {
        let ds = stats[i].dataSource;
        let info = ifinfo[ds];
        if(!info) {
          info = {};
          ifinfo[ds] = info;
          dss.push(ds);
        }
        info[stats[i].metricName] = stats[i].metricValue;   
      }
    }
  }
  if(agent && dss.length > 0) {
    let ports = [];
    for(let i = 0; i < dss.length; i++) {
      let rec = topologyInterfaceToPort(agent,dss[i]);
      let pname = rec && rec.port ? rec.port : dss[i];
      let pinfo = {name:pname, ifindex:parseInt(dss[i])};
      let info = ifinfo[dss[i]];
      pinfo['speed'] = info && info.hasOwnProperty('ifspeed') ? info['ifspeed'] : -1;
      pinfo['counters'] = info ? info.hasOwnProperty('ifinoctets') : false;
      pinfo['flows'] = info ? info.hasOwnProperty('fv-bytes') : false;
      pinfo['status'] = info && 'up' === info['ifoperstatus'] ? true : false;
      ports.push(pinfo);
    }
    ports.sort(function(a, b) a.ifindex - b.ifindex );
    details['ports'] = ports;
  }
  return details;
}

function nodes() {
  // information about the status of switches
  var nodes = [];
  var nodeNames = topologyNodeNames(true);
  var agts = {};
  if(nodeNames) {
    for each (let nodename in nodeNames) {
      let node = {name:nodename};
      // need to find a port in order to get to sFlow agent
      let links = topologyNodeLinks(nodename);
      node['link_count'] = links ? links.length : 0;
      let agent = topologyAgentForNode(nodename);
      if(!agent) continue;
      agts[agent] = true;
      addNodeStats(agent,node);
      nodes.push(node);
    }
  }
  // catch non-topology agents
  for (var agent in agents()) {
    if(agts.hasOwnProperty(agent)) continue;
    let nnames = topologyNodesForAgent(agent);
    let nname = nnames && nnames.length === 1 ? nnames[0] : agent;
    let node = {name:nname};
    node['link_count'] = 0;
    addNodeStats(agent,node);
    nodes.push(node);
  }
  return nodes;
}

function links() {
  // information about the status of inter-switch links
  var links = [];
  var linkNames = topologyLinkNames(true);
  if(linkNames) {
    for each (var linkname in linkNames) {
      let rec = topologyLink(linkname);
      let link = {name:linkname};
      link.node1 = rec.node1 || '';
      link.port1 = rec.port1 || '';
      link.node2 = rec.node2 || '';
      link.port2 = rec.port2 || '';
      let metrics = topologyLinkMetric(linkname,'ifadminstatus,ifoperstatus,ifspeed,ifinoctets,fv-bytes');
      if(metrics && metrics.length >= 10) {
        link.statusOK = 'up' === metrics[0].metricValue && 'up' === metrics[1].metricValue && 'up' === metrics[5].metricValue && 'up' === metrics[6].metricValue;
        if(metrics[2].metricValue && metrics[7].metricValue && metrics[2].metricValue === metrics[7].metricValue) {
          link.speed = metrics[2].metricValue;
        } else {
          link.speed = 0;
        }
        link.countersOK = metrics[3].hasOwnProperty('metricValue') && metrics[8].hasOwnProperty('metricValue');
        link.flowsOK = metrics[4].hasOwnProperty('metricValue') && metrics[9].hasOwnProperty('metricValue');
      } else {
        link.statusOK = false;
        link.speed = 0;
        link.countersOK = false;
        link.flowsOK = false;
      }
      links.push(link);
    }
  }
  return links;
}

function findHostLAGs(locs) {
  if(locs.length !== 1) return;

  let entry = locs[0];
  if(!entry.hasOwnProperty('agg_partneropersystemid')) return;

  let partner = entry['agg_partneropersystemid'];
  let t = table('ALL','host_name,ifname,ifindex,agg_attachedaggid',{'agg_partneropersystemid':[partner]});
  if(!t || !t.length) return;

  for each (let r in t) {
    let host = r[0].metricValue;
    let port = r[1].metricValue;
    let ifindex = r[2].metricValue;
    let aggid = r[3].metricValue;
    let agent = r[0].agent;

    // now look up parent for bond name
    let bond = metric(agent,aggid+'.ifname')[0].metricValue;
    if(entry['agent'] === agent) {
      entry['port'] = bond;
      entry['ifindex'] = aggid;
      continue;
    }
   
    let loc = {};
    loc['port'] = bond;
    loc['ouiname'] = entry['ouiname'];
    loc['node'] = host;
    loc['agent'] = agent;
    loc['ifindex'] = aggid;
    loc['ipaddress'] = entry['ipaddress'];
    loc['ip6address'] = entry['ip6address'];
    loc['vlan'] = entry['vlan'];
    locs.push(loc);
  }
}

function hosts() {
  // information about edge facing ports
  var hosts = [];
  var macs = topologyLocatedHostMacs();
  if(!macs) return hosts;

  for each (var mac in macs) {
    let locs = topologyLocateHostMac(mac);
    if(!locs) continue;

    findHostLAGs(locs);
    for each (var loc in locs) {
      let entry = {};
      entry.mac = mac;
      entry['ouiname'] = loc.ouiname || '';
      entry['node'] = loc.node || loc.agent;
      entry['port'] = loc.port || loc.ifindex;
      entry['ipaddress'] = loc.ipaddress || '';
      entry['ip6address'] = loc.ip6address || '';
      entry['vlan'] = loc.vlan || '';
      hosts.push(entry);
    }
  }
  return hosts;
}

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
    case 'view':
      if(path.length > 1) throw "not_found"; 
      result = {};
      result.trend = req.query.after ? trend.after(parseInt(req.query.after)) : trend;
      break;
    case 'version':
      if(path.length > 1) throw "not_found";
      result = version();
      break;
    case 'thresholds':
      if(path.length > 1) throw "not_found";
      switch(req.method) {
        case 'POST':
        case 'PUT':
          for (var name in req.body) {
            var val = req.body[name];
            if(!opt.hasOwnProperty(name) || val < 0 || val > 100) throw "bad_value";           
          }
          for (var name in req.body) opt[name] = req.body[name];
          storeSet('opt',opt);
          sharedSet('opt',opt);
          initializeUserMetrics();
          break;
        case 'GET':
          result = opt;
          break;
        default: throw "bad_request";
      }
      break;
    case 'topology':
      if(path.length > 1) {
        if(path.length === 2 && 'info' === path[1]) {
          let nodeNames = topologyNodeNames();
          let linkNames = topologyLinkNames();
          result = {
            nodes:nodeNames ? nodeNames.length : 0,
            links:linkNames ? linkNames.length : 0
          };
        }
        else throw "not_found";
      } else {
        switch(req.method) {
          case 'POST':
          case 'PUT':
            if(req.error) throw "bad_request";
            if(!setTopology(req.body)) throw "bad_request";
            storeSet('topology',req.body);
            break;
          case 'GET':
            result = getTopology();
            break;
          default:
            throw "bad_request";
        }
      }
      break;
    case 'groups':
      if(path.length > 1) {
        if(path.length === 2 && 'info' === path[1]) {
          let ngroups = 0; ncidrs = 0;
          for (let grp in groups) {
            ngroups++;
            ncidrs += groups[grp].length;
          }
          result = {groups:ngroups, cidrs:ncidrs}; 
        }
        else throw "not_found";
      } else {
        switch(req.method) {
          case 'POST':
          case 'PUT':
            if(req.error) throw "bad_request";
            if(!setGroups('fv', req.body)) throw "bad_request";
            groups = req.body;
            storeSet('groups', groups);
            break;
          default: return groups;
        }
      }
      break;
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
    case 'metric':
      if(path.length === 1) result = points;
      else {
        if(path.length !== 2) throw "not_found";
        if(points.hasOwnProperty(path[1])) result = points[path[1]];
        else throw "not_found";
      }
      break;
    case 'nodes':
      if(path.length > 1) throw "not_found";
      result = nodes();
      break;
    case 'node':
      if(path.length !== 2) throw 'not_found';
      let nodename = path[1];
      let agent = req.query ? req.query.agent : null;
      result = nodeDetails(nodename,agent);
      break;
    case 'links':
      if(path.length > 1) throw "not_found";
      result = links();
      break;
    case 'hosts':
      if(path.length > 1) throw "not_found";
      result = hosts();
      break;
    default: throw 'not_found';
  } 
  return result;
});

