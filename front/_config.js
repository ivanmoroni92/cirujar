export const USE_EXPO_GO = true;

export const IP_LOCAL = '10.100.10.20'; //192.168.0.118

export const API_URL = `http://${USE_EXPO_GO ? IP_LOCAL : 'localhost'}:3000/api`;


console.log('API_URL:', API_URL);
console.log('App corriendo en:', USE_EXPO_GO ? 'Expo Go' : 'localhost');
