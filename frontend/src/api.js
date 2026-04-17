import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:8080/api' });

export const fmt = (val) =>
    val !== undefined && val !== null
        ? Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : '0.00';

export const today = () => new Date().toISOString().split('T')[0];

export default API;
