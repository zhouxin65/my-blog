---
title: 深入 BIO 与 NIO
date: 2024-02-25
categories:
- 网络编程
tags:
- 网络编程
---

# 深入 BIO 与 NIO

## 1. BIO

**BIO 全称是 Basic（基本）IO**，Java 1.4 之前建立网络连接只能使用 BIO，处理数据是以**字节**为单位

![image-20240225112506433](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202402251125469.png)

![image-20240225112553158](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202402251125176.png)

### 案例

```java
package com.hero.bio;

import java.io.InputStream;
import java.io.OutputStream;
import java.net.ServerSocket;
import java.net.Socket;

// BIO 服务器端程序
public class TCPServer {

    public static void main(String[] args) throws Exception {
        // 1.创建ServerSocket对象
        System.out.println("服务端 启动....");
        System.out.println("初始化端口 9999 ");
        ServerSocket ss = new ServerSocket(9999); //端口号
        while (true) {
            // 2.监听客户端
            Socket s = ss.accept(); //阻塞
            // 3.从连接中取出输入流来接收消息
            InputStream is = s.getInputStream(); //阻塞
            byte[] b = new byte[10];
            is.read(b);
            String clientIP = s.getInetAddress().getHostAddress();
            System.out.println(clientIP + "说:" + new String(b).trim());
            // 4.从连接中取出输出流并回话
            OutputStream os = s.getOutputStream();
            os.write("没钱".getBytes());
            // 5.关闭
            s.close();
        }
    }
}
```

```java
package com.hero.bio;

import java.io.InputStream;
import java.io.OutputStream;
import java.net.Socket;
import java.util.Scanner;

// BIO 客户端程序
public class TCPClient {
    public static void main(String[] args) throws Exception {
        while (true) {
            // 1.创建Socket对象
            Socket s = new Socket("127.0.0.1", 9999);
            // 2.从连接中取出输出流并发消息
            OutputStream os = s.getOutputStream();
            System.out.println("请输入:");
            Scanner sc = new Scanner(System.in);
            String msg = sc.nextLine();
            os.write(msg.getBytes());
            // 3.从连接中取出输入流并接收回话
            InputStream is = s.getInputStream(); //阻塞
            byte[] b = new byte[20];
            is.read(b);
            System.out.println("老板说:" + new String(b).trim());
            // 4.关闭
            s.close();
        }
    }
}
```

## 2. NIO

### 2.1 概述

- **java.nio 全称 Java Non-Blocking IO**，JDK 1.4 开始，改进后的 IO，NIO 和 BIO 的目的和作用相同，但是实现方式不同。

  - **效率不同**：BIO 以字节为单位处理数据，NIO 以块为单位处理数据

  - **是否阻塞**：BIO 是阻塞式的，NIO 是非阻塞式的

  - **数据流向**：BIO 单向、NIO 双向

- **NIO 三个核心概念**：
  - Channel 通道
  - Buffer 缓冲区
  - Selector 选择器

NIO 基于 Channel 和 Buffer 进行操作，数据总是从 Channel 读取到 Buffer 中，或从 Buffer 写入到 Channel

Selector 监听多个 Channel 的事件，使用单个线程就可以监听多个客户端 Channel

![image-20240225113954658](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202402251139679.png)

### 2.2 文件 IO

#### 2.2.1 概述

**Buffer（缓冲区）**：是一个缓冲容器（底层是数组）内置了一些机制能够跟踪和记录缓冲区的状态变化。

**Channel（通道）**：提供从文件、网络读取数据的通道，读取或写入数据都必须经由 Buffer。

![image-20240225114036160](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202402251140207.png)

![image-20240225114050013](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202402251140050.png)

**在 NIO 中 Buffer 顶层抽象父类，表示一个缓冲区，Channel 读写数据都是放入 Buffer 中进行**

- **常用的 Buffer 子类有**：ByteBuffer、ShortBuffer、CharBuffer 等

- **主要方法**：

  - `ByteBuffer put(byte[] b);` 存储字节数据到 Buffer
  - `byte[] get(); ` 从 Buffer 获得字节数据
  - `byte[] array(); ` 把 Buffer 数据转换成字节数组
  - `ByteBuffer allocate(int capacity); ` 设置缓冲区的初始容量
  - `ByteBuffer wrap(byte[] array);` 把数组放到缓冲区中
  - **`Buffer flip();` 翻转缓冲区，重置位置到初始位置**

  <img src="https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202402251153474.png" alt="image-20240225115350457" style="zoom: 33%;" />



![image-20240225114449909](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202402251144929.png)

- **在 NIO 中 Channel 是一个接口，表示通道，通道是双向的，可以用来读，也可以用来写数据**

- **常用 Channel 实现类**：FileChannel、DatagramChannel、ServerSocketChannel 和 SocketChannel

  - **FileChannel 文件数据读写**

  - DatagramChannel 用于 UDP 数据读写

  - **ServerSocketChannel 和 SocketChannel 用于 TCP 数据读写**

- **FileChannel类主要方法**：
  - `int read(ByteBufferdst) `，从 Channel 读取数据并放到 Buffer 中
  - `int write(ByteBuffersrc)` ，把 Buffer 的数据写到 Channel 中
  - `long transferFrom(ReadableByteChannelsrc, position, count)`，从**目标 Channel** 中复制数据到**当前 Channel**
  - `long transferTo(position, count, WritableByteChanneltarget)`，把数据从**当前 Channel** 复制给**目标 Channel**

#### 2.2.2 案例

**1. 往本地文件中写数据**

```java
package com.hero.nio.file;

import org.junit.Test;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;

// 通过NIO实现文件IO
public class TestNIO {
  	// 往本地文件中写数据
    @Test 
    public void test1() throws Exception {
        // 1. 创建输出流
        FileOutputStream fos = new FileOutputStream("basic.txt");
        // 2. 从流中得到一个通道
        FileChannel fc = fos.getChannel();
        // 3. 提供一个缓冲区
        ByteBuffer buffer = ByteBuffer.allocate(1024);
        // 4. 往缓冲区中存入数据
        String str = "HelloJava";
        buffer.put(str.getBytes());
        // 5. 翻转缓冲区
        buffer.flip();
        // 6. 把缓冲区写到通道中
        fc.write(buffer);
        // 7. 关闭
        fos.close();
    }
}
```

**2. 从本地文件中读数据**

```java
// 从本地文件中读取数据
    @Test 
    public void test2() throws Exception {
        File file = new File("basic.txt");
        // 1. 创建输入流
        FileInputStream fis = new FileInputStream(file);
        // 2. 得到一个通道
        FileChannel fc = fis.getChannel();
        // 3. 准备一个缓冲区
        ByteBuffer buffer = ByteBuffer.allocate((int) file.length());
        // 4. 从通道里读取数据并存到缓冲区中
        fc.read(buffer);
        System.out.println(new String(buffer.array()));
        // 5. 关闭
        fis.close();
    }
```

**3. 复制文件**

