// Quick test script to verify the fallback logic for "open github and linkedin"
import geminiResponse from "./backend/gemini.js";

// Test the fallback response generator directly (same logic as backend)
const generateFallbackResponse = (command, assistantName, userName) => {
  const cmd = command.toLowerCase().replace(assistantName.toLowerCase(), '').trim();
  
  let type = 'general';
  let response = `I'm not sure how to help with that. Please try again.`;
  
  // Multiple opens (when user says "open X and Y")
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

  return JSON.stringify({
    type,
    userInput: cmd,
    response
  });
};

// Test cases
const testCases = [
  { command: "alexa open github and linkedin", assistantName: "alexa", userName: "test" },
  { command: "hey alexa open github and my linkedin", assistantName: "alexa", userName: "test" },
  { command: "alexa open chatgpt and github and linkedin", assistantName: "alexa", userName: "test" },
  { command: "open github", assistantName: "alexa", userName: "test" },
  { command: "open linkedin", assistantName: "alexa", userName: "test" },
];

console.log("Testing fallback logic:\n");
testCases.forEach((testCase, index) => {
  const result = generateFallbackResponse(testCase.command, testCase.assistantName, testCase.userName);
  console.log(`Test ${index + 1}:`);
  console.log(`  Command: "${testCase.command}"`);
  console.log(`  Result: ${result}\n`);
});
