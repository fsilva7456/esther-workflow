// API configuration
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export const API_BASE_URL = isDevelopment
    ? 'http://localhost:3001'
    : '';

export const getApiUrl = (path: string) => {
    return `${API_BASE_URL}${path}`;
};
