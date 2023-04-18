const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const { createAudioResource, createAudioPlayer, joinVoiceChannel, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');
const play = require('play-dl');

const queue = [];
const player = createAudioPlayer();
let connection;
let isBotConnected = false;
let firstPlay = true;
let firstInit = true;

const playSong = async (interaction, link) => {
    if (firstPlay) {
        const audio = await play.stream(link);
        const resource = createAudioResource(audio.stream, { inputType: audio.type });
        player.play(resource);
        connection.subscribe(player);
        await interaction.followUp(`Now playing:\n${(await play.video_info(link)).video_details.url}`);
        firstPlay = false;
    } else {
        queue.push(link);
        await interaction.followUp(`Added to queue:\n${(await play.video_info(link)).video_details.url}`);
    }
};

const makeButton = (search) => {
    const buttons = new ActionRowBuilder();
    for (let i = 0; i < search.length; i++) {
        const button = new ButtonBuilder()
            .setCustomId(search[i].id)
            .setLabel(String(i + 1))
            .setStyle(ButtonStyle.Primary);
        buttons.addComponents(button);
    }
    return buttons;
};

const makeEmbedFields = (search) => {
    const fields = [];
    for (let i = 0; i < search.length; i++) {
        fields.push({
            name: `${i + 1}. ${search[i].title}`,
            value: search[i].url,
        });
    }
    return fields;
};

const makeEmbedResponse = (search) => {
    const embed = new EmbedBuilder()
        .setTitle('Search results')
        .setAuthor({ name: 'Rusich bot' })
        .setFields(makeEmbedFields(search));
    return embed;
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Plays a song via YouTube link, id or search query.')
        .addStringOption(option =>
            option
                .setName('video')
                .setDescription('YouTube link, id or search query.')
                .setRequired(true))
        .setDMPermission(false),
    async execute(interaction) {
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            return await interaction.reply('You must be in a voice channel to use this command.');
        }

        if (!isBotConnected) {
            connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: interaction.guildId,
                adapterCreator: interaction.guild.voiceAdapterCreator,
            });
            if (firstInit) {
                connection.on(VoiceConnectionStatus.Disconnected, () => {
                    console.log('Disconnected from voice channel.');
                    queue.length = 0;
                    isBotConnected = false;
                    player.stop(true);
                });
                firstInit = false;
            }
            isBotConnected = true;
        }

        try {
            let link = interaction.options.getString('video');

            await interaction.reply('Searching...');

            if (play.yt_validate(link) !== 'video' && link.startsWith('http')) {
                return await interaction.editReply('Invalid YouTube video URL.');
            } else if (play.yt_validate(link) !== 'video' && !link.startsWith('http')) {
                const search = await play.search(link, { limit: 5 });
                if (search) {
                    const response = await interaction.editReply({ content: '', embeds: [makeEmbedResponse(search)], components: [makeButton(search)] });
                    const filter = i => i.user.id === interaction.user.id;
                    try {
                        const confirmation = await response.awaitMessageComponent({ filter, time: 120_000 });
                        link = confirmation.customId;
                    } catch {
                        return await interaction.deleteReply();
                    }
                    // link = search[0].url;
                } else {
                    return await interaction.editReply('No results found.');
                }
            } else {
                try {
                    await play.video_info(link);
                } catch (error) {
                    return await interaction.editReply('Invalid YouTube video ID.');
                }
            }

            await interaction.deleteReply();
            playSong(interaction, link);

        } catch (error) {
            console.error(error);
            await interaction.editReply('An error occurred while playing the song.');
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
            if (player.state === AudioPlayerStatus.Playing) return;
            if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
                connection.destroy();
            }
            isBotConnected = false;
        }, 300000);
    }
});
