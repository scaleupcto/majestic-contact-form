'use strict';

const AWS = require('aws-sdk');
const ses = new AWS.SES();

module.exports.sendEmail = async function(subject,message,destination,sender,replyTo) {
    const params = {
        Destination: {
            ToAddresses: [
                destination
            ]
        },
        Message: {
            Body: {
                Text: {
                    Data: message,
                    Charset: 'UTF-8'
                }
            },
            Subject: {
                Data: subject,
                Charset: 'UTF-8'
            }
        },
        Source: sender,
        ReplyToAddresses: [ replyTo || sender ]
    };
    return ses.sendEmail(params).promise();
};

