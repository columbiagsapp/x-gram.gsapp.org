'use strict';

var image_files_directory = "/var/www/x-gram.gsapp.org/public_html/public/img/instagram/";
var image_files_extension = ".jpg";

var mongoose = require('mongoose'),
	fs = require('fs'),
    request = require('request');

exports.get = function(req, res){
	res.send('getted');
}


/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Image = mongoose.model('Image'),
    _ = require('lodash');


/**
 * Find image by id
 */
exports.image = function(req, res, next, id) {
    Image.load(id, function(err, image) {
        if (err) return next(err);
        if (!image) return next(new Error('Failed to load image ' + id));
        req.image = image;
        next();
    });
};

/**
 * Get an image by id
*/
exports.get = function(id){
	Image.load(id, function(err, image) {
        if (err){
        	console.log('error attempting to get image: ' + err);
        	return null;
        }else if (!image){
        	//console.log('No image with id: ' + id);
        	return null;
        }else{
        	//console.log('got image');
        	return image;
        }
    });
}

exports.getByInstagramID = function(iid){
	Image.findOne({ instagram_id: iid}, function(err, image) {
        if (err){
        	console.log('error attempting to get image by instagram_id with msg: ' + err);
        	return null;
        }else if (!image){
        	//console.log('No image with instagram_id: ' + iid);
        	return null;
        }else{
        	//console.log('got image by instagram_id');
        	return image;
        }
    });
}



/**
 * Upsert an image
 */
exports.upsert = function(im, idx, city, next) {
    Image.findOne({ instagram_id: im[idx].id}, function(err, image) {
        if (err){
        	console.log('error attempting to get image by instagram_id with msg: ' + err);
        	return null;
        }else if (!image){
        	console.log('No image with instagram_id: ' + im[idx].id + ' so we\'re creating it');
        	
        	var image = new Image();
			//image._id = mongoose.Types.ObjectId(im.id);//set _id to Instagram id

			image.created_time = im[idx].created_time;
			image.username = im[idx].user.username;
			image.caption = im[idx].caption.text;
			image.link = im[idx].link;

			if(im[idx].location){
				image.latitude = im[idx].location.latitude;
				image.longitude = im[idx].location.longitude;
			}else{
				image.latitude = null;
				image.longitude = null;
			}

			image.filter = im[idx].filter;
			image.image_url = im[idx].images.standard_resolution.url;
			image.user_website = im[idx].user.website;
			image.instagram_id = im[idx].id;

			image.downloaded = false;
			image.uploaded = false;

			image.city = city;


		    image.save(function(err) {
		        if (err) {
		        	console.log('error attempting to save image');
		        } else {
		        	console.log('created new image');
		        	idx++;//increment index
		        	next(im, idx);
		        }
		    });


        }else{
        	console.log('image already exists, don\'t create');
        	idx++;//increment index
		    next(im, idx);
        }
    });
};



function downloadArrayByInstagramID(images, idx, flickr_api){

	console.log('entering downloadArrayByInstagramID with images length: ' + images.length);

	if(idx < images.length){

		Image.findOne({ instagram_id: images[idx].instagram_id }, function(err, image) {
	        if (err){
	        	console.log('error attempting to downloadByInstagramID with msg: ' + err);
	        	console.log('moving on to the next'.red);
	        	idx++;
				downloadArrayByInstagramID(images, idx);
	        }else if (!image){
	        	console.log('downloadByInstagramID problem: no image with instagram_id: ' + images[idx].instagram_id);
	        	console.log('moving on to the next'.red);
	        	idx++;
				downloadArrayByInstagramID(images, idx);
	        }else{
	        	var uri = image.image_url;
	        	var filename = image_files_directory + image.instagram_id + image_files_extension;

	        	request.head(uri, function(err, res, body){
					console.log('content-type:', res.headers['content-type']);
					console.log('content-length:', res.headers['content-length']);
				
					//download and write the image binary to disc
					request(uri).pipe(fs.createWriteStream(filename)).on('close', function(){
						//set downloaded flag to true
						Image.update({ instagram_id: images[idx].instagram_id}, { downloaded: true }, function(err){
							if(err) console.log('error attempting to update image with download flag with msg: ' + msg);
							//callback after flag set
							idx++;
							downloadArrayByInstagramID(images, idx, flickr_api);

						});
					});
				});
	        }
	    });
	}else{
		console.log('finished downloading images');

		//trigger image upload to Flickr
		uploadAll(flickr_api);
	}
			
};

