import { Readable }        from 'stream';
import { toFile }          from 'openai';
import { openai, AI_MODELS, TOKEN_LIMITS, SUPPORTED_LANGUAGES }
                           from '@config/openai';
import { AISummaryModel }  from '@models/AISummary.model';
import { AIChatModel, ChatRole }
                           from '@models/AIChat.model';
import { RecordingModel, AIStatus, RecordingStatus }
                           from '@models/Recording.model';
import { cloudinary }      from '@config/cloudinary';
import { ApiError }        from '@utils/ApiError';
import { logger }          from '@utils/logger';
import {
  notifyTranscriptionComplete,
  notifyAIProcessComplete,
} from './notification.service';
import type {
  TranscribeInput,
  SummarizeInput,
  TranslateInput,
  KeywordsInput,
  ActionItemsInput,
  GenerateTitleInput,
  ProcessAllInput,
  ChatInput,
  UpdateNotesInput,
} from '@validators/ai.validator';
import type { IAISummary } from '@models/AISummary.model';
import type { IAIChat }    from '@models/AIChat.model';

// ─── Cost Estimation ──────────────────────────────────────────────
// Approximate cost per 1K tokens (USD) — update as pricing changes
const COST_PER_1K = {
  [AI_MODELS.WHISPER]:     0.006,  // per minute, not tokens
  [AI_MODELS.GPT_4O]:      0.005,  // output tokens
  [AI_MODELS.GPT_4O_MINI]: 0.0006,
};

const estimateCost = (model: string, tokens: number): number => {
  const rate = COST_PER_1K[model] ?? 0.005;
  return parseFloat(((tokens / 1000) * rate).toFixed(6));
};

// ─── Get or Create AISummary Doc ─────────────────────────────────
const getOrCreateAISummary = async (
  recordingId: string,
  userId:      string,
): Promise<IAISummary> => {
  let aiSummary = await AISummaryModel.findOne({ recordingId });

  if (!aiSummary) {
    aiSummary = await AISummaryModel.create({ recordingId, userId });
  }

  return aiSummary;
};

// ─── Stream Audio from Cloudinary to OpenAI ─────────────────────
const getAudioStream = async (secureUrl: string): Promise<Readable> => {
  const response = await fetch(secureUrl);
  if (!response.ok || !response.body) {
    throw new Error(`Failed to download audio: ${response.statusText}`);
  }
  // Convert Web Stream to Node.js Readable stream
  return Readable.fromWeb(response.body as any);
};

