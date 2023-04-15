const { REST, Routes } = require('discord.js');
const { token, clientId } = require('./settings/config.json');

const rest = new REST().setToken(token);

const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
});

readline.question('enter the id of the commands to delete separated by a space\n', (idsString) => {
    const ids = idsString.split(' ');
    (async () => {
        try {
            console.log('Started refreshing application (/) commands.');

            for (const id of ids) {
                await rest.delete(Routes.applicationCommand(clientId, id))
                    .then(() => console.log(`Successfully deleted application (/) command with id ${id}`))
                    .catch(console.error);
            }

            console.log('Successfully reloaded application (/) commands.');
        } catch (error) {
            console.error(error);
        }
    })();
});