import axios from "axios";
import { ICalendarContext, ICalendarEvent } from "../../types/mood.types";

const CALENDAR_BASE_URL = "https://www.googleapis.com/calendar/v3";
const CALENDAR_WINDOW_HOURS = 2;
const TOKEN_REFRESH_URL = "https://oauth2.googleapis.com/token";

interface IGoogleCalendarEventItem {
    id: string;
    summary?: string;
    description?: string;
    location?: string;
    status?: string;
    start: { dateTime?: string; date?: string };
    end: { dateTime?: string; date?: string };
    organizer?: { email?: string; displayName?: string };
}

interface IGoogleCalendarListResponse {
    items: IGoogleCalendarEventItem[];
}

interface IRefreshTokenResponse {
    access_token: string;
    expires_in: number;
}

const refreshGoogleAccessToken = async (refreshToken: string): Promise<string> => {
    const response = await axios.post<IRefreshTokenResponse>(TOKEN_REFRESH_URL, null, {
        params: {
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            refresh_token: refreshToken,
            grant_type: "refresh_token",
        },
        timeout: 5000,
    });

    return response.data.access_token;
};

const mapGoogleEventToCalendarEvent = (item: IGoogleCalendarEventItem): ICalendarEvent => {
    const dateStr = item.start.dateTime ?? item.start.date;
    const endDateStr = item.end.dateTime ?? item.end.date;

    if (!dateStr || !endDateStr) {
        throw new Error(`Invalid calendar event: missing start or end date for event ${item.id}`);
    }

    const isAllDay = Boolean(item.start.date && !item.start.dateTime);
    const startTime = new Date(dateStr);
    const endTime = new Date(endDateStr);

    return {
        id: item.id,
        title: item.summary ?? "Untitled",
        description: item.description ?? null,
        startTime,
        endTime,
        isAllDay,
        location: item.location ?? null,
        status: (item.status as ICalendarEvent["status"]) ?? "confirmed",
        organizer: item.organizer?.displayName ?? item.organizer?.email ?? null,
    };
};

const fetchEventsForRange = async (
    accessToken: string,
    timeMin: Date,
    timeMax: Date
): Promise<ICalendarEvent[]> => {
    const response = await axios.get<IGoogleCalendarListResponse>(
        `${CALENDAR_BASE_URL}/calendars/primary/events`,
        {
            headers: { Authorization: `Bearer ${accessToken}` },
            params: {
                timeMin: timeMin.toISOString(),
                timeMax: timeMax.toISOString(),
                singleEvents: true,
                orderBy: "startTime",
                maxResults: 100,
            },
            timeout: 8000,
        }
    );

    return (response.data.items ?? []).map(mapGoogleEventToCalendarEvent);
};

export const getCalendarContext = async (
    accessToken: string,
    refreshToken: string,
    timestamp: Date,
    onTokenRefresh: (newToken: string) => Promise<void>
): Promise<ICalendarContext> => {
    let token = accessToken;

    const dayStart = new Date(timestamp);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(timestamp);
    dayEnd.setHours(23, 59, 59, 999);

    const windowStart = new Date(timestamp.getTime() - CALENDAR_WINDOW_HOURS * 60 * 60 * 1000);
    const windowEnd = new Date(timestamp.getTime() + CALENDAR_WINDOW_HOURS * 60 * 60 * 1000);

    let wholeDayEvents: ICalendarEvent[];

    try {
        wholeDayEvents = await fetchEventsForRange(token, dayStart, dayEnd);
    } catch (error: any) {
        if (error?.response?.status === 401) {
            token = await refreshGoogleAccessToken(refreshToken);
            await onTokenRefresh(token);
            wholeDayEvents = await fetchEventsForRange(token, dayStart, dayEnd);
        } else {
            throw error;
        }
    }

    const windowEvents = wholeDayEvents.filter(
        (event) => event.startTime <= windowEnd && event.endTime >= windowStart
    );

    return { wholeDayEvents, windowEvents, windowStart, windowEnd };
};