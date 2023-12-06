import {defineUserConfig} from "vuepress";
import type {DefaultThemeOptions} from "vuepress";
import recoTheme from "vuepress-theme-reco";

export default defineUserConfig({
    title: "鑫旺心语",
    description: "Just playing around",
    port: 8001,
    dest: "dist",
    head: [
        ["link", { rel: "icon", href: "/cat-avatar.jpg" }],
        [
            "meta",
            {
                name: "viewport",
                content: "width=device-width,initial-scale=1,user-scalable=no",
            },
        ],
    ],
    theme: recoTheme({
        locales: {
            '/': {
                lang: 'zh-CN',
                title: '鑫旺心语',
                description: '心有千言，言不尽意',
            },
        },
        colorMode: 'light',
        style: "@vuepress-reco/style-default",
        logo: "/cat-avatar.jpg",
        author: "鑫旺",
        authorAvatar: "/cat-avatar.jpg",
        docsRepo: "https://github.com/zhouxin65/my-blog",
        docsBranch: "main",
        // docsDir: "example",
        lastUpdatedText: "上次更新",
        // series 为原 sidebar
        series: {
            "/docs/theme-reco/": [
                {
                    text: "module one",
                    children: ["home", "theme"],
                },
                {
                    text: "module two",
                    children: ["api", "plugin"],
                },
            ],
        },
        navbar: [
            {text: "首页", link: "/"},
            {
                text: "后端",
                ariaLabel: '后端菜单',
                icon: 'Book',
                children: [
                    {text: 'item 1', link: '/docs/back-end/1'},
                    {text: 'item 2', link: '/docs/back-end/2'}
                ]
            },
            {text: "标签", link: "/tags/tag1/1/", icon: 'Tag'},
            {text: '笔记', link: '/docs/notes/note1', icon: 'Document'},
            {text: '源码阅读', link: '/docs/sourceCodes/sourceCode1', icon: 'PresentationFile'},
            {text: 'workflow', link: '/docs/workflow/workflow1', icon: 'LoadBalancerVpc'},
            {text: '提效工具', link: '/docs/tools/tool1', icon: 'ToolBox'},
        ],
        bulletin: {
            body: [
                {
                    type: "text",
                    content: '🎉🎉 你好呀，欢迎来到鑫旺心语！ 🎉🎉',
                    style: "font-size: 12px;",
                },
                {
                    type: "hr",
                },
                {
                    type: "title",
                    content: "联系我",
                },
                {
                    type: "text",
                    content: `
                      <ul>
                        <li>邮箱：zhouxin65@foxmail.com</li>
                      </ul>`,
                    style: "font-size: 12px;",
                },
                {
                    type: "hr",
                },
                {
                    type: "buttongroup",
                    children: [
                        {
                            text: "打赏",
                            link: "/docs/others/donate.html",
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
    }),
    // debug: true,
});
