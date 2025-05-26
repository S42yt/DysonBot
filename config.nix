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
        boost = true;
      };
      env = { 
        boostChannel = "$BOOST_CHANNEL";
      };
    },
    {
      name = "admin";
      enabled = true;
      commands = {
        reload = true;
        say = true;
        setup = true;
        join = true;
        leave = true;
      };
      events = { 
        memberCounter = true;
      };
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
    },
    {
      name = "welcome";
      enabled = true;
      commands = { };
      events = {
        welcome = true;
        joinrole = true;
      };
      env = {
        welcomeChannel = "$WELCOME_CHANNEL";
        joinRole = "$JOIN_ROLE";
      };
    },
    {
      name = "logging";
      enabled = true;
      events = {
        # message logging
        messageDelete = true;
        messageEdit = true;
        messageCreate = false;
        # audit logging
        memberLeave = true;
        memberJoin = false;
        memberUpdate = false;
        # moderation logging
        memberBan = true;
        memberUnban = true;
        memberTimeout = true;
        memberUntimeout = true;
        # role logging
        roleCreate = true;
        roleDelete = true;
        roleUpdate = true;
        # channel logging
        channelCreate = false;
        channelDelete = false;
        channelUpdate = false;
        # voice logging
        voiceMemberMove = true;
        voiceMemberJoin = true;
        voiceMemberLeave = true;
      };
      env = {
        logChannel = "$LOG_CHANNEL";
      };
    }
  ];
}