const { SlashCommandBuilder } = require('discord.js');
const { createAudioResource, createAudioPlayer, joinVoiceChannel, AudioPlayerStatus } = require('@discordjs/voice');
const ytdl = require('ytdl-core');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Plays a song via YouTube link.')
        .addStringOption(option =>
            option
                .setName('link')
                .setDescription('YouTube link')
                .setRequired(true)),
    async execute(interaction) {
        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) {
            return await interaction.reply('You must be in a voice channel to use this command.');
        }

        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: interaction.guildId,
            adapterCreator: interaction.guild.voiceAdapterCreator,
        });

        try {
            const link = interaction.options.getString('link');

            if (!ytdl.validateURL(link)) {
                return await interaction.reply('Invalid YouTube video URL.');
            } else {
                await interaction.reply(`Playing ${link}`);
            }

            const stream = ytdl(link, { filter: 'audioonly' });
            const player = createAudioPlayer();
            const resource = createAudioResource(stream);
            player.play(resource);
            connection.subscribe(player);

            await new Promise(resolve => {
                player.on(AudioPlayerStatus.Idle, resolve);
            });
        } catch (error) {
            console.error(error);
            await interaction.reply('An error occurred while playing the song.');
        } finally {
            connection.destroy();
        }
    },
};
