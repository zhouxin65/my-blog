# 600 W+ 连接网络应用实战

## 1. Disruptor  框架

### 1.1 什么是 Disruptor？

- LMAX 是英国外汇交易公司，目标是成为世界上最快的交易平台。为了实现这一点，这家公司的技术团队使用 Java 平台实现**非常低的延迟和高吞吐量**的交易系统。经过一系列性能测试表明，**使用队列在系统的各个阶段之间传递数据会导致延迟，当然吞吐量也就很难上的去**，因此他们技术团队专注于优化这个领域，所以 Disruptor 诞生了。
- Disruptor 是一个通用解决方案，用于解决并发编程中的难题（低延迟与高吞吐量）。其本质还是一个**队列（环形）**，与其他队列类似，也是基于生产者消费者模式设计，只不过这个队列很特别是一个环形队列。这个队列能够在无锁的条件下进行并行消费，也可以根据消费者之间的依赖关系进行先后次序消费。
- **说的简单点**：生产者向 RingBuffer 中写入元素，消费从 RingBuffer 中消费元素。基于 Disruptor 开发的系统单线程能支撑每秒 600 万订单。

**它与并发编程中的阻塞队列有什么不同**？

- **低延时高吞吐**
- 快，它实在是太快了

![image-20240307214603876](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202403072146903.png)

```xml
<dependency>
  <groupId>com.lmax</groupId>
  <artifactId>disruptor</artifactId>
  <version>3.4.2</version>
</dependency>
```

### 1.2 通用步骤

1. 创建工厂类，用于生产 Event 对象
2. 创建 Consumer 监听类，用于监听，并处理 Event
3. 创建 Disruptor 对象，并初始化一系列参数：工厂类、RingBuffer 大小、线程池、单生产者或多生产者、Event 等待策略
4. 编写 Producer 组件，向 Disruptor 容器中去投递 Event

### 1.3 核心概念

#### 1.3.1 Disruptor

- 它是一个辅助类，持有 **RingBuffer**、消费者线程池 Executor、消费者仓库 ConsumerRepository 等引用。

#### 1.3.2 RingBuffer 环形缓存器

- RingBuffer 基于数组的实现，数据结构是个首尾相接的环，用做在不同上下文（线程）间传递数据的 buffer。
- RingBuffer 拥有一个 Sequencer 序号器，这个序号器指向数组中下一个可用元素。

<img src="https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202403072148239.png" alt="image-20240307214839216" style="zoom:50%;" />

#### 1.3.3 Sequencer 序号器

- **Sequencer 序号器是 Disruptor核心**。
- 此接口有两个实现类：
  - SingleProducerSequencer 单生产者
  - MultiProducerSequencer 多生产者

#### 1.3.4 Sequence 序号

- Sequencer 序号器中有 Sequence序号，通过顺序递增的序号来编号和管理进行交换的 Event。
- Event 的处理过程总是沿着序号逐个递增处理。
- 一个 Sequence 用于跟踪标识某个特定的事件处理者的处理进度。Producer 和 Consumer 都有自己的 Sequence，用来判断 Consumer 和 Producer 之间平衡，防止生产快，消费慢或生产慢，消费快等情况【上下游速度不一致问题】。相当于标识进度了
  - 解决上下游消费速度不一致问题
  - 异步提速
  - 削峰填谷

#### 1.3.5 WaitStrategy 等待策略

- 决定一个 Consumer 将如何等待 Producer 将 Event 置入 RingBuffer
- 主要策略有：
  - **BlockingWaitStrategy**：**阻塞等待策略**，最低效的策略，但其对 CPU 的消耗最小并且在各种不同部署环境中能提供更加一致的性能表现。
  - **SleepingWaitStrategy**：**休眠等待策略**，性能表现跟 BlockingWaitStrategy 差不多，对 CPU 的消耗也类似，但其对生产者线程的影响最小，适合用于异步日志类似的场景。
  - **YieldingWaitStrategy**：**产生等待策略**，性能最好，适合用于低延迟的系统，在要求极高性能且事件处理线程数小于CPU逻辑核心数的场景中，推荐使用。是**无锁并行**

#### 1.3.6 Event

- 从 Producer 到 Consumer 过程中所处理的数据单元

#### 1.3.7 EventHandler

- 由用户实现，并且代表 Disruptor 中的一个消费者的接口，我们的消费者逻辑都需要写在这里。

## 2. 案例：单生产者 - 单消费者

