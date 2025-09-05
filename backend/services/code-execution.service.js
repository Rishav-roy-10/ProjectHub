import axios from 'axios';

class CodeExecutionService {
  constructor() {
    // Judge0 API configuration
    this.judge0ApiUrl = 'https://judge0-ce.p.rapidapi.com';
    this.rapidApiKey = process.env.RAPIDAPI_KEY || 'demo-key'; // You'll need to set this in .env
    this.rapidApiHost = 'judge0-ce.p.rapidapi.com';
    
    // Language ID mapping for Judge0 API
    this.languageMap = {
      'python': 71,      // Python 3.8.1
      'python3': 71,     // Python 3.8.1
      'py': 71,          // Python 3.8.1
      'javascript': 63,  // JavaScript (Node.js 12.14.0)
      'js': 63,          // JavaScript (Node.js 12.14.0)
      'java': 62,        // Java (OpenJDK 13.0.1)
      'cpp': 54,         // C++ (GCC 9.2.0)
      'c++': 54,         // C++ (GCC 9.2.0)
      'c': 50,           // C (GCC 9.2.0)
      'csharp': 51,      // C# (Mono 6.6.0.161)
      'cs': 51,          // C# (Mono 6.6.0.161)
      'php': 68,         // PHP 7.4.1
      'ruby': 72,        // Ruby 2.7.0
      'go': 60,          // Go 1.13.5
      'rust': 73,        // Rust 1.40.0
      'swift': 83,       // Swift 5.2.3
      'kotlin': 78,      // Kotlin 1.3.70
      'scala': 81,       // Scala 2.13.2
      'r': 80,           // R 4.0.0
      'dart': 87,        // Dart 2.7.2
      'typescript': 74,  // TypeScript 3.7.4
      'ts': 74,          // TypeScript 3.7.4
      'perl': 85,        // Perl 5.28.1
      'haskell': 61,     // Haskell 8.8.1
      'lua': 64,         // Lua 5.3.5
      'bash': 46,        // Bash 5.0.0
      'sh': 46,          // Bash 5.0.0
      'sql': 82,         // SQL (SQLite 3.27.2)
      'mysql': 82,       // SQL (SQLite 3.27.2)
      'postgresql': 82   // SQL (SQLite 3.27.2)
    };
  }

  // Get language ID from file extension or language name
  getLanguageId(language) {
    const lang = language.toLowerCase();
    return this.languageMap[lang] || this.languageMap['javascript']; // Default to JavaScript
  }

  // Execute code using Judge0 API
  async executeCode(sourceCode, language, input = '') {
    try {
      const languageId = this.getLanguageId(language);
      
      // Create submission
      const createResponse = await axios.post(
        `${this.judge0ApiUrl}/submissions`,
        {
          source_code: sourceCode,
          language_id: languageId,
          stdin: input
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-RapidAPI-Key': this.rapidApiKey,
            'X-RapidAPI-Host': this.rapidApiHost
          }
        }
      );

      if (!createResponse.data.token) {
        throw new Error('Failed to create submission');
      }

      const token = createResponse.data.token;
      
      // Wait for execution to complete
      let result;
      let attempts = 0;
      const maxAttempts = 30; // Wait up to 30 seconds
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        
        const getResponse = await axios.get(
          `${this.judge0ApiUrl}/submissions/${token}`,
          {
            headers: {
              'X-RapidAPI-Key': this.rapidApiKey,
              'X-RapidAPI-Host': this.rapidApiHost
            }
          }
        );

        result = getResponse.data;
        
        if (result.status && result.status.id > 2) { // Status > 2 means execution completed
          break;
        }
        
        attempts++;
      }

      if (!result) {
        throw new Error('Execution timeout');
      }

