const stationName = "1 Mile SW of Decatur HS";
const appKey = '46683753c1254679ba68ccbd271fd21ee6cb02a2e6894cb0825d09078559c77c'; // Original application key
const personalKey = '741a7e0d855944c2b1bea7bca12535dffcf0a73c208144838c8d1c2cee196370'; // Personal key
const deviceId = 'BC:DD:C2:AF:1D:BB'; // Replace with your device ID
const baseUrl = `https://api.ambientweather.net/v1/devices/${deviceId}?applicationKey=${appKey}&apiKey=${personalKey}`;

let lastUpdateTime = null; // To track the last update time
let checkingEveryMinute = false; // Flag to switch schedules

let updateTimer = null;
let intervalId = null;

function calculateDewPoint(temperature, humidity, pressureInHg = 29.723) {
    console.log("DP Temperature: ", temperature);
    console.log("DP Humidity: ", humidity);
    console.log("DP ABS Pressure ", pressureInHg);
    

  if (isNaN(temperature) || isNaN(humidity) || isNaN(pressureInHg)) {
      console.warn("Invalid inputs for dew point calculation:", { temperature, humidity, pressureInHg });
      return null; // Safeguard against invalid inputs
  }

  const tempCelsius = (temperature - 32) / 1.8;
  const pressureHpa = pressureInHg * 33.8639;
  const e_s = 6.112 * Math.exp((17.67 * tempCelsius) / (tempCelsius + 243.5)) * (pressureHpa / 1013.25);
  const e = e_s * (humidity / 100);
  const dewPointCelsius = (243.5 * Math.log(e / 6.112)) / (17.67 - Math.log(e / 6.112));
  const dewPointFahrenheit = (dewPointCelsius * 1.8) + 32;

  return Number(dewPointFahrenheit.toFixed(2)); // Ensure output is a valid number
}




