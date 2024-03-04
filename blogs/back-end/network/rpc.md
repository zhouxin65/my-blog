---
title: 手写一个 RPC 框架 HeroRPC
date: 2024-03-04
categories:
- 网络编程
tags:
- 网络编程
- RPC
- 手写框架
---

# 手写一个 RPC 框架 HeroRPC

## 1. RPC 原理

RPC（Remote Procedure Call)，即远程过程调用，它是一种通过网络从远程计算机程序上请求服务，

而不需要了解底层网络实现的技术。常见的 RPC 框架有：阿里的 Dubbo， Spring 旗下的 Spring Cloud

Feign，Google 出品的 gRPC等。

![image-20240304214641391](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202403042146412.png)

1. **服务消费方（client）以本地调用方式调用服务**
2. client stub（可以用nio，netty实现） 接收到调用后，负责将方法、参数等封装成能够进行网络传输的消息体
3. client stub 将消息进行编码并发送到服务端
4. server stub 收到消息后进行解码
5. server stub 根据解码结果调用**提供者**
6. 本地服务执行并将结果返回给 server stub
7. server stub 将返回导入结果进行编码并发送至**消费方**
8. client stub 接收到消息并进行解码
9. **服务消费方（client）得到结果**

**RPC 的目标就是将 2-8 这些步骤都封装起来，用户无需关心这些细节，可以像调用本地方法一样即可完成远程服务调用。**

## 2. 框架结构示意图

![image-20240304215044478](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202403042150490.png)

- 服务的调用方：两个接口【服务提供方决定】+ 一个包含 main 方法的测试类
- Client Stub: 一个客户端代理类 + 一个客户端业务处理类
  - HeroRPCProxy
  - ResultHandler
- 服务的提供方：两个接口 + 两个实现类
- Server Stub: 一个网络处理服务器 + 一个服务器业务处理类
  - HeroRPCServer
  - InvokeHandler

注意：**服务调用方的接口必须跟服务提供方的接口保持一致**（包路径可以不一致）

最终要实现的目标是：在 TestNettyRPC 中远程调用 SkuServiceImpl 或 UserServiceImpl中的方法

## 3. 代码实现

```xml
<dependency>
	<groupId>io.netty</groupId>
  <artifactId>netty-all</artifactId>
  <version>4.1.8.Final</version>
</dependency>

<dependency>
	<groupId>org.reflections</groupId>
  <artifactId>reflections</artifactId>
  <version>0.10.2</version>
</dependency>
```

### 3.1 Server 服务提供方

#### 3.1.1 SkuService 接口与实现类

```java
package com.hero.rpc.producer;

public interface SkuService {
    String findByName(String name);
}
```

```java
package com.hero.rpc.producer.impl;

import com.hero.rpc.producer.SkuService;

public class SkuServiceImpl implements SkuService {
    @Override
    public String findByName(String name) {
        return "sku{}:" + name;
    }
}
```

#### 3.1.2 UserService 接口与实现类

```java
package com.hero.rpc.producer;

public interface UserService {
    String findById();
}
```

```java
package com.hero.rpc.producer.impl;

import com.hero.rpc.producer.UserService;

public class UserServiceImpl implements UserService {
    @Override
    public String findById() {
        return "user{id=1,username=xinWang}";
    }
}
```

上述代码作为服务的提供方，我们分别编写了两个接口和两个实现类，供消费方远程调用。

### 3.2 Server Stub部分

#### 3.2.1 传输的消息封装类：

```java
package com.hero.rpc.producerStub;

import java.io.Serializable;

//封装类信息
public class ClassInfo implements Serializable {

    private static final long serialVersionUID = 3128985609046223447L;
    private String className; //类名
    private String methodName;//方法名
    private Class<?>[] types; //参数类型
    private Object[] objects;//参数列表

    public String getClassName() {
        return className;
    }

    public void setClassName(String className) {
        this.className = className;
    }

    public String getMethodName() {
        return methodName;
    }

    public void setMethodName(String methodName) {
        this.methodName = methodName;
    }

    public Class<?>[] getTypes() {
        return types;
    }

    public void setTypes(Class<?>[] types) {
        this.types = types;
    }

    public Object[] getObjects() {
        return objects;
    }

    public void setObjects(Object[] objects) {
        this.objects = objects;
    }
}
```

上述代码作为实体类用来封装消费方发起远程调用时传给服务方的数据。

