import { createAlova } from 'alova';
import adapterFetch from 'alova/fetch';
import jwt from 'jsonwebtoken';

export const alovaInstance = createAlova({
  baseURL: "http://10.10.7.28:8000",
  requestAdapter: adapterFetch(),
  responded: response => response.json()
});
