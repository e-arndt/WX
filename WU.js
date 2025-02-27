const apiKey = "032b36ea99f94242ab36ea99f93242eb";
const stationId = "KWAFEDER5";
const baseUrl = `https://api.weather.com/v2/pws/observations/current?stationId=${stationId}&format=json&units=e&apiKey=${apiKey}`;

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

            // Call the guessCurrentCondition function and update HTML with the returned condition
            const currentCondition = guessCurrentCondition(observation);
            document.getElementById("current-condition").textContent = currentCondition;

        } else {
            console.error('Error fetching data:', response.statusText);
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

function convertDegreesToCardinal(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5);
    return directions[index % 16];
}


function guessCurrentCondition(observation) {
    const temperature = observation.imperial.temp;
    const humidity = observation.humidity;
    const windSpeed = observation.imperial.windSpeed;
    const solarRadiation = observation.solarRadiation;
    const uvIndex = observation.uv;
    const precipRate = observation.imperial.precipRate;

    if (precipRate > 0) {
        if (temperature <= 33) {
            return "❄️ Snowing";
        } else {
            return "🌧️ Raining";
        }
    }

    if (solarRadiation > 200 && uvIndex > 1) {
        return "☀️ Sunny";
    }

    if (windSpeed > 5) {
        return "💨 Windy";
    }

    if (solarRadiation <= 0) {
        return "🌃 Night";
    }

    if (humidity > 80 && solarRadiation >= 30 && solarRadiation < 100) {
        return "☁️ Overcast";
    }

    return "🌤️ Clear";
}



document.addEventListener("DOMContentLoaded", () => {
    fetchWeatherData();
    setInterval(() => {
        fetchWeatherData();
        document.getElementById("next-update").textContent = 60; // Reset the next update time
    }, 60000); // Refresh the page every 60,000 milliseconds (1 minute)
    setInterval(() => {
        const nextUpdateElem = document.getElementById("next-update");
        nextUpdateElem.textContent = Math.max(0, nextUpdateElem.textContent - 1); // Decrement the next update time
    }, 1000); // Update every 1 second
});
