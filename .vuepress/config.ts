import {defineUserConfig} from "vuepress";
import type {DefaultThemeOptions} from "vuepress";
import recoTheme from "vuepress-theme-reco";

export default defineUserConfig({
    title: "鑫旺心语",
    description: "Just playing around",
    port: 8001,
    dest: "dist",
    head: [
        ["link", {rel: "icon", href: "/cat-avatar.jpg"}],
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
        blogsRepo: "https://github.com/zhouxin65/my-blog",
        blogsBranch: "main",
        lastUpdatedText: "上次更新",
        // 自动设置分类
        // autoSetBlogCategories: true,
        // autoSetSeries: true,

        // series 为原 sidebar
        series: {
            "/blogs/theme-reco/": [
                {
                    text: "module one",
                    children: ["home", "theme"],
                },
                {
                    text: "module two",
                    children: ["api", "plugin"],
                },
            ],
            "/blogs/tools/": [
                {
                    text: "Mac 平台",
                    children: [
                        {
                            text: "设置",
                            link: "/blogs/tools/mac.html"
                        },
                        {
                            text: "管理工具",
                            children: [
                                {
                                    text: "Node.js 版本管理工具",
                                    link: "/blogs/tools/Node.js 版本管理工具.html"
                                }
                            ]
                        }
                    ]
                },

            ]
        },
        navbar: [
            {text: "首页", link: "/"},
            {
                text: "后端",
                ariaLabel: '后端菜单',
                icon: 'Book',
                children: [
                    {text: 'item 1', link: '/blogs/back-end/1'},
                    {text: 'item 2', link: '/blogs/back-end/2'}
                ]
            },
            {
                text: "标签",
                icon: 'Tag',
                children: [
                    {text: 'Mac', link: '/categories/Mac/1/'},
                    {text: 'Node.js', link: '/categories/Node.js/1/'},
                ]
            },
            {text: '笔记', link: '/blogs/notes/note1', icon: 'Document'},
            {text: '源码阅读', link: '/blogs/sourceCodes/sourceCode1', icon: 'PresentationFile'},
            {text: 'workflow', link: '/blogs/workflow/workflow1', icon: 'LoadBalancerVpc'},
            {
                text: '提效工具',
                children: [
                    {text: 'Mac 平台', link: '/blogs/tools/mac.html'},
                ],
                link: '',
                icon: 'ToolBox'
            },
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
