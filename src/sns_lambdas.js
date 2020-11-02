"use strict";
const AWS = require("aws-sdk");
const DynamoDocument = new AWS.DynamoDB.DocumentClient();
const {
  API_GATEWAY_DOMAIN, 
} = process.env

module.exports.receiveWSNotification = async (event) => {
  const { Records } = event;
  const { users, room, websocketData } = JSON.parse(Records[0].Sns.Message);
  const params = {
    TableName: process.env.DYNAMO_TABLE_NAME,
    ExpressionAttributeValues: {},
  };
  if(!users && !room) return ; 
  if (Array.isArray(users) && users.length) {
    const userIds = users.map((user) => user.userId);
    const bindData = userIds.map((value, index) => {
      params.ExpressionAttributeValues[`:${index}`] = value
      return `:${index}`
    });
    params.FilterExpression = `userId IN (${bindData.toString()})`;
  }else if(room){
    params.FilterExpression = `roomId = :roomId`
    params.ExpressionAttributeValues[":roomId"] = room
  }
  //search connections
  const result = await DynamoDocument.scan(params).promise();

  if (!result || !result.Items.length) return;
  //Get ApiGateway Client
  const apigwManagementApi = new AWS.ApiGatewayManagementApi({
    endpoint: API_GATEWAY_DOMAIN
  });

  //Send
  const connections = result.Items.map((item) =>
    apigwManagementApi
      .postToConnection({
        ConnectionId: item.connectionId,
        Data: JSON.stringify(websocketData),
      })
      .promise()
      .catch((error) => {
        error.connectionId = item.connectionId;
        return error;
      })
  );
  try {
    const result = await Promise.all(connections);
    const failed = result
      .filter((item) => typeof item === Error)
      .map((error) => error.connectionId);
    //do something with filed
    console.log(failed);
  } catch (error) {
    console.log(error);
  }
  return {
    statusCode: 200,
  };
};
