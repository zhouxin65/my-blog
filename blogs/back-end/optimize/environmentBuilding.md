---
title: 项目性能优化环境搭建
date: 2023-12-20
categories:
- 优化
tags:
- 优化
#sticky: 1
---

# 01-Linux版本JDK安装

[JDK-8u261-linux](https://pan.baidu.com/s/1OXZ5tm0GP-OzYRNQeBVhJA?pwd=cdys) 

```bash
#1. 查看当前Linux系统是否已经安装java
    rpm -qa | grep -i java
    
#2. 解压已上传的JDK压缩包，并移动到/usr/local目录下
   mkdir /usr/local/hero
   tar -zxvf /root/jdk-8u261-linux-x64.tar.gz -C /usr/local/hero

#3. 测试jdk
    /usr/local/hero/jdk1.8.0_261/bin/java -version
    
#4. 配置环境变量
  vim /etc/profile
     G 跳转到最后一行
     i 进入插入模式
     export JAVA_HOME=/usr/local/hero/jdk1.8.0_261
     export PATH=$PATH:$JAVA_HOME/bin
     esc 进入命令行模式
     :wq! 保存
  
#5. 更新环境变量
    source /etc/profile
  
#6. 测试
    java -version
```

# 02-Linux版本JMeter安装

[JMeter-5.4.1](https://pan.baidu.com/s/1czENMn1kpqwS_MsEkjdgUg?pwd=cxmr)

```bash
# 1、下载、安装JMeter
wget -c https://archive.apache.org/dist/jmeter/binaries/apache-jmeter-5.4.1.tgz
# 解压
tar -zxvf apache-jmeter-5.4.1.tgz -C /usr/local/hero
cd /usr/local/hero/apache-jmeter-5.4.1 

# 2、配置环境变量
    输入命令 vim /etc/profile ，在最下面添加如下内容：
        export JMETER_HOME=/usr/local/hero/apache-jmeter-5.4.1
        export PATH=$JMETER_HOME/bin:$PATH
# 3、保存后，输入命令 ,使修改的配置生效。
source /etc/profile 
# 4、测试是否安装成功
jmeter -v
```



# 03-JMeter插件Perfmon-监控服务器硬件资源【选做】

**监控原理：**

![image-20231220200831524](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202312202008649.png)  

**配置服务端代理：**

注意：服务器硬件资源的监控，必须在服务端安装serverAgent代理服务，jmeter才能实现监控服务端的cpu、内存、io的使用情况。

[ServerAgent下载地址](https://github.com/undera/perfmon-agent/blob/master/README.md)

![image-20231220200849322](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202312202008438.png)

```bash
## 默认启动运行 startAgent.sh 脚本即可

## 服务启动默认4444端口，根本连接不上，因此自己创建一个部署脚本文件对此进行部署，且把端口修改为7879
nohup java -jar ./CMDRunner.jar --tool PerfMonAgent --udp-port 7879 --tcp-port 7879 > log.log 2>&1 &

## 赋予可执行权限
chmod 755 startAgent.sh
```

启用7879端口后，服务器的cpu，io，内存使用情况就顺利的监控到了。



# 04-JMeter在Linux中执行压测

**为什么需要非GUI模式运行？**

> Don't use GUI mode for load testing !, only for Test creation and Test debugging.

JMeter是Java语言开发，实际是运行在JVM中的，GUI模式运行需要耗费较多的系统资源，一般来说，GUI模式要占用10%-25%的系统资源。而使用非GUI模式可以降低对资源的消耗，提升单台负载机所能模拟的并发数。

![image-20231220200926924](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202312202009025.png)



**1、启动JMeter，创建脚本**【配置后置监听器，将数据打到InfluxDB】

如何查看压测结果：

1. 可以使用命令行输出结果--类似于聚合报告（RT、TPS..）【不推荐】
2. 导出测试结果下载到本地用GUI界面查看【不推荐】
3. 使用后置监听器，将数据输出到InfluxDB【推荐】

![image-20231220200954300](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202312202009401.png)

脚本保存为**helloworld.jmx**，然后将文件上传至压测服务器。

**2、运行脚本**

上传本地配置好的测试脚本至压测服务器，执行测试命令

```bash
jmeter -n -t [jmx file] -l [results file] -e -o [Path to web report folder]
# 参数说明
-h 帮助：打印出有用的信息并退出
-n 非 GUI 模式：在非 GUI 模式下运行 JMeter
-t 测试文件：要运行的 JMeter 测试脚本文件
-l 日志文件：记录结果的文件
-r 远程执行：启动远程服务
-H 代理主机：设置 JMeter 使用的代理主机
-P 代理端口：设置 JMeter 使用的代理主机的端口号
-e：测试结束后，生成测试报告
-o：指定测试报告的存放位置
```

**(1) 运行压测，记录压测结果**

```bash
jmeter -n -t 01-helloworld.jmx -l 01-helloworld.jtl
```

 运行结果如下图：

![image-20231220201022852](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202312202010984.png)

**(2) 运行压测，生成压测报告**

```bash
jmeter -n -t 01-helloworld.jmx -l 01-helloworld.jtl -e -o ./01-helloworld-report-html
```

 运行结果如下图：



**3、查看测试报告**

![image-20231220201042619](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202312202010723.png)







# 05-JMeter数据库压力测试案例

## 驱动下载

在测试计划中我们要及时的添加JDBC驱动链接。这里我用的mysql数据库是5.7版本，那么我相对应的JDBC驱动选择了5.x版本。JDBC驱动可以在mysql的官网下载，[具体地址](https://dev.mysql.com/downloads/file/?id=477058)

下载驱动界面，不需要登录，直接下载即可：

<img src="https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202312202010287.png" alt="image-20231220201059172" style="zoom: 67%;" /> 

## 测试过程

#### 1) 配置数据库驱动

下载后解压文件夹，把文件夹中的mysql-connector-java-8.0.17.jar  copy到jmeter安装目录的bin文件下（其实不用放在bin目录下，只需要使用jmeter浏览jar所在位置即可）

![image-20231220201143156](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202312202011273.png) 

#### 2) 配置线程组

![image-20231220201158504](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202312202011614.png)

####  3) 配置JDBC 连接池

添加JDBC Connection Configuration（JDBC连接池也有人叫连接组）

<img src="https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202312202012165.png" alt="image-20231220201216041" style="zoom:67%;" /> 

需要设置jdbc线程池名称，这个变量在JDBC Request中要使用的；还有要设置Database URL，格式为：

```sql
jdbc:mysql://localhost:3306/dbname?serverTimezone=UTC&characterEncoding=utf-8
```

> 注意：
>
> - ？后面的serverTimezone=UTC&characterEncoding=utf-8不能缺少，否则会报时区错误。
> - 在配置的时候，jmeter如果报1045-Access denied for user 'root'@'localhost'（using password: YES）这类错误，请重置访问用户的密码，以及给与该用户权限。

![image-20231220201239759](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202312202012884.png) 

重要配置说明

- Variable Name ：数据库连接池的名称

- JDBC Connection Configuration 算是一个数据库连接池配置

- Variable Name：连接池唯一标识，后面JDBC Request需要用到。
- Max Number of Connection： 池中允许的最大连接数，可以设置为20，也可以将其设置为零（0），这意味着没有线程池。
- Max Wait：参数表示从连接池获取连接的超时等待时间，单位毫秒
- Database URL 数据库连接 URL
- JDBC Driver class 数据库驱动
- Username 数据库登录用户名
- Password 数据库登录密码

注意：

- 一个测试计划可以有多个JDBC Connection Configuration配置，只要名称不重复即可。JDBC Connection Configuration其实就是连接池配置。

思考：

1. 是不是连接数越多服务性能越强呢？
2. 从连接池获取连接的等待时间越短效率越高呢？

其他基本保持默认就行，也可根据需要进行修改 ，如下是所有参数详解：

1.**连接池参数配置：**

| 字段                           | 含义                                                         |
| ------------------------------ | ------------------------------------------------------------ |
| Max Number of Connections      | 最大连接数；做性能测试时，可以填 0。在开发的项目中按实际代码填写，默认是20。 |
| Max Wait(ms)                   | 在连接池中取回连接最大等待时间，单位毫秒                     |
| Time Between Eviction Runs(ms) | 运行清除空闲connection的销毁线程间隔时间                     |
| Auto Commit                    | 自动提交sql语句，如：修改数据库时，自动 commit               |
| Transaction isolation          | 事务隔离级别                                                 |
| Preinit Pool                   | 立即初始化连接池如果为 False，则第一个 JDBC 请求的响应时间会较长，因为包含了连接池建立的时间 |

- Transaction Isolation：  事务间隔级别设置，主要有如下几个选项：（对JMX加解密） 
  - TRANSACTION_NODE  事务节点 
  - TRANSACTION_READ_UNCOMMITTED  事务未提交读
  - TRANSACTION_READ_COMMITTED  事务已提交读 
  - TRANSACTION_SERIALIZABLE  事务序列化 
  - DEFAULT  默认
  - TRANSACTION_REPEATABLE_READ 事务重复读、

##### 2.**校验连接池**

| 字段                             | 含义                                                         |
| -------------------------------- | ------------------------------------------------------------ |
| Test While Idle                  | 空闲时测试                                                   |
| Soft Min Evictable Idle Time(ms) | 最小可收回空闲时间(ms)                                       |
| Validation Query                 | 一个简单的查询，用于确定数据库是否仍在响应，默认为jdbc驱动程序的 isValid() 方法，适用于许多数据库 |

##### 3.**配置数据库连接**

| 字段                  | 含义                       |
| --------------------- | -------------------------- |
| Database URL          | 数据库连接 URL             |
| JDBC Driver class     | 数据库驱动                 |
| Username              | 数据库登录用户名           |
| Password              | 数据库登录密码             |
| Connection Properties | 建立连接时要设置的连接属性 |

##### 4.**常见数据库的连接 URL和驱动：**

| 数据库     | 驱动                                         | URL                                                  |
| ---------- | -------------------------------------------- | ---------------------------------------------------- |
| MySQL      | com.mysql.jdbc.Driver                        | jdbc:mysql://host:port/{dbname}                      |
| PostgreSQL | org.postgresql.Driver                        | jdbc:postgresql:{dbname}                             |
| Oracle     | oracle.jdbc.driver.OracleDriver              | jdbc:oracle:thin:user/pass@//host:port/service       |
| sqlServer  | com.microsoft.sqlserver.jdbc.SQLServerDriver | jdbc:sqlserver://host:port;databaseName=databaseName |



#### 4) 添加JDBC 请求

右键点击“连接mysql”，再添加一个采样器：JDBC request，在jmeter中request可以编辑select和insert等不同的采样器类别。即通过不同的类别添加配置我们需要的对mysql不同的操作。比如

![image-20231220201301419](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202312202013543.png) 

```sql
select id from tb_seckill_goods where id=1;
```

![image-20231220201312478](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202312202013586.png)

参数讲解：

1. Variable Name：数据库连接池的名字，需要与JDBC Connection Configuration的Variable Name Bound Pool名字保持一致
2. Query Type：此处支持方式多样，可以用于添加或者筛选数据，根据需要和Query配合使用；
   - select statemen 查询
   - update statement 更新
   - prepared select statement 预处理参数查询
   - prepared update statement 预处理参数更新
3. Query：填写的sql语句未尾可以不加“;”
4. Parameter valus：参数值，顺序替代Query中的?；
   - 此处对应Query中的”?”，有几个”?”则此处要填写几个值，以”,”分隔；
5. Parameter types：参数类型
   - 可参考：Javadoc for java.sql.Types
   - Parameter types则必须和Parameter values一一对应，且类型必须正确；
6. Variable names：保存sql语句返回结果的变量名 ，用于作为参数供调用
7. Result variable name：创建一个对象变量，保存所有返回的结果 ，供调用；
8. Query timeout：查询超时时间
9. Handle result set：定义如何处理由callable statements语句返回的结果。

#### 5) 添加结果监听器

- 聚合报告
- 查看结果树
- 活动线程数Active Threads Over Time
- 每秒事务数TPS
- 平均响应时间RT
- 服务端：内存、网络、CPU、磁盘io、网络io【单位mb】 

<img src="https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202312202013088.png" alt="image-20231220201324971" style="zoom:50%;" />

#### 6) 查看测试结果

![image-20231220201354719](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202312202013827.png)

测试结论：连接数为0，数据库1.5W+的TPS





# 06-Linux版本OpenResty安装

```bash
# openresty 下载地址
http://openresty.org
http://openresty.org/cn/download.html

# 安装依赖环境
yum -y install pcre pcre-devel openssl openssl-devel zlib zlib-devel gcc curl

# 下载openresty,根据最新版本下载即可，版本换为最新版本即可
# https://openresty.org/download/openresty-1.17.8.1.tar.gz
wget https://openresty.org/download/openresty-1.13.6.1.tar.gz

tar -zxvf openresty-1.13.6.1.tar.gz
cd openresty-1.13.6.1
./configure

# 默认会被安装到/usr/local/openresty目录下
# 编译并安装
make && make install
cd /usr/local/openresty

# 启动nginx
/usr/local/openresty/nginx/sbin/nginx -c /usr/local/openresty/nginx/conf/nginx.conf
ps -ef | grep nginx

# 停止nginx
/usr/local/openresty/nginx/sbin/nginx -s stop   #停止服务
	
# 重新加载配置,修改配置后执行
/usr/local/openresty/nginx/sbin/nginx -s reload
```

可以发现，nginx访问成功了，说明openresty已经ok了！！

<img src="https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202312202016423.png" alt="image-20231220201412850" style="zoom:50%;" />

# 07-Docker安装Redis安装

```Bash
# 搜索redis镜像
docker search redis
# 拉取redis镜像
docker pull redis:5.0
# 创建容器，设置端口映射
docker run -id --name=redis -p 6379:6379 redis:5.0
# 配置开启6379端口
# 使用外部机器连接redis，测试
```

```Bash
# Dockerfile 文件实例

# 定义基础镜像
FROM openjdk:8-jdk-alpine
# 定义作者信息
MAINTAINER  xinwang <zhouxin65@foxmail.com>
# 添加jar包文件到镜像中
ADD hero_web.jar hero_web.jar
# 定义当前镜像启动容器时，执行命令
CMD java –jar hero_web.jar
```

# 08-Docker中安装mysql

（1）拉取mysql镜像

```shell
docker pull mysql:5.7
```

（2）创建容器

```shell
docker run --name=mysql -itd -p 3306:3306 -e MYSQL_ROOT_PASSWORD=123456 -d mysql:5.7

docker run -p 3306:3306 --name mysql \
-v /Users/mac/Dev/DockerData/Mysql/Mysq5.7/log:/var/log/mysql \
-v /Users/mac/Dev/DockerData/Mysql/Mysq5.7/data:/var/lib/mysql \
-v /Users/mac/Dev/DockerData/Mysql/Mysq5.7/conf:/etc/mysql/conf.d \
-e MYSQL_ROOT_PASSWORD=123456 \
-d mysql:5.7

docker run -id --name=mysql -p 3306:3306 \
-v /root/mysql/logs:/logs \
-v /root/mysql/data:/var/lib/mysql \
-v /root/mysql/conf:/etc/mysql/conf.d \
-e MYSQL_ROOT_PASSWORD=123456 mysql:5.7

# --name：指定了容器的名称，方便之后进入容器的命令行
# -itd：其中，i是交互式操作，t是一个终端，d指的是在后台运行
# -p：指在本地生成一个随机端口，用来映射mysql的3306端口
# -e：设置环境变量
# MYSQL_ROOT_PASSWORD=root123456：指定了MySQL的root密码
# -d mysql：指运行mysql镜像，设置容器在在后台一直运行

# mysql 8
docker run  --restart=always  --name mysql8 \
-v /Users/mac/Dev/DockerData/Mysql/Mysql8/conf:/etc/mysql/conf.d \
-v /Users/mac/Dev/DockerData/Mysql/Mysql8/data:/var/lib/mysql \
-v /Users/mac/Dev/DockerData/Mysql/Mysql8/og:/var/log \
-v /Users/mac/Dev/DockerData/Mysql/Mysql8/mysql-files:/var/lib/mysql-files \
-p 3306:3306 \
-e MYSQL_ROOT_PASSWORD='123456' \
-d mysql:8.0

# 验证MySQL容器是否创建并运行成功：
docker ps
```

-p 代表端口映射，格式为  宿主机映射端口:容器运行端口

-e 代表添加环境变量  MYSQL_ROOT_PASSWORD  是root用户的登陆密码

（3）设置容器开机自动启动

```shell
docker update --restart=always mysql
```

（4）MySQL开启远程访问权限

```mysql
# 进入 MySQL 容器
docker exec -it mysql /bin/bash

# 进入 MySQL
mysql -uroot -p123456
use mysql;
# 给root用户分配远程访问权限
GRANT ALL PRIVILEGES ON *.* TO root@'%' WITH GRANT OPTION;
# 强制刷新权限
FLUSH PRIVILEGES;
```

  (5) 服务器配置 3306 的开放端口



# 09-压测监控平台

![image-20231220201619928](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202312202016061.png)

 

>  Docker+JMeter+InfluxDB+Grafana+node_exporter

开始时，在阿里云配置四台4C8G按量计费的服务器。注意：用完记得释放资源，免得一直计费！



## 9.1 配置Docker环境

1）yum 包更新到最新

```shell
sudo yum update
```

2）安装需要的软件包， yum-util 提供yum-config-manager功能，另外两个是devicemapper驱动依赖的

```shell
sudo yum install -y yum-utils device-mapper-persistent-data lvm2
```

3）设置yum源为阿里云

配置yum源的代理，类似于maven镜像仓库，加速下载软件。

```shell
sudo yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
```

4）安装docker

```shell
sudo yum install docker-ce -y
# 启动
systemctl start docker
```

5）安装后查看docker版本

```shell
docker -v
```



## 9.2 安装InfluxDB

1）下载InfluxDB的镜像：

```shell
docker pull influxdb:1.8
```

2）启动InfluxDB的容器，并将端口 8083 和 8086 映射出来：

```shell
docker run -d --name influxdb -p 8086:8086 -p 8083:8083 influxdb:1.8
```

3）进入容器内部，创建名为jmeter的数据库：

进入 jmeter-influx 容器

```shell
docker exec -it influxdb /bin/bash
```

- 输入`influx`命令，即可进入 influx 操作界面
- 输入`create database jmeter` 命令，创建名为 jmeter 的数据库
- 输入`show databases` 命令，查看数据库创建成功

```bash
root@517f57017d99:/# influx
Connected to http://localhost:8086 version 1.7.10
InfluxDB shell version: 1.7.10
> create database jmeter
> show databases
```

4）使用JMeter 库， select 查看数据，这个时候是没有数据的：

- 输入`use jmeter`命令，应用刚才创建的数据库
- 输入`select * from jmeter`命令，查询库中有哪些数据

```bash
> use jmeter
> select * from jmeter
```



## 9.3 设置JMeter脚本后置监听器

### 1）配置后置监听器

想要将 JMeter的测试数据导入 InfluxDB ，就需要在 JMeter中使用 Backend Listener 配置

![image-20231220201634910](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202312202016072.png) 



### 2）主要配置说明

 implementation 选择 InfluxDB所对应的：

<img src="https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202312202016035.png" alt="image-20220805215032797" style="zoom:67%;" /> 

- influxdbUrl：需要改为自己influxdb的部署ip和映射端口，我这里是部署在阿里云服务器，所以就是47.93.59.248，口是容器启动时映射的8086端口，db后面跟的是刚才创建的数据库名称
- application：可根据需要自由定义，只是注意后面在 grafana 中选对即可
- measurement：表名，默认是 jmeter ，也可以自定义
- summaryOnly：选择true的话就只有总体的数据。false会记录总体数据，然后再将每个transaction都分别记录
- samplersRegex：样本正则表达式，将匹配的样本发送到数据库
- percentiles：响应时间的百分位P90、P95、P99
- testTitle：events表中的text字段的内容
- eventTags：任务标签，配合Grafana一起使用

> 注意：云服务器配置开启端口8086

```
influxdbMetricsSender	org.apache.jmeter.visualizers.backend.influxdb.HttpMetricsSender
influxdbUrl	http://47.93.59.248:8086/write?db=jmeter
application	hero_mall_one
measurement	jmeter
summaryOnly	false
samplersRegex	RT*
percentiles	90;95;99
testTitle	压力测试案例01
eventTags	
```

### 3）运行验证

运行 Jmeter 脚本，然后再次在 influxdb 中查看数据，发现类似下面的数据说明输入导入成功：

![image-20231216205526680](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202312202016264.png) 

## 9.4 安装Grafana

### 1）下载Grafana镜像：

```bash
docker pull grafana/grafana
```

### 2）启动Grafana容器：

启动Grafana容器，将3000端口映射出来

```shell
docker run -d --name grafana -p 3000:3000 grafana/grafana
```

### 3）验证部署成功

网页端访问[http://119.91.255.154:3000](http://119.91.255.154:3000)验证部署成功

![image-20231216205705773](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202312162057924.png)

默认账户密码：admin\admin

### 4）选择添加数据源

![image-20231216205849231](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202312162058390.png)

### 5）找到并选择 influxdb :

![image-20231216205938944](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202312162059120.png)

### 6）配置数据源

![image-20231216210658426](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202312162106590.png)

数据源创建成功时会有绿色的提示：

![image-20231216210715923](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202312162107086.png)

### 7）导入模板

<img src="https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202312162109427.png" alt="image-20231216210902265" style="zoom:50%;" />

![image-20231216210946719](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202312162109882.png) 

模板导入分别有以下3种方式：

- 直接输入模板id号
- 直接上传模板json文件
- 直接输入模板json内容

![image-20231216211113124](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202312162111309.png)

### 8）找展示模板

在 [Grafana](https://grafana.com/grafana/dashboards/?plcmt=footer&src=grafana_footer) 的官网找到我们需要的展示模板

- Apache JMeter Dashboard
  - dashboad-ID：5496
- JMeter Dashboard(3.2 and up)
  - dashboad-ID：3351

### 9）导入找到的模板，使用模板id

导入模板，我这里选择输入模板id号，导入后如下，配置好模板名称和对应的数据源，然后 import 即可

![image-20231216212724626](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202312162127786.png)

### 10）查看效果

展示设置，首先选择创建的application

![image-20231216213334114](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202312162133291.png)

**注意：** 如果我们修改过表名，也就是在jmeter的Backend Listener的measurement配置(默认为jmeter)，这个时候就需要去设置中进行修改，我这里使用的就是默认的，所以无需修改。



## 9.5 安装node_exporter

```bash
# 下载
wget -c https://github.com/prometheus/node_exporter/releases/download/v0.18.1/node_exporter-0.18.1.linux-amd64.tar.gz
# 解压
tar zxvf node_exporter-0.18.1.linux-amd64.tar.gz -C /usr/local/hero/
# 启动
cd /usr/local/hero/node_exporter-0.18.1.linux-amd64
nohup ./node_exporter > node.log 2>&1 &
```

**注意：在被监控服务器中配置开启端口9100**

[http://101.200.87.86:9100/metrics](http://101.200.87.86:9100/metrics)

![image-20220805231705970](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202312202034842.png)



## 9.6 安装Prometheus

###  1）下载解压运行

```bash
# 下载
wget -c https://github.com/prometheus/prometheus/releases/download/v2.15.1/prometheus-2.15.1.linux-amd64.tar.gz
# 解压
mkdir /usr/local/hero/
tar zxvf prometheus-2.15.1.linux-amd64.tar.gz -C /usr/local/hero/
cd /usr/local/hero/prometheus-2.15.1.linux-amd64
# 运行
nohup ./prometheus > prometheus.log 2>&1 &
```

### 2）配置prometheus

在prometheus.yml中加入如下配置：

```java
  - job_name: 'hero-Linux'
    static_configs:
    - targets: ['172.17.187.78:9100','172.17.187.79:9100','172.17.187.81:9100']
```

### 3）测试Prometheus

测试Prometheus是否安装配置成功

[http://175.178.242.5:9090/targets](http://175.178.242.5:9090/targets)

![image-20231217132927108](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202312171329303.png)

### 3）在Grafana中配置Prometheus的数据源:

![image-20231217133001674](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202312171330852.png)

![image-20231217133050367](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202312171330538.png)

### 4）Grafana导入Linux展示模板

导入Linux系统dashboard

- Node Exporter for Prometheus Dashboard EN 20201010
  - dashboard-ID: 11074
- Node Exporter Dashboard
  - dashboard-ID: 16098

![image-20231217133238782](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202312171332950.png)

![image-20220806121042249](https://xinwang-1258200068.cos.ap-guangzhou.myqcloud.com/imgs/202312202017930.png)

