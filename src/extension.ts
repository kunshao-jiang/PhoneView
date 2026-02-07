import * as vscode from 'vscode';

// 存储WebView面板的全局变量
let browserPanel: vscode.WebviewPanel | undefined;

// 浏览器视图提供程序
class BrowserViewProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;

    constructor(private readonly _extensionUri: vscode.Uri) {}

    resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
            enableCommandUris: true
        };

        // 设置WebView内容
        webviewView.webview.html = this.getHtmlForWebview();

        // 监听消息
        webviewView.webview.onDidReceiveMessage(data => {
            switch (data.type) {
                case 'navigate':
                    this.navigateToUrl(data.url);
                    break;
                case 'toggleSidebar':
                    this.toggleSidebar();
                    break;
            }
        });
    }

    // 获取WebView的HTML内容
    private getHtmlForWebview(): string {
        return `<!DOCTYPE html>
        <html lang="zh-CN">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
            <title>PhoneView 预览器</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                :root {
                    --vscode-editor-background: var(--vscode-editor-background, #1e1e1e);
                    --vscode-editor-foreground: var(--vscode-editor-foreground, #cccccc);
                    --vscode-editor-border: var(--vscode-editor-border, #3c3c3c);
                    --vscode-button-background: var(--vscode-button-background, #0e639c);
                    --vscode-button-foreground: var(--vscode-button-foreground, #ffffff);
                    --vscode-button-hoverBackground: var(--vscode-button-hoverBackground, #1177bb);
                    --vscode-input-background: var(--vscode-input-background, #3c3c3c);
                    --vscode-input-foreground: var(--vscode-input-foreground, #cccccc);
                    --vscode-input-border: var(--vscode-input-border, #3c3c3c);
                    --vscode-input-placeholderForeground: var(--vscode-input-placeholderForeground, #6c6c6c);
                    --vscode-dropdown-background: var(--vscode-dropdown-background, #3c3c3c);
                    --vscode-dropdown-foreground: var(--vscode-dropdown-foreground, #cccccc);
                    --vscode-dropdown-border: var(--vscode-dropdown-border, #3c3c3c);
                    --vscode-widget-background: var(--vscode-widget-background, #252526);
                    --vscode-widget-foreground: var(--vscode-widget-foreground, #cccccc);
                    --vscode-widget-border: var(--vscode-widget-border, #3c3c3c);
                }
                
                body {
                    font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif);
                    background-color: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    min-width: 450px;
                }
                
                .main-container {
                    flex: 1;
                    display: flex;
                    overflow: hidden;
                }
                
                .left-toolbar {
                    width: 40px;
                    background-color: var(--vscode-widget-background);
                    border-right: 1px solid var(--vscode-widget-border);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 8px 0;
                    gap: 4px;
                    flex-shrink: 0;
                }
                
                .toolbar-button {
                    width: 32px;
                    height: 32px;
                    padding: 0;
                    border: 1px solid transparent;
                    border-radius: 4px;
                    background-color: transparent;
                    color: var(--vscode-editor-foreground);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                    transition: all 0.2s;
                }
                
                .toolbar-button:hover {
                    background-color: var(--vscode-widget-border);
                }
                
                .toolbar-button:active {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                }
                
                .toolbar-button.active {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                }
                
                .toolbar-divider {
                    width: 24px;
                    height: 1px;
                    background-color: var(--vscode-widget-border);
                    margin: 4px 0;
                }
                
                .toolbox-container {
                    position: relative;
                }
                
                .toolbox-menu {
                    position: absolute;
                    left: 0;
                    top: 100%;
                    margin-top: 8px;
                    background-color: var(--vscode-widget-background);
                    border: 1px solid var(--vscode-widget-border);
                    border-radius: 4px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                    min-width: 40px;
                    z-index: 1000;
                    opacity: 0;
                    transform: scaleY(0);
                    transform-origin: top;
                    transition: opacity 0.2s ease, transform 0.2s ease;
                    padding: 4px;
                    pointer-events: none;
                }
                
                .toolbox-menu.show {
                    opacity: 1;
                    transform: scaleY(1);
                    pointer-events: auto;
                }
                
                .toolbox-item {
                    width: 100%;
                    padding: 8px 12px;
                    border: none;
                    border-radius: 2px;
                    background-color: transparent;
                    color: var(--vscode-editor-foreground);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                    text-align: center;
                }
                
                .toolbox-item:hover {
                    background-color: var(--vscode-widget-border);
                }
                
                .toolbox-item.active {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                }
                
                .header {
                    padding: 8px 12px;
                    background-color: var(--vscode-widget-background);
                    border-bottom: 1px solid var(--vscode-widget-border);
                    display: flex;
                    gap: 8px;
                    align-items: center;
                }
                
                .url-input {
                    flex: 1;
                    padding: 6px 12px;
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 2px;
                    font-size: 13px;
                    background-color: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    outline: none;
                }
                
                .url-input:focus {
                    border-color: var(--vscode-button-background);
                }
                
                .url-input::placeholder {
                    color: var(--vscode-input-placeholderForeground);
                }
                
                .btn {
                    padding: 6px 12px;
                    border: none;
                    border-radius: 2px;
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 500;
                    outline: none;
                }
                
                .btn:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                
                .btn-secondary {
                    background-color: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                }
                
                .btn-secondary:hover {
                    background-color: var(--vscode-widget-border);
                }
                
                .controls {
                    padding: 8px 12px;
                    background-color: var(--vscode-widget-background);
                    border-top: 1px solid var(--vscode-widget-border);
                    display: flex;
                    gap: 12px;
                    align-items: center;
                    flex-wrap: wrap;
                }
                
                .control-group:first-child {
                    flex: 1;
                    min-width: 200px;
                }
                
                .url-input {
                    width: 100%;
                    padding: 4px 8px;
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 2px;
                    font-size: 12px;
                    background-color: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    outline: none;
                }
                
                .url-input:focus {
                    border-color: var(--vscode-button-background);
                }
                
                .control-group {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                
                .control-group label {
                    font-size: 12px;
                    color: var(--vscode-widget-foreground);
                    font-weight: 500;
                }
                
                .control-group select {
                    padding: 4px 8px;
                    border: 1px solid var(--vscode-dropdown-border);
                    border-radius: 2px;
                    font-size: 12px;
                    background-color: var(--vscode-dropdown-background);
                    color: var(--vscode-dropdown-foreground);
                    outline: none;
                    cursor: pointer;
                }
                
                .control-group select:hover {
                    border-color: var(--vscode-button-background);
                }
                
                .control-group select:focus {
                    border-color: var(--vscode-button-background);
                }
                
                .preview-container {
                    flex: 1;
                    padding: 10px;
                    overflow: visible;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    border: 1px solid var(--vscode-widget-border);
                    margin: 8px;
                    border-radius: 4px;
                    direction: rtl;
                    position: relative;
                }
                
                .preview-container > * {
                    direction: ltr;
                }
                
                .device-frame {
                    width: 375px;
                    height: 812px;
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
                    border-radius: 12px;
                    overflow: auto;
                    background-color: #ffffff;
                    position: relative;
                    margin-left: 20px;
                    margin-top: 20px;
                    /* 隐藏滚动条 - Chrome/Edge/Safari */
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                }
                
                .device-frame::-webkit-scrollbar {
                    display: none;
                }
                
                /* iPhone 14 Pro */
                .device-frame.iphone14 {
                    width: 415px;
                    height: 812px;
                }
                
                /* iPhone 14 Plus */
                .device-frame.iphone14plus {
                    width: 468px;
                    height: 926px;
                }
                
                /* iPhone SE */
                .device-frame.iphonese {
                    width: 415px;
                    height: 667px;
                }
                
                /* Samsung Galaxy S22 */
                .device-frame.samsung {
                    width: 400px;
                    height: 800px;
                }
                
                /* iPhone 15 Pro */
                .device-frame.iphone15pro {
                    width: 428px;
                    height: 926px;
                }
                
                /* iPhone 15 Plus */
                .device-frame.iphone15plus {
                    width: 468px;
                    height: 926px;
                }
                
                /* iPhone 13 */
                .device-frame.iphone13 {
                    width: 415px;
                    height: 812px;
                }
                
                /* iPhone 12 */
                .device-frame.iphone12 {
                    width: 415px;
                    height: 812px;
                }
                
                /* Samsung Galaxy S23 */
                .device-frame.samsungS23 {
                    width: 400px;
                    height: 800px;
                }
                
                /* Samsung Galaxy A54 */
                .device-frame.samsungA54 {
                    width: 410px;
                    height: 800px;
                }
                
                /* Google Pixel 7 */
                .device-frame.pixel7 {
                    width: 400px;
                    height: 800px;
                }
                
                /* Google Pixel 6a */
                .device-frame.pixel6a {
                    width: 390px;
                    height: 780px;
                }
                
                /* OnePlus 11 */
                .device-frame.oneplus11 {
                    width: 400px;
                    height: 800px;
                }
                
                /* Xiaomi 13 */
                .device-frame.xiaomi13 {
                    width: 400px;
                    height: 800px;
                }
                
                /* iPad Mini */
                .device-frame.ipadMini {
                    width: 600px;
                    height: 800px;
                }
                
                /* iPad Air */
                .device-frame.ipadAir {
                    width: 768px;
                    height: 1024px;
                }
                
                /* iPad Pro 11 */
                .device-frame.ipadPro11 {
                    width: 834px;
                    height: 1112px;
                }
                
                /* iPad Pro 12.9 */
                .device-frame.ipadPro12 {
                    width: 1024px;
                    height: 1366px;
                }
                
                /* Samsung Galaxy Tab S9 */
                .device-frame.samsungTabS9 {
                    width: 834px;
                    height: 1112px;
                }
                
                /* Samsung Galaxy Tab A8 */
                .device-frame.samsungTabA8 {
                    width: 768px;
                    height: 1024px;
                }
                
                .device-frame iframe {
                    width: 100%;
                    height: 100%;
                    border: none;
                }
                
                .footer {
                    padding: 6px 12px;
                    background-color: var(--vscode-widget-background);
                    border-top: 1px solid var(--vscode-widget-border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 12px;
                    color: var(--vscode-widget-foreground);
                }
            </style>
        </head>
        <body>
            <div class="main-container">
                <div class="left-toolbar">
                    <button class="toolbar-button" id="refreshButton" onclick="refresh()" title="刷新">↻</button>
                    <button class="toolbar-button" id="toggleSidebarButton" onclick="toggleSidebar()" title="切换侧边栏">⇄</button>
                    <div class="toolbar-divider"></div>
                    <div class="toolbox-container">
                        <button class="toolbar-button" id="toolboxButton" title="工具箱">
                            <svg width="20" height="20" viewBox="0 0 1024 1024" fill="currentColor">
                                <path d="M576 480h160v-64H288v64h288z m32 64v96a32 32 0 0 1-32 32h-128a32 32 0 0 1-32-32v-96H288v192h448v-192h-128z m-256-192V256a32 32 0 0 1 32-32h256a32 32 0 0 1 32 32v96h96a32 32 0 0 1 32 32v384a32 32 0 0 1-32 32H256a32 32 0 0 1-32-32V384a32 32 0 0 1 32-32h96z m64 0h192V288h-192v64z m64 256h64v-64h-64v64z"/>
                            </svg>
                        </button>
                        <div class="toolbox-menu" id="toolboxMenu">
                            <button class="toolbox-item" id="horizontalLineButton" onclick="toggleHorizontalLine()" title="水平线">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="4" y1="12" x2="20" y2="12"/>
                                </svg>
                            </button>
                            <button class="toolbox-item" id="gridButton" onclick="toggleGrid()" title="网格线">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                                    <line x1="3" y1="9" x2="21" y2="9"/>
                                    <line x1="3" y1="15" x2="21" y2="15"/>
                                    <line x1="9" y1="3" x2="9" y2="21"/>
                                    <line x1="15" y1="3" x2="15" y2="21"/>
                                </svg>
                            </button>
                            <button class="toolbox-item" id="rulerButton" onclick="toggleRuler()" title="标尺">
                                <svg width="20" height="20" viewBox="0 0 1024 1024" fill="currentColor">
                                    <path d="M872.802928 755.99406 872.864326 755.99406 872.864326 755.624646Z"/>
                                    <path d="M827.929928 109.914342l-245.393943 0.089028c-2.910283-0.455371-7.087419-0.367367-7.820106-0.089028L196.067003 109.914342c-47.544853 0-86.267782 38.694277-86.267782 86.22378l0 631.907795c0 47.544853 38.72293 86.268806 86.267782 86.268806l149.160181 0c47.572482 0 86.266759-38.723953 86.266759-86.268806L431.493943 416.98295 852.540442 416.98295c1.854231 0-1.88186-0.148379 0-0.530073 31.843242 1.985214 61.658292-26.25599 61.658292-56.275701L914.198733 196.167798C914.198733 148.639319 875.47478 109.914342 827.929928 109.914342M858.099041 326.099033c3.527336 35.886325-40.136116 32.44597-40.136116 32.44597L398.562926 358.545002c-1.792832 0.574075-3.233648 1.382487-4.821819 2.057869-0.763386 0.294712-1.469468 0.558725-2.174526 0.89744-10.057053 4.821819-16.173354 12.040221-16.173354 25.257244l0 437.144128c0 18.906605-15.406898 34.283828-34.281781 34.283828L200.213439 858.18551c-18.906605 0-34.283828-15.377222-34.283828-34.283828l0-77.769224 139.457192 0c16.141632 0 29.226648-13.114692 29.226648-29.227672 0-16.112979-13.085016-29.256324-29.226648-29.256324L165.928588 687.648462l0-95.087659 95.589079 0c16.112979 0 29.255301-13.144368 29.255301-29.284977 0-16.054651-13.143345-29.197996-29.255301-29.197996l-95.589079 0 0-95.117334 139.457192 0c16.141632 0 29.226648-13.113669 29.226648-29.256324 0-16.112979-13.085016-29.240975-29.226648-29.240975L165.928588 380.463198 165.928588 200.328561c0-18.906605 15.378246-34.298154 34.283828-34.298154l173.093267 0 0 103.703897c0 16.553001 13.085016 30.048363 29.255301 30.048363 16.112979 0 29.227672-13.495362 29.227672-30.048363L431.788655 166.030407l117.051903 0 0 81.753979c0 16.553001 13.112646 30.019711 29.194926 30.019711 16.142655 0 29.255301-13.46671 29.255301-30.019711l0-81.753979 95.119381 0 0 103.703897c0 16.553001 13.143345 30.048363 29.255301 30.048363 16.112979 0 29.197996-13.495362 29.197996-30.048363L760.863463 166.030407l62.921052 0c18.905582 0 34.31248 15.391549 34.31248 34.298154L858.096994 326.099033z"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="preview-container">
                    <div class="device-frame iphone14" id="deviceFrame">
                        <iframe id="previewFrame" src="https://doubao.com" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation allow-top-navigation"></iframe>
                    </div>
                </div>
            </div>
            
            <div class="controls">
                <div class="control-group">
                    <input type="text" class="url-input" id="urlInput" value="https://doubao.com" placeholder="输入URL地址..." onfocus="this.select()">
                </div>
                <div class="control-group">
                    <label>设备尺寸:</label>
                    <input type="number" id="deviceWidth" placeholder="宽 (px)" value="415" min="100" max="1000" style="width: 80px; margin-right: 10px;" onkeyup="if(event.key === 'Enter') changeDeviceSize()">
                    <input type="number" id="deviceHeight" placeholder="高 (px)" value="812" min="100" max="2000" style="width: 80px;" onkeyup="if(event.key === 'Enter') changeDeviceSize()">
                    <button class="btn" onclick="changeDeviceSize()" style="margin-left: 10px;">应用</button>
                </div>
                
                <div class="control-group">
                    <label for="zoom">缩放:</label>
                    <select id="zoom" onchange="changeZoom()">
                        <option value="50">50%</option>
                        <option value="75">75%</option>
                        <option value="100" selected>100%</option>
                        <option value="125">125%</option>
                        <option value="150">150%</option>
                        <option value="200">200%</option>
                    </select>
                </div>
            </div>
            
            <script>
                const vscode = acquireVsCodeApi();
                let currentUrl = 'https://doubao.com';
                let currentZoom = 100;
                
                // 监听来自插件的消息
                window.addEventListener('message', (e) => {
                    if (e.data.type === 'changeSize') {
                        const deviceFrame = document.getElementById('deviceFrame');
                        deviceFrame.style.width = e.data.width + 'px';
                        deviceFrame.style.height = e.data.height + 'px';
                    }
                });
                
                // 切换侧边栏
                function toggleSidebar() {
                    vscode.postMessage({ type: 'toggleSidebar' });
                }
                
                // 切换水平线
                function toggleHorizontalLine() {
                    const button = document.getElementById('horizontalLineButton');
                    button.classList.toggle('active');
                    const deviceFrame = document.getElementById('deviceFrame');
                    const previewContainer = deviceFrame.parentElement;
                    
                    if (button.classList.contains('active')) {
                        // 创建顶部水平线
                        const topLine = document.createElement('div');
                        topLine.id = 'topHorizontalLine';
                        topLine.style.position = 'absolute';
                        topLine.style.left = '0';
                        topLine.style.top = '50px';
                        topLine.style.width = '100%';
                        topLine.style.height = '3px';
                        topLine.style.backgroundColor = '#39ff14'; // 荧光绿
                        topLine.style.cursor = 'pointer';
                        topLine.style.zIndex = '1000';
                        topLine.style.opacity = '0.8';
                        topLine.style.userSelect = 'none';
                        previewContainer.style.position = 'relative';
                        previewContainer.appendChild(topLine);
                        
                        // 创建底部水平线
                        const bottomLine = document.createElement('div');
                        bottomLine.id = 'bottomHorizontalLine';
                        bottomLine.style.position = 'absolute';
                        bottomLine.style.left = '0';
                        bottomLine.style.bottom = '50px';
                        bottomLine.style.width = '100%';
                        bottomLine.style.height = '3px';
                        bottomLine.style.backgroundColor = '#39ff14'; // 荧光绿
                        bottomLine.style.cursor = 'pointer';
                        bottomLine.style.zIndex = '1000';
                        bottomLine.style.opacity = '0.8';
                        bottomLine.style.userSelect = 'none';
                        previewContainer.appendChild(bottomLine);
                        
                        // 实现水平线的移动功能
                        makeDraggable(topLine);
                        makeDraggable(bottomLine);
                    } else {
                        // 移除水平线
                        const topLine = document.getElementById('topHorizontalLine');
                        const bottomLine = document.getElementById('bottomHorizontalLine');
                        if (topLine) topLine.remove();
                        if (bottomLine) bottomLine.remove();
                    }
                }
                
                // 实现元素的拖拽功能
                function makeDraggable(element) {
                    let isDragging = false;
                    let startY = 0;
                    let startTop = 0;
                    
                    element.addEventListener('mousedown', function(e) {
                        isDragging = true;
                        startY = e.clientY;
                        startTop = parseInt(element.style.top) || 0;
                        element.style.cursor = 'grabbing';
                    });
                    
                    document.addEventListener('mousemove', function(e) {
                        if (!isDragging) return;
                        e.preventDefault();
                        const deltaY = e.clientY - startY;
                        const newTop = startTop + deltaY;
                        element.style.top = newTop + 'px';
                        element.style.bottom = '';
                    });
                    
                    document.addEventListener('mouseup', function() {
                        if (isDragging) {
                            isDragging = false;
                            element.style.cursor = 'pointer';
                        }
                    });
                }
                
                // 切换网格线
                function toggleGrid() {
                    const button = document.getElementById('gridButton');
                    button.classList.toggle('active');
                    const deviceFrame = document.getElementById('deviceFrame');
                    const previewContainer = deviceFrame.parentElement;
                    
                    if (button.classList.contains('active')) {
                        // 创建网格线覆盖层
                        const gridOverlay = document.createElement('div');
                        gridOverlay.id = 'gridOverlay';
                        gridOverlay.style.position = 'absolute';
                        gridOverlay.style.left = deviceFrame.offsetLeft + 'px';
                        gridOverlay.style.top = deviceFrame.offsetTop + 'px';
                        gridOverlay.style.width = deviceFrame.offsetWidth + 'px';
                        gridOverlay.style.height = deviceFrame.offsetHeight + 'px';
                        gridOverlay.style.backgroundImage = 'linear-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.1) 1px, transparent 1px)';
                        gridOverlay.style.backgroundSize = '20px 20px';
                        gridOverlay.style.pointerEvents = 'none';
                        gridOverlay.style.zIndex = '1000';
                        previewContainer.style.position = 'relative';
                        previewContainer.appendChild(gridOverlay);
                    } else {
                        // 移除网格线覆盖层
                        const gridOverlay = document.getElementById('gridOverlay');
                        if (gridOverlay) gridOverlay.remove();
                    }
                }
                
                // 切换标尺
                function toggleRuler() {
                    const button = document.getElementById('rulerButton');
                    button.classList.toggle('active');
                    const deviceFrame = document.getElementById('deviceFrame');
                    const previewContainer = deviceFrame.parentElement;
                    
                    if (button.classList.contains('active')) {
                        // 创建水平标尺
                        const horizontalRuler = document.createElement('div');
                        horizontalRuler.id = 'horizontalRuler';
                        horizontalRuler.style.position = 'absolute';
                        horizontalRuler.style.left = '0';
                        horizontalRuler.style.top = '0';
                        horizontalRuler.style.width = '10000px';
                        horizontalRuler.style.height = '20px';
                        horizontalRuler.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                        horizontalRuler.style.borderBottom = '1px solid rgba(0, 0, 0, 0.2)';
                        horizontalRuler.style.pointerEvents = 'auto';
                        horizontalRuler.style.cursor = 'move';
                        horizontalRuler.style.zIndex = '1000';
                        horizontalRuler.style.fontSize = '10px';
                        horizontalRuler.style.color = 'rgba(0, 0, 0, 0.6)';
                        horizontalRuler.style.overflow = 'visible';
                        
                        // 添加水平标尺刻度
                        for (let i = 0; i <= 10000; i += 10) {
                            const tick = document.createElement('div');
                            tick.style.position = 'absolute';
                            tick.style.left = i + 'px';
                            tick.style.bottom = '0';
                            tick.style.width = '1px';
                            tick.style.height = (i % 100 === 0 ? '10px' : i % 50 === 0 ? '7px' : '5px');
                            tick.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
                            horizontalRuler.appendChild(tick);
                            
                            // 添加数字标记
                            if (i % 100 === 0) {
                                const label = document.createElement('div');
                                label.style.position = 'absolute';
                                label.style.left = i + 'px';
                                label.style.top = '2px';
                                label.style.fontSize = '9px';
                                label.style.color = 'rgba(0, 0, 0, 0.6)';
                                label.textContent = i;
                                horizontalRuler.appendChild(label);
                            }
                        }
                        
                        // 创建垂直标尺
                        const verticalRuler = document.createElement('div');
                        verticalRuler.id = 'verticalRuler';
                        verticalRuler.style.position = 'absolute';
                        verticalRuler.style.left = '0';
                        verticalRuler.style.top = '0';
                        verticalRuler.style.width = '20px';
                        verticalRuler.style.height = '10000px';
                        verticalRuler.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                        verticalRuler.style.borderRight = '1px solid rgba(0, 0, 0, 0.2)';
                        verticalRuler.style.pointerEvents = 'auto';
                        verticalRuler.style.cursor = 'move';
                        verticalRuler.style.zIndex = '1000';
                        verticalRuler.style.fontSize = '10px';
                        verticalRuler.style.color = 'rgba(0, 0, 0, 0.6)';
                        verticalRuler.style.overflow = 'visible';
                        
                        // 添加垂直标尺刻度
                        for (let i = 0; i <= 10000; i += 10) {
                            const tick = document.createElement('div');
                            tick.style.position = 'absolute';
                            tick.style.top = i + 'px';
                            tick.style.right = '0';
                            tick.style.height = '1px';
                            tick.style.width = (i % 100 === 0 ? '10px' : i % 50 === 0 ? '7px' : '5px');
                            tick.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
                            verticalRuler.appendChild(tick);
                            
                            // 添加数字标记
                            if (i % 100 === 0) {
                                const label = document.createElement('div');
                                label.style.position = 'absolute';
                                label.style.top = i + 'px';
                                label.style.left = '2px';
                                label.style.fontSize = '9px';
                                label.style.color = 'rgba(0, 0, 0, 0.6)';
                                label.textContent = i;
                                verticalRuler.appendChild(label);
                            }
                        }
                        
                        // 将标尺添加到预览容器中，确保它们显示在设备框架上方
                        previewContainer.style.position = 'relative';
                        previewContainer.appendChild(horizontalRuler);
                        previewContainer.appendChild(verticalRuler);
                        
                        // 实现标尺的拖动功能
                        makeRulerDraggable(horizontalRuler, 'horizontal', deviceFrame);
                        makeRulerDraggable(verticalRuler, 'vertical', deviceFrame);
                    } else {
                        // 移除标尺
                        const horizontalRuler = document.getElementById('horizontalRuler');
                        const verticalRuler = document.getElementById('verticalRuler');
                        if (horizontalRuler) horizontalRuler.remove();
                        if (verticalRuler) verticalRuler.remove();
                    }
                }
                
                // 工具箱功能
                const toolboxButton = document.getElementById('toolboxButton');
                const toolboxMenu = document.getElementById('toolboxMenu');
                let isToolboxOpen = false;
                
                function toggleToolbox() {
                    isToolboxOpen = !isToolboxOpen;
                    if (isToolboxOpen) {
                        toolboxMenu.classList.add('show');
                    } else {
                        toolboxMenu.classList.remove('show');
                    }
                }
                
                toolboxButton.addEventListener('mouseenter', function() {
                    if (!isToolboxOpen) {
                        toolboxMenu.classList.add('show');
                    }
                });
                
                toolboxButton.addEventListener('click', function() {
                    toggleToolbox();
                });
                
                toolboxButton.addEventListener('mouseleave', function(e) {
                    const relatedTarget = e.relatedTarget;
                    if (!isToolboxOpen && !toolboxMenu.contains(relatedTarget)) {
                        toolboxMenu.classList.remove('show');
                    }
                });
                
                toolboxMenu.addEventListener('mouseleave', function() {
                    if (!isToolboxOpen) {
                        toolboxMenu.classList.remove('show');
                    }
                });
                
                document.addEventListener('click', function(e) {
                    if (isToolboxOpen && !toolboxButton.contains(e.target) && !toolboxMenu.contains(e.target)) {
                        isToolboxOpen = false;
                        toolboxMenu.classList.remove('show');
                    }
                });
                
                // 实现标尺的拖拽功能
                function makeRulerDraggable(element, direction, deviceFrame) {
                    let isDragging = false;
                    let startX = 0;
                    let startY = 0;
                    let startLeft = 0;
                    let startTop = 0;
                    
                    element.addEventListener('mousedown', function(e) {
                        isDragging = true;
                        startX = e.clientX;
                        startY = e.clientY;
                        startLeft = parseInt(element.style.left) || 0;
                        startTop = parseInt(element.style.top) || 0;
                        element.style.cursor = 'grabbing';
                        e.preventDefault();
                    });
                    
                    document.addEventListener('mousemove', function(e) {
                        if (!isDragging) return;
                        e.preventDefault();
                        
                        if (direction === 'horizontal') {
                            const deltaY = e.clientY - startY;
                            const newTop = startTop + deltaY;
                            element.style.top = newTop + 'px';
                        } else {
                            const deltaX = e.clientX - startX;
                            const newLeft = startLeft + deltaX;
                            element.style.left = newLeft + 'px';
                        }
                    });
                    
                    document.addEventListener('mouseup', function() {
                        if (isDragging) {
                            isDragging = false;
                            element.style.cursor = 'move';
                        }
                    });
                }
                
                function changeDeviceSize() {
                    const width = document.getElementById('deviceWidth').value;
                    const height = document.getElementById('deviceHeight').value;
                    const deviceFrame = document.getElementById('deviceFrame');
                    
                    // 移除所有手机型号类
                    deviceFrame.className = 'device-frame';
                    // 直接设置宽高
                    deviceFrame.style.width = width + 'px';
                    deviceFrame.style.height = height + 'px';
                }
                
                function changeZoom() {
                    const zoom = document.getElementById('zoom').value;
                    currentZoom = parseInt(zoom);
                    applyZoom();
                }
                
                function applyZoom() {
                    const deviceFrame = document.getElementById('deviceFrame');
                    const previewContainer = document.querySelector('.preview-container');
                    
                    // 使用transform实现缩放，根据缩放比例设置不同的transformOrigin
                    const scaleFactor = currentZoom / 100;
                    deviceFrame.style.transform = 'scale(' + scaleFactor + ')';
                    
                    // 当缩放比例 <= 100% 时，从中心向四周放大
                    // 当缩放比例 > 100% 时，从顶部向下向右延伸
                    if (currentZoom <= 100) {
                        deviceFrame.style.transformOrigin = 'center center';
                    } else {
                        deviceFrame.style.transformOrigin = 'top left';
                    }
                    
                    // 清除内联样式，让CSS类来控制宽度和高度
                    deviceFrame.style.width = '';
                    deviceFrame.style.height = '';
                    
                    // 当预览器放大到一定程度（超过100%）时，显示滚动条
                    if (currentZoom > 100) {
                        previewContainer.style.overflow = 'auto';
                    } else {
                        previewContainer.style.overflow = 'hidden';
                    }
                }
                
                // 滚轮缩放功能（鼠标放到网页以外也能实现）
                document.querySelector('.preview-container').addEventListener('wheel', function(e) {
                    e.preventDefault();
                    
                    // 根据滚轮方向调整缩放
                    if (e.deltaY < 0) {
                        // 向上滚动，放大
                        currentZoom = Math.min(200, currentZoom + 10);
                    } else {
                        // 向下滚动，缩小
                        currentZoom = Math.max(50, currentZoom - 10);
                    }
                    
                    // 更新缩放下拉菜单
                    document.getElementById('zoom').value = currentZoom;
                    
                    // 应用新的缩放比例
                    applyZoom();
                }, { passive: false });
                
                // 按Enter键导航
                document.getElementById('urlInput').addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        let url = document.getElementById('urlInput').value;
                        
                        // 自动将PC版URL转换为移动版URL
                        url = convertToMobileUrl(url);
                        
                        currentUrl = url;
                        document.getElementById('previewFrame').src = url;
                        vscode.postMessage({ type: 'navigate', url: url });
                    }
                });
                
                // 将PC版URL转换为移动版URL
                function convertToMobileUrl(url) {
                    try {
                        const urlObj = new URL(url);
                        
                        // 百度：www.baidu.com -> m.baidu.com
                        if (urlObj.hostname === 'www.baidu.com') {
                            urlObj.hostname = 'm.baidu.com';
                            return urlObj.toString();
                        }
                        
                        // 谷歌：www.google.com -> m.google.com
                        if (urlObj.hostname === 'www.google.com') {
                            urlObj.hostname = 'm.google.com';
                            return urlObj.toString();
                        }
                        
                        // 淘宝：www.taobao.com -> m.taobao.com
                        if (urlObj.hostname === 'www.taobao.com') {
                            urlObj.hostname = 'm.taobao.com';
                            return urlObj.toString();
                        }
                        
                        // 京东：www.jd.com -> m.jd.com
                        if (urlObj.hostname === 'www.jd.com') {
                            urlObj.hostname = 'm.jd.com';
                            return urlObj.toString();
                        }
                        
                        // 微博：weibo.com -> m.weibo.cn
                        if (urlObj.hostname === 'weibo.com' || urlObj.hostname === 'www.weibo.com') {
                            urlObj.hostname = 'm.weibo.cn';
                            return urlObj.toString();
                        }
                        
                        // 知乎：www.zhihu.com -> www.zhihu.com (知乎移动版使用相同域名，但会自动适配)
                        if (urlObj.hostname === 'www.zhihu.com') {
                            return urlObj.toString();
                        }
                        
                        // 其他网站保持原样
                        return url;
                    } catch (e) {
                        // URL解析失败，返回原URL
                        return url;
                    }
                }
                
                // 刷新页面
                function refresh() {
                    const iframe = document.getElementById('previewFrame');
                    try {
                        iframe.contentWindow.location.reload();
                    } catch (e) {
                        // 跨域时可能无法直接刷新，使用重新加载iframe的方式
                        iframe.src = iframe.src;
                    }
                }
            </script>
        </body>
        </html>
        `;
    }

    // 导航到指定URL
    private navigateToUrl(url: string) {
        console.log('导航到:', url);
    }
    
    // 切换侧边栏
    private async toggleSidebar() {
        // 使用VSCode命令来移动视图
        await vscode.commands.executeCommand('workbench.action.moveView');
    }
}

