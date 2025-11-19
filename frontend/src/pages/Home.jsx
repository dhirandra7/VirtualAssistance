import React, { useContext, useEffect, useRef, useState } from 'react'
import { userDataContext } from '../context/UserContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import aiImg from "../assets/ai.gif"
import { CgMenuRight } from "react-icons/cg";
import { RxCross1 } from "react-icons/rx";
import userImg from "../assets/user.gif"
function Home() {
  const {userData,serverUrl,setUserData,getGeminiResponse}=useContext(userDataContext)
  const navigate=useNavigate()
  const [listening,setListening]=useState(false)
  const [userText,setUserText]=useState("")
  const [aiText,setAiText]=useState("")
  const isSpeakingRef=useRef(false)
  const recognitionRef=useRef(null)
  const [ham,setHam]=useState(false)
  const isRecognizingRef=useRef(false)
  const synth=window.speechSynthesis
  const voicesRef = useRef([])

  const handleLogOut=async ()=>{
    try {
      const result=await axios.get(`${serverUrl}/api/auth/logout`,{withCredentials:true})
      setUserData(null)
      navigate("/signin")
    } catch (error) {
      setUserData(null)
      console.log(error)
    }
  }

  const startRecognition = () => {
    
   if (!isSpeakingRef.current && !isRecognizingRef.current) {
    try {
      recognitionRef.current?.start();
      console.log("Recognition requested to start");
    } catch (error) {
      if (error.name !== "InvalidStateError") {
        console.error("Start error:", error);
      }
    }
  }
    
  }

  // Load available voices into ref (voices may load asynchronously)
  useEffect(() => {
    const loadVoices = () => {
      try {
        voicesRef.current = synth.getVoices() || []
      } catch (e) {
        voicesRef.current = []
      }
    }
    loadVoices()
    const onVoicesChanged = () => loadVoices()
    window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged)
  }, [])

  const speak = async (text) => {
    console.log('speak() called with text:', text)

    // Cancel any existing speech
    if (synth.speaking) {
      console.log('Cancelling existing speech')
      synth.cancel()
    }

    // If voices are not yet loaded, wait briefly for voiceschanged
    if (!voicesRef.current || voicesRef.current.length === 0) {
      await new Promise((resolve) => {
        const handler = () => {
          voicesRef.current = synth.getVoices() || []
          resolve()
        }
        window.speechSynthesis.addEventListener('voiceschanged', handler)
        // fallback timeout
        setTimeout(() => {
          window.speechSynthesis.removeEventListener('voiceschanged', handler)
          voicesRef.current = synth.getVoices() || []
          resolve()
        }, 500)
      })
    }

    const utterence = new SpeechSynthesisUtterance(text)

    // detect Hindi by Devanagari or common Hindi words (handles Hinglish)
    const isHindi = /[\u0900-\u097F]/.test(text) || /\b(kya|tum|aap|kaise|kaisa|baje|namaste|shukriya|dhanyavaad)\b/i.test(text)
    utterence.lang = isHindi ? 'hi-IN' : 'en-US'

    // Choose voice from loaded list
    const voices = voicesRef.current || []
    if (isHindi) {
      const hindiVoice = voices.find(v => v.lang && v.lang.startsWith('hi'))
      if (hindiVoice) utterence.voice = hindiVoice
    } else {
      const englishVoice = voices.find(v => v.lang && v.lang.startsWith('en'))
      if (englishVoice) utterence.voice = englishVoice
    }

    utterence.rate = 0.95
    utterence.pitch = 1
    utterence.volume = 1

    isSpeakingRef.current = true

    utterence.onstart = () => console.log('Speech started')
    utterence.onend = () => {
      console.log('Speech ended')
      isSpeakingRef.current = false
      setAiText("")
      setTimeout(() => startRecognition(), 600)
    }
    utterence.onerror = (e) => {
      console.error('Speech error', e)
      isSpeakingRef.current = false
      // Resume recognition even on error
      setTimeout(() => startRecognition(), 600)
    }

    console.log('About to speak:', text)
    synth.speak(utterence)
  }

  const handleCommand=(data)=>{
    const {type,userInput,response}=data
    
    console.log('handleCommand called with:', {type, userInput, response});
    
    // Set AI text immediately so user sees it
    if (response) {
      setAiText(response)
    }
    
    // Always attempt to speak the response from backend
    if (response) {
      console.log('Calling speak() with response:', response);
      speak(response);
    } else {
      console.warn('No response to speak');
      isSpeakingRef.current = false;
      setTimeout(() => startRecognition(), 600)
    }
    
    // Handle specific command types that open URLs/apps
    if (type === 'google-search') {
      const query = encodeURIComponent(userInput);
      window.open(`https://www.google.com/search?q=${query}`, '_blank');
    }
    if (type === 'calculator-open') {
      window.open(`https://www.google.com/search?q=calculator`, '_blank');
    }
    if (type === "instagram-open") {
      window.open(`https://www.instagram.com/`, '_blank');
    }
    if (type === "facebook-open") {
      window.open(`https://www.facebook.com/`, '_blank');
    }
    if (type === "weather-show") {
      window.open(`https://www.google.com/search?q=weather`, '_blank');
    }
    if (type === "github-open") {
      window.open(`https://github.com/dhirandra7`, '_blank');
    }

    if (type === "linkedin-open") {
      window.open(`https://www.linkedin.com/in/dhirandra7/`, '_blank');
    }

    if (type === "chatgpt-open") {
      window.open('https://chat.openai.com/', '_blank');
    }

    if (type === 'open-multiple') {
      // userInput expected to be comma-separated list like "chatgpt, github, linkedin"
      const items = (userInput || '').split(',').map(s => s.trim().toLowerCase());
      items.forEach(item => {
        if (!item) return;
        if (item.includes('chatgpt') || item.includes('chat gpt')) {
          window.open('https://chat.openai.com/', '_blank');
        } else if (item.includes('github')) {
          window.open('https://github.com/dhirandra7', '_blank');
        } else if (item.includes('linkedin') || item.includes('linked in')) {
          window.open('https://www.linkedin.com/in/dhirandra7/', '_blank');
        } else if (item.includes('youtube')) {
          window.open('https://www.youtube.com/', '_blank');
        } else if (item.includes('google')) {
          window.open('https://www.google.com/', '_blank');
        } else if (item.includes('instagram') || item.includes('insta')) {
          window.open('https://www.instagram.com/', '_blank');
        } else if (item.includes('facebook')) {
          window.open('https://www.facebook.com/', '_blank');
        } else {
          // default to google search for unknown item
          window.open(`https://www.google.com/search?q=${encodeURIComponent(item)}`, '_blank');
        }
      });
    }
    if (type === 'youtube-search' || type === 'youtube-play' || type === 'youtube-open') {
      const query = encodeURIComponent(userInput || '');
      if (userInput && userInput.trim()) {
        window.open(`https://www.youtube.com/results?search_query=${query}`, '_blank');
      } else {
        window.open('https://www.youtube.com/', '_blank');
      }
    }
  }

