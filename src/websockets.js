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
    !ParsedBody.data ||
    !ParsedBody.data.userId
  ) return ; 

  const {
    userId, 
    roomId = ''
  } = ParsedBody.data
  
  const params = {
    TableName: process.env.DYNAMO_TABLE_NAME,
    Key: {
      connectionId
    },
    UpdateExpression: "set userId = :userValue, roomId = :roomValue",
    ExpressionAttributeValues: {
      ":userValue": `${userId}`,
      ":roomValue": `${roomId}`,
    },
  }
  
  await DynamoDocument
        .update(params).promise()

  return {
    statusCode: 200
  }
};

const broadcast = async (event)=>{
  const {
    body,
    requestContext: {
      connectionId,
      domainName,
      stage,
    }
  } = event
  const ParsedBody = JSON.parse(body)

  const {
    data
  } = ParsedBody

  if(!data) return;

  const params = {
    TableName: process.env.DYNAMO_TABLE_NAME
  }; 
  
  //search all connections 
  const result = await DynamoDocument.scan(params).promise()
  if(!result.Items.length) return; 

  //Get ApiGateway Client
  const apigwManagementApi = new AWS.ApiGatewayManagementApi({    
    endpoint: domainName + '/' + stage  
  }); 

  //Send 
  const connections = result.Items.map(item=>
    apigwManagementApi.postToConnection({ ConnectionId: item.connectionId, Data: JSON.stringify(data) })
    .promise()
    .catch(error=> {
      error.connectionId = item.connectionId
      return error
    })
  ) 
  try {
    const result = await Promise.all(connections)
    const failed = result.filter(item=> typeof item === Error)
    .map(error=>error.connectionId) 
    //do something with filed
    console.log(failed) 
  } catch (error) {
    console.log(error)
  }
  return {
    statusCode: 200
  }
}

module.exports.connection = connection
module.exports.register = registerUser
module.exports.broadcast = broadcast