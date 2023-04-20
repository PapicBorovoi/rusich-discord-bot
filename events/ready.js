const { Events } = require('discord.js');
const fs = require('fs-extra');

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        fs.emptyDirSync('../music');
        console.log(`Ready! Logged in as ${client.user.tag}`);
    },
};