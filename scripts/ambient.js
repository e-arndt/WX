const apiKey = 'YOUR_API_KEY';
const appKey = 'YOUR_APP_KEY';
const deviceID = 'YOUR_DEVICE_ID';
const url = `https://api.ambientweather.net/v1/devices/${deviceID}?apiKey=${apiKey}&applicationKey=${appKey}`;

fetch(url)
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