async function fetchWeatherData() {
  try {
      const response = await fetch(baseUrl);
      console.log("API Response: ", response);

      if (response.ok) {
          const data = await response.json();
          console.log("Parsed Data: ", data);

          // Extract observation object
          const observation = data[0];
          console.log("Observation Object: ", observation);

          // Extract required variables
          const temperature = observation.tempf;
          const humidity = observation.humidity;
          const absPressure = observation.baromabsin; // Ambient API ABS pressure in inHg
          console.log("API ABS Pressure: ", absPressure);
          const relPressure = observation.baromrelin; // Ambient API REL pressure in inHg
          console.log("API REL Pressure: ", relPressure);
          const lastRain = observation.lastRain;
          if (lastRain) {
            console.log("Last Rain Time (UTC): ", lastRain);

            const localLastRain = new Date(lastRain).toLocaleString(); // Convert to local time
            console.log("Last Rain Time (Local): ", localLastRain);


          // Calculate dew point using enhanced function
          const dewPoint = calculateDewPoint(temperature, humidity, absPressure);
          console.log("Fetch Call DP: ", dewPoint);
          // Convert the value from Klux to Lux and format it with commas
          const solarRadiationValue = (observation.solarradiation * 100).toFixed(0); // Convert Klux to Lux
          const formattedValue = solarRadiationValue.replace(/\B(?=(\d{3})+(?!\d))/g, ","); // Add commas
          const calibrationFactor = 1.266;
          const approximateWatts = solarRadiationValue * 0.0079 * calibrationFactor;
          console.log("Approximate Watts (W/m²): ", approximateWatts);

          // Update DOM elements for station data
          document.getElementById("station-id").textContent = stationName;
          document.getElementById("temperature").textContent = temperature.toFixed(1); // Temperature in Fahrenheit
          document.getElementById("humidity").textContent = humidity.toFixed(0); // Relative Humidity percentage
          document.getElementById("dew-point").textContent = dewPoint; // Dew point in Fahrenheit
          document.getElementById("rel-pressure").textContent = relPressure.toFixed(3); // Pressure in inHg
          document.getElementById("wind-speed").textContent = observation.windspeedmph.toFixed(1); // Wind Speed in mph
          document.getElementById("wind-gust").textContent = observation.windgustmph.toFixed(1); // Wind Gust in mph
          document.getElementById("solar-radiation").textContent = `${formattedValue}`; // Solar Radiation
          document.getElementById("uv-index").textContent = observation.uv.toFixed(0); // UV Index

          const wattsElement = document.getElementById("approx-watts");
          if (wattsElement) {
            wattsElement.textContent = approximateWatts.toFixed(2); // Format to two decimal places
            } else {
                console.warn("Element with ID 'approx-watts' is missing!");
            }

          const maxDailyGust = observation.maxdailygust;
          console.log("Max Daily Gust: ", maxDailyGust);

          const maxDailyGustElement = document.getElementById("max-daily-gust");
          if (maxDailyGustElement) {
            maxDailyGustElement.textContent = maxDailyGust.toFixed(1); // Format to one decimal place
            } else {
                console.warn("Element with ID 'max-daily-gust' is missing!");
            }

          const windChill = getWindChillOrDefault(observation);
          document.getElementById("wind-chill").textContent = `${windChill}`; // Wind Chill in Fahrenheit
          
          const windDirection = convertDegreesToCardinal(observation.winddir);
          document.getElementById("wind-dir").textContent = `${observation.winddir}° (${windDirection})`;

          document.getElementById("precip-rate").textContent = observation.hourlyrainin.toFixed(2); // Hourly precipitation rate
          document.getElementById("total-precip").textContent = observation.dailyrainin.toFixed(2); // Total daily precipitation

          const lastRainElement = document.getElementById("last-rain");
          if (lastRainElement) {
            lastRainElement.textContent = localLastRain;
            } 
            else {
                console.warn("Element with ID 'last-rain' is missing!");
            }
            } else {
                console.warn("'lastRain' field is missing in the observation object!");
            }

          // Update last update time
          const lastUpdate = observation.dateutc ? new Date(parseInt(observation.dateutc)) : null;
          if (!lastUpdate) {
              console.error("dateutc is missing or invalid in the observation");
              return;
          }
          console.log("Last Update Time: ", lastUpdate);

          if (observation.dateutc !== lastUpdateTime) {
              lastUpdateTime = observation.dateutc; // Update to the new update time
              document.getElementById("last-update").textContent = lastUpdate.toLocaleString();
              checkingEveryMinute = false; // Switch back to 5-minute schedule
              console.log("On 5-minute schedule.");
          } else {
              console.log("No Data Update... ");
              if (!checkingEveryMinute) {
                  checkingEveryMinute = true; // Activate 30-sec schedule
                  startCheckingEveryMinute(); // Switch schedules
              }
              return; // Skip UI update if data hasn't changed
          }

          // Update "Current Condition"
          const currentHour = new Date().getHours();
          const currentCondition = guessCurrentCondition(observation, currentHour);
          console.log("Current Condition: ", currentCondition);

          const currentConditionElem = document.getElementById("current-condition");
          if (currentConditionElem) {
              currentConditionElem.textContent = currentCondition;
          } else {
              console.warn("Element with ID 'current-condition' is missing!");
          }

          
      } else {
          console.error("Error fetching API data:", response.statusText);
      }
  } catch (error) {
      console.error("Unexpected error occurred during API fetch:", error.message);
  }
}





// Convert radial degrees to cardinal degrees
function convertDegreesToCardinal(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5);
    return directions[index % 16];
}


function getWindChillOrDefault(observation) {
  const temperature = observation.tempf;
  const windSpeed = observation.windspeedmph;

  // Check if wind chill is provided by the API
  const windChillFromApi = observation.windchillf;

  if (temperature > 50) {
      // Default to actual temperature when above 50°F
      return temperature.toFixed(1);
  }

  if (windChillFromApi !== undefined) {
      // Use wind chill from the API if it exists
      return windChillFromApi.toFixed(1);
  }

  if (windSpeed > 3.0) {
      // Calculate wind chill if conditions apply
      return calculateWindChill(temperature, windSpeed);
  }

  // Default to temperature if wind speed is too low
  return temperature.toFixed(1);
}

