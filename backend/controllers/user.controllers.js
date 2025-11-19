 import uploadOnCloudinary from "../config/cloudinary.js"
import geminiResponse from "../gemini.js"
import User from "../models/user.model.js"
import moment from "moment"

// Fallback response generator when Gemini API quota is exceeded
const generateFallbackResponse = (command, assistantName, userName) => {
  const cmd = command.toLowerCase().replace(assistantName.toLowerCase(), '').trim();
  
  let type = 'general';
  let response = `I'm not sure how to help with that. Please try again.`;
  
  // Multiple opens (when user says "open X and Y") - CHECK THIS FIRST
  if ((cmd.match(/open/gi) || []).length > 0 && (cmd.match(/and/gi) || []).length > 0) {
    type = 'open-multiple';
    // Extract site names from the command
    const sites = [];
    if (cmd.includes('github')) sites.push('github');
    if (cmd.includes('linkedin') || cmd.includes('linked in')) sites.push('linkedin');
    if (cmd.includes('chatgpt') || cmd.includes('chat gpt')) sites.push('chatgpt');
    if (cmd.includes('google')) sites.push('google');
    if (cmd.includes('youtube')) sites.push('youtube');
    if (cmd.includes('instagram') || cmd.includes('insta')) sites.push('instagram');
    if (cmd.includes('facebook')) sites.push('facebook');
    response = `Opening ${sites.join(' and ')}`;
  }
  // YouTube commands
  else if (cmd.includes('youtube') || cmd.includes('open youtube') || cmd.includes('youtube search')) {
    type = 'youtube-search';
    const searchQuery = cmd.replace(/youtube|open|search/g, '').trim();
    response = `Opening YouTube ${searchQuery ? 'and searching for ' + searchQuery : ''}`;
  }
  // Calculator
  else if (cmd.includes('calculator') || cmd.includes('calc')) {
    type = 'calculator-open';
    response = `Opening calculator for you`;
  }
  // Google search
  else if (cmd.includes('search') || cmd.includes('google')) {
    type = 'google-search';
    const searchQuery = cmd.replace(/search|google|find/g, '').trim();
    response = `Searching Google for ${searchQuery || 'your query'}`;
  }
  // Instagram
  else if (cmd.includes('instagram') || cmd.includes('insta')) {
    type = 'instagram-open';
    response = `Opening Instagram`;
  }
  // Facebook
  else if (cmd.includes('facebook')) {
    type = 'facebook-open';
    response = `Opening Facebook`;
  }
  // ChatGPT
  else if (cmd.includes('chatgpt') || cmd.includes('chat gpt')) {
    type = 'chatgpt-open';
    response = `Opening ChatGPT`;
  }
  // GitHub
  else if (cmd.includes('github')) {
    type = 'github-open';
    response = `Opening GitHub`;
  }
  // LinkedIn
  else if (cmd.includes('linkedin') || cmd.includes('linked in')) {
    type = 'linkedin-open';
    response = `Opening LinkedIn`;
  }
  // Weather
  else if (cmd.includes('weather')) {
    type = 'weather-show';
    response = `Checking weather for you`;
  }
  // Time - English and Hindi variations
  else if (cmd.includes('time') || cmd.includes('what time') || cmd.includes('kya time') || cmd.includes('kitna time') || cmd.includes('rha hai') || cmd.includes('baje')) {
    type = 'get-time';
    response = `The current time is ${moment().format('hh:mm A')}`;
  }
  // Date - English and Hindi variations
  else if (cmd.includes('date') || cmd.includes('today') || cmd.includes('aaj') || cmd.includes('tarikh')) {
    type = 'get-date';
    response = `Today's date is ${moment().format('YYYY-MM-DD')}`;
  }
  // Day
  else if (cmd.includes('day') || cmd.includes('what day') || cmd.includes('kaun sa din') || cmd.includes('aaj kon sa din')) {
    type = 'get-day';
    response = `Today is ${moment().format('dddd')}`;
  }
  // Month
  else if (cmd.includes('month') || cmd.includes('current month') || cmd.includes('mahina')) {
    type = 'get-month';
    response = `The current month is ${moment().format('MMMM')}`;
  }
  // General knowledge questions and personal questions
  else {
    type = 'general';
    
    // "Who are you" - English and Hindi variations
    if (cmd.includes('who are you') || cmd.includes('what are you') || cmd.includes('tum kon ho') || cmd.includes('tu kon') || cmd.includes('aap kaun')) {
      response = `I'm ${assistantName}, your personal virtual assistant created by ${userName}. I'm here to help you with whatever you need!`;
    }
    // "How are you" - English and Hindi variations
    else if (cmd.includes('how are you') || cmd.includes('kaisa ho') || cmd.includes('kaise ho') || cmd.includes('aap theek')) {
      response = `I'm doing great, thank you for asking! I'm ready to assist you with anything you need.`;
    }
    // Greetings
    else if (cmd.includes('hello') || cmd.includes('hi') || cmd.includes('namaste') || cmd.includes('salam') || cmd.includes('hey')) {
      response = `Hello! I'm ${assistantName}, your virtual assistant. How can I help you today?`;
    } 
    // Thanks
    else if (cmd.includes('thanks') || cmd.includes('thank you') || cmd.includes('shukriya') || cmd.includes('dhanyavaad')) {
      response = `You're welcome! Feel free to ask me anything anytime.`;
    }
    // JavaScript
    else if (cmd.includes('javascript') || cmd.includes('js')) {
      response = `JavaScript is a programming language commonly used for web development. It allows you to add interactivity to websites and can run in web browsers. JavaScript is also used for server-side development with Node.js`;
    }
    // Java
    else if (cmd.includes('java') && !cmd.includes('javascript')) {
      response = `Java is a powerful, object-oriented programming language used for building large-scale applications. It's platform independent, meaning Java code can run on any device that has a Java Virtual Machine installed.`;
    }
    // Python
    else if (cmd.includes('python')) {
      response = `Python is a simple and powerful programming language known for its readable syntax. It's widely used in data science, artificial intelligence, web development, and automation.`;
    }
    // HTML
    else if (cmd.includes('html')) {
      response = `HTML stands for Hyper Text Markup Language. It's used to create the structure and content of web pages.`;
    }
    // CSS
    else if (cmd.includes('css')) {
      response = `CSS stands for Cascading Style Sheets. It's used to style and layout web pages to make them look attractive.`;
    }
    // React
    else if (cmd.includes('react')) {
      response = `React is a JavaScript library created by Facebook for building user interfaces. It uses components to create dynamic and interactive web applications.`;
    }
    // Node.js
    else if (cmd.includes('node') || cmd.includes('nodejs')) {
      response = `Node.js is a JavaScript runtime built on Chrome's V8 JavaScript engine. It allows you to run JavaScript outside of web browsers, making it perfect for building server-side applications.`;
    }
    // MongoDB
    else if (cmd.includes('mongodb') || cmd.includes('mongo')) {
      response = `MongoDB is a NoSQL database that stores data in a flexible, JSON-like format. It's great for applications that need to scale and handle unstructured data.`;
    }
    // General fallback for any question
    else {
      response = `That's an interesting question! Based on what you asked about ${cmd}, I'd be happy to help. Could you give me more details so I can provide a better answer?`;
    }
  }

  return JSON.stringify({
    type,
    userInput: cmd,
    response
  });
};

 export const getCurrentUser=async (req,res)=>{
    try {
        const userId=req.userId
        const user=await User.findById(userId).select("-password")
        if(!user){
return res.status(400).json({message:"user not found"})
        }

   return res.status(200).json(user)     
    } catch (error) {
       return res.status(400).json({message:"get current user error"}) 
    }
}

