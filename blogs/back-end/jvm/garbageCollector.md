---
title: JVM 垃圾收集器
date: 2024-01-13
categories:
  - JVM
tags:
  - JVM
---

# JVM 垃圾收集器

##  1. GC 基本原理

### 1.1 什么是垃圾？

在内存中，没有被引用的对象就是垃圾。

<img src="https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401131245888.png" alt="image-20240113124537857" style="zoom:33%;" />

### 1.2 如何找到这个垃圾？

主要是两种：

- **引用计数法**
- **可达性分析法**

#### 1.2.1 引用计数法

当对象引用消失，对象就称为垃圾。通过引用计数，找到这个垃圾。

<img src="https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401131248038.png" alt="image-20240113124837023" style="zoom: 33%;" />

**堆内存中主要存在三种引用关系**：

- 单一引用
- 循环引用
- 无引用

<img src="https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401131249358.png" alt="image-20240113124934343" style="zoom: 33%;" />

由此可见，引用计数算法不能解决**循环引用问题**。为了解决这个问题，JVM使用了根可达分析算法。

#### 1.2.2 可达性分析法（根搜索法）

通过 GCRoots 作为对象起点向下搜索，当一个对象到 GCRoots 没有任何**引用链**时，**此对象是垃圾**。

- **引用链（ReferenceChain）**：GCRoots 搜索走过的路径
- **什么是 GCRoots ？**
  - 虚拟机栈中，栈帧本地变量表引用的对象
  - 方法区中，类静态属性引用的对象
  - 方法区中，常量引用对象
  - 本地方法栈中，JNI 引用的对象
  - 虚拟机内部的引用

<img src="https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401131252142.png" alt="image-20240113125228125" style="zoom:33%;" />

**垃圾对象死亡前至少经历两次标记**：

- **第一次标记**：可达性分析后，没有引用链对象会被第一次标记
- **第二次标记**：标记后的对象会经历筛选，如果筛选不通过，则会被第二次标记。第二次标记成功的对象将被回收
  - 筛选条件：此对象是否有必要执行`finalize()` 方法。在 `finalize()` 方法中没有重新与引用链建立关联关系的，将被进行第二次标记。

**对象引用**：

JDK 1.2 之后，Java 对象的引用进行了扩充：**强引用，软引用**，弱引用，虚引用

| 引用类型   | 被垃圾回收时间 | 用途               | 生存时间           |
| ---------- | -------------- | ------------------ | ------------------ |
| **强引用** | **从来不会**   | **对象的一般状态** | **JVM 停止时终止** |
| 软引用     | 内存不足时     | 对象缓存           | 内存不足时终止     |
| 弱引用     | 正常 GC        | 对象缓存           | GC 后终止          |
| 虚引用     | 正常 GC        | 类似事件回调机制   | GC 后终止          |
| **无引用** | **正常 GC**    | **对象的一般状态** | **GC 后终止**      |

- **强引用**

```java
Object obj = new Object();
```

- **软引用**
  - 非必须引用，内存溢出之前进行回收，如内存还不够，才会抛异常
  - 应用场景：软引用可用来实现内存敏感的**高速缓存**。

```java
Map<String, SoftReference<Bitmap>> fileCache = new HashMap<String, SoftReference<Bitmap>>
```

- 弱引用
  - 非必须引用，只要有 GC，就会被回收
  - 作用：监控对象是否已经被垃圾回收器标记为即将回收的垃圾，可以通过弱引用的 `isEnQueued()` 返回对象是否被垃圾回收器标记

```java
Object obj = new Object();
WeakReference<Object> wf = new WeakReference<Object>(obj);
obj = null;
//System.gc();
Object o = wf.get();//有时候会返回null
boolean enqueued = wf.isEnqueued();//返回是否被垃圾回收器标记为即将回收的垃圾
```

- 虚引用
  - 最弱的一种引用关系。垃圾回收时直接回收
  - 一个对象是否有虚引用的存在，完全不会对其生存时间构成影响，也无法通过虚引用来取得一个对象实例

```java
Object obj = new Object();
PhantomReference<Object> pf = new PhantomReference<Object>(obj, new ReferenceQueue<>());
obj=null;
Object o = pf.get();//永远返回null
boolean enqueued = pf.isEnqueued();//返回是否从内存中已经删除
```

### 1.3 如何清除垃圾？

**三种清除垃圾算法**：

- 标记 - 清除算法（Mark-Sweep）
- 标记 - 复制算法（Copying ）
- 标记 - 整理算法（Mark-Compact）

#### 1.3.1 标记-清除算法