function calculateWindChill(tempF, windSpeedMph) {
  // Wind chill calculation only applies if wind speed > 3 mph
  if (tempF <= 50 && windSpeedMph > 3.0) {
      return (
          35.74 +
          (0.6215 * tempF) -
          (35.75 * Math.pow(windSpeedMph, 0.16)) +
          (0.4275 * tempF * Math.pow(windSpeedMph, 0.16))
      ).toFixed(1);
  }
  return tempF.toFixed(1); // Default to actual temperature
}


// Poll weather function to determine and return a guess of current weather conditions
function guessCurrentCondition(observation, currentHour) {
  let conditions = [];
  console.log("Observation Passed to guessCurrentCondition: ", observation);
  console.log("Current Hour Passed: ", currentHour);

  // Extract observation values
  const absPressure = observation.baromabsin !== undefined ? observation.baromabsin : 29.92;
  const temperature = observation.tempf !== undefined ? observation.tempf : null;
  const humidity = observation.humidity !== undefined ? observation.humidity : null;
  const windSpeed = observation.windspeedmph !== undefined ? observation.windspeedmph : 0;
  const windGust = observation.windgustmph !== undefined ? observation.windgustmph : 0;
  const solarRadiation = observation.solarradiation !== undefined ? observation.solarradiation : 0;
  const uvIndex = observation.uv !== undefined ? observation.uv : null;
  const precipRate = observation.hourlyrainin !== undefined ? observation.hourlyrainin : 0;

  // Log key values for debugging
  console.log("Temperature: ", temperature);
  console.log("Humidity: ", humidity);
  console.log("Wind Speed: ", windSpeed);
  console.log("Wind Gust: ", windGust);
  
  console.log("Solar Radiation: ", solarRadiation);
  console.log("UV Index: ", uvIndex);
  console.log("Precipitation Rate: ", precipRate);

  // Get dew point
  console.log("Temperature: ", temperature);
  console.log("Humidity: ", humidity);
  const dewPoint = calculateDewPoint(temperature, humidity, absPressure);
  console.log("Guess Call DP : ", dewPoint);
    if (typeof dewPoint === "number") {
        console.log(`API Dew Point: ${dewPoint.toFixed(1)}°F`);
    } else {
        console.warn("Dew Point calculation returned an invalid value.");
        console.log("Dew Point: N/A");
    }

  // Check for conditions
  const snowResult = snowCheck(observation);
  if (snowResult[0]) { // Ensure snow is possible before adding
      console.log("Adding Snow Condition: ", { condition: `❄️ Snow (${snowResult[1]}%)`, severity: snowResult[1] });
      conditions.push({ condition: `❄️ Snow (${snowResult[1]}%)`, severity: snowResult[1] });
  }

  const rainCondition = precipCondition(observation);
  if (rainCondition && rainCondition !== false) { // Exclude invalid values
      const rainSeverityMap = {
          "🌧️ Misting": 10,
          "🌧️ Drizzling": 15,
          "🌧️ Light Rain": 20,
          "🌧️ Raining": 25,
          "🌧️ Moderate Rain": 30,
          "🌧️ Heavy Rain": 35,
          "🌧️ Very Heavy Rain": 40,
          "🌧️ Downpour": 50,
          "🌧️ Heavy Downpour": 60,
          "🌧️ Torrential Downpour": 70,
          "🌧️ Heavy Torrential Downpour": 80,
          "🌧️ Extreme Torrential Downpour": 120
      };
      const severity = rainSeverityMap[rainCondition] || 0;
      console.log("Adding Rain Condition: ", { condition: rainCondition, severity: rainSeverityMap[rainCondition] || 0 });
      conditions.push({ condition: rainCondition, severity });
  }

  const windCondition = windCheck(windSpeed, windGust);
  if (windCondition && windCondition !== false) { // Ensure valid wind condition
    const windSeverityMap = {
        "💨 Light Breeze": 10,
        "💨 Light Wind": 20,
        "💨 Light Gust": 25,
        "💨 Mild Gust": 30,
        "💨 Gusty Winds": 40,
        "💨 Strong Gusty Winds": 50,
        "💨 Storm Gust Winds": 60,
        "💨 Strong Winds": 70,
        "💨 Stormy Winds": 80,
        "💨 Strong Storm Winds": 90,
        "💨 Gale Force Winds": 100,
        "💨 Gale Force Gusts": 110
    };
      const severity = windSeverityMap[windCondition] || 0;
      console.log("Adding Wind Condition: ", { condition: windCondition, severity: windSeverityMap[windCondition] || 0 });
      conditions.push({ condition: windCondition, severity });
  }

  const solarCondition = solarCheck(solarRadiation, uvIndex, humidity, temperature, dewPoint, observation.windspeedmph, currentHour);
  if (solarCondition && solarCondition !== false) { // Exclude invalid values
      const solarSeverityMap = {
          "😎 Bright Sun": 20,
          "💦😎 Muggy": 30,
          "🌤️ Partly Sunny": 10,
          "🌤️ Hazy": 10,
          "🌫️ Foggy": 15,
          "☁️ Overcast": 10,
          "☀️ Sunny": 15,
          "🌄 Morning": 5,
          "🌇 Twilight": 5,
          "🌃 Night": 5,
          "😌 Calm": 1
      };
      const severity = solarSeverityMap[solarCondition] || 0;
      console.log("Adding Solar Condition: ", { condition: solarCondition, severity: solarSeverityMap[solarCondition] || 0 });
      conditions.push({ condition: solarCondition, severity });
  }

  console.log("Final Conditions Array (Pre-Sort): ", conditions);
  // Sort conditions by severity (highest first)
  conditions = conditions.filter(item => item.condition !== false); // Ensure no false values are included
  conditions.sort((a, b) => b.severity - a.severity);
  console.log("Final Conditions Array (Post-Sort): ", conditions);

  // Determine the most severe condition or fallback
  const mostSevereCondition = conditions.length > 0 ? conditions[0].condition : "😌 Calm";

  // Add temperature descriptor
  const temperatureDescriptor = getTemperatureDescriptor(temperature);
  console.log("Temperature Descriptor: ", temperatureDescriptor);

  // Set background based on temperature
  setBackgroundColor(temperatureDescriptor);

  // Combine and return
  return `${mostSevereCondition || "Unknown"} & ${temperatureDescriptor || "Unknown"}`;
}

    
function snowCheck(observation) {
    const absPressure = observation.baromabsin !== undefined ? observation.baromabsin : 29.92;
    const temperature = observation.tempf; // Using AmbientWeather temperature
    const humidity = observation.humidity; 
    const dewPoint = calculateDewPoint(temperature, humidity, absPressure);
    console.log("Snow Call DP: ", dewPoint);

    if (temperature >= 34 || dewPoint > 30 || humidity < 70) {
        return [false, 0]; // No snow
  }
    
    // Base snow chance calculation
    let snowChance = 0;

    // Rebalanced resolution for snow chance calculation
    if (temperature < 34 && dewPoint <= 29 && humidity >= 70) {
        snowChance += 40; // Base chance

        // Adjust based on temperature proximity to dew point
        const tempDewPointGap = Math.abs(temperature - dewPoint);
        if (tempDewPointGap <= 1) snowChance += 20; // Very close to dew point
        else if (tempDewPointGap <= 3) snowChance += 15;
        else if (tempDewPointGap <= 5) snowChance += 10;
        else if (tempDewPointGap <= 10) snowChance += 5;

        // Adjust based on humidity levels (greater influence on snow chance)
        if (humidity >= 75) snowChance += 10;
        if (humidity >= 80) snowChance += 15;
        if (humidity >= 90) snowChance += 20;
        if (humidity >= 95) snowChance += 25;

        // Adjust based on dew point proximity (higher points for 25°F–29°F range)
        if (dewPoint >= 25 && dewPoint <= 29) snowChance += 25; // Most likely range
        else if (dewPoint >= 20 && dewPoint < 25) snowChance += 15; // Moderate range
        else if (dewPoint >= 18 && dewPoint < 20) snowChance += 10; // Less likely range
        else if (dewPoint < 18) snowChance += 5; // Minimal chance
    }

    // Ensure snow chance doesn't exceed 100%
    snowChance = Math.min(snowChance, 100);

    return [true, snowChance]; // Snow conditions likely with calculated chance
}
    

