// express server file for deploying angular in Heroku
var express = require('express');
var app = express();

app.use(express.static('./dist/cribbage'));

app.get('/*', function(req, res) {
    res.sendFile('index.html', {root: 'dist/cribbage/'}
  );
});

app.listen(process.env.PORT || 8080);