'use client'

import { useState, useEffect, useRef } from 'react'

interface Message {
  role: 'user' | 'agent'
  content: string
  timestamp: number
}

export default function Home() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [response, setResponse] = useState('')
  const [status, setStatus] = useState('Click the microphone to start')
  const [conversation, setConversation] = useState<Message[]>([])
  const [error, setError] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(false)

  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = false
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = 'en-US'

        recognitionRef.current.onresult = (event: any) => {
          const current = event.resultIndex
          const transcriptText = event.results[current][0].transcript
          setTranscript(transcriptText)

          if (event.results[current].isFinal) {
            processVoiceInput(transcriptText)
          }
        }

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          setError(`Error: ${event.error}`)
          setIsListening(false)
          setStatus('Error occurred. Click to try again.')
        }

        recognitionRef.current.onend = () => {
          setIsListening(false)
        }
      } else {
        setError('Speech recognition is not supported in this browser. Please use Chrome or Edge.')
      }

      synthRef.current = window.speechSynthesis
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      setStatus('Stopped listening')
    } else {
      setError('')
      setTranscript('')
      setIsListening(true)
      setStatus('Listening... Speak now')
      recognitionRef.current?.start()
    }
  }

  const processVoiceInput = async (text: string) => {
    setStatus('Processing your request...')

    const userMessage: Message = {
      role: 'user',
      content: text,
      timestamp: Date.now()
    }

    setConversation(prev => [...prev, userMessage])

    const agentResponse = await getAgentResponse(text)

    const agentMessage: Message = {
      role: 'agent',
      content: agentResponse,
      timestamp: Date.now()
    }

    setConversation(prev => [...prev, agentMessage])
    setResponse(agentResponse)
    setStatus('Speaking response...')

    speak(agentResponse)
  }

  const getAgentResponse = async (input: string): Promise<string> => {
    const lowerInput = input.toLowerCase()

    if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
      return "Hello! I'm your voice AI agent. How can I help you today?"
    }

    if (lowerInput.includes('time')) {
      const now = new Date()
      return `The current time is ${now.toLocaleTimeString()}.`
    }

    if (lowerInput.includes('date')) {
      const now = new Date()
      return `Today is ${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`
    }

    if (lowerInput.includes('weather')) {
      return "I don't have access to real-time weather data, but you can check your local weather forecast online or through a weather app."
    }

    if (lowerInput.includes('joke')) {
      const jokes = [
        "Why don't scientists trust atoms? Because they make up everything!",
        "Why did the scarecrow win an award? He was outstanding in his field!",
        "What do you call a bear with no teeth? A gummy bear!",
        "Why don't eggs tell jokes? They'd crack each other up!"
      ]
      return jokes[Math.floor(Math.random() * jokes.length)]
    }

    if (lowerInput.includes('calculate') || lowerInput.includes('plus') || lowerInput.includes('minus') || lowerInput.includes('times') || lowerInput.includes('divided')) {
      try {
        const numbers = input.match(/\d+/g)
        if (numbers && numbers.length >= 2) {
          const a = parseInt(numbers[0])
          const b = parseInt(numbers[1])

          if (lowerInput.includes('plus') || lowerInput.includes('add')) {
            return `${a} plus ${b} equals ${a + b}.`
          }
          if (lowerInput.includes('minus') || lowerInput.includes('subtract')) {
            return `${a} minus ${b} equals ${a - b}.`
          }
          if (lowerInput.includes('times') || lowerInput.includes('multiply')) {
            return `${a} times ${b} equals ${a * b}.`
          }
          if (lowerInput.includes('divided')) {
            return `${a} divided by ${b} equals ${(a / b).toFixed(2)}.`
          }
        }
      } catch (e) {
        return "I couldn't process that calculation. Can you try again?"
      }
    }

    if (lowerInput.includes('help')) {
      return "I can help you with time, date, simple calculations, tell jokes, and answer basic questions. Just speak naturally!"
    }

    if (lowerInput.includes('thank')) {
      return "You're welcome! Is there anything else I can help you with?"
    }

    if (lowerInput.includes('bye') || lowerInput.includes('goodbye')) {
      return "Goodbye! Have a great day!"
    }

    return `I heard you say: "${input}". I'm a simple voice agent. Try asking me about the time, date, for a joke, or simple calculations!`
  }

  const speak = (text: string) => {
    if (synthRef.current) {
      synthRef.current.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.volume = 1.0

      utterance.onstart = () => {
        setIsSpeaking(true)
      }

      utterance.onend = () => {
        setIsSpeaking(false)
        setStatus('Click the microphone to speak again')
      }

      utterance.onerror = () => {
        setIsSpeaking(false)
        setStatus('Error speaking. Click to try again.')
      }

      synthRef.current.speak(utterance)
    }
  }

  const clearConversation = () => {
    setConversation([])
    setTranscript('')
    setResponse('')
    setStatus('Click the microphone to start')
    setError('')
  }

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel()
      setIsSpeaking(false)
      setStatus('Stopped speaking')
    }
  }

  return (
    <div className="container">
      <h1>🎙️ Voice AI Agent</h1>

      <div className="status">{status}</div>

      <button
        className={`voice-button ${isListening ? 'listening' : ''}`}
        onClick={toggleListening}
        disabled={isSpeaking}
      >
        {isListening ? '🔴' : '🎤'}
      </button>

      <div className="controls">
        <button
          className="control-button"
          onClick={stopSpeaking}
          disabled={!isSpeaking}
        >
          Stop Speaking
        </button>
        <button
          className="control-button"
          onClick={clearConversation}
          disabled={conversation.length === 0}
        >
          Clear Chat
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {transcript && (
        <div className="transcript">
          <div className="label">You said:</div>
          {transcript}
        </div>
      )}

      {response && (
        <div className="response">
          <div className="label">Agent Response:</div>
          {response}
        </div>
      )}

      {conversation.length > 0 && (
        <div className="conversation">
          <div className="label">Conversation History:</div>
          {conversation.map((msg, idx) => (
            <div key={idx} className={`message ${msg.role}`}>
              <strong>{msg.role === 'user' ? 'You' : 'Agent'}:</strong> {msg.content}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
