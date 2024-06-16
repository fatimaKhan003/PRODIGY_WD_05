const API_KEY = "42c9e7c4ab03739b4d29f144eaef927b";
const WEATHER_API_URL = "https://api.openweathermap.org/data/2.5/weather?q=%s&appid=%s";
const FORECAST_API_URL = "https://api.openweathermap.org/data/2.5/forecast?q=%s&appid=%s";
const AIR_POLLUTION_API_URL = "https://api.openweathermap.org/data/2.5/air_pollution?lat=%s&lon=%s&appid=%s";
let map;
let mapMarkers; //to manage markers

// Initializing Leaflet map
function initMap() {
    map = L.map('map').setView([0, 0], 2); 

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    mapMarkers = L.layerGroup().addTo(map); 

    map.on('click', onMapClick);
}

//handle click on the map
function onMapClick(e) {
    const lat = e.latlng.lat;
    const lon = e.latlng.lng;

    fetchWeatherByCoords(lat, lon);
}

//fetch weather data by coordinates
function fetchWeatherByCoords(lat, lon) {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            const city = data.name;
            localStorage.setItem('city', city);
            document.getElementById('city').value = city;
            document.getElementById('search-summary').innerText = `You searched for: ${city}`;

            fetchCurrentWeather(city);
            fetchForecast(city);
            fetchAirPollution(data.coord.lat, data.coord.lon);
            // Clearing existing markers 
            clearMapMarkers();
            // Add marker for clicked location
            addMarker(lat, lon, city);
        })
        .catch(error => console.error('Error fetching weather data by coordinates:', error));
}

function addMarker(lat, lon, city) {
    const marker = L.marker([lat, lon]).addTo(mapMarkers);
    marker.bindPopup(`Weather in ${city}`).openPopup();
}
function clearMapMarkers() {
    mapMarkers.clearLayers();
}
function storeCity() {
    const city = document.getElementById('city').value;
    if (city) {
        localStorage.setItem('city', city);
        fetchCurrentWeather(city); // Fetch weather data immediately after storing city
        document.getElementById('search-summary').innerText = `You searched for: ${city}`;
    } else {
        alert('Please enter a city');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const city = localStorage.getItem('city');
    if (city) {
        fetchCurrentWeather(city);
        document.getElementById('search-summary').innerText = `You searched for: ${city}`;
    }
});

function fetchCurrentWeather(city) {
    const url = WEATHER_API_URL.replace('%s', city).replace('%s', API_KEY);

    fetch(url)
        .then(response => response.json())
        .then(data => {
            displayCurrentWeather(data);
            fetchForecast(city); 
            fetchAirPollution(data.coord.lat, data.coord.lon);
            clearMapMarkers();
            const marker = L.marker([data.coord.lat, data.coord.lon]).addTo(mapMarkers);
            marker.bindPopup(`Weather in ${city}`).openPopup();
        })
        .catch(error => console.error('Error fetching weather data:', error));
}

function fetchForecast(city) {
    const url = FORECAST_API_URL.replace('%s', city).replace('%s', API_KEY);

    fetch(url)
        .then(response => response.json())
        .then(data => {
            displayForecast(data);
        })
        .catch(error => console.error('Error fetching forecast data:', error));
}

function fetchAirPollution(lat, lon) {
    const url = AIR_POLLUTION_API_URL.replace('%s', lat).replace('%s', lon).replace('%s', API_KEY);

    fetch(url)
        .then(response => response.json())
        .then(data => {
            displayAirPollution(data);
        })
        .catch(error => console.error('Error fetching air pollution data:', error));
}

function displayCurrentWeather(data) {
    const weatherInfoDiv = document.getElementById('current-weather-info');
    if (weatherInfoDiv) {
        const date = new Date().toLocaleDateString();
        const iconUrl = `http://openweathermap.org/img/wn/${data.weather[0].icon}.png`;
        const weatherDescription = data.weather[0].description;
        const temperature = kelvinToCelsius(data.main.temp);
        const humidity = data.main.humidity;
        const windSpeed = data.wind.speed;

        weatherInfoDiv.innerHTML = `
            <h2><span class="bold">Current Weather in ${data.name}</span></h2>
            <div class="weather-details">
                <img class="weather-icon" src="${iconUrl}" alt="${weatherDescription}">
                <p><span class="bold">Date:</span> ${date}</p>
                <p><span class="bold"><img class="icon" src="temperature.png" alt="Temperature"> Temperature:</span> ${temperature}°C</p>
                <p><span class="bold"><img class="icon" src="humidity.png" alt="Humidity"> Humidity:</span> ${humidity}%</p>
                <p><span class="bold"><img class="icon" src="wind.png" alt="Wind Speed"> Wind Speed:</span> ${windSpeed} m/s</p>
                <p><span class="bold">Conditions:</span> ${weatherDescription}</p>
            </div>
        `;
    }
}

