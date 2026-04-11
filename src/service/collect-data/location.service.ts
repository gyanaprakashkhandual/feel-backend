import axios from "axios";
import { ILocationSnapshot } from "../../types/mood.types";

interface IReverseGeocodeResponse {
    address: {
        city?: string;
        town?: string;
        village?: string;
        county?: string;
        country?: string;
        country_code?: string;
    };
}

const reverseGeocode = async (lat: number, lng: number): Promise<{ city: string | null; country: string | null }> => {
    const response = await axios.get<IReverseGeocodeResponse>(
        "https://nominatim.openstreetmap.org/reverse",
        {
            params: { lat, lon: lng, format: "json" },
            headers: { "User-Agent": "MoodApp/1.0" },
            timeout: 5000,
        }
    );

    const addr = response.data.address;
    const city = addr.city ?? addr.town ?? addr.village ?? addr.county ?? null;
    const country = addr.country ?? null;

    return { city, country };
};

const getTimezoneFromCoords = async (lat: number, lng: number): Promise<string> => {
    const response = await axios.get<{ timeZoneId: string }>(
        "https://maps.googleapis.com/maps/api/timezone/json",
        {
            params: {
                location: `${lat},${lng}`,
                timestamp: Math.floor(Date.now() / 1000),
                key: process.env.GOOGLE_TIMEZONE_API_KEY,
            },
            timeout: 5000,
        }
    );

    return response.data.timeZoneId ?? "UTC";
};

export const resolveLocation = async (lat: number, lng: number): Promise<ILocationSnapshot> => {
    const [geocode, timezone] = await Promise.allSettled([
        reverseGeocode(lat, lng),
        getTimezoneFromCoords(lat, lng),
    ]);

    const city = geocode.status === "fulfilled" ? geocode.value.city : null;
    const country = geocode.status === "fulfilled" ? geocode.value.country : null;
    const tz = timezone.status === "fulfilled" ? timezone.value : "UTC";

    return { lat, lng, city, country, timezone: tz };
};