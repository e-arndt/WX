const apiKey = '032b36ea99f94242ab36ea99f93242eb';
const stationId = "KWAFEDER5";
const baseUrl = `https://api.weather.com/v2/pws/observations/current?stationId=${stationId}&format=json&units=e&apiKey=${apiKey}`;

let updateTimer;

async function fetchWeatherData() {
    try {
        const response = await fetch(baseUrl);
        if (response.ok) {
            const data = await response.json();
            const observation = data.observations[0];

            // Update HTML with observation data
            document.getElementById("station-id").textContent = observation.stationID;
            document.getElementById("temperature").textContent = observation.imperial.temp;
            document.getElementById("humidity").textContent = observation.humidity;
            document.getElementById("wind-speed").textContent = observation.imperial.windSpeed;
            document.getElementById("solar-radiation").textContent = observation.solarRadiation;
            document.getElementById("uv-index").textContent = observation.uv;

            const windDirection = convertDegreesToCardinal(observation.winddir);
            document.getElementById("wind-dir").textContent = `${observation.winddir}° (${windDirection})`;

            document.getElementById("wind-chill").textContent = observation.imperial.windChill;
            document.getElementById("wind-gust").textContent = observation.imperial.windGust;
            document.getElementById("pressure").textContent = observation.imperial.pressure;
            document.getElementById("precip-rate").textContent = observation.imperial.precipRate;
            document.getElementById("total-precip").textContent = observation.imperial.precipTotal;

            const lastUpdate = new Date(observation.obsTimeLocal);
            
            document.getElementById("last-update").textContent = lastUpdate.toLocaleString();
            document.getElementById("next-update").textContent = 60; // Next update in 60 seconds

            const currentHour = lastUpdate.getHours(); // Extract the current hour (0-23)

            // Call the guessCurrentCondition function and update HTML with the returned condition
            const currentCondition = guessCurrentCondition(observation, currentHour);
            document.getElementById("current-condition").textContent = currentCondition;

        } else {
            console.error('Error fetching data:', response.statusText);
        }
    } catch (error) {
        console.error('Error fetching data:', error.message, error.stack);
    }
    
}

function convertDegreesToCardinal(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5);
    return directions[index % 16];
}


function guessCurrentCondition(observation) {
    const temperature = observation.imperial.temp || 0; // Default to 0 if undefined
    const humidity = observation.humidity || 0; // Default to 0 if undefined
    const windSpeed = observation.imperial.windSpeed;
    const solarRadiation = observation.solarRadiation || 0; // Default to 0 if undefined
    const uvIndex = observation.uv;
    const precipRate = observation.imperial.precipRate;
    const windGust = observation.imperial.windGust;

    let condition = "";

    if (precipRate > 0 && precipRate < .10) {
        condition = (temperature <= 33) ? "❄️ Snowing" : "🌧️ Light Rain";
    } else if (precipRate >= .10 && precipRate < .15) {
        condition = (temperature <= 33) ? "❄️ Moderate Snow" : "🌧️ Raining";
    } else if (precipRate >= .15 && precipRate <= .20) {
        condition = (temperature <= 33) ? "❄️ Heavy Snow" : "🌧️ Moderate Rain";
    } else if (precipRate >= .20 && precipRate <= .30) {
        condition = (temperature <= 33) ? "❄️ Heavy Snow" : "🌧️ Heavy Rain";
    } else if (precipRate >= .30 && precipRate <= .50) {
        condition = (temperature <= 33) ? "❄️ Blizzard Snow" : "🌧️ Heavy Downpour";
    } else if (precipRate >= .50) {
        condition = (temperature <= 33) ? "❄️ Whiteout Snow" : "🌧️ Torrential Downpour";
    } else if (windSpeed > 1 && windSpeed <= 5) {
        condition = "💨 Breezy";
    } else if (windGust > 3 && windGust <= 8) {
        condition = "💨 Gusty";
    } else if (windSpeed > 5 && windSpeed <= 10) {
        condition = "💨 Windy";
    } else if (windGust > 8 && windGust <= 15) {
        condition = "💨 Strong Gusty Wind";
    } else if (windSpeed > 10 && windSpeed <= 17) {
        condition = "💨 Strong Wind";
    } else if (windGust > 15) {
        condition = "💨 Storm Gust Winds";
    } else if (windSpeed > 17) {
        condition = "💨 Storm Winds";
    } else if (solarRadiation > 600 && uvIndex > 4) {
        condition = "😎 Bright Sun";
    } else if (solarRadiation > 205 && uvIndex > 0 && humidity > 70 && temperature > 75) {
        condition = "💦😎 Muggy";
    } else if (humidity > 69 && solarRadiation >= 69 && solarRadiation < 201) {
        condition = "🌤️ Hazy";
    } else if (humidity > 70 && solarRadiation >= 1 && solarRadiation < 69) {
        condition = "☁️ Overcast";
    } else if (solarRadiation > 35 && humidity < 80) {
        condition = "☀️ Sunny";
    } else if (solarRadiation >= 1 && solarRadiation < 35 && currentHour >=18) {
        condition = "🌇 Twilight";
    } else if (solarRadiation <= 0) {
        condition = "🌃 Night";
    } else {
        condition = "☀️ Daytime";
    }

    const temperatureDescriptor = getTemperatureDescriptor(temperature);
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

