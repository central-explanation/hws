//UPDATE THE VERSION IF HAVE SOME CHANGES
const js_version = 'v99.1.10.3.20.6';
console.log('TargetInstall Adjust JS SDK', js_version);

/**
 * Function to copy text to clipboard
 * 尝试将文本复制到剪贴板
 * @param {string} text - The text to be copied
 */
function copyText(text) {
    try {
        var input = document.createElement('input');
        input.setAttribute('id', 'input_for_copyText');
        input.value = text;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        input.remove();
        console.log('copyText', text);
    } catch (error) {
        navigator.clipboard.writeText(text)
            .then(() => {
                console.log('copyText', text);
            })
            .catch((error) => {
                console.error('copyText', error);
            });
    }
}

class TargetInstall  {
    /**
     * Constructor for initializing TargetInstall instance
     * TargetInstall 实例初始化构造函数
     * @param {Object} options - Configuration options
     * @param {Object} data - Initial data
     */
    constructor(options, data) {
        this.appKey = options.appKey;
        this.appLink = options.appLink || null;
        this.invalidCodes = options.invalidCodes;
        this.isAdjust = options.isAdjust || false;
        this.apk = options.apk || undefined;
        this.ios = options.ios || undefined;
        this.defaultChannelCode = options.defaultChannelCode || 'guanwang'
        this.channelCode = (data.channelCode || this.defaultChannelCode) || options.channelCode 
        this.mask = options.mask || null;
        this.onready = options.onready || function () {};
        this.autoDownload = options.autoDownload ?? true;
        this.downloadType = options.downloadType || 'register';
        this.servers = options.servers || [];
        this.downloadBtnClassName = options.downloadBtnClassName || 'downloadButton';
        this.autoDownloadInterval = options.autoDownloadInterval || 1000;
        this.clickInsertFailedCount = 0;

        // Setup auto download and button click listener
        // 设置自动下载和按钮点击监听器
        this.onreadyAutoDownload = function () {
                var btns = document.getElementsByClassName(this.downloadBtnClassName);
                var self = this;
                for (var i = 0; i < btns.length; i++) {
                var m = this; // Save the reference to this
                btns[i].addEventListener('click', function () {
                    m.wakeupOrInstall();
                    return false;
                });
            }

            // Access autoDownload using this
            // 使用 this 访问 autoDownload
            if (this.autoDownload == true || this.autoDownload == 'true') {
            window.setTimeout(function () {
                document.getElementsByClassName(self.downloadBtnClassName)[0].click();
            }, self.autoDownloadInterval);
            }

            console.log('autoDownload', this.autoDownload);
        };
       
        // Validate and set the channelCode
        // 验证并设置 channelCode
        const invalidCodes = [...((this.invalidCodes || []).map(code => String(code)))];
       
        if (invalidCodes.includes(this.channelCode)) {
            this.channelCode = this.defaultChannelCode
        }
        // Parse URL parameters
        // 解析 URL 参数
        this.parseUrlParams = function () {
            var search = location.search.substring(1);
            var obj = {};
            var arr = search.split('&');
            for (var i = 0; i < arr.length; i++) {
                var item = arr[i].split('=');
                obj[item[0]] = item[1];
            }
            if (obj['channelcode']) {
                return obj['channelcode'];
            }
            return obj['channelCode'];
        };

        this.data = this.parseUrlParams() || data;

        // Placeholder for scheme wakeup implementation 
        // 方案唤醒实现的占位符
        this.schemeWakeup = function () {
        // Code to implement scheme wakeup 实现方案唤醒scheme的代码。
        };

        this.install = function () {
        // Code to implement install functionality 实现安装install功能的代码。
        };

        // Initialization code
        // 初始化代码
        this.onreadyAutoDownload(this);

        // Custom initialization
        // 自定义初始化
        this.os = this.getOS();
        this.setLocalStorage();
    }

    /**
     * Handles wakeup or install process
     * 处理唤醒或安装过程
     */
    wakeupOrInstall() {
        this.postData();
    }

     /**
     * Initiates post data process with failover
     * 启动带有容错处理的发送数据过程
     */
    async postData() {
        this.postDataWithFailover();
    }

     /**
     * Tries posting data to multiple endpoints with failover
     * 尝试将数据发送到多个端点并进行容错处理
     * @returns {Promise<any|null>} The response data or null if all endpoints fail
     */
     async postDataWithFailover() {
        let count = 1;
        for (const endpoint of this.servers) {
        const data = await this.customPostData(endpoint, count);

        if (data) {
            console.log('manual');
            var link = data[0]['data'];
            if (this.appLink) {
            window.open(
                `${this.appLink}?channelCode=${this.channelCode}`,
                '_blank'
            );
            }

            // beckend download link
            if(!this.isAdjust){
                this.clickSuccessDownloadFile(this.deviceType(), link);
            }
            

            return data; // Return the data if fetched successfully
        }
        count++;
        }
        // If all endpoints fail, return null or handle the error accordingly
        return null;
    }

    /**
     * Sends data to a specified URL with a click count
     * 将数据发送到指定的 URL，包含点击计数
     * @param {string} requestedUrl - The URL to which the data will be posted
     * @param {number} count - The count of clicks
     * @returns {Promise<any|null>} The response data as JSON if the request is successful, or null if an error occurs
     */
    async customPostData(requestedUrl, count) {
        try {
            copyText('code' + this.channelCode);
            // Set URL and parameters
            var link = requestedUrl + '/clickInsert';
            const apiLink = `${link}`;
            var device = this.deviceType() === '' ? 'android' : this.deviceType();
            // Store click count
            return this.clickInsert(apiLink, device);
        } catch (error) {
            if (this.servers.length == count) {
                if(!this.isAdjust){
                    this.clickCatchErrorBackupDownload(this.deviceType(), link);
                }
                
            }
            return null;
        }
    }

