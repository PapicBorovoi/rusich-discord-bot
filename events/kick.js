const { Events } = require('discord.js');
let db;
(async () => {
    db = await require('../database/db.js');
})();

module.exports = {
    name: Events.GuildDelete,
    async execute(guild) {
        try {
            await db.query(
                `DELETE FROM Guilds WHERE guildId = '${guild.id}'`,
                );
            await db.query(
                `DELETE FROM GuildConfigurable WHERE guildId = '${guild.id}'`,
                );
        } catch (error) {
            console.log(error);
        }
    },
};