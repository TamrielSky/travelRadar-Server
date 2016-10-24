var express = require('express');
var http = require('http');
var https = require('https');
var jsonp = require("node-jsonp");
var foursquare = (require('foursquarevenues'))('HTYPWDKP445LBUZJLZWDR3C4D1GCOB4WNPW20UUGSJH0C32R', 'V5VSZEHG1O4VNIGZSFAM11ZLHB2WKOEWOPMADS0XF1QRQMML');
var Yelp = require('yelp');
var router = express.Router();
var resultProcessor = require('./results.js');
var yelpCategories = require('./yelpCategories.js').categories;

var resultList = [];
var foursquareCategories;
foursquare.getCategories(null, function (error, response){
  foursquareCategories = response;
})

var populateCategories = function (filters, seperator, categoryList) {
  var categories = null;
  filters.forEach(function (category) {

    if (!categories) {
      categories = categoryList[category];
    } else {
      categories = categories + seperator + categoryList[category];
    }

  });

  return categories;
}

var googlePlacesSearch = function (bounds, filter) {

  var boundingBox = {
    "northeast": {
      "lat": bounds.north,
      "lng": bounds.east
    },
    "southwest": {
      "lat": bounds.south,
      "lng": bounds.west
    }
  };

  var googleMapsClient = require('@google/maps').createClient({
    key: 'AIzaSyB1G7_SWU14g5CNFpu8H7Dnob0DPbSDS6Y'
  });
  var googleRequest = {
     type: filter,
    bounds: boundingBox
  };

  return new Promise(function (resolve, reject) {
    googleMapsClient.placesNearby(googleRequest, function (err, response) {

      resolve(response);

    });

  });

}

var foursquarePlacesSearch = function (bounds, filters) {

  var foursquarePlaceTypes = {
    'restaurant': '4d4b7105d754a06374d81259',
    'grocery': '4bf58dd8d48988d118951735',
    'bar': '4d4b7105d754a06376d81259',
    'airport': '4bf58dd8d48988d1ed931735',
    'hospital': '4bf58dd8d48988d196941735',
    'atm': '52f2ab2ebcbc57f1066b8b56',
    'gas_station': '4bf58dd8d48988d113951735'
  }

  var searchObj = {sw: bounds.south + ',' + bounds.west, ne: bounds.north + ',' + bounds.east, categoryId: populateCategories(filters, ",", foursquarePlaceTypes), limit: 50, intent: "browse" };

  return new Promise(function (resolve, reject) {

    foursquare.exploreVenues(searchObj, function (error, venues) {

      if (!error) {
        console.log(venues);
      } resolve(venues);

    });

  });
}

var yelpPlacesSearch = function (bounds, filters) {

  var yelp = new Yelp({
    consumer_key: 'h_CfYvwNTS51n96wd1J8Yg',
    consumer_secret: 'yRk21bPPiZShxKn6stv2qth8nm4',
    token: 'YQHmflBE5VKvzjCgO5N3YkmsB4xIUNsa',
    token_secret: 'Ptd6VdD63_AHgKNd_aezFO4iiuw',
  });

  var yelpCategories = {
    'restaurant': 'restaurants',
    'grocery': 'grocery',
    'bar': 'bars',
    'airport': 'airports',
    'hospital': 'physicians',
    'atm': 'financialservices',
    'gas_station': 'servicestations'
  }

  var yelpParams = {bounds: bounds.south + ',' + bounds.west + '|' + bounds.north + ',' + bounds.east, category_filter: populateCategories(filters, ",", yelpCategories)};
  return yelp.search(yelpParams)

}

var getPlacesAlongRoute = function (bounds, filters) {

  var results = {};
  var promises = [];

  promises.push(yelpPlacesSearch(bounds, filters));
  promises.push(foursquarePlacesSearch(bounds, filters));
  //promises.push(googlePlacesSearch(bounds, filter));
  
    return new Promise(function (resolve, reject) {
       
       Promise.all(promises).then(function (results) {
        resolve(results);
    });
  });
}

var populateResults = function (places) {
  if (places) {
    resultList = resultList.concat(places);
  }
}

/* GET home page. */
router.post('/search', function (req, res, next) {

  //var list = boundingBoxes.routeBoxer.box([{37.778590, 122.420917}, {37.819048, 122.478393}], 5000);

  resultList = [];
  var promise = Promise.resolve();
  for (item in req.body) {

    var items = JSON.parse(item);

  }

  var promises = [];
  items[0].forEach(function (box) {
    promises.push(getPlacesAlongRoute(box, items[1]));
  });


  Promise.all(promises).then(function (result) {

    for (var num = 0; num < result.length; num++) {
      populateResults(result[num]);
    }

    var results = resultProcessor.eliminateDuplicates(resultProcessor.filterPlaces(resultList, items[1], yelpCategories, foursquareCategories.response.categories));

    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:9000');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    res.send(results);

  });

});

module.exports = router;

 

  


     

        

  