---
title: 600 W+ 连接网络应用实战
date: 2024-03-07
categories:
- 网络编程
tags:
- 网络编程
- disruptor
---

# 600 W+ 连接网络应用实战

## 1. Disruptor 框架

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

