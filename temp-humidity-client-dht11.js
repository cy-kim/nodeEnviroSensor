/*
  MCP3008 ADC temperature and humidity reader

  Reads two channels of an MCP3008 analog-to-digital converter
  and prints them out. Reads temperature and humidity using
 the Analog Devices TMP36 and the Honeywell HIH-4030.
 
 Example derived from the datasheets, and from numerous examples,
 including Adafruit, Bildr, the Arduino forums, and others:
 TMP36 datasheet:http://www.ladyada.net/media/sensors/TMP35_36_37.pdf
 HIH-4030 datasheet:https://www.sparkfun.com/datasheets/Sensors/Weather/SEN-09569-HIH-4030-datasheet.pdf
 Adafruit on TMP36: http://learn.adafruit.com/tmp36-temperature-sensor/
 Bildr on HIH-4030: http://bildr.org/2012/11/hih4030-arduino/
 Arduino forum example for HIH-4030: http://forum.arduino.cc/index.php/topic,19961.0.html
 my own example for Arduino: https://github.com/tigoe/SensorExamples/blob/master/EnvironmentalSensors/TempHumiditySensors/TempHumiditySensors.ino
 Circuit:
 * TMP36 on ADC input 0
 * HIH-4030 on ADC input 2

  created 3 March 2020
  by Tom Igoe
*/
var sensor = require("node-dht-sensor");
const i2c = require('i2c-bus');
const i2cBus = i2c.openSync(1);
const screen = require('oled-i2c-bus');
const font = require('oled-font-5x7');

let device = {};          // object for device characteristics
let readingInterval;      // interval to do readings (initialized at bottom)

const https = require('https');
// change the hostname, macAddress, and sessionKey to your own:
let hostName = 'tigoe.io';
let macAddress = 'A8:61:0A:B3:2A:DD';
let sessionKey = '06A4DA6E-4587-4030-B257-17D1E7B6EA2D';

var opts = {
   width: 128,     // screen width and height
   height: 64,
   address: 0x3C  // I2C address:check your particular model
};

// make an instance of the OLED library
var oled = new screen(i2cBus, opts);




//setInterval(readDHTSensor,1000);
/*
	the callback function to be run when the server response comes in.
	this callback assumes a chunked response, with several 'data'
	events and one final 'end' response.
*/
function getServerResponse(response) {
   // when the final chunk comes in, print it out:
   response.on('end', function (data) {
      console.log(data);
   });
}

// open two ADC channels:


//get sensor readings into the object called device:
function getReadings() {



   // get readings:
  sensor.read(11, 4, function(err, temperature, humidity) {
    device.tempSensorVal = Number(temperature);
    device.humiditySensorVal = Number(humidity);
    //console.log(device.tempSensorVal);
    //console.log(`temp: ${temperature}°C, humidity: ${humidity}%`);
  });
   // if they're both numbers:
  if (!isNaN(device.tempSensorVal) && !isNaN(device.humiditySensorVal)) {
      // print them and send to server:
      console.log(device);
      sendToServer(JSON.stringify(device));
      // stop reading:
      clearInterval(readingInterval);
   }
}

// assemble the HTTPS request and send it:
function sendToServer(dataToSend) {
   // make the POST data a JSON object and stringify it:
   var postData = JSON.stringify({
      'macAddress': macAddress,
      'sessionKey': sessionKey,
      'data': dataToSend
   });

   /*
    set up the options for the request.
    the full URL in this case is:
    http://example.com:443/data
   */
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

   var request = https.request(options, getServerResponse);	// start it
   request.write(postData);			// send the data
   request.end();			            // end it

}

function showTime() {
   // clear the screen:
   let tempVar = String(device.tempSensorVal); 
   let humidVar = String(device.humiditySensorVal);
   oled.clearDisplay();
   // set cursor to x = 0 y = 0:
   oled.setCursor(0, 0);
   // make a string of th time:
   
   oled.writeString(font, 2, 'temp:' + "\n"+ tempVar + 'humidity:' + humidVar, 1, true); //has to be string
}

//showTime();
// // update once per second:
setInterval(showTime, 1000);

// set an interval to keep running. The callback function (getReadings)
// will clear the interval when it gets good readings:
readingInterval = setInterval(getReadings, 1000);