// ─── TRANSCRIPTION ────────────────────────────────────────────────
export const transcribeRecording = async (
  userId: string,
  data:   TranscribeInput,
  onProgress?: (event: string, payload: unknown) => void,
): Promise<IAISummary> => {
  const { recordingId, language, prompt } = data;

  const recording = await RecordingModel.findOne({ _id: recordingId, userId });
  if (!recording) throw ApiError.notFound('Recording not found.');

  if (recording.status !== RecordingStatus.READY) {
    throw ApiError.badRequest('Recording is not ready for processing.');
  }

  if (!recording.cloud.secureUrl) {
    throw ApiError.badRequest('Recording audio file is not available.');
  }

  const aiSummary = await getOrCreateAISummary(recordingId, userId);

  if (aiSummary.transcription.status === AIStatus.COMPLETED) {
    throw ApiError.badRequest('Transcription already completed.');
  }

  aiSummary.transcription.status = AIStatus.PROCESSING;
  await aiSummary.save();

  await RecordingModel.findByIdAndUpdate(recordingId, {
    'ai.transcriptionStatus': AIStatus.PROCESSING,
    status: RecordingStatus.PROCESSING,
  });

  onProgress?.('transcription:started', { recordingId });

  try {
    onProgress?.('transcription:streaming', { recordingId });
    logger.info(`Streaming audio for transcription: ${recordingId}`);

    // Optimized: Stream directly instead of full Buffer download
    const audioStream = await getAudioStream(recording.cloud.secureUrl);

    const audioFile = await toFile(
      audioStream,
      `recording.${recording.format}`,
      { type: `audio/${recording.format}` },
    );

    onProgress?.('transcription:processing', { recordingId });
    logger.info(`Sending to Whisper API: ${recordingId}`);

    const whisperResponse = await openai.audio.transcriptions.create({
      file:             audioFile,
      model:            AI_MODELS.WHISPER,
      language:         language,
      prompt:           prompt,
      response_format:  'verbose_json',
      timestamp_granularities: ['segment', 'word'],
    });

    // 7. Segments build karo
    const segments = (whisperResponse.segments ?? []).map((seg, idx) => ({
      id:         idx,
      start:      seg.start,
      end:        seg.end,
      text:       seg.text.trim(),
      confidence: (seg as { avg_logprob?: number }).avg_logprob
        ? Math.exp((seg as { avg_logprob: number }).avg_logprob)
        : 0.95,
    }));

    const fullText   = whisperResponse.text.trim();
    const wordCount  = fullText.split(/\s+/).filter(Boolean).length;
    const detectedLang = whisperResponse.language ?? language ?? 'en';
    const langName   = SUPPORTED_LANGUAGES[detectedLang] ?? detectedLang;

    // 8. AISummary update karo
    aiSummary.transcription = {
      status:       AIStatus.COMPLETED,
      fullText,
      segments,
      language:     detectedLang,
      languageName: langName,
      confidence:   segments.length > 0
        ? segments.reduce((acc, s) => acc + s.confidence, 0) / segments.length
        : 0.95,
      duration:      recording.cloud.duration,
      wordCount,
      model:         AI_MODELS.WHISPER,
      processedAt:   new Date(),
      tokensUsed:    0, // Whisper is per-minute based
      error:         undefined,
    };

    // Whisper cost estimate (per minute)
    const durationMinutes = recording.cloud.duration / 60;
    const whisperCost     = parseFloat((durationMinutes * 0.006).toFixed(6));
    aiSummary.totalCost  += whisperCost;

    await aiSummary.save();

    // Recording update karo
    await RecordingModel.findByIdAndUpdate(recordingId, {
      'ai.transcriptionStatus': AIStatus.COMPLETED,
      'ai.transcriptionId':     aiSummary._id,
      'ai.language':            detectedLang,
      'ai.confidence':          aiSummary.transcription.confidence,
      'ai.processedAt':         new Date(),
      status:                   RecordingStatus.READY,
    });

    onProgress?.('transcription:completed', {
      recordingId,
      wordCount,
      language: detectedLang,
    });

    logger.info(`Transcription completed: ${recordingId} — ${wordCount} words`);

    // Notify User
    void notifyTranscriptionComplete(userId, recordingId, recording.title);

    return aiSummary;

  } catch (error) {
    // Mark failed
    aiSummary.transcription.status = AIStatus.FAILED;
    aiSummary.transcription.error  =
      error instanceof Error ? error.message : 'Unknown error';
    await aiSummary.save();

    await RecordingModel.findByIdAndUpdate(recordingId, {
      'ai.transcriptionStatus': AIStatus.FAILED,
      status:                   RecordingStatus.READY,
    });

    onProgress?.('transcription:failed', { recordingId, error: String(error) });
    logger.error(`Transcription failed for ${recordingId}:`, error);
    throw ApiError.internal('Transcription failed. Please try again.');
  }
};

