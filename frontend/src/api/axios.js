import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
});


api.interceptors.request.use(
    config=> {
        const csrfToken = document.cookie
         .split('; ')
         .find(row=> row.startsWith('csrftoken='))
         ?.split('=')[1]
         
        if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken;
        }

        return config;

    }
)

//refresh lock

let isRefreshing = false;
let failedQueue = [];

function processQueue(error){
    failedQueue.forEach(p=> {
        if (error) p.reject(error)
        else p.resolve()
    })
    failedQueue = []
}


api.interceptors.response.use(
    response=> response,
    async error => {
        const original = error.config

        if (error.response?.status === 401 && !original._retry){
            original._retry = true

            if (isRefreshing){
                return new Promise((resolve, reject)=> {
                    failedQueue.push({resolve, reject})
                }).then(()=> api(original))
                 .catch(err=> Promise.reject(err))
            }

            isRefreshing = true;

            try{
                await api.post('/auth/refresh/')
                processQueue(null);
                return api(original);
            } catch (err) {
                processQueue(err);
                window.location.href = '/login'
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }
    return Promise.reject(error)
    }
)

export default api;