exports.downloadAll = function(flickr_api){
	Image.find({ downloaded: false }).exec(function(err, images) {
        if (err) {
            console.log("error attempting to get all images for downloadAll with msg: " + msg);
        } else {
            downloadArrayByInstagramID(images, 0, flickr_api);
        }
    });
}



/**
 * Create an image
 */
exports.create = function(im) {

	var image = new Image();
	//image._id = mongoose.Types.ObjectId(im.id);//set _id to Instagram id

	image.created_time = im.created_time;
	image.username = im.user.username;
	image.caption = im.caption.text;
	image.link = im.link;

	if(im.location){
		image.latitutde = im.location.latitude;
		image.longitude = im.location.longitude;
	}else{
		image.latitutde = null;
		image.longitude = null;
	}

	image.filter = im.filter;
	image.image_url = im.images.standard_resolution.url;
	image.user_website = im.user.website;
	image.instagram_id = im.id;


    image.save(function(err) {
        if (err) {
        	console.log('error attempting to save image');
        } else {
        	//console.log('created new image');
        }
    });
};

/**
 * Update an image
 */
exports.update = function(req, res) {
    var image = req.image;

    image = _.extend(image, req.body);

    image.save(function(err) {
        if (err) {
            return res.send('users/signup', {
                errors: err.errors,
                image: image
            });
        } else {
            res.jsonp(image);
        }
    });
};

/**
 * Delete an image
 */
exports.destroy = function(req, res) {
    var image = req.image;

    image.remove(function(err) {
        if (err) {
            return res.send('users/signup', {
                errors: err.errors,
                image: image
            });
        } else {
            res.jsonp(image);
        }
    });
};

/**
 * Show an image
 */
exports.show = function(req, res) {
    res.jsonp(req.image);
};

/**
 * List of Images
 */
exports.all = function(req, res) {
    Image.find().sort('-created_time').exec(function(err, images) {
        if (err) {
            console.log("error attempting to get all images with msg: " + msg);
        } else {
        	console.log('total saved images: ' + images.length);
            return images;
        }
    });
};

function uploadArrayToFlickr(images, idx, flickr_api){

    if(idx < images.length){

        var fullpath = image_files_directory + images[idx].instagram_id + image_files_extension;

        // the upload method is special, but this library automatically handles the
        // hostname change
        flickr_api({
            method: 'upload',
            title: 'X-Gram 2014 from ' + images[idx].username + ' in ' + images[idx].city,
            description: images[idx].caption,
            is_public: 1,
            is_friend: 0,
            is_family: 0,
            hidden: 2,
            photo: fs.createReadStream(fullpath)
        }, function(err, response) {
			if (err) {
				console.error('Could not upload photo:', err);
				console.log('continuing anyways'.red);
				idx++;
				uploadArrayToFlickr(images, idx, flickr_api);
			}else {
				var new_photo_id = response.photoid._content;
				// usually, the method name is precisely the name of the API method, as they are here:
				flickr_api({method: 'flickr.photos.getInfo', photo_id: new_photo_id}, function(err, response) {
					console.log('Full photo info:', response);
					flickr_api({method: 'flickr.photosets.addPhoto', photoset_id: 72157642125547533, photo_id: new_photo_id}, function(err, response) {
				        if(err){
				        	console.log('error adding photo to photoset');
				        	console.log('continuing anyways'.red);
				    	}else{
				    		console.log('Added photo to photoset:', response);
				    	}
				    	idx++;
						uploadArrayToFlickr(images, idx, flickr_api);
					});
				});
			}
        });
    }else{
        console.log('\n\n\n\n\n\n\nall photos finished uploading!'.cyan)
    }
}


function uploadAll(flickr_api){
	Image.find({ downloaded: true, uploaded: false }).exec(function(err, images) {
        if (err) {
            console.log("error attempting to get all non-uploaded images for allToUpload with msg: " + msg);
        } else {
            uploadArrayToFlickr(images, 0, flickr_api);
        }
    });

};






