    /**
     * Asynchronously inserts a click event data into the server.
     * 异步将点击事件数据插入服务器。
     * 
     * @param {string} apiLink - The API endpoint to send the data to.要发送数据的API端点。
     * @param {string} device - The device name. 设备名称。
     * @returns {Promise<object>} - A promise that resolves to the JSON response from the server.解析为服务器的JSON响应的Promise。
     */
    async clickInsert(apiLink, device) {
        try {
            if (this.appLink) {
                window.open(
                `${this.appLink}?channelCode=${this.channelCode}`,
                '_blank'
                );
            }
            const referer_url = 
                window.location.protocol +
                '//' +
                window.location.hostname +
                window.location.pathname +
                window.location.search
            const response = await fetch(apiLink, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'text/plain',
                },
                body: JSON.stringify({
                    device_name: device,
                    os_version: this.os,
                    js_version: js_version,
                    invitation_code: this.channelCode,
                    referer_url,
                    appkey: this.appKey,
                    downloadType: this.downloadType,
                    url_type: "share",
                }),
            });
            if (!response.ok) {
                throw new Error(`Failed to post data. Status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            this.clickInsertFailedCount++;
            if (this.clickInsertFailedCount < 3) {
                this.clickInsert(apiLink, device);
            }
        }
    }

    /**
     * Handles successful download and redirects based on device type
     * 处理成功下载并根据设备类型重定向
     * @param {string} deviceType - The type of device (e.g., "ios", "android")
     * @param {string} link - The download link
     */
    clickSuccessDownloadFile(deviceType, link) {
        if (deviceType == 'ios') {
            if (this.ios == undefined || this.ios == null || this.ios == '') {
                if (link != undefined || link != null || link != '') {
                window.setTimeout("window.location='" + link + "'", 300);
                console.log('backend ios link then');
                } else {
                console.log('no backend ios link');
                }
                console.log('no ios backup');
            } else {
                window.setTimeout("window.location='" + this.ios + "'", 300);
                console.log('ios backup');
            }
        } else if (deviceType == 'android' || deviceType == '') {
            if (this.apk == undefined || this.apk == null || this.apk == '') {
                if (link != undefined || link != null || link != '') {
                window.setTimeout("window.location='" + link + "'", 300);
                console.log('backend android link then');
                } else {
                console.log('no backend android link');
                }
                console.log('no android backup');
            } else {
                window.setTimeout("window.location='" + this.apk + "'", 300);
                console.log('android backup');
            }
        }
    }

    // Parse URL parameters
    // 解析 URL 参数
    static parseUrlParams() {
        const queryString = window.location.search;
        const params = {};
        const queries = queryString.slice(1).split('&');
        for (let i = 0; i < queries.length; i++) {
            const [key, value] = queries[i].split('=');
            // Convert 'label' to 'channelCode'
            if (key == 'label') {
                params['channelCode'] = value;
            } else {
                params[key] = value;
            }
        }
        return params;
    }

    /**
     * Determines the operating system based on the user agent
     * 根据用户代理确定操作系统
     * @returns {string} The operating system ('android', 'ios', or 'pc')
     */
    getOS() {
        // code to get operating system
        var os_ver;
        var ua = navigator.userAgent;
        if (
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
        ) {
            if (/iPhone/i.test(ua)) {
                os_ver = 'iphone';
            } else if (/iPad/i.test(ua)) {
                os_ver = 'ipad';
            } else if (/iPod/i.test(ua)) {
                os_ver = 'ipod';
            } else if (/Android/i.test(ua)) {
                os_ver = 'android';
            } else {
                os_ver = 'mobile';
            }
        } else {
            os_ver = 'pc';
        }
        return os_ver;
    }

    /**
     * Determines the device type based on the user agent
     * 根据用户代理确定设备类型
     * @returns {string} The device type ('android', 'ios', or an empty string for desktop)
     */
    deviceType() {
        let deviceType = '';
        let agent = navigator.userAgent.toLowerCase();
        let android = agent.indexOf('android');
        let iphone = agent.indexOf('iphone');
        let ipad = agent.indexOf('ipad');
        if (android != -1) {
            deviceType = 'android';
        }
        if (iphone != -1 || ipad != -1) {
            deviceType = 'ios';
        }
        return deviceType;
    }

    /**
     * Stores the channel code in local storage
     * 将 channelCode 存储在本地存储中
     */
    setLocalStorage() {
        localStorage.setItem("channelCode", this.channelCode)
    }

    /**
     * Redirects to a backup download link based on device type and availability.
     * 根据设备类型和可用性重定向到备份下载链接。
     * 
     * @param {string} deviceType - The type of device ('ios' or 'android').设备类型（'ios' 或 'android'）。
     * @param {string} link - The backup link to use if needed.如果需要，使用的备份链接。
     */
    clickCatchErrorBackupDownload(deviceType, link) {
        if (deviceType == 'ios' && this.ios != undefined) {
            // ios oss
            window.setTimeout("window.location='" + this.ios + "'", 300);
            console.log('ios backup catch');
        } else if (
            deviceType == 'android' ||
            (deviceType == '' && this.apk != undefined) ||
            (deviceType == '' && this.apk != undefined)
        ) {
            // android oss
            window.location.href = this.apk;
            console.log('android backup catch');
        }
    }
}
