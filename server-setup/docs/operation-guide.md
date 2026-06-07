# 运维操作手册

## n8n 基本操作

```bash
# 启动
cd /opt/ai-automation/n8n
docker compose up -d

# 停止
docker compose down

# 重启
docker compose restart n8n

# 查看状态
docker compose ps

# 查看实时日志
docker compose logs -f n8n

# 查看最近 100 行日志
docker compose logs --tail=100 n8n
```

## 更新 n8n

```bash
cd /opt/ai-automation/n8n
docker compose pull
docker compose up -d
```

## 备份数据

```bash
# 手动备份
tar -czf /opt/ai-automation/backups/n8n-$(date +%Y%m%d).tar.gz \
  /opt/ai-automation/n8n/data

# 查看备份
ls -lh /opt/ai-automation/backups/
```

## 恢复数据

```bash
# 停止服务
cd /opt/ai-automation/n8n
docker compose down

# 恢复
tar -xzf /opt/ai-automation/backups/n8n-YYYYMMDD.tar.gz -C /

# 重启
docker compose up -d
```

## 更新 API Key

```bash
# 编辑 .env
cd /opt/ai-automation/n8n
nano .env

# 重启生效
docker compose restart n8n
```

n8n 内部的 Credentials（DeepSeek、Claude 等 API Key）在 n8n 界面里设置：
Settings → Credentials → 新建 → HTTP Header Auth 或对应类型

## 常见错误处理

**n8n 启动失败：**
```bash
docker compose logs n8n | tail -50
# 检查 .env 文件格式是否正确
# 检查 data 目录权限：ls -la /opt/ai-automation/n8n/data
```

**端口被占用：**
```bash
sudo ss -tulpn | grep 5678
# 找到占用进程后 kill 掉，或修改 .env 里的端口
```

**数据目录权限问题：**
```bash
chown -R 1000:1000 /opt/ai-automation/n8n/data
chown -R 1000:1000 /opt/ai-automation/n8n/logs
```

**Webhook 收不到请求：**
1. 检查阿里云安全组是否开放 5678 端口
2. 检查 .env 里 WEBHOOK_URL 是否填写正确

## 服务器资源监控

```bash
# 内存使用
free -h

# 硬盘使用
df -h

# Docker 容器资源占用
docker stats --no-stream

# n8n 进程
docker compose ps
```

## 端口说明

| 端口 | 服务 | 说明 |
|------|------|------|
| 5678 | n8n | 主界面，测试期间开放，上线后关闭改用 Nginx |
| 80 | Nginx | HTTP |
| 443 | Nginx | HTTPS（后续配置） |
