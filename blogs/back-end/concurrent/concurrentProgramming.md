---
title: 并发编程
date: 2024-01-24
categories:
  - 并发编程
tags:
  - 并发编程
---

# 并发编程

## 1. JUC 简介

**从 JDK 1.5 起，Java API 中提供了 java.util.concurrent（简称 JUC ）包，在此包中定义了并发编程中很常用的工具。**

![image-20240124200519425](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401242005445.png)

<img src="https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401242005345.png" alt="image-20240124200541327" style="zoom: 33%;" />

## 2. 原子类与 CAS

### 2.1 Atomic 包

#### 2.1.1 什么是原子类？

JDK 1.5 之后，JUC 的 atomic 包中，提供了一系列**用法简单、性能高效、线程安全的更新一个变量的类**，这些称之为原子类。

**作用：**保证共享变量操作的原子性、可见性，可以解决 volatile 原子性操作变量的 BUG

#### 2.1.2 **Atomic 包里的类：**

- **基本类型 - 使用原子的方式更新基本类型**
  - AtomicInteger：整形原子类
  - AtomicLong：长整型原子类
  - AtomicBoolean ：布尔型原子类
- **引用类型**
  - AtomicReference：引用类型原子类 
  - AtomicStampedReference：原子更新引用类型里的字段原子类
  - AtomicMarkableReference ：原子更新带有标记位的引用类型
- **数组类型-使用原子的方式更新数组里的某个元素**
  - AtomicIntegerArray：整形数组原子类
  - AtomicLongArray：长整形数组原子类
  - AtomicReferenceArray ：引用类型数组原子类
- **对象的属性修改类型**
  - AtomicIntegerFieldUpdater:原子更新整形字段的更新器
  - AtomicLongFieldUpdater：原子更新长整形字段的更新器
  - AtomicReferenceFieldUpdater ：原子更新引用类形字段的更新器
- JDK1.8新增类
  - DoubleAdder：双浮点型原子类
  - LongAdder：长整型原子类
  - DoubleAccumulator：类似DoubleAdder，但要更加灵活(要传入一个函数式接口)
  - LongAccumulator：类似LongAdder，但要更加灵活(要传入一个函数式接口)

虽然原子类很多，但原理几乎都差不多，其核心是采用 **CAS 进行原子操作**

#### 2.1.3 **AtomicInteger 主要 API**

```java
get() // 直接返回值
getAndAdd(int) // 增加指定的数据，返回变化前的数据
getAndDecrement() // 减少 1，返回减少前的数据
getAndIncrement() // 增加 1，返回增加前的数据
getAndSet(int) // 设置指定的数据，返回设置前的数据
addAndGet(int) // 增加指定的数据后返回增加后的数据
decrementAndGet() // 减少 1，返回减少后的值
incrementAndGet() // 增加 1，返回增加后的值
lazySet(int) // 仅仅当 get 时才会 set
compareAndSet(int, int) // 尝试新增后对比，若增加成功则返回 true 否则返回 false
```

### 2.2 CAS（compare and swap）

#### 2.1 CAS 是什么？

CAS 即 **compare and swap（比较再替换），**同步组件中大量使用 CAS 技术实现了 Java 多线程的并发操作。整个 AQS、Atomic 原子类底层操作，都可以看见 CAS。甚至 ConcurrentHashMap 在 1.8 的版本中也调整为了 CAS + Synchronized。可以说 CAS 是整个 JUC 的基石。

**执行函数：CAS ( V , E , N)**

- V：要读写的内存地址

- E：进行比较的值（预期值）

- N：拟写入的新值

当且仅当**内存地址的 V** 中的值等于**预期值 E**  时，将**内存地址的 V** 中的值改为 N，否则会进行自旋操作，即不断的重试。

**CAS 本质是一条 CPU 的原子指令，可以保证共享变量修改的原子性。**

#### 2.2 CAS 的缺陷

CAS 虽然很好的解决了共享变量的原子操作问题，但还是有一些缺陷:

- **循环时间不可控：**如果 CAS 一直不成功，那么 CAS 自旋就是个死循环。会给 CPU 造成负担

- **只能保证一个共享变量原子操作**

- **ABA 问题：**CAS 检查操作的值有没有发生改变，如果没有则更新。这就存在一种情况：如果原来的值是 A，然后变成了 B，然后又变为 A 了，那么 CAS 检测不到数据发生了变化，但是其实数据已经改变了。

## 3. Lock 锁与 AQS

### 3.1 Java 锁简介

**JUC 包提供了种类丰富的锁，每种锁特性各不相同**：

- **ReentrantLock 重入锁：**它具有与使用 synchronized 相同的一些基本行为和语义，但是它的 API 功能更强大，重入锁相当于 synchronized 的增强版，具有 synchronized 很多所没有的功能。它是一种 **独享锁（互斥锁）**，可以是**公平锁**，也可以是**非公平的锁**。

- **ReentrantReadWriteLock 读写锁：**它维护了一对锁，ReadLock 读锁和 WriteLock 写锁。读写锁适合**读多写少**的场景。基本原则：**读锁可以被多个线程同时持有进行访问，而写锁只能被一个线程持有。**可以这么理解：**读写锁是个混合体，它既是一个共享锁，也是一个独享锁。**

- **StampedLock 重入读写锁**：JDK 1.8 引入的锁类型，是对读写锁 ReentrantReadWriteLock 的增强版。

### 3.2 Java 锁分类

#### 3.2.1 **按上锁方式划分**

- **隐式锁：synchronized，**不需要显示加锁和解锁
- **显式锁：JUC 包中提供的锁，**需要显示加锁和解锁

#### 3.2.2 按特性划分

- **悲观锁 / 乐观锁：按照线程在使用共享资源时，要不要锁住同步资源，划分为悲观锁和乐观锁**

  - 悲观锁：JUC 锁，synchronized

  - 乐观锁：CAS，关系型数据库的版本号机制

- **重入锁 / 不可重入锁：按照同一个线程是否可以重复获取同一把锁，划分为重入锁和不可重入锁**

  - 重入锁：ReentrantLock、synchronized

  - 不可重入锁：不可重入锁，与可重入锁相反，线程获取锁之后不可重复获取锁，重复获取会发生死锁

- **公平锁 / 非公平锁：按照多个线程竞争同一锁时需不需要排队，能不能插队，划分为公平锁和非公平锁。**

  - 公平锁：new ReentrantLock(true) 多个线程按照申请锁的顺序获取锁

  - 非公平锁：new ReentrantLock(false) 多个线程获取锁的顺序不是按照申请锁的顺序(可以插队) synchronized

- **独享锁 / 共享锁：按照多个线程能不能同时共享同一个锁，锁被划分为独享锁和共享锁。**

  - 独享锁：独享锁也叫排他锁，synchronized，ReentrantLock，ReentrantReadWriteLock 的 WriteLock 写锁

  - 共享锁：ReentrantReadWriteLock 的 ReadLock 读锁

#### 3.3.3 其他锁

**自旋锁：**

- 实现：CAS、轻量级锁

**分段锁：**

- 实现：ConcurrentHashMap

- ConcurrentHashMap 所使用的锁分段技术，首先将数据分成一段一段的存储，然后给每一段数据配一把锁，当一个线程占用锁访问其中一个段数据的时候，其他段的数据也能被其他线程访问。