- 目标：演示 Disruptor 高性能队列的基本用法，创建循环 100 个订单消息并消费之
- 步骤：
  1. 创建 OrderEventFactory 来产生 OrderEvent 实例对象
  2. 创建 Consumer 处理者 OrderEventHandler，当 Producer 投递一条条数据时此 Handler 进行处理
  3. 编写核心类 Main 创建 disruptor 对象，让其与 Consumer 处理者 OrderEventHandler 绑定，启动 disruptor
  4. 通过 disruptor 对象获取到 ringBuffer 容器。
  5. 创建生产者 OrderEventProducer，将消息放到 RingBuffer 容器
  6. 循环 100 次，通过 `sendData()` 投递消息。`sendData()` 方法的最后将消息发布出去，只有发布出去，消费者才能收到

![image-20240307215657644](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202403072156667.png)

### 2.1 OrderEvent

定义需要处理的 OrderEvent 类

```java
package com.hero.disruptor.demo;

// 订单对象，生产者要生产订单对象，消费者消费订单对象
public class OrderEvent {
    
    // 订单的价格
    private long value;

    public long getValue() {
        return value;
    }

    public void setValue(long value) {
        this.value = value;
    }
}
```

### 2.2 OrderEventFactory

定义工厂类 OrderEventFactory，用于创建 OrderEvent 对象。

```java
package com.hero.disruptor.demo;

import com.lmax.disruptor.EventFactory;

// 建立一个工厂类，用于创建 Event 的实例（OrderEvent)
public class OrderEventFactory implements EventFactory<OrderEvent> {
    @Override
    public OrderEvent newInstance() {
        // 返回空的数据对象，不是 null, OrderEvent, value 属性还没有赋值。
        return new OrderEvent();
    }
}
```

### 2.3 OrderEventHandler

```java
package com.hero.disruptor.demo;

import com.lmax.disruptor.EventHandler;

// 消费者
public class OrderEventHandler implements EventHandler<OrderEvent> {
    @Override
    public void onEvent(OrderEvent orderEvent, long l, boolean b) throws Exception {
        // 取出订单对象的价格。
        System.err.println("消费者:" + orderEvent.getValue());
    }
}
```

### 2.4 TestDisruptor

定义测试类，创建 Disruptor 对象，并初始化一系列参数：工厂类、RingBuffer 大小、线程池、单生产者或多生产者、Event 等待策略。

```java
package com.hero.disruptor.demo;

import com.lmax.disruptor.BlockingWaitStrategy;
import com.lmax.disruptor.RingBuffer;
import com.lmax.disruptor.dsl.Disruptor;
import com.lmax.disruptor.dsl.ProducerType;

import java.nio.ByteBuffer;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class TestDisruptor {
    public static void main(String[] args) {
        // 做一些准备工作
        OrderEventFactory orderEventFactory = new OrderEventFactory();
        int ringBufferSize = 8;
        ExecutorService executor = Executors.newFixedThreadPool(Runtime.getRuntime().availableProcessors());
        /*
            1.eventFactory:消息(event)工厂对象
            2.ringBufferSize: 容器的长度
            3.executor:线程池，建议使用自定义的线程池，线程上限。
            4.ProducerType:单生产者或多生产者
            5.waitStrategy:等待策略
        */
        // 1.实例化disruptor对象
        Disruptor<OrderEvent> disruptor = new Disruptor<OrderEvent>
                (orderEventFactory,
                        ringBufferSize,
                        executor,
                        ProducerType.SINGLE,
                        new BlockingWaitStrategy());
        // 2.添加消费者的监听（去构建disruptor与消费者的一个关联关系）
        disruptor.handleEventsWith(new OrderEventHandler());
        // 3.启动disruptor
        disruptor.start();
        // 4.取到容器后通过生产者去生产消息
        // 获取实际存储数据的容器RingBuffer
        RingBuffer<OrderEvent> ringBuffer = disruptor.getRingBuffer();
        // 生产者
        OrderEventProducer producer = new OrderEventProducer(ringBuffer);
        //先初始化ByteBuffer长度为8个字节
        ByteBuffer bb = ByteBuffer.allocate(8);
        // 生产100个orderEvent->value->i 0-99
        for (long i = 0; i < 100; i++) {
            bb.putLong(0, i);
            producer.sendData(bb);
        }
        disruptor.shutdown();
        executor.shutdown();
    }
}
```

### 2.5 OrderEventProducer

定义 Producer 类，向 Disruptor 容器中去投递数据。

```java
package com.hero.disruptor.demo;

import com.lmax.disruptor.RingBuffer;

import java.nio.ByteBuffer;

public class OrderEventProducer {
    // ringBuffer 存储数据的一个容器
    private RingBuffer<OrderEvent> ringBuffer;

    public OrderEventProducer(RingBuffer<OrderEvent> ringBuffer) {
        this.ringBuffer = ringBuffer;
    }

    // 生产者投递的数据
    public void sendData(ByteBuffer data) {
        // 1.在生产者发送消息时，首先要从 ringBuffer 中找一个可用的序号。
        long sequence = ringBuffer.next();
        try {
            // 2.根据这个序号找到具体的 OrderEvent 元素, 此时获取到的 OrderEvent 对象是一个没有被赋值的空对象。
            OrderEvent event = ringBuffer.get(sequence);
            // 3.设置订单价格
            event.setValue(data.getLong(0));
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            // 4.提交发布操作
            // 生产者最后要发布消息，
            ringBuffer.publish(sequence);
        }
    }
}
```

