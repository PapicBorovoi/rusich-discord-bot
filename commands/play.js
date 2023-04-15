const { SlashCommandBuilder } = require('discord.js');
const { createAudioResource, createAudioPlayer, joinVoiceChannel, AudioPlayerStatus, StreamType } = require('@discordjs/voice');
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
            }

            const stream = ytdl(link, { filter: 'audioonly' });

            const resource = createAudioResource(stream, {
                inputType: StreamType.Arbitrary,
            });

            const player = createAudioPlayer();
            connection.subscribe(player);
            player.play(resource);

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