- 分为**标记**和**清除**两个阶段：
  - 标记：标记出所有需要回收对象
  - 清除：统一回收掉所有对象
- **缺点**：
  - 执行效率不稳定
  - 空间碎片：会产生大量不连续内存碎片

<img src="https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401131332013.png" alt="image-20240113133243987" style="zoom:33%;" />

#### 1.3.2 标记-复制算法

现在商业虚拟机都是采用这种收集算法来回收**新生代**

- 内存分为两块，清除垃圾时，将存活对象复制到另一块
- S0 和 S1 区就是基于这个算法诞生的
- Eden : Survior = 8 : 2
- 不用担心 S 区不够，因为 Old 是担保人（分配担保机制）
- 优点：没有内存空间碎片化
- 缺点：存在空间浪费

<img src="https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401131336581.png" alt="image-20240113133609563" style="zoom:33%;" />

#### 1.3.3 标记-整理算法

**老年代没有人担保，不能用复制回收算法。**可以用**标记-整理**算法，标记过程仍然与“标记-清除”算法一样，然后让所有存活的对象都向一端移动，然后直接清理掉端边界以外的内存。

- 标记：标记出所有需要回收对象
- 清除：统一回收掉所有对象
- 整理：将所有存活对象向一端移动

**优缺点**：

- 优点：空间没有浪费，没有内存碎片化问题
- 缺点：性能较低

<img src="https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401131342700.png" alt="image-20240113134237659" style="zoom:33%;" />

**分代回收**：

当前商业虚拟机都是采用这种算法。根据对象的存活周期的不同将内存划分为几块。

- 新生代：选择**复制算法，弱分代假说**
- 老年代：选择**标记-清除或标记-整理，强分代假说**

#### 1.3.4 用什么清除垃圾？

**有8 种不同的垃圾回收器**，它们分别用于不同分代的垃圾回收。

- **新生代（复制算法）**：Serial，ParNew，Parallel Scavenge
- **老年代（标记-清除、标记-整理）**：SerialOld，Parallel Old，CMS
- **整堆**：G1，ZGC

![image-20240113134452673](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401131344701.png)

| 新生代            | 老年代       |
| ----------------- | ------------ |
| Serial            | Serial Old   |
| Serial            | CMS          |
| ParNew            | Serial Old   |
| ParNew            | CMS          |
| Parallel Scavenge | Serial Old   |
| Parallel Scavenge | Parallel Old |

## 2. 串行收集器

### 2.1 Serial 收集器：Serial 与 SerialOld

**配置参数**： **-XX:+UseSerialGC**

**特点**：

- **Serial** 新生代收集器，单线程执行，使用复制算法
- **SerialOld** 老年代收集器，单线程执行，使用标记-整理算法
- 进行垃圾收集时，必须暂停用户线程

![image-20240113135833788](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401131358808.png)

## 3 并行收集器

### 3.1 Parallel Scavenge 收集器

**配置参数**： `-XX:+UseParallelGC`

**特点：简称PS**

- **吞吐量优先收集器**，垃圾收集需要暂停用户线程

<img src="https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401131408092.png" alt="image-20240113140856071" style="zoom:33%;" />

- 新生代使用并行回收器，采用复制算法
- 老年代使用串行收集器，采用标记-整理算法

![image-20240113140921128](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401131409201.png)

### 3.2 Parallel Old 收集器

**配置参数**： `-XX:+UseParallelOldGC`

**特点**：

- **PS收集器的老年代版本**

- **吞吐量优先收集器**，垃圾收集需要暂停用户线程，对CPU敏感

- 老年代使用并行收集器，采用标记-整理算法

![image-20240113141135834](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401131411856.png)

### 3.3 ParNew 收集器

**配置参数**：

- `-XX:+UseParNewGC`

- `-XX:ParallelGCThreads=n`，垃圾收集线程数

**特点**：

- **新生代并行 ParNew，老年代串行 SerialOld**

- Serial 的多线程版

- 单核 CPU 不建议使用

![image-20240113141435735](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401131414755.png)

### 3.4 CMS 收集器

**配置参数**：` -XX:+UseConcMarkSweepGC`

**特点**：

- **低延时，减少STW对用户的影响**

- 并发收集，用户线程与收集线程一起执行，对CPU资源敏感

- 不会等待堆填满再收集，到达阈值就开始收集

- 采用标记-清除算法，所以会产生内存碎片

![image-20240113141756512](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401131417536.png)