#### 3.2.2 服务端业务处理类：Handler

```java
package com.hero.rpc.producerStub;

import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.ChannelInboundHandlerAdapter;
import org.reflections.Reflections;

import java.lang.reflect.Method;
import java.util.Set;

//服务端业务处理类
public class InvokeHandler extends ChannelInboundHandlerAdapter {
    // 得到某接口下某个实现类的名字
    private String getImplClassName(ClassInfo classInfo) throws Exception {
        // 服务方接口和实现类所在的包路径
        String interfacePath = "com.hero.rpc.producer";
        int lastDot = classInfo.getClassName().lastIndexOf(".");
        // 接口名称
        String interfaceName = classInfo.getClassName().substring(lastDot);
        // 接口字节码对象
        Class superClass = Class.forName(interfacePath + interfaceName);
        // 反射得到某接口下的所有实现类
        Reflections reflections = new Reflections(interfacePath);
        Set<Class> ImplClassSet = reflections.getSubTypesOf(superClass);
        if (ImplClassSet.size() == 0) {
            System.out.println("未找到实现类");
            return null;
        } else if (ImplClassSet.size() > 1) {
            System.out.println("找到多个实现类，未明确使用哪一个");
            return null;
        } else {
            // 把集合转换为数组
            Class[] classes = ImplClassSet.toArray(new Class[0]);
            return classes[0].getName(); //得到实现类的名字
        }
    }

    @Override //读取客户端发来的数据并通过反射调用实现类的方法
    public void channelRead(ChannelHandlerContext ctx, Object msg) throws
            Exception {
        ClassInfo classInfo = (ClassInfo) msg;
        Object clazz = Class.forName(getImplClassName(classInfo)).newInstance();
        Method method = clazz.getClass().getMethod(classInfo.getMethodName(), classInfo.getTypes());
        // 通过反射调用实现类的方法
        Object result = method.invoke(clazz, classInfo.getObjects());
        ctx.writeAndFlush(result);
    }
}
```

上述代码作为业务处理类，读取消费方发来的数据，并根据得到的数据进行本地调用，然后把结果返回给消费方。

#### 3.2.3 RPC 服务端程序：HeroRPCServer

```java
package com.hero.rpc.producerStub;

import io.netty.bootstrap.ServerBootstrap;
import io.netty.channel.*;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.SocketChannel;
import io.netty.channel.socket.nio.NioServerSocketChannel;
import io.netty.handler.codec.serialization.ClassResolvers;
import io.netty.handler.codec.serialization.ObjectDecoder;
import io.netty.handler.codec.serialization.ObjectEncoder;

//RPC服务端程序
public class HeroRPCServer {
    private int port;

    public HeroRPCServer(int port) {
        this.port = port;
    }

    public void start() {
        EventLoopGroup bossGroup = new NioEventLoopGroup();
        EventLoopGroup workerGroup = new NioEventLoopGroup();
        try {
            ServerBootstrap serverBootstrap = new ServerBootstrap();
            serverBootstrap.group(bossGroup, workerGroup)
                    .channel(NioServerSocketChannel.class)
                    .option(ChannelOption.SO_BACKLOG, 128)
                    .childOption(ChannelOption.SO_KEEPALIVE, true)
                    .localAddress(port).childHandler(
                            new ChannelInitializer<SocketChannel>() {
                                @Override
                                protected void initChannel(SocketChannel ch)
                                        throws Exception {
                                    ChannelPipeline pipeline =
                                            ch.pipeline();
                                    // 编码器
                                    pipeline.addLast("encoder", new ObjectEncoder());
                                    // 解码器
                                    pipeline.addLast("decoder", new ObjectDecoder(Integer.MAX_VALUE, ClassResolvers.cacheDisabled(null)));
                                    // 服务端业务处理类
                                    pipeline.addLast(new InvokeHandler());
                                }
                            });
            ChannelFuture future = serverBootstrap.bind(port).sync();
            System.out.println("......Hero RPC is ready......");
            future.channel().closeFuture().sync();
        } catch (Exception e) {
            bossGroup.shutdownGracefully();
            workerGroup.shutdownGracefully();
        }
    }

    public static void main(String[] args) throws Exception {
        new HeroRPCServer(9999).start();
    }
}
```

