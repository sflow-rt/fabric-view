# Fabric View

Real-time visibility into elephant and mice flows in ECMP / MLAG data
center networks.

http://blog.sflow.com/2015/10/fabric-view.html

## To install

1. Copy files to the sFlow-RT app directory.
2. Restart sFlow-RT to load application.

Online help is available through web UI.

Data captured from the two leaf / two spine 10G network described in the
following article is included:

http://blog.sflow.com/2015/03/ecmp-visibility-with-cumulus-linux.html

To replay the data through sFlow-RT:

1. Add the following startup system property:
-Dsflow.file=app/fabric-view/demo/ecmp.pcap

2. Restart sFlow-RT

3. Install the topology:
demo/topology.json

4. Install the address groups:
demo/groups.json

For more information, visit:
http://www.sFlow-RT.com
