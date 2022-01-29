'use strict';

//var request = require('request');
var request_as_promised = require('request-promise');

var host = "https://taihopeoplebuddyfaq.azurewebsites.net/qnamaker";
var endpoint_key = "endpoint_key";
var route = "/knowledgebases/f98ec0fa-xxxx-xxxx-bb08-7e9638a8ac1b/generateAnswer";

var question = {'question': 'Tell me about Dental Insurance','top': 3};

// var getanswer = async () => {

//     try{
//         // Add an utterance
//         var options = {
//             uri: host + route,
//             method: 'POST',
//             headers: {
//                 'Authorization': "EndpointKey " + endpoint_key
//             },
//             json: true,
//             body: question
//         };

//         var response = await request_as_promised.post(options);

//         console.log(response);

//     } catch (err){
//         console.log(err.statusCode);
//         console.log(err.message);
//         console.log(err.error);
//     }
// };
async function getAnswer () {

    try{
        // Add an utterance
        var options = {
            uri: host + route,
            method: 'POST',
            headers: {
                'Authorization': "EndpointKey " + endpoint_key
            },
            json: true,
            body: question
        };

        var response = await request_as_promised.post(options);

        console.log(response);

    } catch (err){
        console.log(err.statusCode);
        console.log(err.message);
        console.log(err.error);
    }
};

getAnswer();