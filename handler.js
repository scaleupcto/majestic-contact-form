'use strict';

const AWS = require('aws-sdk');
const ses = new AWS.SES();
const monday = require('monday-sdk-js')();
monday.setToken(process.env.MONDAY_API_V2_TOKEN);
const moment = require("moment");

const qs = require('querystring')

module.exports.contact = async event => {
  console.log(event);
  const body = new Buffer.from(event.body, 'base64').toString('utf8');
  const json = qs.parse(body);
  console.log(`Received contact form: ${body}`);
  try {
    await sendEmail(json);
    await addEnquiry(json);
  } catch (e) {
    console.log("Caught error sending email");
    console.log(e);
  }
  console.log(`Redirecting to ${process.env.REDIRECT_LOCATION}`);
  return {
    'statusCode': 302,
    'headers': {
      'Location': process.env.REDIRECT_LOCATION
    }
  };
};


async function sendEmail(data) {
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

async function addEnquiry(data) {
  const columnValues = {
    name: data.name,
    date: {date: moment().format("YYYY-MM-DD")},
    email: data.email,
    phone9: {phone: data.phone || '', countryShortName: "GB"},
    job_description: data.message
  };
  const query = `
    mutation {
      create_item (board_id: 437582950, group_id: "new_group", item_name: "Email enquiry from ${data.name}" column_values: ${JSON.stringify(JSON.stringify(columnValues))}) {
        id
      }
    }`;
  console.log(`Running query ${query}`);
  const response = await monday.api(query);
  console.log(response);
  return response;
}