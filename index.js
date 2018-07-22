const alexaSDK = require('alexa-sdk');
const awsSDK = require('aws-sdk');
const util = require('util');

const APP_ID='';
const MedicineTable = 'Medicine';
const docClient = new awsSDK.DynamoDB.DocumentClient(); 

const instructions = 'Welcome to Medicure Rx. I can help you to track Medicines and their Expiry Date. Following commands are available: Add medicine , Delete Medicine, Get expiry Date for the Medicine, List all medicine. What would you like me to do?';

const handlers = {
    //Triggered When user says "Alexa, open Medicure Rx"
    'LaunchRequest'()
    {
        this.emit(':ask',instructions);
    },

    'AddMedicineIntent'()
    {
        const { userId } = this.event.session.user;
        const { slots } = this.event.request.intent;

        //prompt for slot values and confirm each

        //Medicine Name
        if(!slots.MedicineName.value)
        {
            const slotToElicit = 'MedicineName';
            const speechOutput = 'What is the name of the medicine?';
            const repromptSpeech = 'Please tell the name of the medicine';
            return this.emit(':elicitSlot',slotToElicit,speechOutput,repromptSpeech);

        }
        else if(slots.MedicineName.confirmationStatus !== 'CONFIRMED')
        {
            if(slots.MedicineName.confirmationStatus !== 'DENIED')
            {
                //unconfirmed
                const slotToConfirm = 'MedicineName';
                const speechOutput = `The name of medicine is ${slots.MedicineName.value},right?`;
                const repromptSpeech = speechOutput;
                return this.emit(':confirmSlot',slotToConfirm,speechOutput,repromptSpeech);
            }

            //denied
            const slotToElicit = 'MedicineName';
            const speechOutput = 'What is the name of the medicine you want to add?';
            const repromptSpeech = 'Please tell the name of the medicine';
            return this.emit(':elicitSlot',slotToElicit,speechOutput,repromptSpeech);


        }

        //ExpiryDate
        
            if(!slots.ExpiryDate.value)
            {
                const slotToElicit = 'ExpiryDate';
                const speechOutput = 'What is the Expiry Date of the medicine?';
                const repromptSpeech = 'Please tell the Expiry Date of the medicine';
                return this.emit(':elicitSlot',slotToElicit,speechOutput,repromptSpeech);
    
            }
            else if(slots.ExpiryDate.confirmationStatus !== 'CONFIRMED')
            {
                if(slots.ExpiryDate.confirmationStatus !== 'DENIED')
                {
                    //unconfirmed
                    const slotToConfirm = 'ExpiryDate';
                    const speechOutput = `The Expiry Date of medicine is ${slots.ExpiryDate.value},right?`;
                    const repromptSpeech = speechOutput;
                    return this.emit(':confirmSlot',slotToConfirm,speechOutput,repromptSpeech);
                }
    
                //denied
                const slotToElicit = 'ExpiryDate';
                const speechOutput = 'What is the Expiry Date of the medicine you want to add?';
                const repromptSpeech = 'Please tell the Expiry Date of the medicine';
                return this.emit(':elicitSlot',slotToElicit,speechOutput,repromptSpeech);
    
    
            }

              //Add record to DynamoDB
                
              const name = slots.MedicineName.value;
              const Edate =  slots.ExpiryDate.value;

              const dynamoParams = {
                  TableName: MedicineTable,
                  Item: {
                      Name: name,
                      UserId: userId,
                      ExpDate: Edate
                  }
              };

              const checkIfMedicineExistsParams = {
                  TableName: MedicineTable,
                  Key: {
                      Name: name,
                      UserId: userId
                  }
              };

              console.log('Adding Medicine',dynamoParams);

              //check if medicine already exist
              docClient.get(checkIfMedicineExistsParams).promise()
              .then(data =>{

                console.log('get medicine succeeded',data);

                const medicine = data.Item;

                if(medicine)
                {
                    const errorMsg = `Medicine ${name} already exists!`;
                    this.emit(':tell',errorMsg); 
                    throw new Error(errorMsg);
                }
                else{
                    //Medicine does not exists
                    console.log("Put function called");
                   return docClient.put(dynamoParams).promise();
                    // return dbPut(dynamoParams);
                }
                   
              })
              .then(data =>{
                  console.log('Add medicine succeeded',data);
                  this.emit(':tell',`Medicine ${name} added!`);
              })
              .catch(err =>
            {
                console.error(err);
            });


        
    },
     //List all the Medicines
    'GetAllMedicineIntent'(){
        const { userId } = this.event.session.user;
        const { slots } = this.event.request.intent;
        
        let output;

        const dynamoParams={
            TableName: MedicineTable
        };
        
        dynamoParams.FilterExpression = 'UserId = :user_id';
        dynamoParams.ExpressionAttributeValues = {':user_id': userId};
        output = 'Following medicines were found: ';
       
        //send query to DynamoDB
       docClient.scan(dynamoParams).promise()
        .then(data=>{
            console.log('Read Table Succeeded!',data);

            if(data.Items && data.Items.length){
                data.Items.forEach(item => {output += `${item.Name}<break strength="x-strong"/>`;});
            }

            else {
                output = 'No medicines found!';
            }

            console.log('output',output);
            this.emit(':tell',output);
        })
        .catch(err =>{
            console.error(err);
        });
    
    
    },

    //Get expiry date of selected medicine
    'GetExpiryDateIntent'(){
        const { slots } = this.event.request.intent;

        if(!slots.MedicineName.value){
            const slotToElicit = 'MedicineName';
            const speechOutput = 'What is the name of the medicine?';
            const repromptSpeech = 'Please tell the name of the medicine.';
            return this.emit(':elicitSlot', slotToElicit, speechOutput, repromptSpeech);

        }

        const { userId } = this.event.session.user;
        const medName = slots.MedicineName.value;

        const dynamoParams = {
            TableName: MedicineTable,
            Key: {
                Name: medName,
                UserId: userId

            }
        };

        console.log('reading data');

        //send query to DynamoDB
        docClient.get(dynamoParams).promise()
        .then(data=>{
            console.log('get medicine succeeded',data);

            const medicine = data.Item;

            if(medicine){
                this.emit(':tell',`Expiry date of ${medName} is ${medicine.ExpDate}`);

            }
            else{
                this.emit(':tell', `Medicine ${MedName} not found!`);
            }

        })
        .catch(err => console.error(err));
    },

    //Delete Medicine

    'DeleteMedicineIntent'(){
        const { slots } = this.event.request.intent;

        //Ask for medicine Name and confirm

        if(!slots.MedicineName.value){
            const slotToElicit = 'MedicineName';
            const speechOutput = 'What is the name of medicine you want to delete?';
            const repromptSpeech = 'Please tell the name of medicine.';

            return this.emit(':elicitSlot',slotToElicit,speechOutput,repromptSpeech);

        }

        else if(slots.MedicineName.confirmationStatus!=='CONFIRMED'){
            if(slots.MedicineName.confirmationStatus !=='DENIED'){
                //unconfirmed
                const slotToConfirm = 'MedicineName';
                const speechOutput = `You want to delete the medicine ${slots.MedicineName.value},right?`;
                const repromptSpeech = speechOutput;
                return this.emit(':confirmSlot',slotToConfirm, speechOutput,repromptSpeech);

            }
            //denied
            const slotToElicit = 'MedicineName';
            const speechOutput = 'What is the name of medicine you want to delete?';
            const repromptSpeech = 'Please tell the name of medicine.';

            return this.emit(':elicitSlot',slotToElicit,speechOutput,repromptSpeech);


        }

        const { userId } = this.event.session.user;
        const medName = slots.MedicineName.value;
        const dynamoParams = {
            TableName: MedicineTable,
            Key: {
                Name: medName,
                UserId: userId
            }
        };
        console.log('Reading Data');
               
        //check if medicine exists
        docClient.get(dynamoParams).promise()
        .then(data=>{
             console.log('get medicine succeeded',data);

             const medicine = data.Item;

             if(medicine){
                 console.log('Deleting Medicine',data);
                 return docClient.delete(dynamoParams).promise();
             }
             const errorMsg = `Medicne ${medName} not found!`;
             this.emit(':tell',errorMsg);
             throw new Error(errorMsg);
        })
        .then(data=>{
            console.log('Medicine deleted',data);
            this.emit(':tell',`Medicine ${medName} deleted!`);
        })
        .catch(err=>console.log(err));

    },
    'Unhandled'(){
        console.error('problem',this.event);
        this.emit(':ask','An unhandled problem occurred!');
    },

    'AMAZON.HelpIntent'(){
        const speechOutput = instructions;
        const reprompt =instructions;
        this.emit(':ask',speechOutput,reprompt);
    },

    'Amazon.CancelIntent'(){
        this.emit(':tell','Goodbye!');
    },

    'Amazon.StopIntent'(){
        this.emit(':tell','Goodbye!');
    }
    
};

exports.handler = function handler(event, context){
    const alexa = alexaSDK.handler(event, context);
    alexa.appId = APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};