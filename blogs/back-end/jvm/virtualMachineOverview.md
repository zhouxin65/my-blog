---
title: JVM 虚拟机
date: 2024-01-11
categories:
  - JVM
tags:
  - JVM
---

# 1. JVM 虚拟机概述

## 1.1 JVM 基本常识

### 什么是 JVM？

广义上指的是一种规范。狭义上的是 JDK 中的 JVM 虚拟机。

- Java虚拟机：各种硬件平台上的Java虚拟机实现

![image-20231228221527321](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202312282215345.png)

### JVM 架构图

![image-20231228221552298](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202312282215314.png)

### Java 和 JVM 的关系

<img src="https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202312282216682.png" alt="image-20231228221630664" style="zoom: 33%;" />

## 1.2 类加载子系统

### 1.2.1 类加载的时机

四个时机：

1. 遇到`new `、`getstatic `、`putstatic` 和 `invokestatic` 这四条指令时，如果对应的类没有初始化，则要对对应的类先进行初始化

```java
public class Student{
  private static int age ;
  public static void method(){
  }
}
//Student.age
//Student.method();
//new Student();
```

2. 使用`java.lang.reflect` 包方法时，对类进行反射调用的时候

```java
Class c = Class.forname("com.hero.Student");
```

3. 初始化一个类的时候发现其父类还没初始化，要先初始化其父类
4. 当虚拟机开始启动时，用户需要指定一个主类（main），虚拟机会先执行这个主类的初始化

### 1.2.2 类加载的过程

#### 类加载主要做三件事

1. 类全限定名称	    ➡️	二进制字节流加载class文件
2. 字节流静态数据	➡️	方法区（永久代，元空间）
3. 创建字节码 Class 对象

#### 一个类的一生

<img src="https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202312282228498.png" alt="image-20231228222855475" style="zoom:33%;" />

#### 类加载途径

1. jar / war
2. jsp 生成的 class
3. 数据库中的二进制字节流
4. 网络中的二进制字节流
5. 动态代理生成的二进制字节流

![image-20231228223013438](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202312282230462.png)

### 1.2.3 类加载器

**JVM 的类加载是通过 ClassLoader 及其子类来完成的。**

- **启动类加载器(Bootstrap ClassLoader)**
  - 负责加载 `JAVA_HOME\lib` 目录的或通过 ``-Xbootclasspath` 参数指定路径中的且被虚拟机认可（rt.jar）的类库
- **扩展类加载器(Extension ClassLoader)**
  - 负责加载 `JAVA_HOME\lib\ext` 目录或通过 `java.ext.dirs` 系统变量指定路径中的类库
- **应用程序类加载器(Application ClassLoader)**
  - 负责加载用户路径 classpath 上的类库
- **自定义类加载器（User ClassLoader）**
  - 加载应用之外的类文件
  - 如：JRebel

<img src="https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202312282231136.png" alt="image-20231228223134111" style="zoom:25%;" />

#### 执行顺序

1. **检查顺序是自底向上**：加载过程中会先检查类是否被已加载，从 Custom 到 BootStrap 逐层检查，只要某个类加载器已加载就视为此类已加载，保证此类所有 ClassLoader 只加载一次。
2. **加载的顺序是自顶向下：**也就是由上层来逐层尝试加载此类。

<img src="https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202312282235090.png" alt="image-20231228223517064" style="zoom: 33%;" />

#### **自定义类加载器**

**目标：自定义类加载器，加载指定路径在D盘下的lib文件夹下的类。**

**步骤：**

1. 新建一个类 Test.java
2. 编译 Test.java 到指定 lib 目录
3. 自定义类加载器 HeroClassLoader 继承 ClassLoader：
   1. 重写 findClass() 方法
   2. 调用 defineClass() 方法
4. 测试自定义类加载器

**实现：**

（1）新建一个 `Test.java  `类

```java
package com.hero.jvm.classloader;
  public class Test {
    public void say(){
    	System.out.println("Hello HeroClassLoader");
    }
}
```

（2）使用 `javac Test.java`命令，将生成的 Test.class 文件放到 D:/lib/com/hero/jvm/classloader 文件夹下。

（3）自定义类加载器，代码如下：

```java
package com.hero.jvm.classloader;

import java.io.*;

