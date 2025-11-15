
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { SUPPORTED_LANGUAGES, LANGUAGE_LIMIT } from './constants';
import { Language, Transcription } from './types';
import { createBlob } from './utils/audio';
import { identifyLanguage, translateText } from './services/geminiService';

// --- Sub-components defined inside App.tsx to keep file count low ---

const MicrophoneIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3ZM11 5a1 1 0 0 1 2 0v6a1 1 0 0 1-2 0V5Z"></path>
    <path d="M7 11a1 1 0 0 1 1-1 4 4 0 0 0 8 0 1 1 0 0 1 2 0 6 6 0 0 1-5 5.91V20a1 1 0 0 1-2 0v-3.09A6 6 0 0 1 7 11Z"></path>
  </svg>
);

const StopIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M7 7h10v10H7z"></path>
  </svg>
);

const LanguageSelector: React.FC<{
  selectedLanguages: Language[];
  onLanguageChange: (language: Language, index: number) => void;
  id: string;
}> = ({ selectedLanguages, onLanguageChange, id }) => (
  <div className="flex flex-col sm:flex-row gap-2">
    {selectedLanguages.map((lang, index) => (
      <select
        key={`${id}-${index}`}
        value={lang.code}
        onChange={(e) => {
          const newLang = SUPPORTED_LANGUAGES.find(l => l.code === e.target.value);
          if (newLang) onLanguageChange(newLang, index);
        }}
        className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
      >
        <option value="none" disabled>言語を選択 ({index + 1})</option>
        {SUPPORTED_LANGUAGES.map(l => (
          <option key={l.code} value={l.code}>{l.name}</option>
        ))}
      </select>
    ))}
  </div>
);

// --- Main App Component ---

