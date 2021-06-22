'use strict';

const AWS = require('aws-sdk');
const ses = new AWS.SES();
const monday = require('monday-sdk-js')();
monday.setToken(process.env.MONDAY_API_V2_TOKEN);
const moment = require("moment");

const qs = require('querystring');
const _ = require('lodash');

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

const spamwords = [
    ' SEO ',
    ' Buddhism ',
    'search engines',
    'web design',
    'Bitcoin',
    'cryptocurrency',
    'Google Ads',
    ' PPC ',
    'TEDx',
    'Your website or a website that your organization hosts is infringing on a copyrighted images owned by myself'
];

function isPotentialSpam(data) {
  return (!_.isEmpty(data.url) || _.isEmpty(data.message) || !_.isEmpty(_.find(spamwords,(spamWord) => data.message.toLowerCase().includes(spamWord.toLowerCase()) ))) ;
}

async function sendEmail(data) {
  const spamWarning = (isPotentialSpam(data)) ? "POTENTIAL SPAM " : "";
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
        Data: `${spamWarning}Website Enquiry from ${data.name}`,
        Charset: 'UTF-8'
      }
    },
    Source: process.env.SENDER,
    ReplyToAddresses: [ data.email || 'info@majestic-motors.co.uk' ]
  };
  return ses.sendEmail(params).promise();
}

async function addEnquiry(data) {
  if (isPotentialSpam(data)) {
    console.log("Potential spam detected - skipping adding enquiry to Monday.com");
  } else {
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
}