1. **初始标记阶段：会 STW**，标记出 GCRoots 可以关联到的对象，关联对象较少，所以很快
2. **并发标记阶段：不会 STW**，遍历 GCRoots 直接对象的引用链，耗时长
3. **重新标记阶段：会 STW**，修正并发标记期间的新对象记录
4. **并发清除阶段：不会 STW**，清除垃圾对象，释放内存空间

### 3.5 G1（Garbage-First）收集器

**G1 是一款面向服务端应用的全功能型垃圾收集器，大内存企业配置的主要是 G1**。

**配置参数**：`-XX:+UseG1GC`

**特点：G1**

- 吞吐量和低延时都行的**整堆垃圾收集器**

- **G1 最大堆内存 32M \* 2048=64GB，最小堆内存 1M * 2048 = 2 GB**，低于此值不建议使用

- 全局使用**标记-整理算法**收集，局部采用**复制算法**收集

- **可预测的停顿**：能让使用者指定GC消耗时间，默认是 200ms

![image-20240113142148932](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401131421959.png)

1. **初始标记：会 STW**，标记出 GCRoots 可以关联到的对象，耗时短
2. **并发标记：不会 STW**，遍历 GCRoots 直接对象的引用链，耗时长
3. **最终标记：会 STW**，修正并发标记期间，标记产生变动的那部分
4. **筛选回收：会 STW**，对各个 Region 的**回收价值和成本排序**，根据用户期望 GC 停顿时间确定回收计划

G1中有三种模式垃圾回收模式，**Young GC、Mixed GC 和 Full GC**，在不同的条件下被触发。

**G1 内存划分**：

- **取消新生代与老年代的物理划分**：采用若干个固定大小的 Region

- **Region区类型**：在逻辑上有 Eden、Survivor、Old、Humongous

- **垃圾收集算法**：全局采用标记-整理算法，局部采用复制算法

- **Humongous区域**：当对象的容量超过了 Region 的50%，则被认为是巨型对象

<img src="https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401131425727.png" alt="image-20240113142554627" style="zoom:50%;" />

```bash
-XX:+UseG1GC
# 使用 G1 垃圾收集器
-XX:MaxGCPauseMillis=
# 设置期望达到的最大GC停顿时间指标（JVM会尽力实现，但不保证达到），默认值是 200 毫秒。
-XX:G1HeapRegionSize=n
# 设置的 G1 区域的大小。值是 2 的幂，范围是 1 MB 到 32 MB 之间。
# 目标是根据最小的 Java 堆大小划分出约 2048 个区域。
# 默认是堆内存的1/2000。
-XX:ParallelGCThreads=n
# 设置并行垃圾回收线程数，一般将n的值设置为逻辑处理器的数量，建议最多为8。
-XX:ConcGCThreads=n
# 设置并行标记的线程数。将n设置为ParallelGCThreads的1/4左右。
-XX:InitiatingHeapOccupancyPercent=n
# 设置触发标记周期的 Java 堆占用率阈值。默认占用率是整个 Java 堆的 45%。
```

### 3.6 ZGC（Z Garbage Collector）

ZGC （Z Garbage Collector ）在JDK11中引入的一种**可扩展的低延迟垃圾收集器**，在 JDK15 中发布稳定版。

**配置参数**： `-XX:+UseZGC`

**特点**：

- **< 1ms 最大暂停时间（JDK 16 是10ms，JDK16+ <1ms ），不会随着堆内存增加而增加**

- **适合内存8MB，16TB**
- 并发，基于Region，压缩，NUMA感知，使用色彩指针，使用负载屏障
- 垃圾收集算法：标记-整理算法
- 主要目标：低延时

```bash
-XX:+UseZGC # 启用 ZGC
-Xmx # 设置最大堆内存
-Xlog:gc # 打印 GC日志
-Xlog:gc* # 打印 GC 详细日志
```

## 4. Minor GC 、Major GC和 Full GC 有什么区别？

- 新生代收集（Minor GC/Young GC）：指目标只是新生代的垃圾收集。Minor GC 非常频繁，回收速度比较快。
- 老年代收集（Major GC/Old GC）：指目标只是老年代的垃圾收集， Major GC 一般比 Minor GC 慢 10 倍以上。目前只有 CMS 收集器会有单独收集老年代的行为。另外请注意 Major GC 这个说法现在有点混淆，在不同资料上常有不同所指，需按上下文区分到底是指老年代的收集还是整堆收集。
- 整堆收集（Full GC）：收集整个 Java 堆和方法区的垃圾收集。
- 混合收集（Mixed GC）：指目标是收集整个新生代以及部分老年代的垃圾收集。目前只有 G1 收集器会有这种行为。