**无锁 / 偏向锁 / 轻量级锁 / 重量级锁**

- **这四个锁是 synchronized 独有的四种状态**，级别从低到高依次是：无锁、偏向锁、轻量级锁和重量级锁。

- 它们是 JVM 为了提高 synchronized 锁的获取与释放效率而做的优化

- 四种状态会随着竞争的情况逐渐升级，而且是不可逆的过程，即不可降级。

### 3.3 Synchronized 和 JUC 锁对比

**Java 已经提供了synchronized，为什么还要使用 JUC 的锁呢？**

**Synchronize的缺陷：**

- **Synchronized 无法控制阻塞时长，阻塞不可中断**

  - 使用 Synchronized，假如占有锁的线程被长时间阻塞（IO、sleep、join），由于线程阻塞时没法释放锁，会导致大量线程堆积，轻则影响性能，重则服务雪崩

  - **JUC 的锁可以解决这两个缺陷**

- **读多写少的场景中，多个读线程同时操作共享资源时不需要加锁**

  - Synchronized 不论是读还是写，均需要同步操作，这种做法并不是最优解

  - **JUC 的 ReentrantReadWriteLock 锁可以解决这个问题**

### 3.4 ReentrantLock 原理分析之 AQS

在重入锁 ReentrantLock 类关系图中，可以看到 NonfairSync 和 FairSync 都继承自抽象类 Sync，而 **Sync 类继承自抽象类 AbstractQueuedSynchronizer**（简称AQS）。

如果你看过 JUC 的源码，发现不仅重入锁用到了 AQS，JUC 中绝大部分的同步工具类也都是基于 AQS

![image-20240124204526756](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401242045773.png)

#### 3.4.1 AQS 简介

**AQS 即队列同步器，是 JUC 并发包中的核心基础组件**，其本身只是一个抽象类。其实现原理与前面介绍的 **Monitor 管程**是一样的，AQS 中也用到了 CAS 和 Volatile。

由类图可以看到，AQS 是一个 **FIFO 的双向队列，队列中存储的是 thread**，其内部通过节点 head 和 tail 记录队首和队尾元素，队列元素的类型为 Node。

<img src="https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401242047283.png" alt="image-20240124204741264" style="zoom:50%;" />

![image-20240124204707306](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401242047324.png)

#### 3.4.2 AQS 实现原理

AQS 中的内部静态类 Node 为链表节点，**线程获取锁失败后，会被阻塞并被封装成 Node 加入到 AQS 队列中**；**当获取到锁的线程释放锁后，会从 AQS 队列中的唤醒一个线程（节点）。**

<img src="https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401242052044.png" alt="image-20240124205205025" style="zoom:35%;" />

**场景 01 - 线程抢夺锁失败时，AQS 队列的变化**

1. AQS 的 head、tail 分别代表同步队列头节点和尾节点指针默认为 null

<img src="https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401242057393.png" alt="image-20240124205711367" style="zoom: 67%;" />

2. 当第一个线程抢夺锁失败，同步队列会先初始化，随后线程会被封装成 Node 节点追加到 AQS 队列中。

   - 假设：当前独占锁的的线程为 Thread A，抢占锁失败的线程为 Thread B。
     1. 同步队列初始化，首先在队列中添加 Node，thread = null

        <img src="https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401242059993.png" alt="image-20240124205907977" style="zoom: 67%;" />

     2. 将 Thread B 封装成为 Node，追加到 AQS 队列

     <img src="https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401242059365.png" alt="image-20240124205933346" style="zoom: 67%;" />

3. 当下一个线程抢夺锁失败时，继续重复上面步骤。假设此次抢占锁失败的线程为 Thread C。

<img src="https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401242101596.png" alt="image-20240124210104577" style="zoom:67%;" />

**场景 02 - 线程被唤醒时，AQS 队列的变化**

- ReentrantLock 唤醒阻塞线程时，会按照 **FIFO 的原则从 AQS 中 head 头部开始唤醒首个节点中线程**。

- head 节点表示当前获取锁成功的线程 Thread A 节点。

- 当 Thread A 释放锁时，它会唤醒后继节点线程 Thread B，Thread B 开始尝试获得锁，如果 Thread B 获得锁成功，会将自己设置为 AQS 的头节点。Thread B 获取锁成功后，AQS 变化如下：
  1. head 指针指向 Thread B 节点。
  2. 将原来头节点的 next 指向 Null，从 AQS 中删除。
  3. 将 Thread B 节点的 prev 指向 Null，设置节点的 thread = null。

<img src="https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401242103382.png" alt="image-20240124210342362"  />

### 3.5 锁的获取

![image-20240124210625446](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401242106460.png)

##### **第一步：ReentrantLock.lock()**

```java	
public void lock() {
	sync.lock();
}
```

sync 是 Sync 类的一个实例，Sync 类实际上是 ReentrantLock 的抽象静态内部类，它集成了 AQS 来实现重入锁的具体业务逻辑。AQS 是一个同步队列，实现了线程的阻塞和唤醒，没有实现具体的业务功能。在不同的同步场景中，需要用户继承 AQS 来实现对应的功能。

我们查看 ReentrantLock 源码，可以看到，Sync 有两个实现类公平锁 FairSync 和非公平锁 NoFairSync。重入锁实例化时，根据参数 fair 为属性 sync 创建对应锁的实例。以公平锁为例，调用 sync.lock 事实上调用的是FairSync 的 lock 方法。

```java
public ReentrantLock(boolean fair) {
	sync = fair ? new FairSync() : new NonfairSync();
}
```

##### **第二步：FairSync.lock()**

执行了方法 acquire(1)，acquire 为 AQS 中的 final 方法，用于竞争锁

```java
final void lock() {
	acquire(1);
}
```

##### **第三步：AQS.acquire(1)**

线程进入 AQS 中的 acquire 方法，arg=1。

这个方法逻辑：**先尝试抢占锁，抢占成功，直接返回；抢占失败，将线程封装成 Node 节点追加到 AQS 队列中并使线程阻塞等待。**

1. 首先会执行 `tryAcquire(1) `尝试抢占锁，成功返回 true，失败返回 false。抢占成功了，就不会执行下面的代码了
2. 抢占锁失败后，执行 `addWaiter(Node.EXCLUSIVE) ` 将 x 线程封装成 Node 节点追加到 AQS 队列。
3. 然后调用 `acquireQueued` 将线程阻塞。线程阻塞后，接下来就只需等待其他线程唤醒它，线程被唤醒后会重新竞争锁的使用。

```java
public final void acquire(int arg) {
	if (!tryAcquire(arg) && acquireQueued(addWaiter(Node.EXCLUSIVE), arg)) {
    selfInterrupt();
  }
}
```

##### **第四步：FairSync.tryAcquire(1)**

尝试获取锁：若获取锁成功，返回 true；获取锁失败，返回 false。

这个方法逻辑：**获取当前的锁状态，如果为无锁状态，当前线程会执行 CAS 操作尝试获取锁；若当前线程是重入获取锁，只需增加锁的重入次数即可。**

