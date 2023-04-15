const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Bans a user.')
        .addUserOption(option => option.setName('target').setDescription('Select user to ban').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .setDMPermission(false),
    async execute(interaction) {
        const user = interaction.options.getUser('target');
        await interaction.guild.members.ban(user);
        await interaction.reply(`Banned ${user.username}`);
    },
};