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