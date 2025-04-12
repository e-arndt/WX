const apiKey = '032b36ea99f94242ab36ea99f93242eb';
const stationId = "KWAFEDER5";
const baseUrl = `https://api.weather.com/v2/pws/observations/current?stationId=${stationId}&format=json&units=e&apiKey=${apiKey}`;

let updateTimer;

// Define calculateDewPoint globally
function calculateDewPoint(temperature, humidity) {
    return temperature - ((100 - humidity) / 5); // Simplified formula
}


async function fetchWeatherData() {
    try {
        const response = await fetch(baseUrl);
        console.log("API Response: ", response);
        if (response.ok) {
            const data = await response.json();
            console.log("Parsed Data: ", data); // Log the parsed JSON data
            console.log("Observations: ", data.observations);

            const observation = data.observations[0];
            console.log("Observation Object: ", observation); // Log the specific observation data

            const dewPoint = calculateDewPoint(observation.imperial.temp, observation.humidity);


            // Update HTML with observation data
            document.getElementById("station-id").textContent = observation.stationID;
            document.getElementById("temperature").textContent = observation.imperial.temp;
            document.getElementById("humidity").textContent = observation.humidity;
            document.getElementById("dew-point").textContent = dewPoint.toFixed(1);
            document.getElementById("wind-speed").textContent = observation.imperial.windSpeed;
            document.getElementById("solar-radiation").textContent = observation.solarRadiation;
            document.getElementById("uv-index").textContent = observation.uv;

            const windDirection = convertDegreesToCardinal(observation.winddir);
            console.log("Wind Direction: ", windDirection); // Log calculated wind direction
            document.getElementById("wind-dir").textContent = `${observation.winddir}° (${windDirection})`;

            document.getElementById("wind-chill").textContent = observation.imperial.windChill;
            document.getElementById("wind-gust").textContent = observation.imperial.windGust;
            document.getElementById("pressure").textContent = observation.imperial.pressure;
            document.getElementById("precip-rate").textContent = observation.imperial.precipRate;
            document.getElementById("total-precip").textContent = observation.imperial.precipTotal;

            const lastUpdate = new Date(observation.obsTimeLocal);
            console.log("Last Update Time: ", lastUpdate); // Log the last update time
            const currentHour = lastUpdate.getHours(); // Extract the current hour (0-23)
            console.log("Current Hour: ", currentHour); // Log current hour extracted from timestamp
            
            document.getElementById("last-update").textContent = lastUpdate.toLocaleString();
            document.getElementById("next-update").textContent = 60; // Next update in 60 seconds

            

            // Call the guessCurrentCondition function and update HTML with the returned condition
            const currentCondition = guessCurrentCondition(observation, currentHour);
            console.log("Result of Current Condition: ", currentCondition); // Log the computed condition
            document.getElementById("current-condition").textContent = currentCondition;
            



        } else {
            console.error('Error fetching data from API. Status: ', response.statusText);
        }
    } catch (error) {
        console.error('Unexpected error occurred during API fetch:', error.message);
        
    }
    
    
}



// Convert radial degrees to cardinal degrees
function convertDegreesToCardinal(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5);
    return directions[index % 16];
}

