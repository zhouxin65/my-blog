---
title: Mac 平台
date: 2023-12-06
categories:
- 环境配置
tags:
- 环境配置
- Mac
---

# Mac 平台

## 错误提示

文件已损坏：

```bash
sudo spctl --master-disable
# 更换为损坏的 app 名字
xattr -cr /Applications/提示损坏的.app
```

<img src="https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202312111819742.png" alt="文件已损坏解决" style="zoom: 50%;" />

## 系统设置
```sh
# 禁止 “Are you sure you want to open this application?” 提示
defaults write com.apple.LaunchServices LSQuarantine -bool false

# 禁止磁盘映像验证
defaults write com.apple.frameworks.diskimages skip-verify -bool true
defaults write com.apple.frameworks.diskimages skip-verify-locked -bool true
defaults write com.apple.frameworks.diskimages skip-verify-remote -bool true

# 桌面隐藏外部磁盘和可移动介质
defaults write com.apple.finder ShowExternalHardDrivesOnDesktop -bool false
defaults write com.apple.finder ShowRemovableMediaOnDesktop -bool false

# 显示所有扩展名和隐藏文件
defaults write -g AppleShowAllExtensions -bool true
defaults write com.apple.finder AppleShowAllFiles -bool true

# 禁用修改扩展名时的警告
defaults write com.apple.finder FXEnableExtensionChangeWarning -bool false

# 显示底部地址栏
defaults write com.apple.finder ShowPathbar -bool true

# 禁止创建 .DS_Store 文件
defaults write com.apple.desktopservices DSDontWriteNetworkStores -bool true
```

## Vim 

#### 开启行号

```bash
vim ~/.vimrc
set number
```

