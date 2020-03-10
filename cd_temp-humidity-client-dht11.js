//modified from Tom Igoe's adc-mcp-3xxx code:
//https://github.com/tigoe/NodeSensorExamples/blob/master/adc-mcp-3xxx/temp-humidity-client.js
//Provide feedback on the device’s current operational status as well, specifically: 

//Is it connected to a network
//Has it made contact with the remote server in the last hour
//Also include controls that allow a user to browse the current properties of the device locally, 
//including all sensor readings, network SSID, IP address, and connection status.


//initialzing and setting up sensor
var sensor = require('node-dht-sensor');
let device = {};
let readingInterval; //to clear later when data is read correctly

//initializing and setting up screen
const i2c = require('i2c-bus');
const i2cBus = i2c.openSync(1);
const screen = require('oled-i2c-bus');
const font = require('oled-font-5x7');
var screenOpts = {
	width:128,
	height: 64,
	address: 0x3C,
}
var oled = new screen(i2cBus, screenOpts)
let okToPrint = false;

let time;
//setting up HTTPS request 
const https = require('https');
let hostName = 'tigoe.io';
let macAddress = 'b8:27:eb:72:ac:22';
let sessionKey = 'd03a3856-c1ec-4147-9056-1178a19458c0';

function getServerResponse(response) {
	response.on('end', function (data){
		console.log(data);
	});
}

function readSensor() {
	sensor.read(11,4,function(err, temperature, humidity) {
		device.tempSensorVal = Number(temperature);
		device.humiditySensorVal = Number(humidity);
	});

	if (!isNaN(device.tempSensorVal) && !isNaN(device.humiditySensorVal)) {
		console.log(device);
		okToPrint = true;
		sendToServer(JSON.stringify(device));
		clearInterval(readingInterval);


	}
}

function sendToServer(dataToSend) {
	var postData = JSON.stringify({
		'macAddress': macAddress,
    	'sessionKey': sessionKey,
		'data': dataToSend

	});

	var options = {
		host: hostName,
		port: 443,
		path: '/data',
		method: 'POST',
		headers: {
			'User-Agent': 'nodejs',
			'Content-Type': 'application/json',
			'Content-Length': postData.length
		}
	};

	var request = https.request(options,getServerResponse);
	request.write(postData);
	request.end();
}

function displayContent(){
	let tempVar = String(device.tempSensorVal);
	let humidVar = String(device.humiditySensorVal);

	let now = new Date();

	time = now.getFullYear() + '/'
		+ now.getMonth() + '/'
        + now.getDate() +  ' '
		+ now.getHours() + ':'
		+ now.getMinutes();

	oled.clearDisplay();
	oled.setCursor(0,0);
	oled.writeString(font,1, 'data sent:' + "\n" + time, 1, true);
	oled.writeString(font,2, "\n" + 'temp:'+ tempVar + "\n" +'humidity:' + humidVar, 1, true);

}
function callToBoth(){
	readSensor();
	if (okToPrint){
		displayContent();
	}
	
}
console.log(getDate);
callToBoth();
readingInterval = setInterval(callToBoth,5000);
