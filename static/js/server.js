export const server = axios.create({ baseURL: 'http://192.168.0.37:5000/' });

server.interceptors.request.use((config) => {
	config.headers.Authorization = `Bearer ${localStorage.getItem('authToken')}`;
	return config;
});

server.interceptors.response.use(undefined, (err) => {
	if (err.response?.status === 401) {
		localStorage.removeItem('authToken');
		// window.location.href = '/';
	}

	return Promise.reject(err);
});
