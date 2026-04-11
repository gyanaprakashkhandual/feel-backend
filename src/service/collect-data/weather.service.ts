import axios from "axios";
import { IWeatherSnapshot } from "../../types/mood.types";

const OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5";

interface IOpenWeatherResponse {
    main: {
        temp: number;
        feels_like: number;
        humidity: number;
    };
    weather: Array<{
        main: string;
        description: string;
        icon: string;
    }>;
    wind: {
        speed: number;
    };
    name: string;
    sys: {
        country: string;
    };
}

export const getWeatherByCoords = async (lat: number, lng: number): Promise<IWeatherSnapshot> => {
    const response = await axios.get<IOpenWeatherResponse>(`${OPENWEATHER_BASE_URL}/weather`, {
        params: {
            lat,
            lon: lng,
            appid: process.env.OPENWEATHER_API_KEY,
            units: "metric",
        },
        timeout: 5000,
    });

    const data = response.data;
    const weather = data.weather[0];

    return {
        temperature: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        humidity: data.main.humidity,
        condition: weather.main,
        description: weather.description,
        windSpeed: data.wind.speed,
        icon: `https://openweathermap.org/img/wn/${weather.icon}@2x.png`,
        city: data.name,
        country: data.sys.country,
    };
};