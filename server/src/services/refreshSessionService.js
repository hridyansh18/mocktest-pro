import { query, withTransaction } from '../config/db.js';
import { AppError } from '../utils/AppError.js';
import { signRefreshToken, verifyRefreshToken } from './tokenService.js';

const decodeExpiry = (token) => new Date(verifyRefreshToken(token).exp * 1000);

export const createRefreshSession = async (userId, client = { query }) => {
  const signed = signRefreshToken({ sub: userId });
  await client.query(
    `INSERT INTO refresh_token_sessions (user_id, token_jti, expires_at) VALUES ($1,$2,$3)`,
    [userId, signed.jti, decodeExpiry(signed.token)]
  );
  return signed.token;
};

export const rotateRefreshSession = async (refreshToken) =>
  withTransaction(async (client) => {
    let decoded;
    try { decoded = verifyRefreshToken(refreshToken); }
    catch { throw AppError.unauthorized('Invalid or expired refresh token'); }

    const { rows } = await client.query(
      `SELECT * FROM refresh_token_sessions WHERE token_jti=$1 FOR UPDATE`,
      [decoded.jti]
    );
    const session = rows[0];
    if (!session || session.revoked_at || new Date(session.expires_at) <= new Date()) {
      throw AppError.unauthorized('Refresh session is no longer valid');
    }

    const replacement = signRefreshToken({ sub: decoded.sub });
    await client.query(
      `UPDATE refresh_token_sessions SET revoked_at=now(), replaced_by_jti=$1 WHERE id=$2`,
      [replacement.jti, session.id]
    );
    await client.query(
      `INSERT INTO refresh_token_sessions (user_id, token_jti, expires_at) VALUES ($1,$2,$3)`,
      [decoded.sub, replacement.jti, decodeExpiry(replacement.token)]
    );
    return { userId: decoded.sub, refreshToken: replacement.token };
  });

export const revokeRefreshSession = async (refreshToken) => {
  try {
    const decoded = verifyRefreshToken(refreshToken);
    await query(`UPDATE refresh_token_sessions SET revoked_at=COALESCE(revoked_at,now()) WHERE token_jti=$1`, [decoded.jti]);
  } catch {}
};
