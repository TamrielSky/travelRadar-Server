

var getReverseMapping = function () {

    return {
        foursquarePlaceTypes: {
            '4d4b7105d754a06374d81259': 'restaurant',
            '4bf58dd8d48988d118951735': 'grocery',
            '4d4b7105d754a06376d81259': 'bar',
            '4bf58dd8d48988d1ed931735': 'airport',
            '4bf58dd8d48988d196941735': 'hospital',
            '4bf58dd8d48988d104941735': 'hospital',
            '52f2ab2ebcbc57f1066b8b56': 'atm',
            '4bf58dd8d48988d10a951735': 'atm',
            '4bf58dd8d48988d113951735': 'gas_station'
        },

        yelpPlaceTypes: {
            'restaurants': 'restaurant',
            'food': 'grocery',
            'nightlife': 'bar',
            'bars': 'bar',
            'airports': 'airport',
            'financialservices': 'atm',
            'physicians': 'hospital',
            'health': 'hospital',
            'auto': 'gas_station'
        }
    }

}

var getYelpCategory = function (filters, categories, dictionary) {

    var yelpCategories = {
        'restaurant': ['restaurants'],
        'grocery': ['food'],
        'bar': ['nightlife', 'bars'],
        'airport': ['airports'],
        'hospital': ['physicians', 'health'],
        'atm': ['financialservices'],
        'gas_station': ['auto']
    }
    var possibleCategories = [];

    for (var dictCount = 0; dictCount < dictionary.length; dictCount++) {
        for (var catCount = 0; catCount < categories.length; catCount++) {
            for (var category = 0; category < categories[catCount].length; category++)
                if (dictionary[dictCount].title == categories[catCount][category]) {
                    for (var count = 0; count < dictionary[dictCount].parents.length; count++) {
                        for (filterCount = 0; filterCount < filters.length; filterCount++) {
                            for (var yelpMap = 0; yelpMap < yelpCategories[filters[filterCount]].length; yelpMap++) {
                                if (dictionary[dictCount].parents[count] == yelpCategories[filters[filterCount]][yelpMap]) {
                                    return yelpCategories[filters[filterCount]][yelpMap];
                                }
                            }
                        }
                    }
                }
        }
    }
}

function getFourSquareCategory(categoryId, dictionary) {

    function recursiveArraySearch(element, categoryId, callback) {
        if (element.id == categoryId) {
            callback(true);
        }
        if (element.categories.length > 0) {

            for (var count = 0; count < element.categories.length; count++) {
                if (element.categories[count].id == categoryId) {
                    callback(categoryId);
                    break;
                } else {
                    recursiveArraySearch(element.categories[count], categoryId, callback);
                }
            }
        }
    }

    var count = 0;
    var dictIndex = 0;
    var subCategory = "place";
    for (count = 0; count < dictionary.length; count++) {
        recursiveArraySearch(dictionary[count], categoryId, function (found) {
            if (found) {
                subCategory = found;
                dictIndex = dictionary[count].id;
            }
        })
    }
    if (getReverseMapping().foursquarePlaceTypes[subCategory]) {
        return subCategory;
    } else {
        return dictIndex;
    }
}

var eliminateDuplicates = function (places) {

    var newPlaces = [];
    var placeList = [];
    var count = 0;

    for (var i = 0; i < places.length; i++) {

        if (newPlaces[places[i].distance + "," + places[i].name]) {

            if (places[i].rating && places[i].review) {

                newPlaces[places[i].distance + "," + places[i].name] = places[i];

            }

        } else {

            newPlaces[places[i].distance + "," + places[i].name] = places[i];

        }

    }
    for (var item in newPlaces) {

        placeList[count++] = newPlaces[item];

    }

    return placeList;
}

var calcDistance = function (lat1, lon1, lat2, lon2) {

    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);  // deg2rad below
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d * 1000;


    function deg2rad(deg) {
        return deg * (Math.PI / 180)
    }
}

var sortByProperty = function (places, property) {

    return places.sort(function (a, b) {

        if (a[property] == b[property]) {
            return 0;
        } else {
            return a[property] < b[property] ? -1 : 1;
        }

    });
}

