// Конфигурация
const CONFIG = {
    API_KEY: 'YOUR_API_KEY_HERE', // Получи на openweathermap.org
    BASE_URL: 'https://api.openweathermap.org/data/2.5/',
    ICON_URL: 'https://openweathermap.org/img/wn/'
};

// Элементы DOM
const elements = {
    cityInput: document.getElementById('cityInput'),
    searchBtn: document.getElementById('searchBtn'),
    currentLocationBtn: document.getElementById('currentLocationBtn'),
    weatherContent: document.getElementById('weatherContent'),
    loading: document.getElementById('loading')
};

// Состояние 
let state = {
    currentCity: null,
    lastSearches: JSON.parse(localStorage.getItem('lastSearches')) || []
};

// Запуск
function init() {
    bindEvents();
    loadLastSearch();
}

// Привязка событий
function bindEvents() {
    elements.searchBtn.addEventListener('click', handleSearch);
    elements.cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    
    elements.currentLocationBtn.addEventListener('click', handleCurrentLocation);
    
    // Обработчики для примеров городов
    document.querySelectorAll('.city-tag').forEach(tag => {
        tag.addEventListener('click', () => {
            elements.cityInput.value = tag.dataset.city;
            handleSearch();
        });
    });
}

// Обработка поиска
async function handleSearch() {
    const city = elements.cityInput.value.trim();
    
    if (!city) {
        showError('Введите название города');
        return;
    }
    
    await getWeatherByCity(city);
}

// Получение погоды по городу
async function getWeatherByCity(city) {
    showLoading();
    
    try {
        const weatherData = await fetchWeatherData(city);
        displayWeather(weatherData);
        saveToHistory(city);
    } catch (error) {
        showError('Город не найден');
        console.error('Error fetching weather:', error);
    } finally {
        hideLoading();
    }
}

// Получение погоды по местоположению
async function handleCurrentLocation() {
    if (!navigator.geolocation) {
        showError('Геолокация не поддерживается вашим браузером');
        return;
    }
    
    showLoading();
    
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            try {
                const { latitude, longitude } = position.coords;
                const weatherData = await fetchWeatherByCoords(latitude, longitude);
                displayWeather(weatherData);
                saveToHistory(weatherData.name);
            } catch (error) {
                showError('Не удалось получить погоду для вашего местоположения');
                console.error('Error fetching weather by location:', error);
            } finally {
                hideLoading();
            }
        },
        (error) => {
            hideLoading();
            showError('Не удалось получить ваше местоположение');
            console.error('Geolocation error:', error);
        }
    );
}

// Запрос к API
async function fetchWeatherData(city) {
    const response = await fetch(
        `${CONFIG.BASE_URL}weather?q=${city}&appid=${CONFIG.API_KEY}&units=metric&lang=ru`
    );
    
    if (!response.ok) {
        throw new Error('Город не найден');
    }
    
    return await response.json();
}

// Отображение погоды
function displayWeather(data) {
    const weatherHTML = `
        <div class="weather-card">
            <div class="city-name">${data.name}</div>
            <div class="country">${data.sys.country}</div>
            
            <div class="current-weather">
                <div class="temperature">${Math.round(data.main.temp)}°C</div>
                <div class="weather-icon">
                    <img src="${CONFIG.ICON_URL}${data.weather[0].icon}@2x.png" 
                         alt="${data.weather[0].description}" 
                         width="100" height="100">
                </div>
            </div>
            
            <div class="weather-description">${data.weather[0].description}</div>
            
            <div class="weather-details">
                <div class="detail-item">
                    <div class="detail-label">Ощущается как</div>
                    <div class="detail-value">${Math.round(data.main.feels_like)}°C</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Влажность</div>
                    <div class="detail-value">${data.main.humidity}%</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Ветер</div>
                    <div class="detail-value">${data.wind.speed} м/с</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Давление</div>
                    <div class="detail-value">${data.main.pressure} hPa</div>
                </div>
            </div>
        </div>
    `;
    
    elements.weatherContent.innerHTML = weatherHTML;
}

// Показать ошибку
function showError(message) {
    elements.weatherContent.innerHTML = `
        <div class="error-message">
            <h3>😕 Ошибка</h3>
            <p>${message}</p>
        </div>
    `;
}

// Показать загрузку
function showLoading() {
    elements.loading.classList.remove('hidden');
}

// Скрыть загрузку
function hideLoading() {
    elements.loading.classList.add('hidden');
}

// Сохранение в историю
function saveToHistory(city) {
    if (!state.lastSearches.includes(city)) {
        state.lastSearches.unshift(city);
        state.lastSearches = state.lastSearches.slice(0, 5); // Храним только 5 последних
        localStorage.setItem('lastSearches', JSON.stringify(state.lastSearches));
    }
}

// Загрузка последнего поиска
function loadLastSearch() {
    if (state.lastSearches.length > 0) {
        elements.cityInput.placeholder = `Например: ${state.lastSearches[0]}`;
    }
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', init);

// Пример данных для тестирования (удалить в продакшене)
function displayMockData() {
    const mockData = {
        name: "Москва",
        sys: { country: "RU" },
        main: {
            temp: 15,
            feels_like: 14,
            humidity: 65,
            pressure: 1013
        },
        weather: [{ description: "облачно", icon: "04d" }],
        wind: { speed: 3.5 }
    };
    
    displayWeather(mockData);
}

// Для тестирования без API ключа
// displayMockData();