## 3.案例：多生产者和多消费者

时刻 1：

![image-20240330120109649](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202403301201675.png)

时刻 2：

![image-20240330120115204](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202403301201261.png)

### 3.1 Order

```java
package com.hero.disruptor.multi;

/**
 * Disruptor中的 Event
 */
public class Order {
    private String id;
    private String name;
    private double price;

    public Order() {
    }

    // getter and setter
}
```

### 3.2 ConsumerHandler

```java
package com.hero.disruptor.multi;

import com.lmax.disruptor.WorkHandler;

import java.util.Random;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

public class ConsumerHandler implements WorkHandler<Order> {
    // 每个消费者有自己的 id
    private String comsumerId;
    // 计数统计，多个消费者，所有的消费者总共消费了多个消息。
    private static AtomicInteger count = new AtomicInteger(0);
    private Random random = new Random();

    public ConsumerHandler(String comsumerId) {
        this.comsumerId = comsumerId;
    }

    // 当生产者发布一个 sequence，ringbuffer 中一个序号，里面生产者生产出来的消息，生产者最后 publish 发布序号
    // 消费者会监听，如果监听到，就会 ringbuffer 去取出这个序号，取到里面消息
    @Override

    public void onEvent(Order event) throws Exception {
        // 模拟消费者处理消息的耗时，设定1-4毫秒之间
        TimeUnit.MILLISECONDS.sleep(1 * random.nextInt(5));
        System.err.println("当前消费者:" + this.comsumerId + ",消费信息 ID:" + event.getId());
        // count计数器增加+1，表示消费了一个消息
        count.incrementAndGet();
    }

    // 返回所有消费者总共消费的消息的个数。
    public int getCount() {
        return count.get();
    }
}
```

### 3.3 Producer

```java
package com.hero.disruptor.multi;

import com.lmax.disruptor.RingBuffer;

public class Producer {
    private RingBuffer<Order> ringBuffer;

    //为生产者绑定 ringBuffer
    public Producer(RingBuffer<Order> ringBuffer) {
        this.ringBuffer = ringBuffer;
    }

    // 发送数据
    public void sendData(String uuid) {
        // 1.获取到可用sequence
        long sequence = ringBuffer.next();
        try {
            Order order = ringBuffer.get(sequence);
            order.setId(uuid);
        } finally {
            // 发布序号
            ringBuffer.publish(sequence);
        }
    }
}
```

### 3.4 TestMultiDisruptor

```java
package com.hero.disruptor.multi;

import com.lmax.disruptor.*;
import com.lmax.disruptor.dsl.ProducerType;

import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

public class TestMultiDisruptor {
    public static void main(String[] args) throws InterruptedException {
        // 1.创建 RingBuffer，Disruptor 包含 RingBuffer
        RingBuffer<Order> ringBuffer = RingBuffer.create(
                ProducerType.MULTI, //多生产者
                new EventFactory<Order>() {
                    @Override
                    public Order newInstance() {
                        return new Order();
                    }
                },
                1024 * 1024,
                new YieldingWaitStrategy());
        // 2.创建 ringBuffer 屏障
        SequenceBarrier sequenceBarrier = ringBuffer.newBarrier();
        //3.创建多个消费者数组
        ConsumerHandler[] consumers = new ConsumerHandler[10];
        for (int i = 0; i < consumers.length; i++) {
            consumers[i] = new ConsumerHandler("C" + i);
        }
        // 4.构建多消费者工作池
        WorkerPool<Order> workerPool = new WorkerPool<Order>(
                ringBuffer,
                sequenceBarrier,
                new EventExceptionHandler(),
                consumers);
        // 5.设置多个消费者的 sequence 序号，用于单独统计消费者的消费进度。消费进度让 RingBuffer 知道
        ringBuffer.addGatingSequences(workerPool.getWorkerSequences());
        // 6.启动 workPool
        workerPool.start(Executors.newFixedThreadPool(5)); //在实际开发，自定义线程池。
        // 要生产 100 生产者，每个生产者发送 100 个数据,投递 10000
        final CountDownLatch latch = new CountDownLatch(1);
        // 设置 100 个生产者向 ringBuffer 中去投递数据
        for (int i = 0; i < 100; i++) {
            final Producer producer = new Producer(ringBuffer);
            new Thread(new Runnable() {
                @Override
                public void run() {
                    try {
                        // 每次一个生产者创建后就处理等待。先创建100个生产者，创建完 100 个生产者后再去发送数据。
                        latch.await();
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                    // 每个生产者投递100个数据
                    for (int j = 0; j < 100; j++) {
                        producer.sendData(UUID.randomUUID().toString());
                    }
                }
            }).start();
        }
        // 把所有线程都创建完
        TimeUnit.SECONDS.sleep(2);
        // 唤醒，开始运行 100 个线程
        latch.countDown();
        // 休眠 10s，让生产者将 100 次循环走完
        TimeUnit.SECONDS.sleep(10);
        System.err.println("任务总数:" + consumers[0].getCount());
    }

    static class EventExceptionHandler implements ExceptionHandler<Order> {
        //消费时出现异常
        @Override
        public void handleEventException(Throwable throwable, long l, Order order) {
        }

        //启动时出现异常
        @Override
        public void handleOnStartException(Throwable throwable) {
        }

        //停止时出现异常
        @Override
        public void handleOnShutdownException(Throwable throwable) {
        }
    }
}
```

