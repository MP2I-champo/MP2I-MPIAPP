import { Message, Attachment, ActionRowBuilder, ButtonBuilder, EmbedBuilder, AttachmentBuilder, TextChannel, ButtonStyle } from 'discord.js';
import { Mutex } from 'async-mutex';
import logger from '../utils/logger.js';
import params from '../../params.json' with { type: 'json' };
import { compileLatexToPdfBuffer } from '../utils/compileLaTeX.js';
import client from '../client.js';

const speachesUrl = 'http://mp2i-stt:8000/v1/audio/transcriptions';
const ollamaUrl = 'http://mp2i-ollama:11434/api/generate';

const ollamaSystemPrompt = `Tu es un professeur de mathématiques et d'informatique en prépa MP2I spécialisé dans la transcription de dictées vocales (Speech-to-Text) vers du code LaTeX parfait.

RÈGLES ABSOLUES DE SORTIE :
- Génère UNIQUEMENT du code LaTeX brut.
- AUCUN bloc Markdown (pas de balises \`\`\`latex), AUCUNE phrase d'introduction, AUCUN commentaire explicatif.
- Commence DIRECTEMENT par le premier caractère de ton code LaTeX.

FORMATAGE MATHÉMATIQUE (CRITIQUE) :
- MODE HORS-TEXTE : Les équations importantes ou longues DOIVENT être isolées et entourées de \\[ ... \\].
- MODE EN LIGNE : TOUTE variable (x, J, n), TOUT nombre, TOUT ensemble (R, C, N) et TOUTE petite expression mathématique citée dans le texte DOIT impérativement être entourée de $ ... $.
- STRUCTURE : Les énumérations dictées ("Premièrement", "Petit 1", "Question A") doivent systématiquement déclencher l'environnement \\begin{enumerate} \\item ... \\end{enumerate}.
- MISE EN PAGE : Rédige des phrases fluides. Saute des lignes uniquement pour aérer avant et après une équation hors-texte, ou pour séparer des questions distinctes.

RÉSOLUTION DES ERREURS DE DICTÉE (CONTEXTUELLE) :
Le texte d'entrée contient des homophones et des approximations phonétiques. Tu DOIS utiliser ton expertise mathématique pour déduire l'intention exacte en fonction du domaine (analyse, algèbre linéaire, probabilités, etc.).
- Identifie les confusions entre des mots du vocabulaire courant français et des notations mathématiques, opérateurs ou lettres grecques qui ont la même sonorité.
- Traduis les descriptions orales d'opérateurs en notations mathématiques rigoureuses (ex: descriptions de normes, produits scalaires, transposées, intégrales).
- Ne copie pas les absurdités textuelles générées par l'IA vocale ; corrige la phrase pour qu'elle ait un sens mathématique rigoureux de niveau classe préparatoire.

CONVENTIONS MP2I :
- "un entier naturel non nul" -> n \\in \\mathbb{N}^*
- "intervalle d'entiers 1 à n" -> \\llbracket 1, n \\rrbracket
- "somme de ... de la somme de ..." -> \\sum_{i=1}^{n} \\sum_{j=1}^{n} (AUCUNE parenthèse autour des sommes multiples).
- "k parmi n" -> \\binom{n}{k}

EXEMPLE DE FORMATAGE ATTENDU :
Dictée : soit f une fonction de R dans R définie par f de x égale x au carré moins 3 x plus 2 pour tout x dans R calculer f de x on note delta le discriminant
LaTeX : 
Soit $f$ une fonction de $\\mathbb{R}$ dans $\\mathbb{R}$ définie par $f(x) = x^2 - 3x + 2$.

Pour tout $x \\in \\mathbb{R}$, calculer $f(x)$. On note $\\Delta$ le discriminant de l'équation $f(x) = 0$.`;

export interface ProcessResult {
  attachment: Attachment;
  transcript: string;
  latex: string;
}

class OralConverter {
  private channelId: string = params.channels.oral_result;
  private guild: any = null;
  
  private readonly sttMutex = new Mutex();
  private readonly llmMutex = new Mutex();
  
  public async init() {
    logger.info('OralConverter: Initializing...');
    let channel = client.channels.cache.get(this.channelId) as TextChannel | null;
    if (!channel) {
      try {
        channel = (await client.channels.fetch(this.channelId)) as TextChannel | null;
      } catch (fetchErr) {
        logger.error(`OralConverter: Failed to fetch channel ${this.channelId}: ${String(fetchErr)}`);
        return;
      }
    }
	
	  channel = channel as TextChannel;
    this.guild = channel.guild;

    logger.info('OralConverter: Initialized.');
  }
  
  private extractAudioAttachment(message: Message) : Attachment {
    if (!message?.attachments || message.attachments.size === 0) {
      throw new Error('STT:No attachments found in the Discord message.');
    }

    const audioAttachment = message.attachments.find((att) => {
      const isAudioType = att.contentType?.startsWith('audio/');
      const isAudioExt = /\.(ogg|wav|mp3|m4a|flac)$/i.test(att.name);
      return Boolean(isAudioType || isAudioExt);
    });

    if (!audioAttachment) {
      throw new Error('STT: No valid audio attachment (.ogg, .wav, .mp3) found in message.');
    }

    return audioAttachment;
  }

