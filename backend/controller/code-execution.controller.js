import codeExecutionService from '../services/code-execution.service.js';
import codeQueue from '../services/code.queue.js';

class CodeExecutionController {
  // Execute code using Judge0 API
  async executeCode(req, res) {
    try {
      const { sourceCode, language, input } = req.body;

      if (!sourceCode || !language) {
        return res.status(400).json({
          success: false,
          message: 'Source code and language are required'
        });
      }

      // Check if language can be executed in iframe
      if (codeExecutionService.canExecuteInIframe(language)) {
        const iframeContent = codeExecutionService.generateIframeContent(sourceCode, language);
        return res.json({
          success: true,
          type: 'iframe',
          content: iframeContent,
          message: 'Code ready for iframe execution'
        });
      }

      // Execute code using Judge0 API
      const result = await codeExecutionService.executeCode(sourceCode, language, input);
      
      res.json({
        success: true,
        type: 'api',
        result: result
      });

    } catch (error) {
      console.error('Code execution controller error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Code execution failed'
      });
    }
  }

  // Get supported languages
  async getSupportedLanguages(req, res) {
    try {
      const languages = [
        { id: 'html', name: 'HTML', extension: '.html', iframe: true },
        { id: 'css', name: 'CSS', extension: '.css', iframe: true },
        { id: 'javascript', name: 'JavaScript', extension: '.js', iframe: true },
        { id: 'typescript', name: 'TypeScript', extension: '.ts', iframe: false },
        { id: 'python', name: 'Python', extension: '.py', iframe: false },
        { id: 'java', name: 'Java', extension: '.java', iframe: false },
        { id: 'cpp', name: 'C++', extension: '.cpp', iframe: false },
        { id: 'c', name: 'C', extension: '.c', iframe: false },
        { id: 'csharp', name: 'C#', extension: '.cs', iframe: false },
        { id: 'php', name: 'PHP', extension: '.php', iframe: false },
        { id: 'ruby', name: 'Ruby', extension: '.rb', iframe: false },
        { id: 'go', name: 'Go', extension: '.go', iframe: false },
        { id: 'rust', name: 'Rust', extension: '.rs', iframe: false },
        { id: 'swift', name: 'Swift', extension: '.swift', iframe: false },
        { id: 'kotlin', name: 'Kotlin', extension: '.kt', iframe: false },
        { id: 'scala', name: 'Scala', extension: '.scala', iframe: false },
        { id: 'r', name: 'R', extension: '.r', iframe: false },
        { id: 'dart', name: 'Dart', extension: '.dart', iframe: false },
        { id: 'perl', name: 'Perl', extension: '.pl', iframe: false },
        { id: 'haskell', name: 'Haskell', extension: '.hs', iframe: false },
        { id: 'lua', name: 'Lua', extension: '.lua', iframe: false },
        { id: 'bash', name: 'Bash', extension: '.sh', iframe: false },
        { id: 'sql', name: 'SQL', extension: '.sql', iframe: false }
      ];

      res.json({
        success: true,
        languages: languages
      });

    } catch (error) {
      console.error('Get languages error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get supported languages'
      });
    }
  }

  // Enqueue async execution via Redis/BullMQ
  async enqueueExecution(req, res) {
    try {
      const { sourceCode, language, input } = req.body;
      if (!sourceCode || !language) {
        return res.status(400).json({ success: false, message: 'Source code and language are required' });
      }

      const job = await codeQueue.add('exec', { sourceCode, language, input });
      return res.json({ success: true, jobId: job.id });
    } catch (error) {
      console.error('Enqueue execution error:', error);
      res.status(500).json({ success: false, message: 'Failed to enqueue code execution' });
    }
  }

  // Check job status/result
  async getExecutionStatus(req, res) {
    try {
      const { id } = req.params;
      const job = await codeQueue.getJob(id);
      if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
      const state = await job.getState();
      const result = job.returnvalue || null;
      res.json({ success: true, state, result });
    } catch (error) {
      console.error('Get execution status error:', error);
      res.status(500).json({ success: false, message: 'Failed to get job status' });
    }
  }

  // Health check for Judge0 API
  async healthCheck(req, res) {
    try {
      // Simple health check - you can enhance this
      res.json({
        success: true,
        message: 'Code execution service is running',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Code execution service is not available'
      });
    }
  }
}

export default new CodeExecutionController();
