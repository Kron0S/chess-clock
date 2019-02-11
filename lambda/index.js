const Alexa = require('ask-sdk-core');

const COLORS = ['Blue', 'Red', 'Green', 'Yellow', 'Black', 'White', 'Pink', 'Orange'];
const COUNTS = {
	2: 'Two',
	3: 'Three',
	4: 'Four',
	5: 'Five',
	6: 'Six',
	7: 'Seven',
	8: 'Eight'
}

const LaunchRequestHandler = {
    canHandle(handlerInput) {
		const request = handlerInput.requestEnvelope.request;
		return request.type === 'LaunchRequest' ||
			(request.type === 'IntentRequest' && request.intent.name === 'NewGameIntent');
    },
    handle(handlerInput) {
        const speechText = 'What is the number of players?';
        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    }
};
const SetTheNumberOfPlayersIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'SetTheNumberOfPlayers';
    },
    handle(handlerInput) {
		const request = handlerInput.requestEnvelope.request;
		const countPlayersSlotValue = request.intent.slots.countPlayers.value;
		const attributesManager = handlerInput.attributesManager;
		const sessionAttributes = attributesManager.getSessionAttributes();
		sessionAttributes.countPlayersSlotValue = countPlayersSlotValue;

		// инициировать игру
		sessionAttributes.playersTimes = {};
		// перечислить список игроков в ответе
		let playersList = [];
		for (var i = 0; i < countPlayersSlotValue - 1; i++) {
			playersList.push(COLORS[i]);
			sessionAttributes.playersTimes[COLORS[i]] = 0;
		}
		sessionAttributes.playersTimes[COLORS[countPlayersSlotValue - 1]] = 0;

        const speechText = COUNTS[countPlayersSlotValue] + ' players: ' + playersList.join(', ') + ' and ' + COLORS[countPlayersSlotValue - 1];
        return handlerInput.responseBuilder
            .speak(speechText)
            .getResponse();
    }
};
const StartTheGameIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'StartTheGame';
    },
    handle(handlerInput) {
		// запомнить время начала игры
		let startTime = new Date(); 
		const attributesManager = handlerInput.attributesManager;
		const sessionAttributes = attributesManager.getSessionAttributes();
		sessionAttributes.startTime = startTime.getTime();
		sessionAttributes.currentPlayer = 0;

        const speechText = 'Start the game. The ' + COLORS[sessionAttributes.currentPlayer] + ' Player goes first';
        return handlerInput.responseBuilder
            .speak(speechText)
            .getResponse();
    }
};
const EndOfTurnIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'EndOfTurn';
    },
    handle(handlerInput) {
		let startTime = new Date(); 
		const attributesManager = handlerInput.attributesManager;
		const sessionAttributes = attributesManager.getSessionAttributes();
		// в milliseconds
		let diff = startTime - sessionAttributes.startTime;

		// сохранить сколько ходил текущий игрок
		sessionAttributes.playersTimes[COLORS[sessionAttributes.currentPlayer]] += diff;
		
		sessionAttributes.currentPlayer++;
		if (sessionAttributes.currentPlayer >= sessionAttributes.countPlayersSlotValue) {
			sessionAttributes.currentPlayer = 0;
		}

		// сказать кто ходит теперь
        const speechText = 'Now move player ' + COLORS[sessionAttributes.currentPlayer];

		// запомнить время перехода хода
		sessionAttributes.startTime = startTime.getTime();

        return handlerInput.responseBuilder
            .speak(speechText)
			.withShouldEndSession(false)
            .getResponse();
    }
};
const EndOfTheGameIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'EndOfTheGame';
    },
    handle(handlerInput) {
		let startTime = new Date(); 
		const attributesManager = handlerInput.attributesManager;
		const sessionAttributes = attributesManager.getSessionAttributes();
		
		// в milliseconds
		let diff = startTime - sessionAttributes.startTime;

		// сохранить сколько ходил текущий игрок
		sessionAttributes.playersTimes[COLORS[sessionAttributes.currentPlayer]] += diff;

		let response = [];
		for (var color in sessionAttributes.playersTimes) {
			response.push('Player ' + color + ' gamed ' + Math.round(sessionAttributes.playersTimes[color] / 1000) + ' seconds');
		}
		// перечислить сколько кто ходил
        const speechText = 'End of the game. ' + response.join(', ');
        return handlerInput.responseBuilder
            .speak(speechText)
            .getResponse();
    }
};
const HelpIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speechText = 'You need to name the number of players. To start say "Start the game". Next, these players make moves. The move ends with the phrase "End of Turn". The game ends with the phrase "The End of the Game"';

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    }
};
const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
                || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speechText = 'Okay, game to you later! ';
        return handlerInput.responseBuilder
            .speak(speechText)
            .getResponse();
    }
};
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse();
    }
};

// The intent reflector is used for interaction model testing and debugging.
// It will simply repeat the intent the user said. You can create custom handlers
// for your intents by defining them above, then also adding them to the request
// handler chain below.
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = handlerInput.requestEnvelope.request.intent.name;
        const speechText = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speechText)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

// Generic error handling to capture any syntax or routing errors. If you receive an error
// stating the request handler chain is not found, you have not implemented a handler for
// the intent being invoked or included it in the skill builder below.
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`~~~~ Error handled: ${error.message}`);
        const speechText = `Sorry, I couldn't understand what you said. Please try again`;

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    }
};

// This handler acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        SetTheNumberOfPlayersIntentHandler,
        StartTheGameIntentHandler,
        EndOfTurnIntentHandler,
        EndOfTheGameIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler) // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
    .addErrorHandlers(
        ErrorHandler)
    .lambda();
