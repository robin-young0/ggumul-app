import client from './client';

export const getTodayStats = async () => {
  const response = await client.get('/stats/today');
  return response.data;
};

export const getMyStats = async () => {
  const response = await client.get('/stats/me');
  return response.data;
};
