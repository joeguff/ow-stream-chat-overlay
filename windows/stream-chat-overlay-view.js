import { DragService } from '../scripts/services/drag-service.js';
import { DragResizeService } from '../scripts/services/drag-resize-service.js';
import { GoogleAnalytics } from '../scripts/services/google-analytics.js';
import { WindowsService } from '../scripts/services/windows-service.js';
window.onerror = function (msg, url, lineNo, columnNo, error) {
  // ... handle error ...
  var e = {
    msg: msg
    ,url: url
    ,lineNo: lineNo
    ,columnNo: columnNo
    ,error: error
  }
  alert(JSON.stringify(e));
  return false;
}

export class StreamChatOverlayView {
  constructor() {
    // Page elements:
    this._closeButton = document.getElementById('closeButton');
    this._minimizeButton = document.getElementById('minimizeButton');
    this._maximizeButton = document.getElementById('maximizeButton');
    this._moveButton = document.getElementById('moveButton');
    this._resizeButton = document.getElementById('resizeButton');
    this._header = document.getElementsByClassName('app-header')[0];
    this._version = document.getElementById('version');
    this._ga = new GoogleAnalytics();
    this._dragService = null;

    // Initialize
    this.init();
  }

  init() {
    // Close window on X button click
    if (this._closeButton) {
      this._closeButton.addEventListener('click', async () => {
        const { window } = await WindowsService.getCurrentWindow();
        await WindowsService.close(window.name);
      });
    }
    // Listen to minimize click
    if (this._minimizeButton) {
      this._minimizeButton.addEventListener('click', async () => {
        const { window } = await WindowsService.getCurrentWindow();
        await WindowsService.minimize(window.name);
      });
    }
    // Check if there is a maximize button
    if (this._maximizeButton) {
      // Listen to maximize click
      this._maximizeButton.addEventListener(
        'click',
        function() {
          $("#slider-row").toggle();
          if (!$("#slider-row").is(':visible')) {
            $('#chat-embed').height($("#chat-panel").height()+'px');
          }
          //StreamChatOverlayView._toggleWindowMaximize();
        }
        
      );
      // Allow maximizing a window with doubleclick
      if (this._header) {
        this._header.addEventListener(
          'dblclick',
          StreamChatOverlayView._toggleWindowMaximize
        );
      }
    }

    // Prevent window dragging when you click on buttons
    try {
      this._closeButton.addEventListener(
        'mousedown',
        StreamChatOverlayView._stopEventPropagation
      );

    this._minimizeButton.addEventListener(
      'mousedown',
      StreamChatOverlayView._stopEventPropagation
    );
    } catch(e) {
      
    }

    if (this._maximizeButton) {
      this._maximizeButton.addEventListener(
        'mousedown',
        StreamChatOverlayView._stopEventPropagation
      );
    }

    // Enable dragging on this window
    WindowsService.getCurrentWindow().then(({ window }) => {
      this._dragService = new DragService(window, this._moveButton);
    });
    WindowsService.getCurrentWindow().then(({ window }) => {
      this._dragResizeService = new DragResizeService(window, this._resizeButton);
    });


    // Display version
    overwolf.extensions.current.getManifest(manifest => {
      if (this._version) {
        this._version.textContent = `Version ${manifest.meta.version}`;
      }
    });

    this._ga.start();
    this._ga.ga('send', 'pageview');
  }

  static async _toggleWindowMaximize() {
    const { window } = await WindowsService.getCurrentWindow();

    if (window.stateEx === 'maximized') {
      await WindowsService.restore(window.name);
    } else if (window.stateEx === 'normal') {
      await WindowsService.maximize(window.name);
    }
  }

  static _stopEventPropagation(e) {
    e.stopPropagation();
  }
}
