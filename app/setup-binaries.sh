if [ ! -d "./bin/Exponent-2.app" ]
then
echo "no build exist. creating debug build."
# http://expo.io/--/api/v2/versions/download-ios-simulator-build
wget https://dpq5q02fu5f55.cloudfront.net/Exponent-2.4.6.tar.gz -O bin/Exponent-2.tar.gz
mkdir -p bin/Exponent-2.app
tar -zxf bin/Exponent-2.tar.gz -C bin/Exponent-2.app/
rm bin/Exponent-2.tar.gz
fi

exit 0