## 4.案例：使用 Disruptor 提升 Netty 应用性能

### 4.1 构建 Netty 网络模型

![image-20240330122116277](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202403301221298.png)

#### 4.1.1 构建基础网络应用环境

- disruptor-netty-com 是通用包
- disruptor-netty-client 是客户端
- disruptor-netty-server 是服务端

```xml
<dependency>
	<groupId>io.netty</groupId>
  <artifactId>netty-all</artifactId>
	<version>4.1.12.Final</version>
</dependency>
<!-- 序列化框架 marshalling -->
<dependency>
	<groupId>org.jboss.marshalling</groupId>
  <artifactId>jboss-marshalling</artifactId>
  <version>1.3.0.CR9</version>
</dependency>
<dependency>
	<groupId>org.jboss.marshalling</groupId>
  <artifactId>jboss-marshalling-serial</artifactId>
  <version>1.3.0.CR9</version>
</dependency>
<dependency>
	<groupId>com.lmax</groupId>
  <artifactId>disruptor</artifactId>
  <version>3.3.2</version>
</dependency>
```

#### 4.1.2 TranslatorData

传输的数据对象

```java
package com.hero.entity;

import java.io.Serializable;

public class TranslatorData implements Serializable {
    private static final long serialVersionUID = -6404088974667862905L;
    private String id;
    private String name;
    private String message; //传输消息体内容

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
```

#### 4.1.3 NettyServer

```java
package com.hero.server;

import com.hero.util.MarshallingCodeCFactory;
import io.netty.bootstrap.ServerBootstrap;
import io.netty.buffer.PooledByteBufAllocator;
import io.netty.channel.*;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.SocketChannel;
import io.netty.channel.socket.nio.NioServerSocketChannel;
import io.netty.handler.logging.LogLevel;
import io.netty.handler.logging.LoggingHandler;

public class NettyServer {
    public NettyServer() {
        // 1. 创建两个工作线程组: 一个用于接受网络请求的线程组. 另一个用于实际处理业务的线程组
        EventLoopGroup bossGroup = new NioEventLoopGroup();
        EventLoopGroup workGroup = new NioEventLoopGroup();
        // 2. 辅助类
        ServerBootstrap serverBootstrap = new ServerBootstrap();
        try {
            serverBootstrap.group(bossGroup, workGroup)
                    .channel(NioServerSocketChannel.class)
                    .option(ChannelOption.SO_BACKLOG, 1024)
                    // 表示缓存区动态调配（自适应）
                    .option(ChannelOption.RCVBUF_ALLOCATOR,
                            AdaptiveRecvByteBufAllocator.DEFAULT)
                    // 缓存区 池化操作
                    .option(ChannelOption.ALLOCATOR, PooledByteBufAllocator.DEFAULT)
                    .handler(new LoggingHandler(LogLevel.INFO))
                    .childHandler(new ChannelInitializer<SocketChannel>() {
                        @Override
                        protected void initChannel(SocketChannel sc) throws Exception {
                            sc.pipeline().addLast(MarshallingCodeCFactory.buildMarshallingDecoder());
                            sc.pipeline().addLast(MarshallingCodeCFactory.buildMarshallingEncoder());
                            sc.pipeline().addLast(new ServerHandler());
                        }
                    });
            // 绑定端口，同步等等请求连接
            ChannelFuture cf = serverBootstrap.bind(8765).sync();
            System.err.println("Server Startup...");
            cf.channel().closeFuture().sync();
        } catch (InterruptedException e) {
            e.printStackTrace();
        } finally {
            // 优雅停机
            bossGroup.shutdownGracefully();
            workGroup.shutdownGracefully();
            System.err.println("Sever ShutDown...");
        }
    }
}
```

