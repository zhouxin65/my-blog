---
title: SDKMAN JDK 版本管理工具
date: 2023-12-11
categories:
  - tools
tags:
  - tools
#sticky: 1
---

# SDKMAN - JDK 版本管理工具

## 安装

在 macOS 下，打开终端并执行：

```bash
curl -s "https://get.sdkman.io" | bash
```

若出现以下错误，则配置一下科学上网的端口

![image-20231211152136090](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202312111521133.png)

这里我的科学上网工具为 veee，端口一般为：http - 15236、sockt5 - 15235

```bash
git config --global http.proxy 127.0.0.1:15236
git config --global https.proxy 127.0.0.1:15236
```

重新执行 curl 命令后，重启终端或执行：

```bash
source "$HOME/.sdkman/bin/sdkman-init.sh"
```

配置环境变量

```bash
vim ~/.zshrc

# sdkman
export SDKMAN_DIR="$HOME/.sdkman"
[[ -s "$HOME/.sdkman/bin/sdkman-init.sh" ]] && source "$HOME/.sdkman/bin/sdkman-init.sh"
export JAVA_HOME=$SDKMAN_DIR/candidates/java/current

source ~/.zshrc
```

最后，执行 `sdk version` 查看安装结果

## 使用

### 查看所有 JDK 版本

```bash
sdk list java
```

![image-20231211174629128](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202312111746157.png)

### 安装 SDK

```bash
sdk install java <version>
```

![image-20231211174921339](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202312111749374.png)

### 切换默认 SDK

```bash
sdk default java <version>
```

![image-20231211175251947](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202312111752982.png)

### 卸载 SDK

```bash
sdk uninstall java <version>
```

![image-20231211175615137](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202312111756179.png)