// ─── SUMMARY ──────────────────────────────────────────────────────
export const generateSummary = async (
  userId: string,
  data:   SummarizeInput,
): Promise<IAISummary> => {
  const { recordingId, length, customPrompt } = data;

  const aiSummary = await AISummaryModel.findOne({ recordingId });
  if (!aiSummary) throw ApiError.badRequest('Transcription not found. Please transcribe first.');

  if (aiSummary.transcription.status !== AIStatus.COMPLETED) {
    throw ApiError.badRequest('Recording must be transcribed before generating a summary.');
  }

  const transcript = aiSummary.transcription.fullText;
  if (!transcript.trim()) {
    throw ApiError.badRequest('Transcript is empty. Cannot generate summary.');
  }

  aiSummary.summary.status = AIStatus.PROCESSING;
  await aiSummary.save();

  const lengthInstructions = {
    short:  'Write a concise 2-3 sentence summary covering only the most critical points.',
    medium: 'Write a clear summary in 4-6 sentences covering all main points and key decisions.',
    long:   'Write a comprehensive summary with multiple paragraphs covering all topics, decisions, and important details discussed.',
  };

  const systemPrompt = `You are an expert at summarizing audio transcriptions. 
Provide clear, accurate, and well-structured summaries.
Always maintain the key information and context from the original transcript.
Write in the same language as the transcript unless instructed otherwise.`;

  const userPrompt = customPrompt
    ? `${customPrompt}\n\nTranscript:\n${transcript}`
    : `${lengthInstructions[length]}\n\nTranscript:\n${transcript}`;

  try {
    const response = await openai.chat.completions.create({
      model:       AI_MODELS.GPT_4O,
      max_tokens:  TOKEN_LIMITS.SUMMARY,
      temperature: 0.3, // Lower temp = more focused
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt },
      ],
    });

    const summaryText = response.choices[0]?.message.content?.trim() ?? '';
    const tokensUsed  = response.usage?.total_tokens ?? 0;
    const cost        = estimateCost(AI_MODELS.GPT_4O, tokensUsed);

    aiSummary.summary = {
      status:      AIStatus.COMPLETED,
      text:        summaryText,
      length,
      model:       AI_MODELS.GPT_4O,
      processedAt: new Date(),
      tokensUsed,
      error:       undefined,
    };
    aiSummary.totalTokensUsed += tokensUsed;
    aiSummary.totalCost       += cost;

    await aiSummary.save();

    await RecordingModel.findByIdAndUpdate(recordingId, {
      'ai.summaryStatus': AIStatus.COMPLETED,
      'ai.summaryId':     aiSummary._id,
    });

    logger.info(`Summary generated: ${recordingId}`);
    return aiSummary;

  } catch (error) {
    aiSummary.summary.status = AIStatus.FAILED;
    aiSummary.summary.error  = error instanceof Error ? error.message : 'Unknown error';
    await aiSummary.save();
    throw ApiError.internal('Summary generation failed. Please try again.');
  }
};

