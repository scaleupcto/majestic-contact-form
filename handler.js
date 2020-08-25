'use strict';

var AWS = require('aws-sdk');
var ses = new AWS.SES();

var qs = require('querystring')

module.exports.send = async event => {
  console.log(event);
  var body = new Buffer.from(event.body, 'base64').toString('utf8');
  var json = qs.parse(body);
  console.log(`Received contact form: ${body}`);
  try {
    await sendEmail(json);
  } catch (e) {
    console.log("Caught error sending email");
    console.log(e);
  }
  console.log(`Redirecting to ${process.env.MAJESTIC_REDIRECT_LOCATION}`);
  return {
    'statusCode': 302,
    'headers': {
      'Location': process.env.REDIRECT_LOCATION
    }
  };
};


async function sendEmail (data) {
  const params = {
    Destination: {
      ToAddresses: [
        process.env.CONTACT_DESTINATION
      ]
    },
    Message: {
      Body: {
        Text: {
          Data: `name: ${data.name}\nservice: ${data.service}\nemail: ${data.email}\nphone number : ${data.phone}\nmessage: ${data.message}`,
          Charset: 'UTF-8'
        }
      },
      Subject: {
        Data: `Website Enquiry from ${data.name}`,
        Charset: 'UTF-8'
      }
    },
    Source: process.env.SENDER,
    ReplyToAddresses: [ data.email ]
  };
  return ses.sendEmail(params).promise();
}