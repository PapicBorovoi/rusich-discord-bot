const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('troll')
        .setDescription('Pings a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to ping')
                .setRequired(true)),
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        await interaction.reply(`${user} has been trolled!`);
        const message = await interaction.fetchReply();
        console.log(message);
    },
};