cd `dirname $0`/static;
for f in img/*; do
  res=`ack $f ../client/`
  if [ $? -eq 1 ]; then
    echo $f
  fi
done