```java
// BIO 复制文件
    @Test
    public void test3() throws Exception {
        FileInputStream fis = new FileInputStream("basic.txt");
        FileOutputStream fos = new FileOutputStream("basic2.txt");
        byte[] b = new byte[1024];
        while (true) {
            int res = fis.read(b);
            if (res == -1) {
                break;
            }
            fos.write(b, 0, res);
        }
        fis.close();
        fos.close();
    }

// 使用 NIO 实现文件复制
    @Test
    public void test4() throws Exception {
        // 1. 创建两个流
        FileInputStream fis = new FileInputStream("basic2.txt");
        FileOutputStream fos = new FileOutputStream("basic3.txt");
        // 2. 得到两个通道
        FileChannel sourceFC = fis.getChannel();
        FileChannel destFC = fos.getChannel();
        // 3. 复制
        destFC.transferFrom(sourceFC, 0, sourceFC.size());
        // 4. 关闭
        fis.close();
        fos.close();
    }
```

### 2.3 网络 IO

#### 2.3.1 概述

- Java NIO 中网络通道是**非阻塞 IO，基于事件驱动**，很适合需要维持大量连接，但数据交换量不大的场景
  - 例如：RPC、即时通讯、Web服务器…

- **Java 编写网络应用，有以下几种模式**：

  - **为每个请求创建线程：**一个客户端连接用一个线程**，阻塞式 IO**

    - 优点：程序编写简单

    - 缺点：如果连接非常多，分配的线程也会非常多，服务器可能会因为资源耗尽而崩溃

    - 案例：手写网站服务器-多线程版本

  - **线程池**：创建固定数量线程的线程池，来接收客户端连接，**阻塞式 IO**

    - 优点：程序编写相对简单，可以处理大量的连接

    - 缺点：线程的开销非常大，连接如果非常多，排队现象会比较严重

    - 案例：手写网站服务器-线程池版本

- **Java NIO：可以是阻塞，也可以是非阻塞式 IO**

  - **优点：这种模式可以用一个线程，处理大量的客户端连接**

  - 缺点：代码复杂度较高

#### 2.3.2 Selector

- **Selector 选择器也叫多路复用器**

  - NIO 三大核心组件之一

  - 用于检测多个注册 Channel 上是否有事件发生（读、写、连接）如果有就获取事件，并对每个事件进行处理

  - 只需一个单线程就可以管理多个 Channel，也就是多个连接。

  - 只有连接真正有读写事件时，才会调用方法来处理，大大降低了系统分配线程与线程上下文切换的开销

- **常用方法**：
  - `Selector open()`，开启一个 **Selector**
  - `int select(long timeout)`，监控所注册的通道
  - `selectedKeys()`，从 Selector 获取所有 SelectionKey

![image-20240225120844924](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202402251208946.png)

#### 2.3.3 SelectionKey

**代表了 Selector 和网络 SocketChannel 的注册关系**

- **一共四种：**

  - **OP_ACCEPT**：有新的网络连接可以 accept

  - **OP_CONNECT**：代表连接已经建立

  - **OP_READ 和 OP_WRITE**：代表了读和写操作

- **常用方法**：
  - `Selector selector()`，得到与之关联的 Selector 对象
  - `SelectableChannel channel()`，得到与之关联的通道
  - `Object attachment()`，得到与之关联的共享数据
  - `boolean isAcceptable()`，是否可接入
  - `boolean isReadable()`，是否可以读
  - `boolean isWritable()`，是否可以写

#### 2.3.4 ServerSocketChannel

**用来在 Server 端监听新的 Client 的 Socket 连接**

- 常用方法：
  - `ServerSocketChannel open()`，开启一个 ServerSocketChannel 通道
  - `ServerSocketChannel bind(SocketAddresslocal)`，设置 Server 端口号
  - `SelectableChannel configureBlocking(block)`，设置阻塞模式，false 表示采用非阻塞模式
  - `SocketChannel accept()`，接受一个连接，返回值代表这个连接的 Channel 对象
  - `SelectionKey register(Selector sel, int ops)`，注册 Selector 并设置监听事件

#### 2.3.5 SocketChannel

**网络 IO 通道，具体负责进行读写操作**

- 常用方法：
  - `SocketChannel open()`，得到一个SocketChannel通道
  - `SelectableChannel configureBlocking(block)`，设置阻塞模式，false 表示采用非阻塞模式
  - `boolean connect(SocketAddressremote)`，连接服务器
  - `boolean finishConnect()`，如果 connect 连接失败，接下来就要通过本方法完成连接
  - `int write(ByteBuffersrc)`，往通道里写数据
  - `int read(ByteBufferdst)`，从通道里读数据
  - `SelectionKey register(Selector sel, ops, att)`，注册 Selector 并设置监听事件
  - `void close()`，关闭通道

**Selector 与 SelectionKey、ServerSocketChannel、SocketChannel 的关系**

- Server 端有一个 Selector 对象
- ServerSocketChannel 通道要注册给 selector，selector accept 方法负责接收 Client 连接请求
- 有一个 Client 连接过来，Server 就会建立一个 SocketChannel
- Selector 会监控所有注册的 SocketChannel，检查通道中是否有事件发生【连接、断开、读、写等事件】
- 如果某个 SocketChannel 有事件发生则做相应的处理

![image-20240225122254004](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202402251222023.png)

### 2.4 AIO 编程

#### 2.4.1 概述

- JDK 7 引入了 Asynchronous IO，即 AIO，叫做**异步非阻塞**的 IO，也可以叫做 NIO2。在进行 IO 编程中，常用到两种模式：**Reactor 模式 和 Proactor 模式**。
  - NIO 采用 Reactor 模式，**当有事件触发时，服务器端得到通知，进行相应的处理**。
  - AIO 采用 Proactor 模式，引入**异步通道**的概念， 简化了程序编写，一个有效的请求才启动一个线程，它的**特点是先由操作系统完成后，才通知服务端程序启动线程去处理**，一般适用于连接数较多且连接时间较长的应用。

#### 2.4.2 IO 对比总结

**IO 的方式通常分为几种：同步阻塞的 BIO、同步非阻塞的 NIO、异步非阻塞的 AIO**

- **BIO 方式**：适用于连接数目较小且固定的架构
  - 对服务器资源要求较高，并发局限于应用中
  - JDK 1.4 以前的唯一选择，**同步阻塞式**，程序直观简单易理解
  - 举个栗子：食堂排队取餐，中午去食堂吃饭，排队等着，啥都干不了，到你了选餐，付款，然后找位子吃饭

- **NIO 方式**：适用于连接数目多且连接比较短（轻操作）的架构
  - 比如：聊天服务器，并发局限于应用中，编程比较复杂
  - JDK 1.4 开始支持，**同步非阻塞式**
  - 举个栗子：下馆子，点完餐，就去商场玩儿了。玩一会儿，就回饭馆问一声：好了没

- **AIO 方式**：使用于连接数目多且连接比较长（重操作）的架构
  - 比如：相册服务器，充分调用OS 参与并发操作，编程比较复杂
  - JDK 1.7 开始支持，**异步非阻塞式**
  - 举个栗子：海底捞外卖火锅，打电话订餐。海底捞会说，我们知道您的位置，一会给您送过来，请您安心工作。

