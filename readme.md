# Serverless notifier template 

![](https://github.com/FlavioAandres/serverless-notification/blob/master/images/arch.jpeg)

## sending messages from backend 

Message to push to SNS 
```json
{
    "types":["MAIL_REQUEST", "WS_REQUEST"],
    "broadcast": true,
    "users":[{"userId": 123, "fields": "value"}],
    "room": "roomid_hashed",
    "websocketData": {
        "action":"PUBLICATION_REQUESTED",
        "value": "data"
    },
    "emailData":{
        "body": "<body></body>",
        "subject": "Email subject"
    }
}
```

Types: 
- MAIL_REQUEST: this will queue the message for being sent using SMTP, if MAIL_REQUEST is listed `emailData` is required and should contain the html body

- WS_REQUEST: using this label, you cand send the notification to the users involven in the notification if there are any connected in the service. if WS_REQUEST is listed, `websocketData` is required and this is the payload sent to clients. 

Flags
- `users`: should be an array with the user information, the `userId` will be required for delivering the message to user if it's connected 
- `room`: if no user is sent, the service will deriver the message for everyone connected in the room sent. `Note: the user should be registered before to this room`
- `broadcast`: this will delivery the message to all the users connected. 

## How to interact in the client
1. Connect client to WebSockets using the ApiGateway URL
2. send the register event 
    ```json
    {"action": "register", "data": {"userId": 123, roomId: "123" }}
    ```

 * `userId` is required to sent furter notifications
 * `roomId` will be useful to relate the user with a view or shared room  
 * **Note: `userId` & `roomId` are managed by you** 
3. once the client is registered you can sent notifications to SNS topic (building)

## TODO 
- Mail notifications is not current available. Only works for Websockets notification


## How to deploy 

```bash

$ npm i -g serverless aws-cli 
$ aws configure
$ serverless deploy --stage prod

```

## How to implement with Node.JS

```js
const AWS = require('aws-sdk')
AWS.config.update({
    region: AWS_REGION 
});

const SNSInstance = new AWS.SNS({
    apiVersion: '2010-03-31',
    accessKeyId: AWS_KEY,
    secretAccessKey: AWS_SECRET_KEY,
})

const message_notification = {
    users: [{userId: 123}],
    websocketData: {
        type: "NEW_COMMENT",
        comment: {
            id: 'x72n9c3j90xm',
            body: 'this is a new comment', 
        }
    }
}

    
const params = {
    Message: JSON.stringify(message_notification),
    TopicArn: AWS_ARN_TOPIC_ARN,
    MessageAttributes: {
        'types': {
            DataType: 'String', 
            StringValue: 'WS_REQUEST'
        },
    }
}
const result = await SNSInstance.publish(params).promise()
```