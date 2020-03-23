#!/usr/bin/env bash
./osc_tbl "10" data/osc/sun.osc
#./osc_tbl "199" data/osc/mercury.osc
#./osc_tbl "299" data/osc/venus.osc
#./osc_tbl "399" data/osc/earth.osc
#./osc_tbl "499" data/osc/mars.osc
#./osc_tbl "599" data/osc/jupiter.osc
#./osc_tbl "699" data/osc/saturn.osc
#./osc_tbl "799" data/osc/uranus.osc
#./osc_tbl "899" data/osc/neptun.osc
#./osc_tbl "999" data/osc/pluto.osc
awk -f eph2json.awk data/osc/sun.osc data/osc/mercury.osc data/osc/venus.osc data/osc/earth.osc data/osc/mars.osc data/osc/jupiter.osc data/osc/saturn.osc data/osc/uranus.osc data/osc/pluto.osc
 # data/osc/neptun.osc