| 对比         | BIO      | NIO                    | AIO        |
| ------------ | -------- | ---------------------- | ---------- |
| IO 方式      | 同步阻塞 | 同步非阻塞（多路复用） | 异步非阻塞 |
| API 使用难度 | 简单     | 复杂                   | 复杂       |
| 可靠性       | 差       | 好                     | 好         |
| 吞吐量       | 低       | 高                     | 高         |

### 2.5 NIO 案例：客户端与服务器间通信

![image-20240225123359929](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202402251233955.png)

```java
package com.hero.nio.socket;

import java.net.InetSocketAddress;
import java.nio.ByteBuffer;
import java.nio.channels.SocketChannel;

// 网络客户端程序
public class NIOClient {
    public static void main(String[] args) throws Exception {
        // 1. 得到一个网络通道
        SocketChannel channel = SocketChannel.open();
        // 2. 设置非阻塞方式
        channel.configureBlocking(false);
        // 3. 提供服务器端的IP地址和端口号
        InetSocketAddress address = new InetSocketAddress("127.0.0.1", 9999);
        // 4. 连接服务器端，如果用connect()方法连接服务器不成功，则用finishConnect()方法进行连接
        if (!channel.connect(address)) {
            // 因为连接需要花时间，所以用while一直去尝试连接。在连接服务端时还可以做别的事，体现非阻塞。
            while (!channel.finishConnect()) {
                // nio 作为非阻塞式的优势，如果服务器没有响应（不启动服务端)，客户端不会阻塞，最后会报错，客户端尝试链接服务器连不上。
                System.out.println("Client:连接金莲的同时，还可以干别的一些事情");
            }
        }
        // 5. 得到一个缓冲区并存入数据
        String msg = "你好，金莲，大郎在家吗？";
        ByteBuffer writeBuf = ByteBuffer.wrap(msg.getBytes());
        // 6. 发送数据
        channel.write(writeBuf);
        //阻止客户端停止，否则服务端也会停止。
        System.in.read();
    }
}
```

```java
package com.hero.nio.socket;

import java.net.InetSocketAddress;
import java.nio.ByteBuffer;
import java.nio.channels.SelectionKey;
import java.nio.channels.Selector;
import java.nio.channels.ServerSocketChannel;
import java.nio.channels.SocketChannel;
import java.util.Iterator;

// 网络服务器端程序
public class NIOServer {
    public static void main(String[] args) throws Exception {
        // 1. 开启一个ServerSocketChannel通道（对象）
        ServerSocketChannel serverSocketChannel = ServerSocketChannel.open();
        // 2. 开启一个Selector选择器
        Selector selector = Selector.open();
        // 3. 绑定端口号9999
        System.out.println("服务端 启动....");
        System.out.println("初始化端口 9999 ");
        serverSocketChannel.bind(new InetSocketAddress(9999));
        // 4. 配置非阻塞方式
        serverSocketChannel.configureBlocking(false);
        // 5. Selector 选择器注册 ServerSocketChannel 通道，绑定连接操作
        serverSocketChannel.register(selector, SelectionKey.OP_ACCEPT);
        // 6. 循环执行：监听连接事件及读取数据操作
        while (true) {
            // 6.1 监控客户端连接：
            // selector.select()方法返回的是客户端的通道数，如果为 0，则说明没有客户端连接。
            // nio非阻塞式的优势
            if (selector.select(2000) == 0) {
                System.out.println("Server：门庆没有找我，去找王妈妈搞点兼职做~");
                continue;
            }
            // 6.2 得到 SelectionKey,判断通道里的事件
            Iterator<SelectionKey> keyIterator =
                    selector.selectedKeys().iterator();
            // 遍历所有 SelectionKey
            while (keyIterator.hasNext()) {
                SelectionKey key = keyIterator.next();
                // 客户端先连接上，处理连接事件，然后客户端会向服务端发信息，再处理读取客户端数据事件。
                if (key.isAcceptable()) { // 客户端连接请求事件
                    System.out.println("OP_ACCEPT");
                    SocketChannel socketChannel = serverSocketChannel.accept();
                    socketChannel.configureBlocking(false);
                    // 注册通道 ,将通道交给selector选择器进行监控。
                    // 参数 01-选择器
                    // 参数 02-服务器要监控读事件，客户端发send数据，服务端读read数据
                    // 参数 03-客户端传过来的数据要放在缓冲区
                    socketChannel.register(selector, SelectionKey.OP_READ, ByteBuffer.allocate(1024));
                }
                if (key.isReadable()) { // 读取客户端数据事件
                    // 数据在通道中，先得到通道
                    SocketChannel channel = (SocketChannel) key.channel();
                    // 取到一个缓冲区，nio 读写数据都是基于缓冲区。
                    ByteBuffer buffer = (ByteBuffer) key.attachment();
                    // 从通道中将客户端发来的数据读到缓冲区
                    channel.read(buffer);
                    System.out.println("客户端发来数据：" + new String(buffer.array()));
                }
                // 6.3 手动从集合中移除当前key,防止重复处理
                keyIterator.remove();
            }
        }
    }
}
```

### 2.6 网络聊天室 V1.0

服务器端

```java
package com.hero.nio.chat;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.ByteBuffer;
import java.nio.channels.*;
import java.text.SimpleDateFormat;
import java.util.*;

//聊天程序服务器端
public class ChatServer {
    private ServerSocketChannel listenerChannel; // 监听通道
    private Selector selector; // 选择器对象
    private static final int PORT = 9999; // 服务器端口

    public ChatServer() {
        try {
            // 1. 开启Socket监听通道
            listenerChannel = ServerSocketChannel.open();
            // 2. 开启选择器
            selector = Selector.open();
            // 3. 绑定端口
            listenerChannel.bind(new InetSocketAddress(PORT));
            // 4. 设置为非阻塞模式
            listenerChannel.configureBlocking(false);
            // 5. 将选择器绑定到监听通道并监听accept事件
            listenerChannel.register(selector, SelectionKey.OP_ACCEPT);
            printInfo("真人网络聊天室 启动.......");
            printInfo("真人网络聊天室 初始化端口 9999.......");
            printInfo("真人网络聊天室 初始化网络ip地址 127.0.0.1 .......");
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public void start() throws Exception {
        try {
            while (true) { //不停监控
                if (selector.select(2000) == 0) {
                    System.out.println("Server:没有客户端连接，我去搞点兼职");
                    continue;
                }
                Iterator<SelectionKey> iterator = selector.selectedKeys().iterator();
                while (iterator.hasNext()) {
                    SelectionKey key = iterator.next();
                    if (key.isAcceptable()) { // 连接请求事件
                        SocketChannel sc = listenerChannel.accept();
                        sc.configureBlocking(false);
                        sc.register(selector, SelectionKey.OP_READ);
                        System.out.println(sc.getRemoteAddress().toString().substring(1) + "上线了...");
                    }
                    if (key.isReadable()) { // 读取数据事件
                        readMsg(key);
                    }
                    // 一定要把当前 key 删掉，防止重复处理
                    iterator.remove();
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    //读取客户端发来的消息并广播出去
    public void readMsg(SelectionKey key) throws Exception {
        SocketChannel channel = (SocketChannel) key.channel();
        ByteBuffer buffer = ByteBuffer.allocate(1024);
        int count = channel.read(buffer);
        if (count > 0) {
            String msg = new String(buffer.array());
            // 打印消息
            printInfo(msg);
            // 全员广播消息
            broadCast(channel, msg);
        }
    }

    // 给所有的客户端发广播
    public void broadCast(SocketChannel except, String msg) throws Exception {
        System.out.println("服务器广播了消息...");
        for (SelectionKey key : selector.keys()) {
            Channel targetChannel = key.channel();
            if (targetChannel instanceof SocketChannel && targetChannel != except) {
                SocketChannel destChannel = (SocketChannel) targetChannel;
                ByteBuffer buffer = ByteBuffer.wrap(msg.getBytes());
                destChannel.write(buffer);
            }
        }
    }

    private void printInfo(String str) { //往控制台打印消息
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        System.out.println("[" + sdf.format(new Date()) + "] -> " + str);
    }

    public static void main(String[] args) throws Exception {
        new ChatServer().start();
    }
}
```

