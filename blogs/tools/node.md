---
title: Node.js 版本管理工具
date: 2023-12-06
categories:
  - 环境配置
tags:
  - 环境配置
  - Node
---

# Node.js 版本管理工具

## [n](https://github.com/tj/n) 

n 是一款交互式的 Node.js 版本管理工具，没有子脚本，没有配置文件，也没有复杂的 API，使用起来非常简单。

需要注意的是，n 只适用于 macOS 和 Linux ，不适用于 Windows。

![1](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202312041136987.gif)

### 安装方式

使用 npm 直接安装到全局：

```bash
npm install n -g
```

### 常用命令

```bash
n          # 显示所有已下载版本
n 10.16.0  # 下载指定版本
n lts      # 查看远程所有 LTS Node.js 版本
n run 10.16.0 # 运行指定的 Node.js 版本
```

输入 `n -h`查看帮助信息，主要命令如下：

```bash
  n                              Display downloaded Node.js versions and install selection
  n latest                       Install the latest Node.js release (downloading if necessary)
  n lts                          Install the latest LTS Node.js release (downloading if necessary)
  n <version>                    Install Node.js <version> (downloading if necessary)
  n install <version>            Install Node.js <version> (downloading if necessary)
  n run <version> [args ...]     Execute downloaded Node.js <version> with [args ...]
  n which <version>              Output path for downloaded node <version>
  n exec <vers> <cmd> [args...]  Execute command with modified PATH, so downloaded node <version> and npm first
  n rm <version ...>             Remove the given downloaded version(s)
  n prune                        Remove all downloaded versions except the installed version
  n --latest                     Output the latest Node.js version available
  n --lts                        Output the latest LTS Node.js version available
  n ls                           Output downloaded versions
  n ls-remote [version]          Output matching versions available for download
  n uninstall                    Remove the installed Node.js
```

## [nvm-desktop](https://github.com/1111mp/nvm-desktop/blob/main/README-zh_CN.md)

nvm-desktop 是一个以可视化界面操作方式管理多个 Node 版本的桌面应用，使用 Electron 构建（支持 Macos 和 Windows 系统）。通过该应用，可以快速安装和使用不同版本的 Node。它完美支持为不同的项目单独设置和切换 Node 版本，不依赖操作系统的任何特定功能和 shell。

功能包括：

- 支持为系统全局和项目单独设置Node引擎版本
- 管理Node的命令行工具
- 支持英文和简体中文
- 支持自定义下载镜像地址 (默认是 https://nodejs.org/dist)
- Windows 平台支持自动检查更新
- 完整的自动化测试
- 支持设置主题，可选项包括：跟随系统、亮色、暗黑

### 下载

首先，在 nvm-desktop 的 [Release](https://github.com/1111mp/nvm-desktop/releases) 页面下载系统对应的版本：

![image-20231204142034149](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202312041420201.png)

### 环境配置

安装完成之后，如果使用的是 Mac 电脑，需要在`~/.bashrc`、 `~/.profile` 或 `~/.zshrc` 文件添加以下内容，以便在登录时自动获取它：

```bash
export NVMD_DIR="$HOME/.nvmd" 
export PATH="$NVMD_DIR/bin:$PATH"
```

Windows 下则不需要额外的操作，安装好运行之后直接搜索指定的 Node.js 版本点击下载安装即可。