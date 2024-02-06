---
title: Oh-my-zsh 安装
date: 2023-12-11
categories:
- 环境配置
tags:
- 环境配置
---

# Oh-my-zsh 安装

## 设置zsh为默认shell

macOS 预装了 zsh，若发现系统未安装，可通过 brew 进行安装

```bash
# 查看当前Shell，若返回值为/bin/zsh，则无需修改
echo $SHELL 

# 查看可用shell
cat /etc/shells

# 若没有zsh，则安装
brew install zsh

# 将默认shell设置为zsh
chsh -s /bin/zsh
```

## 安装命令

```bash
# 下载 oh-my-zsh
sh -c "$(curl -fsSL https://gitee.com/mirrors/oh-my-zsh/raw/master/tools/install.sh)"

# 备份配置文件(可省略)
cp ~/.zshrc ~/.zshrc.orig

# 创建一个新的配置文件
cp ~/.oh-my-zsh/templates/zshrc.zsh-template ~/.zshrc

# 切换默认shell为zsh
chsh -s /bin/zsh
```

让 zsh 加载 bash 配置：`vim ~/.zshrc`，添加： `source ~/.bash_profile`

## 更换主题

```bash
# 下载主题文件
git clone https://github.com/dracula/zsh.git
 
# 拷贝主题文件并移动lib
cp zsh/dracula.zsh-theme .oh-my-zsh/themes/dracula.zsh-theme
mkdir ~/.oh-my-zsh/themes/lib
cp zsh/lib/async.zsh .oh-my-zsh/themes/lib/

# 修改zsh主题。编辑~(用户名)下.zshrc文件，修改ZSH_THEME为"dracula"
vim ~/.zshrc
  ZSH_THEME="dracula"
```

### 更换iterm2的主题为[Dracula](https://draculatheme.com/iterm/)：

```bash
# 下载iterm2的Dracula主题
git clone https://github.com/dracula/iterm.git
```

设置主题：

1. *iTerm2 > Preferences > Profiles > Colors Tab*
2. Open the *Color Presets...* 
3. 从列表中选择import
4. 选择刚才下载主题中`Dracula.itermcolors` 文件，确定

![image-20231211171015172](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202312111710860.png)

<img src="https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202312111709504.png" alt="image-20231211170908473"  />

## 插件安装

### **命令高亮插件[zsh-syntax-highlighting](https://github.com/zsh-users/zsh-syntax-highlighting)**(命令正确绿色，命令错误红色)

```bash
# 下载命令高亮插件 这里下载到用户名下.zsh文件夹下
sudo git clone https://github.com/zsh-users/zsh-syntax-highlighting ~/.zsh/zsh-syntax-highlighting
# 编辑配置文件，使用插件
vim ~/.zshrc
  # 命令高亮插件
  source ~/.zsh/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh
```

![image-20231211171614340](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202312111716373.png)

### **命令提示插件[zsh-autosuggestions](https://github.com/zsh-users/zsh-autosuggestions)**

```bash
# 下载命令提示插件
sudo git clone https://github.com/zsh-users/zsh-autosuggestions ~/.zsh/zsh-autosuggestions
# 编辑配置文件，使用插件
$ vim ~/.zshrc
  source ~/.zsh/zsh-autosuggestions/zsh-autosuggestions.zsh
```

