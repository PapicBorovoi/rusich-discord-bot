const { SlashCommandBuilder } = require('discord.js');
const { createAudioResource, createAudioPlayer, joinVoiceChannel, AudioPlayerStatus } = require('@discordjs/voice');
const play = require('play-dl');

const queue = [];

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

            if (play.yt_validate(link) !== 'video') {
                return await interaction.reply('Invalid YouTube video URL.');
            } else {
                await interaction.reply(`Now playing:\n${link}`);
            }
            queue.push(link);

            const player = createAudioPlayer();

            if (queue.length === 1) {
                const audio = await play.stream(queue[0]);
                const resource = createAudioResource(audio.stream, { inputType: audio.type });
                player.play(resource);
                connection.subscribe(player);
            }

            await new Promise(resolve => {
                player.on(AudioPlayerStatus.Idle, () => {
                    queue.shift();
                    if (queue.length > 0) {
                        play.stream(queue[0]).then(stream => {
                            const resource = createAudioResource(stream.stream, { inputType: stream.type });
                            player.play(resource);
                        });
                    } else {
                        setTimeout(resolve, 300000);
                    }
                });
            });
        } catch (error) {
            console.error(error);
            await interaction.reply('An error occurred while playing the song.');
        } finally {
            connection.destroy();
        }
    },
};
