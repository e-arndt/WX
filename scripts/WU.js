const apiKey = '032b36ea99f94242ab36ea99f93242eb';
const stationId = "KWAFEDER5";
const baseUrl = `https://api.weather.com/v2/pws/observations/current?stationId=${stationId}&format=json&units=e&apiKey=${apiKey}`;

let updateTimer;

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

            // Update HTML with observation data
            document.getElementById("station-id").textContent = observation.stationID;
            document.getElementById("temperature").textContent = observation.imperial.temp;
            document.getElementById("humidity").textContent = observation.humidity;
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

function convertDegreesToCardinal(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5);
    return directions[index % 16];
}


function guessCurrentCondition(observation, currentHour) {
    console.log("Observation Passed to guessCurrentCondition: ", observation);
    console.log("Current Hour Passed: ", currentHour); // No more errors


    const temperature = observation.imperial.temp || 0; // Default to 0 if undefined
    console.log("Temperature: ", temperature); // Log temperature
    
    const humidity = observation.humidity || 0; // Default to 0 if undefined
    console.log("Humidity: ", humidity); // Log humidity
    
    const windSpeed = observation.imperial.windSpeed;
    console.log("Wind Speed: ", windSpeed); // Log wind speed

    const solarRadiation = observation.solarRadiation || 0; // Default to 0 if undefined
    console.log("Solar Radiation: ", solarRadiation); // Log solar radiation
    
    const uvIndex = observation.uv;
    console.log("UV Index: ", uvIndex); // Log UV index
    
    const precipRate = observation.imperial.precipRate;
    console.log("Precipitation Rate: ", precipRate); // Log precipitation rate
    
    const windGust = observation.imperial.windGust;
    console.log("Wind Gust: ", windGust); // Log wind gust

    let condition = "";

    if (precipRate > 0 && precipRate <= .07) {
        condition = (temperature <= 33) ? "❄️ Light Snow" : "🌧️ Drizzling";
    } else if (precipRate > .07 && precipRate < .12) {
        condition = (temperature <= 33) ? "❄️ Snowing" : "🌧️ Light Rain";
    } else if (precipRate >= .12 && precipRate < .17) {
        condition = (temperature <= 33) ? "❄️ Moderate Snow" : "🌧️ Raining";
    } else if (precipRate >= .17 && precipRate <= .23) {
        condition = (temperature <= 33) ? "❄️ Heavy Snow" : "🌧️ Moderate Rain";
    } else if (precipRate >= .23 && precipRate <= .33) {
        condition = (temperature <= 33) ? "❄️ Very Heavy Snow" : "🌧️ Heavy Rain";
    } else if (precipRate >= .33 && precipRate <= .43) {
        condition = (temperature <= 33) ? "❄️ Blizzard Snow" : "🌧️ Downpour";
    } else if (precipRate >= .43 && precipRate <= .50) {
        condition = (temperature <= 33) ? "❄️ Heavy Blizzard Snow" : "🌧️ Heavy Downpour";
    } else if (precipRate >= .50) {
        condition = (temperature <= 33) ? "❄️ Whiteout Snow" : "🌧️ Torrential Downpour";
    } else if (windSpeed > 30) {
        condition = "💨 Gale Force Winds";
    } else if (windSpeed > 25 && windSpeed <= 30) {
        condition = "💨 Strong Storm Winds";
    } else if (windGust > 25) {
        condition = "💨 Gale Force Gusts";
    } else if (windSpeed > 17 && windSpeed <= 25) {
        condition = "💨 Stormy Winds";
    } else if (windGust > 19 && windGust <= 25) {
        condition = "💨 Strong Storm Gusts";
    } else if (windSpeed > 13 && windSpeed <= 17) {
        condition = "💨 Strong Winds";
    } else if (windGust > 14 && windGust <= 19) {
        condition = "💨 Storm Gust Winds";
    } else if (windGust > 10 && windGust <= 14) {
        condition = "💨 Strong Gusty Winds";
    } else if (windSpeed > 10 && windSpeed <= 13) {
        condition = "💨 Very Windy";
    } else if (windGust > 7 && windGust <= 10) {
        condition = "💨 Gusty Winds";
    } else if (windSpeed > 7 && windSpeed <= 10) {
        condition = "💨 Windy";
    } else if (windGust > 5 && windGust <= 7) {
        condition = "💨 Mild Gust";
    } else if (windGust > 3 && windGust <= 5) {
        condition = "💨 Light Gust";
    } else if (windSpeed > 4 && windSpeed <= 7) {
        condition = "💨 Light Wind";
    } else if (windSpeed > 1 && windSpeed <= 4) {
        condition = "💨 Light Breeze";
    } else if (solarRadiation > 600 && uvIndex > 4) {
        condition = "😎 Bright Sun";
    } else if (solarRadiation > 205 && uvIndex > 0 && humidity > 70 && temperature > 75) {
        condition = "💦😎 Muggy";
    } else if (humidity > 69 && solarRadiation >= 119 && solarRadiation < 299) {
        condition = "🌤️ Partly Sunny";
    } else if (humidity > 69 && solarRadiation >= 79 && solarRadiation < 201) {
        condition = "🌤️ Hazy";
    } else if (humidity > 70 && solarRadiation >= 1 && solarRadiation < 79) {
        condition = "☁️ Overcast";
    } else if (solarRadiation > 135 && humidity < 80) {
        condition = "☀️ Sunny";
    } else if (solarRadiation >= 1 && solarRadiation < 79 && currentHour >=18) {
        condition = "🌇 Twilight";
    } else if (solarRadiation <= 0 && currentHour >=15) {
        condition = "🌃 Night";
    } else {
        condition = "Calm";
    }

    const temperatureDescriptor = getTemperatureDescriptor(temperature);
    console.log("Temperature Descriptor: ", temperatureDescriptor); // Log temperature descriptor
    setBackgroundColor(temperatureDescriptor); // Set background color based on temperature descriptor
    return `${condition} & ${temperatureDescriptor}`;
}

function getTemperatureDescriptor(temp) {
    if (temp < 15) return "Extreme Cold";
    if (temp >= 15 && temp < 25) return "Bitter Cold";
    if (temp >= 25 && temp < 34) return "Freezing";
    if (temp >= 34 && temp < 55) return "Cold";
    if (temp >= 55 && temp < 65) return "Cool";
    if (temp >= 65 && temp < 75) return "Comfortable";
    if (temp >= 75 && temp < 82) return "Warm";
    if (temp >= 82 && temp < 90) return "Hot";
    if (temp >= 90 && temp < 96) return "Very Hot";
    if (temp >= 96) return "Extreme Heat";

    return "Unknown";
}

function setBackgroundColor(descriptor) {
    const element = document.querySelector('.group.current-condition');
    element.classList.remove('extreme-cold', 'bitter-cold', 'freezing', 'cold', 'cool', 'comfortable', 'warm', 'hot', 'very-hot', 'extreme-heat');

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
        case 'Comfortable':
            element.classList.add('comfortable');
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