// ─── KEYWORDS ─────────────────────────────────────────────────────
export const extractKeywords = async (
  userId: string,
  data:   KeywordsInput,
): Promise<IAISummary> => {
  const { recordingId, maxKeywords } = data;

  const aiSummary = await AISummaryModel.findOne({ recordingId });
  if (!aiSummary?.transcription.fullText) {
    throw ApiError.badRequest('Transcription required before extracting keywords.');
  }

  aiSummary.keywords.status = AIStatus.PROCESSING;
  await aiSummary.save();

  const systemPrompt = `You are an expert at analyzing text and extracting the most important keywords and topics.
You MUST respond ONLY with valid JSON, no markdown, no explanation.`;

  const userPrompt = `Extract the ${maxKeywords} most important keywords/topics from this transcript.
For each keyword, provide a relevance score (0-1) and how many times it appears.

Transcript:
${aiSummary.transcription.fullText}

Respond with this exact JSON structure:
{
  "keywords": [
    {"word": "keyword", "relevance": 0.95, "count": 3}
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model:       AI_MODELS.GPT_4O_MINI, // Cheaper for structured extraction
      max_tokens:  TOKEN_LIMITS.KEYWORDS,
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt },
      ],
    });

    const rawContent = response.choices[0]?.message.content ?? '{}';
    const parsed     = JSON.parse(rawContent) as {
      keywords?: Array<{ word: string; relevance: number; count: number }>;
    };
    const keywords   = parsed.keywords ?? [];
    const tokensUsed = response.usage?.total_tokens ?? 0;

    aiSummary.keywords = {
      status:      AIStatus.COMPLETED,
      items:       keywords,
      model:       AI_MODELS.GPT_4O_MINI,
      processedAt: new Date(),
      tokensUsed,
      error:       undefined,
    };
    aiSummary.totalTokensUsed += tokensUsed;
    aiSummary.totalCost       += estimateCost(AI_MODELS.GPT_4O_MINI, tokensUsed);

    await aiSummary.save();

    // Update recording tags with top keywords
    const topTags = keywords
      .slice(0, 5)
      .map((k) => k.word.toLowerCase());

    await RecordingModel.findByIdAndUpdate(recordingId, {
      $addToSet: { tags: { $each: topTags } },
    });

    logger.info(`Keywords extracted: ${recordingId} — ${keywords.length} keywords`);
    return aiSummary;

  } catch (error) {
    aiSummary.keywords.status = AIStatus.FAILED;
    aiSummary.keywords.error  = error instanceof Error ? error.message : 'Unknown error';
    await aiSummary.save();
    throw ApiError.internal('Keyword extraction failed. Please try again.');
  }
};

// ─── ACTION ITEMS ─────────────────────────────────────────────────
export const extractActionItems = async (
  userId: string,
  data:   ActionItemsInput,
): Promise<IAISummary> => {
  const { recordingId, customPrompt } = data;

  const aiSummary = await AISummaryModel.findOne({ recordingId });
  if (!aiSummary?.transcription.fullText) {
    throw ApiError.badRequest('Transcription required before extracting action items.');
  }

  aiSummary.actionItems.status = AIStatus.PROCESSING;
  await aiSummary.save();

  const systemPrompt = `You are an expert at identifying action items, tasks, and to-dos from meeting transcripts.
You MUST respond ONLY with valid JSON, no markdown, no explanation.`;

  const basePrompt = customPrompt ?? 'Extract all action items, tasks, and commitments mentioned in this transcript.';

  const userPrompt = `${basePrompt}
For each action item, identify the task, who is responsible (if mentioned), deadline (if mentioned), and priority.

Transcript:
${aiSummary.transcription.fullText}

Respond with this exact JSON structure:
{
  "actionItems": [
    {
      "task": "Clear description of the task",
      "assignee": "Person name or null",
      "deadline": "Date/time string or null",
      "priority": "low|medium|high"
    }
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model:           AI_MODELS.GPT_4O,
      max_tokens:      TOKEN_LIMITS.ACTION_ITEMS,
      temperature:     0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt },
      ],
    });

    const rawContent  = response.choices[0]?.message.content ?? '{}';
    const parsed      = JSON.parse(rawContent) as {
      actionItems?: Array<{
        task: string;
        assignee?: string;
        deadline?: string;
        priority?: 'low' | 'medium' | 'high';
      }>;
    };
    const actionItems = (parsed.actionItems ?? []).map((item) => ({
      task:      item.task,
      assignee:  item.assignee ?? undefined,
      deadline:  item.deadline ?? undefined,
      priority:  item.priority ?? 'medium' as const,
      completed: false,
    }));

    const tokensUsed = response.usage?.total_tokens ?? 0;

    aiSummary.actionItems = {
      status:      AIStatus.COMPLETED,
      items:       actionItems,
      model:       AI_MODELS.GPT_4O,
      processedAt: new Date(),
      tokensUsed,
      error:       undefined,
    };
    aiSummary.totalTokensUsed += tokensUsed;
    aiSummary.totalCost       += estimateCost(AI_MODELS.GPT_4O, tokensUsed);

    await aiSummary.save();

    logger.info(`Action items extracted: ${recordingId} — ${actionItems.length} items`);
    return aiSummary;

  } catch (error) {
    aiSummary.actionItems.status = AIStatus.FAILED;
    aiSummary.actionItems.error  = error instanceof Error ? error.message : 'Unknown error';
    await aiSummary.save();
    throw ApiError.internal('Action item extraction failed. Please try again.');
  }
};

