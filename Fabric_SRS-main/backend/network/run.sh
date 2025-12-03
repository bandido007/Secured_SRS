clear

echo "##########################################"
echo "Network down"
echo "##########################################"
echo ""

./network.sh down

echo ""
echo "##########################################"
echo "Network up with CA & Couchdb"
echo "##########################################"
echo ""

pwd

./network.sh up -ca -s couchdb

echo ""
echo "##########################################"
echo "Creating channel"
echo "##########################################"
echo ""

./network.sh createChannel

echo ""
echo "##########################################"
echo "Deploying chaincode"
echo "##########################################"
echo ""

./network.sh deployCC -ccn basic -ccv 1.0 -ccl javascript -ccp ../chaincode

echo ""
echo "##########################################"
echo "Done"
echo "##########################################"