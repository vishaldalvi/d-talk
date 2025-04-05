import { createAlova } from 'alova';
import adapterFetch from 'alova/fetch';
import jwt from 'jsonwebtoken';

export const alovaInstance = createAlova({
  baseURL: "http://localhost:8000",
  requestAdapter: adapterFetch(),
  responded: response => response.json()
});

export const centToken = (userId: string | undefined): string => {
  if (!userId) {
    throw new Error('userId is required to generate token');
  }

  const payload = {
    sub: "userId",
    exp: Math.floor(Date.now() / 1000) + 60,
  };

  const secret = process.env.CENTRIFUGO_JWT_SECRET || "kvaXAImTS4A95m2PtJyfdZcNgtl8-_8Wg6ar9aPaCoNWIKj2bvzHomLYatwhceeAAnAVzwQz4a37PqeHt9vdQg";

  if (!secret) {
    throw new Error('CENTRIFUGO_JWT_SECRET is not defined');
  }

  const ret = jwt.sign(payload, secret, { algorithm: "HS256" });
  return ret;
};