上述代码是用 Netty 实现的网络服务器，采用 Netty 自带的 ObjectEncoder 和 ObjectDecoder作为编解码器（为了降低复杂度，这里并没有使用第三方的编解码器），当然实际开发时也可以采用 JSON 或 XML。

### 3.3 Client Stub 部分

#### 3.3.1 客户端业务处理类：ResultHandler

```java
package com.hero.rpc.consumerStub;

import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.ChannelInboundHandlerAdapter;

// 客户端业务处理类
public class ResultHandler extends ChannelInboundHandlerAdapter {
    private Object response;

    public Object getResponse() {
        return response;
    }

    @Override //读取服务端返回的数据(远程调用的结果)
    public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
        response = msg;
        ctx.close();
    }
}
```

上述代码作为客户端的业务处理类读取远程调用返回的数据

#### 3.3.2 RPC 客户端程序：RPC 远程代理 HeroRPCProxy

```java
package com.hero.rpc.consumerStub;

import com.hero.rpc.producerStub.ClassInfo;
import io.netty.bootstrap.Bootstrap;
import io.netty.channel.ChannelFuture;
import io.netty.channel.ChannelInitializer;
import io.netty.channel.ChannelPipeline;
import io.netty.channel.EventLoopGroup;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.SocketChannel;
import io.netty.channel.socket.nio.NioSocketChannel;
import io.netty.handler.codec.serialization.ClassResolvers;
import io.netty.handler.codec.serialization.ObjectDecoder;
import io.netty.handler.codec.serialization.ObjectEncoder;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;

//客户端代理类
public class HeroRPCProxy {
    // 根据接口创建代理对象
    public static Object create(Class target) {
        return Proxy.newProxyInstance(target.getClassLoader(), new Class[]
                {target}, new InvocationHandler() {
            @Override
            public Object invoke(Object proxy, Method method, Object[] args)
                    throws Throwable {
                // 封装ClassInfo
                ClassInfo classInfo = new ClassInfo();
                classInfo.setClassName(target.getName());
                classInfo.setMethodName(method.getName());
                classInfo.setObjects(args);
                classInfo.setTypes(method.getParameterTypes());
                // 开始用Netty发送数据
                EventLoopGroup group = new NioEventLoopGroup();
                ResultHandler resultHandler = new ResultHandler();
                try {
                    Bootstrap b = new Bootstrap();
                    b.group(group)
                            .channel(NioSocketChannel.class)
                            .handler(new ChannelInitializer<SocketChannel>() {
                                @Override
                                public void initChannel(SocketChannel ch) throws Exception {
                                    ChannelPipeline pipeline = ch.pipeline();
                                    // 编码器
                                    pipeline.addLast("encoder", new ObjectEncoder());
                                    // 解码器 构造方法第一个参数设置二进制数据的最大字节数 第二个参数设置具体使用哪个类解析器
                                    pipeline.addLast("decoder", new ObjectDecoder(Integer.MAX_VALUE, ClassResolvers.cacheDisabled(null)));
                                    // 客户端业务处理类
                                    pipeline.addLast("handler", resultHandler);
                                }
                            });
                    ChannelFuture future = b.connect("127.0.0.1", 9999).sync();
                    future.channel().writeAndFlush(classInfo).sync();
                    future.channel().closeFuture().sync();
                } finally {
                    group.shutdownGracefully();
                }
                return resultHandler.getResponse();
            }
        });
    }
}
```

上述代码是用 Netty 实现的客户端代理类，采用 Netty 自带的 ObjectEncoder 和 ObjectDecoder 作为编解码器（为了降低复杂度，这里并没有使用第三方的编解码器），当然实际开发时也可以采用 JSON 或 XML。

### 3.4 Client服务的调用方 - 消费方

```java
package com.hero.rpc.consumer;

import com.hero.rpc.consumerStub.HeroRPCProxy;
import com.hero.rpc.producer.SkuService;
import com.hero.rpc.producer.UserService;

// 服务调用方
public class TestHeroRPC {
    public static void main(String [] args){
        // 第1次远程调用
        SkuService skuService=(SkuService) HeroRPCProxy.create(SkuService.class);
        System.out.println(skuService.findByName("uid"));
        // 第2次远程调用
        UserService userService = (UserService) HeroRPCProxy.create(UserService.class);
        System.out.println(userService.findById());
    }
}
```

消费方不需要知道底层的网络实现细节，就像调用本地方法一样成功发起了两次远程调用。