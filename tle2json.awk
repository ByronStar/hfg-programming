BEGIN {
  l = ""
  c = 0
  f = 1
}
FNR==1 {
  if (FILENAME && FILENAME != "-") {
    file=FILENAME
  }
  sub(/\..*/,"",file)
  printf("{\n  \"name\": \"%s\",\n  \"date\": \"%s\",\n  \"tles\": [{\n",toupper(file), d)
}
/^1/ {
  g=substr($3,1,5)
  if (g != l) {
    if (l != "" && c > 5) {
      print "}, {"
      f = 1
    }
    l = g
    c = 0
  }
  if (f == 1) {
    printf("    \"%s\": [\n", name)
  } else {
    printf(",\n    \"%s\": [\n", name)
  }
  f = 0
  printf("      \"%s\",\n", $0)
  c++
  next
}
/^2/ {
  printf("      \"%s\"\n    ]", $0)
  next
}
{
  name = $0
  sub(/ *$/,"",name)
  if (name in names) {
    name = name "-" names[name]++
  } else {
    names[name] = 1;
  }
}
END {
  print "\n  }]\n}"
}