```java
// 尝试以独占模式获取锁
// 若锁是未锁定状态 state=0，CAS修改state=1，修改成功说明当前线程获取锁成功，设置当前线程为锁持有者，然后返回true
protected final boolean tryAcquire(int acquires) {
        final Thread current = Thread.currentThread();
        int c = getState();//状态：0未锁定，大于0已被其他线程独占。
        if (c == 0) {//未锁定，可以获取锁
            if (!hasQueuedPredecessors() && compareAndSetState(0, acquires)) {//CAS设置state为1
                setExclusiveOwnerThread(current);//设置当前线程为独占资源持有者
                return true;
            }
        }
        //如果当前线程已经是为锁持有者，设置重入次数，state + 1
        else if (current == getExclusiveOwnerThread()) {
            int nextc = c + acquires;//设置重入次数+1
            //重入次数，超过int最大值，溢出。
            if (nextc < 0)
                throw new Error("Maximum lock count exceeded");
            setState(nextc);//设置重入次数
            return true;
        }
        return false;
    }
```

##### **第五步：AQS.addWaiter(Node.EXCLUSIVE)**

线程抢占锁失败后，执行 `addWaiter(Node.EXCLUSIVE)` 将线程封装成 Node 节点追加到 AQS 队列。`addWaiter(Node mode)` 的 mode 表示节点的类型，Node.EXCLUSIVE 表示是独占排他锁，也就是说重入锁是独占锁，用到了 AQS 的独占模式。

Node定义了两种节点类型：

- 共享模式：`Node.SHARED`。共享锁，可以被多个线程同时持有，如读写锁的读锁。
- 独占模式：`Node.EXCLUSIVE`。独占很好理解，是自己独占资源，独占排他锁同时只能由一个线程持有。

```java
static final Node SHARED = new Node();//共享模式
static final Node EXCLUSIVE = null;//独占模式
```

相应的 AQS 支持两种模式：支持独占模式和共享模式。

```java
		/*
     * 模式有两种：共享模式和独占模式
     */
    private Node addWaiter(Node mode) {
				//当前线程封装为Node准备排队获取锁
        Node node = new Node(Thread.currentThread(), mode);
				//先尝试快速插入同步队列。如果失败，再使用完整的排队策略。
        Node pred = tail;
        if (pred != null) {//如果双向链表不为空链表（有节点），追加节点到尾部
            node.prev = pred;
            if (compareAndSetTail(pred, node)) {
                pred.next = node;
                return node;
            }
        }
        enq(node);//链表为空，将节点追加到同步队列队尾
        return node;
    }

    //通过自旋插入节点到同步队列AQS中，如果队列为空时，需先初始化队列。
    private Node enq(final Node node) {
        for (; ; ) {//自旋，至少会有两次循环。
            Node t = tail;
            if (t == null) { //队列为空，先初始化队列
                if (compareAndSetHead(new Node()))//CAS插入节点
                    tail = head;
            } else {//插入节点，追加节点到尾部
                node.prev = t;
                if (compareAndSetTail(t, node)) {//CAS插入节点
                    t.next = node;
                    return t;
                }
            }
        }
    }
```

##### **第六步：AQS.acquireQueued(newNode,1)**

这个方法的主要作用就是将线程阻塞。

1.  若同步队列中，若当前节点为队列第一个线程，则有资格竞争锁，再次尝试获得锁。
   - 尝试获得锁成功，移除链表head节点，并将当前线程节点设置为head节点。
   - 尝试获得锁失败，判断是否需要阻塞当前线程。
2. 若发生异常，取消当前线程获得锁的资格。

```java
		/**
     * 等待队列中的线程以独占的模式获取锁
     *
     * @param node 新加入等待队列线程节点
     * @param arg  获取参数
     * @return {@code true} 在等待中是否被中断
     */
    final boolean acquireQueued(final Node node, int arg) {
        boolean failed = true;//获取锁是否失败，一般是发生异常
        try {
            boolean interrupted = false;//是否中断
            for (; ; ) {//无限循环，线程获得锁或者线程被阻塞
                final Node p = node.predecessor();//获取此节点的前一个节点
                //若此节点的前个节点为头节点，说明当前线程可以获取锁，阻塞前尝试获取锁，若获取锁成功，将当前线程从同步队列中删除。
                if (p == head && tryAcquire(arg)) {//获取锁成功
                  /**
                   * 将当前线程从同步队列中删除。
                   * 将当前节点置为空节点，节点的prev，next和thread都为null。
                   * 将等待列表头节点指向当前节点
                   */
                    setHead(node);
                    p.next = null; // help GC
                    failed = false;
                    return interrupted;
                }
                if (shouldParkAfterFailedAcquire(p, node) &&
                        parkAndCheckInterrupt())
                    interrupted = true;//当前线程被中断
            }
        } finally {
						//如果出现异常，取消线程获取锁请求
            if (failed)
                cancelAcquire(node);
        }
    }

    private void setHead(Node node) {
        head = node;
        node.thread = null;
        node.prev = null;
    }
```

**AQS.shouldParkAfterFailedAcquire**

这个方法的主要作用是：线程竞争锁失败以后，通过Node的前驱节点的waitStatus状态来判断， 线程是否需要被阻塞。

1. 如果前驱节点状态为 SIGNAL，当前线程可以被放心的阻塞，返回 true
2. 若前驱节点状态为 CANCELLED，向前扫描链表把 CANCELLED 状态的节点从同步队列中移除，返回 false
3. 若前驱节点状态为默认状态或 PROPAGATE，修改前驱节点的状态为 SIGNAL，返回 false
4. 若返回 false，会退回到 acquireQueued 方法，重新执行自旋操作。自旋会重复执行 acquireQueued 和 shouldParkAfterFailedAcquire，会有两个结果：
   1. 线程尝试获得锁成功或者线程异常，退出 acquireQueued，直接返回
   2. 执行 shouldParkAfterFailedAcquire 成功，当前线程可以被阻塞。
5. 若返回 true，调用 parkAndCheckInterrupt 阻塞当前线程

Node 有 5 种状态，分别是：

- 0：默认状态
- 1：CANCELLED，取消/结束状态。表明线程已取消争抢锁。线程等待超时或者被中断，节点的 waitStatus 为 CANCELLED，线程取消获取锁请求。需要从同步队列中删除该节点
- -1：SIGNAL，通知。状态为 SIGNAL 节点中的线程释放锁时，就会通知后续节点的线程
- -2：CONDITION，条件等待。表明节点当前线程在 condition 队列中
- -3：PROPAGATE，传播。在一个节点成为头节点之前，是不会跃迁为 PROPAGATE 状态的。用于将唤醒后继线程传递下去，这个状态的引入是为了完善和增强共享锁的唤醒机制。

