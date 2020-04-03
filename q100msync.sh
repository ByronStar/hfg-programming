#!/usr/bin/env bash
HOST=nz@dashdb-q100m-h1.svl.ibm.com
DIR=/export/home/nz/WLM
#scp progsp_93.html ${HOST}:${DIR}/analyse
scp js/progsp_93.js ${HOST}:${DIR}/analyse/js
#scp analyseServer.py ${HOST}:${DIR}/analyse

HOST=root@hqa-mpv4-14.swg.usma.ibm.com
DIR=/mount/pag-data02/benno
#scp progsp_93.html ${HOST}:${DIR}/analyse
scp js/progsp_93.js ${HOST}:${DIR}/analyse/js
#scp analyseServer.py ${HOST}:${DIR}/analyse
#scp js/xutils.js ${HOST}:${DIR}/analyse/js
#scp img/favicon.ico ${HOST}:${DIR}/analyse/img
#scp lib/Chart.min.js ${HOST}:${DIR}/analyse/lib
#scp data/wlm/capture_vt_system_util.out ${HOST}:${DIR}/analyse/data/wlm
#scp data/wlm/capture_vt_sched_sn.out ${HOST}:${DIR}/analyse/data/wlm
#scp data/wlm/capture_vt_sched_gra.out ${HOST}:${DIR}/analyse/data/wlm

#scp ${HOST}:${DIR}/startrun.lst ./startrun.lst

# export TST_ROOT=/export/home/nz/nz-test/sqltest_root
# export TEST_NAME=wlm_install_test
# perl wlm.pl --stress --groupDetails='g1:10-100-N:dro:1,g2:10-100-N:minianalytics:1,g3:10-100-N:load:1' --testDuration=60 --graHorizon=1800 --validate='gra' > ./logfiles/$TEST_NAME.log 2>&1

HOST=root@9.18.74.179
DIR=/root/benno
#scp progsp_93.html ${HOST}:${DIR}/analyse
scp js/progsp_93.js ${HOST}:${DIR}/analyse/js
#scp analyseServer.py ${HOST}:${DIR}/analyse
#zip analyse.zip progsp_93.html js/progsp_93.js js/xutils.js img/favicon.ico lib/Chart.min.js data/wlm/capture_vt_system_util.out data/wlm/capture_vt_sched_sn.out data/wlm/capture_vt_sched_gra.out
#scp analyse.zip ${HOST}:${DIR}

# nzsql -d TPCDS1024B -Ant -f check_sizes.sql
# SELECT COUNT(*) FROM CALL_CENTER;
# SELECT COUNT(*) FROM CATALOG_PAGE;
# SELECT COUNT(*) FROM CATALOG_RETURNS;
# SELECT COUNT(*) FROM CATALOG_SALES;
# SELECT COUNT(*) FROM CUSTOMER;
# SELECT COUNT(*) FROM CUSTOMER_ADDRESS;
# SELECT COUNT(*) FROM CUSTOMER_DEMOGRAPHICS;
# SELECT COUNT(*) FROM CUSTOMER_LOAD;
# SELECT COUNT(*) FROM CUSTOMER_LOAD_TMP;
# SELECT COUNT(*) FROM CUSTOMER_SMALL;
# SELECT COUNT(*) FROM DATE_DIM;
# SELECT COUNT(*) FROM DBGEN_VERSION;
# SELECT COUNT(*) FROM HOUSEHOLD_DEMOGRAPHICS;
# SELECT COUNT(*) FROM INCOME_BAND;
# SELECT COUNT(*) FROM INVENTORY;
# SELECT COUNT(*) FROM ITEM;
# SELECT COUNT(*) FROM JUNK_STORE_RETURNS;
# SELECT COUNT(*) FROM MULTIPLIER;
# SELECT COUNT(*) FROM PROMOTION;
# SELECT COUNT(*) FROM REASON;
# SELECT COUNT(*) FROM SHIP_MODE;
# SELECT COUNT(*) FROM STORE;
# SELECT COUNT(*) FROM STORE_RETURNS;
# SELECT COUNT(*) FROM STORE_SALES;
# SELECT COUNT(*) FROM THIN_TBL;
# SELECT COUNT(*) FROM TIME_DIM;
# SELECT COUNT(*) FROM WAREHOUSE;
# SELECT COUNT(*) FROM WEB_PAGE;
# SELECT COUNT(*) FROM WEB_RETURNS;
# SELECT COUNT(*) FROM WEB_SALES;
# SELECT COUNT(*) FROM WEB_SITE;

# awk '/2020-04-01-09.22.25.709687-420/{p=1;next}/2020-04-01-09.22.26.261635-420/{p=0;next}p==1{print}' db2diag.log