#### 4.1.4 ServerHandler

```java
package com.hero.server;

import com.hero.entity.TranslatorData;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.ChannelInboundHandlerAdapter;

public class ServerHandler extends ChannelInboundHandlerAdapter {
    @Override
    public void channelRead(ChannelHandlerContext ctx, Object msg) {
        TranslatorData request = (TranslatorData) msg;
        System.err.println("Sever端: id= " + request.getId() + ", name= " + request.getName() + ", message= " + request.getMessage());
        // 数据库持久化操作 IO 读写 ---> 交给一个线程池 去异步的调用执行
        TranslatorData response = new TranslatorData();
        response.setId("resp: " + request.getId());
        response.setName("resp: " + request.getName());
        response.setMessage("resp: " + request.getMessage());
        // 写出 response 响应信息:
        ctx.writeAndFlush(response);
    }
}
```

#### 4.1.5 NettyClient

```java
package com.hero.client;

import com.hero.entity.TranslatorData;
import com.hero.util.MarshallingCodeCFactory;
import io.netty.bootstrap.Bootstrap;
import io.netty.buffer.PooledByteBufAllocator;
import io.netty.channel.*;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.SocketChannel;
import io.netty.channel.socket.nio.NioSocketChannel;
import io.netty.handler.logging.LogLevel;
import io.netty.handler.logging.LoggingHandler;

public class NettyClient {
    public static final String HOST = "127.0.0.1";
    public static final int PORT = 8765;
    // 扩展 完善 池化: ConcurrentHashMap<KEY -> String, Value -> Channel>
    private Channel channel;
    // 1. 创建工作线程组: 用于实际处理业务的线程组
    private EventLoopGroup workGroup = new NioEventLoopGroup();
    private ChannelFuture cf;
    public NettyClient() {
        this.connect(HOST, PORT);
    }
    private void connect(String host, int port) {
        // 2 辅助类(注意 Client 和 Server 不一样)
        Bootstrap bootstrap = new Bootstrap();
        try {
            // 绑定一个线程组
            bootstrap.group(workGroup)
                    .channel(NioSocketChannel.class)
                    // 表示缓存区动态调配（自适应）
                    .option(ChannelOption.RCVBUF_ALLOCATOR, AdaptiveRecvByteBufAllocator.DEFAULT)
                    // 缓存区 池化操作
                    .option(ChannelOption.ALLOCATOR, PooledByteBufAllocator.DEFAULT)
                    .handler(new LoggingHandler(LogLevel.INFO))
                    .handler(new ChannelInitializer<SocketChannel>() {
                        @Override
                        protected void initChannel(SocketChannel sc) throws Exception {
                            // 网络传递对象，客户端和服务端都要做编码解码操作
                            sc.pipeline().addLast(MarshallingCodeCFactory.buildMarshallingDecoder());
                            sc.pipeline().addLast(MarshallingCodeCFactory.buildMarshallingEncoder());
                            sc.pipeline().addLast(new ClientHandler());
                        }
                    });
            // 绑定端口，同步等等请求连接
            this.cf = bootstrap.connect(host, port).sync();
            System.err.println("Client connected...");
            // 接下来就进行数据的发送, 但是首先我们要获取 channel:
            this.channel = cf.channel();
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
    //发送数据的方法，提供给外部使用
    public void sendData(){
        for(int i =0; i <10; i++){
            TranslatorData request = new TranslatorData();
            request.setId("" + i);
            request.setName("请求消息名称 " + i);
            request.setMessage("请求消息内容 " + i);
            this.channel.writeAndFlush(request);
        }
    }
    public void close() throws Exception {
        cf.channel().closeFuture().sync();
        workGroup.shutdownGracefully();//优雅停机
        System.err.println("Sever ShutDown...");
    }
}

```

#### 4.1.6 ClientHandler

```java
package com.hero.client;

import com.hero.entity.TranslatorData;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.ChannelInboundHandlerAdapter;
import io.netty.util.ReferenceCountUtil;

public class ClientHandler extends ChannelInboundHandlerAdapter {
    public void channelRead(ChannelHandlerContext ctx, Object msg) {
        try {
            TranslatorData response = (TranslatorData) msg;
            System.err.println("Client端: id= " + response.getId() + ", name= " + response.getName() + ", message= " + response.getMessage());
        } finally {
            // 一定要注意 用完了缓存 要进行释放
            ReferenceCountUtil.release(msg);
        }
    }
}
```

#### 4.1.7 MarshallingCodeCFactory