function displayForecast(data) {
    const forecastInfoDiv = document.getElementById('forecast-info');
    if (forecastInfoDiv) {
        forecastInfoDiv.innerHTML = '<h2>5-Day Forecast</h2>';

        let forecastTable = '<table class="forecast-table"><tr><th>Date</th><th>Temperature (°C)</th><th>Conditions</th></tr>';
        for (let i = 0; i < data.list.length; i += 8) { 
            const item = data.list[i];
            const date = new Date(item.dt_txt).toLocaleDateString();
            const temperature = kelvinToCelsius(item.main.temp);
            const description = item.weather[0].description;
            const icon = item.weather[0].icon;

            forecastTable += `
                <tr>
                    <td>${date}</td>
                    <td>${temperature}</td>
                    <td><img class="weather-icon" src="http://openweathermap.org/img/wn/${icon}.png" alt="${description}">${description}</td>
                </tr>
            `;
        }
        forecastTable += '</table>';
        forecastInfoDiv.innerHTML += forecastTable; 
    }
}

function displayAirPollution(data) {
    const airPollutionInfoDiv = document.getElementById('air-pollution-info');
    if (airPollutionInfoDiv) {
        const pollutionData = data.list[0];
        const aqi = pollutionData.main.aqi;
        const city = localStorage.getItem('city');

        let alertMessage = '';
        let alertIcon = '';
        let alertClass = '';

        if (aqi === 5) {
            alertMessage = `The Air quality of ${city} is really bad. Measures should be taken to improve it.`;
            alertIcon = `<img class="icon" src="alert.png" alt="Alert">`;
            alertClass = 'alert-red';
        } else if (aqi === 4) {
            alertMessage = `The Air quality of ${city} is poor. Measures should be taken to improve it.`;
            alertIcon = `<img class="icon" src="alert.png" alt="Alert">`;
            alertClass = 'alert-red';
        } else if (aqi === 3) {
            alertMessage = `The Air quality of ${city} is moderate. It is acceptable but may be a concern for some individuals.`;
            alertClass = 'alert-yellow';
        } else if (aqi === 2) {
            alertMessage = `The Air quality of ${city} is fair.`;
            alertClass = 'alert-yellow';
        } else {
            alertMessage = `The Air quality of ${city} is good.`;
            alertClass = 'alert-green';
        }

        airPollutionInfoDiv.innerHTML = `
            <h2>Air Pollution Data</h2>
            <p><span class="bold">AQI:</span> ${aqi}</p>
            <p><span class="bold">CO:</span> ${pollutionData.components.co} µg/m³</p>
            <p><span class="bold">NO:</span> ${pollutionData.components.no} µg/m³</p>
            <p><span class="bold">NO2:</span> ${pollutionData.components.no2} µg/m³</p>
            <p><span class="bold">O3:</span> ${pollutionData.components.o3} µg/m³</p>
            <p><span class="bold">SO2:</span> ${pollutionData.components.so2} µg/m³</p>
            <p><span class="bold">PM2.5:</span> ${pollutionData.components.pm2_5} µg/m³</p>
            <p><span class="bold">PM10:</span> ${pollutionData.components.pm10} µg/m³</p>
            <p><span class="bold">NH3:</span> ${pollutionData.components.nh3} µg/m³</p>
            <p class="alert ${alertClass}">${alertIcon} ${alertMessage}</p>
        `;
    }
}


function kelvinToCelsius(kelvin) {
    return (kelvin - 273.15).toFixed(2);
}
document.addEventListener('DOMContentLoaded', () => {
    initMap(); // Initialize the Leaflet map
    const city = localStorage.getItem('city');
    if (city) {
        fetchCurrentWeather(city);
       
        document.getElementById('search-summary').innerText = `You searched for: ${city}`;
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                const lat = data.coord.lat;
                const lon = data.coord.lon;
                clearMapMarkers();
                addMarker(lat, lon, city);
            })
            .catch(error => console.error('Error fetching city coordinates:', error));
    }
});
