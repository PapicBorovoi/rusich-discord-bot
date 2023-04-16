const { SlashCommandBuilder } = require('discord.js');
const { AudioPlayerStatus } = require('@discordjs/voice');
const { queue, player } = require('./play.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skips the current song.'),
    async execute(interaction) {
        if (queue.length === 0 && player.state.status === AudioPlayerStatus.Idle) {
            return await interaction.reply('There is nothing to skip.');
        } else {
            player.stop();
            return await interaction.reply('Skipped the current song.');
        }
    },
};