```java
package com.hero.util;

import io.netty.handler.codec.marshalling.*;
import org.jboss.marshalling.MarshallerFactory;
import org.jboss.marshalling.Marshalling;
import org.jboss.marshalling.MarshallingConfiguration;

public class MarshallingCodeCFactory {

    /**
     * 创建JBoss Marshalling解码器
     *
     * @return
     */
    public static MarshallingDecoder buildMarshallingDecoder() {
        final MarshallerFactory marshallerFactory = Marshalling.getProvidedMarshallerFactory("serial");
        final MarshallingConfiguration configuration = new MarshallingConfiguration();
        configuration.setVersion(5);
        UnmarshallerProvider provider = new DefaultUnmarshallerProvider(marshallerFactory, configuration);
        MarshallingDecoder decoder = new MarshallingDecoder(provider, 1024 * 1024 * 1);
        return decoder;
    }

    /**
     * 创建JBoss Marshalling编码器
     *
     * @return
     */
    public static MarshallingEncoder buildMarshallingEncoder() {
        final MarshallerFactory marshallerFactory = Marshalling.getProvidedMarshallerFactory("serial");
        final MarshallingConfiguration configuration = new MarshallingConfiguration();
        configuration.setVersion(5);
        MarshallerProvider provider = new DefaultMarshallerProvider(marshallerFactory, configuration);
        MarshallingEncoder encoder = new MarshallingEncoder(provider);
        return encoder;
    }
}
```

#### 4.1.8 启动类

服务端 NettyServerApplication

```java
package com.hero;

import com.hero.server.NettyServer;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class NettyServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(NettyServerApplication.class, args);
        new NettyServer();
    }
}
```

客户端 NettyClientApplication

```java
package com.hero;

import com.hero.client.NettyClient;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class NettyClientApplication {
    public static void main(String[] args) {
        SpringApplication.run(NettyClientApplication.class, args);
        // 建立连接 并发送消息
        new NettyClient().sendData();
    }
}
```

### 4.2 整合 Disruptor

![image-20240330130929415](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202403301309447.png)

在使用 Netty 进行接收处理数据时，尽量不要在工作线程上编写自己的代理逻辑，会降低 netty 性能。可以利用异步机制，如使用线程池异步处理，如果使用线程池就意味使用阻塞对列，可以替换为Disruptor提高性能。

**加入 Disruptor 提升性能**：

Event 是客户端发到服务端的数据，serverHandler 获取到 Event 后，不在 serverHandler 中对数据做处理，将 Event 通过生产者交给 Disruptor 组件。消费者 c1、c2、c3 通过负载均衡去消费投递过来的数据。服务端最终要返回一个响应数据给客户端。客户端这边也不是在 ClientHandler 中处理数据，也要构建一个生产消费者模型，有多个线程去处理。

![image-20240330131117329](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202403301311358.png)

#### 4.2.1 TranslatorDataWrapper

传输的对象包装类

```java
package com.hero.entity;

import io.netty.channel.ChannelHandlerContext;

public class TranslatorDataWrapper {
    private TranslatorData data;
    private ChannelHandlerContext ctx;

    public TranslatorData getData() {
        return data;
    }

    public void setData(TranslatorData data) {
        this.data = data;
    }

    public ChannelHandlerContext getCtx() {
        return ctx;
    }

    public void setCtx(ChannelHandlerContext ctx) {
        this.ctx = ctx;
    }
}
```

#### 4.2.2 MessageProducer

 生产者

```java
package com.hero.disruptor;

import com.hero.entity.TranslatorData;
import com.hero.entity.TranslatorDataWrapper;
import com.lmax.disruptor.RingBuffer;
import io.netty.channel.ChannelHandlerContext;

public class MessageProducer {
    private String producerId;
    private RingBuffer<TranslatorDataWrapper> ringBuffer;

    public MessageProducer(String producerId, RingBuffer<TranslatorDataWrapper> ringBuffer) {
        this.producerId = producerId;
        this.ringBuffer = ringBuffer;
    }

    public void onData(TranslatorData data, ChannelHandlerContext ctx) {
        long sequence = ringBuffer.next();
        try {
            TranslatorDataWrapper wrapper = ringBuffer.get(sequence);
            wrapper.setData(data);
            wrapper.setCtx(ctx);
        } finally {
            ringBuffer.publish(sequence);
        }
    }
}
```

#### 4.2.3 MessageConsumer

消费者

```java
package com.hero.disruptor;

import com.hero.entity.TranslatorDataWrapper;
import com.lmax.disruptor.WorkHandler;

public abstract class MessageConsumer implements WorkHandler<TranslatorDataWrapper> {
    protected String consumerId;

    public MessageConsumer(String consumerId) {
        this.consumerId = consumerId;
    }

    public String getConsumerId() {
        return consumerId;
    }

    public void setConsumerId(String consumerId) {
        this.consumerId = consumerId;
    }
}
```

