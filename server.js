const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const sgMail = require("@sendgrid/mail");
const { WebhookClient } = require("dialogflow-fulfillment");
const expressApp = express().use(bodyParser.json());

process.env.DEBUG = "dialogflow:debug";
// (process.env.SENDGRID_API_KEY =
//   "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"),
//   (mongoose.Promise = global.Promise);

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

expressApp.post("/webhook", function (request, response, next) {
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
    console.log("Booking Name:", bookingName);
    model.find({ name: bookingName }, (err, mydata) => {
      if (err) {
        agent.add(`Erroe while looking on database`);
        console.log(err);
      } else {
        console.log("success show booking");
        agent.add(
          `Room for 5 persons. Ordered by ${bookingName} contact email is : mail`
        );
      }
    });
  }

  function sendMail(agent) {
      const emailToSent = "abrar.khurshid.124@gmail.com";
    // let account =  nodemailer.createTestAccount();

    // let transporter = nodemailer.createTransport({
    //   host: "smtp.ethereal.email",
    //   port: 587,
    //   secure: false, // true for 465, false for other ports
    //   auth: {
    //     user: account.user, // generated ethereal user
    //     pass: account.pass // generated ethereal password
    //   }
    // });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "abrar.khurshid.120@gmail.com",
        pass: "12181189012"
      }
    });
    console.log(112);

    var mailOptions = {
      from: "abrar.khurshid.120@gmail.com",
      to: emailToSent, //receiver email
      subject: "Dialogflow Mail...",
      text: "I am successfully implement the mail functionality on chatbot"
    };
console.log(emailToSent);
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent:', mailOptions);
        agent.add(`We send you mail please check`);
      }
    })
    console.log('Success');
  }

  Promise.resolve()
  .then(sendMail)
  .catch(err => {
    console.error(err);
    return err; 
  })
  .then(ok => {
    console.log('Okay all well')
  });
  // sendMail().catch(console.error);
  // sgMail.setApiKey('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');
  // // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // const emailToSent = "abrar.khurshid.124@gmail.com";

  // const msg = {
  //   to: emailToSent,
  //   from: "peter.fessel@gmail.com",
  //   subject: "Just a quick note",
  //   text: "Just saying Hi from...",
  //   html: "Just saying <strong>Hi from Dialogflow</strong>..."
  // };
  // console.log(msg);

  // var mailMe= sgMail.send(msg, function(error, info){
  //   if (error) {
  //         console.log(error);
  //       } else {
  //         console.log('Sucessfull Email sent') ;
  //         agent.add(`We send you mail please check`);
  //       }
  // });


  // var promise1 = new Promise(function(resolve, reject) {
  //   setTimeout(function() {
  //     resolve(mailMe);
  //   }, 300);
  // });

  // promise1.then(function(value) {
  //   console.log(value);

  //   // expected output: "foo"
  // });

  // console.log(promise1);




  let intentMap = new Map();
  intentMap.set("Default Welcome Intent", welcome);
  intentMap.set("Default Fallback Intent", fallback);
  intentMap.set("RoomBooking", roomBooking);
  intentMap.set("ShowBooking", showBooking);
  intentMap.set("Send Mail", sendMail);

  agent.handleRequest(intentMap);
});
expressApp.listen(process.env.PORT || 3000, function () {
  console.log("app is running in 3000");
});