function precipCondition(observation) {
  const temperature = observation.tempf;
  const precipRate = observation.hourlyrainin;

  if (temperature <= 32) {
      return [false];
  }
    
  // Determine rain condition based on precipitation rate
  let rainCondition;
  if (precipRate > 0 && precipRate <= 0.025) {
      rainCondition = "🌧️ Misting";
  } else if (precipRate > 0.025 && precipRate <= 0.04) {
      rainCondition = "🌧️ Drizzling";
  } else if (precipRate > 0.04 && precipRate <= 0.10) {
      rainCondition = "🌧️ Light Rain";
  } else if (precipRate > 0.10 && precipRate <= 0.30) {
      rainCondition = "🌧️ Raining";
  } else if (precipRate > 0.30 && precipRate <= 0.50) {
      rainCondition = "🌧️ Moderate Rain";
  } else if (precipRate > 0.50 && precipRate <= 0.65) {
      rainCondition = "🌧️ Heavy Rain";
  } else if (precipRate > 0.65 && precipRate <= 0.75) {
      rainCondition = "🌧️ Very Heavy Rain";
  } else if (precipRate > 0.75 && precipRate <= 0.85) {
      rainCondition = "🌧️ Downpour";
  } else if (precipRate > 0.85 && precipRate <= 1.0) {
      rainCondition = "🌧️ Heavy Downpour";
  } else if (precipRate > 1.0 && precipRate <= 1.5) {
      rainCondition = "🌧️ Torrential Downpour";
  } else if (precipRate > 1.5 && precipRate <= 1.75) {
      rainCondition = "🌧️ Heavy Torrential Downpour";
  } else if (precipRate > 1.75) {
      rainCondition = "🌧️ Extreme Torrential Downpour";
  }

  return rainCondition;
}
    
    
function windCheck(windSpeed, windGust) {
  // Return null if both windSpeed and windGust are 0
  if (windSpeed === 0 && windGust === 0) {
    return null; // Return null to indicate no wind condition
  }

  // Determine wind condition based on windSpeed and windGust
  let windCondition;
  if (windSpeed > 30) {
      windCondition = "💨 Gale Force Winds";
  } else if (windSpeed > 25 && windSpeed <= 30) {
      windCondition = "💨 Strong Storm Winds";
  } else if (windGust > 25) {
      windCondition = "💨 Gale Force Gusts";
  } else if (windSpeed > 17 && windSpeed <= 25) {
      windCondition = "💨 Stormy Winds";
  } else if (windGust > 19 && windGust <= 25) {
      windCondition = "💨 Strong Storm Gusts";
  } else if (windSpeed > 13 && windSpeed <= 17) {
      windCondition = "💨 Strong Winds";
  } else if (windGust > 14 && windGust <= 19) {
      windCondition = "💨 Storm Gust Winds";
  } else if (windGust > 10 && windGust <= 14) {
      windCondition = "💨 Strong Gusty Winds";
  } else if (windSpeed > 10 && windSpeed <= 13) {
      windCondition = "💨 Very Windy";
  } else if (windGust > 7 && windGust <= 10) {
      windCondition = "💨 Gusty Winds";
  } else if (windSpeed > 7 && windSpeed <= 10) {
      windCondition = "💨 Windy";
  } else if (windGust > 5 && windGust <= 7) {
      windCondition = "💨 Mild Gust";
  } else if (windGust > 3 && windGust <= 5) {
      windCondition = "💨 Light Gust";
  } else if (windSpeed > 4 && windSpeed <= 7) {
      windCondition = "💨 Light Wind";
  } else if (windSpeed > 1 && windSpeed <= 4) {
      windCondition = "💨 Light Breeze";
  }

  return windCondition || null; // Return null if no condition matches
}
    

