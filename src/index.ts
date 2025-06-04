import SpotifyWebApi from 'spotify-web-api-node';
import dotenv from 'dotenv';

dotenv.config();

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

async function run() {
  try {
   const token = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(token.body.access_token);

    const result = await spotifyApi.getTrack('3n3Ppam7vgaVa1iaRUc9Lp');
    console.log('🎵 track information:', result.body);
  } catch (err) {
    console.error('❌ error accessing Spotify API:', err);
  }
}

run();