useEffect(() => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  recognition.continuous = true;
  recognition.lang = 'en-US';
  recognition.interimResults = false;

  recognitionRef.current = recognition;

  let isMounted = true;  

  // Start recognition after 1 second delay only if component still mounted
  const startTimeout = setTimeout(() => {
    if (isMounted && !isSpeakingRef.current && !isRecognizingRef.current) {
      try {
        recognition.start();
        console.log("Recognition requested to start");
      } catch (e) {
        if (e.name !== "InvalidStateError") {
          console.error(e);
        }
      }
    }
  }, 1000);

  recognition.onstart = () => {
    isRecognizingRef.current = true;
    setListening(true);
  };

  recognition.onend = () => {
    isRecognizingRef.current = false;
    setListening(false);
    if (isMounted && !isSpeakingRef.current) {
      setTimeout(() => {
        if (isMounted) {
          try {
            recognition.start();
            console.log("Recognition restarted");
          } catch (e) {
            if (e.name !== "InvalidStateError") console.error(e);
          }
        }
      }, 1000);
    }
  };

  recognition.onerror = (event) => {
    // If recognition was aborted intentionally (we call abort() before speaking),
    // suppress the noisy 'aborted' error — just clear flags and don't restart here.
    if (event.error === 'aborted') {
      isRecognizingRef.current = false;
      setListening(false);
      return;
    }

    console.warn("Recognition error:", event.error);
    isRecognizingRef.current = false;
    setListening(false);
    if (isMounted && !isSpeakingRef.current) {
      setTimeout(() => {
        if (isMounted) {
          try {
            recognition.start();
            console.log("Recognition restarted after error");
          } catch (e) {
            if (e.name !== "InvalidStateError") console.error(e);
          }
        }
      }, 1000);
    }
  };

  // NOTE: removed duplicate handleCommand here so the top-level
  // `handleCommand` (which calls `speak(response)`) is used everywhere.

  recognition.onresult = async (e) => {
    const transcript = e.results[e.results.length - 1][0].transcript.trim();
    if (transcript.toLowerCase().includes(userData.assistantName.toLowerCase())) {
      setAiText("");
      setUserText(transcript);
      recognition.stop();
      isRecognizingRef.current = false;
      setListening(false);
      try {
        console.log('Sending command to backend:', transcript);
        const data = await getGeminiResponse(transcript);
        console.log('Backend response:', data);
        handleCommand(data);
        // Remove duplicate setAiText here - handleCommand already sets it
        setUserText("");
      } catch (error) {
        console.error('Error getting response:', error);
        setAiText('Sorry, I encountered an error. Please check the console for details.');
        isSpeakingRef.current = false;
        setUserText("");
        setTimeout(() => startRecognition(), 600);
      }
    }
  };


    const greeting = new SpeechSynthesisUtterance(`Hello ${userData.name}, what can I help you with?`);
    greeting.lang = 'hi-IN';
   
    window.speechSynthesis.speak(greeting);
 

  return () => {
    isMounted = false;
    clearTimeout(startTimeout);
    recognition.stop();
    setListening(false);
    isRecognizingRef.current = false;
  };
}, []);




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
<img src={userData?.assistantImage} alt="" className='h-full object-cover'/>
      </div>
      <h1 className='text-white text-[18px] font-semibold'>I'm {userData?.assistantName}</h1>
      {!aiText && <img src={userImg} alt="" className='w-[200px]'/>}
      {aiText && <img src={aiImg} alt="" className='w-[200px]'/>}
    
    <h1 className='text-white text-[18px] font-semibold text-wrap'>{userText?userText:aiText?aiText:null}</h1>
      
    </div>
  )
}

export default Home