import axios from "axios";

export const axiosInstance = axios.create({
	baseURL: import.meta.env.MODE === "development" ? "http://localhost:5001/api/v1" : "/api/v1",
	withCredentials: true,
});

// Add request interceptor to handle connection errors
axiosInstance.interceptors.request.use(function (config) {
	return config;
}, function (error) {
	console.error('Request error:', error);
	return Promise.reject(error);
});

// Add response interceptor to handle connection errors
axiosInstance.interceptors.response.use(function (response) {
	return response;
}, function (error) {
	console.error('Response error:', error);
	return Promise.reject(error);
});