      // Process the result
      return this.processExecutionResult(result);
      
    } catch (error) {
      console.error('Code execution error:', error);
      throw new Error(`Code execution failed: ${error.message}`);
    }
  }

  // Process the execution result from Judge0
  processExecutionResult(result) {
    const status = result.status;
    const output = {
      success: false,
      output: '',
      error: '',
      executionTime: '',
      memory: '',
      status: 'Unknown'
    };

    // Check execution status
    if (status.id === 3) { // Accepted
      output.success = true;
      output.status = 'Success';
      output.output = result.stdout || '';
      output.executionTime = result.time || '';
      output.memory = result.memory || '';
    } else if (status.id === 4) { // Wrong Answer
      output.success = false;
      output.status = 'Wrong Answer';
      output.output = result.stdout || '';
      output.error = result.stderr || '';
      output.executionTime = result.time || '';
      output.memory = result.memory || '';
    } else if (status.id === 5) { // Time Limit Exceeded
      output.success = false;
      output.status = 'Time Limit Exceeded';
      output.error = 'Execution took too long';
    } else if (status.id === 6) { // Compilation Error
      output.success = false;
      output.status = 'Compilation Error';
      output.error = result.compile_output || result.stderr || 'Compilation failed';
    } else if (status.id === 7) { // Runtime Error
      output.success = false;
      output.status = 'Runtime Error';
      output.error = result.stderr || 'Runtime error occurred';
      output.output = result.stdout || '';
    } else {
      output.success = false;
      output.status = status.description || 'Unknown Error';
      output.error = result.stderr || 'Execution failed';
      output.output = result.stdout || '';
    }

    return output;
  }

  // Check if a language can be executed in iframe (HTML, CSS, JS)
  canExecuteInIframe(language) {
    const iframeLanguages = ['html', 'css', 'javascript', 'js'];
    return iframeLanguages.includes(language.toLowerCase());
  }

  // Generate HTML wrapper for iframe execution
  generateIframeContent(sourceCode, language) {
    const lang = language.toLowerCase();
    
    if (lang === 'html' || lang === 'htm') {
      return sourceCode;
    } else if (lang === 'css') {
      return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>CSS Preview</title>
          <style>${sourceCode}</style>
        </head>
        <body>
          <div class="demo-content">
            <h1>CSS Preview</h1>
            <p>This is a demo paragraph to show your CSS styles.</p>
            <button class="demo-button">Demo Button</button>
            <div class="demo-box">Demo Box</div>
            <div class="demo-card">
              <h3>Demo Card</h3>
              <p>This card demonstrates various CSS properties.</p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else if (lang === 'javascript' || lang === 'js') {
      return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>JavaScript Preview</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
            #output { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .error { color: #dc2626; background: #fef2f2; padding: 10px; border-radius: 4px; border-left: 4px solid #dc2626; }
            .success { color: #059669; background: #f0fdf4; padding: 10px; border-radius: 4px; border-left: 4px solid #059669; }
            .warning { color: #d97706; background: #fffbeb; padding: 10px; border-radius: 4px; border-left: 4px solid #d97706; }
            .info { color: #2563eb; background: #eff6ff; padding: 10px; border-radius: 4px; border-left: 4px solid #2563eb; }
            .console { background: #1f2937; color: #f9fafb; padding: 10px; border-radius: 4px; font-family: monospace; margin-top: 10px; }
            .console div { margin: 2px 0; }
            .console .log { color: #10b981; }
            .console .error { color: #ef4444; }
            .console .warn { color: #f59e0b; }
            .console .info { color: #3b82f6; }
          </style>
        </head>
        <body>
          <div id="output">
            <h2>JavaScript Output</h2>
            <div id="result"></div>
            <div id="console" class="console"></div>
          </div>
          <script>
            // Override console methods to capture output
            const originalLog = console.log;
            const originalError = console.error;
            const originalWarn = console.warn;
            const originalInfo = console.info;
            
            const consoleDiv = document.getElementById('console');
            const resultDiv = document.getElementById('result');
            
            function addToConsole(message, type = 'log') {
              const div = document.createElement('div');
              div.className = type;
              div.textContent = \`[\${type.toUpperCase()}] \${message}\`;
              consoleDiv.appendChild(div);
            }
            
            console.log = (...args) => {
              originalLog.apply(console, args);
              addToConsole(args.join(' '), 'log');
            };
            
            console.error = (...args) => {
              originalError.apply(console, args);
              addToConsole(args.join(' '), 'error');
            };
            
            console.warn = (...args) => {
              originalWarn.apply(console, args);
              addToConsole(args.join(' '), 'warn');
            };
            
            console.info = (...args) => {
              originalInfo.apply(console, args);
              addToConsole(args.join(' '), 'info');
            }
            
            // Check if code contains Node.js specific syntax
            const code = \`${sourceCode}\`;
            const nodeJsPatterns = [
              'require(', 'module.exports', 'exports.', 'process.', 'Buffer', 'global.',
              '__dirname', '__filename', 'setImmediate', 'clearImmediate'
            ];
            
            const hasNodeJsCode = nodeJsPatterns.some(pattern => code.includes(pattern));
            
            if (hasNodeJsCode) {
              resultDiv.innerHTML = \`
                <div class="warning">
                  <strong>⚠️ Node.js Code Detected</strong><br>
                  This code contains Node.js-specific features that won't work in the browser.<br>
                  <br>
                  <strong>Detected patterns:</strong><br>
                  \${nodeJsPatterns.filter(pattern => code.includes(pattern)).map(p => '• ' + p).join('<br>')}
                  <br><br>
                  <strong>Solutions:</strong><br>
                  • Use browser-compatible JavaScript<br>
                  • Replace \`require()\` with ES6 imports<br>
                  • Use browser APIs instead of Node.js APIs
                </div>
              \`;
              addToConsole('Node.js code detected - some features may not work in browser', 'warn');
            } else {
              try {
                // Execute the JavaScript code
                eval(code);
                addToConsole('Code executed successfully', 'success');
              } catch (error) {
                resultDiv.innerHTML = \`<div class="error"><strong>❌ JavaScript Error:</strong> \${error.message}</div>\`;
                addToConsole(\`Error: \${error.message}\`, 'error');
              }
            }
          </script>
        </body>
        </html>
      `;
    }
    
    return sourceCode;
  }
}

export default new CodeExecutionService();
