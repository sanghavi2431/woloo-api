import HttpClient from './HttpClient';
import config = require("../config");
import _ from 'lodash';

export default class Map {
    constructor() {
    }

    public static async fetchDistance(source: string, destination: string, travelMode: string, apiKeyVar?: string): Promise<any> {
        const url: string = `${config.GoogleMap.distanceMatrixUrl}`;
        const apiKey = apiKeyVar ? process.env[apiKeyVar] : config.GoogleMap.defaultKey;

        if (apiKeyVar && !apiKey) throw new Error('Please ask admin to set your google maps key')

        // Parse source and destination coordinates
        const [sourceLat, sourceLng] = source.split(',').map(Number);
        const [destLat, destLng] = destination.split(',').map(Number);

        // Validate coordinates
        if (isNaN(sourceLat) || isNaN(sourceLng) || isNaN(destLat) || isNaN(destLng)) {
            throw new Error('Invalid coordinates format. Expected "lat,lng"');
        }

        // Build request body based on travel mode
        const requestBody = this.buildRequestBody(sourceLat, sourceLng, destLat, destLng, travelMode);

        try {
            const response = await HttpClient.api('POST', url, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': apiKey,
                    'X-Goog-FieldMask': 'originIndex,destinationIndex,duration,distanceMeters,status,condition'
                },
                data: JSON.stringify(requestBody)
            });

            if (response && response[0]) {
                const result = response[0];

                // Check if route data is available
                if (result.distanceMeters && result.duration) {
                    return {
                        distance: result.distanceMeters,
                        duration: parseInt(result.duration.replace('s', '')),
                        travelMode: travelMode
                    };
                } else {
                    // Route not found or incomplete data
                    return {
                        distance: -1,
                        duration: -1,
                        error: 'ROUTE_NOT_FOUND'
                    };
                }
            } else {
                return {
                    distance: -1,
                    duration: -1,
                    error: 'INVALID_RESPONSE'
                };
            }
        } catch (error: any) {
            console.error('Route Matrix API Error:', error.response?.data || error.message);
            return {
                distance: -1,
                duration: -1,
                error: 'API_ERROR'
            };
        }
    }

    private static buildRequestBody(sourceLat: number, sourceLng: number, destLat: number, destLng: number, travelMode: string, includeRoutingPreference: boolean = true): any {
        const baseBody: any = {
            origins: [{
                waypoint: {
                    location: {
                        latLng: {
                            latitude: sourceLat,
                            longitude: sourceLng
                        }
                    }
                }
            }],
            destinations: [{
                waypoint: {
                    location: {
                        latLng: {
                            latitude: destLat,
                            longitude: destLng
                        }
                    }
                }
            }],
            travelMode: travelMode
        };

        // Add route modifiers and routing preferences based on travel mode
        // Only DRIVE and TWO_WHEELER support route modifiers and traffic-aware routing
        switch (travelMode) {
            case 'DRIVE':
                baseBody.origins[0]['routeModifiers'] = {
                    avoid_ferries: true,
                    avoid_tolls: false
                };
                if (includeRoutingPreference) {
                    baseBody['routingPreference'] = 'TRAFFIC_AWARE';
                }
                break;

            case 'TWO_WHEELER':
                baseBody.origins[0]['routeModifiers'] = {
                    avoid_ferries: true,
                    avoid_highways: true
                };
                if (includeRoutingPreference) {
                    baseBody['routingPreference'] = 'TRAFFIC_AWARE';
                }
                break;

            case 'BICYCLE':
            case 'WALK':
            case 'TRANSIT':
                // These modes don't support route modifiers or routing preferences
                // Leave them clean with just the basic waypoints
                break;

            default:
                // For unknown modes, don't add any modifiers to avoid errors
                break;
        }

        return baseBody;
    }
}