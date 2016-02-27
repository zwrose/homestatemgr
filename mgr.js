var request = require('request');
var postPath = "http://node-playground-161360.nitrousapp.com:3000/api/homeStates";
var http = require('http');
var currentHomeState = {};

function manageHomeState {
    
    
    
    getBoseHomeState(function(homeStateGenerated) {
        
        
        
        
        console.log(homeStateGenerated);
        var postOptions = {
            'uri': postPath,
            'method': 'POST',
            'body': homeStateGenerated,
            'json': true
        };
        console.log(postOptions);
        request(postOptions, function (error, response, body) {
            if (!error) {
                console.log("Body:", body) // Show the HTML for the Google homepage.
            } else {
                console.log("Error:", error)
            }
        });
    });
};


function getBoseHomeState(boseCallback) {
    var homeState = {
        speakers: {},
        zonesPlaying: []
    };

    // go get the list of speakers from the server
    http.get('http://st.zwrose.com/device/listAdvanced', function(res) {
        var listBody = '';
        res.on('data', function(chunk) {listBody += chunk;});
        res.on('end', function() {JSON.parse(listBody).forEach(function(element, index, array) {

            // got get now playing info
            http.get('http://st.zwrose.com/' + encodeURIComponent(element.name) + '/nowPlaying', function(res) {
                var nowPlayingBody = '';
                res.on('data', function(chunk) {nowPlayingBody += chunk;});
                res.on('end', function() {
                    var nowPlaying = JSON.parse(nowPlayingBody).nowPlaying;

                    // go get zone info
                    http.get('http://st.zwrose.com/' + encodeURIComponent(element.name) + '/getZone', function(res) {
                        var zoneBody = '';
                        res.on('data', function(chunk) {zoneBody += chunk;});
                        res.on('end', function() {
                            var zoneInfo = JSON.parse(zoneBody).zone;

                            // get the device names into the array
                            homeState.speakers[element.name.toLowerCase()] = element;

                            // check for now playing
                            if (nowPlaying.source != 'STANDBY') {
                                homeState.speakers[element.name.toLowerCase()].nowPlaying = nowPlaying;

                                // check if master
                                if (!zoneInfo.master || zoneInfo.master == element.mac_address){
                                    homeState.zonesPlaying.push(element.name.toLowerCase());
                                    if(zoneInfo.master == element.mac_address) {
                                        homeState.speakers[element.name.toLowerCase()].isMaster = true;
                                    }
                                }
                            }
                            // ensure all speakers are discovered before proceeding
                            if(Object.keys(homeState.speakers).length === array.length){
                                console.log("Current State of the User's Home:", homeState);
                                boseCallback(homeState);
                            };

                        });
                    }).on('error', function(e) {
                        console.log("Got error: " + e.message);
                    });
                });
            }).on('error', function(e) {
                console.log("Got error: " + e.message);
            });
        });
        });
    }).on('error', function(e) {
        console.log("Got error: " + e.message);
    });
}