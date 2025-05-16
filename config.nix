{
  token = "$BOT_TOKEN";
  clientId = "$CLIENT_ID";
  guildId = "$GUILD_ID";
  connectionString = "$MONGODB_URI";
  dbName = "$DB_NAME";

  debug = false;
  
  modules = [
    {
      name = "misc";
      enabled = true;

      commands = {
        ping = true;
        status = true;
      };
      events = {
        rpc = true;
      };
      env = {
      };
      options = {
      };
    },
    {
      name = "admin";
      enabled = true;
      commands = {
        reload = true;
      };
      events = { };
      env = { };
    },
        {
      name = "abmelden";
      enabled = true;
      commands = {
        abmelden = true;
        anmelden = true;
        abmeldungen = true;
      };
      events = { 
        abmelden = true;
      };
      env = {
        role = "$CLAN_ROLE";
       };
    }
   ];
}