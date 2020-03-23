BEGIN {
  FS=", +"
  d = 0
  # JDTDB,CalendarDate(TDB),EC,QR,IN,OM,W,Tp,N,MA,TA, A,AD,PR,
  #                         3  4  5  6  7 8  9 10 11 12 13 14
  # JD   ,Date             ,e ,- ,i ,N ,w,- ,-,M ,- , a,- ,-
  # w1 = N + w
  # L = M + N + w
  print "var osc = {"
}
FNR==1{
  if (a!="") {
    print "  },"
  }
  a=""
}
/Target body name/ {
  sub(/Target body name: /,"")
  sub(/ .*/,"")
  print "  '"$0"': {"
}
/SOE/{
 d=1
 next
}
/EOE/{
 d=0
 next
}
d==1{
  if (a=="") {
    printf("    elem: { a: %1.8f, e: %1.8f, i: %1.8f, L: %1.8f, w1: %1.8f, N: %1.8f },\n",$12,$3,$5,$10+$7+$6,$7+$6,$6)
  } else {
    printf("    rate: { a: %1.8f, e: %1.8f, i: %1.8f, L: %1.8f, w1: %1.8f, N: %1.8f }\n",$12-a,$3-e,$5-i,$10+$7+$6-L,$7+$6-w1,$6-N)
  }
  a=$12
  e=$3
  i=$5
  L=$10+$7+$6
  w1=$7+$6
  N=$6
  M=$10
  w=$7
}
END {
  print "  }"
  print "}"
}
