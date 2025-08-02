import axios from "axios";

export const axiosInstance = axios.create({
	baseURL: import.meta.env.MODE === "development" ? "http://localhost:5000/api/v1" : "/api/v1",
	withCredentials: true,
	headers: {
		'Content-Type': 'application/json',
		'Accept': 'application/json'
	}
});

// Add request interceptor to handle connection errors and validate URLs
axiosInstance.interceptors.request.use(function (config) {
	// Check if this is a project creation or update request
	if ((config.url === '/projects' && (config.method === 'post' || config.method === 'put')) ||
		(config.url.startsWith('/projects/') && config.method === 'put')) {
		
		// For FormData, we need to handle it differently
		if (config.data instanceof FormData) {
			// Get the projecturl from FormData
			const projectUrl = config.data.get('projecturl');
			
			// Validate and format the URL if it exists
			if (projectUrl && typeof projectUrl === 'string' && projectUrl.trim() !== '') {
				let formattedUrl = projectUrl.trim();
				
				// Add http:// prefix if missing
				if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
					formattedUrl = 'https://' + formattedUrl;
				}
				
				// Update the FormData with the formatted URL
				config.data.set('projecturl', formattedUrl);
			}
		}
	}
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