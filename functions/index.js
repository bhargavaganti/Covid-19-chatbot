const functions = require('firebase-functions');
var request = require('request');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

const {WebhookClient} = require('dialogflow-fulfillment');
const {Text, Card, Image, Suggestion, Payload} = require('dialogflow-fulfillment');

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

// Wikipedia link and image URLs
const api = 'https://covid-voice.herokuapp.com/api';
const wikipediaTemperatureUrl = 'https://en.wikipedia.org/wiki/2019%E2%80%9320_coronavirus_pandemic';
const wikipediaTemperatureImageUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Wikipedia-VideoWiki-Coronavirus_disease_2019.webm/310px-seek%3D2-Wikipedia-VideoWiki-Coronavirus_disease_2019.webm.jpg';
const site = 'https://covid-voice.herokuapp.com'
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

  function welcome(agent) {
    agent.add('Welcome to the Covid Voice Chat bot!');
    agent.add(new Card({
        title: 'Covid 19',
        imageUrl: wikipediaTemperatureImageUrl,
        text: 'Common symptoms include fever, cough and shortness of breath. 😱',
        buttonText: 'COVID 19 Wikipedia Page', 
        buttonUrl: wikipediaTemperatureUrl
      })
    );
    agent.add('I can predict the covid virus probabilty basing on few symptoms!');
    agent.add(new Suggestion('virus analysis'));
    agent.add(new Suggestion('predict'));
    agent.add(new Suggestion('Cancel'));
  }

  function getVitals(agent) {
    // Get parameters from Dialogflow to convert
    const temperature = agent.parameters.temperature;
    const unit = agent.parameters.unit;
    const age = agent.parameters.age;
    const fatigue = agent.parameters.fatigue;
    const cough = agent.parameters.cough;
    const body = agent.parameters.body;
    const sore = agent.parameters.sore;
    const breathing = agent.parameters.breathing;
    console.log(`User requested to convert ${temperature}° ${unit}`);

    let convertedTemp, convertedUnit, probability;
    convertedTemp = 75;
    if (unit === 'Celsius') {
      convertedTemp = temperature*(9/5) + 32;
      convertedUnit = 'Fahrenheit';
    }else{
      convertedTemp = temperature;
    }
    request.post({
      url: api,
      formData: {
        Age: age,
        BodyTemp: convertedTemp,
        Fatigue: 0,
        Cough: 1,
        BodyPain: 0,
        SoreThroat: 0,
        BreathingDifficulty: 1,
      },
  }, function(error, response, body) {
      console.log(response);
      probability = response;
  });
    console.log('converted:'+convertedTemp+ age + fatigue + cough + body + sore + breathing);
    

    // Sent the context to store the parameter information
    // and make sure the followup Rankine
    agent.setContext({
      name: 'predict',
      lifespan: 1,
      parameters:{temperature: temperature, unit: unit, age:age, fatigue: fatigue, cough: cough, body: body, sore:sore, breathing:breathing}
    });

    // Compile and send response
    agent.add(`Probabilty of being infected by COVID is  ${probability}°`);
    agent.add(new Card({
      title: 'Covid-19 probabilty detection',
      imageUrl: wikipediaTemperatureImageUrl,
      text: 'Probabilty Detector 😱',
      buttonText: 'COVID 19 Wikipedia Page', 
      buttonUrl: site
    }));
    agent.add(new Suggestion('Cancel'));
  }

  function fallback(agent) {
    agent.add('Woah! Its weird, can you try again?.');
    agent.add(`I didn't get that, can you try again?`);
  }

  let intentMap = new Map(); // Map functions to Dialogflow intent names
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Get Vitals', getVitals);
  intentMap.set('Default Fallback Intent', fallback);
  agent.handleRequest(intentMap);
});