export const updateAssistant=async (req,res)=>{
   try {
      const {assistantName,imageUrl}=req.body
      let assistantImage;
if(req.file){
   assistantImage=await uploadOnCloudinary(req.file.path)
}else{
   assistantImage=imageUrl
}

const user=await User.findByIdAndUpdate(req.userId,{
   assistantName,assistantImage
},{new:true}).select("-password")
return res.status(200).json(user)

      
   } catch (error) {
       return res.status(400).json({message:"updateAssistantError user error"}) 
   }
}


export const askToAssistant=async (req,res)=>{
   try {
      const {command}=req.body
      const user=await User.findById(req.userId);
      user.history.push(command)
      user.save()
      const userName=user.name
      const assistantName=user.assistantName
      
      let result;
      try {
        // Try to get response from Gemini API
        result=await geminiResponse(command,assistantName,userName)
      } catch (geminiError) {
        // If Gemini fails (quota, timeout, etc.), use fallback
        console.warn('Gemini API failed, using fallback response:', geminiError.message);
        result = generateFallbackResponse(command, assistantName, userName);
      }

      const jsonMatch=result.match(/{[\s\S]*}/)
      if(!jsonMatch){
         return res.status(400).json({type: "general", response:"sorry, i can't understand", userInput: command})
      }
      const gemResult=JSON.parse(jsonMatch[0])
      console.log(gemResult)
      const type=gemResult.type

      switch(type){
         case 'get-date' :
            return res.json({
               type,
               userInput:gemResult.userInput,
               response:`current date is ${moment().format("YYYY-MM-DD")}`
            });
            case 'get-time':
                return res.json({
               type,
               userInput:gemResult.userInput,
               response:`current time is ${moment().format("hh:mm A")}`
            });
             case 'get-day':
                return res.json({
               type,
               userInput:gemResult.userInput,
               response:`today is ${moment().format("dddd")}`
            });
            case 'get-month':
                return res.json({
               type,
               userInput:gemResult.userInput,
               response:`today is ${moment().format("MMMM")}`
            });
      case 'google-search':
      case 'youtube-search':
      case 'youtube-play':
      case 'general':
      case  "calculator-open":
      case "instagram-open": 
       case "facebook-open": 
       case "weather-show" :
         return res.json({
            type,
            userInput:gemResult.userInput,
            response:gemResult.response,
         });

      // New handlers for open commands
      case 'chatgpt-open':
         return res.json({
            type,
            userInput:gemResult.userInput,
            response:gemResult.response || 'Opening ChatGPT'
         });
      case 'github-open':
         return res.json({
            type,
            userInput:gemResult.userInput,
            response:gemResult.response || 'Opening GitHub'
         });
      case 'linkedin-open':
         return res.json({
            type,
            userInput:gemResult.userInput,
            response:gemResult.response || 'Opening LinkedIn'
         });
      case 'open-multiple':
         // userInput expected to be a comma-separated list like "chatgpt, github, linkedin"
         return res.json({
            type,
            userInput:gemResult.userInput,
            response:gemResult.response || `Opening ${gemResult.userInput}`
         });

         default:
            return res.status(400).json({ response: "I didn't understand that command." })
      }
     

   } catch (error) {
  console.error('Ask assistant error:', error);
  return res.status(500).json({ response: "ask assistant error", error: error.message })
   }
}