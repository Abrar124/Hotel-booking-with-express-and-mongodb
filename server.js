const express = require("express");
const bodyParser = require("body-parser");


const { WebhookClient } = require("dialogflow-fulfillment");


const expressApp = express().use(bodyParser.json());

expressApp.post("/webhook", function (request, response, next) {
  const agent = new WebhookClient({ request: request, response: response });

  function welcome(agent) {
    agent.add(`Good day! What can I do for you today?`);
  }

  function fallback(agent) {
    agent.add(`I didn't understand`);
    agent.add(`I'm sorry, can you try again?`);
  }
  let intentMap = new Map();
  intentMap.set("Default Welcome Intent", welcome);
  intentMap.set("Default Fallback Intent", fallback);

  agent.handleRequest(intentMap);

});
expressApp.listen(process.env.PORT || 3000, function () {
  console.log("app is running in 3000");
});