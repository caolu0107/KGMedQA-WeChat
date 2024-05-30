Page({
  data: {
    current: 1,
    username: '',
    password: '',
    confirmPassword: '',
    email: ''
  },

  // 点击登录/注册按钮的处理函数
  handleTap() {
    if (this.data.current === 1) {
      // 执行登录操作
      this.handleLogin();
    } else {
      // 执行注册操作
      this.handleRegister();
    }
  },

  // 切换登录注册
  click(e) {
    let index = e.currentTarget.dataset.code;
    this.setData({
      current: index
    });
  },

  // 处理输入变化
  handleInputChange(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({
      [field]: e.detail.value
    });
  },

  // 登录
  handleLogin() {
    const { username, password } = this.data;
    if (username && password) {
      wx.request({
        url: 'http://localhost:5000/api/login', // 后端登录API地址
        method: 'POST',
        data: {
          username: username,
          password: password
        },
        success: (res) => {
          if (res.data.success) {
            wx.showToast({
              title: '登录成功',
              icon: 'success',
              duration: 2000,
              success: () => {
                setTimeout(() => {
                  wx.redirectTo({
                    url: '/pages/index/index'
                  });
                }, 2000);
              }
            });
          } else {
            wx.showToast({
              title: res.data.message,
              icon: 'none',
              duration: 2000
            });
          }
        },
        fail: (err) => {
          wx.showToast({
            title: '请求失败',
            icon: 'none',
            duration: 2000
          });
        }
      });
    } else {
      wx.showToast({
        title: '请填写所有必填项',
        icon: 'none',
        duration: 2000
      });
    }
  },

  // 注册
  handleRegister() {
    const { username, email, password, confirmPassword } = this.data;
    if (username && email && password && confirmPassword) {
      if (password !== confirmPassword) {
        wx.showToast({
          title: '两次密码不一致',
          icon: 'none',
          duration: 2000
        });
        return;
      }
      wx.request({
        url: 'http://localhost:5000/api/register', // 后端注册API地址
        method: 'POST',
        data: {
          username: username,
          email: email,
          password: password
        },
        success: (res) => {
          if (res.data.success) {
            wx.showToast({
              title: '注册成功',
              icon: 'success',
              duration: 2000,
              success: () => {
                setTimeout(() => {
                  wx.redirectTo({
                    url: '/pages/index/index'
                  });
                }, 2000);
              }
            });
          } else {
            wx.showToast({
              title: res.data.message,
              icon: 'none',
              duration: 2000
            });
          }
        },
        fail: (err) => {
          wx.showToast({
            title: '请求失败',
            icon: 'none',
            duration: 2000
          });
        }
      });
    } else {
      wx.showToast({
        title: '请填写所有必填项',
        icon: 'none',
        duration: 2000
      });
    }
  }
});
