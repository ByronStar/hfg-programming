#!/usr/bin/env bash
HOST=nz@dashdb-q100m-h1.svl.ibm.com
DIR=/export/home/nz/WLM
scp progsp_93.html ${HOST}:${DIR}/analyse
scp js/progsp_93.js ${HOST}:${DIR}/analyse/js
HOST=root@hqa-mpv4-14.swg.usma.ibm.com
DIR=/mount/pag-data02/benno
scp progsp_93.html ${HOST}:${DIR}/analyse
scp js/progsp_93.js ${HOST}:${DIR}/analyse/js
#scp js/xutils.js ${HOST}:${DIR}/analyse/js
#scp img/favicon.ico ${HOST}:${DIR}/analyse/img
#scp lib/Chart.min.js ${HOST}:${DIR}/analyse/lib
#scp data/wlm/capture_vt_system_util.out ${HOST}:${DIR}/analyse/data/wlm
#scp data/wlm/capture_vt_sched_sn.out ${HOST}:${DIR}/analyse/data/wlm
#scp data/wlm/capture_vt_sched_gra.out ${HOST}:${DIR}/analyse/data/wlm

#scp ${HOST}:${DIR}/startrun.lst ./startrun.lst
