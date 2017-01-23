# discord-bot
Very basic discord bot using discord.io and mongoDB. Stores a key, value map where both the key and value are strings.  
Reads text between brackets (like [this]) and uses the contained text as a key. Outputs the resulting value if one is found.   
Registering is done with the command ^register [key] value.  
Requires two environmental variables, process.env.token and process.env.MONGODB_URI,   
where token is your discord app bot's token and MONGODB_URI is the URI to the mongo database storing the map.  