// ─── AI TITLE GENERATION ──────────────────────────────────────────
export const generateAITitle = async (
  userId: string,
  data:   GenerateTitleInput,
): Promise<IAISummary> => {
  const { recordingId } = data;

  const aiSummary = await AISummaryModel.findOne({ recordingId });
  if (!aiSummary?.transcription.fullText) {
    throw ApiError.badRequest('Transcription required before generating title.');
  }

  aiSummary.aiTitle.status = AIStatus.PROCESSING;
  await aiSummary.save();

  // First 500 words enough for title generation
  const excerptWords = aiSummary.transcription.fullText.split(/\s+/).slice(0, 500);
  const excerpt      = excerptWords.join(' ');

  const systemPrompt = `You generate concise, descriptive titles for audio recordings based on their transcripts.
Titles should be clear, specific, and between 3-8 words.
Do NOT use quotes. Respond with ONLY the title text.`;

  const userPrompt = `Generate a descriptive title for this audio recording transcript:
${excerpt}`;

  try {
    const response = await openai.chat.completions.create({
      model:       AI_MODELS.GPT_4O_MINI,
      max_tokens:  TOKEN_LIMITS.TITLE,
      temperature: 0.7,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt },
      ],
    });

    const titleText  = response.choices[0]?.message.content?.trim() ?? '';
    const tokensUsed = response.usage?.total_tokens ?? 0;

    aiSummary.aiTitle = {
      status:      AIStatus.COMPLETED,
      text:        titleText,
      model:       AI_MODELS.GPT_4O_MINI,
      processedAt: new Date(),
      tokensUsed,
      error:       undefined,
    };
    aiSummary.totalTokensUsed += tokensUsed;
    aiSummary.totalCost       += estimateCost(AI_MODELS.GPT_4O_MINI, tokensUsed);

    await aiSummary.save();

    // Recording title update karo (optional — user approve kar sakta hai)
    logger.info(`AI title generated: ${recordingId} — "${titleText}"`);
    return aiSummary;

  } catch (error) {
    aiSummary.aiTitle.status = AIStatus.FAILED;
    aiSummary.aiTitle.error  = error instanceof Error ? error.message : 'Unknown error';
    await aiSummary.save();
    throw ApiError.internal('Title generation failed. Please try again.');
  }
};