export default function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [sourceLanguages, setSourceLanguages] = useState<Language[]>([SUPPORTED_LANGUAGES[0], ...Array(LANGUAGE_LIMIT - 1).fill({ code: 'none', name: 'N/A' })]);
  const [targetLanguage, setTargetLanguage] = useState<Language>({ code: 'none', name: '翻訳しない' });
  
  const [currentTranscription, setCurrentTranscription] = useState('');
  const [transcriptionHistory, setTranscriptionHistory] = useState<Transcription[]>([]);

  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const currentTranscriptionRef = useRef('');
  const isRecordingActiveRef = useRef(false);


  const handleSourceLanguageChange = (language: Language, index: number) => {
    const newLanguages = [...sourceLanguages];
    newLanguages[index] = language;
    setSourceLanguages(newLanguages);
  };

  const handleTargetLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = SUPPORTED_LANGUAGES.find(l => l.code === e.target.value) || { code: 'none', name: '翻訳しない' };
    setTargetLanguage(newLang);
  };
  
  const processAndStoreTranscription = useCallback(async (text: string) => {
      if (!text.trim()) return;
      setIsLoading(true);
      try {
          const identifiedLangName = await identifyLanguage(text);
          let newTranscription: Transcription = {
              originalText: text,
              sourceLang: identifiedLangName,
              timestamp: new Date().toISOString()
          };

          if (targetLanguage.code !== 'none' && targetLanguage.name !== identifiedLangName) {
              const translatedText = await translateText(text, identifiedLangName, targetLanguage.name);
              newTranscription = {
                  ...newTranscription,
                  translatedText,
                  targetLang: targetLanguage.name
              };
          }
          setTranscriptionHistory(prev => [newTranscription, ...prev]);
      } catch (e) {
          console.error("Error processing transcription:", e);
          setError("文字起こし結果の処理中にエラーが発生しました。");
      } finally {
          setIsLoading(false);
      }
  }, [targetLanguage]);

  const stopRecording = useCallback(() => {
    isRecordingActiveRef.current = false;

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (sessionPromiseRef.current) {
        sessionPromiseRef.current.then(session => session.close()).catch(() => {});
        sessionPromiseRef.current = null;
    }
    setIsRecording(false);
    setIsLoading(false);
    
    if(currentTranscriptionRef.current.trim()){
      processAndStoreTranscription(currentTranscriptionRef.current);
    }
    setCurrentTranscription('');
    currentTranscriptionRef.current = '';
  }, [processAndStoreTranscription]);


  const startRecording = useCallback(async () => {
    isRecordingActiveRef.current = true;
    setError(null);
    setIsRecording(true);
    setIsLoading(true);

    let stream: MediaStream | null = null;
    let context: AudioContext | null = null;

    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!isRecordingActiveRef.current) {
          stream.getTracks().forEach(track => track.stop());
          return;
      }
      mediaStreamRef.current = stream;
      
      context = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      if (!isRecordingActiveRef.current) {
          stream.getTracks().forEach(track => track.stop());
          context.close();
          return;
      }
      audioContextRef.current = context;
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      
      const activeSourceLanguages = sourceLanguages.filter(l => l.code !== 'none').map(l => l.name).join(', ');
      
      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            if (isRecordingActiveRef.current) setIsLoading(false)
          },
          onmessage: (message: LiveServerMessage) => {
            if (!isRecordingActiveRef.current) return;

            // Per Gemini API guidelines, audio output must be handled even if not used.
            // This prevents the connection from being dropped with a network error.
            if (message.serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
                // Audio data received, but this is a transcription app, so we don't play it.
                // Simply acknowledging it is enough to keep the stream alive.
            }

            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              currentTranscriptionRef.current += text;
              setCurrentTranscription(currentTranscriptionRef.current);
            }
            if(message.serverContent?.turnComplete) {
              processAndStoreTranscription(currentTranscriptionRef.current);
              currentTranscriptionRef.current = '';
              setCurrentTranscription('');
            }
          },
          onerror: (e: ErrorEvent) => {
            if (!isRecordingActiveRef.current) return;
            console.error("Live API Error:", e);
            setError('API接続中にエラーが発生しました。');
            stopRecording();
          },
          onclose: () => {
             if (isRecordingActiveRef.current) {
               stopRecording();
             }
          },
        },
        config: {
          inputAudioTranscription: {},
          responseModalities: [Modality.AUDIO],
          systemInstruction: `You are a real-time transcription service. Your primary function is to accurately transcribe the user's speech. The user might be speaking in one of the following languages: ${activeSourceLanguages}.`
        },
      });

      sessionPromiseRef.current.catch(err => {
        if (!isRecordingActiveRef.current) return;
        console.error("Failed to establish connection:", err);
        setError("APIへの接続に失敗しました。キーが有効か、ネットワーク接続を確認してください。");
        stopRecording();
      });

      const source = context.createMediaStreamSource(stream);
      const scriptProcessor = context.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = scriptProcessor;

      scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
        if (!isRecordingActiveRef.current) return;
        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
        const pcmBlob = createBlob(inputData);
        if (sessionPromiseRef.current) {
          sessionPromiseRef.current.then((session) => {
            if (isRecordingActiveRef.current) {
              session.sendRealtimeInput({ media: pcmBlob });
            }
          }).catch((err) => {
            if (isRecordingActiveRef.current) {
              console.error("Live API send error:", err);
              setError('音声データの送信中にエラーが発生しました。録音を停止します。');
              stopRecording();
            }
          });
        }
      };
      source.connect(scriptProcessor);
      scriptProcessor.connect(context.destination);

    } catch (err) {
       if (isRecordingActiveRef.current) {
          console.error(err);
          setError('マイクへのアクセスに失敗しました。アクセスを許可してください。');
          stream?.getTracks().forEach(track => track.stop());
          if (context?.state !== 'closed') context?.close();
          isRecordingActiveRef.current = false;
          setIsRecording(false);
          setIsLoading(false);
       }
    }
  }, [sourceLanguages, processAndStoreTranscription, stopRecording]);

  const stopRecordingRef = useRef(stopRecording);
  useEffect(() => {
    stopRecordingRef.current = stopRecording;
  }, [stopRecording]);

  useEffect(() => {
    return () => {
      stopRecordingRef.current();
    };
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col p-4 md:p-8">
      <header className="w-full max-w-4xl mx-auto mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
          リアルタイム文字起こし＆翻訳
        </h1>
        <p className="text-center text-gray-400 mt-2">
          Gemini APIを利用して、音声をリアルタイムでテキストに変換し、翻訳します。
        </p>
      </header>

      <main className="w-full max-w-4xl mx-auto flex-grow flex flex-col">
        <div className="bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-300">識別する言語 (最大{LANGUAGE_LIMIT}つ)</label>
              <LanguageSelector selectedLanguages={sourceLanguages} onLanguageChange={handleSourceLanguageChange} id="source" />
            </div>
            <div>
              <label htmlFor="target-lang" className="block mb-2 text-sm font-medium text-gray-300">翻訳先の言語</label>
              <select id="target-lang" value={targetLanguage.code} onChange={handleTargetLanguageChange} className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
                <option value="none">翻訳しない</option>
                {SUPPORTED_LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.name}</option>
                ))}
              </select>
            </div>
          </div>
          {error && <p className="text-red-400 text-sm mt-4 text-center">{error}</p>}
        </div>

        <div className="flex justify-center items-center my-4">
          <button
            onClick={toggleRecording}
            disabled={isLoading && !isRecording}
            className={`flex items-center justify-center w-20 h-20 rounded-full transition-all duration-300 ease-in-out shadow-lg focus:outline-none focus:ring-4 ${
              isRecording 
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-400' 
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-400'
            } ${isLoading && !isRecording ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading && !isRecording ? (
              <div className="w-8 h-8 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
            ) : isRecording ? (
              <StopIcon className="w-8 h-8 text-white" />
            ) : (
              <MicrophoneIcon className="w-8 h-8 text-white" />
            )}
          </button>
        </div>

        <div className="flex-grow bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 overflow-hidden flex flex-col">
          <h2 className="text-lg font-semibold text-gray-300 mb-4 border-b border-gray-700 pb-2">結果</h2>
          <div className="flex-grow overflow-y-auto space-y-4 pr-2">
            {currentTranscription && (
              <div className="bg-gray-700/50 p-4 rounded-lg animate-pulse">
                <p className="text-white">{currentTranscription}</p>
              </div>
            )}
            {transcriptionHistory.map((item) => (
              <div key={item.timestamp} className="bg-gray-700 p-4 rounded-lg shadow">
                <p className="text-gray-300 mb-2">
                  <span className="font-bold text-blue-400">{item.sourceLang}</span>として認識
                </p>
                <p className="text-white text-lg">{item.originalText}</p>
                {item.translatedText && (
                  <div className="mt-3 pt-3 border-t border-gray-600">
                    <p className="text-gray-300 mb-2">
                       <span className="font-bold text-purple-400">{item.targetLang}</span>へ翻訳
                    </p>
                    <p className="text-white text-lg">{item.translatedText}</p>
                  </div>
                )}
              </div>
            ))}
            {transcriptionHistory.length === 0 && !currentTranscription && !isRecording && (
               <div className="text-center text-gray-500 pt-10">
                 <p>マイクボタンを押して録音を開始してください。</p>
               </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
