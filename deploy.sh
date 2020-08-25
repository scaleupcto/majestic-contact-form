npm install

echo "Pruning to last 10 versions"
sls prune -n 10

sls deploy --verbose
