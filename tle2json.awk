BEGIN {
  print "{"
}
/^1/ {
  printf("    \"%s\",\n", $0)
  next
}
/^2/ {
  printf("    \"%s\"\n  ],\n", $0)
  next
}
{
  printf("  \"%s\": [\n", $0)
}
END {
  print "}"
}
