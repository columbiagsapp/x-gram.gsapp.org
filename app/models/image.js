'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;


/**
 * Image Schema
 */
var ImageSchema = new Schema({
    created_time: {
        type: String,
        default: '',
        trim: false
    },
    username: {
        type: String,
        default: '',
        trim: false
    },
    caption: {
        type: String,
        default: '',
        trim: true
    },
    link: {
        type: String,
        default: '',
        trim: false
    },
    latitude: {
        type: Number,
        default: null
    },
    longitude: {
        type: Number,
        default: null
    },
    filter: {
        type: String,
        default: '',
        trim: false
    },
    image_url: {
        type: String,
        default: '',
        trim: false
    },
    user_website: {
        type: String,
        default: '',
        trim: false
    },
    instagram_id: {
        type: String,
        default: '',
        trim: false
    },
    downloaded: {
        type: Boolean,
        defaut: false
    },
    uploaded: {
        type: Boolean,
        defaut: false
    },
    city: {
        type: String,
        default: '',
        trim: false
    },
});

/**
 * Validations
 */
ImageSchema.path('image_url').validate(function(image_url) {
    return image_url.length;
}, 'Image URL cannot be blank');

/**
 * Statics
 */
ImageSchema.statics.load = function(id, cb) {
    this.findOne({
        _id: id
    }).populate('user', 'name username').exec(cb);
};

mongoose.model('Image', ImageSchema);