// ─── TRANSLATION ──────────────────────────────────────────────────
export const translateRecording = async (
  userId: string,
  data:   TranslateInput,
): Promise<IAISummary> => {
  const { recordingId, targetLanguage, textToTranslate } = data;

  const aiSummary = await AISummaryModel.findOne({ recordingId });
  if (!aiSummary) throw ApiError.notFound('AI summary not found.');

  const sourceText = textToTranslate ?? aiSummary.transcription.fullText;
  if (!sourceText.trim()) {
    throw ApiError.badRequest('No text available for translation.');
  }

  // Duplicate translation check
  const existingTranslation = aiSummary.translations.find(
    (t) => t.targetLanguage === targetLanguage,
  );
  if (existingTranslation) {
    return aiSummary; // Already translated
  }

  const targetLangName = SUPPORTED_LANGUAGES[targetLanguage] ?? targetLanguage;
  const sourceLangName = SUPPORTED_LANGUAGES[aiSummary.transcription.language] ?? 'the source language';

  const systemPrompt = `You are a professional translator.
Translate the provided text accurately while preserving meaning, tone, and context.
Maintain technical terms and proper nouns as appropriate.
Respond with ONLY the translated text, no explanations.`;

  const userPrompt = `Translate the following text from ${sourceLangName} to ${targetLangName}:

${sourceText}`;

  try {
    // Chunk large texts
    const MAX_CHARS = 4000;
    let translatedText = '';

    if (sourceText.length <= MAX_CHARS) {
      const response = await openai.chat.completions.create({
        model:       AI_MODELS.GPT_4O,
        max_tokens:  TOKEN_LIMITS.TRANSLATION,
        temperature: 0.2,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt },
        ],
      });
      translatedText = response.choices[0]?.message.content?.trim() ?? '';
      const tokensUsed = response.usage?.total_tokens ?? 0;
      aiSummary.totalTokensUsed += tokensUsed;
      aiSummary.totalCost       += estimateCost(AI_MODELS.GPT_4O, tokensUsed);
    } else {
      // Chunk karo
      const chunks: string[] = [];
      for (let i = 0; i < sourceText.length; i += MAX_CHARS) {
        chunks.push(sourceText.slice(i, i + MAX_CHARS));
      }

      const translatedChunks = await Promise.all(
        chunks.map(async (chunk) => {
          const response = await openai.chat.completions.create({
            model:       AI_MODELS.GPT_4O,
            max_tokens:  TOKEN_LIMITS.TRANSLATION,
            temperature: 0.2,
            messages: [
              { role: 'system', content: systemPrompt },
              {
                role:    'user',
                content: `Translate from ${sourceLangName} to ${targetLangName}:\n${chunk}`,
              },
            ],
          });
          const tokensUsed = response.usage?.total_tokens ?? 0;
          aiSummary.totalTokensUsed += tokensUsed;
          aiSummary.totalCost       += estimateCost(AI_MODELS.GPT_4O, tokensUsed);
          return response.choices[0]?.message.content?.trim() ?? '';
        }),
      );
      translatedText = translatedChunks.join(' ');
    }

    // Translation add karo
    aiSummary.translations.push({
      targetLanguage,
      languageName:   targetLangName,
      translatedText,
      translatedAt:   new Date(),
      tokensUsed:     0, // Already counted above
    });

    await RecordingModel.findByIdAndUpdate(recordingId, {
      'ai.translationStatus': AIStatus.COMPLETED,
    });

    await aiSummary.save();

    logger.info(`Translation completed: ${recordingId} → ${targetLangName}`);
    return aiSummary;

  } catch (error) {
    await RecordingModel.findByIdAndUpdate(recordingId, {
      'ai.translationStatus': AIStatus.FAILED,
    });
    logger.error(`Translation failed for ${recordingId}:`, error);
    throw ApiError.internal('Translation failed. Please try again.');
  }
};

// ─── PROCESS ALL (Full Pipeline) ──────────────────────────────────
export const processAllAI = async (
  userId: string,
  data:   ProcessAllInput,
  onProgress?: (event: string, payload: unknown) => void,
): Promise<IAISummary> => {
  const {
    recordingId,
    language,
    summaryLength,
    generateTitle,
    generateKeywords,
    generateActionItems: shouldGenerateActions,
    autoTranslate,
  } = data;

  logger.info(`Starting full AI processing: ${recordingId}`);
  onProgress?.('process:started', { recordingId, steps: 'transcribe → summarize → analyze' });

  // Step 1: Transcribe
  const aiSummary = await transcribeRecording(userId, { recordingId, language }, onProgress);

  // Step 2: Summary (parallel with title + keywords)
  const parallelTasks: Promise<IAISummary>[] = [
    generateSummary(userId, { recordingId, length: summaryLength }),
  ];

  if (generateTitle) {
    parallelTasks.push(generateAITitle(userId, { recordingId }));
  }

  if (generateKeywords) {
    parallelTasks.push(extractKeywords(userId, { recordingId, maxKeywords: 10 }));
  }

  if (shouldGenerateActions) {
    parallelTasks.push(extractActionItems(userId, { recordingId }));
  }

  onProgress?.('process:analyzing', { recordingId });

  // Parallel mein run karo — sab ek saath
  const results = await Promise.allSettled(parallelTasks);
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      logger.warn(`Parallel AI task ${index} failed:`, result.reason);
    }
  });

  // Optional: Auto-translate
  if (autoTranslate) {
    try {
      await translateRecording(userId, {
        recordingId,
        targetLanguage: autoTranslate,
      });
    } catch (err) {
      logger.warn(`Auto-translation failed:`, err);
    }
  }

  // Final state fetch karo
  const finalSummary = await AISummaryModel.findOne({ recordingId });
  if (!finalSummary) throw ApiError.internal('AI processing state lost.');

  onProgress?.('process:completed', {
    recordingId,
    totalTokens: finalSummary.totalTokensUsed,
    totalCost:   finalSummary.totalCost,
  });

  logger.info(
    `Full AI processing completed: ${recordingId} — ${finalSummary.totalTokensUsed} tokens used`,
  );

  // Notify User
  void notifyAIProcessComplete(userId, recordingId, finalSummary.aiTitle.text || 'Your recording');

  return finalSummary;
};

