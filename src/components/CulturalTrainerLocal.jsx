import React, { useState, useEffect, useRef } from 'react';
import './CulturalTrainerLocal.css';
import gambianTraineeImage from '../assets/gambian-trainee.png';

const CulturalTrainerLocal = () => {
  // State variables
  console.log("CulturalTrainerLocal component rendering");
  const [clientMessages, setClientMessages] = useState([]);
  const [advisorMessages, setAdvisorMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [currentScenario, setCurrentScenario] = useState('webapp-guidelines');
  const [conversationContext, setConversationContext] = useState({
    topic: 'webapp-guidelines',
    stage: 'initial',
    previousMessages: []
  });
  const [isSessionEnded, setIsSessionEnded] = useState(false);
  const [trainingHistory, setTrainingHistory] = useState(null);
  const [trainingProgress, setTrainingProgress] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [llamaServerUrl, setLlamaServerUrl] = useState(
    process.env.NODE_ENV === 'production' 
      ? '' // You'll update this when you deploy the server
      : 'http://localhost:3001'
  );  
  const [showServerConfig, setShowServerConfig] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [isSessionStarted, setIsSessionStarted] = useState(false);

  // Refs
  const clientChatRef = useRef(null);
  const advisorChatRef = useRef(null);
  const progressRef = useRef(null);

  // Sample scenarios (these should be expanded with real content)
  const scenarios = {
    "react": {
      intro: "Hi there, we're having an issue with our React navigation component. Whenever users click on certain links, the app crashes. Can you help us troubleshoot this?",
      details: "The error specifically happens when users navigate between the dashboard and profile pages. The console shows an error about 'Cannot read property of undefined'. We've tried clearing the cache and reinstalling dependencies but that didn't help."
    },
    "angular": {
      intro: "Hello, we're experiencing an issue with data binding in our Angular application. Some fields aren't updating when the model changes. Any ideas?",
      details: "We're using Angular 15 and the issue occurs specifically in a nested component where we're displaying user profile information. The parent component seems to update correctly, but child components aren't reflecting the changes."
    },
    "javascript": {
      intro: "Hi, we're having trouble with some async functions in our JavaScript code. The promises aren't resolving in the order we expect. Could you take a look?",
      details: "We have a sequence of API calls that need to happen in a specific order, but sometimes they're completing out of order. We've tried using Promise.all but that doesn't work for our use case since we need sequential execution."
    },
    "python": {
      intro: "We need help optimizing our Python data processing scripts. They're running too slowly with larger datasets. Do you have experience with this?",
      details: "We're processing CSV files with millions of rows. The current implementation uses pandas but it's consuming too much memory. We need to find a way to process the data in chunks or optimize the existing code."
    },
    "dotnet": {
      intro: "Good morning, our .NET API endpoints are returning 500 errors intermittently. Can you help us debug this issue?",
      details: "The errors seem to happen more frequently under higher load. We've checked the logs and see some database connection timeouts, but we're not sure if that's the root cause or just a symptom of something else."
    },
    "n8n": {
      intro: "Hello, we're trying to integrate AI agents into our n8n workflows but running into some configuration issues. Have you worked with this before?",
      details: "Specifically, we're trying to use the HTTP Request nodes to connect to Claude API but we're getting authentication errors. We've double-checked our API keys and they seem correct."
    },
    "claude": {
      intro: "Hi there, we're building a tool that uses Claude 3.7 and need help with some prompt engineering techniques. Can you provide some guidance?",
      details: "We're trying to get more consistent structured output from Claude for a data extraction task. Sometimes it returns well-formatted responses and other times it includes explanatory text that breaks our parser."
    }
  };

  // Enhanced scenarios for development guidelines
  const enhancedScenarios = {
    "webapp-guidelines": {
      intro: "Hi there, I'm Jim from Acme Corp. We're looking to establish some solid development guidelines for our new web application project with Primeforge. Can you help us with best practices?",
      details: "We're particularly concerned about code quality, consistent practices across teams, and future maintainability. Our previous project became difficult to maintain as it grew, and we want to avoid those issues this time.",
      context: {
        company: "Acme Corp",
        project: "customer portal web application",
        stack: "React, Node.js, MongoDB",
        concerns: ["code quality standards", "maintainability", "consistent practices"]
      }
    },
    "mobile-integration": {
      intro: "Hello, I'm Sarah from TechFleet. We need to establish guidelines for integrating our existing web services with a new mobile app. What would you recommend?",
      details: "Our main challenges are ensuring consistent data handling between platforms, managing authentication securely, and establishing API versioning policies that won't break mobile clients.",
      context: {
        company: "TechFleet",
        project: "mobile app integration",
        stack: "Swift for iOS, Kotlin for Android, REST APIs with Express.js",
        concerns: ["API versioning", "authentication flow", "consistent data handling"]
      }
    },
    "data-pipeline": {
      intro: "Hey there, Dave from DataSphere. We're setting up development guidelines for our new data pipeline project and could use Primeforge's expertise.",
      details: "We're handling sensitive financial data that needs to be processed in real-time and stored securely. We need robust error handling, comprehensive logging, and clear data validation protocols.",
      context: {
        company: "DataSphere",
        project: "real-time financial data pipeline",
        stack: "Python, Apache Kafka, PostgreSQL, AWS",
        concerns: ["data security", "error handling", "performance optimization"]
      }
    },
    "platform-migration": {
      intro: "Good morning, this is Alex from CloudPrime. We're planning a migration from our legacy on-prem platform to cloud infrastructure. Can you help establish guidelines for this transition?",
      details: "The main challenges we foresee are maintaining service availability during migration, ensuring data integrity, and refactoring some components to be more cloud-native.",
      context: {
        company: "CloudPrime",
        project: "platform migration to cloud",
        stack: "Java backend, moving from on-prem to AWS, containerization with Docker",
        concerns: ["zero-downtime migration", "data integrity", "cloud-native refactoring"]
      }
    },
    "qa-framework": {
      intro: "Hi, Lisa from QualityFirst here. We need to establish comprehensive QA and testing guidelines for our enterprise software suite. What would you recommend?",
      details: "We've had issues with regression bugs and inconsistent test coverage. We want to implement a more systematic approach to quality assurance across our development lifecycle.",
      context: {
        company: "QualityFirst",
        project: "enterprise QA framework",
        stack: "Jest, Cypress, Jenkins, Python for test automation",
        concerns: ["test coverage", "regression testing", "CI/CD integration"]
      }
    }
  };

  // Function to handle server config submission
  const handleServerConfigSubmit = (e) => {
    e.preventDefault();
    if (llamaServerUrl.trim() !== '') {
      setShowServerConfig(false);
      loadTrainingFiles();
    }
  };

  // Function to load training files or create defaults if they don't exist
  const loadTrainingFiles = async () => {
    try {
      setIsLoading(true);
      
      let historyContent = '';
      let progressContent = '';
      let filesExist = false;
      
      try {
        // Try to load training history file from local storage first
        const savedHistory = localStorage.getItem('culturalTrainingHistory');
        const savedProgress = localStorage.getItem('culturalTrainingProgress');
        
        if (savedHistory) {
          historyContent = savedHistory;
          filesExist = true;
        }
        
        if (savedProgress) {
          progressContent = savedProgress;
          filesExist = true;
        }
      } catch (storageError) {
        console.log('Could not access local storage:', storageError);
      }
      
      // If files don't exist in local storage, use default content
      if (!filesExist) {
        historyContent = 'Cultural Training History';
        progressContent = 'Cultural Training Progress';
        
        // Save defaults to local storage
        try {
          localStorage.setItem('culturalTrainingHistory', historyContent);
          localStorage.setItem('culturalTrainingProgress', progressContent);
        } catch (storageError) {
          console.error('Could not save to local storage:', storageError);
        }
      }
      
      // Set the content in state
      setTrainingHistory(historyContent);
      setTrainingProgress(progressContent);
      
      setIsSessionStarted(true);
      setIsLoading(false);
    } catch (error) {
      console.error('Error in loadTrainingFiles:', error);
      setIsLoading(false);
      // Set default content
      setTrainingHistory('Cultural Training History');
      setTrainingProgress('Cultural Training Progress');
      setIsSessionStarted(true);
    }
  };
  
  // Function to save training files to local storage
  const saveTrainingFiles = async (historyContent, progressContent) => {
    try {
      // Save to local storage
      localStorage.setItem('culturalTrainingHistory', historyContent);
      localStorage.setItem('culturalTrainingProgress', progressContent);
      
      console.log('Training files saved successfully to local storage');
    } catch (error) {
      console.error('Error saving training files to local storage:', error);
      alert('There was an error saving your training files. Please try again.');
    }
  };
  
  // Function to make API call to AI service
  const callLlamaAPI = async (prompt, role) => {
    setApiError(null);
    
    try {
      console.log(`Calling API at ${llamaServerUrl}`);
      const response = await fetch(`${llamaServerUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: `<s>[INST] <<SYS>>\n${role}\n<</SYS>>\n\n${prompt} [/INST]`,
        })
      });
      
      if (!response.ok) {
        throw new Error(`Request failed with status code ${response.status}`);
      }
      
      const data = await response.json();
      return data.response || '';
    } catch (error) {
      console.error('Error calling API:', error);
      setApiError(error.message);
      return `API Error: ${error.message}. Please check your API connection and try again.`;
    }
  };
  
  // Function to analyze training progress and generate an updated evaluation
  const generateProgressEvaluation = async () => {
    setIsLoading(true);
    
    // Collect all feedback from the current session
    const currentSessionFeedback = advisorMessages.map(msg => msg.content).join('\n\n');
    
    // Create a prompt for the AI
    const prompt = `
    You are an AI Cultural Training Progress Evaluator. Analyze the following feedback from a cultural training session focused on US business communication.
    
    PREVIOUS TRAINING PROGRESS:
    ${trainingProgress || "No previous training progress available."}
    
    CURRENT SESSION FEEDBACK:
    ${currentSessionFeedback}
    
    Based on this feedback, generate a comprehensive progress evaluation in markdown format with the following sections:
    1. Session date (use today's date)
    2. Previous status (summarize from previous training if available)
    3. Current session evaluation (identify strengths and areas for improvement)
    4. Holistic progress analysis (compare to previous feedback if available)
    5. Recommendations for future practice
    
    Format your response as a well-structured markdown document with clear headings and bullet points.
    `;
    
    const role = `You are an AI Cultural Training Progress Evaluator that analyzes feedback from cultural training sessions and produces insightful, structured evaluations of a trainee's progress in US business communication skills.`;
    
    try {
      const evaluation = await callLlamaAPI(prompt, role);
      setIsLoading(false);
      return evaluation;
    } catch (error) {
      setIsLoading(false);
      console.error('Error generating progress evaluation:', error);
      return `Error generating progress evaluation: ${error.message}. Please check your API connection and try again.`;
    }
  };
  
  // Function to end the session, update progress evaluation, and save files
  const endSession = async () => {
    setIsSessionEnded(true);
    setIsLoading(true);
    
    // Generate the updated progress evaluation
    const updatedProgress = await generateProgressEvaluation();
    
    // Combine existing training history with current advisor messages
    let combinedHistory = trainingHistory || '';
    
    // Add new advisor messages
    advisorMessages.forEach(msg => {
      combinedHistory += '\n\n' + msg.content;
    });
    
    // Save training files to local storage
    await saveTrainingFiles(combinedHistory, updatedProgress);
    
    // Update the progress display
    setTrainingProgress(updatedProgress);
    setIsLoading(false);
  };
  
  // Function to initialize or reset a scenario
  const resetScenario = (scenarioKey) => {
    setCurrentScenario(scenarioKey);
    
    // Get the appropriate scenario
    const scenarioIntro = scenarios[scenarioKey]?.intro || enhancedScenarios[scenarioKey]?.intro;
    
    if (scenarioIntro) {
      setClientMessages([{
        sender: 'US Client',
        content: scenarioIntro
      }]);
      
      setAdvisorMessages([]);
      setConversationContext({
        topic: scenarioKey,
        stage: 'initial',
        previousMessages: []
      });
      setIsSessionEnded(false);
    }
  };
  
  // Function to evaluate user's response using AI
  const evaluateResponse = async (response, lastClientMessage) => {
    setIsLoading(true);
    
    // Determine if we're using a guidelines scenario
    const isGuidelinesScenario = Object.keys(enhancedScenarios).includes(currentScenario);
    
    // Get scenario information
    const scenario = isGuidelinesScenario ? enhancedScenarios[currentScenario] : scenarios[currentScenario];
    
    // Create a prompt for the AI
    const prompt = `
    Evaluate this response from a non-US technology trainee to a US client in a business context.
    
    SCENARIO INFORMATION:
    Type: ${isGuidelinesScenario ? 'Development Guidelines Discussion' : 'Technical Support'}
    Topic: ${scenario ? currentScenario : 'Unknown'}
    ${scenario?.context ? `Client Company: ${scenario.context.company}
    Project: ${scenario.context.project}
    Technology Stack: ${scenario.context.stack}
    Client Concerns: ${scenario.context.concerns.join(', ')}` : ''}
    
    CLIENT'S LAST MESSAGE:
    "${lastClientMessage}"
    
    TRAINEE'S RESPONSE:
    "${response}"
    
    Evaluate this response for its cultural appropriateness in US business communication. Consider:
    1. Professional tone and language
    2. Clear structure and organization
    3. Acknowledgment of client concerns
    4. Actionable recommendations (if appropriate)
    5. Appropriate questions and engagement
    6. Technical accuracy and confidence
    7. Use of collaborative language
    
    Format your evaluation with:
    1. The trainee's response (quoted)
    2. A clear evaluation label (Excellent/Good/Needs Improvement)
    3. What they did well as bullet points
    4. Areas to improve as bullet points (if any)
    5. A brief contextual note about US business culture relevance if there are areas to improve
    `;
    
    const role = `You are a Cultural Assistant specializing in US business communication standards. You help technology professionals from other cultural backgrounds improve their communication with US clients. Your feedback is constructive, specific, and educational.`;
    
    try {
      const evaluation = await callLlamaAPI(prompt, role);
      setIsLoading(false);
      return evaluation;
    } catch (error) {
      setIsLoading(false);
      console.error('Error evaluating response:', error);
      return `Error evaluating response: ${error.message}. Please check your API connection and try again.`;
    }
  };
  
  // Function to generate client response using AI
  const generateClientResponse = async (userMessage) => {
    setIsLoading(true);
    
    // Determine if we're using a guidelines scenario
    const isGuidelinesScenario = Object.keys(enhancedScenarios).includes(currentScenario);
    
    // Get scenario information
    const scenario = isGuidelinesScenario ? enhancedScenarios[currentScenario] : scenarios[currentScenario];
    
    // Build conversation history
    const conversationHistory = clientMessages.map(msg => {
      return {
        role: msg.sender === 'US Client' ? 'assistant' : 'user',
        content: msg.content
      };
    });
    
    // Add the latest user message
    conversationHistory.push({ role: 'user', content: userMessage });
    
    // Create a prompt for the AI
    const prompt = `
    You are a US client in a business context. Respond to the message from a technology professional.
    
    SCENARIO INFORMATION:
    Type: ${isGuidelinesScenario ? 'Development Guidelines Discussion' : 'Technical Support'}
    ${scenario ? `As a US client, you are: ${isGuidelinesScenario ? scenario.context.company : 'a company'} seeking ${isGuidelinesScenario ? 'development guidelines' : 'technical assistance'}.
    Topic: ${currentScenario}
    ${scenario.details ? `Additional Context: ${scenario.details}` : ''}` : ''}
    ${scenario?.context ? `Your company: ${scenario.context.company}
    Your project: ${scenario.context.project}
    Technology Stack: ${scenario.context.stack}
    Your concerns: ${scenario.context.concerns.join(', ')}` : ''}
    
    CONVERSATION HISTORY:
    ${conversationHistory.map(msg => `${msg.role === 'assistant' ? 'US CLIENT' : 'TRAINEE'}: ${msg.content}`).join('\n\n')}
    
    Respond as the US client to the trainee's last message. Your response should be:
    1. Professional but conversational in tone
    2. Focused on the specific technology or guidelines being discussed
    3. Asking follow-up questions when appropriate
    4. Showing typical US business communication patterns
    
    Your response:
    `;
    
    const role = `You are roleplaying as a US business client seeking technology assistance or development guidelines. You communicate in a way that reflects typical US business communication patterns and expectations.`;
    
    try {
      const clientResponse = await callLlamaAPI(prompt, role);
      setIsLoading(false);
      return clientResponse;
    } catch (error) {
      setIsLoading(false);
      console.error('Error generating client response:', error);
      return `Error generating response: ${error.message}. Please check your API connection and try again.`;
    }
  };
  
  // Function to get the last client message
  const getLastClientMessage = () => {
    // Filter for US Client messages and get the last one
    const clientMsgs = clientMessages.filter(msg => msg.sender === 'US Client');
    if (clientMsgs.length > 0) {
      return clientMsgs[clientMsgs.length - 1].content;
    }
    return '';
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (userInput.trim() === '' || isSessionEnded || isLoading) return;
    
    // Add user message to chat
    const newClientMessages = [
      ...clientMessages,
      { sender: 'You', content: userInput }
    ];
    setClientMessages(newClientMessages);
    
    // Store user input before clearing
    const currentInput = userInput;
    
    // Clear input field immediately
    setUserInput('');
    
    // Get the last client message for context
    const lastClientMessage = getLastClientMessage();
    
    // Generate cultural advisor feedback with context
    const advisorFeedback = await evaluateResponse(currentInput, lastClientMessage);
    setAdvisorMessages([...advisorMessages, { content: advisorFeedback }]);
    
    // Generate contextual US client response
    const clientResponse = await generateClientResponse(currentInput);
    setClientMessages(prevMessages => [...prevMessages, { 
      sender: 'US Client', 
      content: clientResponse 
    }]);
  };
  
  // Handle key press (Enter to submit, Shift+Enter for new line)
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Format markdown to HTML for display
  const formatMarkdown = (markdown) => {
    if (!markdown) return '';
    
    // Simple markdown to HTML conversion for headings and lists
    return markdown
      .replace(/^# (.*)$/gm, '<h1>$1</h1>')
      .replace(/^## (.*)$/gm, '<h2>$1</h2>')
      .replace(/^### (.*)$/gm, '<h3>$1</h3>')
      .replace(/^\* (.*)$/gm, '<li>$1</li>')
      .replace(/^- (.*)$/gm, '<li>$1</li>')
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n/g, '<br/>');
  };
  
  // Initialize with default scenario after loading files
  useEffect(() => {
    if (isSessionStarted) {
      resetScenario('webapp-guidelines');
    }
  }, [isSessionStarted]);
  
  // Scroll to bottom of chat windows when messages change
  useEffect(() => {
    if (clientChatRef.current) {
      clientChatRef.current.scrollTop = clientChatRef.current.scrollHeight;
    }
    
    if (advisorChatRef.current) {
      advisorChatRef.current.scrollTop = advisorChatRef.current.scrollHeight;
    }
    
    if (progressRef.current) {
      progressRef.current.scrollTop = 0; // Keep progress at the top
    }
  }, [clientMessages, advisorMessages, trainingProgress]);

  return (
    <div className="app-container">
      <h1 className="app-title">Cultural Technology Assistant Local</h1>
      
      <div className="image-container">
        <img 
          src={gambianTraineeImage} 
          alt="Gambian trainee interacting with AI assistant" 
          className="header-image"
        />
      </div>
      
      {showServerConfig ? (
        <div className="server-config-container">
          <h2>AI Model Configuration</h2>
          <p>Please confirm the API endpoint URL:</p>
          <form onSubmit={handleServerConfigSubmit}>
            <input 
              type="text" 
              value={llamaServerUrl}
              onChange={(e) => setLlamaServerUrl(e.target.value)}
              placeholder="http://localhost:3001"
              className="server-url-input"
            />
            <button type="submit" className="server-url-submit">Start Training</button>
          </form>
          <div className="server-setup-instructions">
            <h3>System Information:</h3>
            <p>This application uses the Mistral-7B-Instruct language model hosted on Hugging Face's API platform.</p>
            <p>Your Express server proxies the requests to this cloud-hosted model.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="instructions-section">
            <h2 className="instructions-title">Instructions</h2>
            <p className="instructions-text">
              This tool simulates conversations with US clients to help technology trainees improve their cultural and language fit. 
              Respond to the client messages as you would in a real situation. After each response, 
              the Cultural Assistant will provide feedback on your communication style and technical approach.
            </p>
          </div>
          
          <div className="file-controls">
            <span className="file-status">
              {trainingHistory !== null ? 'Training history loaded ✓' : 'Training history will be loaded when session starts'}
            </span>
            
            <span className="file-status">
              {trainingProgress !== null ? 'Progress evaluation loaded ✓' : 'Progress evaluation will be loaded when session starts'}
            </span>
          </div>
          
          <div className="scenario-selector">
            <label htmlFor="scenario-select">Select scenario: </label>
            <select 
              id="scenario-select"
              value={currentScenario}
              onChange={(e) => setCurrentScenario(e.target.value)}
              disabled={isSessionEnded || isLoading}
            >
              <optgroup label="Development Guidelines Scenarios">
                <option value="webapp-guidelines">Web App Development Guidelines</option>
                <option value="mobile-integration">Mobile App Integration Guidelines</option>
                <option value="data-pipeline">Data Pipeline Guidelines</option>
                <option value="platform-migration">Platform Migration Guidelines</option>
                <option value="qa-framework">QA Framework Guidelines</option>
              </optgroup>
              <optgroup label="Technical Support Scenarios">
                <option value="react">React Navigation Component Issue</option>
                <option value="angular">Angular Data Binding Issue</option>
                <option value="javascript">JavaScript Async Function Problems</option>
                <option value="python">Python Data Processing Optimization</option>
                <option value="dotnet">.NET API Endpoint Errors</option>
                <option value="n8n">n8n AI Agent Workflow Integration</option>
                <option value="claude">Claude 3.7 AI Agent Prompt Engineering</option>
              </optgroup>
            </select>
            <button 
              className="scenario-btn"
              onClick={() => resetScenario(currentScenario)}
              disabled={isSessionEnded || isLoading}
            >
              New Scenario
            </button>
          </div>
          
          <div className="chat-container">
            {/* Client chat window */}
            <div className="client-section">
              <div className="client-chat-window">
                <div className="window-header">Chat with US Client</div>
                <div 
                  ref={clientChatRef}
                  className="chat-history"
                >
                  {clientMessages.map((msg, index) => (
                    <div key={index} className="chat-message">
                      <span className="message-sender">{msg.sender}: </span>
                      <span>{msg.content}</span>
                    </div>
                  ))}
                  {isLoading && <div className="loading-indicator">Client is typing...</div>}
                </div>
                
                <form onSubmit={handleSubmit} className="input-form">
                  <textarea
                    className="user-input"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type your response here..."
                    disabled={isSessionEnded || isLoading}
                  />
                  <button 
                    type="submit" 
                    className="submit-btn"
                    disabled={isSessionEnded || isLoading}
                  >
                    {isLoading ? "Processing..." : "Submit"}
                  </button>
                </form>
              </div>
            </div>
            
            {/* Assistant windows */}
            <div className="assistants-container">
              {/* Cultural advisor window */}
              <div className="advisor-window">
                <div className="window-header">Cultural Assistant Suggestions</div>
                <div
                  ref={advisorChatRef}
                  className="chat-history"
                >
                  {advisorMessages.map((msg, index) => (
                    <div key={index} className="advisor-feedback">
                      {msg.content}
                    </div>
                  ))}
                  {apiError && <div className="error-message">{apiError}</div>}
                </div>
                
                <div className="download-section">
                  <button 
                    className="download-btn"
                    onClick={endSession}
                    disabled={isSessionEnded || isLoading || advisorMessages.length === 0}
                  >
                    {isLoading ? "Processing..." : isSessionEnded ? "Session Ended" : "End Session"}
                  </button>
                </div>
              </div>
              
              {/* Progress evaluation window */}
              <div className="progress-window">
                <div className="window-header">Cultural Training Progress</div>
                <div
                  ref={progressRef}
                  className="progress-content"
                  dangerouslySetInnerHTML={{ __html: formatMarkdown(trainingProgress) }}
                >
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CulturalTrainerLocal;