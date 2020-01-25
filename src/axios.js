import axios from 'axios';

const httpClient = axios.create({
  baseURL: 'https://pm.maddevs.co'
});

export default httpClient;
