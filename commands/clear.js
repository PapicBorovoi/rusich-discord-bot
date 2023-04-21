const { SlashCommandBuilder } = require('discord.js');
const { vcInfo } = require('./play');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Clears the queue.'),
    async execute(interaction) {
        const { queue } = vcInfo[interaction.guildId];

        if (queue.length === 0) {
            return await interaction.reply('Queue is already empty.');
        }
        queue.length = 0;
        await interaction.reply('Queue cleared.');
    },
};