// Poll weather function to determine and return a guess of current weather conditions
function guessCurrentCondition(observation, currentHour) {
    let conditions = [];
    console.log("Observation Passed to guessCurrentCondition: ", observation);
    console.log("Current Hour Passed: ", currentHour);

    // Extract observation values with appropriate defaults
    const temperature = observation.imperial?.temp !== undefined ? observation.imperial.temp : null; // Use null for undefined temperature
    const humidity = observation.humidity !== undefined ? observation.humidity : null; // Use null for undefined humidity
    const windSpeed = observation.imperial?.windSpeed !== undefined ? observation.imperial.windSpeed : 0; // Default to 0 (no wind)
    const windGust = observation.imperial?.windGust !== undefined ? observation.imperial.windGust : 0; // Default to 0 (no gusts)
    const solarRadiation = observation.solarRadiation !== undefined ? observation.solarRadiation : 0; // Default to 0
    const uvIndex = observation.uv !== undefined ? observation.uv : null; // Use null for undefined UV
    const precipRate = observation.imperial?.precipRate !== undefined ? observation.imperial.precipRate : 0; // Default to 0 (no precipitation)

    
    // Log to api data console for error resolution
    console.log("Temperature: ", temperature);
    console.log("Humidity: ", humidity);
    console.log("Wind Speed: ", windSpeed);
    console.log("Wind Gust: ", windGust);
    console.log("Solar Radiation: ", solarRadiation);
    console.log("UV Index: ", uvIndex);
    console.log("Precipitation Rate: ", precipRate);

    // Get dew point
    const dewPoint = calculateDewPoint(temperature, humidity);
    console.log(`Dew Point: ${dewPoint.toFixed(1)}°F`);

    // Check for conditions
    const snowResult = snowCheck(temperature, dewPoint, humidity);
    const rainCondition = precipCondition(temperature, precipRate);
    const windCondition = windCheck(windSpeed, windGust);
    const solarCondition = solarCheck(solarRadiation, uvIndex, humidity, temperature, currentHour);

    // log condition function returns for error resolution
    console.log(`Snow Condition: ${snowResult[0] ? "Possible" : "Not Possible"}, Chance: ${snowResult[1]}%`);
    console.log("Rain Condition: ", rainCondition || "None");
    console.log("Wind Condition: ", windCondition || "None");
    console.log("Solar Condition: ", solarCondition || "None");
    

    // Snow severity
    if (snowResult[0]) {
        conditions.push({ condition: `❄️ ${snowResult[1]}%`, severity: snowResult[1] });
    }

    // Rain severity (mapped to values like "Light Rain" -> low severity, "Heavy Rain" -> high severity)
    if (rainCondition) {
        const rainSeverityMap = {
            "🌧️ Misting": 10,
            "🌧️ Drizzling": 20,
            "🌧️ Light Rain": 30,
            "🌧️ Raining": 40,
            "🌧️ Moderate Rain": 50,
            "🌧️ Heavy Rain": 60,
            "🌧️ Very Heavy Rain": 70,
            "🌧️ Downpour": 80,
            "🌧️ Heavy Downpour": 90,
            "🌧️ Torrential Downpour": 100,
            "🌧️ Heavy Torrential Downpour": 110,
            "🌧️ Extreme Torrential Downpour": 120
        };
        const severity = rainSeverityMap[rainCondition] || 0;
        conditions.push({ condition: rainCondition, severity });
    }

    // Wind severity (mapped to values based on intensity)
    if (windCondition) {
        const windSeverityMap = {
            "💨 Light Breeze": 10,
            "💨 Light Wind": 20,
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
        conditions.push({ condition: windCondition, severity });
    }

    // Solar is always present; default lower severity for calm weather
    if (solarCondition) {
        const solarSeverityMap = {
            "😎 Bright Sun": 20,
            "💦😎 Muggy": 30,
            "🌤️ Partly Sunny": 10,
            "🌤️ Hazy": 10,
            "☁️ Overcast": 10,
            "☀️ Sunny": 20,
            "🌇 Twilight": 5,
            "🌃 Night": 5,
            "😌 Calm": 0
        };
        const severity = solarSeverityMap[solarCondition] || 0;
        conditions.push({ condition: solarCondition, severity });
    }

    // Sort conditions by severity (highest first)
    conditions.sort((a, b) => b.severity - a.severity);

    // Take the most severe condition or fallback
    const mostSevereCondition = conditions.length > 0 ? conditions[0].condition : "😌 Calm";

    // Add temperature descriptor
    const temperatureDescriptor = getTemperatureDescriptor(temperature);
    console.log("Temperature Descriptor: ", temperatureDescriptor);
    
    // Set background based on temperature
    setBackgroundColor(temperatureDescriptor);

    // Combine and return
    return `${mostSevereCondition} & ${temperatureDescriptor}`;
}

    
    function snowCheck(temperature, dewPoint, humidity) {
        // Conditions to immediately return no snow chance
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
    

    function precipCondition(temperature, precipRate) {
        // Skip if temperature is 32°F or below
        if (temperature <= 32) {
            return [false];
        }
    
        // Determine rain condition based on precipitation rate
        let rainCondition;
        if (precipRate > 0 && precipRate <= 0.025) {
            rainCondition = "🌧️ Misting";
        } else if (precipRate > 0.025 && precipRate <= 0.04) {
            rainCondition = "🌧️ Drizzling";
        } else if (precipRate > 0.04 && precipRate <= 0.07) {
            rainCondition = "🌧️ Light Rain";
        } else if (precipRate > 0.07 && precipRate <= 0.25) {
            rainCondition = "🌧️ Raining";
        } else if (precipRate > 0.25 && precipRate <= 0.35) {
            rainCondition = "🌧️ Moderate Rain";
        } else if (precipRate > 0.35 && precipRate <= 0.50) {
            rainCondition = "🌧️ Heavy Rain";
        } else if (precipRate > 0.50 && precipRate <= 0.65) {
            rainCondition = "🌧️ Very Heavy Rain";
        } else if (precipRate > 0.65 && precipRate <= 0.75) {
            rainCondition = "🌧️ Downpour";
        } else if (precipRate > 0.75 && precipRate <= 0.85) {
            rainCondition = "🌧️ Heavy Downpour";
        } else if (precipRate > 0.85 && precipRate <= 1.0) {
            rainCondition = "🌧️ Torrential Downpour";
        } else if (precipRate > 1.0 && precipRate <= 1.5) {
            rainCondition = "🌧️ Heavy Torrential Downpour";
        } else if (precipRate > 1.5) {
            rainCondition = "🌧️ Extreme Torrential Downpour";
        }
    
        return rainCondition;
    }
    
    
    function windCheck(windSpeed, windGust) {
        // Skip if both windSpeed and windGust are 0
        if (windSpeed === 0 && windGust === 0) {
            return [false];
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
    
        return windCondition;
    }
    

    function solarCheck(solarRadiation, uvIndex, humidity, temperature, currentHour) {
        
        if (solarRadiation === 0 && uvIndex === 0) {
            return "😌 Calm";
        }
    
        // Determine solar condition
        let solarCondition;
        if (solarRadiation > 600 && uvIndex > 4) {
            solarCondition = "😎 Bright Sun";
        } else if (solarRadiation > 205 && uvIndex > 0 && humidity > 70 && temperature > 75) {
            solarCondition = "💦😎 Muggy";
        } else if (humidity > 69 && solarRadiation >= 119 && solarRadiation < 299) {
            solarCondition = "🌤️ Partly Sunny";
        } else if (humidity > 69 && solarRadiation >= 79 && solarRadiation < 201) {
            solarCondition = "🌤️ Hazy";
        } else if (humidity > 70 && solarRadiation >= 1 && solarRadiation < 79) {
            solarCondition = "☁️ Overcast";
        } else if (solarRadiation > 135 && humidity < 80) {
            solarCondition = "☀️ Sunny";
        } else if (solarRadiation > 0 && solarRadiation < 79 && currentHour >= 18) {
            solarCondition = "🌇 Twilight";
        } else if (solarRadiation <= 0 && (currentHour >= 16 || currentHour < 7)) {
            solarCondition = "🌃 Night";
        } else {
            solarCondition = "😌 Calm";
        }
    
        return solarCondition;
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


document.addEventListener("DOMContentLoaded", () => {
    fetchWeatherData(); // Fetch weather data immediately when the page loads

    // Periodically fetch weather data every 60 seconds
    setInterval(() => {
        fetchWeatherData();
        document.getElementById("next-update").textContent = 60; // Reset the next update time
        startNextUpdateTimer(); // Restart the countdown timer for the next update
    }, 60000); // Fetch every 60,000 milliseconds (1 minute)

    // Countdown timer for the next update
    function startNextUpdateTimer() {
        const nextUpdateElem = document.getElementById("next-update");
        clearInterval(updateTimer); // Clear any previous interval for the timer
        updateTimer = setInterval(() => {
            nextUpdateElem.textContent = Math.max(0, nextUpdateElem.textContent - 1); // Decrement the countdown
        }, 1000); // Update every 1 second
    }

    // Start the countdown timer immediately
    document.getElementById("next-update").textContent = 60; // Initialize to 60 seconds
    startNextUpdateTimer();
});

