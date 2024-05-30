Page({
  data: {
    messages: [],
    newMessage: '',
    suggestions: ['感冒的症状有哪些？', '最近老流鼻涕怎么办？', '为什么有的人会失眠？', '板蓝根颗粒能治啥病？'],
    showSuggestions: false,
    showSidebar: false,
    conversations: [], // 储存对话列表
    currentConversationIndex: -1, // 当前对话的索引
    touchStartX: 0, // 记录触摸起点
    recorderManager: null, // 录音管理器
    accessToken: '' // 百度语音识别的 Access Token
  },

  onLoad() {
    const recorderManager = wx.getRecorderManager();
    this.setData({
      recorderManager
    });

    // 获取百度语音识别的 Access Token
    wx.request({
      url: 'https://aip.baidubce.com/oauth/2.0/token',
      method: 'POST',
      data: {
        grant_type: 'client_credentials',
        client_id: 'kMd6cjsKOpqpVJUkrA46tyWn', 
        client_secret: 'LuxBp94LenWdoxgirk5etrW8banlYQXo' 
      },
      header: {
        'Content-Type': 'application/json'
      },
      success: (res) => {
        this.setData({
          accessToken: res.data.access_token
        });
      },
      fail: (err) => {
        wx.showToast({
          title: '获取Access Token失败',
          icon: 'none'
        });
      }
    });

    recorderManager.onStop((res) => {
      // 录音停止后，上传录音文件并进行语音识别
      wx.uploadFile({
        url: `https://vop.baidu.com/server_api?dev_pid=1536&cuid=z3A5KXHY7o9NMrFiMa8MgOjUeoCEpT0Y&token=${this.data.accessToken}`,
        filePath: res.tempFilePath,
        name: 'file',
        header: {
          'Content-Type': 'audio/pcm;rate=16000'
        },
        formData: {
          "format": "pcm",
          "rate": 16000,
          "channel": 1,
          "cuid": "z3A5KXHY7o9NMrFiMa8MgOjUeoCEpT0Y",
          "token": this.data.accessToken
        },
        success: (uploadRes) => {
          const data = JSON.parse(uploadRes.data);
          if (data.err_no === 0) {
            this.setData({
              newMessage: data.result[0]
            });
            this.sendMessage();
          } else {
            wx.showToast({
              title: '语音识别失败',
              icon: 'none'
            });
          }
        },
        fail: (err) => {
          wx.showToast({
            title: '上传失败',
            icon: 'none'
          });
        }
      });
    });
  },

  startVoiceRecognition() {
    wx.getSetting({
      success: (res) => {
        if (!res.authSetting['scope.record']) {
          wx.authorize({
            scope: 'scope.record',
            success: () => {
              this.startRecording();
            },
            fail: () => {
              wx.showModal({
                title: '授权提示',
                content: '需要录音权限才能使用语音输入功能',
                success: (res) => {
                  if (res.confirm) {
                    wx.openSetting();
                  }
                }
              });
            }
          });
        } else {
          this.startRecording();
        }
      }
    });
  },

  startRecording() {
    const options = {
      duration: 60000, // 最长录音时间，单位 ms
      sampleRate: 16000, // 采样率
      numberOfChannels: 1, // 录音通道数
      encodeBitRate: 96000, // 编码码率
      format: 'pcm', // 音频格式
    };
    this.data.recorderManager.start(options);
    wx.showToast({
      title: '正在录音...',
      icon: 'none'
    });
  },

  stopVoiceRecognition() {
    this.data.recorderManager.stop();
    wx.showToast({
      title: '录音结束',
      icon: 'none'
    });
  },

  onInput(event) {
    this.setData({
      newMessage: event.detail.value
    });
  },

  sendMessage() {
    if (this.data.newMessage.trim() !== '') {
      const userMessage = { text: this.data.newMessage, user: true };
      const currentMessages = this.data.messages;

      this.setData({
        messages: [...currentMessages, userMessage],
        newMessage: ''
      });

      wx.request({
        url: 'http://127.0.0.1:5000/api/send_message',
        method: 'POST',
        data: {
          message: userMessage.text,
          topicId: this.data.currentConversationIndex >= 0 ? this.data.conversations[this.data.currentConversationIndex].id : null
        },
        success: (res) => {
          const botResponse = { text: res.data.response, user: false };
          this.setData({
            messages: [...this.data.messages, botResponse]
          });
          this.saveCurrentConversation(); // 保存当前对话
        },
        fail: (error) => {
          console.error('Error sending message:', error);
        }
      });
    }
  },

  addSuggestionToInput(event) {
    const suggestion = event.currentTarget.dataset.suggestion;
    this.setData({
      newMessage: suggestion
    });
  },

  toggleSuggestions() {
    this.setData({
      showSuggestions: !this.data.showSuggestions
    });
  },

  toggleSidebar() {
    this.setData({
      showSidebar: !this.data.showSidebar
    });
  },

  closeSidebar() {
    this.setData({
      showSidebar: false
    });
  },

  logout() {
    // 退出登录逻辑
    wx.redirectTo({
      url: '/pages/login/login'
    });
  },

  createNewConversation() {
    this.saveCurrentConversation(); // 先保存当前对话
    const newConversation = {
      id: this.data.conversations.length,
      name: `对话 ${this.data.conversations.length + 1}`,
      messages: []
    };
    this.setData({
      conversations: [...this.data.conversations, newConversation],
      currentConversationIndex: this.data.conversations.length,
      messages: [],
      showSidebar: false
    });
  },

  switchConversation(event) {
    this.saveCurrentConversation(); // 先保存当前对话
    const index = event.currentTarget.dataset.index;
    const conversation = this.data.conversations[index];
    this.setData({
      currentConversationIndex: index,
      messages: conversation.messages,
      showSidebar: false
    });
  },

  saveCurrentConversation() {
    if (this.data.currentConversationIndex >= 0) {
      const conversations = this.data.conversations;
      conversations[this.data.currentConversationIndex].messages = this.data.messages;
      this.setData({ conversations });
    }
  },

  handleSidebarTouchEnd(event) {
    const touchEndX = event.changedTouches[0].pageX;
    if (this.data.touchStartX - touchEndX > 50) {
      this.closeSidebar();
    }
  },

  handleTouchStart(event) {
    this.setData({
      touchStartX: event.touches[0].pageX
    });
  }
});