客户端

```java
package com.hero.nio.chat;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.ByteBuffer;
import java.nio.channels.SocketChannel;
import java.util.Scanner;

// 聊天程序客户端
public class ChatClient {
    private final String HOST = "127.0.0.1"; // 服务器地址
    private int PORT = 9999; // 服务器端口
    private SocketChannel socketChannel; // 网络通道
    private String userName; // 聊天用户名

    public ChatClient() throws IOException {
        // 1. 得到一个网络通道
        socketChannel = SocketChannel.open();
        // 2. 设置非阻塞方式
        socketChannel.configureBlocking(false);
        // 3. 提供服务器端的IP地址和端口号
        InetSocketAddress address = new InetSocketAddress(HOST, PORT);
        // 4. 连接服务器端
        if (!socketChannel.connect(address)) {
            while (!socketChannel.finishConnect()) { // nio 作为非阻塞式的优势
                System.out.println("Client:连接服务器端的同时，咱也别闲着，去搞点兼 职~");
            }
        }
        // 5. 得到客户端IP地址和端口信息，作为聊天用户名使用
        userName = socketChannel.getLocalAddress().toString().substring(1);
        System.out.println("---------------Client(" + userName + ") is ready-------------- - ");
    }

    // 向服务器端发送数据
    public void sendMsg(String msg) throws Exception {
        if (msg.equalsIgnoreCase("bye")) {
            socketChannel.close();
            return;
        }
        msg = userName + "说：" + msg;
        ByteBuffer buffer = ByteBuffer.wrap(msg.getBytes());
        socketChannel.write(buffer);
    }

    //从服务器端接收数据
    public void receiveMsg() throws Exception {
        ByteBuffer buffer = ByteBuffer.allocate(1024);
        int size = socketChannel.read(buffer);
        if (size > 0) {
            String msg = new String(buffer.array());
            System.out.println(msg.trim());
        }
    }
}
```

启动聊天程序客户端

```java
package com.hero.nio.chat;

import java.util.Scanner;

public class TestChat {
    public static void main(String[] args) throws Exception {
        ChatClient chatClient = new ChatClient();
        new Thread(() -> {
            // 监听服务器消息
            while (true) {
                try {
                    chatClient.receiveMsg();
                    Thread.sleep(2000);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }).start();
        Scanner scanner = new Scanner(System.in);
        while (scanner.hasNextLine()) {
            String msg = scanner.nextLine();
            chatClient.sendMsg(msg);
        }
    }
}
```

上述代码运行了聊天程序的客户端，该代码运行一次就是一个聊天客户端，可以同时运行多个聊天客户端。在一个聊天客户端中发送消息，会广播给所有其他聊天客户端。客户端互相发送消息，需要提前将服务端启动。支持局域网聊天，也支持网络聊天。使用内网穿透将本机 9999 端口映射到公网 IP 的 9999 端口，即可实现网络群聊。

## 3. Netty

### 3.1 概述

- **什么是 Netty** ？

  - Netty 是一个被广泛使用的 Java **网络应用**编程框架。

  - Netty 框架帮助开发者**快速、简单**的实现一个客户端/服务端的网络应用程序。

  - Netty 利用 Java 语言的 NIO 网络编程的能力，并隐藏其背后的复杂性从而提供了简单易用的 API。

- **特点**：

  - API 简单易用：支持阻塞和非阻塞式的 socket

  - 基于事件模型：可扩展性和灵活性更强

  - 高度定制化的线程模型：支持单线程和多线程

  - 高通吐、低延迟、资源占用率低

  - 完整支持 SSL 和 TLS

- **应用场景**：

  - 互联网行业：分布式系统远程过程调用，高性能的 RPC 框架

  - 游戏行业：大型网络游戏高性能通信

  - 大数据：Hadoop 的高性能通信和序列化组件 Avro 的 RPC 框架

### 3.2 线程模型

#### 3.2.1 单线程模型

![image-20240228200300950](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202402282003975.png)

- **特点**：
  - 通过 IO 多路复用，一个线程搞定所有 Client 连接，代码简单，清晰明了
  - 如果 Client 连接数量过多则无法支撑

#### 3.2.2 线程池模型

![image-20240228200444914](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202402282004934.png)

- **特点**：
  - 通过 IO 多路复用，一个线程专门负责连接，线程池负责处理请求
  - 大多数场景下，此模型都能满足网络编程需求

#### 3.2.3 Netty 线程模型

![image-20240228200648965](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202402282006984.png)

![image-20240228200628424](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202402282006452.png)

**各组件间的关系**

- Netty 抽象出两组线程池：**BossGroup、WorkerGroupBossGroup** 
  - BossGroup 专门负责接收客户端连接
  - WorkerGroup 专门负责网络读写操作
  - BossGroup 和 WorkerGroup 类型都是 **NioEventLoopGroup**，相当于一个事件循环组
- **NioEventLoopGroup** 可以有多个线程，即含有多个 NioEventLoop
- **NioEventLoop** 表示一个不断循环的执行处理任务的线程
  - 每个 NioEventLoop 中包含有一个 Selector，一个 taskQueue
    - **Selector 上可以注册监听多个 NioChannel，也就是监听Socket网络通信**
    - **每个 NioChannel 只会绑定在唯一的 NioEventLoop 上**
    - **每个 NioChannel 都绑定有一个自己的 ChannelPipeline**
  - NioEventLoop 内部采用串行化（Pipeline）设计：责任链模式
    - 消息读取 ==> 解码 ==> 处理（handlers） ==> 编码 ==> 发送，始终由IO线程NioEventLoop 负责

**一个 Client 连接的执行流程**

1. Boss 的 NioEventLoop 循环执行步骤：
   1. 轮询 accept 事件
   2. 处理 accept 事件：
      - 与 client 建立连接，生成 NioSocketChannel ，并将其注册到某个 worker 的 NIOEventLoop 的  selector
   3. 处理任务队列的任务 ， 即 runTasks
