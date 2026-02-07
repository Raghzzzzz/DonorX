import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include the token
api.interceptors.request.use(
    (config) => {
        const userStr = localStorage.getItem('donorx_user');
        if (userStr) {
            const user = JSON.parse(userStr);
            if (user && user.token) {
                config.headers.Authorization = `Bearer ${user.token}`;
            }
        }
        // FormData must not have Content-Type set - browser sets multipart/form-data with boundary
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export const authService = {
    login: (email, password) => api.post('/auth/login', { email, password }),
    register: (userData) => api.post('/auth/register', userData),
};

export const inventoryService = {
    getInventory: () => api.get('/inventory'),
    updateInventory: (data) => api.put('/inventory', data),
};

export const assistService = {
    parseReport: (file) => {
        const formData = new FormData();
        formData.append('report', file);
        return api.post('/assist/parse-report', formData);
    },
};

export const requestService = {
    create: (data) => api.post('/requests', data),
    getMyRequests: () => api.get('/requests/my'),
    getIncoming: () => api.get('/requests/incoming'),
    respond: (id, response) => api.post(`/requests/${id}/respond`, { response }),
    updateStatus: (id, status, location) => api.put(`/requests/${id}/status`, { status, location }),
};

export default api;