var filterPlaces = function (places, filters, yelpDict, fourSquareDict) {
    var placeList = [];
    var count = 0;

    for (var resultCount = 0; resultCount < places.length; resultCount++) {

        if (Object.prototype.toString.call(places[resultCount]) === '[object Object]') {
            if (places[resultCount].businesses) {

                for (var j = 0; j < places[resultCount].businesses.length; j++) {
                    placeList[count] = {};

                    var filter = getReverseMapping().yelpPlaceTypes[getYelpCategory(filters, places[resultCount].businesses[j].categories, yelpDict)];

                    if (filter) {
                        placeList[count]["filter"] = filter;

                        placeList[count]["distance"] = ((places[resultCount].businesses[j].distance) * 0.000621371192).toFixed(2);
                        placeList[count]["name"] = places[resultCount].businesses[j].name;

                        if (placeList[count]["name"].replace(/\s/g, '') == "LosPlanesDeRenderos") {
                            console.log("found");
                        }
                        placeList[count]["contact"] = places[resultCount].businesses[j].display_phone;
                        placeList[count]["rating"] = places[resultCount].businesses[j].rating ? places[resultCount].businesses[j].rating : 0;
                        placeList[count]["review"] = places[resultCount].businesses[j].snippet_text;

                        var address = [];
                        for (var i = 0; i < places[resultCount].businesses[j].location.display_address.length; i++) {

                            address.push(places[resultCount].businesses[j].location.display_address[i]);

                        }
                        address = address.join();
                        placeList[count]["address"] = address;
                        placeList[count]["location"] = places[resultCount].businesses[j].location.coordinate;
                        placeList[count]["datasrc"] = "yelp";
                        placeList[count]["place_id"] = places[resultCount].businesses[j].id;
                        placeList[count]["selected"] = false;
                        count++;
                    }
                }

            } else {

                var placeItems = places[resultCount].response.groups[0].items;

                for (var j = 0; j < placeItems.length; j++) {

                    placeList[count] = {};
                    var filter = getReverseMapping().foursquarePlaceTypes[getFourSquareCategory(venue.categories[0].id, fourSquareDict)];
                    if (filter) {

                        placeList[count]["filter"] = filter;

                        var venue = placeItems[j].venue;

                        placeList[count]["distance"] = ((venue.location.distance) * 0.000621371192).toFixed(2);

                        var address = [];
                        for (var i = 0; i < venue.location.formattedAddress.length; i++) {

                            address.push(venue.location.formattedAddress[i]);

                        }
                        address = address.join();
                        placeList[count]["address"] = address;

                        placeList[count]["rating"] = venue.rating ? (venue.rating * 5 / 10) : 0;
                        placeList[count]["name"] = venue.name;

                        if (venue.name.replace(/\s/g, '') == "LosPlanesDeRenderos") {
                            console.log("found");
                        }
                        placeList[count]["location"] = { latitude: venue.location.lat, longitude: venue.location.lng };
                        placeList[count]["contact"] = venue.contact.formattedPhone;
                        if (placeItems[j].tips) {
                            placeList[count]["review"] = placeItems[j].tips[0].text;
                        }
                        placeList[count]["datasrc"] = "foursquare";
                        placeList[count]["place_id"] = venue.id;
                        placeList[count]["selected"] = false;
                        var category = getFourSquareCategory(venue.categories[0].id, fourSquareDict);

                        count++;

                    }

                }
            }

        } /*else {

                        var googlePlaces = places[resultCount];

                        for (var i = 0; i < googlePlaces.length; i++) {
                            placeList[count] = {};
                            var place = googlePlaces[i];
                           
                            placeList[count]["rating"] = place.rating ? place.rating : 0;
                            placeList[count]["name"] = place.name;
                            placeList[count]["location"] = { latitude: place.geometry.location.lat(), longitude: place.geometry.location.lng() };
                            placeList[count]["address"] = place.vicinity;
                            placeList[count]["datasrc"] = "google";
                            placeList[count]["filter"] = type;
                            placeList[count]["place_id"] = place.id;
                            placeList[count]["selected"] = false;

                            count++;

                        }

                    }*/
    }

    return placeList;
}




module.exports = {
    sortByProperty: sortByProperty,
    calcDistance: calcDistance,
    eliminateDuplicates: eliminateDuplicates,
    filterPlaces: filterPlaces,
    getYelpCategory: getYelpCategory,
    getFourSquareCategory: getFourSquareCategory
}

