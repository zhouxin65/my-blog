module.exports = {
    locales: {
        "/": {
            lang: "zh-CN"
        }
    },
    theme: "reco",
    title: '鑫旺的知识库',
    description: '好好学习，天天向上',
    base: '/',
    markdown: {
        lineNumbers: true // 代码块显示行号
    },
    themeConfig: {
        // 子侧边栏
        subSidebar: 'auto',
        sidebarDepth: 1,
        logo: "/avatar.png",
        // 个人信息的头像
        authorAvatar: "/avatar.png",
        // 主题模式 博客模式
        type: "blog",
        // 内置搜索
        search: true,
        searchMaxSuggestions: 10,
        // 设置作者
        author: "鑫旺",
        lastUpdated: '更新时间',
        // 设置时区偏移量（8小时）
        timezoneOffset: 8 * 60 * 60 * 1000,
        // 顶部导航栏配置
        nav: [
            {text: "首页", link: "/"},
            {
                text: "链接",
                items: [
                    {text: "掘金", link: "https://juejin.cn/user/422676380792632"},
                    {text: "Github", link: "https://github.com/zhouxin65"}
                ]
            },
            {text: '书籍', link: '/books/bookList', icon: 'reco-document'},
        ],
        // 侧边栏配置
        sidebar: {
            '/blogs/': [
                {
                    title: '侧边栏分组 1',
                    collapsable: true,
                    sidebarDepth: 1,
                    children: [
                        "/blogs/1",
                        "/blogs/2"
                    ]
                },
                {
                    title: '分组 2',
                    collapsable: true,
                    sidebarDepth: 1,
                    children: [
                        {title: "haha", path: "/blogs/2"}
                    ]
                },
            ],
        },
        // 博客配置
        blogConfig: {
            category: {
                location: 2, // 在导航栏菜单中所占的位置，默认2
                text: "博客", // 默认文案 “分类”
            },
            tag: {
                location: 4, // 在导航栏菜单中所占的位置，默认4
                text: "Tag", // 默认文案 “标签”
            },
            socialLinks: [
                {icon: 'reco-github', link: 'https://github.com/zhouxin65'}
            ]
        }
    },
    // 插件
    plugins: [
        // 返回火箭
        ['@vuepress-reco/vuepress-plugin-back-to-top'],
        // 樱花效果
        [
            "sakura",
            {
                num: 20, // 默认数量
                show: true, //  是否显示
                zIndex: -1, // 层级
                img: {
                    replace: false, // false 默认图 true 换图 需要填写httpUrl地址
                },
            },
        ],
        // 鼠标点击效果
        [
            "cursor-effects",
            {
                size: 4, // size of the particle, default: 2
                shape: "star", // ['star' | 'circle'], // shape of the particle, default: 'star'
                zIndex: 999999999, // z-index property of the canvas, default: 999999999
            },
        ],
        // 内容刷新弹窗插件
        ['@vuepress/pwa', {
            serviceWorker: true,
            updatePopup: {
                message: "发现新内容可用",
                buttonText: "刷新"
            }
        }],
        // 分页插件
        ['@vuepress-reco/vuepress-plugin-pagation', {
            perPage: 5  // 每页展示条数
        }]
    ],
    // 评论插件配置
    // valineConfig: {
    //     appId: '替换为自己的appId',
    //     appKey: '替换为自己的appKey',
    //     showComment: false
    //     // isShowComments: true  在需要添加评论的页面加上这个配置
    // }

}