public class HeroClassLoader extends ClassLoader {
    private String classpath;

    public HeroClassLoader(String classpath) {
        this.classpath = classpath;
    }

    @Override
    protected Class<?> findClass(String name) throws ClassNotFoundException {
        try {
						// 输入流，通过类的全限定名称加载文件到字节数组
            byte[] classDate = getData(name);
            if (classDate != null) {
								// defineClass方法将字节数组数据 转为 字节码对象
                return defineClass(name, classDate, 0, classDate.length);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
        return super.findClass(name);
    }

    //加载类的字节码数据
    private byte[] getData(String className) throws IOException {
        String path = classpath + File.separatorChar +
                className.replace('.', File.separatorChar) + ".class";
        try (InputStream in = new FileInputStream(path);
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[2048];
            int len = 0;
            while ((len = in.read(buffer)) != -1) {
                out.write(buffer, 0, len);
            }
            return out.toByteArray();
        } catch (FileNotFoundException e) {
            e.printStackTrace();
        }
        return null;
    }
}
```

（4）测试，代码如下：

```java
package com.hero.jvm.classloader;

import java.lang.reflect.Method;

public class TestMyClassLoader {
    public static void main(String[] args) throws Exception {
				// 自定义类加载器的加载路径
        HeroClassLoader hClassLoader = new HeroClassLoader("D:\\lib");
				// 包名+类名
        Class c = hClassLoader.loadClass("com.hero.jvm.classloader.Test");
        if (c != null) {
            Object obj = c.newInstance();
            Method method = c.getMethod("say", null);
            method.invoke(obj, null);
            System.out.println(c.getClassLoader().toString());
        }
    }
}
```

输出结果如下：

<img src="https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202312282242438.png" alt="image-20231228224225394" style="zoom:50%;" />

### 1.2.4 双亲委派模型与打破双亲委派

#### 什么是双亲委派？

**当一个类加载器收到类加载任务，会先交给其父类加载器去完成**，因此最终加载任务都会传递到顶层的启动类加载器，只有当父类加载器无法完成加载任务时，才会尝试执行加载任务

#### 为什么需要双亲委派呢？

- **主要考虑安全因素，双亲委派可以避免重复加载核心的类，当父类加载器已经加载了该类时，子类加载器不会再去加载。**
- 比如：要加载位于rt.jar包中的类java.lang.Object，不管是哪个加载器加载，最终都委托给顶层的启动类加载器进行加载，这样就可以保证使用不同的类加载器最终得到的都是同样的Object对象。

#### 双亲委派机制源码：

```java
protected Class<?> loadClass(String name, boolean resolve)
            throws ClassNotFoundException {
        synchronized (getClassLoadingLock(name)) {
						// 首先, 检查class是否被加载，如果没有加载则进行加载
            Class<?> c = findLoadedClass(name);
            if (c == null) {
                long t0 = System.nanoTime();
                try {
                    if (parent != null) {//如果父类加载不为空，则交给父类加载器加载
                        c = parent.loadClass(name, false);
                    } else {
                        c = findBootstrapClassOrNull(name);
                    }
                } catch (ClassNotFoundException e) {
									// ClassNotFoundException thrown if class not found
									// from the non-null parent class loader
                }
                if (c == null) {//父类加载器没有加载到，则由子类进行加载
										// If still not found, then invoke findClass in order
                    // to find the class.
                    long t1 = System.nanoTime();
                    c = findClass(name);
										// this is the defining class loader; record the stats
                    sun.misc.PerfCounter.getParentDelegationTime().addTime(t1 - t0);
                    sun.misc.PerfCounter.getFindClassTime().addElapsedTimeFrom(t1);
                    sun.misc.PerfCounter.getFindClasses().increment();
                }
            }
            if (resolve) {
                resolveClass(c);
            }
            return c;
        }
    }
```

#### 为什么还需要破坏双亲委派？

- 在实际应用中，**双亲委派解决了Java 基础类统一加载的问题，但是却存在着缺陷**。JDK中的基础类作为典型的API被用户调用，但是也存在**API调用用户代码**的情况，典型的如：SPI代码。这种情况就需要打破双亲委派模式。
- 数据库驱动 DriverManager。以Driver接口为例，Driver接口定义在JDK中，其**实现由各个数据库的服务商来提供，由系统类加载器加载**。这个时候就需要**启动类加载器**来**委托**子类来加载Driver实现，这就破坏了双亲委派。

#### **如何破坏双亲委派？**

方式一：**重写 ClassLoader 的 loadClass 方法**

- 在 jdk 1.2 之前，那时候还没有双亲委派模型，不过已经有了 ClassLoader 这个抽象类，所以已经有人继承这个抽象类，**重写 loadClass **方法来**实现用户自定义类加载器**。
- 而在 1.2 的时候要**引入双亲委派模型**，为了向前兼容， loadClass 这个方法还得保留着使之得以重写，新搞了个 findClass 方法让用户去重写，并呼吁大家不要重写 loadClass 只要重写 findClass。
- 这就是第一次对双亲委派模型的破坏，**因为双亲委派的逻辑在 loadClass 上，但是又允许重写loadClass，重写了之后就可以破坏委派逻辑了。**

方式二：**SPI**，父类委托自类加载器加载Class，以数据库驱动DriverManager为例

​	DriverManager源码

```java
static {
        loadInitialDrivers();
        println("JDBC DriverManager initialized");
    }

    private static void loadInitialDrivers() {
        String drivers;
        try {
            drivers = AccessController.doPrivileged(new PrivilegedAction<String>
                    () {
                public String run() {
                    return System.getProperty("jdbc.drivers");
                }
            });
        } catch (Exception ex) {
            drivers = null;
        }
        AccessController.doPrivileged(new PrivilegedAction<Void>() {
            public Void run() {
                ServiceLoader<Driver> loadedDrivers =
                        ServiceLoader.load(Driver.class);
                Iterator<Driver> driversIterator = loadedDrivers.iterator();
                try {
                    while (driversIterator.hasNext()) {
                        driversIterator.next();
                    }
                } catch (Throwable t) {
// Do nothing
                }
                return null;
            }
        });
        println("DriverManager.initialize: jdbc.drivers = " + drivers);
        if (drivers == null || drivers.equals("")) {
            return;
        }
        String[] driversList = drivers.split(":");
        println("number of Drivers:" + driversList.length);
        for (String aDriver : driversList) {
            try {
                println("DriverManager.Initialize: loading " + aDriver);
//在这里需要加载各个厂商实现的数据库驱动com.mysql.jdbc.Driver
                Class.forName(aDriver, true, ClassLoader.getSystemClassLoader());
            } catch (Exception ex) {
                println("DriverManager.Initialize: load failed: " + ex);
            }
        }
    }
```

- 如果出现SPI相关代码时，我们应该如何解决基础类去加载用户代码类呢？
  - 这个时候，JVM不得不妥协，推出**线程上下文类加载器**的概念，去解决该问题。这样也就打破了双亲委派

**线程上下文类加载器（ThreadContextClassLoader）**

设置线程上下文类加载器源码

```java
public Launcher() {
// Create the extension class loader
        ClassLoader extcl;
        try {
// 扩展类加载器
            extcl = ExtClassLoader.getExtClassLoader();
        } catch (IOException e) {
            throw new InternalError(
                    "Could not create extension class loader", e);
        }
// Now create the class loader to use to launch the application
        try {
// 应用类加载器/系统类加载器
            loader = AppClassLoader.getAppClassLoader(extcl);
        } catch (IOException e) {
            throw new InternalError(
                    "Could not create application class loader", e);
        }
// 线程上下文类加载器
// Also set the context class loader for the primordial thread.
        Thread.currentThread().setContextClassLoader(loader);
// Finally, install a security manager if requested
        String s = System.getProperty("java.security.manager");
        if (s != null) {
            SecurityManager sm = null;
            if ("".equals(s) || "default".equals(s)) {
                sm = new java.lang.SecurityManager();
            } else {
                try {
                    sm = (SecurityManager) loader.loadClass(s).newInstance();
                } catch (IllegalAccessException e) {
                } catch (InstantiationException e) {
                } catch (ClassNotFoundException e) {
                } catch (ClassCastException e) {
                }
            }
            if (sm != null) {
                System.setSecurityManager(sm);
            } else {
                throw new InternalError(
                        "Could not create SecurityManager: " + s);
            }
        }
    }

    public Launcher() {
// Create the extension class loader
        ClassLoader extcl;
        try {
// 扩展类加载器
            extcl = ExtClassLoader.getExtClassLoader();
        } catch (IOException e) {
            throw new InternalError(
                    "Could not create extension class loader", e);
        }
// Now create the class loader to use to launch the application
        try {
// 应用类加载器/系统类加载器
            loader = AppClassLoader.getAppClassLoader(extcl);
        } catch (IOException e) {
            throw new InternalError(
                    "Could not create application class loader", e);
        }
// 线程上下文类加载器
// Also set the context class loader for the primordial thread.
        Thread.currentThread().setContextClassLoader(loader);
// Finally, install a security manager if requested
        String s = System.getProperty("java.security.manager");
        if (s != null) {
            SecurityManager sm = null;
            if ("".equals(s) || "default".equals(s)) {
                sm = new java.lang.SecurityManager();
            } else {
                try {
                    sm = (SecurityManager) loader.loadClass(s).newInstance();
                } catch (IllegalAccessException e) {
                } catch (InstantiationException e) {
                } catch (ClassNotFoundException e) {
                } catch (ClassCastException e) {
                }
            }
            if (sm != null) {
                System.setSecurityManager(sm);
            } else {
                throw new InternalError(
                        "Could not create SecurityManager: " + s);
            }
        }
    }
```

*获取线程上下文类加载器源码*

```java
public static <S> ServiceLoader<S> load(Class<S> service) {
	ClassLoader cl = Thread.currentThread().getContextClassLoader();
	return ServiceLoader.load(service, cl);
}
```

![image-20231228225507828](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202312282255852.png)

方式三：**热部署和不停机更新用到的 OSGI 技术**

## 1.3 运行时数据区

整个JVM构成里面，主要由三部分组成：类加载系统、**运行时数据区**、执行引擎

**按照线程使用情况和职责分成两大类：**

1. **线程独享（程序执行区域）**
   - 虚拟机栈**、本地方法栈、**程序计数器
   - 不需要垃圾回收
2. **线程共享（数据存储区域）**
   - **堆**和**方法区**
   - 存储类的静态数据和对象数据
   - 需要垃圾回收

<img src="https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202312282258650.png" alt="image-20231228225818584" style="zoom: 67%;" />

### 1.3.1 堆

**内存划分：核心逻辑就是三大假说，基于程序运行情况进行不断的优化设计。**

<img src="https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202312282300927.png" alt="image-20231228230040862" style="zoom:70%;" />

**堆内存为什么会存在新生代和老年代？**

**分代收集理论**：当前商业虚拟机的垃圾收集器，大多数都遵循了“分代收集”（GenerationalCollection）的理论进行设计，分代收集名为理论，实质是一套符合大多数程序运行实际情况的经验法则，它建立在两个分代假说之上：

- **弱分代假说（Weak Generational Hypothesis）：绝大多数对象都是朝生夕灭的。**
- **强分代假说（Strong Generational Hypothesis）：熬过越多次垃圾收集过程的对象就越难以消亡。**

这两个分代假说共同奠定了多款常用的垃圾收集器的一致的设计原则：收集器应该将 Java 堆划分出不同的区域，然后将回收对象依据其年龄（年龄即对象熬过垃圾收集过程的次数）分配到不同的区域之中存储。

- 如果一个区域中大多数对象都是朝生夕灭，难以熬过垃圾收集过程的话，那么把它们集中放在一起，每次回收时只关注如何保留少量存活而不是去标记那些大量将要被回收的对象，就能**以较低代价回收到大量的空间**；
- 如果剩下的都是难以消亡的对象，那把它们集中放在一块，虚拟机便可以**使用较低的频率来回收这个区域**。

这就同时**兼顾了垃圾收集的时间开销和内存的空间有效利用**。

#### 内存模型变迁：

##### **JDK 1.7**

<img src="https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401112151757.png" alt="image-20240111215117579" style="zoom: 33%;" />

- Young 年轻区 ：主要保存年轻对象，分为三部分，Eden 区、两个 Survivor 区。
- Tenured 年老区 ：主要保存年长对象，当对象在 Young 复制转移一定的次数后，对象就会被转移到 Tenured区。
- Perm 永久区 ：主要保存 class、method、filed对象，这部份的空间一般不会溢出，除非一次性加载了很多的类，不过在涉及到热部署的应用服务器的时候，有时候会遇到 OOM: PermGen space 的错误。
- Virtual 区： 最大内存和初始内存的差值，就是 Virtual 区。

##### **JDK 1.8**

<img src="https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401112153261.png" alt="image-20240111215338236" style="zoom:33%;" />

- 由两部分组成，新生代（Eden + 2 * Survivor ）+ 年老代（OldGen ）
- JDK 1.8 中变化最大是 Perm 永久区用 Metaspace 进行了替换
- **注意：Metaspace 所占用的内存空间不是在虚拟机内部，而是在本地内存空间中。**区别于 JDK1.7

##### **JDK 1.9**

<img src="https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401112155093.png" alt="image-20240111215528936" style="zoom:33%;" />

- 取消新生代、老年代的物理划分
- 将堆划分为若干个区域（Region），这些区域中包含了有逻辑上的新生代、老年代区域

#### *内存信息案例：*

详情见笔记。

### 1.3.2 虚拟机栈

#### 栈帧是什么？

- 栈帧 (Stack Frame) 是用于支持虚拟机进行**方法执行**的数据结构。
- 栈帧存储了方法的**局部变量表、操作数栈、动态连接和方法返回地址**等信息。每一个方法从调用至执行完成的过程，都对应着一个栈帧在虚拟机栈里从入栈到出栈的过程。
- 栈内存为线程私有的空间，每个线程都会创建私有的栈内存，生命周期与线程相同，每个Java方法在执行的时候都会创建一个**栈帧（Stack Frame）**。栈内存大小决定了方法调用的深度，栈内存过小则会导致方法调用的深度较小，如递归调用的次数较少。

<img src="https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401112201885.png" alt="image-20240111220111858" style="zoom:50%;" />

#### 当前栈帧

- 一个线程中方法的调用链可能会很长，所以会有很多栈帧。只有位于JVM虚拟机栈栈顶的元素才是有效的，即称为**当前栈帧**，与这个栈帧相关连的方法称为**当前方法**，定义这个方法的类叫做**当前类**。
- 执行引擎运行的所有**字节码指令**都只针对**当前栈帧**进行操作。如果当前方法调用了其他方法，或者当前方法执行结束，那这个方法的栈帧就不再是当前栈帧了。

#### 什么时候创建栈帧

- 调用新的方法时，新的栈帧也会随之创建。并且随着程序控制权转移到新方法，新的栈帧成为了当前栈帧。方法返回之际，原栈帧会返回方法的执行结果给之前的栈帧(返回给方法调用者)，随后虚拟机将会丢弃此栈帧。

#### 栈异常的两种情况

- 如果线程请求的栈深度大于虚拟机所允许的深度（Xss默认1m），会抛出 StackOverflowError 异常
- 如果在创建新的线程时，没有足够的内存去创建对应的虚拟机栈，会抛出 OutOfMemoryError 异常*【不一定】*

### 1.3.3 本地方法栈

- 本地方法栈和虚拟机栈相似，区别就是虚拟机栈为虚拟机执行Java服务（字节码服务），而本地方法栈为虚拟机使用到的 **Native 方法**（比如C++方法）服务。
- 简单地讲，一个 Native Method 就是一个 Java 调用非 Java 代码的接口。

***为什么需要本地方法？***

如果想要直接与操作系统与硬件打交道，就需要使用到本地方法了。说白了，Java 可以直接通过 native 方法调用cpp 编写的接口！多线程底层就是这么实现的。

### 1.3.4 方法区

- 方法区（Method Area）是可供各个线程共享的运行时内存区域，方法区本质上是 Java 语言**编译后代码存储区域**，它存储每一个类的结构信息，例如：**运行时常量池**、成员变量、方法数据、构造方法和普通方法的字节码指令等内容。很多语言都有类似区域。
- 方法区的具体实现有两种：**永久代（PermGen）、元空间（Metaspace）**

#### 方法区存储什么数据？

<img src="https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401112212696.png" alt="image-20240111221208667" style="zoom: 50%;" />

主要有如下三种类型

1. Class
   1. 类型信息，比如 Class（com.hero.User类）
   2. 方法信息，比如 Method（方法名称、方法参数列表、方法返回值信息）
   3. 字段信息，比如 Field（字段类型，字段名称需要特殊设置才能保存的住）
   4. 类变量（静态变量）：JDK 1.7 之后，转移到堆中存储
   5. 方法表（方法调用的时候） 在 A 类的 main 方法中去调用 B 类的 method1 方法，是根据 B 类的方法表去查找合适的方法，进行调用的
2. 运行时常量池（字符串常量池）：从class中的常量池加载而来，JDK1.7之后，转移到堆中存储
   - 字面量类型
   - 引用类型 → 内存地址
3. JIT 编译器编译之后的代码缓存

#### 永久代和元空间的区别是什么？

1.  JDK 1.8 之前使用的方法区实现是**永久代**，JDK1.8 及以后使用的方法区实现是**元空间**。
2.  **存储位置不同**：
   - **永久代**所使用的内存区域是 **JVM 进程所使用的区域**，它的大小受整个JVM的大小所限制。
   - **元空间**所使用的内存区域是物理内存区域。那么元空间的使用大小只会受物理内存大小的限制。
3. **存储内容不同**：
   - 永久代存储的信息基本上就是上面方法区存储内容中的数据。
   - 元空间只存储类的元信息，而**静态变量和运行时常量池都挪到堆中**。

#### 为什么要使用元空间来替换永久代？

1. **字符串存在永久代中，容易出现性能问题和永久代内存溢出。**
2.  类及方法的信息等比较难确定其大小，因此对于永久代的大小指定比较困难，太小容易出现永久代溢出，太大则容易导致老年代溢出。
3. 永久代会为 GC 带来不必要的复杂度，并且回收效率偏低。
4.  Oracle 计划将 HotSpot 与 JRockit 合二为一。

***方法区实现变迁历史：***

![image-20240111222150968](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401112221003.png)

> 移除永久代的工作从 JDK1.7 就开始了。JDK 1.7 中，存储在永久代的部分数据就已经转移到了 Java Heap。但永久代仍存在于 JDK1.7 中，并没完全移除，譬如：字面量转移到了 java heap；类的静态变量 (class statics)转移到了 java heap。

### 1.3.5 字符串常量池

#### 三种常量池

- **class 常量池**：一个 class 文件只有一个 class 常量池
- **运行时常量池**：一个 class 对象有一个运行时常量池
- **字符串常量池**：全局只有一个字符串常量池 

**字面量与符号引用：**

- 字面量：int、float、long、double，**双引号字符串**等
- 符号引用：Class、Method，Field 等

![image-20240111222518386](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401112225417.png)

#### 字符串常量池如何存储数据？

为了提高匹配速度， 即更快的查找某个字符串是否存在于常量池 Java 在设计字符串常量池的时候，还搞了一张StringTable，StringTable 里面保存了**字符串的引用**。StringTable 类似于 HashTable（哈希表）。在 JDK1.7+，StringTable 可以通过参数指定`-XX:StringTableSize=99991`

#### 什么是哈希表呢？

哈希表（Hash table，也叫散列表），是根据关键码值(Key value)而直接进行访问的数据结构。也就是说，它通过把关键码值映射到表中一个位置来访问记录，以加快查找的速度。这个映射函数叫做散列函数，存放记录的数组叫做散列表。

**哈希表本质上是一个数组 + 链表**

**目的 : 为了加快数据查找的速度。**

存在问题：hash 冲突问题，一旦出现冲突，那么就会形成链表，链表的特点是增删快，但查询慢。

> 数组下标计算公式：hash(字符串) % 数组长度
>
> 数组中存储的是 Entry，通过指针 next 形成链表

<img src="https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401112229649.png" alt="image-20240111222931616" style="zoom: 33%;" />

#### 字符串常量池如何查找字符串?

- 根据字符串的 hashcode 找到对应 entry
- 如果没有冲突，它可能只是一个 entry 
- 如果有冲突，它可能是一个 entry 的链表，然后 Java 再遍历链表，匹配引用对应的字符串
- 如果找到字符串，返回引用
- 如果找不到字符串，在使用 intern() 方法的时候，会将 intern() 方法调用者的引用放入到 stringtable 中

<img src="https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401112232288.png" alt="image-20240111223237250" style="zoom:50%;" />

```java
public class StringTableDemo {
    public static void main(String[] args) {
        HashMap<String, Integer> map = new HashMap<>();
        map.put("hello", 53);
        map.put("world", 35);
        map.put("java", 55);
        map.put("world", 52);
        map.put("通话", 51);
        map.put("重地", 55);
//出现哈希冲突怎么办？
//System.out.println("map = " + map);//
        test();
    }

    public static void test() {
        String str1 = "abc";
        String str2 = new String("abc");
        System.out.println(str1 == str2);//false
        String str3 = new String("abc");
        System.out.println(str3 == str2);//false
        String str4 = "a" + "b";
        System.out.println(str4 == "ab");//true
        String s1 = "a";
        String s2 = "b";
        String str6 = s1 + s2;
        System.out.println(str6 == "ab");//false
        String str7 = "abc".substring(0, 2);
        System.out.println(str7 == "ab");//false
        String str8 = "abc".toUpperCase();
        System.out.println(str8 == "ABC");//false
        String s5 = "a";
        String s6 = "abc";
        String s7 = s5 + "bc";
        System.out.println(s6 == s7.intern());//true
    }
}
```

<img src="https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401112236341.png" alt="image-20240111223651304" style="zoom: 33%;" />

- 单独使用`””`引号创建的字符串都是常量，编译期就已经确定存储到 String Pool 中。
- 使用`new String(“”)`创建的对象会存储到 heap 中，是运行期新创建的。
- 使用只包含常量的字符串连接符如`”aa”+”bb”`创建的也是常量，编译期就能确定已经存储到 StringPool 中。
- 使用包含变量的字符串连接如`”aa”+s`创建的对象是运行期才创建的，存储到 heap 中。
- 运行期调用 String 的`intern()`方法可以向 String Pool 中动态添加对象。

### 1.3.6 程序计数器

**程序计数器，也叫PC寄存器，**当前线程所执行的**字节码指令**的**行号指示器**

#### 为什么需要程序计数器？

线程切换（系统上下文切换）后准确恢复执行位置

#### 存什么数据？

- Java 方法：记录虚拟机字节码指令地址
- Native 方法：记录为空

**异常：**唯一没有OOM异常的区域

### 1.3.7 直接内存

**直接内存不是虚拟机运行时数据区的一部分，也不是《Java虚拟机规范》中定义的内存区域**

在 JDK1.4 中，新加入了 NIO，引入了 Channel 和 Buffer 的 IO 方式，可以使用 native 方法直接分片对外内存，然后通过 **DirectByteBuffer** 对象可以操作直接内存

#### 为什么需要直接内存？

- 因为性能真的好，避免了在 Java 堆和 Native 堆中来回复制数据。
- 本机直接内存的分配不会受到 Java 堆大小的限制，受到本机总内存大小限制。

#### 直接内存和堆内存比较：

![image-20240111224133688](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401112241726.png)

## 1.4 对象的创建流程与内存分配

### 1.4.1 对象的创建流程

![image-20240113104541015](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401131045058.png)

### 1.4.2 对象的内存分配方式 

*内存分配的方法有两种：不同垃圾收集器不一样*

- **指针碰撞** (Bump the Pointer)
- **空闲列表** (Free List)

| 分配方法 | 说明                       | 收集器                             |
| -------- | -------------------------- | ---------------------------------- |
| 指针碰撞 | 内存地址是连续的（新生代） | `serial` 和 `parNew` 收集器        |
| 空闲列表 | 内存地址不连续（老年代）   | `CMS` 收集器和 `Mark-Sweep` 收集器 |

![image-20240113104953861](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401131049892.png)

**指针碰撞示意图：**

![image-20240113105127513](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401131051547.png)

### 1.4.3 内存分配安全问题

虚拟机给 A 线程分配内存的过程中，指针未修改，此时 B 线程同时使用了该内存，是不是就出现问题了？

**怎么办？**

- **CAS乐观锁：**JVM 虚拟机采用 CAS 失败重试的方式保证更新操作的原子性
- TLAB（Thread Local Allocation Buffer）**本地线程分配缓存**，预分配

**对象内存分配流程【重要】：**

- **分配主流程：**首先从 TLAB 里面分配，如果分配不到，再使用 CAS 从堆里面划分

![image-20240113105450026](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401131054083.png)

### 1.4.4 对象怎样才会进入老年代？【重点】

- 新生代：新对象大多数都默认进入新生代的 Eden 区

- 对象进入老年代的四种情况：

  1. **年龄太大 Minor GC 15次**

     - `-XX:MaxTenuringThreshold`

  2. **动态年龄判断：**MinorGC 之后，若 Survivor 区中的一批对象的总大小 > Survivor区

     的50%，那么就会将此时大于等于这批对象年龄最大值的所有对象，直接进入老年代

     - 举个栗子：Survivor 区中有一批对象，年龄分别为年龄 1 + 年龄 2 + 年龄 n 的多个对象，对

       象总和大小超过了Survivor区域的50%，此时就会把年龄 n 及以上的对象都放入老年

       代 

     - **目的：希望那些可能是长期存活的对象，尽早进入老年代。**

     - `-XX:TargetSurvivorRatio` 可以指定

  3. **大对象**直接进入老年代：**前提是 Serial 和 ParNew 收集器**

     -  举个栗子：字符串或数组
     - **目的：避免大对象分配内存时的复制操作降低效率，避免 Eden 和 Survior 区的复制**
     - `-XX:PretenureSizeThreshold`  一般默认为 **1M**

  4. **MinorGC 后存活对象太多无法放入 Survivor**

**内存（空间）担保机制：**

当新生代无法分配内存的时候，我们想把新生代的**老对象**转移到老年代，然后把**新对象**放入腾空的新生代。

- MinorGC 前，判断老年代可用内存是否小于新时代对象全部对象大小，如果小于则继续判断
- 判断老年代可用内存大小是否小于之前每次 MinorGC 后进入老年代的对象平均大小
  - 如果是，则会进行一次 FullGC，判断是否放得下，放不下 OOM
  - 如果否，则会进行一些 MinorGC：
    - MinorGC 后，剩余存活对象小于 Survivor 区大小，直接进入 Survivor 区
    - MinorGC 后，剩余存活对象大于 Survivor 区大小，但是小于老年代可用内存，直接进入老年代
    - MinorGC 后，剩余存活对象大于 Survivor 区大小，也大于老年代可用内存，进行 FullGC
    - FullGC 之后，仍然没有足够内存存放 MinorGC 的剩余对象，就会OOM

![image-20240113111206849](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401131112886.png)

## 1.5 对象内存布局

#### 1.5.1 对象里的三个区

1. **对象头**
   - 标记字段：存储对象运行时自身数据
     - 默认：对象Hashcode，GC分代年龄，锁状态
     - 存储数据结构并不是固定的
   - 类型指针：对象指向类元数据的指针
     - 开启指针压缩占4字节，不开启8字节
   - 数组长度：如果是数组，则记录数组长度，占4字节
   - 对其填充：保证数组的大小永远是8字节的整数倍
2. **实例数据**：对象内部的成员变量
3. **对齐填充**：8字节对象，保证对象大小是8字节的整数倍

<img src="https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401131117651.png" alt="image-20240113111729615" style="zoom: 33%;" />

<img src="https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401131117443.png" alt="image-20240113111755406" style="zoom:50%;" />

**Marword 是可变的数据结构，对象头总大小固定 8 字节**

<img src="https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401131118234.png" alt="image-20240113111837193" style="zoom: 30%;" />

基本数据类型和包装类的内存占用情况：

| 数据类型 | 内存占用（byte） | 数据类型  | 内存占用（byte） |
| -------- | ---------------- | --------- | ---------------- |
| boolean  | 1                | Boolean   | 4                |
| byte     | 1                | Byte      | 4                |
| short    | 2                | Short     | 4                |
| char     | 2                | Character | 4                |
| int      | 4                | Integer   | 4                |
| float    | 4                | Float     | 4                |
| long     | 8                | Long      | 4                |
| double   | 8                | Double    | 4                |

#### 1.5.2 如何访问一个对象

两种方式：

- **句柄**
- **直接指针**

<img src="https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401131124295.png" alt="image-20240113112403254" style="zoom:50%;" />

<img src="https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202401131124110.png" alt="image-20240113112416070" style="zoom:50%;" />