// ─── AI CHAT ──────────────────────────────────────────────────────
export const chatWithRecording = async (
  userId: string,
  data:   ChatInput,
): Promise<{ chat: IAIChat; reply: string; tokensUsed: number }> => {
  const { recordingId, chatId, message } = data;

  // Recording verify karo
  const recording = await RecordingModel.findOne({ _id: recordingId, userId })
    .select('title duration');
  if (!recording) throw ApiError.notFound('Recording not found.');

  // AISummary fetch karo (context ke liye)
  const aiSummary = await AISummaryModel.findOne({ recordingId })
    .select('transcription.fullText summary.text keywords.items');

  if (!aiSummary?.transcription.fullText) {
    throw ApiError.badRequest(
      'Please transcribe this recording first before starting a chat.',
    );
  }

  // Chat doc get or create
  let chat: IAIChat;
  if (chatId) {
    const found = await AIChatModel.findOne({ _id: chatId, recordingId, userId });
    if (!found) throw ApiError.notFound('Chat session not found.');
    chat = found;
  } else {
    // New chat — system context set karo
    const systemContent = buildSystemContext(
      recording.title,
      aiSummary.transcription.fullText,
      aiSummary.summary?.text,
    );

    chat = await AIChatModel.create({
      recordingId,
      userId,
      title:    `Chat about: ${recording.title}`,
      model:    AI_MODELS.GPT_4O,
      messages: [
        {
          role:       ChatRole.SYSTEM,
          content:    systemContent,
          tokensUsed: 0,
          createdAt:  new Date(),
        },
      ],
    });
  }

  // User message add karo
  chat.messages.push({
    _id:        new (await import('mongoose')).Types.ObjectId(),
    role:       ChatRole.USER,
    content:    message,
    tokensUsed: 0,
    createdAt:  new Date(),
  });

  // ─── OpenAI Call ─────────────────────────────────────────────
  // Last 20 messages send karo (context window conserve karo)
  const contextMessages = chat.messages
    .slice(-20)
    .map((msg) => ({
      role:    msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    }));

  try {
    const response = await openai.chat.completions.create({
      model:       AI_MODELS.GPT_4O,
      max_tokens:  TOKEN_LIMITS.CHAT,
      temperature: 0.7,
      messages:    contextMessages,
    });

    const reply      = response.choices[0]?.message.content?.trim() ?? '';
    const tokensUsed = response.usage?.total_tokens ?? 0;
    const cost       = estimateCost(AI_MODELS.GPT_4O, tokensUsed);

    // Assistant message add karo
    chat.messages.push({
      _id:        new (await import('mongoose')).Types.ObjectId(),
      role:       ChatRole.ASSISTANT,
      content:    reply,
      tokensUsed,
      createdAt:  new Date(),
    });

    chat.totalTokens += tokensUsed;
    chat.totalCost   += cost;

    await chat.save();

    return { chat, reply, tokensUsed };

  } catch (error) {
    // User message ko remove karo agar failed
    chat.messages.pop();
    await chat.save();
    logger.error(`AI chat failed for recording ${recordingId}:`, error);
    throw ApiError.internal('Chat response failed. Please try again.');
  }
};