function solarCheck(solarRadiation, uvIndex, humidity, temperature, dewPoint, windspeedmph, currentHour) {
    // Determine solar condition
    let solarCondition = null;
  
    if (solarRadiation > 600 && uvIndex > 4) {
        solarCondition = "😎 Bright Sun";
    } else if (solarRadiation > 59 && uvIndex > 0 && humidity > 70 && temperature > 75) {
        solarCondition = "💦😎 Muggy";
    } else if (humidity > 69 && solarRadiation >= 119 && solarRadiation < 299) {
        solarCondition = "🌤️ Partly Sunny";
    } else if (humidity > 69 && solarRadiation > 59 && solarRadiation < 119) {
        solarCondition = "🌤️ Hazy";
    } else if (solarRadiation < 15 && humidity >= 90 && (temperature - dewPoint) <= 2 && windspeedmph < 3) {
        solarCondition = "🌫️ Foggy";
    } else if (solarRadiation >= 1 && solarRadiation < 59 && (temperature - dewPoint <= 7)) {
        solarCondition = "☁️ Overcast";
    } else if (solarRadiation > 15 && humidity < 70) {
        solarCondition = "☀️ Sunny";
    } else if (solarRadiation > 0 && solarRadiation < 5 && currentHour >= 16) {
        solarCondition = "🌇 Twilight";
    } else if (solarRadiation > 0 && solarRadiation <= 15 && (currentHour >= 6 && currentHour < 11)) {
        solarCondition = "🌄 Morning";
    } else if (solarRadiation <= 0 && (currentHour >= 16 || currentHour < 8)) {
        solarCondition = "🌃 Night";
    }
  
    // Use "😌 Calm" only if no other condition matches
    return solarCondition || "😌 Calm";
  }
  



