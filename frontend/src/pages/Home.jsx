import React, { useContext, useEffect, useRef, useState } from 'react'
import { userDataContext } from '../context/UserContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import aiImg from "../assets/ai.gif"
import userImg from "../assets/user.gif"
import { CgMenuRight } from "react-icons/cg"
import { RxCross1 } from "react-icons/rx"

export default function Home() {
  const { userData, serverUrl, setUserData, getGeminiResponse } = useContext(userDataContext)
  const navigate = useNavigate()

  const [listening, setListening] = useState(false)
  const [userText, setUserText] = useState("")
  const [aiText, setAiText] = useState("")
  const [ham, setHam] = useState(false)

  const recognitionRef = useRef(null)
  const isRecognizingRef = useRef(false)
  const isSpeakingRef = useRef(false)
  const voicesRef = useRef([])
  const hasGreetedRef = useRef(false)
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null

  const assistantName = (userData?.assistantName || 'alexa').toLowerCase()

  // ================= Logout =================
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

  // ================= Safe Recognition Start =================
  const safeStartRecognition = () => {
    const r = recognitionRef.current
    if (r && !isRecognizingRef.current) {
      try {
        r.start()
        console.log("Recognition requested to start")
      } catch (e) {
        if (e.name !== 'InvalidStateError') console.error(e)
      }
    }
  }

  // ================= Load Voices =================
  useEffect(() => {
    const loadVoices = () => {
      voicesRef.current = synth?.getVoices() || []
    }
    loadVoices()
    if (window.speechSynthesis) {
      const handler = () => loadVoices()
      window.speechSynthesis.addEventListener('voiceschanged', handler)
      return () => window.speechSynthesis.removeEventListener('voiceschanged', handler)
    }
  }, [synth])

  // ================= Speak Helper =================
  const speak = async (text) => {
    if (!synth) return
    if (synth.speaking) {
      console.log("Speech interrupted, ignoring...")
      synth.cancel()
    }

    const utter = new SpeechSynthesisUtterance(text)
    const isHindi = /[\u0900-\u097F]/.test(text)
    utter.lang = isHindi ? 'hi-IN' : 'en-US'

    const voices = voicesRef.current
    if (isHindi) {
      const v = voices.find(vv => vv.lang.startsWith('hi'))
      if (v) utter.voice = v
    } else {
      const v = voices.find(vv => vv.lang.startsWith('en'))
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
      setTimeout(safeStartRecognition, 600)
    }

    utter.onerror = (e) => {
      console.warn("Speech synthesis error (ignored):", e.error)
      isSpeakingRef.current = false
      setTimeout(safeStartRecognition, 600)
    }

    synth.speak(utter)
  }

  // ================= Handle Commands =================
  const handleCommand = (data) => {
    if (!data) {
      setAiText("Sorry, I encountered an error.")
      return
    }

    const { type, userInput, response } = data
    if (response) {
      setAiText(response)
      speak(response)
    }

    if (!type) return

    const lowerInput = (userInput || '').toLowerCase()

    if (type === 'google-search')
      window.open(`https://www.google.com/search?q=${encodeURIComponent(lowerInput)}`, '_blank')

    if (type === 'youtube-open' || type === 'youtube-play' || type === 'youtube-search') {
      const items = lowerInput.split(/,|and/).map(i => i.trim())
      items.forEach(q => {
        if (q) window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`, '_blank')
      })
    }

    if (type === 'open-multiple') {
      const items = (userInput || '').split(/,|and/).map(s => s.trim())
      items.forEach(item => {
        if (!item) return
        if (/chatgpt/i.test(item)) window.open('https://chat.openai.com/', '_blank')
        else if (/github/i.test(item)) window.open('https://github.com/dhirandra7', '_blank')
        else if (/linkedin/i.test(item)) window.open('https://www.linkedin.com/in/dhirandra7/', '_blank')
        else if (/youtube/i.test(item)) window.open('https://www.youtube.com/', '_blank')
        else window.open(`https://www.google.com/search?q=${encodeURIComponent(item)}`, '_blank')
      })
    }
  }

  // ================= Setup Recognition =================
  useEffect(() => {
    if (!window) return
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognitionRef.current = recognition

    let mounted = true

    recognition.onstart = () => { isRecognizingRef.current = true; setListening(true) }
    recognition.onend = () => {
      isRecognizingRef.current = false
      setListening(false)
      if (mounted && !isSpeakingRef.current) setTimeout(safeStartRecognition, 700)
    }
    recognition.onerror = (event) => {
      console.warn("Recognition error (ignored):", event.error)
      isRecognizingRef.current = false
      setListening(false)
    }

    recognition.onresult = async (e) => {
      const last = e.results[e.results.length - 1]
      const transcript = (last[0]?.transcript || '').trim()
      const text = transcript.toLowerCase()

      if (!text.includes(assistantName)) return

      try { recognition.stop() } catch {}
      isRecognizingRef.current = false
      setListening(false)

      setUserText(transcript)
      setAiText("")

      try {
        const data = await getGeminiResponse(transcript)
        handleCommand(data)
        setUserText('')
      } catch (err) {
        console.error(err)
        setAiText('Error in processing command.')
        setUserText('')
      }
    }

    if (userData?.name && !hasGreetedRef.current) {
      hasGreetedRef.current = true
      speak(`Hello ${userData.name}, what can I help you with?`)
    }

    setTimeout(safeStartRecognition, 1000)

    return () => {
      mounted = false
      try { recognition.stop() } catch {}
      isRecognizingRef.current = false
      setListening(false)
    }
  }, [userData])

  // ================= Render =================
  return (
    <div className='w-full h-[100vh] bg-gradient-to-t from-[black] to-[#02023d] flex justify-center items-center flex-col gap-[15px] overflow-hidden'>
      <CgMenuRight className='lg:hidden text-white absolute top-[20px] right-[20px] w-[25px] h-[25px]' onClick={()=>setHam(true)}/>
      <div className={`absolute lg:hidden top-0 w-full h-full bg-[#00000053] backdrop-blur-lg p-[20px] flex flex-col gap-[20px] items-start ${ham?"translate-x-0":"translate-x-full"} transition-transform`}>
        <RxCross1 className='text-white absolute top-[20px] right-[20px] w-[25px] h-[25px]' onClick={()=>setHam(false)}/>
        <button className='min-w-[150px] h-[60px] text-black font-semibold bg-white rounded-full cursor-pointer text-[19px]' onClick={handleLogOut}>Log Out</button>
        <button className='min-w-[150px] h-[60px] text-black font-semibold bg-white rounded-full cursor-pointer text-[19px] px-[20px] py-[10px]' onClick={()=>navigate("/customize")}>Customize your Assistant</button>
        <div className='w-full h-[2px] bg-gray-400'></div>
        <h1 className='text-white font-semibold text-[19px]'>History</h1>
        <div className='w-full h-[400px] gap-[20px] overflow-y-auto flex flex-col truncate'>
          {userData?.history?.map(his => <div key={his} className='text-gray-200 text-[18px] w-full h-[30px]'>{his}</div>)}
        </div>
      </div>

      <button className='min-w-[150px] h-[60px] text-black font-semibold absolute hidden lg:block top-[20px] right-[20px] bg-white rounded-full cursor-pointer text-[19px]' onClick={handleLogOut}>Log Out</button>
      <button className='min-w-[150px] h-[60px] text-black font-semibold absolute hidden lg:block top-[100px] right-[20px] bg-white rounded-full cursor-pointer text-[19px] px-[20px] py-[10px]' onClick={()=>navigate("/customize")}>Customize your Assistant</button>

      <div className='w-[300px] h-[400px] flex justify-center items-center overflow-hidden rounded-4xl shadow-lg'>
        <img src={userData?.assistantImage} alt="assistant" className='h-full object-cover'/>
      </div>

      <h1 className='text-white text-[18px] font-semibold'>I'm {userData?.assistantName}</h1>
      {!aiText && <img src={userImg} alt="user" className='w-[200px]'/>}
      {aiText && <img src={aiImg} alt="ai" className='w-[200px]'/>}
      <h1 className='text-white text-[18px] font-semibold text-wrap'>{userText || aiText || null}</h1>
    </div>
  )
}
