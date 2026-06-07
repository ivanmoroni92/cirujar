export const USE_EXPO_GO = true;

export const USE_LOCAL_DB = false;

export const IP_LOCAL = '192.168.1.46';

export const API_URL = `http://${USE_EXPO_GO ? IP_LOCAL : 'localhost'}:3000/api`;



console.log('API_URL:', API_URL);

console.log('Base de datos corriendo en:', USE_LOCAL_DB ? 'local' : 'nube');

console.log('Front corriendo en:', USE_EXPO_GO ? 'Expo Go' : 'localhost');

