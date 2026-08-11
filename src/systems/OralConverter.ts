import { Message, Attachment, ActionRowBuilder, ButtonBuilder, EmbedBuilder, AttachmentBuilder, TextChannel, ButtonStyle } from 'discord.js';
import { Mutex } from 'async-mutex';
import logger from '../utils/logger.js';
import params from '../../params.json' with { type: 'json' };
import { compileLatexToPdfBuffer } from '../utils/compileLaTeX.js';
import client from '../client.js';

const speachesUrl = 'http://mp2i-stt:8000/v1/audio/transcriptions';
const ollamaUrl = 'http://mp2i-ollama:11434/api/generate';

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
      const systemPrompt = `Tu es un transpileur de dictée vocale vers du code LaTeX pour la prépa MP2I.

CONSIGNES STRICTES :
- Génère UNIQUEMENT du code LaTeX brut.
- AUCUN bloc Markdown (pas de \`\`\`latex), AUCUNE intro, AUCUN commentaire.
- Commence DIRECTEMENT par le premier caractère LaTeX.
- Transcris fidèlement sans corriger les erreurs mathématiques.
- TRADUCTION LITTÉRALE : Ne généralise pas les nombres par des variables (pas de 5 -> N).
- MODE MATHÉMATIQUE : Toute formule mathématique isolée DOIT être entourée de \\[ ... \\]. 
- INTÉGRATION : Insère les formules mathématiques DIRECTEMENT à la suite du texte correspondant, ne les regroupe surtout pas à la fin du document.
- MISE EN PAGE : Traduis OBLIGATOIREMENT les mots "Premièrement", "Deuxièmement", "Troisièmement", etc. par l'environnement \\begin{enumerate} \\item ... \\end{enumerate}. Saute des lignes entre les questions.

CONVENTIONS MATHÉMATIQUES MP2I (TRADUCTION AUTOMATIQUE) :
- "un entier naturel" -> n \\in \\mathbb{N}
- "un entier naturel non nul" -> n \\in \\mathbb{N}^*
- "un entier supérieur ou égal à deux" -> n \\ge 2
- "réels/complexes" -> \\mathbb{R}, \\mathbb{C}
- "intervalle d'entiers 1 à n" -> \\llbracket 1, n \\rrbracket
- "somme de ... de la somme de ..." -> Ne mets JAMAIS de parenthèses autour des sommes multiples (ex: \\sum_{i=1}^{n} \\sum_{j=1}^{n}).
- "k parmi n" -> \\binom{n}{k}

EXEMPLES :

Dictée : calcul de sommes doubles premièrement soit n un entier naturel non nul calculer la somme pour i allant de 1 a n de la somme pour j allant de i a n de un sur j
LaTeX : \\textbf{Calcul de sommes doubles.}

\\begin{enumerate}
    \\item Soit $n \\in \\mathbb{N}^*$. Calculer :
    \\[ \\sum_{i=1}^{n} \\sum_{j=i}^{n} \\frac{1}{j} \\]
\\end{enumerate}

Dictée : c'est l'histoire de nathan nathan a 5 pommes il en donne une a corentin combien lui en reste t il
LaTeX : Nathan a 5 pommes. Il en donne 1 à Corentin. Combien lui en reste-t-il ?
`;
      const res = await fetch(ollamaUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: params.ollama_model,
          system: systemPrompt,
          prompt: transcript,
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