function getTemperatureDescriptor(temp) {
    if (temp < 15) return "Extreme Cold";
    if (temp >= 15 && temp < 25) return "Bitter Cold";
    if (temp >= 25 && temp < 34) return "Freezing";
    if (temp >= 34 && temp < 55) return "Cold";
    if (temp >= 55 && temp < 65) return "Cool";
    if (temp >= 65 && temp < 75) return "Mild";
    if (temp >= 75 && temp < 82) return "Warm";
    if (temp >= 82 && temp < 90) return "Hot";
    if (temp >= 90 && temp < 96) return "Very Hot";
    if (temp >= 96) return "Extreme Heat";

    return "Unknown";
}

function setBackgroundColor(descriptor) {
    const element = document.querySelector('.group.current-condition');
    element.classList.remove('extreme-cold', 'bitter-cold', 'freezing', 'cold', 'cool', 'mild', 'warm', 'hot', 'very-hot', 'extreme-heat');

    switch (descriptor) {
        case 'Extreme Cold':
            element.classList.add('extreme-cold');
            break;
        case 'Bitter Cold':
            element.classList.add('bitter-cold');
            break;
        case 'Freezing':
            element.classList.add('freezing');
            break;
        case 'Cold':
            element.classList.add('cold');
            break;
        case 'Cool':
            element.classList.add('cool');
            break;
        case 'Mild':
            element.classList.add('mild');
            break;
        case 'Warm':
            element.classList.add('warm');
            break;
        case 'Hot':
            element.classList.add('hot');
            break;
        case 'Very Hot':
            element.classList.add('very-hot');
            break;
        case 'Extreme Heat':
            element.classList.add('extreme-heat');
            break;
        case 'Unknown':
            element.classList.add('unknown');
            break;
    }
}

function calculateTimeUntilNextUpdate() {
  const now = new Date();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  const nextIntervalMinutes = Math.ceil(minutes / 5) * 5;

  const nextUpdateTime = new Date(now);
  nextUpdateTime.setMinutes(nextIntervalMinutes);
  nextUpdateTime.setSeconds(25); // Buffer
  nextUpdateTime.setMilliseconds(0);

  if (nextUpdateTime <= now) {
      nextUpdateTime.setMinutes(nextUpdateTime.getMinutes() + 5);
  }

  return Math.ceil((nextUpdateTime.getTime() - now.getTime()) / 1000);
}


