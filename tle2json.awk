BEGIN {
  print "var starlink = [{"
  l = ""
}
/^1/ {
  g=substr($3,0,5)
  if (g != l) {
    if (l != "") {
      print "}, {"
    }
    l=g
  }
  printf("  \"%s\": [\n", name)
  printf("    \"%s\",\n", $0)
  next
}
/^2/ {
  printf("    \"%s\"\n  ],\n", $0)
  next
}
{
  name = $1
}
END {
  print "}];"
}
