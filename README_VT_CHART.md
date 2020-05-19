# IPS VT Table Charting #

This package contains a simple charting tool for vt table output visualization

# Install #

* copy the analyse.zip file to a new directory on your target system
* unzip the package
* copy or link directories containing vt table data under data/output
  * there are dropdown selectors  in the tool for subdirectory selection
  * currently the following vt table data is read from `data/output/<any dir>/`
    * capture_vt_system_util.out
    * capture_vt_sched_sn.out
    * capture_vt_sched_gra.out
    * optional: test_time.stats (WLM perftool output)
* start the crosss domain enabled web server via
      python2 ./analyseServer.py  

# Usage #
* Open url http://my.analyseserver.com:8000/index.html in a browser
* In order to compare two main output directories with data use:
 http://my.analyseserver.com:8000/index.html?dataL=data/outputIPS/&dataR=data/outputMako/
* To compare data from two other servers (running analyseServer.py) use http://my.analyseserver.com:8000/index.html?serverL=http://my.dataeserver1.com:8000/&serverR=http://my.dataeserver2.com:8000/
* there a possibility to filter data/output subdirectories by adding `&filter=<regular expression>` to the url
* In case a single column is selected a running average is calculated and shown. For the running average interval (default 10) another parameter `&interval=<number>` can be used to overwrite
