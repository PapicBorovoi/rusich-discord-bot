const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const { createAudioResource, createAudioPlayer, joinVoiceChannel, AudioPlayerStatus, VoiceConnectionStatus } = require('@discordjs/voice');
const play = require('play-dl');
const { cookie } = require('../.data/cookie.js');

const vcInfo = {};

play.setToken({
    youtube : {
        cookie : cookie,
    },
});

const playSong = async (interaction, link, info) => {
    if (info.firstPlay) {
        const audio = await play.stream(link);
        const resource = createAudioResource(audio.stream, { inputType: audio.type });
        info.player.play(resource);
        info.connection.subscribe(info.player);
        await interaction.followUp(`Now playing:\n${(await play.video_info(link)).video_details.url}`);
        info.firstPlay = false;
    } else {
        info.queue.push(link);
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
        const guildId = interaction.guildId;
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            return await interaction.reply('You must be in a voice channel to use this command.');
        }

        if (!(guildId in vcInfo)) {
            vcInfo[guildId] = {
                player: createAudioPlayer(),
                connection: joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: interaction.guildId,
                    adapterCreator: interaction.guild.voiceAdapterCreator,
                }),
                firstPlay: true,
                firstInit: true,
                isBotConnected: false,
                queue: [],
            };
        }

        const info = vcInfo[guildId];

        if (!info.isBotConnected) {
            info.connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: interaction.guildId,
                adapterCreator: interaction.guild.voiceAdapterCreator,
            });
            if (info.firstInit) {
                info.connection.on(VoiceConnectionStatus.Disconnected, () => {
                    info.queue.length = 0;
                    info.isBotConnected = false;
                    info.player.stop(true);
                });
                info.player.on(AudioPlayerStatus.Idle, () => {
                    if (info.queue.length > 0) {
                        play.stream(info.queue.shift()).then(stream => {
                            const resource = createAudioResource(stream.stream, { inputType: stream.type });
                            info.player.play(resource);
                        });
                    } else {
                        info.firstPlay = true;
                        setTimeout(() => {
                            if (info.player.state.status !== AudioPlayerStatus.Idle) {
                                return;
                            }
                            if (info.connection.state.status !== VoiceConnectionStatus.Destroyed && info.connection.state.status !== VoiceConnectionStatus.Disconnected) {
                                info.connection.destroy();
                            }
                            info.isBotConnected = false;
                        }, 1_800_000);
                    }
                });
                info.firstInit = false;
            }
            info.isBotConnected = true;
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
            playSong(interaction, link, info);

        } catch (error) {
            console.error(error);
            await interaction.editReply('An error occurred while playing the song.');
        }
    },
vcInfo };

/*
const SCHEMA = {
    'guildId': {
        'player': 'player object',
        'connection': 'connection object',
        'firstPlay': 'bool',
        'firstInit': 'bool',
        'isBotConnected': 'bool',
        'queue': 'array of songs urls',
    },
};
*/