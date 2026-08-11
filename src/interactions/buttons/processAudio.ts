import { EmbedBuilder, ButtonBuilder, ButtonStyle, TextChannel } from 'discord.js';
import DiscordButton from '../../utils/classes/DiscordButton.js';
import oralConverter from '../../systems/OralConverter.js';

const processingEmbed = new EmbedBuilder()
  .setDescription("🎵 Traitement de l'audio en cours...")
  .setColor("#c0cdc0");
  
const successEmbed = new EmbedBuilder()
  .setDescription("🎵 L'audio a été traité avec succès!")
  .setColor("#00b16a");

const processAudioButton = new DiscordButton(new ButtonBuilder().setCustomId('process_audio').setLabel('Traiter l\'audio').setStyle(ButtonStyle.Success), true, async (interaction) => {
  const messageId = interaction.customId.split("-")[1];
  const channel = interaction.channel as TextChannel;
  const message = await channel.messages.fetch(messageId)

  await interaction.update({embeds: [processingEmbed], components : []});
  await oralConverter.processAudioMessage(message);
  await interaction.message.edit({embeds: [successEmbed]});
});

export default processAudioButton;
