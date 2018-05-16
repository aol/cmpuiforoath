
# CMP Demo Publisher Page

This sample page demonstrates how to integrate CMP into a publisher's webpage.  

## Setup the cmpuiforoath consent UI

Follow the instructions in the README file to download this cmpuiforoath repo, install node dependencies, and start the local web server for the consent UI.  

## Run the demo page

The consent UI uses webpack's built-in web server to host the UI.  However, for this demo page, we will use a simpler option (http-server).  

Install http-server
~~~~
> npm install http-server -g
~~~~~

Start the server

From a terminal, run the following command from the cmpuiforoath/demo directory.
~~~~
> http-server . --cors -p 8082
~~~~ 

Run the demo

browse to http://localhost:8082