```java
		/**
     * 是否需要阻塞当前线程，根据前驱节点中的waitStatus来判断是否需要阻塞当前线程。如果线
     * 程需要被阻塞，返回true，这是自旋中的主要的信号量。
     *
     * @return {@code true} 如果线程需要被阻塞，返回true。
     */
    private static boolean shouldParkAfterFailedAcquire(Node pred, Node
            node) {
        int ws = pred.waitStatus;//上一个节点的waitStatus的状态
        if (ws == Node.SIGNAL)
				//前驱节点为SIGNAL状态，在释放锁的时候会唤醒后继节点， 当前节点可以阻塞自己。
        return true;
        if (ws > 0) {
          /**
           * 向前扫描链表把 CANCELLED 状态的节点从同步队列中移除。
           * 前驱节点状态为取消CANCELLED（1）时,向前遍历，更新当前节点的前驱节点为第一个
           * 非取消状态节点。
           * 之后，
           * （1）当前线程会再次返回方法acquireQueued，再次循环，尝试获取锁；
           * （2）再次执行shouldParkAfterFailedAcquire判断是否需要阻塞。
           */
            do {
                node.prev = pred = pred.prev;
            } while (pred.waitStatus > 0);
            pred.next = node;
        } else {
           /* 前驱节点状态 <= 0,此时还未判断的状态有 
            *	 默认状态(0)/CONDITION(-2)/PROPAGATE(-3)。
            *  此时，不可能是CONDITION(-2)，所以只能是默认状态(0)/PROPAGATE(-3)。
            *  CAS设置前驱节点的等待状态waitStatus为SIGNAL状态。
            *  此次，当前线程先暂时不阻塞。
            *  之后，
            * （1）当前线程会再次返回方法acquireQueued，再次循环，尝试获取锁；
            * （2）再次执行shouldParkAfterFailedAcquire判断是否需要阻塞。
            * （3）前驱节点为SIGNAL状态，可以被阻塞。
            */
            compareAndSetWaitStatus(pred, ws, Node.SIGNAL);
        }
        return false;
    }
```

**AQS.parkAndCheckInterrupt**

将当前线程阻塞挂起

`LockSupport.park(this)` 会阻塞当前线程，会使当前线程（如 Thread B）处于等待状态，不再往下执行。

```java
		/**
     * 将当前线程阻塞，并且在被唤醒时检查是否被中断
     *
     * @return {@code true} 如果被中断，返回true
     */
    private final boolean parkAndCheckInterrupt() {
				//阻塞当前线程
        LockSupport.park(this);
				//检测当前线程是否已被中断（若被中断，并清除中断标志），中断返回 true，否则返回
        false。
        return Thread.interrupted();
    }

		public final void acquire(int arg) {
        if (!tryAcquire(arg) && acquireQueued(addWaiter(Node.EXCLUSIVE), arg))
            selfInterrupt();
    }

    static void selfInterrupt() {
        Thread.currentThread().interrupt();
    }
```

**LockSupport 类**

LockSupport 类是 Java1.6 引入的一个类，所有的方法都是静态方法。它提供了基本的线程同步原语，提供了可以使线程阻塞和唤醒的方法。LockSupport 实际上是调用了 Unsafe 类里的函数，调用了 Unsafe 的两个函数。

```java
//取消阻塞（唤醒）线程
public native void unpark(Object thread);

/** 
* 阻塞（挂起）线程。当前线程被阻塞后，当前线程就会被挂起，直到其他线程unpark此线程。
* isAbsolute是否为绝对时间，true绝对时间，false相对时间。
* park(false,0)：阻塞线程，直至被唤醒。
* park(true,time)：暂停当前线程，增加了相对时间的限制，如
* park(true,time)：暂停当前线程，增加了绝对时间的限制，如2020-12-01 21:00:00的long值
*/
public native void park(boolean isAbsolute, long time);
```

### 3.6 锁的释放

![image-20240124210706689](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401242107704.png)

##### 第一步：ReentrantLock.unlock

释放锁时，需调用 ReentrantLock 的 unlock 方法。这个方法内部，会调用 sync.release(1)，release 方法为 AQS 类的 final 方法。

```java
public void unlock() {
	sync.release(1);
}
```

##### 第二步：AQS.release(1)

首先执行方法 tryRelease(1)，tryRelease 方法为 ReentrantLock 中 Sync 类的 final 方法，用于释放锁。

```java
public final boolean release(int arg) {
        if (tryRelease(arg)) {//释放锁。若释放后锁状态为无锁状态，需唤醒后继线程
            Node h = head;//同步队列头节点
            if (h != null && h.waitStatus != 0)//若head不为null,说明链表中有节点。其状态不为0，唤醒后继线程。
            unparkSuccessor(h);
            return true;
        }
        return false;
    }
```

##### 第三步：Sync.tryRelease(1)

1. 判断当前线程是否为锁持有者，若不是持有者，不能释放锁，直接抛出异常。
2. 若当前线程是锁的持有者，将重入次数减 1，并判断当前线程是否完全释放了锁。
   - 若重入次数为 0，则当前新线程完全释放了锁，将锁拥有线程设置为 null，并将锁状态置为无锁状态(state=0)，返回 true。
   - 若重入次数 > 0，则当前新线程仍然持有锁，设置重入次数 = 重入次数 - 1，返回 false。
3. 返回 true 说明当前锁被释放，需要唤醒同步队列中的一个线程，执行 unparkSuccessor 唤醒同步队列中节点线程。

```java
		/**
     * 释放锁返回值：true释放成功；false释放失败
     */
    protected final boolean tryRelease(int releases) {
        int c = getState() - releases;//重入次数减去1
				//如果当前线程不是锁的独占线程，抛出异常
        if (Thread.currentThread() != getExclusiveOwnerThread())
            throw new IllegalMonitorStateException();
        boolean free = false;
        if (c == 0) {
						//如果线程将锁完全释放，将锁初始化未无锁状态
            free = true;
            setExclusiveOwnerThread(null);
        }
        setState(c);//修改锁重入次数
        return free;
    }
```

##### 第四步：AQS.unparkSuccessor

```java
		//唤醒后继线程
    private void unparkSuccessor(Node node) {
        /*
         * 头节点waitStatus状态 SIGNAL或PROPAGATE
         */
        int ws = node.waitStatus;
        if (ws < 0)
            compareAndSetWaitStatus(node, ws, 0);
        //查找需要唤醒的节点:正常情况下，它应该是下一个节点。但是如果下一个节点为null或者它的waitStatus为取消时，则需要从同步队列tail节点向前遍历，查找到队列中首个不是取消状态的节点。
        Node s = node.next;
        if (s == null || s.waitStatus > 0) {
            s = null;
            for (Node t = tail; t != null && t != node; t = t.prev)
                if (t.waitStatus <= 0)
                    s = t;
        }
        //将下一个节点中的线程unpark唤醒
        if (s != null){
            LockSupport.unpark(s.thread);
        }
    }
```

##### 第五步：LockSupport.unpark(s.thread)

会唤醒挂起的线程，使被阻塞的线程继续执行。

### 3.7 公平锁和非公平锁的区别

**公平锁/非公平锁：**按照多个线程竞争同一锁时需不需要排队，能不能插队

**获取锁的两处差异：**

- **lock 方法差异：**

  - FairSync.lock：公平锁获取锁

  ```java
  final void lock() {
  	acquire(1);
  }
  ```

  - NoFairSync.lock：非公平锁获取锁，lock 方法中新线程会先通过 CAS 操作 compareAndSetState(0, 1)，尝试获得锁

  ```java
  final void lock() {
    if (compareAndSetState(0, 1))//新线程，第一次插队
    	setExclusiveOwnerThread(Thread.currentThread());
    else
    	acquire(1);
  }
  ```

  - lock 方法中的 acquire 为 AQS 的 final 方法，公平锁和非公平锁，执行代码没有差别。差别之处在于公平锁和非公平锁对 tryAcquire 方法的实现。

  ```java
  public final void acquire(int arg) {
    if (!tryAcquire(arg) && acquireQueued(addWaiter(Node.EXCLUSIVE), arg))
      selfInterrupt();
  }
  ```