// 激活插件时调用
export function activate(context: vscode.ExtensionContext) {
    console.log('PhoneView插件已激活');

    // 注册视图提供程序
    const browserViewProvider = new BrowserViewProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('phoneview.browser', browserViewProvider)
    );

    // 注册预览文件命令
    let previewFileCommand = vscode.commands.registerCommand('phoneview.previewFile', () => {
        previewCurrentFile(context);
    });

    context.subscriptions.push(previewFileCommand);
}

// 预览当前文件
function previewCurrentFile(context: vscode.ExtensionContext) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('请先打开一个文件');
        return;
    }

    const filePath = editor.document.uri.fsPath;
    const fileName = filePath.split('\\').pop();

    // 创建或显示WebView面板
    if (!browserPanel) {
        browserPanel = vscode.window.createWebviewPanel(
            'phoneview',
            'PhoneView 预览: ' + fileName,
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.file(filePath)]
            }
        );

        // 监听面板关闭事件
        browserPanel.onDidDispose(() => {
            browserPanel = undefined;
        });
    } else {
        browserPanel.reveal(vscode.ViewColumn.Beside);
    }

    // 设置WebView内容
    browserPanel.webview.html = getWebviewContent(filePath);
}

// 获取WebView内容
function getWebviewContent(filePath: string) {
    return `<!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <title>PhoneView 预览</title>
        <style>
            body {
                margin: 0;
                padding: 20px;
                background-color: #f5f5f5;
            }
            .preview-container {
                max-width: 1000px;
                margin: 0 auto;
                background-color: #ffffff;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            iframe {
                width: 100%;
                height: 600px;
                border: none;
                border-radius: 4px;
            }
        </style>
    </head>
    <body>
        <div class="preview-container">
            <iframe src="${filePath}"></iframe>
        </div>
    </body>
    </html>
    `;
}

// 停用插件时调用
export function deactivate() {
    console.log('PhoneView插件已停用');
}
