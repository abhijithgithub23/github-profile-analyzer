import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.github.com',
});

api.interceptors.request.use((config) => {
  const token = import.meta.env.VITE_GITHUB_TOKEN;
  if (token) {
    config.headers.Authorization = `token ${token}`;
  }
  return config;
});

export const githubAPI = {
  getUser: (username) => api.get(`/users/${username}`),
  getRepos: (username) => api.get(`/users/${username}/repos?per_page=100&sort=pushed`),
  getEvents: (username) => api.get(`/users/${username}/events?per_page=100`),
  searchUsers: (query) => api.get(`/search/users?q=${query}`),
};