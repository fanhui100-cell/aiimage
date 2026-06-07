#!/bin/bash
# Phase 2: 创建服务器目录结构
# 在服务器上运行：bash phase2-setup.sh

set -e

BASE="/opt/ai-automation"

echo "========================================"
echo " Phase 2: 创建项目目录结构"
echo "========================================"

# 创建目录
echo "创建目录..."
mkdir -p $BASE/n8n/data
mkdir -p $BASE/n8n/logs
mkdir -p $BASE/dify
mkdir -p $BASE/backups
mkdir -p $BASE/logs
mkdir -p $BASE/docs
mkdir -p $BASE/demo-flows

# n8n data 目录权限（n8n 容器内用 uid 1000 的 node 用户）
chown -R 1000:1000 $BASE/n8n/data
chown -R 1000:1000 $BASE/n8n/logs
chmod -R 755 $BASE/n8n/data

echo ""
echo "目录结构："
find $BASE -type d | sort

echo ""
echo "✅ 目录创建完成"
echo ""
echo "下一步："
echo "  cd $BASE/n8n"
echo "  cp .env.template .env"
echo "  nano .env   （填写密码和加密 Key）"
echo "  docker compose up -d"