2. Worker 的 NIOEventLoop 循环执行步骤：
   1. 轮询 read、write 事件
   2. 在对应 NioSocketChannel 中，处理业务相关操作（ChannelHandler）
   3. 处理任务队列的任务，即 runTasks
3. 每个 Worker 的 NioEventLoop 处理业务时会使用管道 Pipeline。Pipeline 中包含了 Channel，通过管道可以获取到对应 Channel，Channel 中维护了很多的 Handler 处理器。

### 3.3 核心 API

#### 3.3.1 ServerBootstrap 和 Bootstrap

- **ServerBootstrap** 是 Netty 中的**服务端启动助手**，通过它可以完成服务端的各种配置；
- **Bootstrap** 是 Netty 中的**客户端启动助手**，通过它可以完成客户端的各种配置。

**常用方法**：

- **服务端 ServerBootstrap**
  - `ServerBootstrap group(parentGroup , childGroup)`， 该方法用于设置两个 EventLoopGroup，连接线程组和工作线程组
  - `public B channel(Class<? extends C> channelClass)`，该方法用来**设置服务端或客户端通道的实现类型**
  - `public B option(ChannelOption option, T value)`，用来给 **ServerChannel** 添加配置
  - `public ServerBootstrap childOption(ChannelOption childOption, T value)`，用来给**接收通道**添加配置
  - `public ServerBootstrap childHandler(ChannelHandler childHandler)`，该方法用来设置业务处理类（自定义handler）
  - `public ChannelFuture bind(int inetPort)` ，该方法用于**设置占用端口号**
- **客户端 Bootstrap**
  - `public B group(EventLoopGroup group) `，该方法用来设置客户端的 EventLoopGroup
  - `public B channel(Class<? extends C> channelClass)`，该方法用来**设置服务端或客户端通道的实现类型**
  - `public ChannelFuture connect(String inetHost, int inetPort)` ，该方法用来**配置连接服务端地址信息**，host:port

#### 3.3.2 EventLoopGroup（Boss\WorkerGroup）

在 Netty 服务端编程中，一般需要提供两个 **EventLoopGroup： ① BossEventLoopGroup 专门负责接收客户端连接、② WorkerEventLoopGroup 专门负责网络读写操作**。

- Netty 为了更好的利用多核 CPU 资源，一般会有多个 EventLoop 同时工作，每个 EventLoop 维护着一个 Selector 实例。
- EventLoopGroup 提供 next 接口，可以从组里面按照一定规则获取其中一个 EventLoop 来处理任务。
- **EventLoopGroup 本质是一组 EventLoop，池化管理的思想**

通常一个服务端口即一个 ServerSocketChannel 对应一个 Selector 和一个 EventLoop 线程，BossEventLoop 负责接收客户端的连接并将 SocketChannel 交给 WorkerEventLoopGroup 来进行 IO 处理。

![image-20240228203030186](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202402282030213.png)

- BossEventLoopGroup 通常是单线程的 EventLoop，EventLoop 维护着一个注册了 ServerSocketChannel 的 Selector 实例
- Boss 的 EventLoop 不断轮询 Selector 将连接事件分离出来，通常是 OP_ACCEPT 事件， 然后将接收到的 SocketChannel 交给 WorkerEventLoopGroup
- WorkerEventLoopGroup 会由 next 选择其中一个 EventLoop 来将这个 SocketChannel 注册到其维护的 Selector 并对其后续的事件进行处理。

**常用方法**：

- `public NioEventLoopGroup()`，构造方法
- `public Future<?> shutdownGracefully()`，断开连接，关闭线程

#### 3.3.3 ChannelHandler 及其实现类

![image-20240228203223949](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202402282032974.png)

我们经常需要自定义一个 Handler 类去继承 ChannelInboundHandlerAdapter，然后通过重写相应方法实现业务逻辑

- `channelActive(ChannelHandlerContext ctx)`，**通道就绪事件**
- `channelRead(ChannelHandlerContext ctx, Object msg)`，**通道读取数据事件**
- `channelReadComplete(ChannelHandlerContext ctx) `，**数据读取完毕事件**
- `exceptionCaught(ChannelHandlerContext ctx, Throwable cause)`，**通道发生异常事件**

#### 3.3.4 ChannelPipeline

ChannelPipeline 是一个 **Handler 的集合**，它负责处理和拦截 inbound 或者 outbound 的事件和操作，相当于一个贯穿 Netty 的链（责任链模式）。

![image-20240228203415181](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202402282034206.png)

1. 事件传递到 ChannelPipeline 中的第一个 ChannelHandler
2. ChannelHandler 使用分配的 ChannelHandlerContext 将事件传递给 ChannelPipeline 中的下一个 ChannelHander。ChannelHandlerContext 包含 ChannelHandler、Channel、pipeline 的信息。

- `ChannelPipeline addFirst(ChannelHandler... handlers)`，把业务处理类（handler）添加到 Pipeline 链中的**第一个位置**
- `ChannelPipeline addLast(ChannelHandler... handlers)`，把业务处理类（handler）添加到 Pipeline 链中的**最后一个位置**

#### 3.3.5 ChannelHandlerContext

- ChannelHandlerContext 是事件处理器上下文对象， Pipeline链中的实际处理节点。 每个处理节点 ChannelHandlerContext 中包含一个具体的事件处理器 ChannelHandler ， 同时 ChannelHandlerContext  中也绑定了对应的 Pipeline 和 Channel 的信息，方便对 ChannelHandler进行调用。

- **常用方法**：

  - `ChannelFuture close()`，关闭通道

  - `ChannelOutboundInvoker flush()`，刷新

  - `ChannelFuture writeAndFlush(Object msg)` ，将数据写到ChannelPipeline中当前 

    ChannelHandler 的下一个 ChannelHandler 开始处理（**出栈**交给下一个handler将继续处理）。

#### 3.3.6 ChannelOption

- Netty 在创建 Channel 实例后，一般都需要设置 ChannelOption 参数。ChannelOption 是Socket 的标准化参数而非 Netty 的独创。
- **常配参数**：
  1. `ChannelOption.SO_BACKLOG`：用来**初始化服务器可连接队列大小**，对应 TCP/IP 协议 listen 函数中的 backlog 参数。
     - 服务端处理客户端连接请求是顺序处理的，所以同一时间只能处理一个客户端连接。
     - 如果请求连接过多，服务端将不能及时处理，多余连接放在队列中等待，backlog 参数指定了等待队列大小。
  2. `ChannelOption.SO_KEEPALIVE `，**连接是否一直保持**（是否长连接）。

#### 3.3.7 ChannelFuture

- ChannelFuture 表示 Channel 中异步 IO 操作的未来结果，在 Netty 中异步IO操作都是直接返回，调用者并不能立刻获得结果，但是可以通过 ChannelFuture 来获取 IO 操作的处理状态。Netty 异步非阻塞处理事件，如果事件很费时，会通过 Future 异步处理，不会阻塞。
- **常用方法**：
  - `Channel channel()`，返回当前正在进行 IO 操作的通道
  - `ChannelFuture sync()`，等待异步操作执行完毕