// ─── Update Notes ─────────────────────────────────────────────────
export const updateNotes = async (
  userId:      string,
  recordingId: string,
  data:        UpdateNotesInput,
): Promise<IAISummary> => {
  const aiSummary = await AISummaryModel.findOne({ recordingId });
  if (!aiSummary) throw ApiError.notFound('AI data not found for this recording.');

  aiSummary.notes.text     = data.text;
  aiSummary.notes.isEdited = true;
  aiSummary.notes.editedAt = new Date();

  await aiSummary.save();
  return aiSummary;
};

// ─── Get AI Summary ───────────────────────────────────────────────
export const getAISummary = async (
  userId:      string,
  recordingId: string,
): Promise<IAISummary> => {
  // Recording ownership verify karo
  const recording = await RecordingModel.findOne({ _id: recordingId, userId });
  if (!recording) throw ApiError.notFound('Recording not found.');

  const aiSummary = await AISummaryModel.findOne({ recordingId });
  if (!aiSummary) {
    // Create empty doc — pehli baar fetch
    return AISummaryModel.create({ recordingId, userId });
  }

  return aiSummary;
};

// ─── Get Chat History ─────────────────────────────────────────────
export const getChatHistory = async (
  userId:      string,
  recordingId: string,
): Promise<IAIChat[]> => {
  const recording = await RecordingModel.findOne({ _id: recordingId, userId });
  if (!recording) throw ApiError.notFound('Recording not found.');

  return AIChatModel.find({ recordingId, userId, isActive: true })
    .sort({ updatedAt: -1 })
    .select('-messages'); // Messages alag endpoint se fetch honge
};

// ─── Get Single Chat ──────────────────────────────────────────────
export const getChatById = async (
  userId: string,
  chatId: string,
): Promise<IAIChat> => {
  const chat = await AIChatModel.findOne({ _id: chatId, userId });
  if (!chat) throw ApiError.notFound('Chat not found.');
  return chat;
};

// ─── Delete Chat ──────────────────────────────────────────────────
export const deleteChat = async (
  userId: string,
  chatId: string,
): Promise<void> => {
  const chat = await AIChatModel.findOne({ _id: chatId, userId });
  if (!chat) throw ApiError.notFound('Chat not found.');

  chat.isActive = false;
  await chat.save();
};

// ─── Update Action Item Status ────────────────────────────────────
export const updateActionItem = async (
  userId:       string,
  recordingId:  string,
  actionItemId: string,
  updates:      Partial<{ completed: boolean; task: string; priority: string; assignee: string; deadline: string }>,
): Promise<IAISummary> => {
  const aiSummary = await AISummaryModel.findOne({ recordingId });
  if (!aiSummary) throw ApiError.notFound('AI data not found.');

  const item = aiSummary.actionItems.items.find(
    (i) => (i as { _id?: { toString(): string } })._id?.toString() === actionItemId,
  );
  if (!item) throw ApiError.notFound('Action item not found.');

  Object.assign(item, updates);
  await aiSummary.save();
  return aiSummary;
};

// ─── Private Helpers ──────────────────────────────────────────────
const buildSystemContext = (
  title:       string,
  transcript:  string,
  summary?:    string,
): string => {
  const MAX_TRANSCRIPT_CHARS = 6000;
  const transcriptExcerpt    = transcript.slice(0, MAX_TRANSCRIPT_CHARS);
  const isTruncated          = transcript.length > MAX_TRANSCRIPT_CHARS;

  return `You are an intelligent AI assistant helping users understand and analyze their audio recording.

Recording Title: "${title}"

${summary ? `Summary:\n${summary}\n\n` : ''}Full Transcript${isTruncated ? ' (excerpt)' : ''}:
${transcriptExcerpt}${isTruncated ? '\n[... transcript continues ...]' : ''}

Instructions:
- Answer questions based on the recording content above
- Be specific and cite parts of the transcript when relevant
- If something is not mentioned in the recording, clearly say so
- Be helpful, concise, and accurate`;
};