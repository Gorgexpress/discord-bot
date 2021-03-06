const mongoose = require('mongoose')

const REGISTER_CMD = "^register" //string used to indicated a register command
const RESPOND_CMD = false //not used currently. String used to indicate a command to output a saved response
const OPENER = '[' //indicates start of text
const CLOSER = ']' //indicates close of text
const KEY_MAX_SIZE = 30;
const RESPONSE_MAX_SIZE = 150;
const CACHE_SIZE = 50; //size of cache. I'm sure it won't ever be an issue though.

let verbose = false //does nothing right now

mongoose.connect(process.env.MONGODB_URI)

var Discord = require('discord.io');

//Cache with recent commands in insertion order. 
//When size is exceeded, we delete the first element in insertion order
//This means the first element will be removed even if it has been being used much more often
//than the rest, but I'm not gonna worry about fixing that right now. 
const cache = new Map(); 

const schema = new mongoose.Schema({
	text: {
		type: String,
		unique: true
	},
	response: {
		type: String,
	}
});

const Model = mongoose.model('schema', schema);

var bot = new Discord.Client({
	autorun: true,
    token: process.env.token
});


bot.on('ready', function() {
  console.log("connected");
});


bot.on('message', function(user, userID, channelID, message, rawEvent) {
	
	if (!message || message.length === 0) return;
	
	if (message[0] === OPENER) {
		let closeIndex = message.indexOf(CLOSER)
		if (closeIndex <= 1 || closeIndex !== message.length - CLOSER.length) 
			return;
		let key = message.substr(OPENER.length, message.length - CLOSER.length - 1).toLowerCase();
		if (cache.has(key)) {
			say(bot, channelID, cache.get(key));
		}
		else {
			Model.findOne({'text': key }, function(err, data) {
				if (err || !data) return;
				say(bot, channelID, data.response);
				if (cache.size > CACHE_SIZE) 
					cache.delete(cache.keys().next().value)
				cache.set(key, data.response);
			});
		}	
	}
	else if (message.length > REGISTER_CMD.length && message.indexOf(REGISTER_CMD) === 0) {
		let index = REGISTER_CMD.length;
		if (message[index] !== " ")
			return;
		index += 1;
		if (message[index] !== OPENER)
			return
		let closeIndex = message.indexOf(CLOSER, index);
		if(closeIndex <= index)
			return;
		let key = message.substring(index + 1, closeIndex).toLowerCase();
		if (key.length > KEY_MAX_SIZE)
			return say(bot, channelID, "Max size of a key is " + KEY_MAX_SIZE + " characters");
		if(cache.has(key))
			return say(bot, channelID, "Key already registered");
		index = closeIndex + 1;
		if (message[index] !== " " || index === message.length - 1)
			return;
		let response = message.substring(index + 1);
		if (response.indexOf("<@") !== -1)
			return say(bot, channelID, "You cannot register responses that ping other uses.");
		if (response.length > RESPONSE_MAX_SIZE)
			return say(bot, channelID, "Max size of a response is " + RESPONSE_MAX_SIZE + " characters");
		let newResponse = new Model({'text': key, 'response': response});
		newResponse.save( function(err) {
			if(err)
				return;
			say(bot, channelID, key + " successfully added!");
			if (cache.size > CACHE_SIZE) 
				cache.delete(cache.keys().next().value)
			cache.set(key, response);
		});
	}
});

bot.on('disconnect', function(erMsg, code) {
  console.log(erMsg);
  let handle = setInterval( function() {
    if (bot.connected)
      clearInterval(handle);
    else
      bot.connect();
  }, 15000);
});

function say(bot, channel, message) {
	bot.sendMessage({
		to: channel,
		message: message
	});
}



