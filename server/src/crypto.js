import crypto from 'crypto';

const ALG = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY || '0'.repeat(64), 'hex');

export function encrypt(text) {
  if (!text) return null;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALG, KEY, iv);
  let enc = cipher.update(text, 'utf8', 'hex');
  enc += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${tag}:${enc}`;
}

export function decrypt(data) {
  if (!data) return null;
  const [ivHex, tagHex, enc] = data.split(':');
  const decipher = crypto.createDecipheriv(ALG, KEY, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  let dec = decipher.update(enc, 'hex', 'utf8');
  dec += decipher.final('utf8');
  return dec;
}
