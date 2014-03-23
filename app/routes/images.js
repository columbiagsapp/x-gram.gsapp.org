'use strict';

// Images routes use images controller
var images = require('../controllers/images');

/*
var authorization = require('./middlewares/authorization');

// Image authorization helpers
var hasAuthorization = function(req, res, next) {
	if (req.article.user.id !== req.user.id) {
        return res.send(401, 'User is not authorized');
    }
    next();
};

*/

var colors  = require('colors');
console.log('images.js entered'.cyan);

var ig = require('instagram-node').instagram();
var flickr = require('flickr-with-uploads');

var instagram_secrets = require('../../secrets.json').instagram;
var flickr_secrets = require('../../secrets.json').flickr;

var cities = require('../../cities.json');
var tags = [];

var tag_index = 0;

//global ID for the main interval for fetching from Instagram
var interval_id;

var FETCH_TIME = 3000; // fetch every 3 seconds



ig.use({ client_id: instagram_secrets.client_id,
    client_secret: instagram_secrets.client_secret });



var flickr_api = flickr(
  flickr_secrets.key, // consumer_key
  flickr_secrets.secret, // consumer_secret
  flickr_secrets.oauth_token,
  flickr_secrets.oauth_secret
);


function initImageDownloadCycle(){
    images.downloadAll(flickr_api);
}


function initInstagramFetchCycle(){

    //create tags in form of xcity based on cities array
    cities.forEach(function(c){
        tags.push( 'x' + c );
    });

    current_city = tags[0].substring(1);

    //start interval to fetch from Instagram
    interval_id = setInterval(fetchFromInstagram, FETCH_TIME);
    
}

var total_found = 0;

var current_city = '';

function upsertImages(medias, idx){
    if(idx >= medias.length) return false;

    images.upsert(medias, idx, current_city, upsertImages);
}

function fetchFromInstagram(){
    ig.tag_media_recent(tags[tag_index], function(err, medias, pagination, limit) {

        if(err){
            console.log(err);
        }else{
            console.log('\nFetched ' + medias.length + ' images'.cyan + ' from tag_index: ' + tag_index + ' = city: ' + tags[tag_index]);
            //console.dir(medias);

            total_found += medias.length;

            var m_idx = 0;
            //upsert all images recursively
            upsertImages(medias, m_idx);
        }

        //increment tag index
        if(tag_index >= (tags.length - 1) ){
            tag_index = 0;
            console.log('total found images: ' + total_found);
            var all_images = images.all();

            clearInterval(interval_id);
            initImageDownloadCycle();

        }else{
            tag_index++;
        }
        console.log()
        current_city = tags[tag_index].substring(1);
    });

        
}



initInstagramFetchCycle();



module.exports = function(app) {

    app.get('/images', function(req, res){
        
    });

    app.all ('/callback', function(req, res){
        console.log('\n\n\nreq:');
        console.dir(req);
        console.log('\n\n\nres:');
        console.dir(res);
    });
    
    /*
    app.post('/articles', authorization.requiresLogin, articles.create);
    app.get('/articles/:articleId', articles.show);
    app.put('/articles/:articleId', authorization.requiresLogin, hasAuthorization, articles.update);
    app.del('/articles/:articleId', authorization.requiresLogin, hasAuthorization, articles.destroy);

    // Finish with setting up the articleId param
    app.param('articleId', articles.article);
    */

};






    



