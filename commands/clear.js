const { SlashCommandBuilder } = require('discord.js');
const { queue } = require('./play');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Clears the queue.'),
    async execute(interaction) {
        queue.length = 0;
        await interaction.reply('Queue cleared.');
    },
};