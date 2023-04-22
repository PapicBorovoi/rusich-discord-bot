const { SlashCommandBuilder } = require('discord.js');
const { AudioPlayerStatus } = require('@discordjs/voice');
const { vcInfo } = require('./play.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skips the current song.'),
    async execute(interaction) {
        try {
            const { queue, player } = vcInfo[interaction.guildId];

            if (queue.length === 0 && player.state.status === AudioPlayerStatus.Idle) {
                return await interaction.reply('There is nothing to skip.');
            } else {
                player.stop();
                return await interaction.reply('Skipped the current song.');
            }
        } catch (err) {
            return await interaction.reply('There is nothing to skip.');
        }
    },
};