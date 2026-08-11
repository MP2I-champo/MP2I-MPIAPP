import { EmbedBuilder, ButtonBuilder, ButtonStyle, TextChannel } from 'discord.js';
import DiscordButton from '../../utils/classes/DiscordButton.js';
import oralConverter from '../../systems/OralConverter.js';

const processingEmbed = new EmbedBuilder()
  .setDescription("📖 Traitement du texte en cours...")
  .setColor("#c0cdc0");
  
const successEmbed = new EmbedBuilder()
  .setDescription("📖 Le texte a été traité avec succès!")
  .setColor("#00b16a");

const processTextButton = new DiscordButton(new ButtonBuilder().setCustomId('process_text').setLabel('Traiter le texte').setStyle(ButtonStyle.Success), true, async (interaction) => {
  const messageId = interaction.customId.split("-")[1];
  const channel = interaction.channel as TextChannel;
  const message = await channel.messages.fetch(messageId)
  
  await interaction.update({embeds: [processingEmbed], components : []});
  await oralConverter.processTextMessage(message);
  await interaction.message.edit({embeds: [successEmbed]});
});

export default processTextButton;
