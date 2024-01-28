---
title: HomeBrew 包管理工具
date: 2023-12-11
categories:
  - 环境配置
tags:
  - 环境配置
---
# HomeBrew 安装

```bash
/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
```

如果你等待一段时间之后遇到下面提示，就说明无法访问官方脚本地址：

![image-20231211160310702](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202312111603734.png)使用国内镜像来加速：

```bash
/bin/zsh -c "$(curl -fsSL https://gitee.com/cunkai/HomebrewCN/raw/master/Homebrew.sh)"
```

![image-20231211161510262](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202312111615284.png)

跟着序号选择安装，最后按照步骤配置一下国内镜像即可

![image-20231211161600600](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202312111616616.png)

安装好后，`brew -v` 若能显示版本号则安装成功