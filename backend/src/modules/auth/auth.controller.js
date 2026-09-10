const authService = require('./auth.service');
const asyncHandler = require('../../utils/asyncHandler');
const env = require('../../config/env');

const REFRESH_COOKIE = 'refreshToken';

function cookieOptions() {
  return {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  };
}

function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE, token, cookieOptions());
}

const signup = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.signup(req.body);
  setRefreshCookie(res, refreshToken);
  res.status(201).json({ user, accessToken });
});

const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.login(req.body);
  setRefreshCookie(res, refreshToken);
  res.json({ user, accessToken });
});

const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  const { accessToken, refreshToken } = await authService.refresh(token);
  setRefreshCookie(res, refreshToken);
  res.json({ accessToken });
});

const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  await authService.logout(token);
  res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
  res.status(204).send();
});

const me = asyncHandler(async (req, res) => {
  const user = await authService.getUserById(req.userId);
  res.json({ user });
});

const updateSettings = asyncHandler(async (req, res) => {
  const user = await authService.updateSettings(req.userId, req.body);
  res.json({ user });
});

module.exports = { signup, login, refresh, logout, me, updateSettings };