#### 4.2.4 RingBufferWorkerPoolFactory

创建连接池工厂类

```java
package com.hero.disruptor;

import com.hero.entity.TranslatorDataWrapper;
import com.lmax.disruptor.*;
import com.lmax.disruptor.dsl.ProducerType;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;

public class RingBufferWorkerPoolFactory {
    // 单例
    private static class SingletonHolder {
        static final RingBufferWorkerPoolFactory instance = new RingBufferWorkerPoolFactory();
    }

    private RingBufferWorkerPoolFactory() {
    }

    public static RingBufferWorkerPoolFactory getInstance() {
        return SingletonHolder.instance;
    }

    // 需要生产者池和消费者池管理生产和消费者。
    private static Map<String, MessageProducer> producers = new ConcurrentHashMap<String, MessageProducer>();
    private static Map<String, MessageConsumer> consumers = new ConcurrentHashMap<String, MessageConsumer>();
    private RingBuffer<TranslatorDataWrapper> ringBuffer;
    private SequenceBarrier sequenceBarrier;
    private WorkerPool<TranslatorDataWrapper> workerPool;

    // 初始化 ProducerType 生产者类型，是多生产还是单生产。MessageConsumer[] 多消费者
    public void initAndStart(ProducerType type, int bufferSize, WaitStrategy
            waitStrategy, MessageConsumer[] messageConsumers) {
        // 1.构建 ringBuffer 对象
        this.ringBuffer = RingBuffer.create(type,
                new EventFactory<TranslatorDataWrapper>() {
                    public TranslatorDataWrapper newInstance() {
                        return new TranslatorDataWrapper();
                    }
                },
                bufferSize,
                waitStrategy);
        // 2.设置序号栅栏
        this.sequenceBarrier = this.ringBuffer.newBarrier();
        // 3.设置工作池
        this.workerPool = new WorkerPool<TranslatorDataWrapper>
                (this.ringBuffer,
                        this.sequenceBarrier,
                        new EventExceptionHandler(), messageConsumers);
        // 4.把所构建的消费者置入池中
        for (MessageConsumer mc : messageConsumers) {
            this.consumers.put(mc.getConsumerId(), mc);
        }
        // 5.添加我们的 sequences
        this.ringBuffer.addGatingSequences(this.workerPool.getWorkerSequences());
        // 6.启动我们的工作池
        this.workerPool.start(Executors.newFixedThreadPool(Runtime.getRuntime().availableProcessors() / 2));
    }

    public MessageProducer getMessageProducer(String producerId) {
        // 池里有直接获取生产者
        MessageProducer messageProducer = this.producers.get(producerId);
        if (null == messageProducer) {
            messageProducer = new MessageProducer(producerId, this.ringBuffer);
            this.producers.put(producerId, messageProducer);
        }
        return messageProducer;
    }

    /**
     * 异常静态类
     */
    static class EventExceptionHandler implements ExceptionHandler<TranslatorDataWrapper> {
        public void handleEventException(Throwable ex, long sequence, TranslatorDataWrapper event) {
        }

        public void handleOnStartException(Throwable ex) {
        }

        public void handleOnShutdownException(Throwable ex) {
        }
    }
}
```

### 4.3 百万级连接接入

#### 4.3.1 修改 ServerHandler

```java
package com.hero.server;

import com.hero.disruptor.MessageProducer;
import com.hero.disruptor.RingBufferWorkerPoolFactory;
import com.hero.entity.TranslatorData;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.ChannelInboundHandlerAdapter;

public class ServerHandler extends ChannelInboundHandlerAdapter {
    @Override
    public void channelRead(ChannelHandlerContext ctx, Object msg) {
        TranslatorData request = (TranslatorData) msg;
        // 自已的应用服务应该有一个ID生成规则
        String producerId = "code:sessionId:001";
        MessageProducer messageProducer = RingBufferWorkerPoolFactory.getInstance().getMessageProducer(producerId);
        messageProducer.onData(request, ctx);
    }
}
```

#### 4.3.2 MessageConsumerImpl4Server

服务器端消费者：用来处理客户端发送来数据的逻辑