#### 3.3.8 Unpooled 类

- Unpooled 是 Netty 提供的一个专门用来操作缓冲区的工具类
- **常用方法**：
  - `ByteBuf copiedBuffer(CharSequence string, Charset charset)`，通过给定的数据和字符编码返回一个 ByteBuf 对象（类似于 NIO 中的 ByteBuffer 对象）

### 3.4 Netty 案例：客户端与服务器间通信

![image-20240228204357060](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202402282043086.png)

**实现步骤**：

1. 导入依赖坐标
2. 编写Netty服务端程序：配置线程组，配置自定义业务处理类，绑定端口号，然后启动 Server，等待 Client 连接
3. 编写服务端 - 业务处理类 Handler：继承 ChannelInboundHandlerAdapter，并分别重写了三个方法
   - 读取事件
   - 读取完成事件
   - 异常捕获事件
4. 编写客户端程序：配置了线程组，配置了自定义的业务处理类，然后启动 Client，连接 Server。
5. 编写客户端-业务处理类：继承 ChannelInboundHandlerAdapter ，并分别重写了 2 个方法
   - 通道就绪事件
   - 读取事件

#### 1. 导入依赖

```xml
<dependency>
    <groupId>io.netty</groupId>
    <artifactId>netty-all</artifactId>
    <version>4.1.8.Final</version>
</dependency>
```

#### 2. 服务端程序 Server

```java
package com.hero.netty.demo01;

import io.netty.bootstrap.ServerBootstrap;
import io.netty.channel.ChannelFuture;
import io.netty.channel.ChannelInitializer;
import io.netty.channel.ChannelOption;
import io.netty.channel.EventLoopGroup;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.SocketChannel;
import io.netty.channel.socket.nio.NioServerSocketChannel;

public class NettyServer {
    public static void main(String[] args) throws Exception {
        // 1. 创建一个线程组：接收客户端连接
        EventLoopGroup bossGroup = new NioEventLoopGroup();
        // 2. 创建一个线程组：处理网络操作
        EventLoopGroup workerGroup = new NioEventLoopGroup();
        // 3. 创建服务端启动助手来配置参数
        ServerBootstrap b = new ServerBootstrap();
        // 4.设置两个线程组
        b.group(bossGroup, workerGroup)
                // 5.使用 NioServerSocketChannel作为服务端通道的实现
                .channel(NioServerSocketChannel.class)
                // 6.设置线程队列中等待连接的个数
                .option(ChannelOption.SO_BACKLOG, 128)
                // 7.保持活动连接状态
                .childOption(ChannelOption.SO_KEEPALIVE, true)
                // 8.创建一个通道初始化对象
                .childHandler(new ChannelInitializer<SocketChannel>() {
                    // 9. 往Pipeline链中添加自定义的handler类
                    public void initChannel(SocketChannel sc) {
                        sc.pipeline().addLast(new NettyServerHandler());
                    }
                });
        System.out.println("......服务端 启动中 init port:9999 ......");
        // 10. 绑定端口 bind方法是异步的sync方法是同步阻塞的
        ChannelFuture cf = b.bind(9999).sync();
        System.out.println("......服务端 启动成功 ......");
        // 11. 关闭通道，关闭线程组
        cf.channel().closeFuture().sync();
        bossGroup.shutdownGracefully();
        workerGroup.shutdownGracefully();
    }
}
```

#### 3. 服务端 - 业务处理类 ServerHandler

```java
package com.hero.netty.demo01;

import io.netty.buffer.ByteBuf;
import io.netty.buffer.Unpooled;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.ChannelInboundHandlerAdapter;
import io.netty.util.CharsetUtil;

// 服务端的业务处理类
public class NettyServerHandler extends ChannelInboundHandlerAdapter {
    // 读取数据事件，msg 就客戶端发过来的数据。
    public void channelRead(ChannelHandlerContext ctx, Object msg) {
        // System.out.println("Server:"+ctx);
        // 用缓冲区接受数据
        ByteBuf buf = (ByteBuf) msg;
        // 转成字符串
        System.out.println("client msg：" + buf.toString(CharsetUtil.UTF_8));
    }

    // 数据读取完毕事件，读取完客户端数据后回复客户端
    public void channelReadComplete(ChannelHandlerContext ctx) {
        // Unpooled.copiedBuffer 获取到缓冲区
        // 第一个参数是向客户端传的字符串
        ctx.writeAndFlush(Unpooled.copiedBuffer("宝塔镇河妖", CharsetUtil.UTF_8));
    }

    // 异常发生事件
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable t) {
        // 异常时关闭 ctx，ctx 是相关信息的汇总，关闭它其它的也就关闭了。
        ctx.close();
    }
}
```

#### 4. 客户端程序 Client

```java
package com.hero.netty.demo01;

import io.netty.bootstrap.Bootstrap;
import io.netty.channel.ChannelFuture;
import io.netty.channel.ChannelInitializer;
import io.netty.channel.EventLoopGroup;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.SocketChannel;
import io.netty.channel.socket.nio.NioSocketChannel;

public class NettyClient {
    public static void main(String[] args) throws Exception {
        // 1. 创建一个线程组
        EventLoopGroup group = new NioEventLoopGroup();
        // 2. 创建客户端的启动助手，完成相关配置
        Bootstrap b = new Bootstrap();
        // 3. 设置线程组
        b.group(group)
                // 4. 设置客户端通道的实现类
                .channel(NioSocketChannel.class)
                // 5. 创建一个通道初始化对象
                .handler(new ChannelInitializer<SocketChannel>() {
                    @Override
                    protected void initChannel(SocketChannel socketChannel) throws Exception {
                        // 6.往Pipeline链中添加自定义的handler
                        socketChannel.pipeline().addLast(new NettyClientHandler());
                    }
                });
        System.out.println("......客户端 准备就绪 msg发射......");
        // 7.启动客户端去连接服务端 connect 方法是异步的 sync方法是同步阻塞的
        ChannelFuture cf = b.connect("127.0.0.1", 9999).sync();
        // 8.关闭连接(异步非阻塞)
        cf.channel().closeFuture().sync();
    }
}
```

#### 5. 客户端 - 业务处理类 ClientHandler

```java
package com.hero.netty.demo01;

import io.netty.buffer.ByteBuf;
import io.netty.buffer.Unpooled;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.ChannelInboundHandlerAdapter;
import io.netty.util.CharsetUtil;

public class NettyClientHandler extends ChannelInboundHandlerAdapter {
    // 通道就绪事件
    public void channelActive(ChannelHandlerContext ctx) {
        // System.out.println("Client:"+ctx);
        ctx.writeAndFlush(Unpooled.copiedBuffer("天王盖地虎", CharsetUtil.UTF_8));
    }

    // 读取数据事件
    public void channelRead(ChannelHandlerContext ctx, Object msg) {
        ByteBuf buf = (ByteBuf) msg;
        System.out.println("server msg：" + buf.toString(CharsetUtil.UTF_8));
    }
}
```

### 3.5 网络聊天室 V2.0