- **tryAcquire差异：**

  - `FairSync.tryAcquire`：公平锁获取锁，若锁为无锁状态时，本着公平原则，新线程在尝试获得锁前，需先判断 AQS 同步队列中是否有线程在等待，若有线程在等待，当前线程只能进入同步队列等待。若 AQS 同步无线程等待，则通过 CAS 抢占锁。而非公平锁，不管 AQS 是否有线程在等待，则都会先通过 CAS 抢占锁。

  ```java
  		protected final boolean tryAcquire(int acquires) {
          final Thread current = Thread.currentThread();
          int c = getState();
          if (c == 0) {
              //公平锁，先判断同步队列中是否有线程在等待
              if (!hasQueuedPredecessors() && compareAndSetState(0, acquires)) {
                  setExclusiveOwnerThread(current);
                  return true;
              }
          } else if (current == getExclusiveOwnerThread()) {
              int nextc = c + acquires;
              if (nextc < 0)
                  throw new Error("Maximum lock count exceeded");
              setState(nextc);
              return true;
          }
          return false;
      }
  ```

  - NoFairSync.tryAcquire 和 NoFairSync.nonfairTryAcquire：

  ```java
   		protected final boolean tryAcquire(int acquires) {
          return nonfairTryAcquire(acquires);
      }
  
      final boolean nonfairTryAcquire(int acquires) {
          final Thread current = Thread.currentThread();
          int c = getState();
          if (c == 0) {
              //非公平锁，入队前，二次插队
              if (compareAndSetState(0, acquires)) {
                  setExclusiveOwnerThread(current);
                  return true;
              }
          } else if (current == getExclusiveOwnerThread()) {
              int nextc = c + acquires;
              if (nextc < 0)
                  throw new Error("Maximum lock count exceeded");
              setState(nextc);
              return true;
          }
          return false;
      }
  ```

  公平锁和非公平锁获取锁时，其他方法都是调用 AQS 的 final 方法，所以没有不同之处。

### 3.8 读写锁 ReentrantReadWriteLock

**读写锁：维护着一对锁(读锁和写锁)，**通过分离读锁和写锁，使得并发能力比一般的互斥锁有较大提升。**同一时间，可以允许多个读线程同时访问，但在写线程访问时，所有读写线程都会阻塞。**

所以说，读锁是共享的，写锁是排他的。

**主要特性：**

- 支持公平和非公平锁

- 支持重入

- 锁降级：写锁可以降级为读锁，但是读锁不能升级为写锁

```java
		/**
     * 内部类 读锁
     */
    private final ReentrantReadWriteLock.ReadLock readerLock;
    /**
     * 内部类 写锁
     */
    private final ReentrantReadWriteLock.WriteLock writerLock;
    final Sync sync;

    /**
     * 使用默认（非公平）的排序属性创建一个新的 ReentrantReadWriteLock
     */
    public ReentrantReadWriteLock() {
        this(false);
    }

    /**
     * 使用给定的公平策略创建一个新的 ReentrantReadWriteLock
     */
    public ReentrantReadWriteLock(boolean fair) {
        sync = fair ? new FairSync() : new NonfairSync();
        readerLock = new ReadLock(this);
        writerLock = new WriteLock(this);
    }

    /**
     * 返回用于写入操作的锁
     */
    public ReentrantReadWriteLock.WriteLock writeLock() {
        return writerLock;
    }

    /**
     * 返回用于读取操作的锁
     */
    public ReentrantReadWriteLock.ReadLock readLock() {
        return readerLock;
    }

    abstract static class Sync extends AbstractQueuedSynchronizer {
        //省略其余源代码
    }

    public static class WriteLock implements Lock, java.io.Serializable {
        //省略其余源代码
    }

    public static class ReadLock implements Lock, java.io.Serializable {
        //省略其余源代码
    }
```

ReentrantReadWriteLock 与 ReentrantLock一样，其锁主体依然是 Sync，它的读锁、写锁都是依靠 Sync 来实现的。所以 ReentrantReadWriteLock 实际上只有一个锁，只是在获取读取锁和写入锁的方式上不一样而已，它的读写锁其实就是两个类：ReadLock、writeLock，这两个类都是lock的实现。

### 3.9 锁优化

**如何优化锁？**

- 减少锁的持有时间

<img src="https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401242152588.png" alt="image-20240124215255556" style="zoom: 33%;" />

- 减少锁粒度
  - 将大对象拆分为小对象，增加并行度，降低锁的竞争
  - 例如：早期ConcurrentHashMap的分段锁

- 锁分离
  - 根据功能场景进行锁分离
  - 例如：读多写少的场景，使用读写锁可以提高性能

- 锁消除：锁消除是编译器自动的一种优化方式

- 锁粗化

  - 增加锁的范围，降低加解锁的频次

  <img src="https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401242153435.png" alt="image-20240124215325409" style="zoom:33%;" />

### 3.10 锁升级

> 多线程锁的升级原理是什么？

在 Java中，synchronized 共有 4 种状态，级别从低到高依次为：无状态锁，偏向锁，轻量级锁和重量级锁状态，这几个状态会随着竞争情况逐渐升级，**锁可以升级但不能降级**。

- **偏向锁**：是指当一段同步代码一直被同一个线程所访问时，即**不存在多个线程的竞争时**，那么该线程在后续访问时便会自动获得锁，从而降低获取锁带来的消耗，即提高性能。
- **轻量级锁**：（自旋锁）是指**当锁是偏向锁的时候，却被另外的线程所访问**，此时偏向锁就会升级为轻量级锁，其他线程会通过自旋的形式尝试获取锁，线程同样不会阻塞。长时间的自旋操作是非常消耗资源的，一个线程持有锁，其他线程就只能在原地空耗 CPU，执行不了任何有效的任务，这种现象叫做忙等（busy-waiting）
- **重量级锁**：此忙等是有限度的。如果锁竞争情况严重，某个达到最大自旋次数的线程，会将轻量级锁升级为重量级锁。当后续线程尝试获取锁时，发现被占用的锁是重量级锁，则直接将自己挂起（而不是忙等），等待将来被唤醒，有个计数器记录自旋次数，默认允许循环 10 次，可以通过虚拟机参数更改

## 4. 线程协作工具类

**线程协作工具类，**控制线程协作的工具类，帮助程序员让线程之间的协作变得更加简单

| 类             | 作用                                                         | 说明                                                      |
| -------------- | ------------------------------------------------------------ | --------------------------------------------------------- |
| Semaphore      | 信号量，通过控制**许可**的数量来保证线程之间的配合           | **场景：限流**，只有拿到**许可**才可运行                  |
| CyclicBarrier  | 线程会等待，直到线程到了事先规定的数目，然后触发执行条件进行下一步动作 | **场景：并行计算**（线程之间相互等待处理结果就绪的场景）  |
| CountDownLatch | 线程处于等待状态，指导计数减为0，等待线程才继续执行          | **场景：购物拼团**                                        |
| Condition      | 控制线程的**等待 / 唤醒**                                    | **场景：线程协作 **`Object.wait()` 和` notify()` 的升级版 |

