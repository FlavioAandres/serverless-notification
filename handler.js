'use strict';
const AWS = require('aws-sdk')
const DynamoDocument = new AWS.DynamoDB.DocumentClient()
const connection = async (event) => {
  const {
    requestContext: {
      connectionId,
      connectedAt
    }
  } = event
  const params = {
    TableName: process.env.DYNAMO_TABLE_NAME,
    Item: {
      connectionId,
      connectedAt
    }
  }
  await DynamoDocument.put(params).promise()
  return {
    statusCode: 200,
  };
};

const registerUser = async (event)=>{
  const {
    body,
    requestContext: {
      connectionId,
    }
  } = event

  const ParsedBody = JSON.parse(body)
  
  if(
    !ParsedBody.data && 
    !Object.keys(ParsedBody.data).length
  ) return ; 
  
  const params = {
    TableName: process.env.DYNAMO_TABLE_NAME,
    Key: {
      connectionId
    },
    UpdateExpression: "set userData = :userValue",
    ExpressionAttributeValues: {
      ":userValue": ParsedBody.data
    },
  }
  
  await DynamoDocument
        .update(params).promise()

  return {
    statusCode: 200
  }
};

module.exports.connection = connection
module.exports.register = registerUser