import React, { useContext, useEffect, useRef, useState } from 'react'
import { userDataContext } from '../context/UserContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import aiImg from "../assets/ai.gif"
import { CgMenuRight } from "react-icons/cg";
import { RxCross1 } from "react-icons/rx";
import userImg from "../assets/user.gif"

export default function Home() {
  const { userData, serverUrl, setUserData, getGeminiResponse } = useContext(userDataContext)
  const navigate = useNavigate()

  const [listening, setListening] = useState(false)
  const [userText, setUserText] = useState("")
  const [aiText, setAiText] = useState("")
  const isSpeakingRef = useRef(false)
  const recognitionRef = useRef(null)
  const [ham, setHam] = useState(false)
  const isRecognizingRef = useRef(false)
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null
  const voicesRef = useRef([])

  // Safe fallback assistant name
  const assistantName = (userData && userData.assistantName) ? userData.assistantName.toLowerCase() : 'alexa'

  // Logout
  const handleLogOut = async () => {
    try {
      await axios.get(`${serverUrl}/api/auth/logout`, { withCredentials: true })
      setUserData(null)
      navigate('/signin')
    } catch (error) {
      console.error('Logout error', error)
      setUserData(null)
      navigate('/signin')
    }
  }

  // Start recognition safely
  const startRecognition = () => {
    const r = recognitionRef.current
    if (!r) return
    if (!isSpeakingRef.current && !isRecognizingRef.current) {
      try {
        r.start()
        console.log('Recognition requested to start')
      } catch (e) {
        if (e.name !== 'InvalidStateError') console.error('Start error:', e)
      }
    }
  }

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      try {
        voicesRef.current = (synth && synth.getVoices()) || []
      } catch (e) {
        voicesRef.current = []
      }
    }
    loadVoices()
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const handler = () => loadVoices()
      window.speechSynthesis.addEventListener('voiceschanged', handler)
      return () => window.speechSynthesis.removeEventListener('voiceschanged', handler)
    }
  }, [synth])

  // Speak helper
  const speak = async (text) => {
    if (!synth) return
    // Cancel any existing speech
    if (synth.speaking) synth.cancel()

    // Ensure voices loaded
    if (!voicesRef.current || voicesRef.current.length === 0) {
      await new Promise((resolve) => {
        const handler = () => {
          voicesRef.current = synth.getVoices() || []
          resolve()
        }
        window.speechSynthesis.addEventListener('voiceschanged', handler)
        setTimeout(() => {
          window.speechSynthesis.removeEventListener('voiceschanged', handler)
          voicesRef.current = synth.getVoices() || []
          resolve()
        }, 500)
      })
    }

    const utter = new SpeechSynthesisUtterance(text)
    const isHindi = /[\u0900-\u097F]/.test(text) || /\b(kya|tum|aap|kaise|kaisa|baje|namaste|shukriya|dhanyavaad)\b/i.test(text)
    utter.lang = isHindi ? 'hi-IN' : 'en-US'

    const voices = voicesRef.current || []
    if (isHindi) {
      const v = voices.find(vv => vv.lang && vv.lang.startsWith('hi'))
      if (v) utter.voice = v
    } else {
      const v = voices.find(vv => vv.lang && vv.lang.startsWith('en'))
      if (v) utter.voice = v
    }

    utter.rate = 0.95
    utter.pitch = 1
    utter.volume = 1

    isSpeakingRef.current = true

    utter.onstart = () => console.log('Speech started')
    utter.onend = () => {
      console.log('Speech ended')
      isSpeakingRef.current = false
      setAiText("")
      // Restart recognition after a short delay if component still mounted
      setTimeout(() => {
        try { startRecognition() } catch (e) { }
      }, 600)
    }

    utter.onerror = (e) => {
      console.error('Speech error', e)
      isSpeakingRef.current = false
      setTimeout(() => { try { startRecognition() } catch (e) {} }, 600)
    }

    synth.speak(utter)
  }

  // Handle backend command result
  const handleCommand = (data) => {
    if (!data) {
      console.warn('No data from assistant')
      setAiText('Sorry, I encountered an error.')
      return
    }

    const { type, userInput, response } = data
    if (response) setAiText(response)
    if (response) speak(response)

    // handle types
    if (!type) return
    const lowerInput = (userInput || '').toLowerCase()

    if (type === 'google-search') window.open(`https://www.google.com/search?q=${encodeURIComponent(lowerInput)}`, '_blank')
    if (type === 'calculator-open') window.open('https://www.google.com/search?q=calculator', '_blank')
    if (type === 'instagram-open') window.open('https://www.instagram.com/', '_blank')
    if (type === 'facebook-open') window.open('https://www.facebook.com/', '_blank')
    if (type === 'weather-show') window.open('https://www.google.com/search?q=weather', '_blank')
    if (type === 'github-open') window.open('https://github.com/dhirandra7', '_blank')
    if (type === 'linkedin-open') window.open('https://www.linkedin.com/in/dhirandra7/', '_blank')
    if (type === 'chatgpt-open') window.open('https://chat.openai.com/', '_blank')
    if (type === 'open-multiple') {
      const items = (userInput || '').split(',').map(s => s.trim())
      items.forEach(item => {
        if (!item) return
        if (/chatgpt|chat gpt/i.test(item)) window.open('https://chat.openai.com/', '_blank')
        else if (/github/i.test(item)) window.open('https://github.com/dhirandra7', '_blank')
        else if (/linkedin/i.test(item)) window.open('https://www.linkedin.com/in/dhirandra7/', '_blank')
        else if (/youtube/i.test(item)) window.open('https://www.youtube.com/', '_blank')
        else window.open(`https://www.google.com/search?q=${encodeURIComponent(item)}`, '_blank')
      })
    }
    if (type === 'youtube-search' || type === 'youtube-play' || type === 'youtube-open') {
      const q = encodeURIComponent(userInput || '')
      if (q) window.open(`https://www.youtube.com/results?search_query=${q}`, '_blank')
      else window.open('https://www.youtube.com/', '_blank')
    }
  }

  // Setup recognition once
  useEffect(() => {
    if (typeof window === 'undefined') return
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      console.warn('SpeechRecognition API not available in this browser')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.lang = 'en-US'
    recognition.interimResults = false

    recognitionRef.current = recognition

    let mounted = true
    const safeStartTimeout = setTimeout(() => {
      if (mounted && !isSpeakingRef.current && !isRecognizingRef.current) {
        try { recognition.start(); console.log('Recognition requested to start') } catch (e) { if (e.name !== 'InvalidStateError') console.error(e) }
      }
    }, 1000)

    recognition.onstart = () => { isRecognizingRef.current = true; setListening(true); }

    recognition.onend = () => {
      isRecognizingRef.current = false
      setListening(false)
      // Restart only if not speaking
      if (mounted && !isSpeakingRef.current) {
        setTimeout(() => {
          try { recognition.start(); console.log('Recognition restarted safely') } catch (e) { if (e.name !== 'InvalidStateError') console.error(e) }
        }, 700)
      }
    }

    recognition.onerror = (event) => {
      // handle noisy no-speech separately
      if (event.error === 'no-speech') {
        console.warn('No speech detected — waiting for next input')
        // don't spam restart — allow onend handler to restart
        return
      }
      if (event.error === 'aborted') {
        isRecognizingRef.current = false
        setListening(false)
        return
      }

      console.warn('Recognition error:', event.error)
      isRecognizingRef.current = false
      setListening(false)
      if (mounted && !isSpeakingRef.current) {
        setTimeout(() => { try { recognition.start() } catch (e) {} }, 700)
      }
    }

    recognition.onresult = async (e) => {
      // take the latest result
      const last = e.results[e.results.length - 1]
      const transcript = (last[0] && last[0].transcript) ? last[0].transcript.trim() : ''
      const text = transcript.toLowerCase()

      // triggers only when sentence starts with hey alexa or exact phrases
      const triggers = ['hey alexa', 'hey alexa,', 'hey alexa ' , 'hey alexa.']
      const matched = triggers.some(t => text.startsWith(t))
      if (!matched) return // ignore everything else

      // Stop recognition while processing
      try { recognition.stop() } catch (e) {}
      isRecognizingRef.current = false
      setListening(false)

      setAiText('')
      setUserText(transcript)

      try {
        console.log('Sending command to backend:', transcript)
        const data = await getGeminiResponse(transcript)
        console.log('Backend response:', data)
        if (!data) {
          setAiText('Sorry, I encountered an error. Please check the console.')
          setUserText('')
          // resume after short delay
          setTimeout(() => { if (!isSpeakingRef.current) startRecognition() }, 600)
          return
        }
        handleCommand(data)
        setUserText('')
      } catch (err) {
        console.error('Error getting response:', err)
        setAiText('Sorry, I encountered an error. Please check the console for details.')
        isSpeakingRef.current = false
        setUserText('')
        setTimeout(() => { if (!isSpeakingRef.current) startRecognition() }, 600)
      }
    }

    // greeting once on mount if userData present
    try {
      if (userData && userData.name) {
        const greeting = new SpeechSynthesisUtterance(`Hello ${userData.name}, what can I help you with?`)
        greeting.lang = 'hi-IN'
        window.speechSynthesis.speak(greeting)
      }
    } catch (e) { console.warn('Greeting failed', e) }

    return () => {
      mounted = false
      clearTimeout(safeStartTimeout)
      try { recognition.stop() } catch (e) {}
      setListening(false)
      isRecognizingRef.current = false
    }
  }, [userData])

  return (
    <div className='w-full h-[100vh] bg-gradient-to-t from-[black] to-[#02023d] flex justify-center items-center flex-col gap-[15px] overflow-hidden'>
      <CgMenuRight className='lg:hidden text-white absolute top-[20px] right-[20px] w-[25px] h-[25px]' onClick={()=>setHam(true)}/>
      <div className={`absolute lg:hidden top-0 w-full h-full bg-[#00000053] backdrop-blur-lg p-[20px] flex flex-col gap-[20px] items-start ${ham?"translate-x-0":"translate-x-full"} transition-transform`}>
 <RxCross1 className=' text-white absolute top-[20px] right-[20px] w-[25px] h-[25px]' onClick={()=>setHam(false)}/>
 <button className='min-w-[150px] h-[60px]  text-black font-semibold   bg-white rounded-full cursor-pointer text-[19px] ' onClick={handleLogOut}>Log Out</button>
      <button className='min-w-[150px] h-[60px]  text-black font-semibold  bg-white  rounded-full cursor-pointer text-[19px] px-[20px] py-[10px] ' onClick={()=>navigate("/customize")}>Customize your Assistant</button>

<div className='w-full h-[2px] bg-gray-400'></div>
<h1 className='text-white font-semibold text-[19px]'>History</h1>

<div className='w-full h-[400px] gap-[20px] overflow-y-auto flex flex-col truncate'>
  {userData.history?.map((his)=>(
    <div className='text-gray-200 text-[18px] w-full h-[30px]  '>{his}</div>
  ))}

</div>

      </div>
      <button className='min-w-[150px] h-[60px] mt-[30px] text-black font-semibold absolute hidden lg:block top-[20px] right-[20px]  bg-white rounded-full cursor-pointer text-[19px] ' onClick={handleLogOut}>Log Out</button>
      <button className='min-w-[150px] h-[60px] mt-[30px] text-black font-semibold  bg-white absolute top-[100px] right-[20px] rounded-full cursor-pointer text-[19px] px-[20px] py-[10px] hidden lg:block ' onClick={()=>navigate("/customize")}>Customize your Assistant</button>
      <div className='w-[300px] h-[400px] flex justify-center items-center overflow-hidden rounded-4xl shadow-lg'>
<img src={userData?.assistantImage} alt="assistant" className='h-full object-cover'/>
      </div>
      <h1 className='text-white text-[18px] font-semibold'>I'm {userData?.assistantName}</h1>
      {!aiText && <img src={userImg} alt="user" className='w-[200px]'/>}
      {aiText && <img src={aiImg} alt="ai" className='w-[200px]'/>}
    
    <h1 className='text-white text-[18px] font-semibold text-wrap'>{userText?userText:aiText?aiText:null}</h1>
      
    </div>
  )
}
