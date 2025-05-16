{
  token = "$BOT_TOKEN"; 
  clientId = "$CLIENT_ID"; 
  guildId = "$GUILD_ID";
  
  debug = true;
  
  modules = [
    {
      name = "misc";
      enabled = true;

      commands = {
        ping = true;
        status = true;
      };
      events = {
      };
      env = {
      };
      options = {
      };
    }
    {
      name = "admin";
      enabled = true;
      commands = {
        reload = true;
      };
      events = { };
      env = { };
    }
   ];
}