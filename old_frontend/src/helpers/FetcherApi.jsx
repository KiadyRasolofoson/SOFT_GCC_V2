// fetcher.js
import api from './api';

const FetcherApi = (url) => api.get(url).then((res) => res.data);

export default FetcherApi;
