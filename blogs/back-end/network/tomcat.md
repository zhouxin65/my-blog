---
title: 手写一个 Tomcat
date: 2024-03-07
categories:
- 网络编程
tags:
- 网络编程
- tomcat
- 手写框架
---

# 手写一个 Tomcat

本案例，咱们手写的是一个 Web 容器命名为 HeroCat，类似于 Tomcat 的容器，用于处理 HTTP 请求。**Servlet 规范**很复杂，所以本 Web 容器并没有去实现 JavaEE 的 Servlet 规范，所以说并不算是一个 Servlet 容器。但是，其是类比着 Tomcat 来写的，这里定义了自己的请求、响应及 Servlet 规范，分别命名为了 HeroRequest、HeroResponse 与 HeroServlet。

## 1. HeroCat 容器需求

**需求：软件工程师自定义一个Tomcat提供给码农使用，码农只需要按照规定步骤，即可编写出自己的应用程序发布到HeroCat中供用户使用。**

### 1.1 角色

Web容器（HeroCat）相关的角色：

- **HeroCat 开发者**，编写 Hero 核心代码的软件工程师，下文简称：工程师
- **HeroCat 使用者**，应用程序业务功能开发的软件工程师，下文简称：码农
- **应用程序使用者**：用户

设计思路：

![image-20240307203240739](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202403072032768.png)

### 1.2 使用步骤 - 码农

**码农使用 HeroCat 的步骤**：

- 码农编写自己的应用程序：

  - 导入HeroCat依赖坐标，并编写启动类
  - 将自定义Servlet 放置到指定包下：例如 `com.hero.webapp` 

- 码农发布自己的服务：

  - 码农将自己的接口 URL 按照固定规则发布：按照后缀， .do 、.action 、无后缀
  - 不管用何种规则：都将映射到自定义的 Servlet（类名映射，忽略大小写）

  ```tex
  # 举例
  http://localhost:8080/aaa/bbb/userservlet?name=xinwang
  ```

- 用户在访问应用程序：

  - 按照 URL 地址访问服务
  - 如果没有指定的 Servlet，则访问默认的 Servlet

### 1.3 HeroCat 开发思路 - 工程师

- **工程师实现 HeroCat 思路**：
  - 第一步：创建 HeroCat 工程，导入依赖坐标
  - 第二步：定义 Servlet 规范，HeroRequest、HeroResponse、HeroServlet
    - Servlet 的规范其实是语言层面定义 JavaEE
  - 第三步：实现 Servlet 规范
    - HttpHeroRequest
    - HttpHeroResponse
    - DefaultHeroServlet【兜底】
  - 第四步：编写 HeroCat 核心代码：
    - HeroCatServer 基于 Netty 实现：Servlet 容器
    - HeroCatHandler 处理请求，映射到 Servlet 的容器的自定义 Servlet（Map容器）中去
  - 第五步：打包发布 HeroCat

## 2. 创建工程

### 2.1 创建工程

创建一个普通的 Maven 的 Java 工程 herocat

### 2.2 导入依赖

```xml
<dependencies>
  <!-- netty-all依赖 -->
  <dependency>
    <groupId>io.netty</groupId>
    <artifactId>netty-all</artifactId>
    <version>4.1.36.Final</version>
  </dependency>
  <!--lombok依赖-->
  <dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <version>1.18.6</version>
    <scope>provided</scope>
  </dependency>
  <dependency>
    <groupId>org.dom4j</groupId>
    <artifactId>dom4j</artifactId>
    <version>2.1.3</version>
  </dependency>
  <dependency>
    <groupId>jaxen</groupId>
    <artifactId>jaxen</artifactId>
    <version>1.1.6</version>
  </dependency>
</dependencies>
```

## 3. 定义 Servlet 规范

### 3.1 定义请求接口 HeroRequest

```java
package com.hero.servlet;

import java.util.List;
import java.util.Map;

/**
 * Servlet 规范之请求规范
 */
public interface HeroRequest {
    // 获取URI，包含请求参数，即?后的内容
    String getUri();

    // 获取请求路径，其不包含请求参数
    String getPath();

    // 获取请求方法（GET、POST等）
    String getMethod();

    // 获取所有请求参数
    Map<String, List<String>> getParameters();

    // 获取指定名称的请求参数
    List<String> getParameters(String name);

    // 获取指定名称的请求参数的第一个值
    String getParameter(String name);
}
```

### 3.2 定义响应接口 HeroResponse

