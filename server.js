const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { WebhookClient } = require("dialogflow-fulfillment");
const expressApp = express().use(bodyParser.json());

mongoose.Promise = global.Promise;
const dburi =
  "mongodb://abrar:dialogflow124@ds217976.mlab.com:17976/hotel_booking_dialogflow";
mongoose.connect(dburi, { useNewUrlParser: true }).catch(err => {
  console.log("error occured", err);
});

mongoose.connection.on("connected", () => {
  console.log("App is connected with database.");
});

mongoose.connection.on("disconnected", () => {
  console.log("App disconnected with database.");
  process.exit(1);
});

var userDetail = new mongoose.Schema(
  {
    name: { type: String, required: true },
    persons: { type: Number, required: true },
    email: { type: String, required: true }
  },
  { collection: "userInfo" }
);
var model = new mongoose.model("userInfo", userDetail);

expressApp.post("/webhook", function(request, response, next) {
  const agent = new WebhookClient({ request: request, response: response });

  function welcome(agent) {
    agent.add(`Good day! you want to book a room`);
  }

  function fallback(agent) {
    agent.add(`I didn't understand`);
    agent.add(`I'm sorry, can you try again?`);
  }

  function roomBooking(agent) {
    const name = agent.parameters.name;
    const persons = agent.parameters.persons;
    const email = agent.parameters.email;

    console.log(name, persons, email);

    var data = {
      name: name,
      persons: persons,
      email: email
    };

    console.log(data);

    var saveData = new model(data);
    saveData.save((err, mydata) => {
      if (err) {
        console.log(err);
        agent.add(`Erroe while writing on database`);
      } else {
        agent.add(`Thanks! ${name} your request for ${persons} 
    persons have forwarded we will contact you on ${email}`);
      }
    });

    agent.add(`Thanks! ${name} your request for ${persons} 
    persons have forwarded we will contact you on ${email}`);
  }

  function showBooking(agent) {
    var bookingName = agent.parameters.bookingname;
    console.log('Booking Name:', bookingName);
    model.find({ name: bookingName }, (err, mydata) => {
      if (err) {
        agent.add(`Erroe while looking on database`);
        console.log(err);
      } else {
        console.log('success show booking');
        agent.add(           
          `Room for 5 persons. Ordered by ${bookingName} contact email is : mail`
        );
      }
    });

  }

  let intentMap = new Map();
  intentMap.set("Default Welcome Intent", welcome);
  intentMap.set("Default Fallback Intent", fallback);
  intentMap.set("RoomBooking", roomBooking);
  intentMap.set("ShowBooking", showBooking);

  agent.handleRequest(intentMap);
});
expressApp.listen(process.env.PORT || 3000, function() {
  console.log("app is running in 3000");
});
