import { defineUserConfig } from 'vuepress';
import { recoTheme } from 'vuepress-theme-reco';
import katex from 'markdown-it-katex';
import { googleAnalyticsPlugin } from '@vuepress/plugin-google-analytics';
import { seoPlugin } from 'vuepress-plugin-seo2';
import { sitemapPlugin } from 'vuepress-plugin-sitemap2';
import webpackBundler from '@vuepress/bundler-webpack';

export default defineUserConfig({
  bundler: webpackBundler({
    postcss: {},
    vue: {},
  }),

  title: '鑫旺心语',
  description: '心有千言，言不尽意',
  port: 8001,
  dest: 'dist',
  head: [
    ['link', { rel: 'icon', href: '/cat-avatar.jpg' }],
    ['link', { rel: 'stylesheet', href: '/css/katex.min.css' }],
    ['link', { rel: 'stylesheet', href: '/css/github-markdown.min.css' }],
    [
      'meta',
      {
        name: 'description',
        content: '鑫旺心语官网',
      },
    ],
    ['script', {},
      `var _hmt = _hmt || [];
          (function() {
            var hm = document.createElement("script");
            hm.src = "https://hm.baidu.com/hm.js?05461e524359755afd727f3110418045";
            var s = document.getElementsByTagName("script")[0]; 
            s.parentNode.insertBefore(hm, s);
          })();`,
    ],
  ],
  lang: 'zh-CN',
  theme: recoTheme({
    colorMode: 'dark',
    style: '@vuepress-reco/style-default',
    logo: '/cat-avatar.jpg',
    author: '鑫旺',
    authorAvatar: '/cat-avatar.jpg',
    blogsRepo: 'https://github.com/zhouxin65/my-blog',
    blogsBranch: 'main',
    lastUpdatedText: '上次更新',
    // 侧边栏
    // series 为原 sidebar
    series: {
      '/blogs/back-end/optimize/': [
        {
          text: '项目性能优化',
          children: [
            {
              text: '项目性能环境搭建',
              link: '/blogs/back-end/optimize/environmentBuilding.html',
            },
          ],
        },
      ],
      '/blogs/back-end/jvm/': [
        {
          text: 'JVM',
          children: [
            {
              text: 'JVM 虚拟机概述',
              link: '/blogs/back-end/jvm/virtualMachineOverview.html',
            },
            {
              text: 'JVM 垃圾收集器',
              link: '/blogs/back-end/jvm/garbageCollector.html',
            },
          ],
        },
      ],
      '/blogs/back-end/concurrent/': [
        {
          text: '并发编程',
          children: [
            {
              text: '多线程',
              link: '/blogs/back-end/concurrent/multiThread.html',
            },
            {
              text: '并发编程',
              link: '/blogs/back-end/concurrent/concurrentProgramming.html',
            },
          ],
        },
      ],
      '/blogs/back-end/network/': [
        {
          text: '网络编程',
          children: [
            {
              text: '网络编程基础',
              link: '/blogs/back-end/network/fundamentals.html',
            },
            {
              text: '深入 BIO 与 NIO',
              link: '/blogs/back-end/network/nio.html',
            },
            {
              text: '手写一个 RPC 框架 HeroRPC',
              link: '/blogs/back-end/network/rpc.html',
            },
            {
              text: '手写一个 Tomcat',
              link: '/blogs/back-end/network/tomcat.html',
            },
            {
              text: '600 W+ 连接网络应用实战',
              link: '/blogs/back-end/network/disruptor.html',
            },
          ],
        },
      ],
      '/blogs/tools/': [
        {
          text: 'Mac 平台',
          children: [
            {
              text: '设置',
              link: '/blogs/tools/mac.html',
            },
            {
              text: 'Oh-my-zsh 安装',
              link: '/blogs/tools/oh-my-zsh.html',
            },
            {
              text: '管理工具',
              children: [
                {
                  text: 'Node.js 版本管理工具',
                  link: '/blogs/tools/node.html',
                },
                {
                  text: 'HomeBrew 包管理工具',
                  link: '/blogs/tools/homeBrew.html',
                },
                {
                  text: 'SDKMAN SDK 管理工具',
                  link: '/blogs/tools/sdk-man.html',
                },
              ],
            },
          ],
        },
      ],
    },
    // 导航栏
    navbar: [
      { text: '首页', link: '/' },
      {
        text: '后端',
        ariaLabel: '后端菜单',
        icon: 'PresentationFile',
        children: [
          { text: '优化', link: '/blogs/back-end/optimize/environmentBuilding.html' },
          { text: 'JVM', link: '/blogs/back-end/jvm/virtualMachineOverview.html' },
          { text: '并发编程', link: '/blogs/back-end/concurrent/multiThread.html' },
          { text: '网络编程', link: '/blogs/back-end/network/fundamentals.html' },
        ],
      },
      // {text: '笔记', link: '/blogs/notes/note1', icon: 'Document'},
      // {text: '书籍', link: '/blogs/books/catalogue.html', icon: 'Book'},
      // {text: 'workflow', link: '/blogs/workflow/workflow1', icon: 'LoadBalancerVpc'},
      {
        text: '提效工具',
        children: [
          { text: 'Mac 平台', link: '/blogs/tools/mac.html' },
        ],
        link: '',
        icon: 'ToolBox',
      },
    ],
    // 公告
    bulletin: {
      body: [
        {
          type: 'text',
          content: '🎉 你好呀，欢迎来到鑫旺心语！ 🎉',
          style: 'font-size: 12px;',
        },
        {
          type: 'hr',
        },
        {
          type: 'title',
          content: '联系我',
        },
        {
          type: 'text',
          content: `
                      <ul>
                        <li>邮箱：zhouxin65@foxmail.com</li>
                      </ul>`,
          style: 'font-size: 12px;',
        },
        {
          type: 'hr',
        },
        {
          type: 'buttongroup',
          children: [
            {
              text: '打赏',
              link: '/docs/others/donate.html',
            },
          ],
        },
      ],
    },

    // commentConfig: {
    //   type: 'valie',
    //   // options 与 1.x 的 valineConfig 配置一致
    //   options: {
    //     // appId: 'xxx',
    //     // appKey: 'xxx',
    //     // placeholder: '填写邮箱可以收到回复提醒哦！',
    //     // verify: true, // 验证码服务
    //     // notify: true,
    //     // recordIP: true,
    //     // hideComments: true // 隐藏评论
    //   },
    // },
    algolia: {
      appId: '1UTTDQ4S2Z',
      apiKey: '813f32e60b86c893421cba04800d9f8b',
      indexName: 'xinwang',
      inputSelector: '### REPLACE ME ####',
      placeholder: '请输入关键词',
      translations: {
        button: {
          buttonText: '搜索',
        },
      },
      algoliaOptions: { 'facetFilters': ['lang:$LANG'] },
      debug: false, // Set debug to true if you want to inspect the dropdown
    },
  }),

  // 插件
  plugins: [
    googleAnalyticsPlugin({
      id: 'G-F5114VJLFL',
    }),
    seoPlugin({
      hostname: 'https://www.xinwang.life',
      author: {
        name: '鑫旺',
        email: 'zhouxin65@foxmail.com',
      },
    }),
    sitemapPlugin({
      // 配置选项
      hostname: 'https://www.xinwang.life',
      changefreq: 'weekly',
    }),
  ],
  extendsMarkdown: md => {
    md.set({ html: true });
    md.use(katex);
  },
  // debug: true,
});