```java
package com.hero.servlet;

/**
 * Servlet 规范之响应规范
 */
public interface HeroResponse {
    // 将响应写入到 Channel
    void write(String content) throws Exception;
}
```

### 3.3 定义 Servlet 规范 HeroServlet

```java
package com.hero.servlet;

/**
 * 定义 Servlet 规范
 */
public abstract class HeroServlet {
    // 处理 Http 的 get 请求
    public abstract void doGet(HeroRequest request, HeroResponse response)
            throws Exception;

    // 处理 Http 的 post 请求
    public abstract void doPost(HeroRequest request, HeroResponse response)
            throws Exception;
}
```

## 4. 定义 Tomcat 服务器

### 4.1 定义 HttpHeroRequest 类

```java
package com.hero.herocat;

import com.hero.servlet.HeroRequest;
import io.netty.handler.codec.http.HttpRequest;
import io.netty.handler.codec.http.QueryStringDecoder;

import java.util.List;
import java.util.Map;

/**
 * HeroCat 中对 Servlet 规范的默认实现
 */
public class HttpHeroRequest implements HeroRequest {
    private final HttpRequest request;

    public HttpHeroRequest(HttpRequest request) {
        this.request = request;
    }

    @Override
    public String getUri() {
        return request.uri();
    }

    @Override
    public String getPath() {
        QueryStringDecoder decoder = new QueryStringDecoder(request.uri());
        return decoder.path();
    }

    @Override
    public String getMethod() {
        return request.method().name();
    }

    @Override
    public Map<String, List<String>> getParameters() {
        QueryStringDecoder decoder = new QueryStringDecoder(request.uri());
        return decoder.parameters();
    }

    @Override
    public List<String> getParameters(String name) {
        return getParameters().get(name);
    }

    @Override
    public String getParameter(String name) {
        List<String> parameters = getParameters(name);
        if (parameters == null || parameters.isEmpty()) {
            return null;
        }
        return parameters.get(0);
    }
}
```

### 4.2 定义 HttpHeroResponse 类

```java
package com.hero.herocat;

import com.hero.servlet.HeroResponse;
import io.netty.buffer.Unpooled;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.http.*;
import io.netty.util.internal.StringUtil;

import java.nio.charset.StandardCharsets;

/**
 * HeroCat 中对 Servlet 规范的默认实现
 */
public class HttpHeroResponse implements HeroResponse {
    private HttpRequest request;
    private ChannelHandlerContext context;

    public HttpHeroResponse(HttpRequest request, ChannelHandlerContext
            context) {
        this.request = request;
        this.context = context;
    }

    @Override
    public void write(String content) throws Exception {
        // 处理content为空的情况
        if (StringUtil.isNullOrEmpty(content)) {
            return;
        }
        // 创建响应对象
        FullHttpResponse response = new
                DefaultFullHttpResponse(HttpVersion.HTTP_1_1,
                HttpResponseStatus.OK,
                // 根据响应体内容大小为 response 对象分配存储空间
                Unpooled.wrappedBuffer(content.getBytes(StandardCharsets.UTF_8)));
        // 获取响应头
        HttpHeaders headers = response.headers();
        // 设置响应体类型
        headers.set(HttpHeaderNames.CONTENT_TYPE, "text/json");
        // 设置响应体长度
        headers.set(HttpHeaderNames.CONTENT_LENGTH, response.content().readableBytes());
        // 设置缓存过期时间
        headers.set(HttpHeaderNames.EXPIRES, 0);
        // 若 HTTP 请求是长连接，则响应也使用长连接
        if (HttpUtil.isKeepAlive(request)) {
            headers.set(HttpHeaderNames.CONNECTION, HttpHeaderValues.KEEP_ALIVE);
        }
        // 将响应写入到 Channel
        context.writeAndFlush(response);
    }
}
```

### 4.3 定义 DefaultHeroServlet 类

```java
package com.hero.herocat;

import com.hero.servlet.HeroRequest;
import com.hero.servlet.HeroResponse;
import com.hero.servlet.HeroServlet;

/**
 * HeroCat 中对 Servlet 规范的默认实现
 */
public class DefaultHeroServlet extends HeroServlet {
    @Override
    public void doGet(HeroRequest request, HeroResponse response) throws
            Exception {
        // http://localhost:8080/aaa/bbb/oneservlet?name=xiong
        // path：/aaa/bbb/oneservlet?name=xinwang
        String uri = request.getUri();
        String name = uri.substring(0, uri.indexOf("?"));
        response.write("404 - no this servlet : " + name);
    }

    @Override
    public void doPost(HeroRequest request, HeroResponse response) throws
            Exception {
        doGet(request, response);
    }
}
```

