const express = require('express');
const http = require('http');
const socket = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socket(server);

require('dotenv').config();

const SpotifyWebApi = require('spotify-web-api-node');

const SpotifyDownloadApi = require('spotifydl-core').default

const fs = require('fs')

const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);


app.set('view engine', 'ejs');
app.use(express.static('public'));


const port = process.env.PORT || 3000
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;


const search = new SpotifyWebApi({
  clientId,
  clientSecret
});

const download = new SpotifyDownloadApi({
  clientId,
  clientSecret
});


io.on('connect', (socket) => {

  socket.on('send', async (query, screen) => {
    try {
      screenSize = screen;
      const results = await searchSpotify(query);
      socket.emit('receive', results);
    } catch (error) {
      console.log(error);
    }
  });

  socket.on("select", (data) => {
    socket.emit("select", data)
  })


  socket.on('download', async (data) => {
    try {
      const tokenData = await search.clientCredentialsGrant();
      const token = tokenData.body.access_token;
      search.setAccessToken(token);
      socket.emit("loading", { response: "Loading...." })
      const audio = await download.downloadTrack(data.url)
      socket.emit("buffer", { blob: audio, all: data })
    } catch (error) {
      console.log(error)
    }
  })


});


let screenSize;


app.get('/', (req, res) => {
  res.render('index');
});

async function searchSpotify(query) {
  try {
    const tokenData = await search.clientCredentialsGrant();
    const token = tokenData.body.access_token;
    search.setAccessToken(token);

    let limit;

    if (screenSize < 640) {
      limit = 5;
    } else {
      limit = 7;
    }

    const data = await search.searchTracks(query, { limit });

    return data.body.tracks.items.map(track => ({
      id: track.id,
      name: track.name,
      url: `https://open.spotify.com/track/${track.id}`,
      artists: track.artists.map(a => a.name).join(', '),
      image: track.album.images[2].url
    }));
  }
  catch (error) {
    console.log(error);
  }
}

server.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