![image-20240228214254865](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202402282142890.png)

**实现步骤**：

1. **编写聊天程序服务端**：配置线程组，**配置编解码器**，配置自定义业务处理类，绑定端口号，然后启动 Server，等待 Client 连接
2. 编写服务端 - 业务处理类 Handler：
   - 当通道就绪时，输出上线
   - 当通道未就绪时，输出离线
   - 当通道发来数据时，读取数据，进行广播
3. 编写聊天程序客户端：配置了线程组，配置编解码器，配置了自定义的业务处理类，然后启动 Client，连接 Server
   - 连接服务端成功后，获取客户端与服务端建立的 Channel
   - 获取系统键盘输入，将用户输入信息通过 Channel 发送给服务端
4. 编写客户端 - 业务处理类：
   - 读取事件：监听服务端广播消息

#### 1. 聊天服务端程序 ChatServer

```java
package com.hero.netty.demo02;

import io.netty.bootstrap.ServerBootstrap;
import io.netty.channel.*;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.SocketChannel;
import io.netty.channel.socket.nio.NioServerSocketChannel;
import io.netty.handler.codec.string.StringDecoder;
import io.netty.handler.codec.string.StringEncoder;

public class NettyChatServer {
    private int port; //服务端端口号

    public NettyChatServer(int port) {
        this.port = port;
    }

    public void run() throws Exception {
        EventLoopGroup bossGroup = new NioEventLoopGroup();
        EventLoopGroup workerGroup = new NioEventLoopGroup();
        try {
            ServerBootstrap b = new ServerBootstrap();
            b.group(bossGroup, workerGroup)
                    .channel(NioServerSocketChannel.class)
                    .option(ChannelOption.SO_BACKLOG, 128)
                    .childOption(ChannelOption.SO_KEEPALIVE, true)
                    .childHandler(new ChannelInitializer<SocketChannel>() {
                        @Override
                        public void initChannel(SocketChannel ch) {
                            ChannelPipeline pipeline = ch.pipeline();
                            // 往pipeline链中添加一个解码器
                            pipeline.addLast("decoder", new StringDecoder());
                            // 往pipeline链中添加一个编码器
                            pipeline.addLast("encoder", new StringEncoder());
                            // 往pipeline链中添加自定义的handler(业务处理类)
                            pipeline.addLast(new NettyChatServerHandler());
                        }
                    });
            System.out.println("网络真人聊天室 Server 启动......");
            ChannelFuture f = b.bind(port).sync();
            f.channel().closeFuture().sync();
        } finally {
            workerGroup.shutdownGracefully();
            bossGroup.shutdownGracefully();
            System.out.println("网络真人聊天室 Server 关闭......");
        }
    }

    public static void main(String[] args) throws Exception {
        new NettyChatServer(9999).run();
    }
}
```

> 注意：我往 Pipeline 链中添加了处理字符串的编码器和解码器，它们加入到 Pipeline 链中后会自动工作，使得服务端读写字符串数据时更加方便，不用人工处理编解码操作。

#### 2. 服务端业务处理类 ChatServerHandler

```java
package com.hero.netty.demo02;

import io.netty.channel.Channel;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;

import java.util.ArrayList;
import java.util.List;

// 自定义一个服务端业务处理类
public class NettyChatServerHandler extends SimpleChannelInboundHandler<String> {
    public static List<Channel> channels = new ArrayList<>();

    // 通道就绪
    @Override
    public void channelActive(ChannelHandlerContext ctx) {
        Channel inChannel = ctx.channel();
        channels.add(inChannel);
        System.out.println("[Server]:" + inChannel.remoteAddress().toString().substring(1) + " 上线 ");
    }

    // 通道未就绪
    @Override
    public void channelInactive(ChannelHandlerContext ctx) {
        Channel inChannel = ctx.channel();
        channels.remove(inChannel);
        System.out.println("[Server]:" + inChannel.remoteAddress().toString().substring(1) + " 离线 ");
    }

    // 读取数据
    @Override
    protected void channelRead0(ChannelHandlerContext ctx, String s) {
        Channel inChannel = ctx.channel();
        System.out.println("s = " + s);
        for (Channel channel : channels) {
            if (channel != inChannel) {
                channel.writeAndFlush("[" + inChannel.remoteAddress().toString().substring(1) + "]" + " 说：" + s + "\n");
            }
        }
    }
}
```

上述代码通过继承 SimpleChannelInboundHandler 类自定义了一个服务端业务处理类，并在该类中重写了四个方法。

- 当通道就绪时，输出上线
- 当通道未就绪时，输出离线
- 当通道发来数据时，读取数据，进行广播

#### 3. 聊天程序客户端 ChatClient

```java
package com.hero.netty.demo02;

import io.netty.bootstrap.Bootstrap;
import io.netty.channel.*;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.SocketChannel;
import io.netty.channel.socket.nio.NioSocketChannel;
import io.netty.handler.codec.string.StringDecoder;
import io.netty.handler.codec.string.StringEncoder;

import java.util.Scanner;

// 聊天程序客户端
public class NettyChatClient {
    private final String host; // 服务端IP地址
    private final int port; // 服务端端口号

    public NettyChatClient(String host, int port) {
        this.host = host;
        this.port = port;
    }

    public void run() {
        EventLoopGroup group = new NioEventLoopGroup();
        try {
            Bootstrap bootstrap = new Bootstrap()
                    .group(group)
                    .channel(NioSocketChannel.class)
                    .handler(new ChannelInitializer<SocketChannel>() {
                        @Override
                        public void initChannel(SocketChannel ch) {
                            ChannelPipeline pipeline = ch.pipeline();
                            // 往pipeline链中添加一个解码器
                            pipeline.addLast("decoder", new StringDecoder());
                            // 往pipeline链中添加一个编码器
                            pipeline.addLast("encoder", new StringEncoder());
                            // 往pipeline链中添加自定义的handler(业务处理类)
                            pipeline.addLast(new NettyChatClientHandler());
                        }
                    });
            ChannelFuture cf = bootstrap.connect(host, port).sync();
            Channel channel = cf.channel();
            System.out.println("------ " + channel.localAddress().toString().substring(1) + "------");
            Scanner scanner = new Scanner(System.in);
            while (scanner.hasNextLine()) {
                String msg = scanner.nextLine();
                channel.writeAndFlush(msg + "\r\n");
            }
            cf.channel().closeFuture().sync();
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            group.shutdownGracefully();
        }
    }

    public static void main(String[] args) throws Exception {
        new NettyChatClient("127.0.0.1", 9999).run();
    }
}
```

上述代码通过 Netty 编写了一个客户端程序。客户端同样需要配置编解码器

#### 4. 客户端业务处理类 ChatClientHandler

```java
package com.hero.netty.demo02;

import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;

// 自定义一个客户端业务处理类
public class NettyChatClientHandler extends SimpleChannelInboundHandler<String> {
    @Override
    protected void channelRead0(ChannelHandlerContext ctx, String s) throws
            Exception {
        System.out.println(s.trim());
    }
}
```

