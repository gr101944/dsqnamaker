'use strict';

let fs = require ('fs');
let https = require ('https');

// **********************************************
// *** Update or verify the following values. ***
// **********************************************

// Represents the various elements used to create HTTP request URIs
// for QnA Maker operations.
let host = 'westus.api.cognitive.microsoft.com';
let service = '/qnamaker/v4.0';
let method = '/knowledgebases/';

// Replace this with a valid subscription key.
let subscriptionKey = 'key here';

// Replace this with a valid knowledge base ID.
let kb = 'f98ec0fa-xxx-4847-bb0xxxxxx8-7e9638a8ac1b';

// Build your path URL.
var path = service + method + kb;
const urlList = [
'https://storageaccountrajesa4ac.blob.core.windows.net/testblobds/2021-22 Aetna Summary Plan Description.pdf',
'https://storageaccountrajesa4ac.blob.core.windows.net/testblobds/2021-22 Aetna Summary of Coverage.pdf',
'https://storageaccountrajesa4ac.blob.core.windows.net/testblobds/testing-design-doc.docx/testing-design-doc.docx'

]

// Dictionary that holds the knowledge base. Modify knowledge base here.
let kb_model = {
    'add': {
      'qnaList': [],
      'urls': urlList,
      'files':[
            {
                fileName: "testing-design-doc.docx",
                fileUri: "https://storageaccountrajesa4ac.blob.core.windows.net/testblobds/testing-design-doc.docx"
            }
      ]
    }
  };
  
  
// Convert the JSON object to a string..
  let content = JSON.stringify(kb_model);

// Formats and indents JSON for display.
let pretty_print = function(s) {
    return JSON.stringify(JSON.parse(s), null, 4);
}

// Call 'callback' after we have the entire response.
let response_handler = function (callback, response) {
    let body = '';
    response.on('data', function(d) {
        body += d;
    });
    response.on('end', function() {
    // Calls 'callback' with the status code, headers, and body of the response.
    callback ({ status : response.statusCode, headers : response.headers, body : body });
    });
    response.on('error', function(e) {
        console.log ('Error: ' + e.message);
    });
};

// HTTP response handler calls 'callback' after we have the entire response.
let get_response_handler = function(callback) {
    // Return a function that takes an HTTP response and is closed over the specified callback.
    // This function signature is required by https.request, hence the need for the closure.
    return function(response) {
        response_handler(callback, response);
    }
}

// Calls 'callback' after we have the entire PATCH request response.
let patch = function(path, content, callback) {
    let request_params = {
        method : 'PATCH',
        hostname : host,
        path : path,
        headers : {
            'Content-Type' : 'application/json',
            'Content-Length' : content.length,
            'Ocp-Apim-Subscription-Key' : subscriptionKey,
        }
    };

    // Pass the callback function to the response handler.
    let req = https.request(request_params, get_response_handler(callback));
    req.write(content);
    req.end ();
}

// Calls 'callback' after we have the response from the /knowledgebases PATCH method.
let update_kb = function(path, req, callback) {
    console.log('Calling ' + host + path + '.');
    // Send the PATCH request.
    patch(path, req, function (response) {
        // Extract the data we want from the PATCH response and pass it to the callback function.
        callback({ operation : response.headers.location, response : response.body });
    });
}

// Calls 'callback' after we have the entire GET request response.
let get = function(path, callback) {
    let request_params = {
        method : 'GET',
        hostname : host,
        path : path,
        headers : {
            'Ocp-Apim-Subscription-Key' : subscriptionKey,
        }
    };

    // Pass the callback function to the response handler.
    let req = https.request(request_params, get_response_handler(callback));
    req.end ();
}

// Calls 'callback' after we have the response from the GET request to check the status.
let check_status = function(path, callback) {
    console.log('Calling ' + host + path + '.');
    // Send the GET request.
    get(path, function (response) {
        // Extract the data we want from the GET response and pass it to the callback function.
        callback({ wait : response.headers['retry-after'], response : response.body });
    });
}

// Sends the request to update the knowledge base.
update_kb(path, content, function (result) {

    console.log(pretty_print(result.response));

    // Loop until the operation is complete.
    let loop = function() {

        // add operation ID to the path
        path = service + result.operation;

        // Check the status of the operation.
        check_status(path, function(status) {

            // Write out the status.
            console.log(pretty_print(status.response));

            // Convert the status into an object and get the value of the operationState field.
            var state = (JSON.parse(status.response)).operationState;

            // If the operation isn't complete, wait and query again.
            if (state == 'Running' || state == 'NotStarted') {

                console.log('Waiting ' + status.wait + ' seconds...');
                setTimeout(loop, status.wait * 1000);
            }
        });
    }
    // Begin the loop.
    loop();
});