function clearAndResetTimer() {
  if (updateTimer) {
      clearInterval(updateTimer);
      updateTimer = null; // Reset to avoid unintended behavior
  }
}

function startCheckingEveryMinute() {
    console.log("On 30-Seconds schedule...");
    setTimeout(() => {
        // Perform the 30-second check after the delay
        fetchWeatherData(); 
        checkingEveryMinute = false; // Reset to normal schedule after the check
        console.log("30-second check complete. Returning to 5-minute schedule.");
    }, 30000); // Wait 30 seconds before executing the fetch
}



function updateCountdownText(nextUpdateTimerElem, secondsRemaining) {
  nextUpdateTimerElem.textContent = secondsRemaining === 0
      ? "Updating..."
      : `${secondsRemaining} seconds`;
}

function calculateNextUpdate(lastUpdate) {
    const nextUpdateTime = new Date(lastUpdate);
    nextUpdateTime.setMinutes(nextUpdateTime.getMinutes() + 5);
    nextUpdateTime.setSeconds(0); // Ensure seconds are set to 0 for clean display
    nextUpdateTime.setMilliseconds(0);
    return nextUpdateTime;
}

// Example usage:
const lastUpdate = new Date(); // Replace with actual timestamp of the last update
const nextUpdateTime = calculateNextUpdate(lastUpdate);

// Update the "Next Update Time" display
document.getElementById("next-update-time").textContent = nextUpdateTime.toLocaleString([], { 
    year: 'numeric', 
    month: 'numeric', 
    day: 'numeric', 
    hour: 'numeric', 
    minute: 'numeric' 
});



document.addEventListener("DOMContentLoaded", () => {
  fetchWeatherData(); // Fetch weather data immediately when the page loads

  // Start the countdown timer with a synchronized duration
  startNextUpdateTimer();

  // Periodically restart the synchronized timer
  setInterval(() => {
      startNextUpdateTimer(); // Restart the countdown timer for the next update
  }, 325000); // Restart every 325 seconds (5 minutes + 25 seconds)

  // Countdown timer for the next update
  function startNextUpdateTimer() {
    const nextUpdateTimerElem = document.getElementById("next-update"); // Countdown timer
    const nextUpdateTimeElem = document.getElementById("next-update-time"); // Next update timestamp

    // Ensure DOM elements exist
    if (!nextUpdateTimerElem || !nextUpdateTimeElem) {
        console.warn("Countdown timer or next update time element is missing!");
        return;
    }

    // Clear any existing timer
    clearInterval(updateTimer);

    // Calculate the time until the next 5-minute mark with a 15-second buffer
    const secondsUntilNextUpdate = calculateTimeUntilNextUpdate();

    // Determine the exact next update time (internal logic includes the buffer)
    const nextUpdateTime = new Date();
    nextUpdateTime.setSeconds(nextUpdateTime.getSeconds() + secondsUntilNextUpdate);

    // Create a user-facing timestamp without the 15-second buffer
    const displayNextUpdateTime = new Date(nextUpdateTime.getTime() - 25000);

    // Update the "Next Update Time" display (user-facing timestamp)
    nextUpdateTimeElem.textContent = displayNextUpdateTime.toLocaleString([], { 
        year: 'numeric', 
        month: 'numeric', 
        day: 'numeric', 
        hour: 'numeric', 
        minute: 'numeric', 
        second: 'numeric' 
    });

    // Start countdown timer (seconds)
    updateTimer = setInterval(() => {
        const now = new Date();
        const secondsRemaining = Math.max(0, Math.ceil((nextUpdateTime - now) / 1000));

        // Update countdown timer display
        nextUpdateTimerElem.textContent = secondsRemaining === 0
            ? "Updating..."
            : `${secondsRemaining} seconds`;

        // When the timer hits 0
        if (secondsRemaining === 0) {
            clearInterval(updateTimer); // Stop the timer
            fetchWeatherData(); // Fetch new data
            startNextUpdateTimer(); // Recalculate and restart the timer for the next update
        }
    }, 1000); // Update every second
}



  // Start the countdown timer immediately
  startNextUpdateTimer();
});