上述代码通过继承 SimpleChannelInboundHandler 自定义了一个客户端业务处理类，重写了一个方法用来读取服务端发过来的数据。

### 3.6 编码和解码

#### 3.6.1 概述

- 数据在网络中传输的都是二进制字节码数据，而我们拿到的目标数据往往不是字节码数据。因此在发送数据时就 需要编码，接收数据时就需要解码。
- codec 的组成部分有两个：decoder(解码器) 和 encoder(编码器)
  - **encoder** 负责把业务数据转换成字节码数据
  - **decoder** 负责把字节码数据转换成业务数据
- 其实 **Java 的序列化技术**就可以作为 codec 去使用，但是它的硬伤太多：
  1. **无法跨语言**，这应该是 Java 序列化最致命的问题了
  2. **序列化后的体积太大**，是二进制编码的 5 倍多
  3. **序列化性能太低**

- Netty 自身提供了一些 编解码器，如下：

  - **StringEncoder** 对字符串数据进行编码
  - **ObjectEncoder** 对 Java 对象进行编码

  - Netty 本身自带的 ObjectDecoder 和 ObjectEncoder 可以用来实现 POJO 对象或各种业务对象的编码和解码，但其内部使用的仍是 Java 序列化技术，所以在某些场景下不适用。对于 POJO 对象或各种业务对象要实现编码和解码，我们需要更高效更强的技术。

#### 3.6.2 Google 的 Protobuf

Protobuf 是 Google 发布的开源项目，全称 Google Protocol Buffers，特点如下：

- **支持跨平台、多语言**（支持目前大多数语言，例如 C++、C#、Java、python 等）
- **高性能，高可靠性**
- 使用 protobuf 编译器能自动生成代码，Protobuf 是将类的定义使用.proto 文件进行描述，然后通过 protoc.exe 编译器根据.proto 自动生成.java 文件

在使用 Netty 开发时，经常会结合 Protobuf 作为 codec (编解码器)去使用，具体用法如下所示。

**使用步骤**：

1. 将传递数据的实体类生成【基于构建者模式设计】
2. 配置编解码器
3. 传递数据使用生成后的实体类

#### 3.6.3  导入 protobuf 依赖

```xml
<dependency>
  <groupId>com.google.protobuf</groupId>
  <artifactId>protobuf-java</artifactId>
  <version>3.6.1</version>
</dependency>
```

#### 3.6.4 proto 文件

假设我们要处理的数据是图书信息，那就需要为此编写 proto 文件

```protobuf
syntax = "proto3";
  option java_outer_classname = "BookMessage";
  message Book{
    int32 id = 1;
    string name = 2;
}
```

![image-20240228220529857](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202402282205883.png)

#### 3.6.5 生成 Java 类

通过 protoc.exe 根据描述文件生成 Java 类

```bash
cd C:\protoc-1 3.6.1-win32\bin
# 执行以下命令
1 protoc --java_out=. Book.proto
```

![image-20240228220702815](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202402282207855.png)

会生成 BookMessage.java 

把生成的 BookMessage.java 拷贝到项目中

#### 3.6.6 客户端

```java
package com.hero.netty.demo03;

import com.hero.netty.demo01.NettyClientHandler;
import io.netty.bootstrap.Bootstrap;
import io.netty.channel.ChannelFuture;
import io.netty.channel.ChannelInitializer;
import io.netty.channel.EventLoopGroup;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.SocketChannel;
import io.netty.channel.socket.nio.NioSocketChannel;
import io.netty.handler.codec.protobuf.ProtobufEncoder;

public class NettyEncoderDecoderClient {
    public static void main(String[] args) throws Exception {
        EventLoopGroup group = new NioEventLoopGroup();
        Bootstrap b = new Bootstrap();
        b.group(group)
                .channel(NioSocketChannel.class)
                .handler(new ChannelInitializer<SocketChannel>() {
                    @Override
                    protected void initChannel(SocketChannel sc) {
                        sc.pipeline().addLast("encoder", new
                                ProtobufEncoder());
                        sc.pipeline().addLast(new NettyClientHandler());
                    }
                });
        // 启动客户端
        ChannelFuture cf = b.connect("127.0.0.1", 9999).sync(); // (5)
        // 等待连接关闭
        cf.channel().closeFuture().sync();
    }
}
```

上述代码在编写客户端程序时，要向 Pipeline 链中添加 ProtobufEncoder 编码器对象。

#### 3.6.7 客户端业务类

```java
package com.hero.netty.demo03;

import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.ChannelInboundHandlerAdapter;

public class NettyEncoderDecoderClientHandler extends ChannelInboundHandlerAdapter {
    @Override
    public void channelActive(ChannelHandlerContext ctx) {
        BookMessage.Book book = BookMessage.Book.newBuilder().setId(1).setName("天王盖地虎").build();
        ctx.writeAndFlush(book);
    }
}
```

上述代码在往服务端发送图书（POJO）时就可以使用生成的 BookMessage 类搞定，非常方便

#### 3.6.8 服务端

```java
package com.hero.netty.demo03;

import io.netty.bootstrap.ServerBootstrap;
import io.netty.channel.ChannelFuture;
import io.netty.channel.ChannelInitializer;
import io.netty.channel.ChannelOption;
import io.netty.channel.EventLoopGroup;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.SocketChannel;
import io.netty.channel.socket.nio.NioServerSocketChannel;
import io.netty.handler.codec.protobuf.ProtobufDecoder;

public class NettyEncoderDecoderServer {
    public static void main(String[] args) throws Exception {
        // 线程组：用来处理网络事件处理（接受客户端连接）
        EventLoopGroup pGroup = new NioEventLoopGroup();
        // 线程组：用来进行网络通讯读写
        EventLoopGroup cGroup = new NioEventLoopGroup();
        ServerBootstrap b = new ServerBootstrap();
        b.group(pGroup, cGroup)
                // 注册服务端channel
                .channel(NioServerSocketChannel.class)
                .option(ChannelOption.SO_BACKLOG, 128)
                .childOption(ChannelOption.SO_KEEPALIVE, true)
                .childHandler(new ChannelInitializer<SocketChannel>() {
                    public void initChannel(SocketChannel sc) throws Exception {
                        sc.pipeline().addLast("decoder", new ProtobufDecoder(BookMessage.Book.getDefaultInstance()));
                        sc.pipeline().addLast(new NettyServerHandler());
                    }
                });
        ChannelFuture cf = b.bind(9999).sync();
        System.out.println("......Server is Starting......");
        // 释放
        cf.channel().closeFuture().sync();
        pGroup.shutdownGracefully();
        cGroup.shutdownGracefully();
    }
}   
```

#### 3.6.9 服务端业务类

```java
package com.hero.netty.demo03;

import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.ChannelInboundHandlerAdapter;

public class NettyEncoderDecoderServerHandler extends ChannelInboundHandlerAdapter {
    @Override
    public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
        BookMessage.Book book = (BookMessage.Book) msg;
        System.out.println("客户端 msg：" + book.getName());
    }
}
```

上述代码在服务端接收数据时，直接就可以把数据转换成 POJO 使用，很方便。