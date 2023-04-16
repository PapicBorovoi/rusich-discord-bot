const { SlashCommandBuilder } = require('discord.js');
const { createAudioResource, createAudioPlayer, joinVoiceChannel, AudioPlayerStatus } = require('@discordjs/voice');
const play = require('play-dl');

const queue = [];
const player = createAudioPlayer();
let connection = null;
let firstPlay = true;

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

        if (!connection) {
            connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: interaction.guildId,
                adapterCreator: interaction.guild.voiceAdapterCreator,
            });
        }

        try {
            const link = interaction.options.getString('link');

            if (play.yt_validate(link) !== 'video') {
                return await interaction.reply('Invalid YouTube video URL.');
            }

            if (firstPlay) {
                const audio = await play.stream(link);
                const resource = createAudioResource(audio.stream, { inputType: audio.type });
                player.play(resource);
                connection.subscribe(player);
                await interaction.reply(`Now playing:\n${link}`);
                firstPlay = false;
            } else {
                queue.push(link);
                await interaction.reply(`Added to queue:\n${link}`);
            }
        } catch (error) {
            console.error(error);
            await interaction.reply('An error occurred while playing the song.');
        }
    },
queue, player };

player.on(AudioPlayerStatus.Idle, () => {
    if (queue.length > 0) {
        play.stream(queue.shift()).then(stream => {
            const resource = createAudioResource(stream.stream, { inputType: stream.type });
            player.play(resource);
        });
    } else {
        firstPlay = true;
        setTimeout(() => {
            connection.destroy();
            connection = null;
        }, 300000);
    }
});