### 4.1 **CountDownLatch 计数门闩：**

- 倒数结束之前，一直处于等待状态，直到数到0，等待线程才继续工作。
- 场景：购物拼团、分布式锁
- 方法：
  - new CountDownLatch(int count)
  - await()：调用此方法的线程会阻塞，支持多个线程调用，当计数为0，则唤醒线程
  - countdown()：其他线程调用此方法，计数减1

### 4.2 **Semaphore 信号量：**

- 限制和管理数量有限的资源的使用
- 场景：Hystrix、Sentinel限流
- 方法：
  - new Semaphore ((int permits) 可以创建公平的非公平的策略
  - acquire()：获取许可证，获取许可证，要么获取成功，信号量减1，要么阻塞等待唤醒
  - release()：释放许可证，信号量加1，然后唤醒等待的线程

### 4.3 **CyclicBarrier 循环栅栏：**

- 线程会等待，直到线程到了事先规定的数目，然后触发执行条件进行下一步动作
- 场景：并行计算
- 方法：
  - new CyclicBarrier(int parties, Runnable barrierAction)参数 1 集结线程数，参数 2 凑齐之后执行的任务
  - await()：阻塞当前线程，待凑齐线程数量之后继续执行

**CyclicBarrier 和 CountDownLatch 区别：**

- 作用不同：CyclicBarrier 要等固定数量的线程都到达了栅栏位置才能继续执行，而 CountDownLatch 只需要等待数字到 0，也就是说，CountDownLatch 用于事件，而 CyclicBarrier 用于线程
- 可重用性不同：CountDownLatch 在倒数到 0 并触发门闩打开后，就不能再次使用，而 CyclicBarrier 可以重复使用。

### 4.4 **Condition接口：**

- 控制线程的 “等待” 和 “唤醒” 
- 方法：
  - await()：阻塞线程
  - signal()：唤醒被阻塞的线程
  - signalAll() 会唤起所有正在等待的线程。

- 注意：
  - 调用 await() 方法时必须持有锁，否则会抛出异常
  - Condition 和 Object await / notify 方法用法一样，两者 await 方法都会释放锁

## 5. 并发容器

### 5.1 **什么是并发容器？**

**针对多线程并发访问来进行设计的集合，称为并发容器**

- JDK 1.5 之前，JDK 提供了线程安全的集合都是**同步容器**，线程安全，只能串行执行，性能很差。

- JDK 1.5 之后，JUC 并发包提供了很多并发容器，优化性能，替代同步容器。

<img src="https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401242206303.png" alt="image-20240124220622267" style="zoom:50%;" />

### 5.2 **什么是同步容器？线程安全的集合与非安全集合有什么关系？**

**每次只有一个线程可以访问的集合（同步），称为线程安全的集合，也叫同步容器**

- **Java 集合主要为4类：List、Map、Set、Queue**，线程不安全的：ArrayList、HashMap..

- JDK 早期线程安全的集合 Vector、Stack、HashTable。

- JDK 1.2 中，还为 Collections 增加内部 Synchronized 类创建出线程安全的集合，实现原理 synchronized

### 5.3 **常见并发容器特点总结**

- **List容器**

  - **Vector**：synchronized 实现的同步容器，性能差，适合于对**数据有强一致性**要求的场景

  - **CopyOnWriteArrayList**：底层数组实现，使用**复制副本**进行有锁写操作（数据不一致问题），适合读多写少，允许短暂的数据不一致的场景

- **Map容器**

  - **Hashtable**：synchronized 实现的同步容器，性能差，适合于对**数据有强一致性**要求的场景

  - **ConcurrentHashMap**：**底层数组 + 链表 + 红黑树（JDK1.8）实现**，对 table 数组 entry 加锁（synchronized ），存在一致性问题。适合存储**数据量小**，**读多写少**，允许短暂的数据不一致的场景

  - **ConcurrentSkipListMap**：底层跳表实现，使用 CAS 实现无锁读写操作。适合与存储**数据量大**，**读写频繁**，允许短暂的数据不一致的场景

- **Set 容器**

  - **CopyOnWriteArraySet**：底层数组实现的无序 Set

  - **ConcurrentSkipListSet**：底层基于跳表实现的有序 Set

### 5.4 **并发容器-ConcurrentHashMap**

**JDK 1.7 结构图**

- Java 7 中的 ConcurrentHashMap 最外层是多个 segment，每个 segment 的底层数据结构与 HashMap 类似，仍然是数组和链表组成。
- 每个 segment 独立上 ReentrantLock 锁，每个 segment 之间互不影响，提高并发效率。
- 默认有 16 个 segment，最多可以同时支持 16 个线程并发写（操作分别分布在不同的 Segment 上）。这个默认值可以在初始化时设置，但一旦初始化以后，就不可以再扩容了。

![image-20240124221126689](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401242211719.png)

**JDK 1.8 结构图**

- ConcurrentHashMap 是一个存储 key / value 对的容器，并且是线程安全的。

  - 改进一： 取消 segments 字段，直接采用 transient volatile HashEntry<K,V>[] table 保存数据，采用 table 数组元素作为锁，从而实现了对每一行数据进行加锁，进一步减少并发冲突的概率。

  - 改进二： 将原先 table 数组＋单向链表的数据结构，变更为 table 数组＋单向链表＋红黑树的结构。查询更快

- 底层采用数组 + 链表 + 红黑树数据结构

- 存入 key 值，使用 hashCode 映射数组索引

- 集合会自动扩容：加载因子 0.75f

- 链表长度超过 8 时，链表转换为红黑树

 ![image-20240124221409410](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401242214440.png)

### 5.5 **并发容器-CopyOnWriteArrayList**

**CopyOnWriteArrayList **底层数组实现，使用**复制副本**进行有锁写操作，适合读多写少，允许短暂的数据不一致的场景。

**CopyOnWrite 思想：平时查询时，不加锁，更新时从原来的数据 copy 副本，然后修改副本，最后把原数据替换为副本。修改时，不阻塞读操作，读到的是旧数据。**

**优缺点**

- **优点：**对于读多写少的场景，CopyOnWrite 这种无锁操作性能更好，相比于其它同步容器

- **缺点：**
  - 数据一致性问题
  - 内存占用问题及导致更多的 GC 次数

### 5.6 并发队列

#### **5.6.1 为什么要用队列？**

队列是线程协作的利器，通过队列可以很容易的实现数据共享，并且解决上下游处理速度不匹配的问题，典型的**生产者消费者模式**

#### 5.6.2 **什么是阻塞队列？**

- **带阻塞能力的队列**，阻塞队列一端是给生产者 put 数据使用，另一端给消费者 take 数据使用
- 阻塞队列是线程安全的，生产者和消费者都可以是多线程
- take 方法：获取并移除头元素，**如果队列无数据，则阻塞**
- put 方法：插入元素，**如果队列已满，则阻塞**

- **阻塞队列又分为有界和无界队列，**无界队列不是无限队列，最大值 `Integer.MAX_VALUE`

<img src="https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401242219536.png" alt="image-20240124221930497" style="zoom: 33%;" />

#### 5.6.3 **常用阻塞队列：**

1. **ArrayBlockingQueue 基于数组实现的有界阻塞队列**
2. LinkedBlockingQueue 基于**链表**实现的**无界**阻塞队列
3. SynchronousQueue 不存储元素的阻塞队列
4. PriorityBlockingQueue **支持按优先级**排序的**无界**阻塞队列
5. DelayQueue 优先级队列实现的**双向无界**阻塞队列
6. LinkedTransferQueue 基于**链表**实现的**无界**阻塞队列
7. LinkedBlockingDeque 基于**链表**实现的**双向无界**阻塞队列

## 6. 线程池

### 6.1 **线程池简介**

线程池（ThreadPool）是一种基于**池化思想管理线程**的工具。线程池维护多个线程，等待监督和管理分配可并发执行的任务。看过new Thread源码后我们发现，频繁创建线程销毁线程的开销很大，会降低系统整体性能。

**优点**

- **降低资源消耗：**通过线程池复用线程，降低创建线程和释放线程的损耗

- **提高响应速度：**任务到达时，无需等待即刻运行

- **提高线程的可管理性：**使用线程池可以进行统一的线程分配、调优和监控

- **提供可扩展性：**线程池具备可扩展性，研发人员可以向其中增加各种功能，比如：延时、定时、监控等

**使用场景**

- **连接池：**预先申请数据库连接，提升申请连接的速度，降低系统的开销（跨网络应用都需要线程池）

- **线程隔离：**服务器接收大量请求，使用线程池来进行隔离处理

开发中，如需创建 5 个以上线程，就可以考虑用线程池

### 6.2 线程池参数

| 参数名        | 类型                     | 含义                         |
| ------------- | ------------------------ | ---------------------------- |
| corePoolSize  | int                      | 核心线程数                   |
| maxPoolSize   | int                      | 最大线程数                   |
| keepAliveTime | long                     | 保持存活时间                 |
| workQueue     | BlockingQueue            | 任务存储队列                 |
| threadFactory | ThreadFactory            | 线程池创建新线程的线程工厂类 |
| Handler       | RejectedExecutionHandler | 线程无法接收任务时的拒绝策略 |

**参数详解：**

- corePoolSize：核心线程数，可以理解为空闲线程数，即便线程空闲（Idle），也不会回收

- maxPoolSize：最大线程数，线程池可以容纳线程的上限

- keepAliveTime：线程保持存活的时间，超过核心线程数的线程存活空闲时间超过 keepAliveTime 后就会被回收

- workQueue：工作队列，直接交换队列 SynchronousQueue，无界队列 LinkedBlockingQueue，有界队列 ArrayBlockingQueue

- threadFactory：线程工厂，用来创建线程的工厂，线程都是出自于此工厂

- Handler：线程无法接收任务时的拒绝策略

### 6.3 线程池原理

![image-20240125215158950](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401252151984.png)

1. 提交任务，如果线程数小于 corePoolSize 即使其他线程处于空闲状态，也会创建一个新线程来运行任务
2. 如果线程数大于 corePoolSize，但少于 maxPoolSize，将任务放入工作队列
3. 如果队列已满，并且线程数小于 maxPoolSize，则创建一个新线程来运行任务。
4. 如果队列已满，并且线程数大于或等于 maxPoolSize，则拒绝该任务。

**增减线程的特点**

- **固定大小线程池**：通过设置 `corePoolSize` 和 `maxPoolSize` 相同，可以创建固定大小的线程池。
- **动态线程池**：线程池希望保持较少的线程数，并且只有在负载变得很大时才会增加。可以设置 `maxPoolSize` 比 `corePoolSize ` 大一些
- 通过设置 `maxPoolSize` 为很高的值，例如 Integer.MAX_VALUE，可以允许线程池容纳任意数量的并发任务。
- **只有在队列填满时才创建多于 `corePoolSize` 的线程**，所以如果用的是无界队列（LinkedBlockingQueue），则线程数就一直不会超过 corePoolSize

### 6.4 自动创建线程

**四种：**

- **newFixedThreadPool**：固定数量线程池，无界任务阻塞队列

- **newSingleThreadExecutor**：一个线程的线程池，无界任务阻塞队列

- **newCachedThreadPool**：可缓存线程的无界线程池，可以自动回收多余线程

- **newScheduledThreadPool**：定时任务线程池，支持周期性任务

手动创建更好，因为这样可以更明确线程池的运行规则，避免资源耗尽的风险。

### 6.5 手动创建线程池

有些企业开发规范中会禁止使用快捷方式创建线程池，要求使用标准构造器 `ThreadPoolExecutor` 创建，根据不同的业务场景，自己设置线程池的参数、线程名、任务被拒绝后如何记录日志等

```java
// 使用标准构造器，构造一个普通的线程池
public ThreadPoolExecutor(
  int corePoolSize, // 核心线程数，即使线程空闲（Idle），也不会回收；
  int maximumPoolSize, // 线程数的上限；
  long keepAliveTime, TimeUnit unit, // 线程最大空闲（Idle）时长
  BlockingQueue workQueue, // 任务的排队队列
  ThreadFactory threadFactory, // 新线程的产生方式
  RejectedExecutionHandler handler) // 拒绝策略
```

**如何设置线程池大小？**

- **CPU 密集型**：线程数量不能太多，可以设置为与相当于 CPU 核数

- **IO 密集型**：IO 密集型 CPU 使用率不高，可以设置的线程数量多一些，可以设置为 CPU 核心数的2倍

**拒绝策略：**

- **拒绝时机：**
  1. 最大线程和工作队列有限且已经饱和 
  2. Executor 关闭时

- 抛异常策略：**AbortPolicy，**说明任务没有提交成功

- 不做处理策略：**DiscardPolicy，**默默丢弃任务，不做处理

- 丢弃老任务策略：**DiscardOldestPolicy，**将队列中存在最久的任务给丢弃

- 自产自销策略：**CallerRunsPolicy，**那个线程提交任务就由那个线程负责运行

## 7. ThreadLocal

> 说一下 ThreadLocalMap 的 key 为什么是弱类型？使用完 ThreadLocal 为什么必须要 remove？

### 7.1 什么是 ThreadLocal？

**ThreadLocal 是线程本地变量类，**在多线程并执行过程中，将变量存储在 ThreadLocal 中，每个线程中都有独立的变量，因此不会出现线程安全问题。

**举例：**

- **解决线程安全问题：**每个线程绑定一个数据库连接，避免多个线程访问同一个数据库连接：**SqlSession**

```java
//伪代码
private static final ThreadLocal localSqlSession = new ThreadLocal();

public void startManagedSession() {
	this.localSqlSession.set(openSession());
}
@Override
public Connection getConnection() {
  final SqlSession sqlSession = localSqlSession.get();
  if (sqlSession == null) {
    throw new SqlSessionException("Error: Cannot get connection. No managed session is started.");
  }
	return sqlSession.getConnection();
}
```

- **跨函数参数传递：**同一个线程，跨类，跨方法传递参数时可以使用 ThreadLocal，每个线程绑定一个 **Token / Session**

<img src="https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401252212011.png" alt="image-20240125221247982" style="zoom: 50%;" />

```java
//伪代码
public class SessionHolder{
  // 用户信息 线程本地变量
  private static final ThreadLocal<UserDTO> sessionUserLocal = new ThreadLocal<>("sessionUserLocal");
  // session 线程本地变量
  private static final ThreadLocal<HttpSession> sessionLocal = new ThreadLocal<>("sessionLocal");
  //...省略其他
  /**
  *保存 session 在线程本地变量中
  */
  public static void setSession(HttpSession session){
  	sessionLocal.set(session);
  }
  /**
  * 取得绑定在线程本地变量中的 session
  */
  public static HttpSession getSession() {
    HttpSession session = sessionLocal.get();
    Assert.notNull(session, "session 未设置");
    return session;
  }
  //...省略其他
}
```

### 7.2 ThreadLocal 底层原理

JDK 1.8 之前：ThreadLocal 是 Map 所有线程拥有同一个，Key 为 thread，Value 为具体值

JDK 1.8：ThreadLocal 依旧是 Map，但一个线程一个 ThreadLocalMap，key 为 ThreadLocal，Value 为具体值

**主要变化：**

1. ThreadLocalMap 的拥有者
2. Key

**JDK 1.8 中 Thread、ThreadLocal、ThreadLocalMap 的关系？**

- **Thread → ThreadLocalMap → Entry(ThreadLocalN, LocalValueN)\*n** 

![image-20240125221917402](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401252219429.png)

### 7.3 Entry 的 key 为什么需要使用弱引用？

Entry 用于保存 ThreadLocalMap 的 “Key-Value” 条目，但是 Entry 使用了对 Threadlocal 实例进行包装之后的弱引用（WeakReference）作为 Key，其代码如下：

```java
// Entry 继承了 WeakReference,并使用 WeakReference 对 Key 进行包装
static class Entry extends WeakReference<ThreadLocal<?>> {
  Object value; //值
  Entry(ThreadLocal<?> k, Object v) {
    super(k); //使用 WeakReference 对 Key 值进行包装
    value = v;
  }
}
```

**为什么 Entry 需要使用弱引用对 Key 进行包装，而不是直接使用 Threadlocal 实例作为 Key 呢？**比如如下代码:

```java
//伪代码
public void funcA() {
  //创建一个线程本地变量
  ThreadLocal local = new ThreadLocal();
  //设置值
  local.set(100);
  //获取值
  local.get();
  //函数末尾
}
```

当线程 n 执行 funcA 方法到其末尾时，线程 n 相关的 JVM 栈内存以及内部 ThreadLocalMap 成员的结构，大致如图所示。

![image-20240125222411483](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401252224513.png)

- **funcA() 方法入栈**

  - 新建 ThreadLocal 对象，local 局部变量指向它，强引用

  - local.set(100)，key 为弱引用指向 ThreadLocal

- **funcA() 方法出栈**

  - 栈帧被销毁，强引用没有了，但弱引用还存在

  - 如果此引用是强引用，则不能被 GC 回收对象

<img src="https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401252225754.png" alt="image-20240125222544627" style="zoom: 50%;" />

由于 ThreadLocalMap 中 Entry 的 Key 使用了弱引用，在下次 GC 发生时，就可以使那些没有被其他强引用指向、仅被 Entry 的 Key 所指向的 ThreadLocal 实例能被顺利回收。并且，在 Entry 的 Key 引用被回收之后，其 Entry 的 Key 值变为 null。后续当 ThreadLocal 的 get、 set 或 remove 被调用时，通过 expungeStaleEntry 方法， ThreadLocalMap 的内部代码会清除这些 Key 为 null 的 Entry，从而完成相应的内存释放。

**ThreadLocal 内存溢出的原因是什么？**

<img src="https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401252227492.png" alt="image-20240125222720455" style="zoom: 33%;" />

## 8. Future 和 FutureTask

### 8.1 什么是 Future？

**FutureTask 叫未来任务，可以将一个复杂的任务剔除出去，交给另一个线程来完。它是 Future 的实现类**

<img src="https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401252230234.png" alt="image-20240125223049201" style="zoom: 67%;" />

<img src="https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401252230488.png" alt="image-20240125223059457" style="zoom: 33%;" />

### 8.2 **Future 主要方法：**

- **get()：**方法返回结果取决于Callable任务执行的状态，任务有五种状态
  - 正常完成：get 立刻返回结果
  - 尚未完成：还没开始或进行中的状态，get将阻塞直到任务完成
  - 抛出异常：get 会抛出 ExecutionException
  - 被取消：get 会抛出 CancellationException
  - 超时：设置超时时间，时间到了还没结果，会抛出 TimeoutException
- **get( timeout , TimeUnit )：**设置任务完成时间，没到则抛异常
- **cancel()：**取消任务时，有三种情况
  - 如果这个任务还没开始，任务会被取消，返回 true
  - 如果任务已经完成或已取消，返回false
  - 如果任务已经开始，则方法不会直接取消任务，而会判断是否可以取消，如果可以才会发出中断信号
- **isDone() ：**判断是否执行完成
- **isCancelled()：**判断是否被取消

### 8.3 用线程池 submit 方法提交任务，返回值 Future 任务结果

- 用线程池提交任务，线程池会立即返回一个空的 Future 容器
- 当线程的任务执行完成，线程池会将该任务执行结果填入 Future 中
- 此时就可以从 Future 获取执行结果

```java
package com.hero.multithreading;

import java.util.Random;
import java.util.concurrent.*;

/**
 * 案例：演示一个Future的使用方法
 */
public class Demo22Future {
    public static void main(String[] args) {
        ExecutorService service = Executors.newFixedThreadPool(10);
        Future<Integer> future = service.submit(new CallableTask());
        try {
            //等待3秒后打印
            System.out.println(future.get());
        } catch (InterruptedException | ExecutionException e) {
            e.printStackTrace();
        }
        service.shutdown();
    }

    static class CallableTask implements Callable<Integer> {
        @Override
        public Integer call() throws Exception {
            Thread.sleep(3000);
            return new Random().nextInt();
        }
    }
}
```

### 8.4 用 FutureTask 来创建 Future

<img src="https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401252236399.png" alt="image-20240125223647373" style="zoom:67%;" />

- 用 FutureTask 包装任务，FutureTask 是 Future 和R unnable 接口的实现类

- 可以使用 new Thread().start() 或线程池执行 FutureTask

- 任务执行完成，可以从 FutureTask 中获取执行结果

```java
package future;

import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.FutureTask;

/**
 * 描述：演示FutureTask的用法
 */
public class Demo23FutureTask {
    public static void main(String[] args) {
        Task task = new Task();
        //FutureTask继承Future和Runnalbe接口
        FutureTask<Integer> integerFutureTask = new FutureTask<>(task);
        // new Thread(integerFutureTask).start();
        ExecutorService service = Executors.newCachedThreadPool();
        service.submit(integerFutureTask);
        try {
            System.out.println("task运行结果：" + integerFutureTask.get());
        } catch (InterruptedException e) {
            e.printStackTrace();
        } catch (ExecutionException e) {
            e.printStackTrace();
        }
    }
}

class Task implements Callable<Integer> {
    @Override
    public Integer call() throws Exception {
        System.out.println("子线程正在计算");
        Thread.sleep(3000);
        //模拟子线程处理业务逻辑
        int sum = 0;
        for (int i = 0; i < 100; i++) {
            sum += i;
        }
        return sum;
    }
}
```

