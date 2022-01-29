'use strict';

const request = require('request-promise');

// **********************************************
// *** Update or verify the following values. ***
// **********************************************

// Represents the various elements used to create HTTP request URIs
// for QnA Maker operations.
const knowledge_base_id = "f02242c0-c978-4915-bd66-xxxxxx";
const resource_key = "key here";


const host = "https://westus.api.cognitive.microsoft.com/qnamaker/v4.0/knowledgebases/" + knowledge_base_id;

var publish = async () => {

    try{
        // Add an utterance
        var options = {
            uri: host,
            method: 'POST',
            headers: {
                'Ocp-Apim-Subscription-Key': resource_key
            },
            resolveWithFullResponse: true
        };

        let response = await request(options);

        return response;

    } catch (err){
        throw err;
    }
};

publish().then(response => {

    // success: statusCode==204
    console.log(response.statusCode);

}).catch((err)=> {
        console.log(err.statusCode);
        console.log(err.message);
        console.log(err.error);
});