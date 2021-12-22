'use strict';

const monday = require('monday-sdk-js')();
monday.setToken(process.env.MONDAY_API_V2_TOKEN);
const moment = require("moment");

const jwt = require('jsonwebtoken');
const _ = require('lodash');

const {sendEmail} = require("../lib/email.js");

const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB();


module.exports.create = async event => {
    try {
        console.log(event);
        const {authorization} = event.headers;
        const decoded = jwt.verify(authorization,process.env.MAJESTIC_MONDAY_APP_SIGNING_SECRET);
        console.log(decoded);

        const body = JSON.parse(event.body);
        console.log(body);

        const { boardId, itemId} = body.payload.inboundFieldValues;

        const counterRestult = await incrementCount("estimates");

        console.log(counterRestult);


        return {
            'statusCode': 200
        };
    } catch (err) {
        console.error(err);
        await sendEmail("Error creating estimate",JSON.stringify(err),process.env.ON_ERR_EMAIL,process.env.ON_ERR_EMAIL);
        console.log("Sent error message by email");
        return {
            'statusCode': 500
        };
    }

};


async function incrementCount(counterId) {
    const params = {
            Key: {},
            AttributeUpdates: {},
            ReturnValues: 'UPDATED_NEW',
            TableName: "AtomicCounters"
        },
        keyAttribute = "id",
        countAttribute = "counter";

    params.Key[keyAttribute] = {S: counterId};
    params.AttributeUpdates[countAttribute] = {
        Action: 'ADD',
        Value: {
            N: '1'
        }
    };
    return dynamoDb.updateItem(params).promise()
}