  private async downloadAudioBuffer(url: string): Promise<Buffer> {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`STT: Failed to download audio from Discord CDN: HTTP ${res.status}`);
    }
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  private async transcribe(audioBuffer: Buffer, filename = 'voice.ogg'): Promise<string> {
    return await this.sttMutex.runExclusive(async () => {
      const formData = new FormData();
      const blob = new Blob([new Uint8Array(audioBuffer)], { type: 'audio/ogg' });

      formData.append('file', blob, filename);
      formData.append('model', 'deepdml/faster-whisper-large-v3-turbo-ct2');
      formData.append('language', 'fr');
      formData.append('temperature', '0.0');
      formData.append('vad_filter', 'true');

      const res = await fetch(speachesUrl, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`STT: failed [HTTP ${res.status}]: ${errText}`);
      }

      const data = (await res.json()) as { text: string };
      return data.text.trim();
    });
  }

  private async generateLatex(transcript: string): Promise<string> {
    return await this.llmMutex.runExclusive(async () => {
      const res = await fetch(ollamaUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: params.ml.ollama_model,
          system: ollamaSystemPrompt,
          prompt: `Voici la transcription vocale brute à convertir en LaTeX :

<transcription>
${transcript}
</transcription>

Applique les consignes de conversion LaTeX sur ce texte. N'oublie pas : AUCUN blabla, commence directement par le texte, et entoure absolument CHAQUE variable et lettre mathématique du texte avec des $.`,
          stream: false,
          options: {
            num_ctx: 2048,
            temperature: 0.1,
          },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`ollama: failed [HTTP ${res.status}]: ${errText}`);
      }

      const data = (await res.json()) as { response: string };
      const cleanLatex = data.response
        .trim()
        .replace(/^```(?:latex)?\n?/i, '')
        .replace(/\n?```$/i, '');
        
      return cleanLatex;
    });
  }

  public async processAudioMessage(message: Message): Promise<void> {
    logger.info(`Processing voice message from ${message.author.tag} (${message.id})`);
    
    try {
      const attachment = this.extractAudioAttachment(message);
      const audioBuffer = await this.downloadAudioBuffer(attachment.url);

      logger.info(`Transcribing audio attachment: ${attachment.name}`);
      const transcript = await this.transcribe(audioBuffer, attachment.name);

      logger.info(`Generating LaTeX for transcript: "${transcript}"`);
      const latex = await this.generateLatex(transcript);

      const latexBuffer = await compileLatexToPdfBuffer(latex);

      const pdfAttachment = new AttachmentBuilder(latexBuffer, {name: "oral.pdf"})

      const contentText = transcript 
        ? `**Transcription :** ${transcript}`
        : `Not Found`;

      const oralEmbed = new EmbedBuilder()
        .setAuthor({ name: `Oral de ${message.author.displayName}`, iconURL: message.author.displayAvatarURL()})
        .setDescription(contentText.slice(0, 6000))
        .setColor("#900D09");

      const channel = await this.guild.channels.fetch(this.channelId) as TextChannel;
      
      await channel.send({
        embeds: [oralEmbed],
        files: [pdfAttachment],
      });
      
      logger.info(`Successfully processed voice message (${message.id})`);
      } catch(error) {
        if(error instanceof Error) {
          logger.error(error.message);
        } else {
          console.error(error);
        }
      }
  }
  
  public async processTextMessage(message: Message): Promise<void> {
    logger.info(`Generating LaTeX for message (${message.id})`);
    try {
      const latex = await this.generateLatex(message.content);
      const latexBuffer = await compileLatexToPdfBuffer(latex);

      const pdfAttachment = new AttachmentBuilder(latexBuffer, {name: "oral.pdf"})

      const contentText = message.content 
        ? `**Texte Original :** ${message.content}`
        : `Not Found`;

      const oralEmbed = new EmbedBuilder()
        .setAuthor({ name: `Oral de ${message.author.username}`, iconURL: message.author.displayAvatarURL()})
        .setDescription(contentText.slice(0, 6000))
        .setColor("#900D09");

      const channel = await this.guild.channels.fetch(this.channelId) as TextChannel;
      
      await channel.send({
        embeds: [oralEmbed],
        files: [pdfAttachment],
      });
      
      logger.info(`Successfully processed text message (${message.id})`);
    } catch(error) {
      if(error instanceof Error) {
        logger.error(error.message);
      } else {
        console.error(error);
      }
    }
  }

  public async replyInChannel(message: Message): Promise<void> {
    if(message.content.length <= 10 && message.attachments.size === 0) {
      return;
    }
    
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder()
      .setCustomId(`process_text-${message.id}`)
      .setLabel('Traiter le texte')
      .setStyle(ButtonStyle.Success));
    
    if (message.attachments && message.attachments.size != 0) {
      row.addComponents(new ButtonBuilder()
        .setCustomId(`process_audio-${message.id}`)
        .setLabel('Traiter l\'audio')
        .setStyle(ButtonStyle.Success));
    }

    const actionEmbed = new EmbedBuilder()
      .setDescription("Comment voulez-vous traiter le message ?")
      .setColor(0x3498db);

    await message.reply({embeds : [actionEmbed], components: [row]});
  }
}

export default new OralConverter();
