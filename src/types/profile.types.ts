export interface Location {
    lat: number;
    lng: number;
}

export interface GoogleIntegration {
    accessToken: string;
    refreshToken: string;
    connected: boolean;
}

export interface SpotifyIntegration {
    accessToken: string;
    refreshToken: string;
    connected: boolean;
}

export interface Integrations {
    google: GoogleIntegration;
    spotify: SpotifyIntegration;
}

export interface IProfile {
    userId: string;
    username: string;
    fullName: string;
    nickName?: string;
    profilePicture?: string;
    bio?: string;
    location?: Location;
    integrations?: Integrations;
    createdAt?: Date;
    updatedAt?: Date;
}