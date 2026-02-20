import { Router, Request, Response } from 'express';
import archiver from 'archiver';
import db from '../db';
import { Exercise } from '../models';

const router = Router();

function generateImsManifest(exercise: Exercise): string {
  const safeTitle = exercise.title.replace(/[&<>"']/g, c => {
    const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return map[c] || c;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="exercise-${exercise.id}" version="1.0"
  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd
    http://www.imsglobal.org/xsd/imsmd_rootv1p2p1 imsmd_rootv1p2p1.xsd
    http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="org-1">
    <organization identifier="org-1">
      <title>${safeTitle}</title>
      <item identifier="item-1" identifierref="res-1">
        <title>${safeTitle}</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="res-1" type="webcontent" adlcp:scormtype="sco" href="index.html">
      <file href="index.html"/>
      <file href="scorm-api.js"/>
    </resource>
  </resources>
</manifest>`;
}

function generateScormApi(): string {
  return `// SCORM 1.2 API Wrapper
var SCORM = {
  api: null,
  initialized: false,

  findAPI: function(win) {
    var tries = 0;
    while (win && !win.API && tries < 10) {
      if (win.parent && win.parent !== win) {
        win = win.parent;
      } else if (win.opener) {
        win = win.opener;
      } else {
        break;
      }
      tries++;
    }
    return win && win.API ? win.API : null;
  },

  init: function() {
    this.api = this.findAPI(window);
    if (this.api) {
      this.api.LMSInitialize("");
      this.initialized = true;
      this.api.LMSSetValue("cmi.core.lesson_status", "incomplete");
      this.api.LMSCommit("");
    }
  },

  complete: function() {
    if (this.api) {
      this.api.LMSSetValue("cmi.core.lesson_status", "completed");
      this.api.LMSCommit("");
    }
  },

  finish: function() {
    if (this.api) {
      this.api.LMSFinish("");
    }
  }
};
`;
}

function generateScormHtml(exercise: Exercise, apiBaseUrl: string): string {
  const safeTitle = exercise.title.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const exerciseConfig = JSON.stringify({
    id: exercise.id,
    title: exercise.title,
    description: exercise.description,
    end_condition_type: exercise.end_condition_type,
    end_condition_value: exercise.end_condition_value,
    feedback_type: exercise.feedback_type,
    feedback_message: exercise.feedback_message,
    video_url: exercise.video_url,
    apiBaseUrl,
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle}</title>
  <script src="scorm-api.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; height: 100vh; display: flex; flex-direction: column; }
    .header { background: #1a1a2e; color: white; padding: 16px 24px; }
    .header h1 { font-size: 18px; margin-bottom: 4px; }
    .header p { font-size: 13px; opacity: 0.8; }
    .chat-container { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 12px; }
    .message { max-width: 75%; padding: 12px 16px; border-radius: 12px; line-height: 1.5; font-size: 14px; white-space: pre-wrap; word-wrap: break-word; }
    .message.user { align-self: flex-end; background: #0066cc; color: white; border-bottom-right-radius: 4px; }
    .message.assistant { align-self: flex-start; background: white; color: #333; border-bottom-left-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .input-area { padding: 16px; background: white; border-top: 1px solid #e0e0e0; display: flex; gap: 8px; }
    .input-area input { flex: 1; padding: 12px 16px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; }
    .input-area input:focus { border-color: #0066cc; }
    .input-area button { padding: 12px 24px; background: #0066cc; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500; }
    .input-area button:hover { background: #0052a3; }
    .input-area button:disabled { background: #ccc; cursor: not-allowed; }
    .completion-panel { padding: 24px; background: white; border-top: 2px solid #00c853; text-align: center; }
    .completion-panel h2 { color: #00c853; margin-bottom: 12px; font-size: 20px; }
    .completion-panel .feedback { text-align: left; background: #f8f9fa; padding: 16px; border-radius: 8px; margin: 12px 0; font-size: 14px; line-height: 1.6; white-space: pre-wrap; }
    .completion-panel video, .completion-panel iframe { max-width: 100%; margin-top: 16px; border-radius: 8px; }
    .typing { align-self: flex-start; background: white; padding: 12px 16px; border-radius: 12px; border-bottom-left-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .typing span { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #ccc; margin: 0 2px; animation: bounce 1.4s infinite; }
    .typing span:nth-child(2) { animation-delay: 0.2s; }
    .typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes bounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-6px); } }
    .hidden { display: none !important; }
  </style>
</head>
<body>
  <div class="header">
    <h1 id="exerciseTitle"></h1>
    <p id="exerciseDesc"></p>
  </div>
  <div class="chat-container" id="chatContainer"></div>
  <div class="input-area" id="inputArea">
    <input type="text" id="messageInput" placeholder="Type your message..." autocomplete="off" />
    <button id="sendBtn" onclick="sendMessage()">Send</button>
  </div>
  <div class="completion-panel hidden" id="completionPanel">
    <h2>Exercise Complete!</h2>
    <div class="feedback" id="feedbackText"></div>
    <div id="videoContainer"></div>
  </div>

  <script>
    var config = ${exerciseConfig};
    var messages = [];
    var isComplete = false;

    document.getElementById('exerciseTitle').textContent = config.title;
    document.getElementById('exerciseDesc').textContent = config.description;

    SCORM.init();

    document.getElementById('messageInput').addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    function addMessageToUI(role, content) {
      var container = document.getElementById('chatContainer');
      var div = document.createElement('div');
      div.className = 'message ' + role;
      div.textContent = content;
      container.appendChild(div);
      container.scrollTop = container.scrollHeight;
    }

    function showTyping() {
      var container = document.getElementById('chatContainer');
      var div = document.createElement('div');
      div.className = 'typing';
      div.id = 'typingIndicator';
      div.innerHTML = '<span></span><span></span><span></span>';
      container.appendChild(div);
      container.scrollTop = container.scrollHeight;
    }

    function hideTyping() {
      var el = document.getElementById('typingIndicator');
      if (el) el.remove();
    }

    function showCompletion(feedback, videoUrl) {
      document.getElementById('inputArea').classList.add('hidden');
      var panel = document.getElementById('completionPanel');
      panel.classList.remove('hidden');

      if (feedback) {
        document.getElementById('feedbackText').textContent = feedback;
      }

      if (videoUrl) {
        var container = document.getElementById('videoContainer');
        if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
          var videoId = videoUrl.includes('youtu.be')
            ? videoUrl.split('/').pop()
            : new URL(videoUrl).searchParams.get('v');
          container.innerHTML = '<iframe width="560" height="315" src="https://www.youtube.com/embed/' + videoId + '" frameborder="0" allowfullscreen></iframe>';
        } else {
          container.innerHTML = '<video controls src="' + videoUrl + '"></video>';
        }
      }

      SCORM.complete();
      SCORM.finish();
    }

    async function sendMessage() {
      if (isComplete) return;

      var input = document.getElementById('messageInput');
      var text = input.value.trim();
      if (!text) return;

      input.value = '';
      document.getElementById('sendBtn').disabled = true;

      messages.push({ role: 'user', content: text });
      addMessageToUI('user', text);
      showTyping();

      try {
        var resp = await fetch(config.apiBaseUrl + '/api/chat/' + config.id, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: messages }),
        });

        if (!resp.ok) throw new Error('API error');

        var data = await resp.json();
        hideTyping();

        messages.push({ role: 'assistant', content: data.message });
        addMessageToUI('assistant', data.message);

        if (data.isComplete) {
          isComplete = true;
          showCompletion(data.feedback, data.videoUrl);
        }
      } catch (err) {
        hideTyping();
        addMessageToUI('assistant', 'Sorry, something went wrong. Please try again.');
      }

      document.getElementById('sendBtn').disabled = false;
      input.focus();
    }
  </script>
</body>
</html>`;
}

// Export exercise as SCORM package
router.get('/:id', (req: Request, res: Response) => {
  const exercise = db.prepare('SELECT * FROM exercises WHERE id = ?').get(req.params.id) as Exercise | undefined;
  if (!exercise) {
    res.status(404).json({ error: 'Exercise not found' });
    return;
  }

  const apiBaseUrl = req.query.apiBaseUrl as string || `${req.protocol}://${req.get('host')}`;

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="exercise-${exercise.id}.zip"`);

  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.pipe(res);

  archive.append(generateImsManifest(exercise), { name: 'imsmanifest.xml' });
  archive.append(generateScormApi(), { name: 'scorm-api.js' });
  archive.append(generateScormHtml(exercise, apiBaseUrl), { name: 'index.html' });

  archive.finalize();
});

export default router;
