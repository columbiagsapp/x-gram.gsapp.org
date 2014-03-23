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


/////// DEPENDENCIES
var colors  = require('colors');
console.log('images.js entered'.cyan);
/////// END DEPENDENCIES


/////// INSTAGRAM
var ig = require('instagram-node').instagram();

//import Instagram secrets from json file
var instagram_secrets = require('../../secrets.json').instagram;

//set up secrets for Instagram module
ig.use({ client_id: instagram_secrets.client_id,
    client_secret: instagram_secrets.client_secret });
/////// END INSTAGRAM


/////// FLICKR
var flickr = require('flickr-with-uploads');

//import Flickr secrets from json file
var flickr_secrets = require('../../secrets.json').flickr;

//set up secrets for Flickr module
var flickr_api = flickr(
  flickr_secrets.key, // consumer_key
  flickr_secrets.secret, // consumer_secret
  flickr_secrets.oauth_token,
  flickr_secrets.oauth_secret
);
/////// END FLICKR


/////// GLOBALS

//pull in array of cities from json file
var cities = require('../../cities.json');

var tags = []; //array to hold tags for all cities (eg. xrio, xbeirut)
var tag_index = 0; //counter: current city fetching from Instagram by index in tags[] array
var total_found = 0; //counter: total images found from Instagram for given city
var current_city = ''; //pointer: current city fetching from Instagram

var interval_id; //global ID for the main interval for fetching from Instagram

var FETCH_TIME = 3000; //fetch every 3 seconds
/////// END GLOBALS






//Initializes downloading all undownloaded images from Instagram
function initImageDownloadCycle(){
    images.downloadAll(flickr_api);
}

//Initializes fetching all images from Instagram and puts them in the database
//to be later downloaded then uploaded to Flickr
function initInstagramFetchCycle(){

    //create tags in form of xcity based on cities array
    cities.forEach(function(c){
        tags.push( 'x' + c );
    });

    current_city = tags[0].substring(1);

    //start interval to fetch from Instagram
    interval_id = setInterval(fetchFromInstagram, FETCH_TIME);
    
}


//Upsert images from Instagram into database
function upsertImages(medias, idx){
    //because run recursively, exit once all have been fetched
    if(idx >= medias.length) return false;

    //call upsert from controllers > images
    images.upsert(medias, idx, current_city, upsertImages);
}


function fetchFromInstagram(){
    ig.tag_media_recent(tags[tag_index], function(err, medias, pagination, limit) {

        if(err){
            console.log(err);
        }else{
            console.log('\nFetched ' + medias.length + ' images'.cyan + ' from tag_index: ' + tag_index + ' = city: ' + tags[tag_index] + ' with limit: ' + limit + ' and pagination:');
            console.dir(pagination);

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






    



