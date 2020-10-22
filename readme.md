# Serverless notifier template 

![](https://github.com/FlavioAandres/serverless-notification/blob/master/images/arch.jpeg)

## sending messages from backend 

Message to push to SNS 
```json
{
    "types":["MAIL_REQUEST", "WS_REQUEST"],
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


## How to interact 
1. Connect client to ws 
2. send the register event 
    ```json
    {"action": "register", "data": {"userId": 123, roomId: "123" }}
    ```

 * `userId` is required to sent furter notifications
 * `roomId` will be useful to relate the user with a view or shared room  
 * **Note: `userId` & `roomId` are managed by you** 
3. once the client is registered you can sent notifications to SNS topic (building)
