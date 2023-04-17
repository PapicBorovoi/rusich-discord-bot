const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const play = require('play-dl');

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
        .setName('search')
        .setDescription('test search command')
        .addStringOption(option =>
            option
                .setName('video')
                .setDescription('query')
                .setRequired(true)),
    async execute(interaction) {
        const query = interaction.options.getString('video');
        const search = await play.search(query, { limit: 5 });
        const response = await interaction.reply({ content: '', embeds: [makeEmbedResponse(search)], components: [makeButton(search)] });
        const filter = i => i.user.id === interaction.user.id;
        try {
            const confirmation = await response.awaitMessageComponent({ filter, time: 120_000 });
            await interaction.send(confirmation.customId);
        } catch {
            await interaction.editReply({ content: 'You no longer can select song', components: [] });
        }
    },
};