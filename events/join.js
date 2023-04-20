const { Events } = require('discord.js');
let db;
(async () => {
    db = await require('../database/db.js');
})();

module.exports = {
    name: Events.GuildCreate,
    async execute(guild) {
        try {
            await db.query(
                `INSERT INTO Guilds VALUES('${guild.id}', '${guild.ownerId}')`,
                );
            await db.query(
                `INSERT INTO GuildConfigurable (guildId) VALUES('${guild.id}')`,
                );
        } catch (error) {
            console.log(error);
        }
    },
};