```java
package com.hero.server;

import com.hero.disruptor.MessageConsumer;
import com.hero.entity.TranslatorData;
import com.hero.entity.TranslatorDataWrapper;
import io.netty.channel.ChannelHandlerContext;

public class MessageConsumerImpl4Server extends MessageConsumer {
    public MessageConsumerImpl4Server(String consumerId) {
        super(consumerId);
    }

    public void onEvent(TranslatorDataWrapper event) throws Exception {
        TranslatorData request = event.getData();
        ChannelHandlerContext ctx = event.getCtx();
        // 1.业务处理逻辑:
        System.err.println("Sever端: id= " + request.getId() + ", name= " + request.getName() + ", message= " + request.getMessage());
        // 2.回送响应信息:
        TranslatorData response = new TranslatorData();
        response.setId("resp: " + request.getId());
        response.setName("resp: " + request.getName());
        response.setMessage("resp: " + request.getMessage());
        // 写出 response 响应信息:
        ctx.writeAndFlush(response);
    }
}
```

#### 4.3.3 修改 ClientHandler

```java
package com.hero.client;

import com.hero.disruptor.MessageProducer;
import com.hero.disruptor.RingBufferWorkerPoolFactory;
import com.hero.entity.TranslatorData;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.ChannelInboundHandlerAdapter;

public class ClientHandler extends ChannelInboundHandlerAdapter {
    public void channelRead(ChannelHandlerContext ctx, Object msg) {
        TranslatorData response = (TranslatorData) msg;
        // 消费者和生产者共用一个池，所以 id 不可以冲突,以后可以随机生成 id(机器码:sessionId:标识)
        String producerId = "code:seesionId:002";
        MessageProducer messageProducer = RingBufferWorkerPoolFactory.getInstance().getMessageProducer(producerId);
        messageProducer.onData(response, ctx);
    }
}
```

#### 4.3.4 MessageConsumerImpl4Client

客户端处理服务端返回数据

```java
package com.hero.client;

import com.hero.disruptor.MessageConsumer;
import com.hero.entity.TranslatorData;
import com.hero.entity.TranslatorDataWrapper;
import io.netty.channel.ChannelHandlerContext;
import io.netty.util.ReferenceCountUtil;

public class MessageConsumerImpl4Client extends MessageConsumer {
    public MessageConsumerImpl4Client(String consumerId) {
        super(consumerId);
    }

    public void onEvent(TranslatorDataWrapper event) throws Exception {
        TranslatorData response = event.getData();
        ChannelHandlerContext ctx = event.getCtx();
        // 业务逻辑处理:
        try {
            System.err.println("Client 端: id= " + response.getId() + ", name= " + response.getName() + ", message= " + response.getMessage());
        } finally {
            ReferenceCountUtil.release(response);
        }
    }
}
```

#### 4.3.5 启动类

服务端

```java
package com.hero;

import com.hero.disruptor.MessageConsumer;
import com.hero.disruptor.RingBufferWorkerPoolFactory;
import com.hero.server.MessageConsumerImpl4Server;
import com.hero.server.NettyServer;
import com.lmax.disruptor.BlockingWaitStrategy;
import com.lmax.disruptor.dsl.ProducerType;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class NettyServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(NettyServerApplication.class, args);
        MessageConsumer[] consumers = new MessageConsumer[4];
        for (int i = 0; i < consumers.length; i++) {
            MessageConsumer messageConsumer = new MessageConsumerImpl4Server("code:serverId:" + i);
            consumers[i] = messageConsumer;
        }
        RingBufferWorkerPoolFactory.getInstance().initAndStart(ProducerType.MULTI,
                1024 * 1024,
                new BlockingWaitStrategy(),
                consumers);
        new NettyServer();
    }
}
```

客户端

```java
package com.hero;

import com.hero.client.MessageConsumerImpl4Client;
import com.hero.client.NettyClient;
import com.hero.disruptor.MessageConsumer;
import com.hero.disruptor.RingBufferWorkerPoolFactory;
import com.lmax.disruptor.BlockingWaitStrategy;
import com.lmax.disruptor.dsl.ProducerType;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class NettyClientApplication {
    public static void main(String[] args) {
        SpringApplication.run(NettyClientApplication.class, args);
        MessageConsumer[] consumers = new MessageConsumer[4];
        for (int i = 0; i < consumers.length; i++) {
            MessageConsumer messageConsumer = new MessageConsumerImpl4Client("code:clientId:" + i);
            consumers[i] = messageConsumer;
        }
        RingBufferWorkerPoolFactory.getInstance().initAndStart(ProducerType.MULTI,
                1024 * 1024,
                // new YieldingWaitStrategy(),
                new BlockingWaitStrategy(),
                consumers);
        // 建立连接 并发送消息
        new NettyClient().sendData();
    }
}
```

#### 4.3.6 测试

```java
//发送数据的方法，提供给外部使用
    public void sendData() {
        for (int i = 0; i < 6000000; i++) {
            TranslatorData request = new TranslatorData();
            request.setId("" + i);
            request.setName("请求消息名称 " + i);
            request.setMessage("请求消息内容 " + i);
            this.channel.writeAndFlush(request);
        }
    }
```

