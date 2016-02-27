var http = require('http');
var request = require('request');
var _ = require('lodash');
var InfiniteLoop = require('infinite-loop');
var il = new InfiniteLoop;

// config vars
// BasePaths should *NOT* include a trailing '/'
var stServerBasePath = "http://st.zwrose.com"
var bridgeBasePath = "http://node-playground-161360.nitrousapp.com:3000";
var bridgeID = 1;

// action logic
console.log("Starting up the updater...")
il.add(updateHomeState, monitor).setInterval(10000).run();


// functions
function monitor(changeStamp) {
    console.log("Updater has run.", changeStamp);
}

function updateHomeState(cb) {
    // get home state from local server, and put to bridge with id
    getBoseHomeState(function(homeStateGenerated) {
        var postOptions = {
            'uri': bridgeBasePath + "/api/homeStates",
            'method': 'PUT',
            'body': {
                'currentState': homeStateGenerated,
                'id': bridgeID
            },
            'json': true
        };
        request(postOptions, function (error, response, body) {
            if (error) {
                console.log("Error:", error)
            } else {
                var currentdate = new Date(); 
                cb("Synced: " + (currentdate.getMonth()+1)  + "/" 
                + currentdate.getDate() + "/"
                + currentdate.getFullYear() + " @ "  
                + currentdate.getHours() + ":"  
                + currentdate.getMinutes() + ":" 
                + currentdate.getSeconds());
            }
        });
    });
}

function getBoseHomeState(boseCallback) {
    var homeState = {
        speakers: {},
        zonesPlaying: []
    };

    // go get the list of speakers from the server
    http.get(stServerBasePath + '/device/listAdvanced', function(res) {
        var listBody = '';
        res.on('data', function(chunk) {listBody += chunk;});
        res.on('end', function() {JSON.parse(listBody).forEach(function(element, index, array) {

            // got get now playing info
            http.get(stServerBasePath + '/' + encodeURIComponent(element.name) + '/nowPlaying', function(res) {
                var nowPlayingBody = '';
                res.on('data', function(chunk) {nowPlayingBody += chunk;});
                res.on('end', function() {
                    var nowPlaying = JSON.parse(nowPlayingBody).nowPlaying;

                    // go get zone info
                    http.get(stServerBasePath + '/' + encodeURIComponent(element.name) + '/getZone', function(res) {
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
                                // console.log("Current State of the User's Home:", homeState);
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