### 4.4 定义服务器类 HeroCatServer

- HeroCat 的 Servlet 容器
  - 第一个 map：key 为指定的 Servlet 的名称，value 为该 Servlet 实例
  - 第二个 map：key 为指定的 Servlet 的名称，value 为该 Servlet 的全限定性类名

```java
package com.hero.herocat;

import com.hero.servlet.HeroServlet;
import io.netty.bootstrap.ServerBootstrap;
import io.netty.channel.*;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.SocketChannel;
import io.netty.channel.socket.nio.NioServerSocketChannel;
import io.netty.handler.codec.http.HttpServerCodec;
import org.dom4j.Document;
import org.dom4j.DocumentException;
import org.dom4j.Element;
import org.dom4j.io.SAXReader;

import java.io.File;
import java.io.InputStream;
import java.net.URL;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;

/**
 * HeroCat 功能的实现
 */
public class HeroCatServer {
    // key 为 HeroServlet 的简单类名，value 为对应 HeroServlet 实例
    private final Map<String, HeroServlet> nameToServletMap = new ConcurrentHashMap<>();
    // key 为 HeroServlet 的简单类名，value 为对应 HeroServlet 类的全限定性类名
    private final Map<String, String> nameToClassNameMap = new HashMap<>();
    // HeroServlet 存放位置
    private final String basePackage;

    public HeroCatServer(String basePackage) {
        this.basePackage = basePackage;
    }

    // 启动tomcat
    public void start() throws Exception {
        // 加载指定包中的所有Servlet的类名
        cacheClassName(basePackage);
        // 启动server服务
        runServer();
    }

    private void cacheClassName(String basePackage) {
        // 获取指定包中的资源
        URL resource = this.getClass().getClassLoader()
                // com.abc.webapp => com/abc/webapp
                .getResource(basePackage.replaceAll("\\.", "/"));
        // 若目录中没有任何资源，则直接结束
        if (resource == null) {
            return;
        }
        // 将 URL 资源转换为 File 资源
        File dir = new File(resource.getFile());
        // 遍历指定包及其子孙包中的所有文件，查找所有 .class 文件
        for (File file : Objects.requireNonNull(dir.listFiles())) {
            if (file.isDirectory()) {
                // 若当前遍历的 file 为目录，则递归调用当前方法
                cacheClassName(basePackage + "." + file.getName());
            } else if (file.getName().endsWith(".class")) {
                String simpleClassName = file.getName().replace(".class", "").trim();
                // key 为简单类名，value 为全限定性类名
                nameToClassNameMap.put(simpleClassName.toLowerCase(), basePackage + "." + simpleClassName);
            }
        }
        // System.out.println(nameToClassNameMap);
    }

    private void runServer() throws Exception {
        EventLoopGroup parent = new NioEventLoopGroup();
        EventLoopGroup child = new NioEventLoopGroup();
        try {
            ServerBootstrap bootstrap = new ServerBootstrap();
            bootstrap.group(parent, child)
                    // 指定存放请求的队列的长度
                    .option(ChannelOption.SO_BACKLOG, 1024)
                    // 指定是否启用心跳机制来检测长连接的存活性，即客户端的存活性
                    .childOption(ChannelOption.SO_KEEPALIVE, true)
                    .channel(NioServerSocketChannel.class)
                    .childHandler(new ChannelInitializer<SocketChannel>() {
                        @Override
                        protected void initChannel(SocketChannel ch) throws Exception {
                            ChannelPipeline pipeline = ch.pipeline();
                            pipeline.addLast(new HttpServerCodec());
                            pipeline.addLast(new HeroCatHandler(nameToServletMap, nameToClassNameMap));
                        }
                    });
            int port = initPort();
            ChannelFuture future = bootstrap.bind(port).sync();
            System.out.println("HeroCat 启动成功：监听端口号为:" + port);
            future.channel().closeFuture().sync();
        } finally {
            parent.shutdownGracefully();
            child.shutdownGracefully();
        }
    }

    // 初始化端口
    private int initPort() throws DocumentException {
        // 初始化端口
        // 读取配置文件 Server.xml 中的端口号
        InputStream in = HeroCatServer.class.getClassLoader().getResourceAsStream("server.xml");
        // 获取配置文件输入流
        SAXReader saxReader = new SAXReader();
        Document doc = saxReader.read(in);
        // 使用 SAXReader + XPath 读取端口配置
        Element portEle = (Element) doc.selectSingleNode("//port");
        return Integer.valueOf(portEle.getText());
    }
}

```

