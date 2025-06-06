/// <reference path="./types/express-session.d.ts" />

import SpotifyWebApi from 'spotify-web-api-node';
import express from 'express';
import session from 'express-session';
import dotenv from 'dotenv';

const app = express();
const port = 3000;

dotenv.config();

app.use(session({
  secret: process.env.SESSION_SECRET || 'default_session_secret',
  resave: false,
  saveUninitialized: true,
}));

const createSpotifyApi = () => new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});

app.get('/', (req, res) => {
  res.send(`<h1>🎵 welcome to soundself!</h1>
    <a href="/login">🔐 login with spotify</a>
  `);
});


app.get('/login', (req, res) => {
  const spotifyApi = createSpotifyApi();
  const scopes = ['user-top-read']
  const authorizeURL = spotifyApi.createAuthorizeURL(scopes, 'some-state', true);
  res.redirect(authorizeURL);
});


app.get('/callback', async (req, res) => {
  const code = req.query.code as string;
  const spotifyApi = createSpotifyApi();
  try {
    const data = await spotifyApi.authorizationCodeGrant(code);
    spotifyApi.setAccessToken(data.body.access_token);
    spotifyApi.setRefreshToken(data.body.refresh_token);
    req.session.accessToken = data.body.access_token;
    req.session.refreshToken = data.body.refresh_token;
    res.send('✅ login successful! you can now access your top tracks.');
  } catch (err) {
    console.error('error during spotify auth callback:', err);
    res.status(500).send('auth failed');
  }
});

app.get('/top-tracks', async (req, res) => {
  const { accessToken, refreshToken } = req.session;
  
  if (!accessToken || !refreshToken) {
    return res.redirect('/login');
  }

  const spotifyApi = createSpotifyApi();
  spotifyApi.setAccessToken(accessToken);
  spotifyApi.setRefreshToken(refreshToken);

  try {
    const topTracksData = await spotifyApi.getMyTopTracks({
      limit: 10,
      time_range: 'medium_term'
    });

    const tracks = topTracksData.body.items.map((track, index) => {
      return `${index + 1}. ${track.name} by ${track.artists.map(a => a.name).join(', ')}`;
    }).join('<br>');

    res.send(`<h2>🎧 Your Top Tracks</h2><p>${tracks}</p>`);
  } catch (err) {
    console.error('failed to get top tracks:', err);
    res.status(500).send('failed to retrieve top tracks');
  }
});


app.listen(port, () => {
  console.log(`🚀 server running at http://127.0.0.1:${port}`);
});