### 4.5 定义服务端处理器 HeroCatHandler

```java
package com.hero.herocat;

import com.hero.servlet.HeroRequest;
import com.hero.servlet.HeroResponse;
import com.hero.servlet.HeroServlet;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.ChannelInboundHandlerAdapter;
import io.netty.handler.codec.http.HttpRequest;

import java.util.Map;

/**
 * HeroCat 服务端处理器
 * <p>
 * 1）从用户请求 URI 中解析出要访问的 Servlet 名称
 * 2）从 nameToServletMap 中查找是否存在该名称的 key。若存在，则直接使用该实例，否则执
 * 行第 3）步
 * 3）从 nameToClassNameMap 中查找是否存在该名称的 key，若存在，则获取到其对应的全限定
 * 性类名，使用反射机制创建相应的 servlet 实例，并写入到 nameToServletMap 中，若不存在，则直
 * 接访问默认 Servlet
 */
public class HeroCatHandler extends ChannelInboundHandlerAdapter {
    private Map<String, HeroServlet> nameToServletMap;
    private Map<String, String> nameToClassNameMap;

    public HeroCatHandler(Map<String, HeroServlet> nameToServletMap, Map<String, String> nameToClassNameMap) {
        this.nameToServletMap = nameToServletMap;
        this.nameToClassNameMap = nameToClassNameMap;
    }

    @Override
    public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
        if (msg instanceof HttpRequest) {
            HttpRequest request = (HttpRequest) msg;
            String uri = request.uri();
            // 从请求中解析出要访问的 Servlet 名称
            // aaa/bbb/twoservlet?name=aa
            String servletName = uri.substring(uri.lastIndexOf("/") + 1, uri.indexOf("?"));
            HeroServlet heroServlet = new DefaultHeroServlet();
            if (nameToServletMap.containsKey(servletName)) {
                heroServlet = nameToServletMap.get(servletName);
            } else if (nameToClassNameMap.containsKey(servletName)) {
                // double-check，双重检测锁
                if (nameToServletMap.get(servletName) == null) {
                    synchronized (this) {
                        if (nameToServletMap.get(servletName) == null) {
                            // 获取当前Servlet的全限定性类名
                            String className = nameToClassNameMap.get(servletName);
                            // 使用反射机制创建 Servlet 实例
                            heroServlet = (HeroServlet) Class.forName(className).newInstance();
                            // 将 Servlet 实例写入到 nameToServletMap
                            nameToServletMap.put(servletName, heroServlet);
                        }
                    }
                }
            }
            // end-else if
            // 代码走到这里，servlet 肯定不空
            HeroRequest req = new HttpHeroRequest(request);
            HeroResponse res = new HttpHeroResponse(request, ctx);
            // 根据不同的请求类型，调用 heroServlet 实例的不同方法
            if (request.method().name().equalsIgnoreCase("GET")) {
                heroServlet.doGet(req, res);
            } else if (request.method().name().equalsIgnoreCase("POST")) {
                heroServlet.doPost(req, res);
            }
            ctx.close();
        }
    }

    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
        cause.printStackTrace();
        ctx.close();
    }
}
```

### 4.6 定义启动类 HeroCat

```java
package com.hero.herocat;

public class HeroCat {
    public static void main(String[] args) throws Exception {
        HeroCatServer server = new HeroCatServer("com.hero.webapp");
        server.start();
    }
}
```

## 5. 定义业务 SkuServlet

```java
package com.hero.webapp;

import com.hero.servlet.HeroRequest;
import com.hero.servlet.HeroResponse;
import com.hero.servlet.HeroServlet;

/**
 * 业务 Servlet
 */
public class SkuServlet extends HeroServlet {
    @Override
    public void doGet(HeroRequest request, HeroResponse response) throws
            Exception {
        String uri = request.getUri();
        String path = request.getPath();
        String method = request.getMethod();
        String name = request.getParameter("name");
        String content = "uri = " + uri + "\n" +
                "path = " + path + "\n" +
                "method = " + method + "\n" +
                "param = " + name;
        response.write(content);
    }

    @Override
    public void doPost(HeroRequest request, HeroResponse response) throws
            Exception {
        doGet(request, response);
    }
}

```

